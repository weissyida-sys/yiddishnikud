import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import PizZip from 'npm:pizzip@3.1.7';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { originalDocData, paragraphs, fileName } = body;

        if (!originalDocData || !paragraphs) {
            return Response.json({ error: 'Missing required data' }, { status: 400 });
        }

        // Reconstruct the original DOCX from the array buffer
        const arrayBuffer = new Uint8Array(originalDocData.zip).buffer;
        const zip = new PizZip(arrayBuffer);
        
        // Extract document.xml
        let docXml = zip.file("word/document.xml").asText();
        
        // Replace text in each paragraph while preserving formatting
        // Process in reverse order to maintain string indices
        const sortedParagraphs = [...paragraphs].sort((a, b) => b.startIndex - a.startIndex);
        
        for (const para of sortedParagraphs) {
            // Replace the paragraph's text content while keeping XML structure
            const updatedParaXml = replaceTextInParagraph(para.fullXml, para.nikudText);
            
            // Replace in the full XML
            docXml = docXml.substring(0, para.startIndex) + 
                     updatedParaXml + 
                     docXml.substring(para.startIndex + para.fullXml.length);
        }
        
        // Update the zip with new content
        zip.file("word/document.xml", docXml);
        
        // Generate new DOCX
        const newDocx = zip.generate({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        
        return new Response(newDocx, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${fileName.replace('.docx', '')}.nikud.docx"`
            }
        });

    } catch (error) {
        console.error('Error in buildNikudDocx:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});

function replaceTextInParagraph(paragraphXml, newText) {
    // Find all text runs and replace content while keeping formatting
    const textRegex = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/g;
    let hasReplaced = false;
    
    const result = paragraphXml.replace(textRegex, (match, openTag, oldText, closeTag) => {
        if (!hasReplaced && /[\u0590-\u05FF]/.test(oldText)) {
            // Replace first text run with new text
            hasReplaced = true;
            return openTag + newText + closeTag;
        } else if (hasReplaced && /[\u0590-\u05FF]/.test(oldText)) {
            // Remove subsequent Hebrew text runs (already combined in first)
            return '';
        }
        return match;
    });
    
    return result;
}
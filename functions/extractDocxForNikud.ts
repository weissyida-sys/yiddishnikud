import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import PizZip from 'npm:pizzip@3.1.7';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return Response.json({ error: 'File is required' }, { status: 400 });
        }

        // Read the DOCX file
        const arrayBuffer = await file.arrayBuffer();
        const zip = new PizZip(arrayBuffer);
        
        // Extract document.xml
        const docXml = zip.file("word/document.xml").asText();
        
        // Extract paragraphs with their text and position
        const paragraphs = extractParagraphs(docXml);
        
        // Save original DOCX to temporary storage
        const docId = crypto.randomUUID();
        const originalDocData = {
            zip: Array.from(new Uint8Array(arrayBuffer)),
            fileName: file.name,
            timestamp: Date.now()
        };
        
        // Store in a temporary way (we'll use this ID to retrieve it later)
        // For now, we'll return it back to frontend to send back later
        
        return Response.json({
            success: true,
            docId: docId,
            fileName: file.name,
            paragraphs: paragraphs,
            originalDocData: originalDocData // Frontend will send this back
        });

    } catch (error) {
        console.error('Error in extractDocxForNikud:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});

function extractParagraphs(xml) {
    const paragraphs = [];
    
    // Match each paragraph
    const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
    let pMatch;
    let pIndex = 0;
    
    while ((pMatch = paragraphRegex.exec(xml)) !== null) {
        const paragraphXml = pMatch[1];
        
        // Extract all text runs from this paragraph
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let textContent = '';
        let tMatch;
        
        while ((tMatch = textRegex.exec(paragraphXml)) !== null) {
            textContent += tMatch[1];
        }
        
        // Only include paragraphs with Hebrew/Yiddish text
        if (/[\u0590-\u05FF]/.test(textContent)) {
            paragraphs.push({
                id: pIndex,
                text: textContent,
                fullXml: pMatch[0], // Store the entire paragraph XML for reconstruction
                startIndex: pMatch.index
            });
            pIndex++;
        }
    }
    
    return paragraphs;
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import PizZip from 'npm:pizzip@3.1.7';
import OpenAI from 'npm:openai@4.73.1';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

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

        console.log('Reading DOCX file...');
        const arrayBuffer = await file.arrayBuffer();
        const zip = new PizZip(arrayBuffer);
        
        // Extract document.xml
        let docXml = zip.file("word/document.xml").asText();
        
        console.log('Extracting paragraphs...');
        const paragraphs = extractParagraphs(docXml);
        console.log(`Found ${paragraphs.length} paragraphs with Hebrew text`);
        
        // Process each paragraph with nikud
        console.log('Processing paragraphs with AI...');
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            console.log(`Processing paragraph ${i + 1}/${paragraphs.length}`);
            
            const response = await openai.chat.completions.create({
                model: FINE_TUNED_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are a Yiddish nikud engine. Add vowel points (nikud) to the given Yiddish text. Return ONLY the text with nikud added, nothing else."
                    },
                    { role: "user", content: para.text }
                ],
                temperature: 0.1,
                max_tokens: 4096,
            });
            
            para.nikudText = response.choices[0].message.content;
        }
        
        console.log('Rebuilding DOCX with nikud...');
        // Replace text in each paragraph (process in reverse order)
        const sortedParagraphs = [...paragraphs].sort((a, b) => b.startIndex - a.startIndex);
        
        for (const para of sortedParagraphs) {
            const updatedParaXml = replaceTextInParagraph(para.fullXml, para.nikudText);
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
        
        console.log('DOCX processing complete!');
        return new Response(newDocx, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${file.name.replace('.docx', '')}.nikud.docx"`
            }
        });

    } catch (error) {
        console.error('Error in processEntireDocx:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});

function extractParagraphs(xml) {
    const paragraphs = [];
    const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
    let pMatch;
    let pIndex = 0;
    
    while ((pMatch = paragraphRegex.exec(xml)) !== null) {
        const paragraphXml = pMatch[1];
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let textContent = '';
        let tMatch;
        
        while ((tMatch = textRegex.exec(paragraphXml)) !== null) {
            textContent += tMatch[1];
        }
        
        if (/[\u0590-\u05FF]/.test(textContent)) {
            paragraphs.push({
                id: pIndex,
                text: textContent,
                fullXml: pMatch[0],
                startIndex: pMatch.index
            });
            pIndex++;
        }
    }
    
    return paragraphs;
}

function replaceTextInParagraph(paragraphXml, newText) {
    const textRegex = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/g;
    let hasReplaced = false;
    
    const result = paragraphXml.replace(textRegex, (match, openTag, oldText, closeTag) => {
        if (!hasReplaced && /[\u0590-\u05FF]/.test(oldText)) {
            hasReplaced = true;
            return openTag + newText + closeTag;
        } else if (hasReplaced && /[\u0590-\u05FF]/.test(oldText)) {
            return '';
        }
        return match;
    });
    
    return result;
}
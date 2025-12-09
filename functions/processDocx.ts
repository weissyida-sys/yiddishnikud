import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai@4.73.1';
import PizZip from 'npm:pizzip@3.1.7';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

async function processTextWithNikud(text) {
    const response = await openai.chat.completions.create({
        model: FINE_TUNED_MODEL,
        messages: [{ role: "user", content: text }],
        temperature: 0.1,
    });
    return response.choices[0].message.content;
}

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
        
        // Process text while preserving XML structure
        // Match all text content within <w:t> tags
        const processedXml = await processDocxXml(docXml);
        
        // Update the zip with new content
        zip.file("word/document.xml", processedXml);
        
        // Generate new DOCX
        const newDocx = zip.generate({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        
        return new Response(newDocx, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${file.name.replace('.docx', '')}.nikud.docx"`
            }
        });

    } catch (error) {
        console.error('Error in processDocx:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});

async function processDocxXml(xml) {
    // Extract all text runs and process them
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const matches = [];
    let match;
    
    while ((match = textRegex.exec(xml)) !== null) {
        matches.push({
            fullMatch: match[0],
            text: match[1],
            index: match.index
        });
    }
    
    // Process all Hebrew text
    let processedXml = xml;
    for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        if (/[\u0590-\u05FF]/.test(m.text)) {
            const nikudText = await processTextWithNikud(m.text);
            const newTag = m.fullMatch.replace(m.text, nikudText);
            processedXml = processedXml.substring(0, m.index) + newTag + processedXml.substring(m.index + m.fullMatch.length);
        }
    }
    
    return processedXml;
}
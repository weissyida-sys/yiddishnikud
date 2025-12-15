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

        const body = await req.json();
        const { fileBase64, fileName } = body;

        if (!fileBase64 || !fileName) {
            return Response.json({ error: 'fileBase64 and fileName are required' }, { status: 400 });
        }

        // Decode base64 to binary
        const binaryString = atob(fileBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Load the DOCX
        const zip = new PizZip(bytes);
        let docXml = zip.file("word/document.xml").asText();

        // Extract paragraphs with Hebrew text
        const paragraphs = extractParagraphs(docXml);

        // Process each paragraph with OpenAI
        for (const para of paragraphs) {
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

        // Rebuild the document XML
        const sortedParagraphs = [...paragraphs].sort((a, b) => b.startIndex - a.startIndex);
        
        for (const para of sortedParagraphs) {
            const updatedParaXml = replaceTextInParagraph(para.fullXml, para.nikudText);
            docXml = docXml.substring(0, para.startIndex) + 
                     updatedParaXml + 
                     docXml.substring(para.startIndex + para.fullXml.length);
        }

        // Update the zip with new content
        zip.file("word/document.xml", docXml);

        // Generate new DOCX as base64
        const newDocxBuffer = zip.generate({
            type: "uint8array",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });

        // Convert to base64
        let binary = '';
        for (let i = 0; i < newDocxBuffer.length; i++) {
            binary += String.fromCharCode(newDocxBuffer[i]);
        }
        const newFileBase64 = btoa(binary);

        return Response.json({
            success: true,
            fileBase64: newFileBase64,
            fileName: fileName.replace('.docx', '.nikud.docx')
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
    // Find all text runs
    const textRegex = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/g;
    const runs = [];
    let match;
    
    while ((match = textRegex.exec(paragraphXml)) !== null) {
        runs.push({
            fullMatch: match[0],
            openTag: match[1],
            text: match[2],
            closeTag: match[3],
            index: match.index
        });
    }
    
    // Filter Hebrew runs
    const hebrewRuns = runs.filter(run => /[\u0590-\u05FF]/.test(run.text));
    
    if (hebrewRuns.length === 0) {
        return paragraphXml;
    }
    
    // Replace first Hebrew run with all nikud text, keep others as-is
    let result = paragraphXml;
    let replaced = false;
    
    for (const run of runs.reverse()) {
        if (/[\u0590-\u05FF]/.test(run.text)) {
            if (!replaced) {
                // First Hebrew run gets the nikud text
                const newRun = run.openTag + newText + run.closeTag;
                result = result.substring(0, run.index) + newRun + result.substring(run.index + run.fullMatch.length);
                replaced = true;
            }
            // Keep other Hebrew runs as-is (don't delete them)
        }
    }
    
    return result;
}
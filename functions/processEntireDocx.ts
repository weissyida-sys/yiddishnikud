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

        // Extract all text runs with Hebrew text
        const runs = extractTextRuns(docXml);
        console.log(`Found ${runs.length} Hebrew text runs to process`);

        // Process each run individually with OpenAI
        for (let i = 0; i < runs.length; i++) {
            const run = runs[i];
            console.log(`Processing run ${i + 1}/${runs.length}, text: "${run.text.substring(0, 100)}"`);
            
            try {
                const response = await openai.chat.completions.create({
                    model: FINE_TUNED_MODEL,
                    messages: [
                        { role: "user", content: run.text }
                    ],
                    temperature: 0,
                    max_tokens: 16000,
                    timeout: 120000,
                });

                const nikudText = response.choices[0].message.content.trim();
                
                // Count nikud marks
                const nikudMarks = (nikudText.match(/[\u05B0-\u05BC\u05C1-\u05C2]/g) || []).length;
                console.log(`OpenAI response (first 200 chars): "${nikudText.substring(0, 200)}"`);
                console.log(`Nikud marks found: ${nikudMarks}`);
                
                if (nikudMarks === 0) {
                    console.warn(`Warning: No nikud marks in response for run ${i + 1}`);
                }
                
                run.nikudText = nikudText;
                console.log(`✓ Completed run ${i + 1}/${runs.length}`);
                
            } catch (error) {
                console.error(`Error processing run ${i + 1}:`, error.message);
                run.nikudText = run.text;
            }
        }
        
        console.log('All runs processed');

        // Replace text in each run (from end to start to preserve indices)
        const sortedRuns = [...runs].sort((a, b) => b.startIndex - a.startIndex);
        
        for (const run of sortedRuns) {
            docXml = docXml.substring(0, run.startIndex) + 
                     run.nikudText + 
                     docXml.substring(run.startIndex + run.text.length);
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
        console.error('Error stack:', error.stack);
        return Response.json({ 
            error: error.message || 'Unknown error occurred',
            errorDetails: error.stack,
            success: false 
        }, { status: 500 });
    }
});

function extractTextRuns(xml) {
    const runs = [];
    const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    
    while ((match = textRegex.exec(xml)) !== null) {
        const text = match[1];
        
        // Only process runs with Hebrew/Yiddish characters
        if (/[\u0590-\u05FF]/.test(text)) {
            runs.push({
                text: text,
                startIndex: match.index + match[0].indexOf(text),
                fullMatch: match[0]
            });
        }
    }
    
    return runs;
}
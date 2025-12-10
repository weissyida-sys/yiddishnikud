import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
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

        const { text } = await req.json();

        if (!text || typeof text !== 'string') {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }

        // Call OpenAI fine-tuned model directly
        const response = await openai.chat.completions.create({
            model: FINE_TUNED_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a Yiddish nikud engine. Add vowel points (nikud) to the given Yiddish text. Return ONLY the text with nikud added, nothing else. Do not explain, translate, or add any other text."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.1,
            max_tokens: 4096,
        });

        const nikudText = response.choices[0].message.content;

        return Response.json({
            text: nikudText,
            audit: [],
            success: true
        });

    } catch (error) {
        console.error('Error in processNikud:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});
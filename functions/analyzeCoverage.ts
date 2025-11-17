import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const FLASK_SERVER_URL = Deno.env.get("FLASK_SERVER_URL") || "http://localhost:5055";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { text, lm_weight, confidence } = await req.json();

        if (!text || typeof text !== 'string') {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }

        // Call your Flask /debug-coverage endpoint
        const response = await fetch(`${FLASK_SERVER_URL}/debug-coverage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                lm_weight: lm_weight || 0.52,
                confidence: confidence || 0.50
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Flask server error: ${errorText}`);
        }

        const data = await response.json();

        return Response.json({
            totalWords: data.total_tokens,
            withNikud: data.with_niqqud,
            percentage: data.percent_with_niqqud,
            success: true
        });

    } catch (error) {
        console.error('Error in analyzeCoverage:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});
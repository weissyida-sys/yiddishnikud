import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Your Flask server URL - change this to your deployed URL or keep as localhost for development
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

        // Call your Flask /nikud endpoint
        const response = await fetch(`${FLASK_SERVER_URL}/nikud`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paragraphs: [text],
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
            text: data.paragraphs?.[0] || text,
            audit: data.audit?.[0] || [],
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
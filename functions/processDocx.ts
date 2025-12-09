import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const FLASK_SERVER_URL = Deno.env.get("FLASK_SERVER_URL") || "http://localhost:5055";

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

        // Forward to Flask server
        const flaskFormData = new FormData();
        flaskFormData.append('file', file);

        const response = await fetch(`${FLASK_SERVER_URL}/nikud-docx`, {
            method: 'POST',
            body: flaskFormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Flask server error: ${errorText}`);
        }

        // Return the processed DOCX file
        const blob = await response.blob();
        
        return new Response(blob, {
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

        console.log('File received:', file.name, file.size);

        return Response.json({
            success: true,
            message: 'File uploaded successfully',
            fileName: file.name,
            fileSize: file.size
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});
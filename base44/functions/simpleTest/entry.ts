Deno.serve(async (req) => {
    console.log('simpleTest function called');
    
    return Response.json({
        success: true,
        message: 'Function is working!'
    });
});
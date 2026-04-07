import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";

const FLASK = Deno.env.get("FLASK_SERVER_URL");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fileBase64, fileName } = body;
    if (!fileBase64 || !fileName) return Response.json({ success: false, error: "fileBase64 and fileName required" }, { status: 400 });

    // Decode base64 → file
    const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    const file = new File([bytes], fileName, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Send to Flask — one call, formatting preserved
    const form = new FormData();
    form.append("file", file);

    const resp = await fetch(`${FLASK}/nikud-docx`, { method: "POST", body: form });
    if (!resp.ok) throw new Error(`Flask error: ${await resp.text()}`);

    // Convert response back to base64
    const outBytes = new Uint8Array(await resp.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < outBytes.length; i += chunk)
      binary += String.fromCharCode(...outBytes.subarray(i, i + chunk));

    return Response.json({
      success: true,
      fileBase64: btoa(binary),
      fileName: fileName.replace(/\.docx$/i, ".nikud.docx"),
    });
  } catch (err) {
    console.error("processEntireDocx error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
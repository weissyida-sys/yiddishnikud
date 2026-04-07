import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";

const FLASK = Deno.env.get("FLASK_SERVER_URL");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const text = body?.text;
    if (!text?.trim()) return Response.json({ success: false, error: "text required" }, { status: 400 });

    const resp = await fetch(`${FLASK}/nikud`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await resp.json();

    return Response.json({
      success: true,
      text: data.text,
      flagged: data.flagged || [],
      stats: data.stats || {},
      needs_review: (data.flagged || []).length > 0,
    });
  } catch (err) {
    console.error("processNikud error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
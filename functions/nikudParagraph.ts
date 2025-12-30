import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";
import OpenAI from "npm:openai@4.73.1";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
const FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const text = body && body.text;

    if (typeof text !== "string") {
      return Response.json({ success: false, error: "text is required" }, { status: 400 });
    }

    // If no Hebrew, return as-is
    if (!/[\u0590-\u05FF]/.test(text)) {
      return Response.json({ success: true, nikudText: text });
    }

    const resp = await openai.chat.completions.create({
      model: FINE_TUNED_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a strict Yiddish nikud engine. Return the SAME text, only adding nikud. Do not translate, explain, or change punctuation/spacing.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 2048,
    });

    const out = (resp.choices?.[0]?.message?.content ?? text);

    return Response.json({ success: true, nikudText: out });
  } catch (error) {
    console.error("nikudParagraph error:", error);
    return Response.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
});
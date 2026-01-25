import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";
import OpenAI from "npm:openai@4.73.1";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });
const FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

// Remove all nikud marks for comparison
const stripNikud = (text) => {
  return text.replace(/[\u05B0-\u05BC\u05C1-\u05C2]/g, '');
};

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
            "You are a strict Yiddish nikud engine. Return the SAME text, only adding nikud. If not 100% certain, leave the word unchanged; never guess. Do not translate, explain, or change punctuation/spacing.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 2048,
    });

    const out = (resp.choices?.[0]?.message?.content ?? text);

    // Post-processing guard: reject if base letters changed
    if (stripNikud(out) !== stripNikud(text)) {
      console.warn("OpenAI changed base letters, returning original text");
      return Response.json({ success: true, nikudText: text });
    }

    return Response.json({ success: true, nikudText: out });
  } catch (error) {
    console.error("nikudParagraph error:", error);
    return Response.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
});
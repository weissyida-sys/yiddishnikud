import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";

const FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

const HEB_RE = /[\u0590-\u05FF]/;
const NIKUD_RE = /[\u05B0-\u05BC\u05C1-\u05C2\u05C7]/g;

function stripNikud(s) {
  return (s ?? "").replace(NIKUD_RE, "");
}

function norm(s) {
  return (s ?? "").normalize("NFC");
}

async function callOpenAI(text) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY secret in Base44");

  const system =
    "You are a STRICT Yiddish/Hebrew nikud engine.\n" +
    "Return the SAME text with nikud added.\n" +
    "Do NOT translate or explain.\n" +
    "Do NOT add/remove words.\n" +
    "ONLY add nikud marks.\n" +
    "If not 100% certain, leave the word unchanged. Never guess.\n" +
    "Return ONLY the final text.";

  const payload = {
    model: FINE_TUNED_MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: text },
    ],
    max_tokens: 4096,
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) {
    const msg = data?.error?.message || `OpenAI error HTTP ${r.status}`;
    throw new Error(msg);
  }

  const out = data?.choices?.[0]?.message?.content;
  return typeof out === "string" ? out : "";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text : "";

    if (!text.trim()) {
      return Response.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    if (!HEB_RE.test(text)) {
      return Response.json({ success: true, text, audit: [] });
    }

    const input = norm(text);
    const outputRaw = await callOpenAI(input);
    const output = norm(outputRaw);

    if (!output) {
      return Response.json({
        success: true,
        text: input,
        audit: [{ error: "empty_model_output_returned_original" }],
      });
    }

    // base-letter guard
    if (stripNikud(output) !== stripNikud(input)) {
      return Response.json({
        success: true,
        text: input,
        audit: [{ error: "base_letters_changed_rejected" }],
      });
    }

    return Response.json({
      success: true,
      text: output,
      audit: [{ changed: output !== input }],
    });
  } catch (e) {
    console.error("processNikud error:", e);
    return Response.json({ success: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
});
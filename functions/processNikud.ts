import OpenAI from "npm:openai@4.73.1";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

// Remove nikud + cantillation, keep base letters
function stripNikud(text) {
  return (text || "").replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, "");
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const text = body?.text;

    if (typeof text !== "string" || !text.trim()) {
      return Response.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    // Fast path: no Hebrew
    if (!/[\u0590-\u05FF]/.test(text)) {
      return Response.json({
        success: true,
        text,
        audit: [{ reason: "no_hebrew" }],
      });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a strict Yiddish nikud engine.\n" +
            "- You may ONLY add nikud (vowel points).\n" +
            "- NEVER change letters.\n" +
            "- If unsure, leave the word unchanged.\n" +
            "- Return ONLY the text.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 4096,
    });

    const out = completion.choices[0].message.content?.trim();

    if (!out) {
      return Response.json({
        success: true,
        text,
        audit: [{ reason: "empty_output" }],
      });
    }

    // Guard: base letters must match
    if (stripNikud(out) !== stripNikud(text)) {
      return Response.json({
        success: true,
        text,
        audit: [{ reason: "guard_base_letters_changed" }],
      });
    }

    return Response.json({
      success: true,
      text: out,
      audit: [{ reason: "openai_finetune" }],
    });
  } catch (err) {
    console.error("processNikud error", err);
    return Response.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
});
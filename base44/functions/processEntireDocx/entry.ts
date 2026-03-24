import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";
import PizZip from "npm:pizzip@3.1.7";
import OpenAI from "npm:openai@4.73.1";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal::CkdDGC5F";

// Nikud marks (nikkud + shin/sin dots)
const NIKUD_RE = /[\u05B0-\u05BC\u05C1-\u05C2]/g;
const HEB_RE = /[\u0590-\u05FF]/;

function xmlUnescape(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function openaiNikud(text) {
  // IMPORTANT: do not trim; preserve whitespace exactly
  const resp = await openai.chat.completions.create({
    model: FINE_TUNED_MODEL,
    temperature: 0,
    messages: [{ role: "user", content: text }],
    // Keep this reasonable; huge values slow/unstable
    max_tokens: 2048,
  });

  return (resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || text;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const fileBase64 = body && body.fileBase64;
    const fileName = body && body.fileName;

    if (!fileBase64 || !fileName) {
      return Response.json({ error: "fileBase64 and fileName are required" }, { status: 400 });
    }

    // Decode base64 to bytes (safe for binary)
    const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

    const zip = new PizZip(bytes);

    const docPath = "word/document.xml";
    const file = zip.file(docPath);
    if (!file) {
      return Response.json({ error: "document.xml not found in DOCX" }, { status: 400 });
    }

    let docXml = file.asText();

    // Replace all <w:t ...>TEXT</w:t> with safe async processing
    // Two-pass:
    // 1) Collect matches with placeholders
    // 2) Process only Hebrew matches
    // 3) Rebuild XML via join (no index math)
    const re = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;

    const parts = [];
    const items = [];

    let lastIndex = 0;
    let m;

    while ((m = re.exec(docXml)) !== null) {
      const fullStart = m.index;
      const fullEnd = re.lastIndex;

      // push preceding chunk
      parts.push(docXml.slice(lastIndex, fullStart));

      const attrs = m[1] || "";
      const rawInner = m[2] || "";

      // Convert entities to real text before sending to OpenAI
      const text = xmlUnescape(rawInner);
      const needs = HEB_RE.test(text);

      const idx = items.length;
      items.push({ attrs, raw: rawInner, text, needs });

      // placeholder token
      parts.push(`__W_T_PLACEHOLDER_${idx}__`);

      lastIndex = fullEnd;
    }

    // push remainder
    parts.push(docXml.slice(lastIndex));

    const hebCount = items.filter((x) => x.needs).length;
    console.log(`Found ${items.length} total w:t nodes, Hebrew nodes: ${hebCount}`);

    // Process Hebrew nodes
    for (let i = 0; i < items.length; i++) {
      if (!items[i].needs) continue;

      const orig = items[i].text;
      console.log(`OpenAI: node ${i + 1}/${items.length}, chars=${orig.length}`);

      try {
        const nikud = await openaiNikud(orig);

        const nikudMarks = (nikud.match(NIKUD_RE) || []).length;
        console.log(` -> nikud marks: ${nikudMarks}`);

        const finalText = nikud && nikud.length ? nikud : orig;

        // Escape back for XML
        items[i].raw = xmlEscape(finalText);
      } catch (e) {
        console.error(`OpenAI error on node ${i + 1}:`, e && e.message ? e.message : e);
        items[i].raw = xmlEscape(orig);
      }
    }

    // Rebuild XML by replacing placeholders
    let rebuilt = parts.join("");

    for (let i = 0; i < items.length; i++) {
      // Ensure xml:space preserve if text has leading/trailing spaces
      let attrs = items[i].attrs || "";
      const txt = xmlUnescape(items[i].raw);
      const hasEdgeSpace = /^\s/.test(txt) || /\s$/.test(txt);

      if (hasEdgeSpace && !/xml:space\s*=\s*["']preserve["']/.test(attrs)) {
        attrs = `${attrs} xml:space="preserve"`;
      }

      const node = `<w:t${attrs}>${items[i].raw}</w:t>`;
      rebuilt = rebuilt.replace(`__W_T_PLACEHOLDER_${i}__`, node);
    }

    zip.file(docPath, rebuilt);

    const out = zip.generate({
      type: "uint8array",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Convert bytes -> base64 (chunked to avoid call stack limits on large docs)
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < out.length; i += chunkSize) {
      binary += String.fromCharCode(...out.subarray(i, i + chunkSize));
    }
    const outBase64 = btoa(binary);

    return Response.json({
      success: true,
      fileBase64: outBase64,
      fileName: fileName.replace(/\.docx$/i, ".nikud.docx"),
    });
  } catch (error) {
    console.error("Error in processEntireDocx:", error);
    return Response.json(
      { success: false, error: (error && error.message) || "Unknown error", errorDetails: error && error.stack },
      { status: 500 },
    );
  }
});

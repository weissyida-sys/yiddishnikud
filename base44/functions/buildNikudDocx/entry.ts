import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";
import PizZip from "npm:pizzip@3.1.7";

function xmlEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function uint8ToBase64(u8) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const fileUri = body && body.fileUri;
    const fileName = body && body.fileName;
    const paragraphs = body && body.paragraphs;

    if (!fileUri || !fileName || !Array.isArray(paragraphs)) {
      return Response.json({ success: false, error: "fileUri, fileName, paragraphs are required" }, { status: 400 });
    }

    const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 600,
    });

    const res = await fetch(signed.signed_url);
    if (!res.ok) throw new Error(`Failed to download original docx: ${res.status}`);

    const buf = await res.arrayBuffer();
    const zip = new PizZip(buf);

    const docPath = "word/document.xml";
    const docFile = zip.file(docPath);
    if (!docFile) return Response.json({ success: false, error: "word/document.xml not found" }, { status: 400 });

    let docXml = docFile.asText();

    // Replace paragraphs from end to start using stored startIndex/fullXml
    const sorted = [...paragraphs].sort((a, b) => b.startIndex - a.startIndex);

    for (const p of sorted) {
      const fullXml = p.fullXml;
      const runs = p.runs || [];

      // Replace each <w:t ...>...</w:t> in this paragraph in order
      let runIdx = 0;
      const updated = fullXml.replace(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g, (m, attrs, inner) => {
        if (runIdx >= runs.length) return m;
        const r = runs[runIdx];
        runIdx++;

        // Use original attrs from XML to preserve xml:space, etc.
        // But ensure preserve if leading/trailing whitespace exists after nikud
        let newAttrs = attrs || "";
        const outText = (r && typeof r.nikudText === "string") ? r.nikudText : (r?.text ?? "");
        const escaped = xmlEscape(outText);

        const needsPreserve = /^\s/.test(outText) || /\s$/.test(outText);
        if (needsPreserve && !/xml:space\s*=\s*["']preserve["']/.test(newAttrs)) {
          newAttrs = `${newAttrs} xml:space="preserve"`;
        }

        return `<w:t${newAttrs}>${escaped}</w:t>`;
      });

      // splice into full document XML using original indices
      docXml =
        docXml.substring(0, p.startIndex) +
        updated +
        docXml.substring(p.startIndex + fullXml.length);
    }

    zip.file(docPath, docXml);

    const outU8 = zip.generate({
      type: "uint8array",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return Response.json({
      success: true,
      fileName: fileName.replace(/\.docx$/i, ".nikud.docx"),
      fileBase64: uint8ToBase64(outU8),
    });
  } catch (error) {
    console.error("buildNikudDocx error:", error);
    return Response.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
});
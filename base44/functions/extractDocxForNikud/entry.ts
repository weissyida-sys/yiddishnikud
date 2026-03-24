import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";
import PizZip from "npm:pizzip@3.1.7";

const HEB_RE = /[\u0590-\u05FF]/;

function xmlUnescape(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function base64ToUint8(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const fileBase64 = body && body.fileBase64;
    const fileName = body && body.fileName;

    if (!fileBase64 || !fileName) {
      return Response.json({ success: false, error: "fileBase64 and fileName are required" }, { status: 400 });
    }

    const bytes = base64ToUint8(fileBase64);

    // Upload original to storage (so we can rebuild later)
    const fileToUpload = new File([bytes], fileName, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const upload = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
      file: fileToUpload,
    });

    const zip = new PizZip(bytes);
    const docFile = zip.file("word/document.xml");
    if (!docFile) {
      return Response.json({ success: false, error: "word/document.xml not found" }, { status: 400 });
    }

    const docXml = docFile.asText();

    // Extract each paragraph (<w:p>...</w:p>) and inside it, each text node <w:t ...>...</w:t>
    // We return paragraphs that contain ANY Hebrew and include their runs in-order.
    const paragraphs = [];
    const pRe = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;

    let pMatch;
    let pid = 0;

    while ((pMatch = pRe.exec(docXml)) !== null) {
      const fullXml = pMatch[0];
      const startIndex = pMatch.index;

      // Collect runs in this paragraph
      const runs = [];
      const tRe = /<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g;

      let tMatch;
      let hasHeb = false;
      let rid = 0;

      while ((tMatch = tRe.exec(fullXml)) !== null) {
        const attrs = tMatch[1] || "";
        const rawInner = tMatch[2] || "";
        const text = xmlUnescape(rawInner);

        const isHeb = HEB_RE.test(text);
        if (isHeb) hasHeb = true;

        runs.push({
          runId: rid,
          attrs,
          text,      // unescaped, what we will send to OpenAI
          isHeb,
        });
        rid++;
      }

      if (hasHeb) {
        paragraphs.push({
          id: pid,
          startIndex,
          fullXml,
          runs,
        });
        pid++;
      }
    }

    return Response.json({
      success: true,
      fileName,
      fileUri: upload.file_uri,
      paragraphs,
    });
  } catch (error) {
    console.error("extractDocxForNikud error:", error);
    return Response.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
});
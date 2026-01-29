import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function TextNikudPanel() {
  const [inputHtml, setInputHtml] = useState("");
  const [outputHtml, setOutputHtml] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [coverage, setCoverage] = useState(null);
  const inputRef = useRef(null);

  const handlePaste = (e) => {
    e.preventDefault();

    const html =
      e.clipboardData.getData("text/html") ||
      e.clipboardData.getData("text/plain") ||
      "";

    // If plain text, preserve newlines
    const isPlain = !e.clipboardData.getData("text/html");
    const normalized = isPlain
      ? html
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\r\n|\r|\n/g, "<br>")
      : html;

    setInputHtml(normalized);
    if (inputRef.current) inputRef.current.innerHTML = normalized;
  };

  const handleInput = (e) => {
    setInputHtml(e.target.innerHTML || "");
  };

  const processNikud = async () => {
    if (!inputHtml.trim()) {
      toast.error("Please enter text");
      return;
    }

    setIsProcessing(true);
    setCoverage(null);
    setOutputHtml("");

    try {
      const temp = document.createElement("div");
      temp.innerHTML = inputHtml;

      // Walk all text nodes (keeps layout / tags exactly)
      const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT);
      const hebrewTextNodes = [];
      let node;

      while ((node = walker.nextNode())) {
        const v = node.nodeValue || "";
        if (/[\u0590-\u05FF]/.test(v)) {
          hebrewTextNodes.push(node);
        }
      }

      if (hebrewTextNodes.length === 0) {
        toast.error("No Hebrew/Yiddish text found");
        return;
      }

      let totalNodes = hebrewTextNodes.length;
      let nodesChanged = 0;

      // Process each Hebrew text node, one-by-one
      for (let i = 0; i < hebrewTextNodes.length; i++) {
        const textNode = hebrewTextNodes[i];
        const originalText = textNode.nodeValue || "";

        // Skip empty nodes
        if (!originalText.trim()) continue;

        const result = await base44.functions.invoke("processNikud", {
          text: originalText,
        });

        const ok = result?.data?.success === true;
        const out = result?.data?.text;

        // HARD FRONTEND GUARD:
        // If backend returns anything unexpected, keep original text.
        if (ok && typeof out === "string" && out.length > 0) {
          textNode.nodeValue = out;
          if (out !== originalText) nodesChanged++;
        } else {
          console.error("Bad processNikud response:", result?.data);
          textNode.nodeValue = originalText;
        }
      }

      setOutputHtml(temp.innerHTML);

      // Coverage is now “node-based” (simple + reliable)
      setCoverage({
        percent: ((nodesChanged / Math.max(totalNodes, 1)) * 100).toFixed(1),
        total: totalNodes,
        withNikud: nodesChanged,
      });

      toast.success("Nikud added successfully!");
    } catch (error) {
      console.error("Error in processNikud:", error);
      toast.error("Error: " + (error?.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!outputHtml) {
      toast.error("No output to copy");
      return;
    }

    const blob = new Blob([outputHtml], { type: "text/html" });
    const clipboardItem = new ClipboardItem({ "text/html": blob });

    navigator.clipboard
      .write([clipboardItem])
      .then(() => toast.success("Copied with formatting!"))
      .catch(() => {
        const temp = document.createElement("div");
        temp.innerHTML = outputHtml;
        navigator.clipboard.writeText(temp.textContent || "");
        toast.success("Copied as plain text!");
      });
  };

  const downloadAsText = () => {
    if (!outputHtml) {
      toast.error("No text to download");
      return;
    }

    const blob = new Blob([outputHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nikud_text.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Downloaded!");
  };

  const clearAll = () => {
    setInputHtml("");
    setOutputHtml("");
    setCoverage(null);
    if (inputRef.current) inputRef.current.innerHTML = "";
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Input Text (Rich Format)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Paste formatted text — bold, italics, lists, and paragraphs will be preserved
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={inputRef}
            contentEditable
            onPaste={handlePaste}
            onInput={handleInput}
            className="border-2 border-indigo-200 rounded-lg p-4 bg-white min-h-[300px] focus:outline-none focus:border-indigo-400 text-lg"
            style={{ direction: "rtl" }}
            dangerouslySetInnerHTML={
              inputHtml
                ? undefined
                : { __html: '<span style="color: #9ca3af;">Paste your Yiddish text here (formatting will be preserved)...</span>' }
            }
          />

          <div className="flex gap-3">
            <Button
              onClick={processNikud}
              disabled={isProcessing || !inputHtml.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Add Nikud
                </>
              )}
            </Button>

            <Button onClick={clearAll} variant="outline" className="border-2 border-gray-300">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Result (Formatting Preserved)
            </span>

            {outputHtml && (
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="ghost" size="sm" className="text-purple-600">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button onClick={downloadAsText} variant="ghost" size="sm" className="text-green-600">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            className="min-h-[300px] p-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 text-lg font-serif overflow-auto"
            dir="rtl"
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: outputHtml || '<span style="color: #9ca3af;">Text with nikud will appear here...</span>',
            }}
          />

          {coverage && (
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Coverage (nodes changed):</span>
                    <Badge className="bg-purple-600 text-white text-lg px-3 py-1">
                      {coverage.percent}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Hebrew nodes:</span>
                      <span className="font-medium">{coverage.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nodes changed:</span>
                      <span className="font-medium">{coverage.withNikud}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
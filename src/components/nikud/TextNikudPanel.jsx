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
    const html = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    setInputHtml(html);
    if (inputRef.current) {
      inputRef.current.innerHTML = html;
    }
  };

  const handleInput = (e) => {
    setInputHtml(e.target.innerHTML);
  };

  // Convert HTML to plain text, preserving line breaks
  const htmlToPlainText = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    
    // Replace block elements with newlines
    temp.querySelectorAll("p, div, br").forEach(el => {
      if (el.tagName === "BR") {
        el.replaceWith("\n");
      } else {
        const text = el.textContent;
        el.replaceWith(text + "\n");
      }
    });
    
    temp.querySelectorAll("li").forEach(li => {
      const text = li.textContent;
      li.replaceWith("• " + text + "\n");
    });
    
    return temp.textContent || "";
  };

  // Replace text in HTML while preserving all structure
  const replaceTextInHtml = (html, nikudText) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    
    // Get all text nodes
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const trimmed = node.textContent.trim();
      if (trimmed && /[\u0590-\u05FF]/.test(trimmed)) {
        textNodes.push(node);
      }
    }
    
    // Build plain text to match what was sent to OpenAI
    let plainText = "";
    for (const node of textNodes) {
      plainText += node.textContent;
    }
    
    // Replace text nodes with nikud version
    let nikudIndex = 0;
    for (const node of textNodes) {
      const originalText = node.textContent;
      let newText = "";
      
      for (let i = 0; i < originalText.length; i++) {
        if (nikudIndex < nikudText.length) {
          newText += nikudText[nikudIndex];
          nikudIndex++;
        } else {
          newText += originalText[i];
        }
      }
      
      node.textContent = newText;
    }
    
    return temp.innerHTML;
  };

  const processNikud = async () => {
    const plainText = htmlToPlainText(inputHtml);
    
    if (!plainText.trim()) {
      toast.error("Please enter text");
      return;
    }

    setIsProcessing(true);
    console.log('Starting nikud processing...', { plainText: plainText.substring(0, 100) });
    
    try {
      console.log('Calling processNikud function...');
      const result = await base44.functions.invoke('processNikud', {
        text: plainText
      });

      console.log('Function result:', result);

      if (result.data.success) {
        const nikudText = result.data.text;
        
        // Re-insert nikud text into HTML structure
        const resultHtml = replaceTextInHtml(inputHtml, nikudText);
        setOutputHtml(resultHtml);
        
        // Calculate basic coverage from audit data if available
        if (result.data.audit && result.data.audit.length > 0) {
          const total = result.data.audit.length;
          const withNikud = result.data.audit.filter(a => a.chosen !== a.orig).length;
          setCoverage({ 
            percent: ((withNikud / total) * 100).toFixed(1), 
            total, 
            withNikud 
          });
        }
        
        toast.success("Nikud added successfully!");
      } else {
        throw new Error(result.data.error || "Processing failed");
      }
    } catch (error) {
      console.error('Error in processNikud:', error);
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!outputHtml) {
      toast.error("No output to copy");
      return;
    }
    
    // Try to copy as HTML first
    const blob = new Blob([outputHtml], { type: "text/html" });
    const clipboardItem = new ClipboardItem({ "text/html": blob });
    
    navigator.clipboard.write([clipboardItem])
      .then(() => toast.success("Copied with formatting!"))
      .catch(() => {
        // Fallback to plain text
        const plainText = htmlToPlainText(outputHtml);
        navigator.clipboard.writeText(plainText);
        toast.success("Copied as plain text!");
      });
  };

  const downloadAsText = () => {
    if (!outputHtml) {
      toast.error("No text to download");
      return;
    }

    const blob = new Blob([outputHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nikud_text.html';
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
            Paste formatted text - bold, italics, lists, and paragraphs will be preserved
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
            dangerouslySetInnerHTML={inputHtml ? undefined : { __html: '<span style="color: #9ca3af;">Paste your Yiddish text here (formatting will be preserved)...</span>' }}
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
            <Button
              onClick={clearAll}
              variant="outline"
              className="border-2 border-gray-300"
            >
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
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  onClick={downloadAsText}
                  variant="ghost"
                  size="sm"
                  className="text-green-600"
                >
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
            dangerouslySetInnerHTML={{ 
              __html: outputHtml || '<span style="color: #9ca3af;">Text with nikud will appear here...</span>' 
            }}
          />

          {coverage && (
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Coverage Percentage:</span>
                    <Badge className="bg-purple-600 text-white text-lg px-3 py-1">
                      {coverage.percent}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Words:</span>
                      <span className="font-medium">{coverage.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>With Nikud:</span>
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
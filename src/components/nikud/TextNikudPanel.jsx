import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";

export default function TextNikudPanel({ config }) {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [coverage, setCoverage] = useState(null);

  const processNikud = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter text");
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Replace with actual backend function call when enabled
      // Example:
      // const result = await base44.functions.processNikud({
      //   text: inputText,
      //   lm_weight: config.lmWeight,
      //   confidence: config.confidence
      // });
      
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response - in reality this would call your Python API
      const mockOutput = inputText + " [Nikud added]";
      setOutputText(mockOutput);
      setCoverage({ percent: 87.5, total: 120, withNikud: 105 });
      
      toast.success("Nikud added successfully!");
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      toast.success("Copied to clipboard!");
    }
  };

  const downloadAsText = () => {
    if (!outputText) {
      toast.error("No text to download");
      return;
    }

    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nikud_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Downloaded!");
  };

  const clearAll = () => {
    setInputText("");
    setOutputText("");
    setCoverage(null);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Input Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter Yiddish text without nikud here..."
            className="min-h-[300px] text-lg font-serif border-2 border-indigo-200 focus:border-indigo-400"
            dir="rtl"
          />
          
          <div className="flex gap-3">
            <Button
              onClick={processNikud}
              disabled={isProcessing || !inputText.trim()}
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

          {inputText && (
            <div className="text-sm text-gray-600">
              <Badge variant="secondary">
                {inputText.length} characters
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Result
            </span>
            {outputText && (
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
          <div className="min-h-[300px] p-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 text-lg font-serif whitespace-pre-wrap" dir="rtl">
            {outputText || (
              <span className="text-gray-400">
                Text with nikud will appear here...
              </span>
            )}
          </div>

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
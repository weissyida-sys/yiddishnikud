import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function DocxUploadPanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [processedFileBlob, setProcessedFileBlob] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Please select a .docx file");
      return;
    }
    setSelectedFile(file);
    setProcessedFileBlob(null);
    setProgress(0);
    setStatusMessage("");
    toast.success("Selected: " + file.name);
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const base64ToBlob = (b64) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  const processDocx = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsProcessing(true);
    setProgress(3);
    setStatusMessage("Reading file...");

    try {
      const fileBase64 = await fileToBase64(selectedFile);

      setProgress(8);
      setStatusMessage("Extracting DOCX structure...");

      const extractRes = await base44.functions.invoke("extractDocxForNikud", {
        fileBase64,
        fileName: selectedFile.name,
      });

      if (!extractRes?.data?.success) {
        throw new Error(extractRes?.data?.error || "extractDocxForNikud failed");
      }

      const { paragraphs, fileUri, fileName } = extractRes.data;

      // Count total Hebrew runs
      let totalHebRuns = 0;
      for (const p of paragraphs) {
        for (const r of p.runs || []) {
          if (r.isHeb) totalHebRuns++;
        }
      }
      if (totalHebRuns === 0) {
        toast.info("No Hebrew text found in document.");
        setIsProcessing(false);
        return;
      }

      setProgress(12);
      setStatusMessage(`Adding nikud to ${totalHebRuns} runs (preserving fonts)...`);

      let done = 0;

      // Process each Hebrew run individually (slow but preserves formatting best)
      for (const p of paragraphs) {
        for (const r of p.runs || []) {
          if (!r.isHeb) continue;

          const nikRes = await base44.functions.invoke("nikudParagraph", { text: r.text });

          if (nikRes?.data?.success && typeof nikRes.data.nikudText === "string") {
            r.nikudText = nikRes.data.nikudText;
          } else {
            r.nikudText = r.text; // fallback
          }

          done++;
          const pct = 12 + Math.floor((done / totalHebRuns) * 75);
          setProgress(Math.min(87, pct));
          if (done % 5 === 0) {
            setStatusMessage(`Processing... (${done}/${totalHebRuns})`);
          }
        }
      }

      setProgress(90);
      setStatusMessage("Rebuilding DOCX (preserving formatting)...");

      const buildRes = await base44.functions.invoke("buildNikudDocx", {
        fileUri,
        fileName,
        paragraphs,
      });

      if (!buildRes?.data?.success) {
        throw new Error(buildRes?.data?.error || "buildNikudDocx failed");
      }

      const outBlob = base64ToBlob(buildRes.data.fileBase64);
      setProcessedFileBlob(outBlob);

      setProgress(100);
      setStatusMessage("Done.");
      toast.success("Document processed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Processing failed: " + (err?.message || String(err)), { duration: 15000 });
      setProgress(0);
      setStatusMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!processedFileBlob || !selectedFile) {
      toast.error("No file to download");
      return;
    }
    const url = URL.createObjectURL(processedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.name.replace(/\.docx$/i, ".nikud.docx");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProcessedFileBlob(null);
    setProgress(0);
    setStatusMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6 text-indigo-600" />
            Process Word Document
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Upload a .docx file and receive it back with nikud automatically added (fonts preserved)
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className="border-4 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-indigo-50/30"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedFile ? selectedFile.name : "Click to Upload File"}
            </h3>
            <p className="text-sm text-gray-500">.docx format only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-indigo-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button
                    onClick={clearFile}
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{statusMessage || "Processing..."}</span>
                <span className="font-medium text-indigo-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-gray-500 text-center">
                Large documents can take time because we preserve formatting by processing each run.
              </p>
            </div>
          )}

          {processedFileBlob && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">File Ready to Download!</p>
                    <p className="text-sm text-green-700">
                      {selectedFile.name.replace(/\.docx$/i, ".nikud.docx")}
                    </p>
                  </div>
                </div>
                <Button onClick={downloadFile} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Download className="w-5 h-5 mr-2" />
                  Download File with Nikud
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={processDocx}
            disabled={!selectedFile || isProcessing}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Process Word Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
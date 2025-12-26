import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function DocxUploadPanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFileBlob, setProcessedFileBlob] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast.error("Please select a .docx file");
        return;
      }
      setSelectedFile(file);
      setProcessedFileBlob(null);
      toast.success("File uploaded: " + file.name);
    }
  };

  const processDocx = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    toast.info("Processing document...");
    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Reading file...');

    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setProgress(20);
      setStatusMessage('Uploading document...');

      console.log('Calling processEntireDocx...');
      
      // Set a longer timeout for large documents
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Processing timeout - document may be too large. Try splitting it into smaller sections.')), 1200000) // 20 minutes
      );

      setProgress(30);
      setStatusMessage('Processing paragraphs with AI (this may take a few minutes)...');

      const result = await Promise.race([
        base44.functions.invoke('processEntireDocx', {
          fileBase64: fileBase64,
          fileName: selectedFile.name
        }),
        timeoutPromise
      ]);

      setProgress(80);
      setStatusMessage('Finalizing document...');

      console.log('Processing complete:', result.data);

      // Convert base64 back to blob
      const binaryString = atob(result.data.fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      setProcessedFileBlob(blob);
      setProgress(100);
      toast.success("Document processed successfully!");

    } catch (error) {
      console.error('Processing error:', error);
      toast.error("Processing failed: " + error.message, { duration: 15000 });
      setProgress(0);
      setStatusMessage('');

    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!processedFileBlob) {
      toast.error("No file to download");
      return;
    }

    const url = URL.createObjectURL(processedFileBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name.replace('.docx', '.nikud.docx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Downloaded!");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProcessedFileBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            Upload a .docx file and receive it back with nikud automatically added
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className="border-4 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-indigo-50/30"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedFile ? selectedFile.name : "Click to Upload File"}
            </h3>
            <p className="text-sm text-gray-500">
              .docx format only
            </p>
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
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
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
                <span className="text-gray-600">{statusMessage || 'Processing...'}</span>
                <span className="font-medium text-indigo-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-gray-500 text-center">
                ⏱️ Large documents may take up to 20 minutes to process
              </p>
            </div>
          )}

          {processedFileBlob && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">
                      File Ready to Download!
                    </p>
                    <p className="text-sm text-green-700">
                      {selectedFile.name.replace('.docx', '.nikud.docx')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={downloadFile}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download File with Nikud
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={processDocx}
              disabled={!selectedFile || isProcessing}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
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
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-2">💡 How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Upload your Word (.docx) file</li>
              <li>The system will process each paragraph</li>
              <li>Nikud will be added automatically</li>
              <li>Download the new file with nikud</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
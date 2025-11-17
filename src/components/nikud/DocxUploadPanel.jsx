import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export default function DocxUploadPanel({ config }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFile, setProcessedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast.error("ביטע קלײַב אַ .docx טעקע");
        return;
      }
      setSelectedFile(file);
      setProcessedFile(null);
      toast.success("טעקע אַרויפֿגעלאָדעט: " + file.name);
    }
  };

  const processDocx = async () => {
    if (!selectedFile) {
      toast.error("ביטע קלײַב אַ טעקע");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // TODO: Replace with actual backend function call when enabled
      // Simulate processing with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Mock processed file
      setProcessedFile({
        name: selectedFile.name.replace('.docx', '.nikud.docx'),
        size: selectedFile.size,
        timestamp: new Date().toISOString()
      });

      toast.success("טעקע פּראָצעסירט!");
    } catch (error) {
      toast.error("טעות: " + error.message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadFile = () => {
    // TODO: Implement actual download when backend is connected
    toast.info("אַראָפּלאָדן פֿונקציע וועט זײַן פֿאַרבונדן שפּעטער");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProcessedFile(null);
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
            Word טעקע פּראָצעסירן
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            לאָד אַרויף אַ .docx טעקע און באַקום צוריק די זעלבע טעקע מיט צוגעלייגטן ניקוד
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
              {selectedFile ? selectedFile.name : "קליק צו אַרויפֿלאָדן טעקע"}
            </h3>
            <p className="text-sm text-gray-500">
              .docx פֿאָרמאַט בלויז
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
                <span className="text-gray-600">פּראָצעסירן...</span>
                <span className="font-medium text-indigo-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          {processedFile && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">
                      טעקע גרייט צו אַראָפּלאָדן!
                    </p>
                    <p className="text-sm text-green-700">
                      {processedFile.name}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={downloadFile}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-5 h-5 ml-2" />
                  אַראָפּלאָדן טעקע
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
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  אַרבעטן...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 ml-2" />
                  פּראָצעסירן Word טעקע
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-2">💡 ווי עס אַרבעט:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>לאָד אַרויף דײַן Word (.docx) טעקע</li>
              <li>דער סיסטעם וועט פּראָצעסירן יעדער פּאַראַגראַף</li>
              <li>ניקוד וועט ווערן צוגעלייגט אויטאָמאַטיש</li>
              <li>לאָד אַראָפּ די נײַע טעקע מיט ניקוד</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TextNikudPanel from "../components/nikud/TextNikudPanel";
import DocxUploadPanel from "../components/nikud/DocxUploadPanel";

export default function NikudProcessor() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Yiddish Nikud Engine
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            AI-powered vowel pointing system using OpenAI fine-tuned models
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              🤖 AI-Powered
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              ⚡ Fast Processing
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              📄 Word Documents
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto h-auto">
            <TabsTrigger value="text" className="flex items-center gap-2 py-3">
              <FileText className="w-5 h-5" />
              <span>Text Input</span>
            </TabsTrigger>
            <TabsTrigger value="docx" className="flex items-center gap-2 py-3">
              <Upload className="w-5 h-5" />
              <span>DOCX Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-6">
            <TextNikudPanel />
          </TabsContent>

          <TabsContent value="docx" className="mt-6">
            <DocxUploadPanel />
          </TabsContent>
        </Tabs>

        {/* Info Note */}
        <Alert className="max-w-4xl mx-auto bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm">
            💡 <strong>How it works:</strong> This system uses a fine-tuned OpenAI GPT-4o-mini model trained specifically on Yiddish text with nikud. 
            Simply paste your text or upload a Word document, and the AI will add the vowel points automatically.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
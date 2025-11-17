import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, Settings, BarChart3, AlertCircle } from "lucide-react";
import TextNikudPanel from "../components/nikud/TextNikudPanel";
import DocxUploadPanel from "../components/nikud/DocxUploadPanel";
import ConfigurationPanel from "../components/nikud/ConfigurationPanel";
import CoverageStats from "../components/nikud/CoverageStats";

export default function NikudProcessor() {
  const [config, setConfig] = useState({
    lmWeight: 0.52,
    confidence: 0.50,
    noPartialNikud: true,
    forbidFinalR: true
  });

  const [activeTab, setActiveTab] = useState("text");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            Yiddish Nikud Engine
          </h1>
          <p className="text-lg text-gray-600">
            Automatic Nikud System for Yiddish Text
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Coverage: 85-90% • Conservative Mode • Advanced NLP
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="docx" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Word File</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Configuration</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <TextNikudPanel config={config} />
          </TabsContent>

          <TabsContent value="docx">
            <DocxUploadPanel config={config} />
          </TabsContent>

          <TabsContent value="stats">
            <CoverageStats config={config} />
          </TabsContent>

          <TabsContent value="config">
            <ConfigurationPanel config={config} setConfig={setConfig} />
          </TabsContent>
        </Tabs>

        {/* Info Footer */}
        <div className="mt-8 text-center">
          <Alert className="bg-white/80 backdrop-blur-sm border-indigo-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm text-gray-600">
              <strong>Note:</strong> This system uses deep learning models and context analysis to automatically add nikud.
              <br />
              For higher accuracy, configure the parameters in the Configuration tab.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
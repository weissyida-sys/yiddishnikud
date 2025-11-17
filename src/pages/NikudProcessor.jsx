import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Settings, BarChart3, Download, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            ייִדיש ניקוד מאַשין
          </h1>
          <p className="text-lg text-gray-600">
            אויטאָמאַטישער ניקוד־סיסטעם פֿאַר ייִדיש טעקסט
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Yiddish Auto-Nikud Engine • Coverage: 85-90%
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">טעקסט</span>
            </TabsTrigger>
            <TabsTrigger value="docx" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Word טעקע</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">סטאַטיסטיק</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">קאָנפֿיגוראַציע</span>
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
              <strong>הערה:</strong> דער סיסטעם ניצט אַ טיף־לערנונג מאָדעל און קאָנטעקסט־אַנאַליז צו צולייגן ניקוד אויטאָמאַטיש.
              <br />
              פֿאַר העכערע גענויִקייט, קען מען קאָנפֿיגורירן די פּאַראַמעטערס אין די "קאָנפֿיגוראַציע" טאַב.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
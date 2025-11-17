import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CoverageStats({ config }) {
  const [testText, setTestText] = useState("");
  const [stats, setStats] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCoverage = async () => {
    if (!testText.trim()) {
      toast.error("ביטע לייג אַרײַן טעקסט צו אַנאַליזירן");
      return;
    }

    setIsAnalyzing(true);
    try {
      // TODO: Replace with actual backend function call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock statistics
      const mockStats = {
        totalWords: 150,
        withNikud: 128,
        percentage: 85.3,
        byCategory: {
          "פֿונקציע־ווערטער": { total: 45, processed: 43, percent: 95.6 },
          "נאָמען": { total: 35, processed: 28, percent: 80.0 },
          "ווערבן": { total: 40, processed: 32, percent: 80.0 },
          "אַדיעקטיוון": { total: 30, processed: 25, percent: 83.3 }
        },
        confidence: {
          high: 95,    // >0.8
          medium: 25,  // 0.5-0.8
          low: 8       // <0.5
        }
      };

      setStats(mockStats);
      toast.success("אַנאַליז פֿאַרענדיקט!");
    } catch (error) {
      toast.error("טעות: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Analysis Input */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            כּיסוי אַנאַליז
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            טעסט די גענויִקייט און כּיסוי פֿון דײַן ניקוד סיסטעם
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="לייג אַרײַן אַ לאַנגן טעקסט צו טעסטן די כּיסוי..."
            className="min-h-[150px] text-lg font-serif border-2 border-indigo-200"
            dir="rtl"
          />
          <Button
            onClick={analyzecoverage}
            disabled={isAnalyzing || !testText.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                אַנאַליזירן...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5 ml-2" />
                אַנאַליזירן כּיסוי
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Display */}
      {stats && (
        <>
          {/* Overall Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0">
                    גאַנץ
                  </Badge>
                </div>
                <div className="text-4xl font-bold mb-1">{stats.totalWords}</div>
                <div className="text-sm opacity-90">גאַנצע ווערטער</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0">
                    מיט ניקוד
                  </Badge>
                </div>
                <div className="text-4xl font-bold mb-1">{stats.withNikud}</div>
                <div className="text-sm opacity-90">ווערטער פּראָצעסירט</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0">
                    כּיסוי
                  </Badge>
                </div>
                <div className="text-4xl font-bold mb-1">{stats.percentage}%</div>
                <div className="text-sm opacity-90">כּיסוי פּראָצענט</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl">כּיסוי לויט קאַטעגאָריע</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.byCategory).map(([category, data]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {data.processed} / {data.total}
                      </span>
                      <Badge className={
                        data.percent >= 90 ? "bg-green-600" :
                        data.percent >= 75 ? "bg-yellow-600" :
                        "bg-red-600"
                      }>
                        {data.percent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={data.percent} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Confidence Distribution */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
            <CardHeader>
              <CardTitle className="text-xl">פֿאַרטיילונג פֿון זיכערקייט</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">הויך ({">"} 0.8)</span>
                      <span className="text-sm text-gray-600">{stats.confidence.high} ווערטער</span>
                    </div>
                    <Progress 
                      value={(stats.confidence.high / stats.withNikud) * 100} 
                      className="h-3 [&>div]:bg-green-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">מיטל (0.5-0.8)</span>
                      <span className="text-sm text-gray-600">{stats.confidence.medium} ווערטער</span>
                    </div>
                    <Progress 
                      value={(stats.confidence.medium / stats.withNikud) * 100}
                      className="h-3 [&>div]:bg-yellow-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">נידעריק ({"<"} 0.5)</span>
                      <span className="text-sm text-gray-600">{stats.confidence.low} ווערטער</span>
                    </div>
                    <Progress 
                      value={(stats.confidence.low / stats.withNikud) * 100}
                      className="h-3 [&>div]:bg-red-600"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-900">
                💡 רעקאָמענדאַציעס
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-yellow-900">
              {stats.percentage < 80 && (
                <p>• די כּיסוי איז נידעריק. פּרוּוו פֿאַרקלענערן די "זיכערקייט־שוועל" אין קאָנפֿיגוראַציע.</p>
              )}
              {stats.confidence.low > 10 && (
                <p>• פֿיל ווערטער האָבן נידעריקע זיכערקייט. פֿאַרגרעסער דײַן לעקסיקאָן אָדער טריינירונג־דאַטן.</p>
              )}
              {stats.percentage >= 90 && (
                <p>• ✓ זייער גוטע כּיסוי! דער סיסטעם אַרבעט אויסגעצייכנט.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
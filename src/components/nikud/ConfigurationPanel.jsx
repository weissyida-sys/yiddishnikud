import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Settings, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

export default function ConfigurationPanel({ config, setConfig }) {
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setConfig({
      lmWeight: 0.52,
      confidence: 0.50,
      noPartialNikud: true,
      forbidFinalR: true
    });
    toast.success("Configuration reset to defaults");
  };

  const saveConfig = () => {
    // TODO: Save to backend or localStorage
    localStorage.setItem('nikudConfig', JSON.stringify(config));
    toast.success("Configuration saved");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Settings className="w-6 h-6 text-indigo-600" />
            Configuration
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Adjust parameters for higher accuracy
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Language Model Weight */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                Language Model Weight
              </Label>
              <span className="text-sm font-mono bg-indigo-100 px-3 py-1 rounded">
                {config.lmWeight.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[config.lmWeight]}
              onValueChange={(v) => updateConfig('lmWeight', v[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-gray-600">
              How much weight to give the language model in decisions. Higher = more context awareness
            </p>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                Confidence Threshold
              </Label>
              <span className="text-sm font-mono bg-purple-100 px-3 py-1 rounded">
                {config.confidence.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[config.confidence]}
              onValueChange={(v) => updateConfig('confidence', v[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <p className="text-xs text-gray-600">
              Minimum confidence to add nikud. Higher = more conservative (less nikud, but more accurate)
            </p>
          </div>

          {/* Switches */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">
                  Prevent Partial Nikud
                </Label>
                <p className="text-xs text-gray-600">
                  Don't add nikud to only some letters in a word
                </p>
              </div>
              <Switch
                checked={config.noPartialNikud}
                onCheckedChange={(v) => updateConfig('noPartialNikud', v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">
                  Forbid Nikud on Final R
                </Label>
                <p className="text-xs text-gray-600">
                  Don't add nikud under the final ר in ־ער suffix
                </p>
              </div>
              <Switch
                checked={config.forbidFinalR}
                onCheckedChange={(v) => updateConfig('forbidFinalR', v)}
              />
            </div>
          </div>

          {/* Advanced Settings Preview */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-indigo-900">
                Current Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">lm_weight:</span>
                    <span className="font-semibold">{config.lmWeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">confidence:</span>
                    <span className="font-semibold">{config.confidence}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">no_partial:</span>
                    <span className="font-semibold">{config.noPartialNikud ? "true" : "false"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">forbid_r:</span>
                    <span className="font-semibold">{config.forbidFinalR ? "true" : "false"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={saveConfig}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="border-2"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
            <p className="font-medium mb-2">💡 Tip:</p>
            <p>
              If coverage is too low (not enough nikud), try decreasing the "Confidence Threshold".
              If there are too many errors, increase the "Confidence Threshold" for more accuracy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
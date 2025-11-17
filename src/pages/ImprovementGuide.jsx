import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Code, 
  Database, 
  TrendingUp, 
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Rocket
} from "lucide-react";

export default function ImprovementGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            How to Improve Your Nikud Engine
          </h1>
          <p className="text-lg text-gray-600">
            Step-by-step guide to achieve 95%+ accuracy
          </p>
        </div>

        {/* Current Status */}
        <Alert className="bg-white/80 backdrop-blur-sm border-yellow-300">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-base">
            <strong>Current Status:</strong> Your engine is at ~50% coverage. Goal: 95% accuracy.
            <br />
            This requires algorithm improvements, not just UI changes.
          </AlertDescription>
        </Alert>

        {/* Step 1: Connect Backend */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Rocket className="w-6 h-6 text-indigo-600" />
              Step 1: Enable Backend Functions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              First, you need to connect your Python script to this web interface.
            </p>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="font-semibold mb-2">How to enable:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Base44 Dashboard → Settings</li>
                <li>Enable "Backend Functions"</li>
                <li>Deploy your Python Flask app as a backend function</li>
                <li>Update the code with your API endpoint URL</li>
              </ol>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="text-gray-400">// In TextNikudPanel.js, replace the TODO with:</div>
              <div className="mt-2">
                const result = await base44.functions.processNikud({"{"}
                <div className="ml-4">
                  text: inputText,<br/>
                  lm_weight: config.lmWeight,<br/>
                  confidence: config.confidence
                </div>
                {"}"});
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Improve Algorithm */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Code className="w-6 h-6 text-purple-600" />
              Step 2: Optimize Your Python Algorithm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-900">
                <strong>Important:</strong> This step requires a Python NLP expert. The web UI cannot fix algorithm accuracy.
              </AlertDescription>
            </Alert>

            <p className="text-gray-700">
              To go from 50% → 95% accuracy, you need to improve your Python script:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Retrain Your Models</p>
                  <p className="text-sm text-gray-600">Use your 500+ page corpus to retrain context_left.json, context_right.json, and lm3.json</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Expand Lexicon</p>
                  <p className="text-sm text-gray-600">Add more entries to lexicon_from_tbl.json and custom_lexicon.json with accurate priors</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Tune Confidence Thresholds</p>
                  <p className="text-sm text-gray-600">Experiment with MIN_SCORE_MARGIN, MIN_POSTERIOR, and other Config values</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Improve Viterbi Algorithm</p>
                  <p className="text-sm text-gray-600">Add better backoff strategies and smoothing techniques</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Train with Data */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="w-6 h-6 text-green-600" />
              Step 3: Use Your Training Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              You mentioned having 500+ pages of training data. Here's how to use it:
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold mb-3">Training Process:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Extract word frequencies:</strong> Count how often each word appears with specific nikud</li>
                <li><strong>Build context pairs:</strong> Track which words commonly appear before/after each other</li>
                <li><strong>Calculate priors:</strong> Determine probability of each nikud variant based on frequency</li>
                <li><strong>Update models:</strong> Regenerate your JSON model files with this data</li>
              </ol>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="text-gray-400"># Python script to train from corpus</div>
              <div className="mt-2">
                python train_from_corpus.py --input corpus.txt \<br/>
                <span className="ml-16">--output-lexicon lexicon.json \</span><br/>
                <span className="ml-16">--output-context context.json \</span><br/>
                <span className="ml-16">--output-lm lm3.json</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Iterative Improvement */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Step 4: Iterative Testing & Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Create a feedback loop to continuously improve:
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <Badge className="bg-orange-600">1</Badge>
                <p className="text-sm">Test on a validation set with known correct nikud</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <Badge className="bg-orange-600">2</Badge>
                <p className="text-sm">Measure accuracy using the Statistics tab</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <Badge className="bg-orange-600">3</Badge>
                <p className="text-sm">Identify common errors (function words, verbs, nouns, etc.)</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <Badge className="bg-orange-600">4</Badge>
                <p className="text-sm">Add problematic words to your lexicon with correct nikud</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <Badge className="bg-orange-600">5</Badge>
                <p className="text-sm">Retrain and test again</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Resources */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              What You Need
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold mb-2 text-blue-900">✓ You Already Have:</p>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>• Working Python nikud engine</li>
                  <li>• Beautiful web UI (this app)</li>
                  <li>• 500+ pages of training data</li>
                  <li>• Basic lexicon and models</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <p className="font-semibold mb-2 text-red-900">✗ What You Need:</p>
                <ul className="text-sm space-y-1 text-red-800">
                  <li>• Python NLP expertise</li>
                  <li>• Model training pipeline</li>
                  <li>• Evaluation metrics</li>
                  <li>• Algorithm optimization</li>
                </ul>
              </div>
            </div>

            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Recommendation:</strong> Hire a Python NLP consultant for 10-20 hours to:
                <br />
                1. Analyze your current algorithm
                <br />
                2. Build a training pipeline for your corpus
                <br />
                3. Optimize the Viterbi algorithm and scoring
                <br />
                4. Set up evaluation metrics
                <br />
                <br />
                After optimization, you can maintain it yourself using this UI!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
          <CardContent className="pt-6">
            <h3 className="text-2xl font-bold mb-4">Summary: Your Path Forward</h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Short Term:</strong> Enable backend functions to connect this UI to your Python script</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Medium Term:</strong> Find a Python NLP expert to optimize your algorithm (50% → 80%)</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Long Term:</strong> Use your 500+ page corpus to train better models (80% → 95%+)</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Ongoing:</strong> Use this UI to test, measure, and iteratively improve</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
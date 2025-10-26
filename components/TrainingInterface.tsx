"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { AlertTriangle, Brain, CheckCircle, RotateCcw, Download, Upload } from 'lucide-react';
import { OfflineLearningManager, type LabeledSample } from '../lib/offlineLearning';
import { MLRetrainer, type TrainingResult } from '../lib/mlRetrainer';

type ModelInfo = ReturnType<MLRetrainer['getModelInfo']>;

interface TrainingInterfaceProps {
  onTrainingComplete?: (result: TrainingResult) => void;
  className?: string;
}

export default function TrainingInterface({
  onTrainingComplete,
  className = ''
}: TrainingInterfaceProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [samples, setSamples] = useState<LabeledSample[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo>(null);
  const [error, setError] = useState<string | null>(null);

  const learningManager = OfflineLearningManager.getInstance();
  const retrainer = MLRetrainer.getInstance();

  const loadData = useCallback(async () => {
    await learningManager.initialize();
    setSamples(learningManager.getAllSamples());
    setModelInfo(retrainer.getModelInfo());
  }, [learningManager, retrainer]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStartTraining = async () => {
    if (!learningManager.hasEnoughSamples()) {
      setError('Need at least 5 phishing and 5 safe samples for training');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingResult(null);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);

      const result = await retrainer.trainModel(samples);

      clearInterval(progressInterval);
      setTrainingProgress(100);
      setTrainingResult(result);

      if (result.success && onTrainingComplete) {
        onTrainingComplete(result);
      }

      if (!result.success) {
        setError(result.error || 'Training failed');
      }

    } catch (error) {
      console.error('Training error:', error);
      setError(error instanceof Error ? error.message : 'Unknown training error');
    } finally {
      setIsTraining(false);
    }
  };

  const handleClearModel = () => {
    retrainer.clearModel();
    setModelInfo(null);
    setTrainingResult(null);
  };

  const handleExportData = () => {
    const data = learningManager.exportSamples();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishingsense-training-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = learningManager.importSamples(content);

      if (result.success) {
        setSamples(learningManager.getAllSamples());
        setError(null);
      } else {
        setError(`Import failed: ${result.errors.join(', ')}`);
      }
    };
    reader.readAsText(file);
  };

  const stats = learningManager.getSampleStats();
  const canTrain = stats.phishing >= 5 && stats.safe >= 5;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Model Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <CardTitle className="text-lg">AI Model Training</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <CardDescription>
            Train a personalized model using your labeled email samples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Samples</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.phishing}</div>
              <div className="text-sm text-red-600">Phishing</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.safe}</div>
              <div className="text-sm text-green-600">Safe</div>
            </div>
          </div>

          {modelInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="text-sm font-medium text-blue-900">Current Model</div>
              <div className="text-sm text-blue-700">
                Trained: {modelInfo.lastTrained ? new Date(modelInfo.lastTrained).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          )}

          {!canTrain && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <div className="text-sm text-yellow-800">
                Need at least 5 phishing and 5 safe samples to train the model
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Train Model</CardTitle>
          <CardDescription>
            Start training with your labeled samples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={handleStartTraining}
              disabled={!canTrain || isTraining}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {isTraining ? 'Training...' : 'Start Training'}
            </Button>

            <Button
              variant="outline"
              onClick={handleClearModel}
              disabled={isTraining}
            >
              Clear Model
            </Button>
          </div>

          {isTraining && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{Math.round(trainingProgress)}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Results */}
      {trainingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {trainingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Training Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Accuracy</div>
                <div className="text-2xl font-bold">
                  {trainingResult.accuracy ? `${Math.round(trainingResult.accuracy * 100)}%` : 'N/A'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Training Time</div>
                <div className="text-2xl font-bold">
                  {Math.round(trainingResult.duration / 1000)}s
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Epochs</div>
                <div className="text-2xl font-bold">{trainingResult.epochs}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Final Loss</div>
                <div className="text-2xl font-bold">
                  {trainingResult.loss ? trainingResult.loss.toFixed(4) : 'N/A'}
                </div>
              </div>
            </div>

            {trainingResult.success ? (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  🎉 Training completed successfully! The model is now using your personalized training data.
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  ❌ Training failed: {trainingResult.error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

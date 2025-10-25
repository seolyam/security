"use client"

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Brain, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { OfflineLearningManager, LabeledSample } from '../lib/offlineLearning';
import { MLRetrainer } from '../lib/mlRetrainer';

interface LabelingInterfaceProps {
  emailContent: {
    subject?: string;
    body?: string;
    from?: string;
  };
  currentPrediction?: {
    isPhishing: boolean;
    confidence: number;
  };
  onLabelAdded?: (label: 'phishing' | 'safe') => void;
  className?: string;
}

export default function LabelingInterface({
  emailContent,
  currentPrediction,
  onLabelAdded,
  className = ''
}: LabelingInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userLabel, setUserLabel] = useState<'phishing' | 'safe' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const learningManager = OfflineLearningManager.getInstance();
  const retrainer = MLRetrainer.getInstance();

  useEffect(() => {
    // Reset state when content changes
    setUserLabel(null);
    setFeedback(null);
  }, [emailContent.subject, emailContent.body]);

  const handleLabelSubmit = async (label: 'phishing' | 'safe') => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await learningManager.initialize();

      const sampleId = learningManager.addSample(emailContent, label, {
        confidence: currentPrediction?.confidence,
        source: 'manual_label'
      });

      setUserLabel(label);
      setFeedback(`Email labeled as ${label === 'phishing' ? 'Phishing' : 'Safe'}. Thank you for your feedback!`);

      if (onLabelAdded) {
        onLabelAdded(label);
      }

      // Check if we can train now
      if (learningManager.hasEnoughSamples()) {
        setFeedback(prev => prev + ' You have enough samples to retrain the model!');
      }

    } catch (error) {
      console.error('Error submitting label:', error);
      setFeedback('Error saving label. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStats = () => {
    return learningManager.getSampleStats();
  };

  const canRetrain = learningManager.hasEnoughSamples();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle className="text-lg">AI Learning</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        <CardDescription>
          Help improve the AI by labeling emails. This data stays on your device.
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Current Prediction */}
          {currentPrediction && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {currentPrediction.isPhishing ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">AI Prediction</span>
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {Math.round(currentPrediction.confidence * 100)}%
              </div>
            </div>
          )}

          {/* Labeling Interface */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Was this prediction correct?</div>

            <div className="flex gap-2">
              <Button
                variant={userLabel === 'phishing' ? 'default' : 'outline'}
                onClick={() => handleLabelSubmit('phishing')}
                disabled={isSubmitting || userLabel !== null}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Phishing
              </Button>

              <Button
                variant={userLabel === 'safe' ? 'default' : 'outline'}
                onClick={() => handleLabelSubmit('safe')}
                disabled={isSubmitting || userLabel !== null}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Safe
              </Button>
            </div>

            {userLabel && (
              <div className={`p-2 rounded-lg text-sm ${
                userLabel === 'phishing' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                ✓ Labeled as {userLabel === 'phishing' ? 'Phishing' : 'Safe'}
              </div>
            )}
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`p-3 rounded-lg text-sm ${
              feedback.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {feedback}
            </div>
          )}

          {/* Statistics */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Your Training Data</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-semibold">{getStats().total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="text-lg font-semibold text-red-600">{getStats().phishing}</div>
                <div className="text-xs text-red-600">Phishing</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-lg font-semibold text-green-600">{getStats().safe}</div>
                <div className="text-xs text-green-600">Safe</div>
              </div>
            </div>

            {canRetrain && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                🎯 You have enough samples to retrain the model! Visit Settings → ML Training
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

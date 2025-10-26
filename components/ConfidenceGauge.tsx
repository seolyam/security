"use client"

import React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface BreakdownEntry {
  score: number;
  percentage: number;
  confidence?: number;
  details?: any;
  bonus?: number;
}

interface ConfidenceGaugeProps {
  score: number;
  breakdown?: Record<string, BreakdownEntry>;
  className?: string;
  showBreakdown?: boolean;
}

const LABELS: Record<string, string> = {
  rules: 'Heuristic Analysis',
  headers: 'Authentication',
  reputation: 'Sender Reputation',
  behavior: 'Behavioral Context',
  ml: 'ML Analysis',
  misc: 'Additional Factors'
};

export default function ConfidenceGauge({
  score,
  breakdown,
  className = '',
  showBreakdown = true
}: ConfidenceGaugeProps) {

  const getScoreColor = (score: number) => {
    if (score < 30) return { bg: 'bg-green-500', text: 'text-green-600' };
    if (score < 70) return { bg: 'bg-yellow-500', text: 'text-yellow-600' };
    return { bg: 'bg-red-500', text: 'text-red-600' };
  };

  const getRiskIcon = (score: number) => {
    if (score < 30) return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (score < 70) return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    return <AlertTriangle className="h-6 w-6 text-red-600" />;
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Risk Assessment
        </CardTitle>
        <CardDescription>
          Confidence score based on multiple analysis factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          {/* Circular Gauge */}
          <div className="relative w-48 h-48">
            <svg
              className="w-48 h-48 transform -rotate-90"
              viewBox="0 0 256 256"
            >
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke={`var(--${colors.bg.replace('bg-', '')})`}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold ${colors.text}`}>
                {score}%
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
              <div className="mt-2">
                {getRiskIcon(score)}
              </div>
            </div>
          </div>

          {/* Risk Level Badge */}
          <Badge
            variant={
              score < 30 ? 'default' :
              score < 70 ? 'secondary' : 'destructive'
            }
            className="text-sm px-3 py-1"
          >
            {score < 30 ? 'Low Risk' : score < 70 ? 'Medium Risk' : 'High Risk'}
          </Badge>
          {/* Score Breakdown */}
          {showBreakdown && breakdown && (
            <div className="w-full space-y-3">
              <h3 className="font-semibold text-sm text-center">Score Breakdown</h3>

              <div className="space-y-2">
                {Object.entries(breakdown)
                  .filter(([key]) => LABELS[key] && breakdown[key])
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{LABELS[key]}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <Progress
                            value={Math.min(100, Math.max(0, value.score))}
                            className="h-1"
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {Math.round(value.score)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* ML Confidence Indicator */}
              {breakdown.ml?.confidence && breakdown.ml.confidence > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">ML Confidence</span>
                    <span className="text-sm text-blue-700">
                      {Math.round(breakdown.ml.confidence * 100)}%
                    </span>
                  </div>
                  <div className="mt-1">
                    <Progress
                      value={breakdown.ml.confidence * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              )}

              {breakdown.behavior?.bonus && breakdown.behavior.bonus > 0 && (
                <div className="mt-2 text-xs text-green-600 text-center">
                  Behavioral trust signals reduced the risk by approximately {Math.round(breakdown.behavior.bonus)} points.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

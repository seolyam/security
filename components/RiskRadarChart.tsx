"use client"

import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Activity } from 'lucide-react';
import type { AnalysisResult } from '../lib/engines/scoreCombiner';

type BreakdownEntry = AnalysisResult['breakdown'][keyof AnalysisResult['breakdown']];

interface TooltipPayloadEntry {
  payload: {
    score: number;
    percentage: number;
  };
}

interface RadarTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const LABELS: Record<string, string> = {
  rules: 'Heuristic Analysis',
  headers: 'Authentication',
  reputation: 'Sender Reputation',
  behavior: 'Behavioral Context',
  ml: 'ML Analysis',
  misc: 'Additional Factors'
};

function getScoreColor(score: number) {
  if (score < 35) return '#10b981';
  if (score < 60) return '#f59e0b';
  return '#ef4444';
}

function RiskRadarTooltip({ active, payload, label }: RadarTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">Score: {Math.round(data.score)}%</p>
        <p className="text-sm text-gray-600">Contribution: {data.percentage}%</p>
      </div>
    );
  }
  return null;
}

interface RiskRadarChartProps {
  breakdown: AnalysisResult['breakdown'];
  overallScore: number;
  className?: string;
}

export default function RiskRadarChart({ breakdown, overallScore, className = '' }: RiskRadarChartProps) {
  const data = Object.entries(breakdown)
    .filter(([key]) => LABELS[key as keyof typeof LABELS])
    .map(([key, value]) => {
      const entry = value as BreakdownEntry;
      const label = LABELS[key as keyof typeof LABELS] ?? key;
      return {
        factor: label,
        score: entry.score,
        percentage: entry.percentage,
        fullMark: 100
      };
    });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Risk Analysis Breakdown</CardTitle>
          </div>
          <Badge variant={overallScore < 35 ? 'default' : overallScore < 60 ? 'secondary' : 'destructive'}>
            {overallScore < 35 ? 'Low Risk' : overallScore < 60 ? 'Medium Risk' : 'High Risk'}
          </Badge>
        </div>
        <CardDescription>
          Visual representation of each analysis factor&rsquo;s contribution to the overall risk score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="factor"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                className="text-sm"
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickCount={5}
              />
              <Radar
                name="Risk Score"
                dataKey="score"
                stroke={getScoreColor(overallScore)}
                fill={getScoreColor(overallScore)}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip content={<RiskRadarTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getScoreColor(item.score) }}
                />
                <span className="text-sm font-medium">{item.factor}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{Math.round(item.score)}%</div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Overall Risk Score</div>
          <div className="text-2xl font-bold" style={{ color: getScoreColor(overallScore) }}>
            {overallScore}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

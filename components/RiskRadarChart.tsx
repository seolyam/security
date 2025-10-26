"use client"

import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Activity } from 'lucide-react';

type BreakdownEntry = {
  score: number;
  percentage: number;
};

interface RiskRadarChartProps {
  breakdown: Record<string, BreakdownEntry>;
  overallScore: number;
  className?: string;
}

export default function RiskRadarChart({ breakdown, overallScore, className = '' }: RiskRadarChartProps) {
  const LABELS: Record<string, string> = {
    rules: 'Heuristic Analysis',
    headers: 'Authentication',
    reputation: 'Sender Reputation',
    behavior: 'Behavioral Context',
    ml: 'ML Analysis',
    misc: 'Additional Factors'
  };

  const data = Object.entries(breakdown)
    .filter(([key]) => LABELS[key])
    .map(([key, value]) => ({
      factor: LABELS[key],
      score: value.score,
      percentage: value.percentage,
      fullMark: 100
    }));

  const getScoreColor = (score: number) => {
    if (score < 30) return '#10b981'; // green
    if (score < 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Score: {Math.round(data.score)}%
          </p>
          <p className="text-sm text-gray-600">
            Contribution: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Risk Analysis Breakdown</CardTitle>
          </div>
          <Badge variant={overallScore < 30 ? 'default' : overallScore < 70 ? 'secondary' : 'destructive'}>
            {overallScore < 30 ? 'Low Risk' : overallScore < 70 ? 'Medium Risk' : 'High Risk'}
          </Badge>
        </div>
        <CardDescription>
          Visual representation of each analysis factor's contribution to the overall risk score
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown */}
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

        {/* Overall Score */}
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

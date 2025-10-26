"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Calendar, RefreshCw } from 'lucide-react';
import { getAnalysisHistory, type AnalysisHistoryItem } from '../lib/historyUtils';
import type { Finding } from '../lib/ruleEngine';

interface AnalyticsData {
  totalAnalyses: number;
  phishingPercentage: number;
  averageScore: number;
  recentTrend: { date: string; count: number; avgScore: number }[];
  topKeywords: { keyword: string; count: number; severity: 'low' | 'medium' | 'high' }[];
  riskDistribution: { name: string; value: number; color: string }[];
  weeklyActivity: { day: string; analyses: number }[];
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadAnalytics = useCallback(() => {
    setIsLoading(true);

    try {
      const history = getAnalysisHistory();
      const filteredHistory = filterHistoryByTimeRange(history, timeRange);
      const data = calculateAnalytics(filteredHistory);

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p>Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData || analyticsData.totalAnalyses === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">No Analysis Data Available</p>
          <p className="text-sm text-gray-500">
            Run some analyses to see detailed insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>
              Overview of your recent email analyses and key phishing indicators
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              Last 7 days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              Last 30 days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              Last 90 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Analyses"
            value={analyticsData.totalAnalyses.toString()}
            description="Completed within the selected range"
            icon={<Activity className="h-5 w-5 text-blue-600" />}
          />
          <SummaryCard
            title="High-Risk Emails"
            value={`${analyticsData.phishingPercentage.toFixed(1)}%`}
            description="Flagged as likely phishing"
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          />
          <SummaryCard
            title="Average Risk Score"
            value={`${analyticsData.averageScore.toFixed(1)}%`}
            description="Across all analyses"
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          />
        </div>

        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Distribution</CardTitle>
            <CardDescription>How your analysed emails are categorised by risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={analyticsData.riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {analyticsData.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {analyticsData.riskDistribution.map(segment => (
                  <div key={segment.name} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="text-sm font-medium">{segment.name}</span>
                    <Badge>{segment.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Trend</CardTitle>
            <CardDescription>Daily analysis volume and average risk score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={analyticsData.recentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" activeDot={{ r: 6 }} name="Analyses" />
                  <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#f97316" name="Avg Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Keywords</CardTitle>
            <CardDescription>Most common suspicious indicators detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={analyticsData.topKeywords}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="keyword" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              {analyticsData.topKeywords.map((keyword) => (
                <div key={keyword.keyword} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <div className="text-sm font-medium">{keyword.keyword}</div>
                    <div className="text-xs text-gray-500">Detected {keyword.count} times</div>
                  </div>
                  <Badge variant={keyword.severity === 'high' ? 'destructive' : keyword.severity === 'medium' ? 'secondary' : 'default'}>
                    {keyword.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
            <CardDescription>Number of analyses performed each day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="analyses" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, description, icon }: SummaryCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {description}
      </div>
    </div>
  );
}

type TimeRange = '7d' | '30d' | '90d';

function filterHistoryByTimeRange(history: AnalysisHistoryItem[], range: TimeRange): AnalysisHistoryItem[] {
  const now = Date.now();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return history.filter(item => item.createdAt.getTime() >= cutoff);
}

function calculateAnalytics(history: AnalysisHistoryItem[]): AnalyticsData {
  const totalAnalyses = history.length;
  const phishingCount = history.filter(item => item.analysis.score >= 60).length;
  const phishingPercentage = totalAnalyses > 0 ? (phishingCount / totalAnalyses) * 100 : 0;
  const averageScore = totalAnalyses > 0
    ? history.reduce((sum, item) => sum + item.analysis.score, 0) / totalAnalyses
    : 0;

  const recentTrend = calculateRecentTrend(history);

  const keywordCounts = new Map<string, { count: number; severity: 'low' | 'medium' | 'high' }>();
  history.forEach(item => {
    item.analysis.findings.forEach((finding: Finding) => {
      const keyword = finding.text.toLowerCase();
      const current = keywordCounts.get(keyword) || { count: 0, severity: mapSeverity(finding.severity) };
      keywordCounts.set(keyword, {
        count: current.count + 1,
        severity: mapSeverity(finding.severity)
      });
    });
  });

  const topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, data]) => ({ keyword, ...data }))
  .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const riskDistribution = [
    {
      name: 'Low Risk (0-35%)',
      value: history.filter(item => item.analysis.score < 35).length,
      color: '#10b981'
    },
    {
      name: 'Medium Risk (35-60%)',
      value: history.filter(item => item.analysis.score >= 35 && item.analysis.score < 60).length,
      color: '#f59e0b'
    },
    {
      name: 'High Risk (60-100%)',
      value: history.filter(item => item.analysis.score >= 60).length,
      color: '#ef4444'
    }
  ];

  const weeklyActivity = calculateWeeklyActivity(history);

  return {
    totalAnalyses,
    phishingPercentage,
    averageScore,
    recentTrend,
    topKeywords,
    riskDistribution,
    weeklyActivity
  };
}

function calculateRecentTrend(history: AnalysisHistoryItem[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  return last7Days.map(date => {
    const dayAnalyses = history.filter(item =>
      item.createdAt.toISOString().split('T')[0] === date
    );
    const avgScore = dayAnalyses.length > 0
      ? dayAnalyses.reduce((sum, item) => sum + item.analysis.score, 0) / dayAnalyses.length
      : 0;

    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayAnalyses.length,
      avgScore
    };
  });
}

function calculateWeeklyActivity(history: AnalysisHistoryItem[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return days.map(day => {
    const dayAnalyses = history.filter(item => {
      const weekday = item.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
      return weekday === day;
    });
    return {
      day,
      analyses: dayAnalyses.length
    };
  });
}

function mapSeverity(severity: string): 'low' | 'medium' | 'high' {
  if (severity === 'high' || severity === 'medium' || severity === 'low') {
    return severity;
  }
  return 'medium';
}

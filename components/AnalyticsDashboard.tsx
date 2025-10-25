"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Calendar, RefreshCw } from 'lucide-react';

interface AnalysisHistory {
  id: string;
  email: {
    from: string;
    subject: string;
    body: string;
  };
  analysis: {
    score: number;
    riskLevel: string;
    findings: any[];
    summary: string;
  };
  timestamp: number;
}

interface AnalyticsData {
  totalAnalyses: number;
  phishingPercentage: number;
  averageScore: number;
  recentTrend: { date: string; count: number; avgScore: number }[];
  topKeywords: { keyword: string; count: number; severity: string }[];
  riskDistribution: { name: string; value: number; color: string }[];
  weeklyActivity: { day: string; analyses: number }[];
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    setIsLoading(true);

    try {
      const historyJson = localStorage.getItem('phishingsense_history');
      if (!historyJson) {
        setAnalyticsData(null);
        setIsLoading(false);
        return;
      }

      const history: AnalysisHistory[] = JSON.parse(historyJson);
      const filteredHistory = filterHistoryByTimeRange(history, timeRange);
      const data = calculateAnalytics(filteredHistory);

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistoryByTimeRange = (history: AnalysisHistory[], range: '7d' | '30d' | '90d'): AnalysisHistory[] => {
    const now = Date.now();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    return history.filter(item => item.timestamp >= cutoff);
  };

  const calculateAnalytics = (history: AnalysisHistory[]): AnalyticsData => {
    const totalAnalyses = history.length;
    const phishingCount = history.filter(item => item.analysis.score >= 70).length;
    const phishingPercentage = totalAnalyses > 0 ? (phishingCount / totalAnalyses) * 100 : 0;
    const averageScore = totalAnalyses > 0
      ? history.reduce((sum, item) => sum + item.analysis.score, 0) / totalAnalyses
      : 0;

    // Recent trend (last 7 days by default)
    const recentTrend = calculateRecentTrend(history);

    // Top keywords
    const keywordCounts = new Map<string, { count: number; severity: string }>();
    history.forEach(item => {
      item.analysis.findings.forEach((finding: any) => {
        const keyword = finding.text.toLowerCase();
        const current = keywordCounts.get(keyword) || { count: 0, severity: finding.severity };
        keywordCounts.set(keyword, {
          count: current.count + 1,
          severity: finding.severity
        });
      });
    });

    const topKeywords = Array.from(keywordCounts.entries())
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Risk distribution
    const riskDistribution = [
      {
        name: 'Low Risk (0-30%)',
        value: history.filter(item => item.analysis.score < 30).length,
        color: '#10b981'
      },
      {
        name: 'Medium Risk (30-70%)',
        value: history.filter(item => item.analysis.score >= 30 && item.analysis.score < 70).length,
        color: '#f59e0b'
      },
      {
        name: 'High Risk (70-100%)',
        value: history.filter(item => item.analysis.score >= 70).length,
        color: '#ef4444'
      }
    ];

    // Weekly activity
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
  };

  const calculateRecentTrend = (history: AnalysisHistory[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayAnalyses = history.filter(item =>
        new Date(item.timestamp).toISOString().split('T')[0] === date
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
  };

  const calculateWeeklyActivity = (history: AnalysisHistory[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return days.map(day => {
      const dayAnalyses = history.filter(item =>
        new Date(item.timestamp).toLocaleDateString('en-US', { weekday: 'long' }) === day
      );
      return {
        day,
        analyses: dayAnalyses.length
      };
    });
  };

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
          <p className="text-sm text-gray-600">Start analyzing emails to see your statistics here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
              >
                90 Days
              </Button>
              <Button variant="outline" size="sm" onClick={loadAnalytics}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Overview of your email analysis activity and trends
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Analyses</span>
            </div>
            <div className="text-2xl font-bold">{analyticsData.totalAnalyses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Phishing Rate</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {analyticsData.phishingPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Avg Risk Score</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(analyticsData.averageScore)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">This Week</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {analyticsData.recentTrend.reduce((sum, day) => sum + day.count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Distribution</CardTitle>
            <CardDescription>Breakdown of analysis results by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.riskDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analyticsData.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
            <CardDescription>Analysis frequency by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="analyses" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Trend</CardTitle>
            <CardDescription>Daily analysis count and average risk scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.recentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Analyses" />
                  <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#ef4444" strokeWidth={2} name="Avg Score %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Common Indicators</CardTitle>
          <CardDescription>Top detected keywords and patterns in your analyses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analyticsData.topKeywords.slice(0, 9).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.keyword}</div>
                  <div className="text-xs text-gray-600">
                    Found in {item.count} emails
                  </div>
                </div>
                <Badge
                  variant={item.severity === 'high' ? 'destructive' : item.severity === 'medium' ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {item.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

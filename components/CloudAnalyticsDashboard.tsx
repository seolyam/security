"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Activity, Calendar, RefreshCw, User } from 'lucide-react';
import { useAuth } from '../lib/authProvider';
import { ScanService, type UserScanStats } from '../lib/services/scanService';
import { PatternService, type PatternStats } from '../lib/services/patternService';
import type { ScanLog } from '../lib/supabase';

interface AnalyticsData {
  totalAnalyses: number;
  phishingPercentage: number;
  averageScore: number;
  recentTrend: { date: string; count: number; avgScore: number }[];
  topKeywords: { keyword: string; count: number; severity: 'low' | 'medium' | 'high' }[];
  riskDistribution: { name: string; value: number; color: string }[];
  weeklyActivity: { day: string; analyses: number }[];
}

export default function CloudAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [patternStats, setPatternStats] = useState<PatternStats | null>(null);
  const { user } = useAuth();

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Load user stats and scan data
      const [stats, scans, patterns] = await Promise.all([
        ScanService.getUserStats(user.id),
        ScanService.getUserScans(user.id, 100), // Get more scans for analysis
        PatternService.getPatternStats(),
      ]);

      setPatternStats(patterns);

      // Calculate analytics data
      const filteredScans = filterScansByTimeRange(scans, timeRange);
      const data = calculateAnalytics(filteredScans, stats);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12 space-y-2">
            <User className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-lg font-semibold dark:text-white">Sign in to view cloud analytics</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create an account or sign in to sync your analysis data across devices.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="dark:text-white">Loading analytics...</p>
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
          <p className="text-lg mb-2 dark:text-white">No Analysis Data Available</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Start analyzing emails to see your statistics here</p>
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
              <CardTitle className="text-lg dark:text-white">Analytics Dashboard</CardTitle>
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
          <CardDescription className="dark:text-gray-400">
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
              <span className="text-sm font-medium dark:text-gray-300">Total Analyses</span>
            </div>
            <div className="text-2xl font-bold dark:text-white">{analyticsData.totalAnalyses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium dark:text-gray-300">Phishing Rate</span>
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
              <span className="text-sm font-medium dark:text-gray-300">Avg Risk Score</span>
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
              <span className="text-sm font-medium dark:text-gray-300">This Week</span>
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
            <CardTitle className="text-lg dark:text-white">Risk Distribution</CardTitle>
            <CardDescription className="dark:text-gray-400">Breakdown of analysis results by risk level</CardDescription>
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
            <CardTitle className="text-lg dark:text-white">Weekly Activity</CardTitle>
            <CardDescription className="dark:text-gray-400">Analysis frequency by day of week</CardDescription>
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
            <CardTitle className="text-lg dark:text-white">Recent Trend</CardTitle>
            <CardDescription className="dark:text-gray-400">Daily analysis count and average risk scores</CardDescription>
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
                  <Legend />
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
          <CardTitle className="text-lg dark:text-white">Most Common Indicators</CardTitle>
          <CardDescription className="dark:text-gray-400">Top detected keywords and patterns in your analyses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analyticsData.topKeywords.slice(0, 9).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm dark:text-white">{item.keyword}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
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

      {/* Pattern Statistics */}
      {patternStats && Object.keys(patternStats.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Detection Pattern Overview</CardTitle>
            <CardDescription className="dark:text-gray-400">Global pattern statistics and coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{patternStats.total}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Patterns</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{patternStats.bySeverity.high}</div>
                <div className="text-sm text-red-600 dark:text-red-400">High Risk</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{patternStats.bySeverity.medium}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Risk</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{patternStats.bySeverity.low}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Low Risk</div>
              </div>
            </div>

            {Object.keys(patternStats.byCategory).length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2 dark:text-white">Patterns by Category</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(patternStats.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="dark:border-gray-600 dark:text-gray-300">
                      {String(category)}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type ScanTimeRange = '7d' | '30d' | '90d';

function filterScansByTimeRange(scans: ScanLog[], range: ScanTimeRange): ScanLog[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return scans.filter(scan => new Date(scan.created_at).getTime() >= cutoff);
}

function calculateAnalytics(scans: ScanLog[], stats: UserScanStats): AnalyticsData {
  if (scans.length === 0) {
    return {
      totalAnalyses: 0,
      phishingPercentage: 0,
      averageScore: 0,
      recentTrend: [],
      topKeywords: [],
      riskDistribution: [
        { name: 'Low Risk (0-35%)', value: 0, color: '#10b981' },
        { name: 'Medium Risk (35-60%)', value: 0, color: '#f59e0b' },
        { name: 'High Risk (60-100%)', value: 0, color: '#ef4444' }
      ],
      weeklyActivity: [
        { day: 'Sun', analyses: 0 },
        { day: 'Mon', analyses: 0 },
        { day: 'Tue', analyses: 0 },
        { day: 'Wed', analyses: 0 },
        { day: 'Thu', analyses: 0 },
        { day: 'Fri', analyses: 0 },
        { day: 'Sat', analyses: 0 }
      ]
    };
  }

  const riskDistribution = [
    {
      name: 'Low Risk (0-35%)',
      value: scans.filter(s => s.risk_score < 35).length,
      color: '#10b981'
    },
    {
      name: 'Medium Risk (35-60%)',
      value: scans.filter(s => s.risk_score >= 35 && s.risk_score < 60).length,
      color: '#f59e0b'
    },
    {
      name: 'High Risk (60-100%)',
      value: scans.filter(s => s.risk_score >= 60).length,
      color: '#ef4444'
    }
  ];

  const recentTrend: AnalyticsData['recentTrend'] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayScans = scans.filter(scan =>
      scan.created_at.startsWith(dateStr)
    );

    recentTrend.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayScans.length,
      avgScore: dayScans.length > 0
        ? dayScans.reduce((sum, scan) => sum + scan.risk_score, 0) / dayScans.length
        : 0
    });
  }

  const keywordCounts = new Map<string, { count: number; severity: 'low' | 'medium' | 'high' }>();
  scans.forEach(scan => {
    scan.keywords?.forEach(keyword => {
      const count = keywordCounts.get(keyword) || { count: 0, severity: 'medium' };
      keywordCounts.set(keyword, {
        count: count.count + 1,
        severity: scan.risk_score > 60 ? 'high' : scan.risk_score >= 35 ? 'medium' : 'low'
      });
    });
  });

  const topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, data]) => ({ keyword, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyActivity = days.map(day => {
    const dayScans = scans.filter(scan => {
      const weekday = new Date(scan.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      return weekday === day;
    });
    return {
      day,
      analyses: dayScans.length
    };
  });

  return {
    totalAnalyses: scans.length,
    phishingPercentage: stats.phishingPercentage,
    averageScore: stats.avgRiskScore,
    recentTrend,
    topKeywords,
    riskDistribution,
    weeklyActivity
  };
}

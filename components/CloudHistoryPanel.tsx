"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge, type BadgeProps } from './ui/badge';
import { Input } from './ui/input';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2,
  Calendar,
  User,
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../lib/authProvider';
import { ScanService } from '../lib/services/scanService';
import type { ScanLog } from '../lib/supabase';
import type { AnalysisHistoryItem, StoredAnalysisResult } from '../lib/historyUtils';
import type { Finding } from '../lib/ruleEngine';

interface CloudHistoryPanelProps {
  onLoadAnalysis?: (item: AnalysisHistoryItem) => void;
  className?: string;
}

export default function CloudHistoryPanel({ onLoadAnalysis, className = '' }: CloudHistoryPanelProps) {
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredScans, setFilteredScans] = useState<ScanLog[]>([]);
  const { user } = useAuth();

  const loadHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const scansData = await ScanService.getUserScans(user.id);
      setScans(scansData);
    } catch (error) {
      console.error('Error loading scan history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadHistory();
    }
  }, [user, loadHistory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredScans(scans);
    } else {
      const filtered = scans.filter(scan =>
        scan.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.from_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredScans(filtered);
    }
  }, [scans, searchQuery]);

  const handleDelete = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) return;

    try {
      await ScanService.deleteScan(scanId, user.id);
      await loadHistory();
    } catch (error) {
      console.error('Error deleting scan:', error);
    }
  };

  const handleLoad = (scan: ScanLog) => {
    if (!onLoadAnalysis) {
      return;
    }

    const findings: Finding[] = (scan.keywords ?? []).map(keyword => ({
      id: `keyword-${keyword}`,
      text: `Keyword detected: ${keyword}`,
      severity: scan.risk_score >= 60 ? 'high' : scan.risk_score >= 35 ? 'medium' : 'low',
      category: 'keyword'
    }));

    const analysis: StoredAnalysisResult = {
      score: scan.risk_score,
      riskLevel: getRiskLevel(scan.risk_score),
      summary: getVerdictText(scan.verdict),
      findings
    };

    const historyItem: AnalysisHistoryItem = {
      id: scan.id,
      email: {
        from: scan.from_email || '',
        subject: scan.subject,
        body: scan.body || '',
        analyzedAt: new Date(scan.created_at)
      },
      analysis,
      createdAt: new Date(scan.created_at)
    };

    onLoadAnalysis(historyItem);
  };

  const getRiskLevel = (score: number): 'Low' | 'Medium' | 'High' => {
    if (score < 35) return 'Low';
    if (score < 60) return 'Medium';
    return 'High';
  };

  const getVerdictText = (verdict: string): string => {
    switch (verdict) {
      case 'phishing': return 'High risk - Likely phishing attempt';
      case 'suspicious': return 'Medium risk - Suspicious content detected';
      case 'safe': return 'Low risk - Appears safe';
      default: return 'Analysis complete';
    }
  };

  const getVerdictColor = (verdict: string): BadgeProps['variant'] => {
    switch (verdict) {
      case 'phishing':
        return 'destructive';
      case 'suspicious':
        return 'secondary';
      case 'safe':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRiskIcon = (verdict: string) => {
    switch (verdict) {
      case 'phishing': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'suspicious': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'safe': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">Sign in to view your analysis history</p>
          <p className="text-sm text-gray-500">Your scans are securely stored in the cloud</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cloud Analysis History
            </CardTitle>
            <CardDescription>
              Your scans are securely stored and synced across devices
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadHistory} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search scans by subject, content, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Loading scan history...</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              {searchQuery ? 'No scans match your search' : 'No scan history found'}
            </p>
            <p className="text-sm text-gray-500">
              Start analyzing emails to build your history
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredScans.map((scan) => (
              <div
                key={scan.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleLoad(scan)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getRiskIcon(scan.verdict)}
                      <h3 className="font-medium text-sm">{scan.subject}</h3>
                      <Badge variant={getVerdictColor(scan.verdict)} className="text-xs">
                        {scan.verdict}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {scan.from_email && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {scan.from_email}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(scan.created_at).toLocaleDateString()}
                      </div>
                      {scan.keywords && scan.keywords.length > 0 && (
                        <div className="text-xs">
                          Keywords: {scan.keywords.slice(0, 3).join(', ')}
                          {scan.keywords.length > 3 && ` +${scan.keywords.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {scan.risk_score}%
                      </div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(scan.id, e)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

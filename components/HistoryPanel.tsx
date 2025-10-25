"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  getAnalysisHistory,
  deleteAnalysisFromHistory,
  clearAnalysisHistory,
  exportHistoryToJSON,
  AnalysisHistoryItem
} from '../lib/historyUtils';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface HistoryPanelProps {
  onLoadAnalysis?: (item: AnalysisHistoryItem) => void;
  className?: string;
}

export default function HistoryPanel({ onLoadAnalysis, className = '' }: HistoryPanelProps) {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setIsLoading(true);
    const historyData = getAnalysisHistory();
    setHistory(historyData);
    setIsLoading(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnalysisFromHistory(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all analysis history?')) {
      clearAnalysisHistory();
      loadHistory();
    }
  };

  const handleExport = () => {
    exportHistoryToJSON();
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading history...
          </div>
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
              <FileText className="h-5 w-5" />
              Analysis History
            </CardTitle>
            <CardDescription>
              {history.length} recent analyses
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No Analysis History</p>
            <p className="text-sm">Your recent email analyses will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onLoadAnalysis?.(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getRiskIcon(item.analysis.riskLevel)}
                      <span className="font-medium text-sm truncate">
                        {item.email.subject || 'No Subject'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span className="truncate">{item.email.from}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={
                      item.analysis.riskLevel === 'Low' ? 'default' :
                      item.analysis.riskLevel === 'Medium' ? 'secondary' : 'destructive'
                    }>
                      {item.analysis.riskLevel}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.createdAt)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {item.analysis.score}%
                    </div>
                    <div className="w-16">
                      <Progress
                        value={item.analysis.score}
                        className="h-1"
                      />
                    </div>
                  </div>
                </div>

                {item.analysis.findings.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {item.analysis.findings.length} finding{item.analysis.findings.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

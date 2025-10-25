"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { FileText, Download, Palette, MessageSquare, List, Eye } from 'lucide-react';
import { generateEnhancedPDF, generateEnhancedJSON } from '../lib/enhancedExport';

interface ReportCustomization {
  theme: 'default' | 'dark' | 'minimal' | 'professional';
  branding: {
    companyName: string;
    logoUrl: string;
    analystName: string;
  };
  includeComments: boolean;
  comments: string;
  includeSignature: boolean;
  signature: string;
  format: 'pdf' | 'json';
  batchExport: boolean;
  selectedAnalyses: string[];
}

interface EmailData {
  from: string;
  subject: string;
  body: string;
  analyzedAt: Date;
}

interface AnalysisResult {
  score: number;
  riskLevel: string;
  findings: any[];
  summary: string;
  breakdown: any;
}

interface BatchAnalysis {
  id: string;
  email: EmailData;
  analysis: AnalysisResult;
  timestamp: number;
}

export default function ReportCustomization() {
  const [customization, setCustomization] = useState<ReportCustomization>({
    theme: 'default',
    branding: {
      companyName: '',
      logoUrl: '',
      analystName: ''
    },
    includeComments: false,
    comments: '',
    includeSignature: true,
    signature: '',
    format: 'pdf',
    batchExport: false,
    selectedAnalyses: []
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleBrandingChange = (field: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: value
      }
    }));
  };

  const getBatchAnalyses = (): BatchAnalysis[] => {
    try {
      const historyJson = localStorage.getItem('phishingsense_history');
      if (!historyJson) return [];

      const history = JSON.parse(historyJson);
      return Array.isArray(history) ? history.slice(0, 10) : []; // Last 10 analyses
    } catch (error) {
      console.error('Error loading batch analyses:', error);
      return [];
    }
  };

  const handleBatchToggle = (analysisId: string, selected: boolean) => {
    setCustomization(prev => ({
      ...prev,
      selectedAnalyses: selected
        ? [...prev.selectedAnalyses, analysisId]
        : prev.selectedAnalyses.filter(id => id !== analysisId)
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (customization.batchExport && customization.selectedAnalyses.length > 0) {
        // Batch export
        const batchAnalyses = getBatchAnalyses();
        const selectedAnalyses = batchAnalyses.filter(a =>
          customization.selectedAnalyses.includes(a.id)
        );

        for (const analysis of selectedAnalyses) {
          const emailData = {
            ...analysis.email,
            analyzedAt: new Date(analysis.timestamp)
          };

          if (customization.format === 'pdf') {
            await generateEnhancedPDF(emailData, analysis.analysis as any);
          } else {
            generateEnhancedJSON(emailData, analysis.analysis);
          }

          // Small delay between exports to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // Single export (would need current analysis data)
        console.log('Single export - would need current analysis data');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const batchAnalyses = getBatchAnalyses();
  const canExport = customization.batchExport ? customization.selectedAnalyses.length > 0 : true;

  return (
    <div className="space-y-6">
      {/* Report Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Report Theme & Branding
          </CardTitle>
          <CardDescription>
            Customize the appearance and branding of your reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={customization.theme}
                onValueChange={(value: 'default' | 'dark' | 'minimal' | 'professional') =>
                  setCustomization(prev => ({ ...prev, theme: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company/Organization</Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Name"
                  value={customization.branding.companyName}
                  onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="analystName">Analyst Name</Label>
                <Input
                  id="analystName"
                  placeholder="Your Name"
                  value={customization.branding.analystName}
                  onChange={(e) => handleBrandingChange('analystName', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={customization.branding.logoUrl}
                onChange={(e) => handleBrandingChange('logoUrl', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Report Content
          </CardTitle>
          <CardDescription>
            Add comments and customize what information is included
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Include Analyst Comments</div>
                <div className="text-sm text-gray-600">Add custom notes to the report</div>
              </div>
              <Switch
                checked={customization.includeComments}
                onCheckedChange={(checked) =>
                  setCustomization(prev => ({ ...prev, includeComments: checked }))
                }
              />
            </div>

            {customization.includeComments && (
              <div>
                <Label htmlFor="comments">Analyst Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Add your analysis notes, recommendations, or observations..."
                  rows={4}
                  value={customization.comments}
                  onChange={(e) =>
                    setCustomization(prev => ({ ...prev, comments: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Include Digital Signature</div>
                <div className="text-sm text-gray-600">Add report authenticity verification</div>
              </div>
              <Switch
                checked={customization.includeSignature}
                onCheckedChange={(checked) =>
                  setCustomization(prev => ({ ...prev, includeSignature: checked }))
                }
              />
            </div>

            {customization.includeSignature && (
              <div>
                <Label htmlFor="signature">Signature Text</Label>
                <Input
                  id="signature"
                  placeholder="Your name and credentials"
                  value={customization.signature}
                  onChange={(e) =>
                    setCustomization(prev => ({ ...prev, signature: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Choose export format and options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={customization.format}
                onValueChange={(value: 'pdf' | 'json') =>
                  setCustomization(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Batch Export</div>
                <div className="text-sm text-gray-600">Export multiple analyses at once</div>
              </div>
              <Switch
                checked={customization.batchExport}
                onCheckedChange={(checked) =>
                  setCustomization(prev => ({ ...prev, batchExport: checked }))
                }
              />
            </div>

            {customization.batchExport && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Select Analyses to Export</div>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                  {batchAnalyses.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No analysis history available
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {batchAnalyses.map(analysis => (
                        <div key={analysis.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium truncate">
                              {analysis.email.subject || 'Untitled'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(analysis.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              analysis.analysis.score < 30 ? 'default' :
                              analysis.analysis.score < 70 ? 'secondary' : 'destructive'
                            }>
                              {analysis.analysis.score}%
                            </Badge>
                            <Switch
                              checked={customization.selectedAnalyses.includes(analysis.id)}
                              onCheckedChange={(checked) => handleBatchToggle(analysis.id, checked)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {customization.selectedAnalyses.length} of {batchAnalyses.length} selected
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Report Preview</div>
              <div className="space-y-1 text-sm text-blue-800">
                <div>Theme: {customization.theme}</div>
                <div>Format: {customization.format.toUpperCase()}</div>
                {customization.branding.companyName && (
                  <div>Branding: {customization.branding.companyName}</div>
                )}
                {customization.includeComments && (
                  <div>Comments: {customization.comments ? 'Included' : 'Empty'}</div>
                )}
                <div>Digital Signature: {customization.includeSignature ? 'Included' : 'Disabled'}</div>
                {customization.batchExport && (
                  <div>Batch Export: {customization.selectedAnalyses.length} analyses</div>
                )}
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={!canExport || isExporting}
              className="w-full flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {customization.batchExport ? 'Exporting Batch...' : 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {customization.batchExport ? 'Export Selected Reports' : 'Export Report'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

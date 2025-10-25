"use client"

import { useState } from 'react';
import { analyzeEmail } from '../lib/ruleEngine';
import { saveAnalysisToHistory, AnalysisHistoryItem } from '../lib/historyUtils';
import { exportToJSON, exportToPDF } from '../lib/exportUtils';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle, Download, FileText, History, Eye, Brain } from 'lucide-react';
import EmailHighlighter from './EmailHighlighter';
import HistoryPanel from './HistoryPanel';

export default function AnalyzerForm() {
  const [formData, setFormData] = useState({
    from: '',
    subject: '',
    body: '',
    headers: '',
  });
  const [result, setResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useML, setUseML] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    // Simulate analysis delay for better UX
    setTimeout(async () => {
      try {
        const analysis = await analyzeEmail(formData, useML);
        setResult(analysis);

        // Save to history
        const emailData = {
          ...formData,
          analyzedAt: new Date(),
        };
        saveAnalysisToHistory(emailData, analysis);
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ from: '', subject: '', body: '', headers: '' });
    setResult(null);
  };

  const handleLoadAnalysis = (item: AnalysisHistoryItem) => {
    setFormData({
      from: item.email.from,
      subject: item.email.subject,
      body: item.email.body,
      headers: '',
    });
    setResult(item.analysis);
    setShowHistory(false);
  };

  const handleExportJSON = () => {
    if (!result) return;

    const emailData = {
      ...formData,
      analyzedAt: new Date(),
    };
    exportToJSON(emailData, result);
  };

  const handleExportPDF = async () => {
    if (!result) return;

    setIsExporting(true);
    try {
      const emailData = {
        ...formData,
        analyzedAt: new Date(),
      };
      await exportToPDF(emailData, result);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'High':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Phishsense</h1>
        <p className="text-gray-600">Advanced Phishing Email Detection</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Analysis</CardTitle>
                  <CardDescription>
                    Paste email content to analyze for potential phishing attempts
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    placeholder="sender@example.com"
                    value={formData.from}
                    onChange={(e) => handleInputChange('from', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject line"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Paste the full email content here..."
                    rows={12}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                  />
                </div>

                {/* Advanced Options */}
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHeaders(!showHeaders)}
                      className="text-sm"
                    >
                      {showHeaders ? 'Hide' : 'Show'} Advanced Options
                    </Button>
                  </div>

                  {showHeaders && (
                    <>
                      <div>
                        <Label htmlFor="headers">Email Headers (Optional)</Label>
                        <Textarea
                          id="headers"
                          placeholder="Paste raw email headers here for advanced analysis..."
                          rows={6}
                          value={formData.headers}
                          onChange={(e) => handleInputChange('headers', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useML"
                          checked={useML}
                          onChange={(e) => setUseML(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="useML" className="text-sm">
                          Enable ML Analysis (Beta)
                        </Label>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isAnalyzing || !formData.body.trim()}
                    className="flex-1"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* History Panel */}
          {showHistory && (
            <div className="mt-4">
              <HistoryPanel
                onLoadAnalysis={handleLoadAnalysis}
                className="max-h-96"
              />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    {result ? 'Phishing detection analysis complete' : 'Results will appear here after analysis'}
                  </CardDescription>
                </div>
                {result && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportJSON}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      {isExporting ? 'Exporting...' : 'PDF'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Risk Score */}
                  <div className="text-center">
                    <div className="mb-4">
                      <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}%
                      </div>
                      <div className="text-lg text-gray-600">Risk Score</div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      {getRiskIcon(result.riskLevel)}
                      <Badge variant={
                        result.riskLevel === 'Low' ? 'default' :
                        result.riskLevel === 'Medium' ? 'secondary' : 'destructive'
                      }>
                        {result.riskLevel} Risk - {result.summary}
                      </Badge>
                    </div>

                    <Progress
                      value={result.score}
                      className="w-full h-2"
                    />
                  </div>

                  {/* Header Analysis */}
                  {result.headerSummary && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <h3 className="font-semibold">Email Authentication</h3>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-mono text-gray-700">
                          {result.headerSummary}
                        </div>
                        <div className={`text-xs mt-1 ${
                          result.headerAnalysis?.overall === 'good' ? 'text-green-600' :
                          result.headerAnalysis?.overall === 'suspicious' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          Overall: {result.headerAnalysis?.overall?.toUpperCase()} authentication
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ML Analysis */}
                  {result.mlAnalysis?.used && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4" />
                        <h3 className="font-semibold">ML Analysis (Beta)</h3>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm">
                          Machine learning confidence: <span className="font-medium">{Math.round(result.mlAnalysis.score * 100)}%</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          This analysis uses a neural network trained on email patterns
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Findings */}
                  <div>
                    <h3 className="font-semibold mb-3">Findings</h3>
                    {result.findings.length > 0 ? (
                      <div className="space-y-2">
                        {result.findings.map((finding: any) => (
                          <div
                            key={finding.id}
                            className={`p-3 rounded-lg border ${
                              finding.severity === 'high' ? 'border-red-200 bg-red-50' :
                              finding.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                              'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {finding.severity === 'high' && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                              {finding.severity === 'medium' && <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                              {finding.severity === 'low' && <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5" />}
                              <div className="flex-1">
                                <div className="text-sm font-medium">{finding.text}</div>
                                <div className="text-xs text-gray-500 capitalize">{finding.severity} severity</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                        <p>No suspicious indicators found</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg mb-2">Ready to Analyze</p>
                  <p className="text-sm">Enter email content and click "Analyze Email" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

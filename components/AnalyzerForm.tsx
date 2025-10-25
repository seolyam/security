"use client"

import { useState } from 'react';
import { analyzeEmailV2 } from '../lib/ruleEngine';
import { saveAnalysisToHistory, AnalysisHistoryItem } from '../lib/historyUtils';
import { generateEnhancedJSON, generateEnhancedPDF } from '../lib/enhancedExport';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle, Download, FileText, History, Eye, Brain, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import EmailHighlighter from './EmailHighlighter';
import HistoryPanel from './HistoryPanel';
import ConfidenceGauge from './ConfidenceGauge';

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

    try {
      const analysis = await analyzeEmailV2(formData, {
        enableML: useML,
        sensitivity: 'medium'
      });
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
    generateEnhancedJSON(emailData, result);
  };

  const handleExportPDF = async () => {
    if (!result) return;

    setIsExporting(true);
    try {
      const emailData = {
        ...formData,
        analyzedAt: new Date(),
      };
      await generateEnhancedPDF(emailData, result);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Email Security Analyzer</h1>
        <p className="text-gray-600">Advanced phishing detection with AI-powered analysis</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
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
                    rows={8}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                  />
                </div>

                {/* Advanced Options */}
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHeaders(!showHeaders)}
                    className="flex items-center gap-1 text-sm"
                  >
                    {showHeaders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Advanced Options
                  </Button>

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
            <HistoryPanel
              onLoadAnalysis={handleLoadAnalysis}
              className="max-h-96"
            />
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Confidence Gauge */}
              <ConfidenceGauge
                score={result.score}
                breakdown={result.breakdown}
                showBreakdown={true}
              />

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportJSON}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Exporting...' : 'PDF Report'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Content with Highlights */}
              {formData.body && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Content Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmailHighlighter
                      content={formData.body}
                      findings={result.findings}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Detailed Findings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Detailed Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                              <div className="text-xs text-gray-500 capitalize">{finding.severity} severity • {finding.category}</div>
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
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Ready to Analyze</p>
                <p className="text-sm text-gray-600">Enter email content and click "Analyze Email" to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client"

import { useEffect, useState } from 'react';
import { analyzeEmailV2 } from '../lib/ruleEngine';
import { generateEnhancedJSON, generateEnhancedPDF } from '../lib/enhancedExport';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, AlertCircle, Download, FileText, History, Eye, Brain, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import ConfidenceGauge from './ConfidenceGauge';
import LabelingInterface from './LabelingInterface';
import ExplanationModal from './ExplanationModal';
import RiskRadarChart from './RiskRadarChart';
import EnhancedEmailHighlighter from './EnhancedEmailHighlighter';
import SafetyTipsCarousel from './SafetyTipsCarousel';
import PhishingQuiz from './PhishingQuiz';
import CloudHistoryPanel from './CloudHistoryPanel';
import { useAuth } from '../lib/authProvider';
import { ScanService } from '../lib/services/scanService';
import { useTheme } from '../lib/themeProvider';
import LegitimacyChecklist from './LegitimacyChecklist';
import { getLegitimacySnapshot, isSenderTrusted, recordTrustedSender } from '../lib/services/trustedService';
import { recordBehaviorInteraction } from '../lib/services/behaviorService';
import { OfflineLearningManager } from '../lib/offlineLearning';

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
  const [showVisualization, setShowVisualization] = useState(true);
  const [explanationModal, setExplanationModal] = useState<{ isOpen: boolean; finding?: any }>({ isOpen: false });
  const [isTrustedSender, setIsTrustedSender] = useState(false);
  const [legitimacySnapshot, setLegitimacySnapshot] = useState<any>(null);
  const [savingLegitimate, setSavingLegitimate] = useState(false);
  const [legitimateSaved, setLegitimateSaved] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    setIsTrustedSender(isSenderTrusted(formData.from, { userId: user?.id }));
  }, [formData.from, user?.id]);

  useEffect(() => {
    if (!result) {
      setLegitimacySnapshot(null);
      return;
    }
    setIsTrustedSender(isSenderTrusted(formData.from, { userId: user?.id }));
    setLegitimacySnapshot(getLegitimacySnapshot({
      sender: formData.from,
      analysis: result,
      userId: user?.id
    }));
  }, [result, formData.from, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    try {
      const analysis = await analyzeEmailV2(formData, {
        enableML: useML,
        mlConfig: {
          enabled: useML,
          modelType: 'client',
          confidenceThreshold: 0.5
        },
        sensitivity: 'medium'
      });
      setResult(analysis);
      setLegitimateSaved(false);

      try {
        const verdict = analysis.score >= 70 ? 'phishing' : analysis.score >= 30 ? 'suspicious' : 'safe';
        recordBehaviorInteraction({ sender: formData.from, verdict });
      } catch (error) {
        console.error('Failed to record behavior signals:', error);
      }

      // Save to cloud if user is authenticated
      if (user) {
        try {
          await ScanService.createScan(user.id, {
            subject: formData.subject,
            body: formData.body,
            fromEmail: formData.from,
            riskScore: analysis.score,
            verdict: analysis.score >= 70 ? 'phishing' : analysis.score >= 30 ? 'suspicious' : 'safe',
            keywords: analysis.findings.map((f: any) => f.text),
            links: [], // Could extract URLs from content
            mlConfidence: analysis.breakdown?.ml?.confidence ?? 0,
          });
        } catch (error) {
          console.error('Error saving to cloud:', error);
          // Don't fail the analysis if cloud save fails
        }
      }
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
    setLegitimacySnapshot(null);
    setLegitimateSaved(false);
  };

  const handleLoadAnalysis = (item: any) => {
    setFormData({
      from: item.email.from,
      subject: item.email.subject,
      body: item.email.body,
      headers: '',
    });
    setResult(item.analysis);
    setShowHistory(false);
  };

  const handleMarkLegitimate = async () => {
    if (!result) return;
    setSavingLegitimate(true);
    try {
      recordTrustedSender({
        sender: formData.from,
        subject: formData.subject,
        userId: user?.id,
        authSnapshot: {
          spfPassed: result?.breakdown?.headers?.details?.spfStatus === 'pass',
          dkimPassed: result?.breakdown?.headers?.details?.dkimStatus === 'pass',
          dmarcPassed: result?.breakdown?.headers?.details?.dmarcStatus === 'pass'
        }
      });

      const offlineManager = OfflineLearningManager.getInstance();
      await offlineManager.initialize();
      offlineManager.addSample(
        { subject: formData.subject, body: formData.body, from: formData.from },
        'safe',
        { source: 'trusted-confirmation' }
      );

      setLegitimateSaved(true);
      setIsTrustedSender(true);
      recordBehaviorInteraction({ sender: formData.from, verdict: 'safe' });
      setLegitimacySnapshot(getLegitimacySnapshot({
        sender: formData.from,
        analysis: result,
        userId: user?.id
      }));
    } catch (error) {
      console.error('Failed to mark sender as legitimate:', error);
    } finally {
      setSavingLegitimate(false);
    }
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
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Email Security Analyzer</h1>
        <p className="text-gray-600 dark:text-gray-400">Advanced phishing detection with AI-powered analysis</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white">Email Analysis</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Paste email content to analyze for potential phishing attempts
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="from" className="dark:text-gray-300">From</Label>
                  <Input
                    id="from"
                    placeholder="sender@example.com"
                    value={formData.from}
                    onChange={(e) => handleInputChange('from', e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="dark:text-gray-300">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject line"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="body" className="dark:text-gray-300">Email Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Paste the full email content here..."
                    rows={8}
                    value={formData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                {/* Advanced Options */}
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHeaders(!showHeaders)}
                    className="flex items-center gap-1 text-sm dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {showHeaders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Advanced Options
                  </Button>

                  {showHeaders && (
                    <>
                      <div>
                        <Label htmlFor="headers" className="dark:text-gray-300">Email Headers (Optional)</Label>
                        <Textarea
                          id="headers"
                          placeholder="Paste raw email headers here for advanced analysis..."
                          rows={6}
                          value={formData.headers}
                          onChange={(e) => handleInputChange('headers', e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useML"
                          checked={useML}
                          onChange={(e) => setUseML(e.target.checked)}
                          className="rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <Label htmlFor="useML" className="text-sm dark:text-gray-300">
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
                  <Button type="button" variant="outline" onClick={resetForm} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* History Panel */}
          {showHistory && (
            <CloudHistoryPanel
              onLoadAnalysis={handleLoadAnalysis}
              className="max-h-96 dark:bg-gray-800 dark:border-gray-700"
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

              <LegitimacyChecklist
                analysis={result}
                snapshot={legitimacySnapshot}
                isTrustedSender={isTrustedSender}
                onMarkLegitimate={handleMarkLegitimate}
                markDisabled={savingLegitimate}
                showSavedState={legitimateSaved}
              />

              {/* Export Options */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Download className="h-5 w-5" />
                    Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportJSON}
                      className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileText className="h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="flex items-center gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Exporting...' : 'PDF Report'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Email Highlighter */}
              {formData.body && result.findings && (
                <EnhancedEmailHighlighter
                  content={formData.body}
                  findings={result.findings}
                  showHoverEffects={true}
                  showCategories={true}
                />
              )}

              {/* Risk Radar Chart */}
              {result.breakdown && showVisualization && (
                <RiskRadarChart
                  breakdown={result.breakdown}
                  overallScore={result.score}
                />
              )}

              {/* AI Learning Interface */}
              {result && (
                <LabelingInterface
                  emailContent={formData}
                  currentPrediction={{
                    isPhishing: result.score >= 70,
                    confidence: result.score / 100
                  }}
                />
              )}

              {/* Educational Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <SafetyTipsCarousel autoPlay={false} />
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Learn More</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Click the explain buttons next to findings to understand why they were flagged.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExplanationModal({
                        isOpen: true,
                        finding: result.findings[0]
                      })}
                      disabled={result.findings.length === 0}
                      className="dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      Explain First Finding
                    </Button>
                  </div>
                </div>
              </div>

              {/* Explanation Modal */}
              {explanationModal.isOpen && explanationModal.finding && (
                <ExplanationModal
                  isOpen={explanationModal.isOpen}
                  onClose={() => setExplanationModal({ isOpen: false })}
                  finding={explanationModal.finding}
                />
              )}

              {/* Detailed Findings */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
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
                          className={`p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800/50 ${
                            finding.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                              finding.severity === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
                              'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {finding.severity === 'high' && <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />}
                            {finding.severity === 'medium' && <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />}
                            {finding.severity === 'low' && <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5" />}
                            <div className="flex-1">
                              <div className="text-sm font-medium dark:text-white">{finding.text}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {finding.severity} severity • {finding.category}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExplanationModal({
                                isOpen: true,
                                finding
                              })}
                              className="text-xs"
                            >
                              Explain
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600 dark:text-green-400" />
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

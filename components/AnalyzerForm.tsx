"use client";

import { useEffect, useState } from "react";
import { analyzeEmailV2 } from "../lib/ruleEngine";
import {
  generateEnhancedJSON,
  generateEnhancedPDF,
} from "../lib/enhancedExport";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfidenceGauge from "./ConfidenceGauge";
import LabelingInterface from "./LabelingInterface";
import ExplanationModal from "./ExplanationModal";
import RiskRadarChart from "./RiskRadarChart";
import EnhancedEmailHighlighter from "./EnhancedEmailHighlighter";
import SafetyTipsCarousel from "./SafetyTipsCarousel";
import CloudHistoryPanel from "./CloudHistoryPanel";
import { useAuth } from "../lib/authProvider";
import { ScanService } from "../lib/services/scanService";
import LegitimacyChecklist from "./LegitimacyChecklist";
import {
  getLegitimacySnapshot,
  isSenderTrusted,
  recordTrustedSender,
  syncTrustedRecordsFromRemote,
  type LegitimacySnapshot,
} from "../lib/services/trustedService";
import {
  recordBehaviorInteraction,
  syncBehaviorSignalsFromRemote,
} from "../lib/services/behaviorService";
import { OfflineLearningManager } from "../lib/offlineLearning";
import type { AnalysisResult } from "../lib/engines/scoreCombiner";
import type { Finding } from "../lib/ruleEngine";
import type { AnalysisHistoryItem } from "../lib/historyUtils";

const normalizeRiskLevel = (value: string): AnalysisResult["riskLevel"] => {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }
  const lower = value.toLowerCase();
  if (lower === "low") return "Low";
  if (lower === "high") return "High";
  return "Medium";
};

const createHistoryBreakdown = (
  score: number
): AnalysisResult["breakdown"] => ({
  rules: {
    score,
    percentage: 100,
    details: {
      keywordScore: score,
      urlScore: 0,
      domainScore: 0,
      attachmentScore: 0,
      htmlScore: 0,
    },
  },
  headers: {
    score: 0,
    percentage: 0,
    details: {
      spfStatus: undefined,
      dkimStatus: undefined,
      dmarcStatus: undefined,
      receivedCount: 0,
      suspiciousHeaders: 0,
      authPositiveBonus: 0,
      authSummary: {
        spfPassed: false,
        dkimPassed: false,
        dmarcPassed: false,
        totalBonus: 0,
      },
    },
  },
  reputation: {
    score: 0,
    percentage: 0,
    details: {
      emailAddress: null,
      domain: null,
      displayName: null,
      matchedBrand: null,
      lookalikeDistance: null,
      suspiciousTokens: [],
    },
  },
  behavior: {
    score: 0,
    percentage: 0,
    bonus: 0,
    details: {
      totalInteractions: 0,
      phishingInteractions: 0,
      safeInteractions: 0,
      suspiciousInteractions: 0,
      daysSinceLastInteraction: null,
      isFirstInteraction: true,
      firstSeen: undefined,
      lastSeen: undefined,
      trustedSender: false,
    },
  },
  ml: {
    score: 0,
    percentage: 0,
    confidence: 0,
    modelUsed: "history",
  },
  misc: {
    score: 0,
    percentage: 0,
  },
});

const SAMPLE_EMAILS = [
  {
    id: "safe-team-update",
    label: "Team Standup Reminder",
    from: "alice@company.com",
    subject: "Reminder: Monday Standup Notes",
    body: `Hi team,

Thanks again for the productive standup this morning. Please review the notes below and add any blockers before 3pm.

• Sprint burndown is on track
• Please ship feedback on the billing flows
• Security training reminder for Thursday

Best,
Alice`,
  },
  {
    id: "phish-paypal",
    label: "Fake PayPal Verification",
    from: "service@paypal-secure.com",
    subject: "Immediate action required: Verify your PayPal account!",
    body: `Dear Customer,

We detected suspicious activity on your PayPal account. To avoid suspension, you must verify your identity within 12 hours.

Click the secure link below to confirm your information:
https://paypal-secure.com/verify

Failure to act will result in limited account access.

Sincerely,
PayPal Security`,
  },
  {
    id: "suspicious-delivery",
    label: "Delivery Fee Request",
    from: "updates@fastparcel-alerts.com",
    subject: "Your package is waiting – confirm delivery fee",
    body: `Hello,

We attempted to deliver a parcel to your address, but a delivery fee is outstanding.

Please settle the $3.50 delivery charge to release your package:
http://fastparcel-alerts.com/pay

Kind regards,
FastParcel Service`,
  },
] as const;

const ANALYSIS_TIMEOUT_MS = 15000;

const mapHistoryItemToAnalysisResult = (
  item: AnalysisHistoryItem
): AnalysisResult => ({
  score: item.analysis.score,
  riskLevel: normalizeRiskLevel(item.analysis.riskLevel),
  summary: item.analysis.summary,
  findings: item.analysis.findings,
  breakdown: createHistoryBreakdown(item.analysis.score),
  processingTime: 0,
});

export default function AnalyzerForm() {
  const [formData, setFormData] = useState({
    from: "",
    subject: "",
    body: "",
    headers: "",
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useML, setUseML] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [explanationModal, setExplanationModal] = useState<{
    isOpen: boolean;
    finding?: Finding;
  }>(() => ({ isOpen: false }));
  const [isTrustedSender, setIsTrustedSender] = useState(false);
  const [legitimacySnapshot, setLegitimacySnapshot] =
    useState<LegitimacySnapshot | null>(null);
  const [savingLegitimate, setSavingLegitimate] = useState(false);
  const [legitimateSaved, setLegitimateSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const senderAddress = formData.from;

  useEffect(() => {
    setIsTrustedSender(isSenderTrusted(senderAddress, { userId: user?.id }));
  }, [senderAddress, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let isActive = true;
    (async () => {
      await Promise.all([
        syncTrustedRecordsFromRemote(user.id),
        syncBehaviorSignalsFromRemote(user.id),
      ]);
      if (isActive) {
        setIsTrustedSender(isSenderTrusted(senderAddress, { userId: user.id }));
      }
    })();
    return () => {
      isActive = false;
    };
  }, [senderAddress, user?.id]);

  useEffect(() => {
    if (!result) {
      setLegitimacySnapshot(null);
      return;
    }
    setIsTrustedSender(isSenderTrusted(senderAddress, { userId: user?.id }));
    setLegitimacySnapshot(
      getLegitimacySnapshot({
        sender: senderAddress,
        analysis: result,
        userId: user?.id,
      })
    );
  }, [result, senderAddress, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setErrorMessage(null);

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      const analysisPromise = analyzeEmailV2(
        { ...formData, userId: user?.id || null },
        {
          enableML: useML,
          mlConfig: {
            enabled: useML,
            modelType: "client",
            confidenceThreshold: 0.5,
          },
          sensitivity: "medium",
        }
      );

      const timeoutPromise = new Promise<AnalysisResult>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error("Analysis timed out. Please try again."));
        }, ANALYSIS_TIMEOUT_MS);
      });

      const analysis = await Promise.race([analysisPromise, timeoutPromise]);

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      const rawScore = analysis.score;
      const roundedScore = Math.round(rawScore * 10) / 10;
      const normalizedAnalysis: AnalysisResult = {
        ...analysis,
        score: roundedScore,
      };

      setResult(normalizedAnalysis);
      setLegitimateSaved(false);

      try {
        const verdict =
          rawScore >= 60 ? "phishing" : rawScore >= 35 ? "suspicious" : "safe";
        recordBehaviorInteraction({
          sender: formData.from,
          verdict,
          userId: user?.id || null,
        });
      } catch (error) {
        console.error("Failed to record behavior signals:", error);
      }

      if (user) {
        try {
          await ScanService.createScan(user.id, {
            subject: formData.subject,
            body: formData.body,
            fromEmail: formData.from,
            riskScore: rawScore,
            verdict:
              rawScore >= 60
                ? "phishing"
                : rawScore >= 35
                ? "suspicious"
                : "safe",
            keywords: analysis.findings.map((finding) => finding.text),
            links: [],
            mlConfidence: analysis.breakdown?.ml?.confidence ?? 0,
          });
        } catch (error) {
          console.error("Error saving to cloud:", error);
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Analysis failed. Please try again."
      );
      setResult(null);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      setIsAnalyzing(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_EMAILS.find((item) => item.id === sampleId);
    if (!sample) return;
    setFormData({
      from: sample.from,
      subject: sample.subject,
      body: sample.body,
      headers: "",
    });
    setResult(null);
    setLegitimacySnapshot(null);
    setLegitimateSaved(false);
    setIsTrustedSender(isSenderTrusted(sample.from, { userId: user?.id }));
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  const resetForm = () => {
    setFormData({ from: "", subject: "", body: "", headers: "" });
    setResult(null);
    setLegitimacySnapshot(null);
    setLegitimateSaved(false);
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  const handleLoadAnalysis = (item: AnalysisHistoryItem) => {
    setFormData({
      from: item.email.from,
      subject: item.email.subject,
      body: item.email.body,
      headers: "",
    });
    const mappedResult = mapHistoryItemToAnalysisResult(item);
    setResult(mappedResult);
    setLegitimacySnapshot(
      getLegitimacySnapshot({
        sender: item.email.from,
        analysis: mappedResult,
        userId: user?.id,
      })
    );
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
          spfPassed: result?.breakdown?.headers?.details?.spfStatus === "pass",
          dkimPassed:
            result?.breakdown?.headers?.details?.dkimStatus === "pass",
          dmarcPassed:
            result?.breakdown?.headers?.details?.dmarcStatus === "pass",
        },
      });

      const offlineManager = OfflineLearningManager.getInstance();
      await offlineManager.initialize();
      offlineManager.addSample(
        { subject: formData.subject, body: formData.body, from: formData.from },
        "safe",
        { source: "trusted-confirmation" }
      );

      setLegitimateSaved(true);
      setIsTrustedSender(true);
      recordBehaviorInteraction({
        sender: formData.from,
        verdict: "safe",
        userId: user?.id || null,
      });
      setLegitimacySnapshot(
        getLegitimacySnapshot({
          sender: formData.from,
          analysis: result,
          userId: user?.id,
        })
      );
    } catch (error) {
      console.error("Failed to mark sender as legitimate:", error);
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
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">
          Email Security Analyzer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced phishing detection with AI-powered analysis
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white">
                    Email Analysis
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Paste email content to analyze for potential phishing
                    attempts
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
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Need inspiration? Load a sample email:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_EMAILS.map((sample) => (
                    <Button
                      key={sample.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadSample(sample.id)}
                      className="text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      {sample.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="from" className="dark:text-gray-300">
                    From
                  </Label>
                  <Input
                    id="from"
                    placeholder="sender@example.com"
                    value={formData.from}
                    onChange={(e) => handleInputChange("from", e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="dark:text-gray-300">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Email subject line"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="body" className="dark:text-gray-300">
                    Email Body
                  </Label>
                  <Textarea
                    id="body"
                    placeholder="Paste the full email content here..."
                    rows={8}
                    value={formData.body}
                    onChange={(e) => handleInputChange("body", e.target.value)}
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
                    {showHeaders ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    Advanced Options
                  </Button>

                  {showHeaders && (
                    <>
                      <div>
                        <Label htmlFor="headers" className="dark:text-gray-300">
                          Email Headers (Optional)
                        </Label>
                        <Textarea
                          id="headers"
                          placeholder="Paste raw email headers here for advanced analysis..."
                          rows={6}
                          value={formData.headers}
                          onChange={(e) =>
                            handleInputChange("headers", e.target.value)
                          }
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
                        <Label
                          htmlFor="useML"
                          className="text-sm dark:text-gray-300"
                        >
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
                    {isAnalyzing ? "Analyzing..." : "Analyze Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Clear
                  </Button>
                </div>
              </form>
              {errorMessage ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  {errorMessage}
                </div>
              ) : null}
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
                      {isExporting ? "Exporting..." : "PDF Report"}
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
              {result.breakdown && (
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
                    isPhishing: result.score >= 60,
                    confidence: result.score / 100,
                  }}
                />
              )}

              {/* Educational Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <SafetyTipsCarousel autoPlay={false} />
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Learn More
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Click the explain buttons next to findings to understand
                      why they were flagged.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExplanationModal({
                          isOpen: true,
                          finding: result.findings[0],
                        })
                      }
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
                      {result.findings.map((finding: Finding) => (
                        <div
                          key={finding.id}
                          className={`p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800/50 ${
                            finding.severity === "high"
                              ? "border-red-200 bg-red-50 dark:bg-red-900/20"
                              : finding.severity === "medium"
                              ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20"
                              : "border-gray-200 bg-gray-50 dark:bg-gray-800/50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {finding.severity === "high" && (
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                            )}
                            {finding.severity === "medium" && (
                              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            )}
                            {finding.severity === "low" && (
                              <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium dark:text-white">
                                {finding.text}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {finding.severity} severity • {finding.category}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExplanationModal({
                                  isOpen: true,
                                  finding,
                                })
                              }
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
                <p className="text-sm text-gray-600">
                  Enter email content and click &ldquo;Analyze Email&rdquo; to
                  get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

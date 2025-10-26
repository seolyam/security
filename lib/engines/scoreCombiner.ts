import patterns from '../data/patterns.json';
import { RuleEngine, RuleResult } from './ruleEngine';
import { HeaderEngine, HeaderResult } from './headerEngine';
import { MLEngine, MLResult, MLConfig } from './mlEngine';

export interface AnalysisResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  findings: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    text: string;
    meta?: any;
    category?: string;
  }>;
  breakdown: {
    rules: {
      score: number;
      percentage: number;
      details: RuleResult['details'];
    };
    headers: {
      score: number;
      percentage: number;
      details: HeaderResult['details'];
    };
    ml: {
      score: number;
      percentage: number;
      confidence: number;
      modelUsed: string;
    };
    misc: {
      score: number;
      percentage: number;
    };
  };
  processingTime: number;
}

export interface AnalysisConfig {
  enableML: boolean;
  mlConfig: MLConfig;
  sensitivity: 'low' | 'medium' | 'high';
}

export class ScoreCombiner {
  private ruleEngine: RuleEngine;
  private headerEngine: HeaderEngine;
  private mlEngine: MLEngine;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.ruleEngine = new RuleEngine();
    this.headerEngine = new HeaderEngine();
    this.mlEngine = new MLEngine(config.mlConfig);
  }

  async initialize(): Promise<void> {
    await this.mlEngine.initialize();
  }

  async analyze(content: {
    subject?: string;
    body?: string;
    from?: string;
    headers?: string;
  }): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Run all analyses in parallel
    const [ruleResult, headerResult, mlResult] = await Promise.all([
      this.ruleEngine.analyze(content),
      content.headers ? this.headerEngine.analyze(content.headers) : Promise.resolve({
        score: 0,
        findings: [],
        details: { receivedCount: 0, suspiciousHeaders: 0 }
      } as HeaderResult),
      this.mlEngine.analyze(content)
    ]);

    // Combine scores using the weighting system from patterns.json
    const weights = patterns.scoringWeights;

    let combinedScore = 0;
    let activeWeight = 0;
    const breakdown = {
      rules: {
        score: ruleResult.score,
        percentage: 0,
        details: ruleResult.details
      },
      headers: {
        score: headerResult.score,
        percentage: 0,
        details: headerResult.details
      },
      ml: {
        score: mlResult.score,
        percentage: 0,
        confidence: mlResult.confidence,
        modelUsed: mlResult.modelUsed
      },
      misc: {
        score: 0, // Will be calculated based on additional factors
        percentage: 0
      }
    };

    if (weights.keywords > 0) {
      combinedScore += ruleResult.score * weights.keywords;
      activeWeight += weights.keywords;
      breakdown.rules.percentage = weights.keywords;
    }

    const hasHeaders = Boolean(content.headers && content.headers.trim().length > 0);
    if (weights.headers > 0 && hasHeaders) {
      combinedScore += headerResult.score * weights.headers;
      activeWeight += weights.headers;
      breakdown.headers.percentage = weights.headers;
    }

    const mlEnabled = this.config.enableML && this.mlEngine.isReady();
    if (weights.ml > 0 && mlEnabled) {
      combinedScore += mlResult.score * weights.ml;
      activeWeight += weights.ml;
      breakdown.ml.percentage = weights.ml;
    }

    if (activeWeight > 0) {
      combinedScore /= activeWeight;
    }

    // Apply sensitivity adjustments
    const sensitivityMultiplier = this.getSensitivityMultiplier(this.config.sensitivity);
    combinedScore *= sensitivityMultiplier;

    // Combine all findings
    const allFindings = [
      ...ruleResult.findings,
      ...headerResult.findings,
      ...mlResult.findings
    ];

    breakdown.rules.percentage = activeWeight > 0 && breakdown.rules.percentage > 0
      ? (breakdown.rules.percentage / activeWeight) * 100
      : 0;
    breakdown.headers.percentage = activeWeight > 0 && breakdown.headers.percentage > 0
      ? (breakdown.headers.percentage / activeWeight) * 100
      : 0;
    breakdown.ml.percentage = activeWeight > 0 && breakdown.ml.percentage > 0
      ? (breakdown.ml.percentage / activeWeight) * 100
      : 0;

    // Determine risk level
    const riskLevel = combinedScore < 30 ? 'Low' : combinedScore < 70 ? 'Medium' : 'High';
    const summary = riskLevel === 'Low' ? 'Likely Safe' :
                   riskLevel === 'Medium' ? 'Suspicious' : 'Phishing';

    return {
      score: Math.min(100, combinedScore),
      riskLevel,
      summary,
      findings: allFindings,
      breakdown,
      processingTime: Date.now() - startTime
    };
  }

  private getSensitivityMultiplier(sensitivity: 'low' | 'medium' | 'high'): number {
    switch (sensitivity) {
      case 'high': return 1.2;
      case 'medium': return 1.0;
      case 'low': return 0.8;
      default: return 1.0;
    }
  }

  updateConfig(config: Partial<AnalysisConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      mlConfig: config.mlConfig
        ? { ...this.config.mlConfig, ...config.mlConfig }
        : this.config.mlConfig
    };
    if (typeof config.enableML === 'boolean') {
      this.config.enableML = config.enableML;
    }
    if (config.mlConfig) {
      this.mlEngine.updateConfig(config.mlConfig);
    }
  }

  getEngines() {
    return {
      ruleEngine: this.ruleEngine,
      headerEngine: this.headerEngine,
      mlEngine: this.mlEngine
    };
  }
}

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
    category: string;
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

  constructor(config: AnalysisConfig) {
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
    const breakdown = {
      rules: {
        score: ruleResult.score,
        percentage: weights.keywords * 100,
        details: ruleResult.details
      },
      headers: {
        score: headerResult.score,
        percentage: weights.headers * 100,
        details: headerResult.details
      },
      ml: {
        score: mlResult.score,
        percentage: weights.ml * 100,
        confidence: mlResult.confidence,
        modelUsed: mlResult.modelUsed
      },
      misc: {
        score: 0, // Will be calculated based on additional factors
        percentage: weights.misc * 100
      }
    };

    // Apply sensitivity adjustments
    const sensitivityMultiplier = this.getSensitivityMultiplier(content.headers ? 'medium' : 'low');

    // Calculate weighted score
    combinedScore += ruleResult.score * weights.keywords * sensitivityMultiplier;
    combinedScore += headerResult.score * weights.headers * sensitivityMultiplier;
    combinedScore += mlResult.score * weights.ml * sensitivityMultiplier;

    // Combine all findings
    const allFindings = [
      ...ruleResult.findings,
      ...headerResult.findings,
      ...mlResult.findings
    ];

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

import patterns from '../data/patterns.json';
import { RuleEngine, RuleResult } from './ruleEngine';
import { HeaderEngine, HeaderResult } from './headerEngine';
import { ReputationEngine, ReputationResult } from './reputationEngine';
import { BehaviorEngine, BehaviorResult } from './behaviorEngine';
import { MLEngine, MLConfig } from './mlEngine';
import type { Finding } from '../ruleEngine';

interface PatternWeightsConfig {
  heuristics?: number;
  keywords?: number;
  headers?: number;
  reputation?: number;
  behavior?: number;
  ml?: number;
  misc?: number;
}

interface PatternsConfig {
  scoringWeights?: PatternWeightsConfig;
  threatIntelSources?: string[];
}

const patternsConfig = patterns as PatternsConfig;

export interface AnalysisResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  findings: Finding[];
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
    reputation: {
      score: number;
      percentage: number;
      details: ReputationResult['details'];
    };
    behavior: {
      score: number;
      percentage: number;
      bonus: number;
      details: BehaviorResult['details'];
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
  private reputationEngine: ReputationEngine;
  private behaviorEngine: BehaviorEngine;
  private mlEngine: MLEngine;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.ruleEngine = new RuleEngine();
    this.headerEngine = new HeaderEngine();
    this.reputationEngine = new ReputationEngine();
    this.behaviorEngine = new BehaviorEngine();
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
    userId?: string | null;
  }): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Run all analyses in parallel
    const [ruleResult, headerResult, reputationResult, behaviorResult, mlResult] = await Promise.all([
      this.ruleEngine.analyze(content),
      content.headers ? this.headerEngine.analyze(content.headers) : Promise.resolve({
        score: 0,
        findings: [],
        details: { receivedCount: 0, suspiciousHeaders: 0 }
      } as HeaderResult),
      this.reputationEngine.analyze(content),
      Promise.resolve(this.behaviorEngine.analyze({ from: content.from, userId: content.userId || null })),
      this.mlEngine.analyze(content)
    ]);

    // Combine scores using the weighting system from patterns.json
    const scoringWeights = patternsConfig.scoringWeights ?? {};
    const weights = {
      heuristics: scoringWeights.heuristics ?? scoringWeights.keywords ?? 0.3,
      headers: scoringWeights.headers ?? 0.2,
      reputation: scoringWeights.reputation ?? 0.2,
      behavior: scoringWeights.behavior ?? 0.1,
      ml: scoringWeights.ml ?? 0.2,
      misc: scoringWeights.misc ?? 0
    };

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
      reputation: {
        score: reputationResult.score,
        percentage: 0,
        details: reputationResult.details
      },
      behavior: {
        score: behaviorResult.score,
        percentage: 0,
        bonus: behaviorResult.bonus,
        details: behaviorResult.details
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

    if (weights.heuristics > 0) {
      combinedScore += ruleResult.score * weights.heuristics;
      activeWeight += weights.heuristics;
      breakdown.rules.percentage = weights.heuristics;
    }

    const hasHeaders = Boolean(content.headers && content.headers.trim().length > 0);
    if (weights.headers > 0 && hasHeaders) {
      combinedScore += headerResult.score * weights.headers;
      activeWeight += weights.headers;
      breakdown.headers.percentage = weights.headers;
    }

    if (weights.reputation > 0) {
      combinedScore += reputationResult.score * weights.reputation;
      activeWeight += weights.reputation;
      breakdown.reputation.percentage = weights.reputation;
    }

    if (weights.behavior > 0) {
      combinedScore += behaviorResult.score * weights.behavior;
      activeWeight += weights.behavior;
      breakdown.behavior.percentage = weights.behavior;
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

    if (weights.behavior > 0 && behaviorResult.bonus > 0) {
      const weightedBonus = behaviorResult.bonus * weights.behavior * sensitivityMultiplier;
      combinedScore = Math.max(0, combinedScore - weightedBonus);
    }

    // Combine all findings
    const allFindings = [
      ...ruleResult.findings,
      ...headerResult.findings,
      ...reputationResult.findings,
      ...behaviorResult.findings,
      ...behaviorResult.bonusFindings,
      ...mlResult.findings
    ];

    const normalizePercentage = (value: number) =>
      activeWeight > 0 && value > 0 ? (value / activeWeight) * 100 : 0;

    breakdown.rules.percentage = normalizePercentage(breakdown.rules.percentage);
    breakdown.headers.percentage = normalizePercentage(breakdown.headers.percentage);
    breakdown.reputation.percentage = normalizePercentage(breakdown.reputation.percentage);
    breakdown.behavior.percentage = normalizePercentage(breakdown.behavior.percentage);
    breakdown.ml.percentage = normalizePercentage(breakdown.ml.percentage);

    // Determine risk level
    const riskLevel = combinedScore < 35 ? 'Low' : combinedScore < 60 ? 'Medium' : 'High';
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
      reputationEngine: this.reputationEngine,
      behaviorEngine: this.behaviorEngine,
      mlEngine: this.mlEngine
    };
  }
}

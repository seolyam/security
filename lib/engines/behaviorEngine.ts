import { BehaviorSignals, getBehaviorSignals } from '../services/behaviorService';
import { isSenderTrusted } from '../services/trustedService';
import { Finding } from '../ruleEngine';

export interface BehaviorResult {
  score: number;
  findings: Finding[];
  bonus: number;
  bonusFindings: Finding[];
  details: BehaviorSignals & {
    trustedSender: boolean;
  };
}

const HIGH_SCORE = 45;
const MEDIUM_SCORE = 25;
const LOW_SCORE = 10;

export class BehaviorEngine {
  analyze(content: { from?: string | null; userId?: string | null }): BehaviorResult {
    const signals = getBehaviorSignals(content.from || null, content.userId || null);
    const trustedSender = isSenderTrusted(content.from, { userId: content.userId || null });
    const hasUserContext = Boolean(content.userId);
    const findings: Finding[] = [];
    const bonusFindings: Finding[] = [];
    let score = 0;
    let bonus = 0;

    if (hasUserContext && signals.phishingInteractions > 0) {
      findings.push({
        id: 'behavior-previous-phish',
        severity: 'high',
        text: 'This sender previously delivered phishing content',
        category: 'behavior',
        meta: { phishingInteractions: signals.phishingInteractions }
      });
      score += HIGH_SCORE;
    }

    if (hasUserContext && (signals.totalInteractions === 0 || signals.isFirstInteraction)) {
      findings.push({
        id: 'behavior-first-contact',
        severity: 'medium',
        text: 'First interaction with this sender',
        category: 'behavior',
        meta: { totalInteractions: signals.totalInteractions }
      });
      score += MEDIUM_SCORE;
    }

    if (hasUserContext && signals.daysSinceLastInteraction !== null && signals.daysSinceLastInteraction > 180) {
      findings.push({
        id: 'behavior-long-dormant',
        severity: 'low',
        text: `Sender has been dormant for ${signals.daysSinceLastInteraction} days`,
        category: 'behavior',
        meta: { daysSinceLast: signals.daysSinceLastInteraction }
      });
      score += LOW_SCORE;
    }

    if (trustedSender) {
      bonus += 20;
      bonusFindings.push({
        id: 'behavior-trusted-sender',
        severity: 'low',
        text: 'Sender confirmed as legitimate previously',
        category: 'behavior-positive'
      });
    }

    if (hasUserContext && signals.safeInteractions >= 3 && signals.phishingInteractions === 0) {
      bonus += 15;
      bonusFindings.push({
        id: 'behavior-frequent-safe',
        severity: 'low',
        text: 'Multiple past safe interactions with this sender',
        category: 'behavior-positive',
        meta: { safeInteractions: signals.safeInteractions }
      });
    }

    return {
      score: Math.min(100, score),
      bonus: Math.min(45, bonus),
      findings,
      bonusFindings,
      details: {
        ...signals,
        trustedSender
      }
    };
  }
}

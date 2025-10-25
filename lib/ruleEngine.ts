import { ScoreCombiner, AnalysisResult, AnalysisConfig } from './engines/scoreCombiner';

export type Finding = {
  id: string;
  severity: 'low' | 'medium' | 'high';
  text: string;
  meta?: any;
  startIndex?: number;
  endIndex?: number;
  category?: string;
};

const phishingKeywords = [
  'urgent', 'verify', 'password', 'account suspended', 'click here',
  'update your account', 'confirm your account', 'security alert',
  'immediate action required', 'verify your identity', 'suspicious login attempt'
];

// Legacy synchronous analysis function (for backward compatibility)
export function analyzeEmail(content: {
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
  headers?: string;
}) {
  const { subject = '', body = '', from = '' } = content;
  const fullText = `${subject} ${body}`.toLowerCase();

  // Check for suspicious keywords (legacy implementation)
  const findings: Finding[] = [];
  phishingKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      findings.push({
        id: `keyword-${keyword}-${match.index}`,
        severity: 'medium',
        text: `Suspicious keyword found: "${keyword}"`,
        startIndex: match.index,
        endIndex: match.index + keyword.length
      });
    }
  });

  // Check for suspicious sender domains (legacy implementation)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const senderEmails = from.match(emailRegex) || [];

  senderEmails.forEach(email => {
    const domain = email.split('@')[1];
    if (domain &&
        (domain.includes('bank') ||
         domain.includes('paypal') ||
         domain.includes('security') ||
         domain.includes('verify'))) {
      findings.push({
        id: `sender-domain-${domain}`,
        severity: 'high',
        text: `Suspicious sender domain: ${domain}`,
        meta: { domain }
      });
    }
  });

  // Calculate risk score (0-100, higher is more suspicious)
  const score = Math.min(100, findings.length * 15);

  return {
    findings,
    score,
    riskLevel: score < 30 ? 'Low' : score < 70 ? 'Medium' : 'High'
  };
}

// New modular analysis function using v2.0 architecture
export async function analyzeEmailV2(content: {
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
  headers?: string;
}, config?: Partial<AnalysisConfig>): Promise<AnalysisResult> {

  const analysisConfig: AnalysisConfig = {
    enableML: config?.enableML ?? false,
    mlConfig: config?.mlConfig ?? {
      enabled: false,
      modelType: 'client',
      confidenceThreshold: 0.5
    },
    sensitivity: config?.sensitivity ?? 'medium'
  };

  const combiner = new ScoreCombiner(analysisConfig);
  await combiner.initialize();

  return await combiner.analyze(content);
}

// Main export - use the new v2 function by default
export { analyzeEmailV2 as analyzeEmailAdvanced };
export default analyzeEmail;

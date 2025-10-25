import { analyzeEmailHeaders, parseEmailHeaders, formatHeaderAnalysis } from './headerAnalysis';
import { predictWithML } from './mlClassifier';

export type Finding = {
  id: string;
  severity: 'low' | 'medium' | 'high';
  text: string;
  meta?: any;
  startIndex?: number;
  endIndex?: number;
};

const phishingKeywords = [
  'urgent',
  'verify',
  'password',
  'account suspended',
  'click here',
  'update your account',
  'confirm your account',
  'security alert',
  'immediate action required',
  'verify your identity',
  'suspicious login attempt',
  'unusual sign-in',
  'account on hold',
  'limited time offer',
  'free',
  'congratulations',
  'you won',
  'prize',
  'lottery',
];

const suspiciousDomains = [
  'paypal-secure.com',
  'secure-paypal.com',
  'appleid.apple.verify.com',
  'microsoft-support.com',
  'amazon-security.com',
];

function findKeywords(text: string): { word: string; index: number }[] {
  const lower = text.toLowerCase();
  const found: { word: string; index: number }[] = [];

  phishingKeywords.forEach((word) => {
    let index = -1;
    do {
      index = lower.indexOf(word, index + 1);
      if (index !== -1) {
        found.push({ word, index });
      }
    } while (index !== -1);
  });

  return found.sort((a, b) => a.index - b.index);
}

export async function analyzeEmail(content: {
  subject?: string;
  body?: string;
  from?: string;
  to?: string;
  headers?: string;
}, useML: boolean = false) {
  const findings: Finding[] = [];
  const { subject = '', body = '', from = '', headers = '' } = content;
  const fullText = `${subject} ${body}`.toLowerCase();

  // 1) Check for suspicious keywords
  const keywordMatches = findKeywords(`${subject} ${body}`);
  if (keywordMatches.length > 0) {
    keywordMatches.forEach((match) => {
      findings.push({
        id: `keyword-${match.word}-${match.index}`,
        severity: 'medium',
        text: `Suspicious keyword found: "${match.word}"`,
        meta: { keyword: match.word },
        startIndex: match.index,
        endIndex: match.index + match.word.length,
      });
    });
  }

  // 2) Check for suspicious URLs
  const urlRegex = /(https?:\/\/[^\s)"]+)/gi;
  const urls = (body || '').match(urlRegex) || [];

  if (urls.length > 0) {
    const suspiciousUrls = urls.filter(url => {
      const domain = url.toLowerCase();
      return suspiciousDomains.some(suspicious => domain.includes(suspicious)) ||
             /bit\.ly|tinyurl|goo\.gl|t\.co|tiny\.cc/.test(domain);
    });

    if (suspiciousUrls.length > 0) {
      findings.push({
        id: 'suspicious-urls',
        severity: 'high',
        text: `Found suspicious URLs: ${suspiciousUrls.join(', ')}`,
        meta: { urls: suspiciousUrls },
      });
    }
  }

  // 3) Check for suspicious sender domains
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const senderEmails = from.match(emailRegex) || [];

  senderEmails.forEach(email => {
    const domain = email.split('@')[1];
    if (domain &&
        (domain.includes('bank') ||
         domain.includes('paypal') ||
         domain.includes('security') ||
         domain.includes('verify') ||
         /\d+\.\d+\.\d+\.\d+/.test(email))) {
      findings.push({
        id: `sender-domain-${domain}`,
        severity: 'high',
        text: `Suspicious sender domain: ${domain}`,
        meta: { domain }
      });
    }
  });

  // 4) Check for attachment indicators
  if (/\.exe|\.scr|\.zip|\.scr/i.test(body || '')) {
    findings.push({
      id: 'attachment',
      severity: 'high',
      text: 'Suspicious attachment extension found',
    });
  }

  // 5) Check for HTML indicators
  if (/<script|<form|<iframe/i.test(body || '')) {
    findings.push({
      id: 'html-indicators',
      severity: 'medium',
      text: 'Email contains HTML elements that could be malicious',
    });
  }

  // 6) Analyze email headers if provided
  let headerAnalysis: any = null;
  if (headers) {
    try {
      const parsedHeaders = parseEmailHeaders(headers);
      headerAnalysis = analyzeEmailHeaders(parsedHeaders);

      // Add header-based findings
      if (headerAnalysis.spf?.status === 'fail') {
        findings.push({
          id: 'spf-fail',
          severity: 'high',
          text: 'SPF authentication failed - email may be spoofed',
          meta: { spf: headerAnalysis.spf }
        });
      }

      if (headerAnalysis.dkim?.status === 'fail') {
        findings.push({
          id: 'dkim-fail',
          severity: 'high',
          text: 'DKIM signature verification failed',
          meta: { dkim: headerAnalysis.dkim }
        });
      }

      if (headerAnalysis.dmarc?.status === 'fail') {
        findings.push({
          id: 'dmarc-fail',
          severity: 'medium',
          text: 'DMARC policy violation detected',
          meta: { dmarc: headerAnalysis.dmarc }
        });
      }

      if (headerAnalysis.received.count > 5) {
        findings.push({
          id: 'too-many-hops',
          severity: 'medium',
          text: `Email passed through ${headerAnalysis.received.count} servers (unusual)`,
          meta: { hops: headerAnalysis.received.count }
        });
      }

      if (headerAnalysis.suspiciousHeaders && headerAnalysis.suspiciousHeaders.length > 0) {
        headerAnalysis.suspiciousHeaders.forEach((suspicious: any) => {
          findings.push({
            id: `suspicious-header-${suspicious.header}`,
            severity: 'low',
            text: `Suspicious header detected: ${suspicious.header} - ${suspicious.reason}`,
            meta: suspicious
          });
        });
      }
    } catch (error) {
      console.error('Error analyzing headers:', error);
    }
  }

  // 7) ML Analysis (optional)
  let mlScore = 0;
  let mlUsed = false;
  if (useML) {
    try {
      mlScore = await predictWithML(fullText);
      mlUsed = true;

      // Add ML-based finding if confidence is high
      if (mlScore > 0.7) {
        findings.push({
          id: 'ml-high-risk',
          severity: 'high',
          text: `ML analysis indicates high phishing probability (${Math.round(mlScore * 100)}%)`,
          meta: { mlScore, mlUsed: true }
        });
      } else if (mlScore > 0.4) {
        findings.push({
          id: 'ml-medium-risk',
          severity: 'medium',
          text: `ML analysis indicates moderate phishing probability (${Math.round(mlScore * 100)}%)`,
          meta: { mlScore, mlUsed: true }
        });
      }
    } catch (error) {
      console.error('Error with ML analysis:', error);
    }
  }

  // Calculate risk score (0-100, higher is more suspicious)
  let score = 0;
  findings.forEach(finding => {
    switch (finding.severity) {
      case 'high':
        score += 35;
        break;
      case 'medium':
        score += 15;
        break;
      case 'low':
        score += 5;
        break;
    }
  });

  // Incorporate ML score if available
  if (mlUsed && mlScore > 0) {
    score = Math.max(score, mlScore * 100);
  }

  const riskLevel = score < 30 ? 'Low' : score < 70 ? 'Medium' : 'High';

  return {
    findings,
    score: Math.min(100, score),
    riskLevel,
    summary: riskLevel === 'Low' ? 'Likely Safe' : riskLevel === 'Medium' ? 'Suspicious' : 'Phishing',
    headerAnalysis,
    mlAnalysis: mlUsed ? { score: mlScore, used: true } : { used: false },
    headerSummary: headerAnalysis ? formatHeaderAnalysis(headerAnalysis) : undefined,
  };
}

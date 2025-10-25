import { analyzeEmailHeaders, parseEmailHeaders } from '../headerAnalysis';

export interface HeaderResult {
  score: number;
  findings: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    text: string;
    meta?: any;
    category?: string;
  }>;
  details: {
    spfStatus?: string;
    dkimStatus?: string;
    dmarcStatus?: string;
    receivedCount: number;
    suspiciousHeaders: number;
  };
}

export class HeaderEngine {
  async analyze(headersText: string): Promise<HeaderResult> {
    const findings: HeaderResult['findings'] = [];

    if (!headersText.trim()) {
      return {
        score: 0,
        findings: [],
        details: {
          receivedCount: 0,
          suspiciousHeaders: 0
        }
      };
    }

    try {
      const parsedHeaders = parseEmailHeaders(headersText);
      const headerAnalysis = analyzeEmailHeaders(parsedHeaders);

      let score = 0;

      // SPF Analysis
      if (headerAnalysis.spf) {
        if (headerAnalysis.spf.status === 'fail') {
          findings.push({
            id: 'spf-fail',
            severity: 'high',
            text: 'SPF authentication failed - email may be spoofed',
            meta: { spf: headerAnalysis.spf },
            category: 'authentication'
          });
          score += 35;
        } else if (headerAnalysis.spf.status === 'softfail') {
          findings.push({
            id: 'spf-softfail',
            severity: 'medium',
            text: 'SPF soft failure - email may be suspicious',
            meta: { spf: headerAnalysis.spf },
            category: 'authentication'
          });
          score += 20;
        }
      }

      // DKIM Analysis
      if (headerAnalysis.dkim) {
        if (headerAnalysis.dkim.status === 'fail') {
          findings.push({
            id: 'dkim-fail',
            severity: 'high',
            text: 'DKIM signature verification failed',
            meta: { dkim: headerAnalysis.dkim },
            category: 'authentication'
          });
          score += 35;
        }
      }

      // DMARC Analysis
      if (headerAnalysis.dmarc) {
        if (headerAnalysis.dmarc.status === 'fail') {
          findings.push({
            id: 'dmarc-fail',
            severity: 'medium',
            text: 'DMARC policy violation detected',
            meta: { dmarc: headerAnalysis.dmarc },
            category: 'authentication'
          });
          score += 25;
        }
      }

      // Received Headers Analysis
      if (headerAnalysis.received && headerAnalysis.received.count > 5) {
        findings.push({
          id: 'too-many-hops',
          severity: 'medium',
          text: `Email passed through ${headerAnalysis.received.count} servers (unusual)`,
          meta: { hops: headerAnalysis.received.count },
          category: 'routing'
        });
        score += 15;
      }

      // Suspicious Headers Analysis
      if (headerAnalysis.suspiciousHeaders && headerAnalysis.suspiciousHeaders.length > 0) {
        headerAnalysis.suspiciousHeaders.forEach((suspicious: any) => {
          findings.push({
            id: `suspicious-header-${suspicious.header}`,
            severity: 'low',
            text: `Suspicious header detected: ${suspicious.header} - ${suspicious.reason}`,
            meta: suspicious,
            category: 'headers'
          });
        });
        score += headerAnalysis.suspiciousHeaders.length * 5;
      }

      // Analyze domain consistency
      const fromHeader = parsedHeaders.find(h => h.name === 'from');
      const returnPathHeader = parsedHeaders.find(h => h.name === 'return-path');

      if (fromHeader && returnPathHeader) {
        const fromDomain = this.extractDomain(fromHeader.value);
        const returnPathDomain = this.extractDomain(returnPathHeader.value);

        if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
          findings.push({
            id: 'domain-mismatch',
            severity: 'medium',
            text: `Domain mismatch: From (${fromDomain}) vs Return-Path (${returnPathDomain})`,
            meta: { fromDomain, returnPathDomain },
            category: 'domains'
          });
          score += 20;
        }
      }

      return {
        score: Math.min(100, score),
        findings,
        details: {
          spfStatus: headerAnalysis.spf?.status,
          dkimStatus: headerAnalysis.dkim?.status,
          dmarcStatus: headerAnalysis.dmarc?.status,
          receivedCount: headerAnalysis.received?.count || 0,
          suspiciousHeaders: headerAnalysis.suspiciousHeaders?.length || 0
        }
      };

    } catch (error) {
      console.error('Error analyzing headers:', error);
      return {
        score: 0,
        findings: [{
          id: 'header-error',
          severity: 'low',
          text: 'Error parsing email headers',
          meta: { error: error instanceof Error ? error.message : 'Unknown error' },
          category: 'errors'
        }],
        details: {
          receivedCount: 0,
          suspiciousHeaders: 0
        }
      };
    }
  }

  private extractDomain(emailOrHeader: string): string | null {
    const emailMatch = emailOrHeader.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[1] : null;
  }

  getSupportedAuthMethods(): string[] {
    return ['SPF', 'DKIM', 'DMARC'];
  }
}

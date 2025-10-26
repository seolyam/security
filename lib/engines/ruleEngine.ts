/**
 * @fileoverview Rule-based phishing detection engine
 *
 * This module implements heuristic-based analysis for detecting phishing patterns
 * in email content. It analyzes keywords, URLs, domains, and structural elements
 * to identify potential phishing attempts.
 *
 * @author PhishingSense Team
 * @version 2.0.0
 * @since 2024
 */

import { Finding } from '../ruleEngine';
import patterns from '../data/patterns.json';

/**
 * Configuration options for rule-based analysis
 */
export interface RuleEngineConfig {
  /** Sensitivity level for detection (lenient, balanced, strict) */
  sensitivity?: 'lenient' | 'balanced' | 'strict';
  /** Enable URL analysis */
  enableUrlAnalysis?: boolean;
  /** Enable domain validation */
  enableDomainAnalysis?: boolean;
  /** Enable attachment analysis */
  enableAttachmentAnalysis?: boolean;
  /** Custom keyword weights override */
  customWeights?: { [keyword: string]: number };
}

export interface RuleResult {
  findings: Finding[];
  score: number;
  details: {
    keywordScore: number;
    urlScore: number;
    domainScore: number;
    attachmentScore: number;
    htmlScore: number;
  };
}

export class RuleEngine {
  private patterns: any;

  constructor() {
    this.patterns = patterns;
  }

  async analyze(content: {
    subject?: string;
    body?: string;
    from?: string;
    to?: string;
  }): Promise<RuleResult> {
    const findings: Finding[] = [];
    const { subject = '', body = '', from = '' } = content;
    const fullText = `${subject} ${body}`.toLowerCase();

    // 1. Keyword Analysis
    const keywordFindings = this.analyzeKeywords(fullText, subject + ' ' + body);
    findings.push(...keywordFindings);

    // 2. URL Analysis
    const urlFindings = this.analyzeUrls(body);
    findings.push(...urlFindings);

    // 3. Domain Analysis
    const domainFindings = this.analyzeDomains(from, body);
    findings.push(...domainFindings);

    // 4. Attachment Analysis
    const attachmentFindings = this.analyzeAttachments(body);
    findings.push(...attachmentFindings);

    // 5. HTML Analysis
    const htmlFindings = this.analyzeHtml(body);
    findings.push(...htmlFindings);

    // Calculate detailed scores
    const details = {
      keywordScore: this.calculateKeywordScore(keywordFindings),
      urlScore: this.calculateUrlScore(urlFindings),
      domainScore: this.calculateDomainScore(domainFindings),
      attachmentScore: this.calculateAttachmentScore(attachmentFindings),
      htmlScore: this.calculateHtmlScore(htmlFindings)
    };

    // Calculate total rule score (0-100)
    const totalScore = Math.min(100,
      (details.keywordScore * 0.3) +
      (details.urlScore * 0.3) +
      (details.domainScore * 0.2) +
      (details.attachmentScore * 0.15) +
      (details.htmlScore * 0.05)
    );

    return {
      findings,
      score: totalScore,
      details
    };
  }

  private analyzeKeywords(text: string, originalText: string): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(this.patterns.phishingKeywords).forEach(([category, config]: [string, any]) => {
      config.patterns.forEach((pattern: string) => {
        let index = -1;
        do {
          index = lowerText.indexOf(pattern, index + 1);
          if (index !== -1) {
            const endIndex = index + pattern.length;
            findings.push({
              id: `keyword-${category}-${pattern}-${index}`,
              severity: config.severity,
              text: `Suspicious ${category} keyword found: "${pattern}"`,
              meta: { category, pattern, weight: config.weight },
              startIndex: index,
              endIndex: endIndex,
              category: 'keywords'
            });
          }
        } while (index !== -1);
      });
    });

    return findings;
  }

  private analyzeUrls(body: string): Finding[] {
    const findings: Finding[] = [];
    const urlRegex = /(https?:\/\/[^\s)"]+)/gi;
    const urls = body.match(urlRegex) || [];

    urls.forEach((url, index) => {
      const lowerUrl = url.toLowerCase();
      let severity: 'low' | 'medium' | 'high' = 'low';
      let reason = '';

      // Check for suspicious domains
      if (this.patterns.suspiciousDomains.some((domain: string) => lowerUrl.includes(domain))) {
        severity = 'high';
        reason = 'matches known suspicious domain';
      }
      // Check for shorteners
      else if (this.patterns.urlPatterns.shorteners.some((shortener: string) => lowerUrl.includes(shortener))) {
        severity = 'medium';
        reason = 'uses URL shortener service';
      }
      // Check for suspicious keywords in URL
      else if (this.patterns.urlPatterns.suspicious.some((keyword: string) => lowerUrl.includes(keyword))) {
        severity = 'medium';
        reason = 'contains suspicious keywords in URL';
      }

      if (severity !== 'low') {
        findings.push({
          id: `url-suspicious-${index}`,
          severity,
          text: `Suspicious URL detected: ${url} (${reason})`,
          meta: { url, reason },
          category: 'urls'
        });
      }
    });

    return findings;
  }

  private analyzeDomains(from: string, body: string): Finding[] {
    const findings: Finding[] = [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const senderEmails = from.match(emailRegex) || [];

    senderEmails.forEach((email, index) => {
      const domain = email.split('@')[1];
      if (domain) {
        const lowerDomain = domain.toLowerCase();

        // Check if domain is in suspicious list
        if (this.patterns.suspiciousDomains.some((suspicious: string) => lowerDomain.includes(suspicious))) {
          findings.push({
            id: `domain-suspicious-${index}`,
            severity: 'high',
            text: `Suspicious sender domain detected: ${domain}`,
            meta: { domain, email },
            category: 'domains'
          });
        }
        // Check for IP addresses in email (spoofing indicator)
        else if (this.patterns.urlPatterns.ipPatterns.some((pattern: string) => new RegExp(pattern).test(email))) {
          findings.push({
            id: `domain-ip-${index}`,
            severity: 'medium',
            text: `IP address in sender email: ${email}`,
            meta: { domain, email },
            category: 'domains'
          });
        }
      }
    });

    return findings;
  }

  private analyzeAttachments(body: string): Finding[] {
    const findings: Finding[] = [];
    const sanitizedBody = body.replace(/https?:\/\/\S+/gi, ' ');

    this.patterns.attachmentPatterns.suspicious.forEach((extension: string) => {
      const attachmentRegex = new RegExp(`\\b[\\w-]+${extension.replace('.', '\\.')}(?:\\b|$)`, 'i');
      if (attachmentRegex.test(sanitizedBody)) {
        findings.push({
          id: `attachment-${extension}`,
          severity: 'high',
          text: `Suspicious attachment extension found: ${extension}`,
          meta: { extension },
          category: 'attachments'
        });
      }
    });

    return findings;
  }

  private analyzeHtml(body: string): Finding[] {
    const findings: Finding[] = [];

    Object.entries(this.patterns.htmlIndicators).forEach(([type, indicators]) => {
      (indicators as string[]).forEach((indicator: string) => {
        if (body.toLowerCase().includes(indicator.toLowerCase())) {
          findings.push({
            id: `html-${type}-${indicator}`,
            severity: 'low',
            text: `HTML element detected: ${indicator}`,
            meta: { type, indicator },
            category: 'html'
          });
        }
      });
    });

    return findings;
  }

  private calculateKeywordScore(findings: Finding[]): number {
    return findings.reduce((score, finding) => {
      const weight = this.patterns.phishingKeywords[finding.meta?.category]?.weight || 10;
      return score + (finding.severity === 'high' ? weight * 1.5 : finding.severity === 'medium' ? weight : weight * 0.5);
    }, 0);
  }

  private calculateUrlScore(findings: Finding[]): number {
    return findings.reduce((score, finding) => {
      return score + (finding.severity === 'high' ? 30 : finding.severity === 'medium' ? 20 : 10);
    }, 0);
  }

  private calculateDomainScore(findings: Finding[]): number {
    return findings.reduce((score, finding) => {
      return score + (finding.severity === 'high' ? 35 : finding.severity === 'medium' ? 25 : 15);
    }, 0);
  }

  private calculateAttachmentScore(findings: Finding[]): number {
    return findings.reduce((score, finding) => {
      return score + (finding.severity === 'high' ? 40 : 30);
    }, 0);
  }

  private calculateHtmlScore(findings: Finding[]): number {
    return findings.length * 5; // Each HTML indicator adds 5 points
  }

  getPatterns() {
    return this.patterns;
  }
}

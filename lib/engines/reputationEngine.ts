import patterns from '../data/patterns.json';
import { Finding } from '../ruleEngine';
import {
  extractEmailParts,
  stripSubdomain,
  normalizeDomain,
  levenshtein,
  containsSuspiciousUnicode,
  hasNumericLookalike
} from '../utils';
import { getThreatIntelData, ThreatIntelData } from '../services/threatIntelService';

export interface ReputationResult {
  score: number;
  findings: Finding[];
  details: {
    emailAddress?: string | null;
    domain?: string | null;
    displayName?: string | null;
    matchedBrand?: string | null;
    lookalikeDistance?: number | null;
    suspiciousTokens?: string[];
  };
}

interface BrandProfile {
  name: string;
  variants: string[];
}

const HIGH_SCORE = 40;
const MEDIUM_SCORE = 25;

export class ReputationEngine {
  private trustedDomains: Set<string>;
  private brandProfiles: BrandProfile[];
  private threatIntel: ThreatIntelData | null = null;

  constructor() {
    const trusted = [
      ...(patterns.legitimateDomains || []),
      ...Object.values(patterns.trustedDomains || {}).flat()
    ];
    this.trustedDomains = new Set(trusted.map((d: string) => normalizeDomain(d)));

    const templateBrands = Object.keys(patterns.phishingTemplates || {});
    const coreBrands = trusted.map(domain => stripSubdomain(domain).split('.')[0]);
    const brandSet = new Set<string>([...templateBrands, ...coreBrands].map(b => b.toLowerCase()));

    this.brandProfiles = Array.from(brandSet).map(brand => ({
      name: brand,
      variants: [brand, brand.replace(/[^a-z0-9]/g, '')]
    }));
  }

  private async ensureThreatIntelLoaded(): Promise<void> {
    if (!this.threatIntel) {
      try {
        this.threatIntel = await getThreatIntelData();
      } catch (error) {
        console.warn('Unable to load threat intel, falling back to defaults:', error);
        this.threatIntel = null;
      }
    }
  }

  async analyze(content: { from?: string; subject?: string; body?: string }): Promise<ReputationResult> {
    const findings: Finding[] = [];
    const { displayName, address, domain } = extractEmailParts(content.from || '');
    const normalizedDomain = normalizeDomain(domain);

    await this.ensureThreatIntelLoaded();

    if (!address || !normalizedDomain) {
      return {
        score: 0,
        findings,
        details: {
          emailAddress: address,
          domain: normalizedDomain,
          displayName: displayName || null,
          matchedBrand: null,
          lookalikeDistance: null,
          suspiciousTokens: []
        }
      };
    }

    const suspiciousTokens: string[] = [];
    let score = 0;
    let matchedBrand: string | null = null;
    let lookalikeDistance: number | null = null;

    const baseDomain = stripSubdomain(normalizedDomain).split('.')[0];

    if (this.threatIntel?.maliciousDomains?.some(indicator => normalizedDomain.endsWith(indicator.toLowerCase()))) {
      findings.push({
        id: `threatintel-domain-${normalizedDomain}`,
        severity: 'high',
        text: `Domain ${normalizedDomain} appears in external threat intelligence feeds`,
        category: 'reputation',
        meta: { indicator: normalizedDomain }
      });
      score += HIGH_SCORE;
      suspiciousTokens.push('threat-intel-domain');
    }

    // Detect brand impersonation via display name mismatch
    if (displayName) {
      const lowerDisplay = displayName.toLowerCase();
      for (const profile of this.brandProfiles) {
        if (profile.variants.some(variant => lowerDisplay.includes(variant))) {
          matchedBrand = profile.name;
          if (!this.isDomainTrusted(normalizedDomain) && !normalizedDomain.includes(profile.name)) {
            findings.push({
              id: `display-mismatch-${profile.name}`,
              severity: 'high',
              text: `Display name references "${profile.name}" but domain (${normalizedDomain}) differs`,
              category: 'reputation',
              meta: { profile: profile.name, domain: normalizedDomain }
            });
            score += HIGH_SCORE;
          }
          break;
        }
      }
    }

    // Lookalike detection using Levenshtein distance
    for (const profile of this.brandProfiles) {
      const distance = levenshtein(baseDomain, profile.name);
      if (distance > 0 && distance <= 2 && baseDomain.length > 3) {
        lookalikeDistance = distance;
        if (!this.isDomainTrusted(normalizedDomain)) {
          findings.push({
            id: `lookalike-${profile.name}`,
            severity: distance === 1 ? 'high' : 'medium',
            text: `Domain ${normalizedDomain} is similar to trusted brand "${profile.name}"`,
            category: 'reputation',
            meta: { distance, domain: normalizedDomain, brand: profile.name }
          });
          score += distance === 1 ? HIGH_SCORE : MEDIUM_SCORE;
          break;
        }
      }
    }

    // Brand keyword embedded in domain with extra tokens (e.g., brand-secure.com)
    for (const profile of this.brandProfiles) {
      if (normalizedDomain.includes(profile.name) && !this.isDomainTrusted(normalizedDomain)) {
        const stripped = baseDomain.replace(/[^a-z0-9]/gi, '');
        if (stripped !== profile.name) {
          findings.push({
            id: `embedded-brand-${profile.name}`,
            severity: 'high',
            text: `Domain ${normalizedDomain} embeds trusted brand "${profile.name}" with additional wording`,
            category: 'reputation',
            meta: { domain: normalizedDomain, brand: profile.name }
          });
          score += HIGH_SCORE;
          matchedBrand = matchedBrand || profile.name;
          suspiciousTokens.push('brand-embedding');
          break;
        }
      }
    }

    // Suspicious unicode or numeric substitutions
    if (containsSuspiciousUnicode(normalizedDomain) || containsSuspiciousUnicode(displayName || '') ) {
      findings.push({
        id: 'unicode-domain',
        severity: 'medium',
        text: 'Domain or sender name uses non-ASCII characters',
        category: 'reputation',
        meta: { domain: normalizedDomain, displayName }
      });
      score += MEDIUM_SCORE;
      suspiciousTokens.push('unicode');
    }

    if (hasNumericLookalike(normalizedDomain)) {
      findings.push({
        id: 'numeric-lookalike',
        severity: 'medium',
        text: 'Domain appears to use numeric substitutions to mimic letters',
        category: 'reputation',
        meta: { domain: normalizedDomain }
      });
      score += MEDIUM_SCORE;
      suspiciousTokens.push('numeric-substitution');
    }

    // Display name contains email but mismatched domain
    if (displayName && displayName.includes('@') && !displayName.includes(normalizedDomain)) {
      findings.push({
        id: 'display-email-mismatch',
        severity: 'medium',
        text: 'Display name contains a different email address',
        category: 'reputation',
        meta: { displayName, domain: normalizedDomain }
      });
      score += MEDIUM_SCORE;
    }

    // First-time or uncommon TLDs (basic heuristic)
    const uncommonTlds = ['.icu', '.xyz', '.top', '.click', '.country', '.zip'];
    const domainTld = normalizedDomain.substring(normalizedDomain.lastIndexOf('.'));
    if (uncommonTlds.includes(domainTld)) {
      findings.push({
        id: `uncommon-tld-${domainTld}`,
        severity: 'medium',
        text: `Domain uses uncommon top-level domain ${domainTld}`,
        category: 'reputation',
        meta: { domain: normalizedDomain }
      });
      score += MEDIUM_SCORE;
    }

    if (this.threatIntel?.maliciousUrls?.length) {
      const haystack = `${content.subject || ''} ${content.body || ''}`.toLowerCase();
      const match = this.threatIntel.maliciousUrls.find(url => haystack.includes(url.toLowerCase()));
      if (match) {
        findings.push({
          id: `threatintel-url-${match}`,
          severity: 'high',
          text: 'Email references a URL flagged by external threat intelligence feeds',
          category: 'reputation',
          meta: { indicator: match }
        });
        score += HIGH_SCORE;
        suspiciousTokens.push('threat-intel-url');
      }
    }

    return {
      score: Math.min(100, score),
      findings,
      details: {
        emailAddress: address,
        domain: normalizedDomain,
        displayName: displayName || null,
        matchedBrand,
        lookalikeDistance,
        suspiciousTokens
      }
    };
  }

  private isDomainTrusted(domain: string): boolean {
    const normalized = normalizeDomain(domain);
    if (this.trustedDomains.has(normalized)) return true;
    return this.trustedDomains.has(stripSubdomain(normalized));
  }
}

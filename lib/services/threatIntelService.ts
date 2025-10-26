import patterns from '../data/patterns.json';
import fallbackData from '../data/threatIntelFallback.json';

export interface ThreatIntelData {
  lastUpdated?: string;
  maliciousDomains: string[];
  maliciousUrls: string[];
}

interface PatternsConfig {
  threatIntelSources?: string[];
  scoringWeights?: Record<string, number>;
}

interface JsonThreatIntelShape {
  maliciousDomains?: unknown;
  maliciousUrls?: unknown;
  blacklist?: unknown;
  blocklist?: unknown;
  domains?: unknown;
  urls?: unknown;
}

const patternsConfig = patterns as PatternsConfig;
const DEFAULT_SOURCES = Array.isArray(patternsConfig.threatIntelSources)
  ? patternsConfig.threatIntelSources
  : [];

const fallbackIntel: ThreatIntelData = {
  lastUpdated: fallbackData.lastUpdated,
  maliciousDomains: Array.isArray(fallbackData.maliciousDomains) ? fallbackData.maliciousDomains : [],
  maliciousUrls: Array.isArray(fallbackData.maliciousUrls) ? fallbackData.maliciousUrls : []
};

let cachedIntel: ThreatIntelData | null = null;
let loadingPromise: Promise<ThreatIntelData> | null = null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const normalizeLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map(line => {
      const cleaned = line.trim();
      if (!cleaned || cleaned.startsWith('#')) return '';
      const commaIndex = cleaned.indexOf(',');
      const base = commaIndex > -1 ? cleaned.slice(0, commaIndex).trim() : cleaned;
      if (base.includes(' ')) {
        const tokens = base.split(/\s+/);
        return tokens[tokens.length - 1];
      }
      return base;
    })
    .filter(Boolean);

const parseJsonIntel = (data: JsonThreatIntelShape | string[] | unknown): ThreatIntelData | null => {
  if (Array.isArray(data)) {
    const entries = data.filter((item): item is string => typeof item === 'string');
    if (entries.length === 0) {
      return null;
    }
    return {
      maliciousDomains: entries,
      maliciousUrls: [],
      lastUpdated: new Date().toISOString()
    };
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as JsonThreatIntelShape;

  const domainCandidates: string[][] = [];
  const urlCandidates: string[][] = [];

  if (isStringArray(payload.maliciousDomains)) {
    domainCandidates.push(payload.maliciousDomains);
  }
  if (isStringArray(payload.blacklist)) {
    domainCandidates.push(payload.blacklist);
  }
  if (isStringArray(payload.blocklist)) {
    domainCandidates.push(payload.blocklist);
  }
  if (isStringArray(payload.domains)) {
    domainCandidates.push(payload.domains);
  }

  if (isStringArray(payload.maliciousUrls)) {
    urlCandidates.push(payload.maliciousUrls);
  }
  if (isStringArray(payload.urls)) {
    urlCandidates.push(payload.urls);
  }

  const maliciousDomains = [...new Set(domainCandidates.flat())];
  const maliciousUrls = [...new Set(urlCandidates.flat())];

  if (maliciousDomains.length === 0 && maliciousUrls.length === 0) {
    return null;
  }

  return {
    maliciousDomains,
    maliciousUrls,
    lastUpdated: new Date().toISOString()
  };
};

const parseTextIntel = (text: string): ThreatIntelData | null => {
  const lines = normalizeLines(text);
  if (lines.length === 0) {
    return null;
  }

  const maliciousDomains: string[] = [];
  const maliciousUrls: string[] = [];

  lines.forEach(line => {
    if (line.includes('://')) {
      maliciousUrls.push(line);
    } else {
      maliciousDomains.push(line);
    }
  });

  if (maliciousDomains.length === 0 && maliciousUrls.length === 0) {
    return null;
  }

  return {
    maliciousDomains,
    maliciousUrls,
    lastUpdated: new Date().toISOString()
  };
};

async function fetchFromSource(url: string): Promise<ThreatIntelData | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;

    const raw = await response.text();

    const jsonParsed = (() => {
      try {
        const parsed = JSON.parse(raw);
        return parseJsonIntel(parsed);
      } catch {
        return null;
      }
    })();

    if (jsonParsed) {
      return jsonParsed;
    }

    return parseTextIntel(raw);
  } catch (error) {
    console.warn('Threat intel source fetch failed:', url, error);
    return null;
  }
}

async function resolveThreatIntel(): Promise<ThreatIntelData> {
  for (const source of DEFAULT_SOURCES) {
    const result = await fetchFromSource(source);
    if (result) {
      return result;
    }
  }
  return fallbackIntel;
}

export async function getThreatIntelData(): Promise<ThreatIntelData> {
  if (cachedIntel) {
    return cachedIntel;
  }
  if (!loadingPromise) {
    loadingPromise = resolveThreatIntel()
      .then(data => {
        const mergedDomains = new Set<string>(
          [...fallbackIntel.maliciousDomains, ...data.maliciousDomains].map(domain => domain.toLowerCase())
        );
        const mergedUrls = new Set<string>([
          ...fallbackIntel.maliciousUrls,
          ...data.maliciousUrls
        ]);

        cachedIntel = {
          maliciousDomains: Array.from(mergedDomains),
          maliciousUrls: Array.from(mergedUrls),
          lastUpdated: data.lastUpdated ?? fallbackIntel.lastUpdated
        };
        return cachedIntel;
      })
      .finally(() => {
        loadingPromise = null;
      });
  }
  return loadingPromise;
}

export function invalidateThreatIntelCache(): void {
  cachedIntel = null;
}

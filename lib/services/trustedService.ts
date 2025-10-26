export interface TrustedRecord {
  id: string;
  sender: string;
  domain: string;
  subject?: string;
  userId?: string | null;
  createdAt: string;
  lastConfirmedAt: string;
  confirmationCount: number;
  notes?: string;
  authSnapshot?: {
    spfPassed?: boolean;
    dkimPassed?: boolean;
    dmarcPassed?: boolean;
  };
}

const STORAGE_KEY = 'phishsense_trusted_records_v1';
const memoryStore: TrustedRecord[] = [];

type StoreOptions = {
  userId?: string | null;
};

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function loadRecords(): TrustedRecord[] {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as TrustedRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [...memoryStore];
}

function persistRecords(records: TrustedRecord[]): void {
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore persistence errors silently
    }
  } else {
    memoryStore.length = 0;
    memoryStore.push(...records);
  }
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

function extractDomain(email?: string | null): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const parts = normalized.split('@');
  if (parts.length !== 2) return null;
  return parts[1];
}

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `trusted_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getTrustedRecords(options: StoreOptions = {}): TrustedRecord[] {
  const records = loadRecords();
  if (!options.userId) return records;
  return records.filter(record => !record.userId || record.userId === options.userId);
}

export function isSenderTrusted(sender?: string | null, options: StoreOptions = {}): boolean {
  const domain = extractDomain(sender);
  if (!domain) return false;
  const records = getTrustedRecords(options);
  const normalizedSender = normalizeEmail(sender);
  return records.some(record => {
    if (record.userId && options.userId && record.userId !== options.userId) return false;
    if (record.sender && normalizedSender && record.sender === normalizedSender) return true;
    return record.domain === domain;
  });
}

export function recordTrustedSender({
  sender,
  subject,
  userId,
  notes,
  authSnapshot
}: {
  sender?: string | null;
  subject?: string | null;
  userId?: string | null;
  notes?: string;
  authSnapshot?: TrustedRecord['authSnapshot'];
}): TrustedRecord | null {
  const normalizedSender = normalizeEmail(sender);
  const domain = extractDomain(sender);

  if (!normalizedSender || !domain) {
    return null;
  }

  const now = new Date().toISOString();
  const records = loadRecords();

  const existing = records.find(record => {
    if (record.userId && userId && record.userId !== userId) return false;
    return record.sender === normalizedSender;
  });

  if (existing) {
    existing.lastConfirmedAt = now;
    existing.confirmationCount += 1;
    existing.authSnapshot = authSnapshot || existing.authSnapshot;
    if (subject) existing.subject = subject;
    persistRecords(records);
    return existing;
  }

  const newRecord: TrustedRecord = {
    id: createId(),
    sender: normalizedSender,
    domain,
    subject: subject || undefined,
    userId: userId || null,
    createdAt: now,
    lastConfirmedAt: now,
    confirmationCount: 1,
    notes,
    authSnapshot
  };

  records.push(newRecord);
  persistRecords(records);
  return newRecord;
}

export function removeTrustedRecord(id: string): void {
  const records = loadRecords();
  const next = records.filter(record => record.id !== id);
  persistRecords(next);
}

export function getLegitimacySnapshot({
  sender,
  analysis,
  userId
}: {
  sender?: string | null;
  analysis?: {
    breakdown?: {
      headers?: { details?: any };
      ml?: { score: number; confidence: number };
    };
  } & Record<string, any>;
  userId?: string | null;
}) {
  const domain = extractDomain(sender);
  const trustedByUser = isSenderTrusted(sender, { userId });
  const authDetails = analysis?.breakdown?.headers?.details || {};
  const authStrong = ['pass', 'none'].includes(authDetails.spfStatus) &&
    ['pass', 'none'].includes(authDetails.dkimStatus) &&
    ['pass', 'none'].includes(authDetails.dmarcStatus);
  const mlScore = analysis?.breakdown?.ml?.score ?? 0;
  const mlConfidence = analysis?.breakdown?.ml?.confidence ?? 0;
  const mlSupports = mlScore < 40 && mlConfidence >= 0.5;

  return {
    domain,
    trustedByUser,
    authStrong,
    mlSupports,
    score: analysis?.score ?? 0,
    verdict: analysis?.summary ?? '',
    recommendation: trustedByUser || authStrong ? 'likely-safe' : 'review'
  };
}

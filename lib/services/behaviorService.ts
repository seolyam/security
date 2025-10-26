interface BehaviorRecord {
  sender: string;
  domain: string;
  totalInteractions: number;
  phishingInteractions: number;
  safeInteractions: number;
  suspiciousInteractions: number;
  firstSeen: string;
  lastSeen: string;
}

interface BehaviorSignals {
  totalInteractions: number;
  phishingInteractions: number;
  safeInteractions: number;
  suspiciousInteractions: number;
  daysSinceLastInteraction: number | null;
  isFirstInteraction: boolean;
  firstSeen?: string;
  lastSeen?: string;
}

const STORAGE_KEY = 'phishsense_behavior_signals_v1';

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function loadRecords(): BehaviorRecord[] {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as BehaviorRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function persistRecords(records: BehaviorRecord[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function normalizeSender(sender?: string | null): { sender: string | null; domain: string | null } {
  if (!sender) return { sender: null, domain: null };
  const trimmed = sender.trim().toLowerCase();
  const match = trimmed.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  const email = match ? match[1] : trimmed;
  const domain = email.includes('@') ? email.split('@')[1] : null;
  return { sender: email, domain };
}

export function recordBehaviorInteraction({
  sender,
  verdict
}: {
  sender?: string | null;
  verdict: 'safe' | 'suspicious' | 'phishing';
}): void {
  const { sender: normalizedSender, domain } = normalizeSender(sender);
  if (!normalizedSender || !domain) return;

  const records = loadRecords();
  const now = new Date().toISOString();

  const existing = records.find(record => record.sender === normalizedSender);
  if (existing) {
    existing.totalInteractions += 1;
    if (verdict === 'phishing') existing.phishingInteractions += 1;
    if (verdict === 'safe') existing.safeInteractions += 1;
    if (verdict === 'suspicious') existing.suspiciousInteractions += 1;
    existing.lastSeen = now;
  } else {
    records.push({
      sender: normalizedSender,
      domain,
      totalInteractions: 1,
      phishingInteractions: verdict === 'phishing' ? 1 : 0,
      safeInteractions: verdict === 'safe' ? 1 : 0,
      suspiciousInteractions: verdict === 'suspicious' ? 1 : 0,
      firstSeen: now,
      lastSeen: now
    });
  }

  persistRecords(records);
}

export function getBehaviorSignals(sender?: string | null): BehaviorSignals {
  const { sender: normalizedSender, domain } = normalizeSender(sender);
  const records = loadRecords();

  const record = records.find(item => item.sender === normalizedSender) ||
    records.find(item => domain && item.domain === domain) || null;

  if (!record) {
    return {
      totalInteractions: 0,
      phishingInteractions: 0,
      safeInteractions: 0,
      suspiciousInteractions: 0,
      daysSinceLastInteraction: null,
      isFirstInteraction: true
    };
  }

  const lastSeenDate = record.lastSeen ? new Date(record.lastSeen) : null;
  const now = new Date();
  const daysSinceLast = lastSeenDate
    ? Math.round((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    totalInteractions: record.totalInteractions,
    phishingInteractions: record.phishingInteractions,
    safeInteractions: record.safeInteractions,
    suspiciousInteractions: record.suspiciousInteractions,
    daysSinceLastInteraction: daysSinceLast,
    isFirstInteraction: record.totalInteractions <= 1,
    firstSeen: record.firstSeen,
    lastSeen: record.lastSeen
  };
}

export function clearBehaviorSignals(): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export type { BehaviorSignals };

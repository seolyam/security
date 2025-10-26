import { supabase, type SenderBehavior } from '../supabase';

interface BehaviorRecord {
  sender: string;
  domain: string;
  totalInteractions: number;
  phishingInteractions: number;
  safeInteractions: number;
  suspiciousInteractions: number;
  firstSeen: string;
  lastSeen: string;
  userId?: string | null;
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

function mergeRemoteBehavior(userId: string, remoteRecords: BehaviorRecord[]): void {
  const existing = loadRecords();
  const remoteSenders = new Set(remoteRecords.map(record => record.sender));
  const filtered = existing.filter(record => {
    if (record.userId && record.userId === userId) {
      return false;
    }
    if (!record.userId && remoteSenders.has(record.sender)) {
      return false;
    }
    return true;
  });
  const merged = [...filtered, ...remoteRecords.map(record => ({ ...record, userId }))];
  const deduped = merged.reduce<BehaviorRecord[]>((acc, record) => {
    const key = `${record.userId || 'anon'}_${record.sender}`;
    const index = acc.findIndex(item => `${item.userId || 'anon'}_${item.sender}` === key);
    if (index >= 0) {
      acc[index] = record;
    } else {
      acc.push(record);
    }
    return acc;
  }, []);
  persistRecords(deduped);
}

async function upsertBehaviorRemote({
  sender,
  domain,
  userId,
  record
}: {
  sender: string;
  domain: string;
  userId?: string | null;
  record: BehaviorRecord;
}) {
  if (!userId) return;
  try {
    const { error } = await supabase.from('sender_behavior').upsert({
      id: `${userId}_${sender}`,
      user_id: userId,
      sender,
      domain,
      total_interactions: record.totalInteractions,
      phishing_interactions: record.phishingInteractions,
      safe_interactions: record.safeInteractions,
      suspicious_interactions: record.suspiciousInteractions,
      first_seen: record.firstSeen,
      last_seen: record.lastSeen,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.error('Supabase sender_behavior upsert error:', error);
  } catch (error) {
    console.error('Supabase sender_behavior upsert exception:', error);
  }
}

export async function syncBehaviorSignalsFromRemote(userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('sender_behavior')
      .select('*')
      .match({ user_id: userId });
    if (error) {
      console.error('Supabase sender_behavior fetch error:', error);
      return;
    }
    if (!data) return;
    const mapped: BehaviorRecord[] = data.map((item: SenderBehavior) => ({
      sender: item.sender,
      domain: item.domain,
      totalInteractions: item.total_interactions ?? 0,
      phishingInteractions: item.phishing_interactions ?? 0,
      safeInteractions: item.safe_interactions ?? 0,
      suspiciousInteractions: item.suspicious_interactions ?? 0,
      firstSeen: item.first_seen,
      lastSeen: item.last_seen,
      userId
    }));
    mergeRemoteBehavior(userId, mapped);
  } catch (error) {
    console.error('Supabase sender_behavior sync exception:', error);
  }
}

export function recordBehaviorInteraction({
  sender,
  verdict,
  userId
}: {
  sender?: string | null;
  verdict: 'safe' | 'suspicious' | 'phishing';
  userId?: string | null;
}): void {
  const { sender: normalizedSender, domain } = normalizeSender(sender);
  if (!normalizedSender || !domain) return;

  const records = loadRecords();
  const now = new Date().toISOString();

  const existing = records.find(record => record.sender === normalizedSender && record.userId === (userId || null));
  if (existing) {
    existing.totalInteractions += 1;
    if (verdict === 'phishing') existing.phishingInteractions += 1;
    if (verdict === 'safe') existing.safeInteractions += 1;
    if (verdict === 'suspicious') existing.suspiciousInteractions += 1;
    existing.lastSeen = now;
    existing.userId = userId || null;
    void upsertBehaviorRemote({ sender: normalizedSender, domain, userId, record: existing });
  } else {
    records.push({
      sender: normalizedSender,
      domain,
      totalInteractions: 1,
      phishingInteractions: verdict === 'phishing' ? 1 : 0,
      safeInteractions: verdict === 'safe' ? 1 : 0,
      suspiciousInteractions: verdict === 'suspicious' ? 1 : 0,
      firstSeen: now,
      lastSeen: now,
      userId: userId || null
    });
    void upsertBehaviorRemote({ sender: normalizedSender, domain, userId, record: records[records.length - 1] });
  }

  persistRecords(records);
}

export function getBehaviorSignals(sender?: string | null, userId?: string | null): BehaviorSignals {
  const { sender: normalizedSender, domain } = normalizeSender(sender);
  const records = loadRecords();

  const record = records.find(item => item.sender === normalizedSender && (userId ? item.userId === userId : true)) ||
    records.find(item => domain && item.domain === domain && (userId ? item.userId === userId : true)) || null;

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

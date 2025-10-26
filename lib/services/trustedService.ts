import { supabase, type TrustedSender } from '../supabase';
import type { AnalysisResult } from '../engines/scoreCombiner';

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

function mergeRemoteRecords(userId: string, remoteRecords: TrustedRecord[]) {
  const existing = loadRecords();
  const remoteSenders = new Set(remoteRecords.map(record => record.sender));
  const withoutUser = existing.filter(record => {
    if (record.userId && record.userId === userId) {
      return false;
    }
    if (!record.userId && remoteSenders.has(record.sender)) {
      return false;
    }
    return true;
  });
  const merged = [...withoutUser, ...remoteRecords];
  const deduped = merged.reduce<TrustedRecord[]>((acc, record) => {
    const key = `${record.userId || 'global'}_${record.sender}`;
    const index = acc.findIndex(item => `${item.userId || 'global'}_${item.sender}` === key);
    if (index >= 0) {
      acc[index] = record;
    } else {
      acc.push(record);
    }
    return acc;
  }, []);
  persistRecords(deduped);
}

async function upsertRemoteTrustedRecord(record: TrustedRecord): Promise<void> {
  if (!record.userId) return;
  try {
    const { error } = await supabase.from('trusted_senders').upsert({
      id: record.id,
      user_id: record.userId,
      sender: record.sender,
      domain: record.domain,
      subject: record.subject ?? null,
      notes: record.notes ?? null,
      confirmation_count: record.confirmationCount,
      auth_snapshot: record.authSnapshot ?? null,
      created_at: record.createdAt,
      updated_at: new Date().toISOString(),
      last_confirmed_at: record.lastConfirmedAt
    }, { onConflict: 'id' });
    if (error) console.error('Supabase trusted_senders upsert error:', error);
  } catch (error) {
    console.error('Supabase trusted_senders upsert exception:', error);
  }
}

async function deleteRemoteTrustedRecord(id: string, userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const { error } = await supabase.from('trusted_senders').delete().match({ user_id: userId, id });
    if (error) console.error('Supabase trusted_senders delete error:', error);
  } catch (error) {
    console.error('Supabase trusted_senders delete exception:', error);
  }
}

export async function syncTrustedRecordsFromRemote(userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from('trusted_senders')
      .select('*')
      .match({ user_id: userId });
    if (error) {
      console.error('Supabase trusted_senders fetch error:', error);
      return;
    }
    if (!data) return;
    const mapped: TrustedRecord[] = data.map((item: TrustedSender) => ({
      id: item.id,
      sender: item.sender,
      domain: item.domain,
      subject: item.subject ?? undefined,
      userId,
      createdAt: item.created_at,
      lastConfirmedAt: item.last_confirmed_at,
      confirmationCount: item.confirmation_count ?? 1,
      notes: item.notes ?? undefined,
      authSnapshot: item.auth_snapshot ?? undefined
    }));
    mergeRemoteRecords(userId, mapped);
  } catch (error) {
    console.error('Supabase trusted_senders sync exception:', error);
  }
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
    if (userId) existing.userId = userId;
    persistRecords(records);
    void upsertRemoteTrustedRecord(existing);
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
  void upsertRemoteTrustedRecord(newRecord);
  return newRecord;
}

export async function removeTrustedRecord(id: string, userId?: string | null): Promise<void> {
  const records = loadRecords();
  const next = records.filter(record => record.id !== id);
  persistRecords(next);
  if (userId) {
    await deleteRemoteTrustedRecord(id, userId);
  }
}

export function getLegitimacySnapshot({
  sender,
  analysis,
  userId
}: {
  sender?: string | null;
  analysis?: Partial<AnalysisResult>;
  userId?: string | null;
}) {
  const domain = extractDomain(sender);
  const trustedByUser = isSenderTrusted(sender, { userId });
  type HeaderDetails = NonNullable<AnalysisResult['breakdown']['headers']['details']>;
  const authDetails = (analysis?.breakdown?.headers?.details ?? {}) as Partial<HeaderDetails>;
  const authStrong = ['pass', 'none'].includes(authDetails.spfStatus ?? '') &&
    ['pass', 'none'].includes(authDetails.dkimStatus ?? '') &&
    ['pass', 'none'].includes(authDetails.dmarcStatus ?? '');
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

export type LegitimacySnapshot = ReturnType<typeof getLegitimacySnapshot>;

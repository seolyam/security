import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://saxmpvvgjkidotpqsaht.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseAnonKey);

export type AuthSnapshot = {
  spfPassed?: boolean;
  dkimPassed?: boolean;
  dmarcPassed?: boolean;
};

type NoopQueryResult = { data: null; error: null };

class NoopQueryBuilder implements PromiseLike<NoopQueryResult> {
  private readonly promise: Promise<NoopQueryResult>;

  constructor() {
    this.promise = Promise.resolve({ data: null, error: null });
  }

  select(): NoopQueryBuilder { return this; }
  delete(): NoopQueryBuilder { return this; }
  eq(): NoopQueryBuilder { return this; }
  match(): NoopQueryBuilder { return this; }
  ilike(): NoopQueryBuilder { return this; }
  or(): NoopQueryBuilder { return this; }
  order(): NoopQueryBuilder { return this; }
  limit(): NoopQueryBuilder { return this; }
  range(): NoopQueryBuilder { return this; }
  upsert(): NoopQueryBuilder { return this; }
  insert(): NoopQueryBuilder { return this; }
  update(): NoopQueryBuilder { return this; }
  filter(): NoopQueryBuilder { return this; }
  in(): NoopQueryBuilder { return this; }
  single(): Promise<NoopQueryResult> { return this.promise; }
  maybeSingle(): Promise<NoopQueryResult> { return this.promise; }
  returns(): Promise<NoopQueryResult> { return this.promise; }

  then<TResult1 = NoopQueryResult, TResult2 = never>(
    onfulfilled?: ((value: NoopQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled ?? undefined, onrejected ?? undefined);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<NoopQueryResult | TResult> {
    return this.promise.catch(onrejected ?? undefined);
  }

  finally(onfinally?: (() => void) | null): Promise<NoopQueryResult> {
    return this.promise.finally(onfinally ?? undefined);
  }
}

function createNoopClient(): SupabaseClient<Database> {
  const noopResult: NoopQueryResult = { data: null, error: null };

  const noopClient = {
    from: () => new NoopQueryBuilder(),
    rpc: async () => noopResult,
    auth: {
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signInWithOtp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: null }),
      updateUser: async () => ({ data: null, error: null }),
      onAuthStateChange: (callback: (event: string, session: null) => void) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: () => { /* noop */ } } }, error: null };
      }
    }
  };

  return noopClient as unknown as SupabaseClient<Database>;
}

export const supabase = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createNoopClient();

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      scan_logs: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          body: string | null;
          from_email: string | null;
          risk_score: number;
          verdict: 'safe' | 'suspicious' | 'phishing';
          keywords: string[] | null;
          links: string[] | null;
          ml_confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          body?: string | null;
          from_email?: string | null;
          risk_score: number;
          verdict: 'safe' | 'suspicious' | 'phishing';
          keywords?: string[] | null;
          links?: string[] | null;
          ml_confidence?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          body?: string | null;
          from_email?: string | null;
          risk_score?: number;
          verdict?: 'safe' | 'suspicious' | 'phishing';
          keywords?: string[] | null;
          links?: string[] | null;
          ml_confidence?: number | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          hash: string;
          risk_score: number;
          verdict: 'safe' | 'suspicious' | 'phishing';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          hash: string;
          risk_score: number;
          verdict: 'safe' | 'suspicious' | 'phishing';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          hash?: string;
          risk_score?: number;
          verdict?: 'safe' | 'suspicious' | 'phishing';
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: 'light' | 'dark' | 'system';
          sensitivity: 'lenient' | 'balanced' | 'strict';
          ml_enabled: boolean;
          private_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: 'light' | 'dark' | 'system';
          sensitivity?: 'lenient' | 'balanced' | 'strict';
          ml_enabled?: boolean;
          private_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: 'light' | 'dark' | 'system';
          sensitivity?: 'lenient' | 'balanced' | 'strict';
          ml_enabled?: boolean;
          private_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      patterns: {
        Row: {
          id: string;
          keyword: string;
          category: string;
          severity: 'low' | 'medium' | 'high';
          weight: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          category: string;
          severity?: 'low' | 'medium' | 'high';
          weight?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          category?: string;
          severity?: 'low' | 'medium' | 'high';
          weight?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          scan_id: string;
          user_id: string;
          comment_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          user_id: string;
          comment_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          user_id?: string;
          comment_text?: string;
          created_at?: string;
        };
      };
      trusted_senders: {
        Row: {
          id: string;
          user_id: string;
          sender: string;
          domain: string;
          subject: string | null;
          notes: string | null;
          confirmation_count: number;
          auth_snapshot: AuthSnapshot | null;
          created_at: string;
          updated_at: string;
          last_confirmed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sender: string;
          domain: string;
          subject?: string | null;
          notes?: string | null;
          confirmation_count?: number;
          auth_snapshot?: AuthSnapshot | null;
          created_at?: string;
          updated_at?: string;
          last_confirmed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sender?: string;
          domain?: string;
          subject?: string | null;
          notes?: string | null;
          confirmation_count?: number;
          auth_snapshot?: AuthSnapshot | null;
          created_at?: string;
          updated_at?: string;
          last_confirmed_at?: string;
        };
      };
      sender_behavior: {
        Row: {
          id: string;
          user_id: string;
          sender: string;
          domain: string;
          total_interactions: number;
          phishing_interactions: number;
          safe_interactions: number;
          suspicious_interactions: number;
          first_seen: string;
          last_seen: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sender: string;
          domain: string;
          total_interactions?: number;
          phishing_interactions?: number;
          safe_interactions?: number;
          suspicious_interactions?: number;
          first_seen?: string;
          last_seen?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sender?: string;
          domain?: string;
          total_interactions?: number;
          phishing_interactions?: number;
          safe_interactions?: number;
          suspicious_interactions?: number;
          first_seen?: string;
          last_seen?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type ScanLog = Database['public']['Tables']['scan_logs']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type Pattern = Database['public']['Tables']['patterns']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type TrustedSender = Database['public']['Tables']['trusted_senders']['Row'];
export type SenderBehavior = Database['public']['Tables']['sender_behavior']['Row'];

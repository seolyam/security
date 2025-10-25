import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://saxmpvvgjkidotpqsaht.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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

import { supabase } from '../supabase';
import type { ScanLog } from '../supabase';

export interface CreateScanData {
  subject: string;
  body?: string;
  fromEmail?: string;
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'phishing';
  keywords?: string[];
  links?: string[];
  mlConfidence?: number;
}

export class ScanService {
  static async createScan(userId: string, scanData: CreateScanData) {
    const { data, error } = await supabase
      .from('scan_logs')
      .insert({
        user_id: userId,
        subject: scanData.subject,
        body: scanData.body || null,
        from_email: scanData.fromEmail || null,
        risk_score: scanData.riskScore,
        verdict: scanData.verdict,
        keywords: scanData.keywords || null,
        links: scanData.links || null,
        ml_confidence: scanData.mlConfidence || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserScans(userId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getScanById(scanId: string, userId: string) {
    const { data, error } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteScan(scanId: string, userId: string) {
    const { error } = await supabase
      .from('scan_logs')
      .delete()
      .eq('id', scanId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('scan_logs')
      .select('risk_score, verdict, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalScans: 0,
        avgRiskScore: 0,
        phishingPercentage: 0,
        recentScans: 0,
      };
    }

    const totalScans = data.length;
    const avgRiskScore = data.reduce((sum, scan) => sum + scan.risk_score, 0) / totalScans;
    const phishingCount = data.filter(scan => scan.verdict === 'phishing').length;
    const phishingPercentage = (phishingCount / totalScans) * 100;

    // Recent scans (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentScans = data.filter(scan =>
      new Date(scan.created_at) >= sevenDaysAgo
    ).length;

    return {
      totalScans,
      avgRiskScore: Math.round(avgRiskScore),
      phishingPercentage: Math.round(phishingPercentage * 100) / 100,
      recentScans,
    };
  }

  static async getDailyTrends(userId: string, days = 30) {
    const { data, error } = await supabase
      .rpc('get_user_daily_trends', {
        user_id_param: userId,
        days_param: days,
      });

    if (error) throw error;
    return data;
  }

  static async searchScans(userId: string, query: string, limit = 20) {
    const { data, error } = await supabase
      .from('scan_logs')
      .select('*')
      .eq('user_id', userId)
      .or(`subject.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

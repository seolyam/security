import { supabase } from '../supabase';
import type { Report } from '../supabase';

export interface UserReportStats {
  totalReports: number;
  avgRiskScore: number;
  phishingPercentage: number;
}

export interface CreateReportData {
  fileName: string;
  hash: string;
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'phishing';
}

export class ReportService {
  static async createReport(userId: string, reportData: CreateReportData): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        file_name: reportData.fileName,
        hash: reportData.hash,
        risk_score: reportData.riskScore,
        verdict: reportData.verdict,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Report;
  }

  static async getUserReports(userId: string, limit = 50, offset = 0): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as Report[];
  }

  static async getReportById(reportId: string, userId: string): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as Report;
  }

  static async deleteReport(reportId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async getUserReportStats(userId: string): Promise<UserReportStats> {
    const { data, error } = await supabase
      .from('reports')
      .select('risk_score, verdict, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const reports = (data ?? []) as Array<Pick<Report, 'risk_score' | 'verdict' | 'created_at'>>;

    if (reports.length === 0) {
      return {
        totalReports: 0,
        avgRiskScore: 0,
        phishingPercentage: 0,
      };
    }

    const totalReports = reports.length;
    const avgRiskScore = reports.reduce((sum, report) => sum + report.risk_score, 0) / totalReports;
    const phishingCount = reports.filter(report => report.verdict === 'phishing').length;
    const phishingPercentage = (phishingCount / totalReports) * 100;

    return {
      totalReports,
      avgRiskScore: Math.round(avgRiskScore),
      phishingPercentage: Math.round(phishingPercentage * 100) / 100,
    };
  }

  static async searchReports(userId: string, query: string, limit = 20) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .ilike('file_name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Report[];
  }
}

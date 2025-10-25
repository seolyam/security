import { supabase } from '../supabase';
import type { Report } from '../supabase';

export interface CreateReportData {
  fileName: string;
  hash: string;
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'phishing';
}

export class ReportService {
  static async createReport(userId: string, reportData: CreateReportData) {
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
    return data;
  }

  static async getUserReports(userId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getReportById(reportId: string, userId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteReport(reportId: string, userId: string) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async getUserReportStats(userId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('risk_score, verdict, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalReports: 0,
        avgRiskScore: 0,
        phishingPercentage: 0,
      };
    }

    const totalReports = data.length;
    const avgRiskScore = data.reduce((sum, report) => sum + report.risk_score, 0) / totalReports;
    const phishingCount = data.filter(report => report.verdict === 'phishing').length;
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
    return data;
  }
}

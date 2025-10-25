import { supabase } from '../supabase';
import type { Pattern } from '../supabase';

export interface PatternData {
  keyword: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  weight: number;
  isActive: boolean;
}

export class PatternService {
  static async getActivePatterns(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getAllPatterns(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createPattern(patternData: PatternData) {
    const { data, error } = await supabase
      .from('patterns')
      .insert({
        keyword: patternData.keyword,
        category: patternData.category,
        severity: patternData.severity,
        weight: patternData.weight,
        is_active: patternData.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePattern(patternId: string, updates: Partial<PatternData>) {
    const { data, error } = await supabase
      .from('patterns')
      .update({
        keyword: updates.keyword,
        category: updates.category,
        severity: updates.severity,
        weight: updates.weight,
        is_active: updates.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePattern(patternId: string) {
    const { error } = await supabase
      .from('patterns')
      .delete()
      .eq('id', patternId);

    if (error) throw error;
  }

  static async getPatternsByCategory(category: string): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('weight', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getPatternStats() {
    const { data, error } = await supabase
      .from('patterns')
      .select('category, severity, is_active')
      .eq('is_active', true);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<string, number>,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
      },
    };

    data?.forEach(pattern => {
      // Count by category
      stats.byCategory[pattern.category] = (stats.byCategory[pattern.category] || 0) + 1;

      // Count by severity
      if (pattern.severity) {
        stats.bySeverity[pattern.severity as keyof typeof stats.bySeverity]++;
      }
    });

    return stats;
  }

  // Convert Supabase patterns to the format expected by the rule engine
  static convertToRuleEngineFormat(patterns: Pattern[]) {
    const result: Record<string, any> = {};

    patterns.forEach(pattern => {
      if (!result[pattern.category]) {
        result[pattern.category] = {
          weight: pattern.weight,
          severity: pattern.severity,
          patterns: [],
        };
      }
      result[pattern.category].patterns.push(pattern.keyword);
    });

    return result;
  }
}

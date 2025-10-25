import { supabase } from '../supabase';
import type { UserSettings } from '../supabase';

export interface SettingsData {
  theme: 'light' | 'dark' | 'system';
  sensitivity: 'lenient' | 'balanced' | 'strict';
  mlEnabled: boolean;
  privateMode: boolean;
}

export class SettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default ones
        return await this.createDefaultSettings(userId);
      }
      throw error;
    }

    return data;
  }

  static async updateUserSettings(userId: string, settings: Partial<SettingsData>) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        theme: settings.theme,
        sensitivity: settings.sensitivity,
        ml_enabled: settings.mlEnabled,
        private_mode: settings.privateMode,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings> {
    const defaultSettings = {
      user_id: userId,
      theme: 'system' as const,
      sensitivity: 'balanced' as const,
      ml_enabled: true,
      private_mode: false,
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteUserSettings(userId: string) {
    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async getAllUserSettings() {
    const { data, error } = await supabase
      .from('user_settings')
      .select('user_id, theme, sensitivity, ml_enabled, private_mode, updated_at');

    if (error) throw error;
    return data;
  }
}

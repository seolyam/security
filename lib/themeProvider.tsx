"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './authProvider';
import { SettingsService } from './services/settingsService';
import type { UserSettings } from './supabase';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  userSettings: UserSettings | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load theme from localStorage (fallback) or user settings (cloud)
    const loadInitialTheme = async () => {
      if (user) {
        try {
          const settings = await SettingsService.getUserSettings(user.id);
          if (settings) {
            setUserSettings(settings);
            setTheme(settings.theme || 'system');
            return;
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }

      // Fallback to localStorage
      const storedTheme = localStorage.getItem('phishingsense_theme') as Theme;
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setTheme(storedTheme);
      }
    };

    loadInitialTheme();
  }, [user]);

  useEffect(() => {
    const updateResolvedTheme = () => {
      let newResolvedTheme: 'light' | 'dark';

      if (theme === 'system') {
        newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        newResolvedTheme = theme;
      }

      setResolvedTheme(newResolvedTheme);

      // Apply theme to document
      const root = document.documentElement;
      if (newResolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);

    // Save to cloud if user is authenticated
    if (user) {
      try {
        await SettingsService.updateUserSettings(user.id, { theme: newTheme });
        // Update local state
        setUserSettings(prev => (prev ? { ...prev, theme: newTheme } : prev));
      } catch (error) {
        console.error('Error saving theme to cloud:', error);
      }
    }

    // Fallback to localStorage for guests or as backup
    localStorage.setItem('phishingsense_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme: handleSetTheme,
      resolvedTheme,
      userSettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

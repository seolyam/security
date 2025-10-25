"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, type AuthUser } from './services/authService';
import { SettingsService } from './services/settingsService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { email: string; password: string; fullName?: string }) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  userSettings: any;
  updateSettings: (settings: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then((session) => {
      setUser(session?.user as AuthUser || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event: string, session: any) => {
      setUser(session?.user as AuthUser || null);
      setLoading(false);

      // Load user settings when user logs in
      if (session?.user) {
        try {
          const settings = await SettingsService.getUserSettings(session.user.id);
          setUserSettings(settings);
        } catch (error) {
          console.error('Error loading user settings:', error);
          // Try to create profile and settings if they don't exist
          try {
            await AuthService.ensureUserProfile(
              session.user.id,
              session.user.email!,
              session.user.user_metadata?.full_name
            );
            const newSettings = await SettingsService.getUserSettings(session.user.id);
            setUserSettings(newSettings);
          } catch (profileError) {
            console.error('Error creating profile on auth change:', profileError);
            // Test database connection to provide better diagnostics
            const connectionTest = await AuthService.testDatabaseConnection();
            if (!connectionTest.success) {
              console.error('🚨 Database connection failed:', connectionTest.error);
            }
          }
        }
      } else {
        setUserSettings(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      await AuthService.signIn(credentials);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (credentials: { email: string; password: string; fullName?: string }) => {
    setLoading(true);
    try {
      await AuthService.signUp(credentials);
    } catch (error: any) {
      setLoading(false);

      // Enhanced error logging for debugging
      console.error('❌ Signup failed:', error);

      // If it's a database-related error, suggest running the debug tool
      if (error.message?.includes('database') || error.message?.includes('schema')) {
        console.log('💡 Try running: await AuthService.debugConnection() in the browser console for detailed diagnostics');
      }

      throw error;
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      await AuthService.signInWithMagicLink(email);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUserSettings(null);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await AuthService.updatePassword(password);
    } catch (error) {
      throw error;
    }
  };

  const updateSettings = async (settings: any) => {
    if (!user) return;

    try {
      const updatedSettings = await SettingsService.updateUserSettings(user.id, settings);
      setUserSettings(updatedSettings);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithMagicLink,
      signOut,
      resetPassword,
      updatePassword,
      userSettings,
      updateSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

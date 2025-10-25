import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  fullName?: string;
}

export class AuthService {
  static async signUp({ email, password, fullName }: SignupCredentials) {
    try {
      console.log('🚀 Starting user signup process:', { email, fullName });

      // Test database connection before attempting signup
      console.log('🔍 Testing database connection before signup...');
      const connectionTest = await this.testDatabaseConnection();

      if (!connectionTest.success) {
        console.error('🚨 Database connection failed before signup:', connectionTest);

        let userMessage = 'Unable to connect to database. ';

        if (connectionTest.action === 'run_schema') {
          userMessage += 'Please run the database schema in Supabase SQL Editor first.';
        } else if (connectionTest.action === 'check_policies') {
          userMessage += 'Please check Row Level Security policies in Supabase.';
        } else if (connectionTest.action === 'check_config') {
          userMessage += 'Please check your Supabase configuration.';
        } else {
          userMessage += 'Please check the console for detailed error information.';
        }

        throw new Error(userMessage);
      }

      console.log('✅ Database connection verified, proceeding with signup...');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Supabase signup error:', {
          error,
          message: error.message,
          status: error.status,
          email,
          fullName
        });
        throw error;
      }

      console.log('✅ User account created successfully:', { userId: data.user?.id });

      // Create user profile if signup successful
      if (data.user) {
        try {
          console.log('🔄 Creating user profile after successful signup...');
          await this.createUserProfile(data.user.id, email, fullName);
          console.log('✅ User profile created successfully');
        } catch (profileError: any) {
          console.error('⚠️ Profile creation failed after successful signup:', profileError);

          // Don't fail the entire signup if profile creation fails
          // The user can still sign in, we just won't have their profile
          console.warn('User account created but profile creation failed. User can still sign in.');
        }
      }

      return data;
    } catch (error: any) {
      console.error('💥 Signup process failed:', {
        error: error?.message || error,
        email,
        fullName,
        stack: error?.stack
      });
      throw error;
    }
  }

  static async signIn({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Ensure user has a profile (in case it wasn't created during signup)
    if (data.user) {
      try {
        await this.ensureUserProfile(data.user.id, email, data.user.user_metadata?.full_name);
      } catch (profileError) {
        console.error('Failed to ensure user profile exists:', profileError);
        // Don't fail sign in if profile creation fails
      }
    }

    return data;
  }

  static async signInWithMagicLink(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // Note: Profile creation will be handled when the user completes the magic link flow
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user as AuthUser;
  }

  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  }

  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  static async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return data;
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async testDatabaseConnection() {
    try {
      console.log('🔍 Testing Supabase database connection...');

      // Test 1: Basic connection by trying to query a non-existent table (should give us error details)
      const { data: authTest, error: authError } = await supabase.auth.getSession();

      if (authError) {
        console.error('❌ Auth connection test failed:', authError);
        return {
          success: false,
          error: authError,
          message: 'Cannot connect to Supabase authentication service'
        };
      }

      // Test 2: Try to query the users table (this will tell us if tables exist)
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Database query test failed:', {
          error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          hasMessage: !!error.message,
          hasCode: !!error.code,
          errorKeys: error ? Object.keys(error) : 'no error object'
        });

        // Provide specific guidance based on error
        if (error.code === '42P01') {
          return {
            success: false,
            error,
            message: 'Database tables not found. Please run the database schema in Supabase SQL Editor.',
            action: 'run_schema'
          };
        } else if (error.code === '42501') {
          return {
            success: false,
            error,
            message: 'Access denied. Please check RLS policies in Supabase.',
            action: 'check_policies'
          };
        } else if (error.code === 'PGRST116') {
          return {
            success: false,
            error,
            message: 'Database connection failed. Please check your Supabase URL and API key.',
            action: 'check_config'
          };
        }

        return {
          success: false,
          error,
          message: `Database error: ${error.message || 'Unknown error'}`,
          action: 'check_console'
        };
      }

      console.log('✅ Database connection successful');
      return {
        success: true,
        data,
        message: 'Database connection working properly'
      };
    } catch (error: any) {
      console.error('💥 Database connection test crashed:', {
        error: error?.message || error,
        stack: error?.stack
      });

      return {
        success: false,
        error,
        message: 'Database connection test failed completely. Please check your configuration.',
        action: 'check_config'
      };
    }
  }

  static async ensureUserProfile(userId: string, email: string, fullName?: string) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Profile exists, make sure settings also exist
        await this.ensureUserSettings(userId);
        return;
      }

      // Profile doesn't exist, create it
      await this.createUserProfile(userId, email, fullName);
    } catch (error: any) {
      console.error('Failed to ensure user profile:', {
        error: error?.message || error,
        userId,
        email
      });
      throw error;
    }
  }

  static async ensureUserSettings(userId: string) {
    try {
      // Check if settings already exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingSettings) {
        await this.createDefaultSettings(userId);
      }
    } catch (error: any) {
      console.error('Failed to ensure user settings:', {
        error: error?.message || error,
        userId
      });
      throw error;
    }
  }

  private static async createUserProfile(userId: string, email: string, fullName?: string) {
    try {
      console.log('🔄 Creating user profile:', { userId, email, fullName });

      // Test database connection first
      const connectionTest = await this.testDatabaseConnection();
      if (!connectionTest.success) {
        console.error('🚨 Database connection failed before profile creation:', connectionTest.error);
        throw new Error('Cannot connect to database. Please check your Supabase configuration.');
      }

      // Check if user is authenticated before attempting profile creation
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User not authenticated when creating profile:', userError);
        throw new Error('User must be authenticated to create profile. Please sign in first.');
      }

      if (user.id !== userId) {
        console.warn('⚠️ Auth user ID mismatch:', {
          authUserId: user.id,
          profileUserId: userId
        });
        // Continue anyway - this might be a timing issue
      }

      console.log('✅ User authenticated, proceeding with profile creation:', {
        authUserId: user.id,
        profileUserId: userId,
        email: user.email
      });

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role: 'user',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating user profile:', {
          error,
          userId,
          email,
          fullName,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code,
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : 'no error object',
          currentAuthUser: user?.id,
          currentAuthEmail: user?.email
        });

        // Handle empty error objects
        if (!error || Object.keys(error).length === 0) {
          throw new Error('Database operation failed with no error details. This usually means the database tables do not exist or there is a connection issue.');
        }

        // Provide more helpful error messages
        if (error.code === '42P01') {
          throw new Error('Database tables not found. Please run the database schema in Supabase SQL Editor.');
        } else if (error.code === '42501') {
          throw new Error('Access denied. Please check RLS policies in Supabase. Make sure the policy "Users can insert their own profile" exists and allows (auth.uid() = id).');
        } else if (error.code === '23505') {
          console.log('✅ User profile already exists, skipping creation');
          return data;
        } else if (error.code === 'PGRST116') {
          throw new Error('Database connection failed. Please check your Supabase URL and API key.');
        }

        // For any other error, provide the original error with more context
        const errorMsg = error.message || 'Unknown database error';
        throw new Error(`Database error (${error.code || 'unknown code'}): ${errorMsg}`);
      }

      if (!data) {
        throw new Error('Profile creation succeeded but returned no data. Please check database permissions.');
      }

      console.log('✅ User profile created successfully:', data);

      // Also create default settings
      await this.createDefaultSettings(userId);
      return data;
    } catch (error: any) {
      console.error('💥 Failed to create user profile:', {
        error: error?.message || error,
        userId,
        email,
        fullName,
        stack: error?.stack,
        errorType: typeof error
      });
      throw error;
    }
  }

  private static async createDefaultSettings(userId: string) {
    try {
      console.log('🔄 Creating default user settings:', { userId });

      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          theme: 'system',
          sensitivity: 'balanced',
          ml_enabled: true,
          private_mode: false,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating user settings:', {
          error,
          userId,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          hasMessage: !!error.message,
          hasCode: !!error.code,
          errorType: typeof error
        });

        // Handle empty error objects
        if (!error || Object.keys(error).length === 0) {
          console.warn('⚠️ Settings creation failed with empty error, but continuing...');
          return null; // Don't fail the entire process
        }

        if (error.code === '23505') {
          console.log('✅ User settings already exist, skipping creation');
          return data;
        }

        // Log the error but don't fail the entire signup process
        console.warn('⚠️ Failed to create user settings, but user profile was created successfully');
        return null;
      }

      console.log('✅ User settings created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('💥 Failed to create default settings:', {
        error: error?.message || error,
        userId
      });
      // Don't throw here - settings are optional
      return null;
    }
  }

  // Browser console debugging function (call this from browser console)
  static async debugConnection() {
    console.log('🔧 PhishingSense Database Debug Tool');
    console.log('=====================================');

    const test = await this.testDatabaseConnection();

    if (test.success) {
      console.log('✅ Database connection working!');
      console.log('📊 Test result:', test);
    } else {
      console.error('❌ Database connection failed!');
      console.error('🔍 Error details:', test);

      if (test.action === 'run_schema') {
        console.log('💡 Solution: Copy and run the supabase-schema.sql in Supabase SQL Editor');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/saxmpvvgjkidotpqsaht/sql');
      } else if (test.action === 'check_policies') {
        console.log('💡 Solution: Check RLS policies in Supabase Dashboard');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/saxmpvvgjkidotpqsaht/database/policies');
      } else if (test.action === 'check_config') {
        console.log('💡 Solution: Check your .env.local file and Supabase configuration');
        console.log('📝 Should contain: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
    }

    return test;
  }
}

-- PhishingSense v3.0 Database Schema
-- Run this in your Supabase SQL editor
-- This version handles existing tables gracefully

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
-- Uncomment the lines below if you want to start fresh:
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.scan_logs CASCADE;
-- DROP TABLE IF EXISTS public.reports CASCADE;
-- DROP TABLE IF EXISTS public.user_settings CASCADE;
-- DROP TABLE IF EXISTS public.patterns CASCADE;
-- DROP TABLE IF EXISTS public.comments CASCADE;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan logs table
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    from_email TEXT,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    verdict TEXT NOT NULL CHECK (verdict IN ('safe', 'suspicious', 'phishing')),
    keywords TEXT[],
    links TEXT[],
    ml_confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    hash TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    verdict TEXT NOT NULL CHECK (verdict IN ('safe', 'suspicious', 'phishing')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    sensitivity TEXT DEFAULT 'balanced' CHECK (sensitivity IN ('lenient', 'balanced', 'strict')),
    ml_enabled BOOLEAN DEFAULT true,
    private_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patterns table (global rule definitions)
CREATE TABLE IF NOT EXISTS public.patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    weight INTEGER DEFAULT 15 CHECK (weight >= 1 AND weight <= 50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(keyword, category)
);

-- Comments table (optional - for educational discussions)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scan_id UUID REFERENCES public.scan_logs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables (safe to run multiple times)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
-- Uncomment if you want to reset policies:
-- DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
-- And similar for other tables...

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for scan_logs table
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scan_logs;
CREATE POLICY "Users can view their own scans" ON public.scan_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scans" ON public.scan_logs;
CREATE POLICY "Users can insert their own scans" ON public.scan_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scans" ON public.scan_logs;
CREATE POLICY "Users can update their own scans" ON public.scan_logs
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scan_logs;
CREATE POLICY "Users can delete their own scans" ON public.scan_logs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reports table
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;
CREATE POLICY "Users can delete their own reports" ON public.reports
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_settings table
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for patterns table (global read, restricted write)
DROP POLICY IF EXISTS "Anyone can view active patterns" ON public.patterns;
CREATE POLICY "Anyone can view active patterns" ON public.patterns
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage patterns" ON public.patterns;
CREATE POLICY "Admins can manage patterns" ON public.patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for comments table
DROP POLICY IF EXISTS "Users can view comments on their scans" ON public.comments;
CREATE POLICY "Users can view comments on their scans" ON public.comments
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.scan_logs
            WHERE id = scan_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert comments on their scans" ON public.comments;
CREATE POLICY "Users can insert comments on their scans" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON public.scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON public.scan_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_logs_verdict ON public.scan_logs(verdict);
CREATE INDEX IF NOT EXISTS idx_scan_logs_risk_score ON public.scan_logs(risk_score);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

CREATE INDEX IF NOT EXISTS idx_patterns_category ON public.patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON public.patterns(is_active);

CREATE INDEX IF NOT EXISTS idx_comments_scan_id ON public.comments(scan_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Insert default patterns (only if they don't already exist)
INSERT INTO public.patterns (keyword, category, severity, weight)
SELECT 'urgent', 'urgent', 'high', 25
WHERE NOT EXISTS (SELECT 1 FROM public.patterns WHERE keyword = 'urgent' AND category = 'urgent');

INSERT INTO public.patterns (keyword, category, severity, weight)
SELECT 'immediate', 'urgent', 'high', 25
WHERE NOT EXISTS (SELECT 1 FROM public.patterns WHERE keyword = 'immediate' AND category = 'urgent');

INSERT INTO public.patterns (keyword, category, severity, weight)
SELECT 'verify', 'verification', 'high', 30
WHERE NOT EXISTS (SELECT 1 FROM public.patterns WHERE keyword = 'verify' AND category = 'verification');

INSERT INTO public.patterns (keyword, category, severity, weight)
SELECT 'password', 'credentials', 'high', 35
WHERE NOT EXISTS (SELECT 1 FROM public.patterns WHERE keyword = 'password' AND category = 'credentials');

INSERT INTO public.patterns (keyword, category, severity, weight)
SELECT 'payment', 'financial', 'high', 30
WHERE NOT EXISTS (SELECT 1 FROM public.patterns WHERE keyword = 'payment' AND category = 'financial');

-- Continue with more patterns only if table is empty or has few records
INSERT INTO public.patterns (keyword, category, severity, weight)
SELECT keyword, category, severity, weight FROM (VALUES
    ('asap', 'urgent', 'medium', 20),
    ('act now', 'urgent', 'high', 30),
    ('limited time', 'urgent', 'medium', 15),
    ('confirm', 'verification', 'high', 25),
    ('validate', 'verification', 'high', 25),
    ('identity', 'verification', 'high', 20),
    ('verification', 'verification', 'high', 30),
    ('login', 'credentials', 'high', 25),
    ('username', 'credentials', 'high', 25),
    ('account', 'credentials', 'medium', 15),
    ('security code', 'credentials', 'high', 35),
    ('bank', 'financial', 'high', 25),
    ('credit card', 'financial', 'high', 35),
    ('invoice', 'financial', 'medium', 20),
    ('billing', 'financial', 'medium', 20),
    ('click here', 'suspicious', 'medium', 15),
    ('free', 'suspicious', 'low', 10),
    ('winner', 'suspicious', 'medium', 20),
    ('prize', 'suspicious', 'medium', 20),
    ('guaranteed', 'suspicious', 'medium', 15),
    ('update', 'action', 'medium', 15),
    ('download', 'action', 'medium', 15),
    ('install', 'action', 'medium', 15),
    ('subscribe', 'action', 'low', 10),
    ('unsubscribe', 'action', 'low', 10),
    ('bitcoin', 'crypto', 'high', 30),
    ('cryptocurrency', 'crypto', 'high', 30),
    ('wallet', 'crypto', 'high', 25),
    ('investment', 'crypto', 'high', 25),
    ('crypto', 'crypto', 'high', 30),
    ('package', 'delivery', 'medium', 20),
    ('delivery', 'delivery', 'medium', 20),
    ('tracking', 'delivery', 'medium', 15),
    ('shipped', 'delivery', 'low', 10),
    ('delivered', 'delivery', 'low', 10),
    ('subscription', 'subscription', 'medium', 20),
    ('renewal', 'subscription', 'medium', 15),
    ('cancel', 'subscription', 'low', 10),
    ('billing', 'subscription', 'medium', 15),
    ('support', 'techSupport', 'medium', 20),
    ('help', 'techSupport', 'low', 10),
    ('assistance', 'techSupport', 'low', 10),
    ('technical', 'techSupport', 'medium', 15),
    ('irs', 'government', 'high', 35),
    ('tax', 'government', 'high', 30),
    ('social security', 'government', 'high', 35),
    ('government', 'government', 'high', 25),
    ('official', 'government', 'medium', 15)
) AS new_patterns(keyword, category, severity, weight)
WHERE NOT EXISTS (
    SELECT 1 FROM public.patterns
    WHERE patterns.keyword = new_patterns.keyword
    AND patterns.category = new_patterns.category
);

-- Create function for user analytics (safe to recreate)
CREATE OR REPLACE FUNCTION get_user_daily_trends(user_id_param UUID, days_param INTEGER DEFAULT 30)
RETURNS TABLE (
    scan_day DATE,
    total_scans BIGINT,
    avg_risk DECIMAL(5,2),
    phishing_count BIGINT,
    suspicious_count BIGINT,
    safe_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        date_trunc('day', sl.created_at)::DATE as scan_day,
        COUNT(*) as total_scans,
        ROUND(AVG(sl.risk_score), 2) as avg_risk,
        COUNT(*) FILTER (WHERE sl.verdict = 'phishing') as phishing_count,
        COUNT(*) FILTER (WHERE sl.verdict = 'suspicious') as suspicious_count,
        COUNT(*) FILTER (WHERE sl.verdict = 'safe') as safe_count
    FROM public.scan_logs sl
    WHERE sl.user_id = user_id_param
        AND sl.created_at >= NOW() - INTERVAL '1 day' * days_param
    GROUP BY date_trunc('day', sl.created_at)::DATE
    ORDER BY scan_day DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp (safe to recreate)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patterns_updated_at ON public.patterns;
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON public.patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

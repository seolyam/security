#!/bin/bash

echo "🔍 PhishingSense Supabase Connection Diagnostic"
echo "=============================================="

# Check environment configuration
echo "📄 Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    echo "📋 Environment variables:"
    grep -E "NEXT_PUBLIC_SUPABASE" .env.local || echo "❌ No Supabase variables found"
else
    echo "❌ .env.local not found!"
    echo "📝 Please create .env.local with:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://saxmpvvgjkidotpqsaht.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheG1wdnZnamtpZG90cHFzYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjQ2NTAsImV4cCI6MjA3Njk0MDY1MH0.Z05qOMiT_OnNLD3WwNxd-gTEwg1LRSwHDoYQOpq7vEY"
    exit 1
fi

echo ""
echo "🗄️  Database Setup Instructions:"
echo "1. Go to: https://supabase.com/dashboard/project/saxmpvvgjkidotpqsaht"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the entire contents of supabase-schema.sql"
echo "4. Click Run to execute the schema"
echo ""
echo "📋 Alternative: Use the Supabase CLI (if installed):"
echo "supabase db push"
echo ""
echo "🔧 Manual verification steps:"
echo "1. Check if tables exist: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
echo "2. Check RLS policies: SELECT * FROM pg_policies WHERE schemaname = 'public';"
echo "3. Test auth: Try signing up with a test email"
echo ""
echo "🐛 If you see empty error objects {} in console:"
echo "• Database schema not applied yet"
echo "• RLS policies blocking the operation"
echo "• Incorrect Supabase project URL or key"
echo ""
echo "📚 Current schema includes:"
echo "• users, scan_logs, reports, user_settings, patterns, comments tables"
echo "• Row Level Security policies for all tables"
echo "• Default phishing detection patterns"
echo "• Analytics functions and triggers"
echo ""
echo "🚀 After applying schema, restart the dev server:"
echo "pnpm dev"

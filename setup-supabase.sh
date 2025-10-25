#!/bin/bash

echo "🚀 PhishingSense v3.0 Supabase Setup"
echo "====================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "📝 Please create .env.local with the following content:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=https://saxmpvvgjkidotpqsaht.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheG1wdnZnamtpZG90cHFzYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjQ2NTAsImV4cCI6MjA3Njk0MDY1MH0.Z05qOMiT_OnNLD3WwNxd-gTEwg1LRSwHDoYQOpq7vEY"
    echo ""
    exit 1
else
    echo "✅ .env.local file found"
fi

echo ""
echo "🗄️  Database Setup Instructions:"
echo "1. Go to your Supabase project: https://supabase.com/dashboard/project/saxmpvvgjkidotpqsaht"
echo "2. Navigate to the SQL Editor"
echo "3. Copy and paste the entire contents of supabase-schema.sql"
echo "4. Run the SQL script to create all tables and policies"
echo ""

echo "📋 Next Steps:"
echo "1. Run the database migration in Supabase SQL Editor"
echo "2. Start the development server: npm run dev"
echo "3. Test user registration and login"
echo "4. Try analyzing an email to test cloud sync"
echo ""

echo "🔧 Key Features Now Available:"
echo "• User authentication (signup/login)"
echo "• Cloud storage for scan history"
echo "• Synchronized settings across devices"
echo "• Real-time analytics dashboard"
echo "• Dynamic rule updates from database"
echo ""

echo "📚 For more details, see:"
echo "• supabase-schema.sql - Complete database schema"
echo "• README.md - Updated setup instructions"
echo "• update.md - Integration specifications"

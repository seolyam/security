#!/bin/bash

echo "🗑️  PhishingSense Database Reset Script"
echo "======================================"

echo "⚠️  WARNING: This will DELETE all existing data!"
echo "This script drops all tables and recreates them from scratch."
echo ""
echo "Use this if:"
echo "• You want to start completely fresh"
echo "• You have corrupted data"
echo "• You're getting constraint or policy errors"
echo ""

read -p "Are you sure you want to reset the database? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled."
    exit 1
fi

echo ""
echo "📝 Database Reset Instructions:"
echo "=============================="
echo "1. 🌐 Go to your Supabase project:"
echo "   https://supabase.com/dashboard/project/saxmpvvgjkidotpqsaht"
echo ""
echo "2. 📝 Navigate to SQL Editor"
echo ""
echo "3. 📋 Run this SQL to drop existing tables:"
echo ""
echo "   -- Drop all tables (run this first)"
echo "   DROP TABLE IF EXISTS public.users CASCADE;"
echo "   DROP TABLE IF EXISTS public.scan_logs CASCADE;"
echo "   DROP TABLE IF EXISTS public.reports CASCADE;"
echo "   DROP TABLE IF EXISTS public.user_settings CASCADE;"
echo "   DROP TABLE IF EXISTS public.patterns CASCADE;"
echo "   DROP TABLE IF EXISTS public.comments CASCADE;"
echo ""
echo "4. 📋 Then run the full supabase-schema.sql"
echo ""
echo "5. 🔄 Restart your development server:"
echo "   pkill -f 'next dev' && pnpm dev"
echo ""
echo "✅ After reset, try signing up again - everything should work!"

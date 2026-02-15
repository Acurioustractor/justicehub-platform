#!/bin/bash

# Copy migration SQL to clipboard and open Supabase dashboard

MIGRATION_FILE="supabase/migrations/20250123000001_create_unified_profiles_system.sql"

echo ""
echo "🚀 Supabase Migration Helper"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 Copying migration SQL to clipboard..."

# Copy to clipboard (works on macOS)
cat "$MIGRATION_FILE" | pbcopy

echo "✅ SQL copied to clipboard!"
echo ""
echo "📖 Next steps:"
echo "   1. Opening Supabase Dashboard..."
echo "   2. Navigate to: SQL Editor"
echo "   3. Click: New Query"
echo "   4. Paste (Cmd+V) the SQL from clipboard"
echo "   5. Click: Run (or press Cmd+Enter)"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

# Open Supabase dashboard
open "https://supabase.com/dashboard/project/_/sql"

echo "✨ Ready! Paste and run the SQL in your browser."
echo ""

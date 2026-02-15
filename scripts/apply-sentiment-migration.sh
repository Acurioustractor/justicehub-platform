#!/bin/bash

# ALMA Media Sentiment Tracking Migration
# Applies database schema for sentiment tracking and correlation analysis

MIGRATION_FILE="supabase/migrations/20260101000002_add_media_sentiment_tracking.sql"
SUPABASE_URL="https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql/new"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ALMA Media Sentiment Tracking - Migration Script        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 This migration adds:"
echo "   ✓ alma_media_articles - Sentiment analysis for news articles"
echo "   ✓ alma_government_programs - Government program tracking"
echo "   ✓ alma_program_interventions - Link programs to interventions"
echo "   ✓ alma_daily_sentiment - Materialized view for daily sentiment"
echo "   ✓ alma_sentiment_program_correlation - Sentiment vs program correlation"
echo ""
echo "🔗 Opening Supabase SQL Editor..."
echo ""
open "$SUPABASE_URL"

echo "📄 Migration SQL has been copied to clipboard!"
echo ""
cat "$MIGRATION_FILE" | pbcopy

echo "✅ Next steps:"
echo "   1. Paste the SQL into the editor (Cmd+V)"
echo "   2. Click 'Run' button"
echo "   3. Wait for confirmation"
echo "   4. Run: node scripts/check-sentiment-tables.mjs"
echo ""

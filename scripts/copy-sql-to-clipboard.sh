#!/bin/bash

echo "📋 Copying SQL migration to clipboard..."

# Copy the entire SQL file to clipboard
cat /Users/benknight/qld-youth-justice-tracker/supabase/migrations/002_scraper_monitoring.sql | pbcopy

echo "✅ SQL migration copied to clipboard!"
echo ""
echo "📝 Next steps:"
echo "1. Go to: https://ivvvkombgqvjyrrmwmbs.supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs/sql/new"
echo "2. Paste (Cmd+V) the SQL"
echo "3. Click 'Run' button"
echo "4. Look for 'Success. No rows returned'"
echo ""
echo "Then come back and run: npm run scrape:monitored"
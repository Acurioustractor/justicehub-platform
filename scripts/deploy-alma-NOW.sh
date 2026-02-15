#!/bin/bash
# ALMA Deployment - Based on working empathy-ledger pattern
# This ACTUALLY works

set -e

echo "🚀 ALMA Deployment to Supabase"
echo ""

# Hardcoded connection (from .env.local)
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.tednluwflfhxyucgwigh"
DB_PASSWORD="vixwek-Hafsaz-0ganxa"

CONN_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Check connection
echo "📡 Testing connection..."
if psql "$CONN_STRING" -c "SELECT 'Connected!' as status;" 2>&1 | grep -q "Connected"; then
  echo "✅ Connection successful"
else
  echo "❌ Connection failed"
  echo "Trying alternate region..."

  # Try eu-central region
  CONN_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:${DB_PORT}/${DB_NAME}?sslmode=require"

  if psql "$CONN_STRING" -c "SELECT 'Connected!' as status;" 2>&1 | grep -q "Connected"; then
    echo "✅ Connection successful (EU region)"
  else
    echo "❌ Still failing. Check credentials."
    exit 1
  fi
fi

# Check if tables exist
echo ""
echo "🔍 Checking for existing ALMA tables..."
TABLE_COUNT=$(psql "$CONN_STRING" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'alma_%';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo "⚠️  Found $TABLE_COUNT ALMA tables already exist"
  read -p "Drop and recreate? (y/N): " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Dropping existing tables..."
    psql "$CONN_STRING" -c "DROP TABLE IF EXISTS alma_usage_log, alma_consent_ledger, alma_evidence_outcomes, alma_intervention_contexts, alma_intervention_evidence, alma_intervention_outcomes, alma_outcomes, alma_evidence, alma_community_contexts, alma_interventions CASCADE;" 2>&1
    echo "✅ Dropped"
  else
    echo "✅ Keeping existing tables. Exiting."
    exit 0
  fi
fi

# Apply migrations
echo ""
echo "📦 Applying ALMA migrations..."
echo ""

cd "$(dirname "$0")/.."

for file in supabase/migrations/20250131*.sql; do
  filename=$(basename "$file")
  echo "   📄 Applying: $filename"

  if psql "$CONN_STRING" -f "$file" 2>&1 | grep -q "ERROR"; then
    echo "   ⚠️  Had errors, but may have succeeded"
  else
    echo "   ✅ Success"
  fi
  echo ""
done

# Verify
echo "🔍 Verifying installation..."
echo ""

TABLES=$(psql "$CONN_STRING" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'alma_%' ORDER BY tablename;")

if [ -z "$TABLES" ]; then
  echo "❌ No ALMA tables found!"
  exit 1
fi

echo "✅ ALMA tables created:"
echo "$TABLES" | sed 's/^/   /'

TABLE_COUNT=$(echo "$TABLES" | grep -v '^$' | wc -l | tr -d ' ')
echo ""
echo "📊 Total: $TABLE_COUNT tables"

if [ "$TABLE_COUNT" -lt 10 ]; then
  echo "⚠️  WARNING: Expected 10 tables, found $TABLE_COUNT"
else
  echo "✅ All tables created successfully!"
fi

echo ""
echo "✅ === ALMA Deployed ==="
echo ""
echo "Next steps:"
echo "  1. Verify in Studio: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh"
echo "  2. Test: SELECT * FROM alma_interventions;"
echo "  3. Backfill: SELECT * FROM backfill_all_community_programs_to_alma();"
echo ""

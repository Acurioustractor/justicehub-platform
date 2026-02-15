#!/usr/bin/env bash
set -euo pipefail

echo "Checking for hardcoded Supabase JWT-like literals in src/app and src/lib..."

if rg -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+" src/app src/lib; then
  echo ""
  echo "ERROR: Hardcoded JWT-like literal detected in runtime source files."
  echo "Use environment variables instead (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, EMPATHY_LEDGER_URL, EMPATHY_LEDGER_API_KEY)."
  exit 1
fi

echo "No hardcoded Supabase JWT-like literals found."

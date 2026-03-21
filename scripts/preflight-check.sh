#!/bin/bash
# Session Pre-Flight Check
# Verifies DB connectivity, correct project, and dev environment health
# Called by Claude Code SessionStart hook

set -euo pipefail

EXPECTED_PROJECT="tednluwflfhxyucgwigh"
ENV_FILE="$(dirname "$0")/../.env.local"
ERRORS=()

# Load env
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep '=' | xargs)
else
  echo "PREFLIGHT FAIL: .env.local not found"
  exit 1
fi

# 1. Verify Supabase project URL matches expected
if [[ "${NEXT_PUBLIC_SUPABASE_URL:-}" == *"$EXPECTED_PROJECT"* ]]; then
  echo "DB Project: OK ($EXPECTED_PROJECT)"
else
  ERRORS+=("WRONG SUPABASE PROJECT! Expected $EXPECTED_PROJECT, got ${NEXT_PUBLIC_SUPABASE_URL:-unset}")
fi

# 2. Check key API keys exist
for KEY in GROQ_API_KEY OPENAI_API_KEY SUPABASE_SERVICE_ROLE_KEY; do
  if [ -z "${!KEY:-}" ]; then
    ERRORS+=("Missing env var: $KEY")
  fi
done

# 3. Check dev port 3004 availability
if lsof -i :3004 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Dev Server: Running on :3004"
else
  echo "Dev Server: Not running (start with npm run dev)"
fi

# Report
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "=== PREFLIGHT WARNINGS ==="
  for err in "${ERRORS[@]}"; do
    echo "  WARNING: $err"
  done
  exit 1
fi

echo "Preflight: ALL CLEAR"

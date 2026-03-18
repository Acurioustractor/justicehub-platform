#!/bin/bash
# CONTAINED Launch Smoke Test
# Usage: bash scripts/preflight-smoke.sh [base_url]
# Default: http://localhost:3004

BASE="${1:-http://localhost:3004}"
PASS=0
FAIL=0

check() {
  local label="$1" url="$2" expect="${3:-200}"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url")
  if [ "$code" = "$expect" ]; then
    echo "  ✓ $label ($code)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $label (got $code, expected $expect)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== CONTAINED Launch Smoke Test ==="
echo "Base: $BASE"
echo ""

echo "--- Pages ---"
check "Home"                "$BASE/"
check "Tour"                "$BASE/contained/tour"
check "Help form"           "$BASE/contained/help"
check "Act"                 "$BASE/contained/act"
check "Stories"             "$BASE/contained/stories"
check "Experience"          "$BASE/contained/experience"
check "Blog"                "$BASE/blog"
check "Contact"             "$BASE/contact"
check "Intelligence"        "$BASE/intelligence"
check "Funding"             "$BASE/justice-funding"

echo ""
echo "--- APIs ---"
check "Contact GET (405)"   "$BASE/api/contact" "405"

echo ""
echo "--- Form Submission ---"
FORM_RESULT=$(curl -s -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test","email":"smoke@test.dev","phone":"","organization":"","category":"contained-help","subject":"[SMOKE] Test","message":"Automated smoke test — safe to ignore"}')

if echo "$FORM_RESULT" | grep -q '"success":true'; then
  echo "  ✓ Help form POST → success"
  PASS=$((PASS + 1))
else
  echo "  ✗ Help form POST failed: $FORM_RESULT"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "🟢 READY TO LAUNCH" || echo "🔴 FIX FAILURES BEFORE LAUNCH"
exit $FAIL

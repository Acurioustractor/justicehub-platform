#!/usr/bin/env bash
# Morning Briefing — Cross-system health check
# JusticeHub + GrantScope (shared DB) + Empathy Ledger
set -euo pipefail

BASE_URL="${JH_BASE_URL:-http://localhost:3004}"
HEALTH_ENDPOINT="$BASE_URL/api/admin/data-health"

echo "========================================"
echo "  JusticeHub Morning Briefing"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "========================================"
echo ""

# --- 1. Data Health API ---
echo ">> Fetching data health from $HEALTH_ENDPOINT ..."
HEALTH_JSON=$(curl -sf "$HEALTH_ENDPOINT" 2>/dev/null || echo "FAIL")

if [ "$HEALTH_JSON" = "FAIL" ]; then
  echo "   [!] Could not reach data-health API. Is the dev server running on port 3004?"
  echo ""
else
  echo ""
  echo "--- Database Summary ---"
  echo "$HEALTH_JSON" | jq -r '.summary | "Tables: \(.total_tables) | Healthy: \(.healthy) | Warning: \(.warning) | Critical: \(.critical) | Total records: \(.total_records)"'

  echo ""
  echo "--- ALMA Enrichment ---"
  echo "$HEALTH_JSON" | jq -r '.enrichment[] | "  \(.label): \(.current)/\(.total) (\(.percentage)%)"'

  echo ""
  echo "--- EL Sync Health ---"
  EL_STATUS=$(echo "$HEALTH_JSON" | jq -r '.elSyncHealth.status // "not available"')
  echo "  Status: $EL_STATUS"
  if [ "$EL_STATUS" != "not available" ] && [ "$EL_STATUS" != "null" ]; then
    echo "$HEALTH_JSON" | jq -r '.elSyncHealth | "  Synced orgs: \(.jhSyncedOrgCount) | JH stories: \(.jhStoryCount) | EL stories: \(.elStoryCount // "N/A")"'
    echo "$HEALTH_JSON" | jq -r '.elSyncHealth.recommendations[]? | "  -> \(.)"'
  fi

  echo ""
  echo "--- Critical Tables (red) ---"
  CRITICAL=$(echo "$HEALTH_JSON" | jq -r '[.tables[] | select(.healthScore == "red" and .count == 0)] | length')
  if [ "$CRITICAL" = "0" ]; then
    echo "  None — all tables have data."
  else
    echo "$HEALTH_JSON" | jq -r '.tables[] | select(.healthScore == "red" and .count == 0) | "  [!] \(.name) (\(.domain)) — empty"'
  fi

  echo ""
  echo "--- Recommendations ---"
  RECS=$(echo "$HEALTH_JSON" | jq -r '.recommendations | length')
  if [ "$RECS" = "0" ]; then
    echo "  No recommendations — everything looks good."
  else
    echo "$HEALTH_JSON" | jq -r '.recommendations[] | "  [\(.priority)] \(.title): \(.description)"'
  fi
fi

# --- 2. Recent Git Activity ---
echo ""
echo "--- Recent Commits (last 5) ---"
cd "$(dirname "$0")/.."
git log --oneline -5 2>/dev/null || echo "  (not a git repo)"

# --- 3. GS Entity Bridge Stats ---
echo ""
echo "--- GS Entity Bridge ---"
BRIDGE_ORGS=$(echo "$HEALTH_JSON" | jq -r '[.tables[] | select(.name == "organizations")] | .[0].count // "?"' 2>/dev/null || echo "?")
echo "  Organizations tracked: $BRIDGE_ORGS"
echo "  (Run SELECT COUNT(*) FROM organizations WHERE gs_entity_id IS NOT NULL for bridge count)"

echo ""
echo "========================================"
echo "  Briefing complete."
echo "========================================"

#!/bin/bash
# Final Cleanup: Move remaining root files to proper locations

set -e
cd /Users/benknight/Code/JusticeHub/docs

echo "=========================================="
echo "Final Cleanup: Organizing Root Files"
echo "=========================================="
echo ""

echo "Phase 1: Move system-specific guides..."

# Programs system
mv ADDING_PROGRAMS_QUICK_START.md systems/admin/ 2>/dev/null || true
mv PROGRAM_MANAGEMENT_GUIDE.md systems/admin/ 2>/dev/null || true
mv PROGRAM_STORY_CONNECTIONS_OVERVIEW.md systems/admin/ 2>/dev/null || true
mv QUICK_START_PROGRAMS.md systems/admin/ 2>/dev/null || true

# Auto-linking (part of profiles)
mv AUTO_LINKING_SYSTEM.md systems/profiles/ 2>/dev/null || true
mv AUTO_DISCOVERY_GUIDE.md systems/profiles/ 2>/dev/null || true

# Connected content (part of profiles/alma)
mv CONNECTED_CONTENT_ARCHITECTURE.md strategic/reference/ 2>/dev/null || true
mv CONNECTED_SYSTEM_GUIDE.md systems/profiles/ 2>/dev/null || true

# Profile editing
mv SIMPLE_PROFILE_EDITING_GUIDE.md systems/profiles/ 2>/dev/null || true

# Youth justice filtering (part of ALMA/search)
mv YOUTH_JUSTICE_FILTERING.md systems/alma/ 2>/dev/null || true

echo "✅ System-specific guides moved"
echo ""

echo "Phase 2: Move operational guides..."

# Import/export guides
mv CSV_IMPORT_GUIDE.md operations/development/ 2>/dev/null || true
mv SERVICE_IMPORT_GUIDE.md operations/development/ 2>/dev/null || true

# Database operations
mv MANUAL_DATABASE_STEPS.md operations/development/ 2>/dev/null || true
mv EXISTING_SCHEMA_AUDIT.md operations/development/ 2>/dev/null || true

# General quick starts
mv QUICK_START.md operations/deployment/ 2>/dev/null || true
mv QUICK_START_MIGRATION.md operations/deployment/ 2>/dev/null || true

echo "✅ Operational guides moved"
echo ""

echo "Phase 3: Move research/strategic docs..."

# Research findings
mv DATA_GOV_AU_FINDINGS.md strategic/reference/ 2>/dev/null || true
mv QLD_OPEN_DATA_EXPLORATION.md strategic/reference/ 2>/dev/null || true

# Visualization guides (Mindaroo/PRF)
mkdir -p prf 2>/dev/null || true
mv MINDAROO_SCREENSHOTS_GUIDE.md prf/ 2>/dev/null || true
mv MINDAROO_VISUALIZATION_GUIDE.md prf/ 2>/dev/null || true

# Community mapping
mv community-map.md strategic/reference/ 2>/dev/null || true

echo "✅ Strategic docs moved"
echo ""

echo "Phase 4: Archive completion files..."

# Completed work
mv CLEANUP_COMPLETE.md historical/reference-only/ 2>/dev/null || true
mv IMPROVEMENTS_COMPLETE.md historical/reference-only/ 2>/dev/null || true
mv UNIFIED_PROFILES_COMPLETE.md historical/reference-only/ 2>/dev/null || true
mv OONCHIUMPA_ALL_PROGRAMS_COMPLETE.md historical/reference-only/ 2>/dev/null || true
mv OONCHIUMPA_IA_TEST_COMPLETE.md historical/reference-only/ 2>/dev/null || true
mv OONCHIUMPA_PROGRAMS_ADDED.md historical/reference-only/ 2>/dev/null || true
mv OONCHIUMPA_PROGRAM_ADDED.md historical/reference-only/ 2>/dev/null || true
mv READY_TO_EXECUTE.md historical/reference-only/ 2>/dev/null || true

echo "✅ Completion files archived"
echo ""

echo "Phase 5: Clean up meta-documentation..."

# Documentation about documentation
mv DOCUMENTATION_ORGANIZATION.md historical/reference-only/ 2>/dev/null || true
mv DOCUMENTATION_REORGANIZATION.md historical/reference-only/ 2>/dev/null || true
mv ROOT_FILES_EXPLAINED.md historical/reference-only/ 2>/dev/null || true
mv README_OLD.md historical/reference-only/ 2>/dev/null || true

echo "✅ Meta-docs archived"
echo ""

echo "Phase 6: Count remaining files..."
ROOT_COUNT=$(ls *.md 2>/dev/null | grep -v "START_HERE.md" | grep -v "README.md" | grep -v "AI_AGENT_WIKI_DESIGN.md" | grep -v "RADICAL_SIMPLIFICATION_PLAN.md" | wc -l | xargs)

echo ""
echo "Remaining in root: $ROOT_COUNT files (should be 4: START_HERE.md, README.md, AI_AGENT_WIKI_DESIGN.md, RADICAL_SIMPLIFICATION_PLAN.md)"
echo ""

if [ "$ROOT_COUNT" -gt 0 ]; then
    echo "Files still in root:"
    ls *.md 2>/dev/null | grep -v "START_HERE.md" | grep -v "README.md" | grep -v "AI_AGENT_WIKI_DESIGN.md" | grep -v "RADICAL_SIMPLIFICATION_PLAN.md" || echo "  (none)"
fi

echo ""
echo "=========================================="
echo "✅ Final Cleanup Complete!"
echo "=========================================="
echo ""
echo "Root should now only contain:"
echo "  - START_HERE.md (main navigation)"
echo "  - README.md (documentation index)"
echo "  - AI_AGENT_WIKI_DESIGN.md (design doc)"
echo "  - RADICAL_SIMPLIFICATION_PLAN.md (this process doc)"
echo ""

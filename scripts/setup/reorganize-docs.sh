#!/bin/bash
# JusticeHub Documentation Reorganization Script
# Based on DHH-inspired structure: organize by purpose, not chronology

set -e  # Exit on error

REPO_ROOT="/Users/benknight/Code/JusticeHub"
cd "$REPO_ROOT"

echo "=========================================="
echo "JusticeHub Documentation Reorganization"
echo "=========================================="
echo ""

# Phase 1: Create directory structure
echo "Phase 1: Creating directory structure..."
mkdir -p docs/guides/{alma,automation,deployment,empathy-ledger,brand}
mkdir -p docs/specs
mkdir -p docs/architecture
mkdir -p docs/completed
mkdir -p docs/archive
mkdir -p logs/health-checks
mkdir -p scripts/setup

echo "✅ Directory structure created"
echo ""

# Phase 2: Move files (only if they exist in root)
echo "Phase 2: Moving files to organized structure..."

# ALMA guides
echo "  → Moving ALMA guides..."
[ -f "ALMA_QUICK_START.md" ] && mv ALMA_QUICK_START.md docs/guides/alma/ || true
[ -f "ALMA_DATA_PRESENTATION_STRATEGY.md" ] && mv ALMA_DATA_PRESENTATION_STRATEGY.md docs/guides/alma/ || true
[ -f "ALMA_ANALYTICS_STUDIO_PLAN.md" ] && mv ALMA_ANALYTICS_STUDIO_PLAN.md docs/guides/alma/ || true

# Automation guides
echo "  → Moving automation guides..."
[ -f "AUTOMATION_README.md" ] && mv AUTOMATION_README.md docs/guides/automation/ || true
[ -f "AUTOMATION_QUICK_START.md" ] && mv AUTOMATION_QUICK_START.md docs/guides/automation/ || true
[ -f "AUTOMATION_ENABLED.md" ] && mv AUTOMATION_ENABLED.md docs/guides/automation/ || true
[ -f "GITHUB_ACTIONS_SETUP.md" ] && mv GITHUB_ACTIONS_SETUP.md docs/guides/automation/ || true
[ -f "DATA_INGESTION_AUTOMATION_PLAN.md" ] && mv DATA_INGESTION_AUTOMATION_PLAN.md docs/guides/automation/ || true

# Deployment guides
echo "  → Moving deployment guides..."
[ -f "DEPLOY_NOW.md" ] && mv DEPLOY_NOW.md docs/guides/deployment/ || true
[ -f "DEPLOYMENT_NEXT_STEPS.md" ] && mv DEPLOYMENT_NEXT_STEPS.md docs/guides/deployment/ || true
[ -f "BITWARDEN_SECRETS.md" ] && mv BITWARDEN_SECRETS.md docs/guides/deployment/ || true
[ -f "GITHUB_SECRETS_SETUP.md" ] && mv GITHUB_SECRETS_SETUP.md docs/guides/deployment/ || true
[ -f "QUICK_REFERENCE.md" ] && mv QUICK_REFERENCE.md docs/guides/deployment/ || true

# Empathy Ledger integration
echo "  → Moving Empathy Ledger guides..."
[ -f "EMPATHY_LEDGER_INTEGRATION_CORRECTED.md" ] && mv EMPATHY_LEDGER_INTEGRATION_CORRECTED.md docs/guides/empathy-ledger/ || true

# Brand guides
echo "  → Moving brand guides..."
[ -f "BRAND_COMPONENTS.md" ] && mv BRAND_COMPONENTS.md docs/guides/brand/ || true

# Architecture
echo "  → Moving architecture docs..."
[ -f "ALMA_UNIFICATION_STRATEGY.md" ] && mv ALMA_UNIFICATION_STRATEGY.md docs/architecture/ || true
[ -f "PROJECT_MASTER_INDEX.md" ] && mv PROJECT_MASTER_INDEX.md docs/architecture/ || true

# Completed work
echo "  → Moving completed work reports..."
[ -f "ALMA_MEDIA_SENTIMENT_LIVE.md" ] && mv ALMA_MEDIA_SENTIMENT_LIVE.md docs/completed/ || true
[ -f "ALMA_SCROLLYTELLING_COMPLETE.md" ] && mv ALMA_SCROLLYTELLING_COMPLETE.md docs/completed/ || true
[ -f "ALMA_SENTIMENT_DEMO_COMPLETE.md" ] && mv ALMA_SENTIMENT_DEMO_COMPLETE.md docs/completed/ || true
[ -f "ALMA_SENTIMENT_REPORT_DEMO.md" ] && mv ALMA_SENTIMENT_REPORT_DEMO.md docs/completed/ || true
[ -f "ALMA_UNIFICATION_COMPLETE.md" ] && mv ALMA_UNIFICATION_COMPLETE.md docs/completed/ || true
[ -f "BRAND_ALIGNMENT_COMPLETE.md" ] && mv BRAND_ALIGNMENT_COMPLETE.md docs/completed/ || true
[ -f "BRAND_UNIFICATION_COMPLETE.md" ] && mv BRAND_UNIFICATION_COMPLETE.md docs/completed/ || true
[ -f "DEPLOYMENT_SUCCESS.md" ] && mv DEPLOYMENT_SUCCESS.md docs/completed/ || true
[ -f "MEDIA_SENTIMENT_TRACKING_COMPLETE.md" ] && mv MEDIA_SENTIMENT_TRACKING_COMPLETE.md docs/completed/ || true

# Archive (superseded docs)
echo "  → Moving archived/outdated docs..."
[ -f "DEPLOY_AUTOMATION_NOW.md" ] && mv DEPLOY_AUTOMATION_NOW.md docs/archive/ || true
[ -f "DEPLOY_AUTOMATION_CORRECTED.md" ] && mv DEPLOY_AUTOMATION_CORRECTED.md docs/archive/ || true
[ -f "ANTHROPIC_MAX_PLAN_SETUP.md" ] && mv ANTHROPIC_MAX_PLAN_SETUP.md docs/archive/ || true
[ -f "CLAUDE.md" ] && mv CLAUDE.md docs/archive/ || true

# Scripts and data
echo "  → Moving scripts and data files..."
[ -f "health-check-2026-01-02.json" ] && mv health-check-2026-01-02.json logs/health-checks/ || true
[ -f "setup-github-secrets-from-bitwarden.sh" ] && mv setup-github-secrets-from-bitwarden.sh scripts/setup/ || true

echo "✅ Files moved to organized structure"
echo ""

# Phase 3: Show summary
echo "Phase 3: Summary of changes..."
echo ""
echo "New structure:"
echo "  /docs/guides/alma/          (ALMA system guides)"
echo "  /docs/guides/automation/    (GitHub Actions, automation)"
echo "  /docs/guides/deployment/    (Deploy, secrets, setup)"
echo "  /docs/guides/empathy-ledger/ (EL integration)"
echo "  /docs/guides/brand/         (Brand guidelines)"
echo "  /docs/specs/                (Feature specifications - new!)"
echo "  /docs/architecture/         (System design decisions)"
echo "  /docs/completed/            (Completed work reports)"
echo "  /docs/archive/              (Outdated/superseded docs)"
echo ""

# Count files in new structure
ALMA_COUNT=$(find docs/guides/alma -type f 2>/dev/null | wc -l | tr -d ' ')
AUTO_COUNT=$(find docs/guides/automation -type f 2>/dev/null | wc -l | tr -d ' ')
DEPLOY_COUNT=$(find docs/guides/deployment -type f 2>/dev/null | wc -l | tr -d ' ')
EL_COUNT=$(find docs/guides/empathy-ledger -type f 2>/dev/null | wc -l | tr -d ' ')
BRAND_COUNT=$(find docs/guides/brand -type f 2>/dev/null | wc -l | tr -d ' ')
ARCH_COUNT=$(find docs/architecture -type f 2>/dev/null | wc -l | tr -d ' ')
COMPLETE_COUNT=$(find docs/completed -type f 2>/dev/null | wc -l | tr -d ' ')
ARCHIVE_COUNT=$(find docs/archive -type f 2>/dev/null | wc -l | tr -d ' ')

echo "Files organized:"
echo "  ALMA guides:        $ALMA_COUNT"
echo "  Automation guides:  $AUTO_COUNT"
echo "  Deployment guides:  $DEPLOY_COUNT"
echo "  EL guides:          $EL_COUNT"
echo "  Brand guides:       $BRAND_COUNT"
echo "  Architecture:       $ARCH_COUNT"
echo "  Completed work:     $COMPLETE_COUNT"
echo "  Archived:           $ARCHIVE_COUNT"
echo ""

# Check for remaining .md files in root
ROOT_MD_COUNT=$(find . -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Markdown files remaining in root: $ROOT_MD_COUNT"
if [ "$ROOT_MD_COUNT" -gt 0 ]; then
    echo "  (These are likely README.md or need manual review)"
    find . -maxdepth 1 -name "*.md" -type f | sed 's/^\.\//  - /'
fi

echo ""
echo "=========================================="
echo "✅ Reorganization complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review: cd docs && ls -R"
echo "  2. Create docs/README.md index"
echo "  3. Set up spec workflow (docs/specs/TEMPLATE.md)"
echo "  4. Git commit the reorganization"
echo ""

#!/bin/bash
# Radical Simplification: 360 → 80 Files
# Philosophy: Systems > Chronology, One Source of Truth per System

set -e
cd /Users/benknight/Code/JusticeHub/docs

echo "=========================================="
echo "Radical Simplification: 360 → 80 Files"
echo "=========================================="
echo ""

# Phase 1: Create new structure
echo "Phase 1: Creating new structure..."
mkdir -p systems/{alma,profiles,empathy-ledger,scraper,admin}
mkdir -p operations/{deployment,automation,development}
mkdir -p strategic/{plans,reference}
mkdir -p historical/reference-only

echo "✅ New structure created"
echo ""

# Phase 2: Remove exact duplicates
echo "Phase 2: Removing exact duplicates..."
[ -f archived/ADMIN_COMPLETE_FLOWS.md ] && rm archived/ADMIN_COMPLETE_FLOWS.md || true
[ -f archived/ADMIN_FLOWS_ANALYSIS.md ] && rm archived/ADMIN_FLOWS_ANALYSIS.md || true
[ -f archived/ADMIN_QUICK_START.md ] && rm archived/ADMIN_QUICK_START.md || true
[ -f archived/ADMIN_ROUTES_COMPLETE.md ] && rm archived/ADMIN_ROUTES_COMPLETE.md || true
[ -f archived/ADMIN_USER_GUIDE.md ] && rm archived/ADMIN_USER_GUIDE.md || true
[ -f archived/AUTO_LINKING_COMPLETE.md ] && rm archived/AUTO_LINKING_COMPLETE.md || true
[ -f archived/BLOG_EDITOR_COMPLETE.md ] && rm archived/BLOG_EDITOR_COMPLETE.md || true
[ -f archived/CENTRE_OF_EXCELLENCE_COMPLETE.md ] && rm archived/CENTRE_OF_EXCELLENCE_COMPLETE.md || true
[ -f archived/EMPATHY_LEDGER_FULL_INTEGRATION.md ] && rm archived/EMPATHY_LEDGER_FULL_INTEGRATION.md || true
[ -f archived/PROGRAMS_CONSOLIDATION_COMPLETE.md ] && rm archived/PROGRAMS_CONSOLIDATION_COMPLETE.md || true

echo "✅ Duplicates removed"
echo ""

# Phase 3: Consolidate ALMA (33 → systems/alma/)
echo "Phase 3: Consolidating ALMA system..."
find alma -name "*.md" -exec mv {} systems/alma/ \; 2>/dev/null || true
find guides/alma -name "*.md" -exec mv {} systems/alma/ \; 2>/dev/null || true
mv ALMA_*.md systems/alma/ 2>/dev/null || true

# Archive ALMA completion/session notes
find systems/alma -name "*COMPLETE*.md" -exec mv {} historical/reference-only/ \; 2>/dev/null || true
find systems/alma -name "*SESSION*.md" -exec mv {} historical/reference-only/ \; 2>/dev/null || true

echo "✅ ALMA consolidated"
echo ""

# Phase 4: Consolidate Empathy Ledger (11 → systems/empathy-ledger/)
echo "Phase 4: Consolidating Empathy Ledger..."
mv EMPATHY_LEDGER_*.md systems/empathy-ledger/ 2>/dev/null || true
mv features/EMPATHY_LEDGER_*.md systems/empathy-ledger/ 2>/dev/null || true
find guides/empathy-ledger -name "*.md" -exec mv {} systems/empathy-ledger/ \; 2>/dev/null || true

echo "✅ Empathy Ledger consolidated"
echo ""

# Phase 5: Consolidate Profiles (11 → systems/profiles/)
echo "Phase 5: Consolidating Profiles system..."
mv PROFILE_*.md systems/profiles/ 2>/dev/null || true
mv features/*PROFILE*.md systems/profiles/ 2>/dev/null || true
find completed -name "*PROFILE*.md" -exec mv {} systems/profiles/ \; 2>/dev/null || true

echo "✅ Profiles consolidated"
echo ""

# Phase 6: Consolidate Scraper (9 → systems/scraper/)
echo "Phase 6: Consolidating Scraper system..."
mv SCRAPER_*.md systems/scraper/ 2>/dev/null || true
mv INFOXCHANGE_*.md systems/scraper/ 2>/dev/null || true
mv *SCRAPING_STRATEGY.md systems/scraper/ 2>/dev/null || true
mv SCHEMA_ANALYSIS_AND_SCRAPING_STRATEGY.md systems/scraper/ 2>/dev/null || true

echo "✅ Scraper consolidated"
echo ""

# Phase 7: Move operations docs
echo "Phase 7: Organizing operations documentation..."
find guides/deployment -name "*.md" -exec mv {} operations/deployment/ \; 2>/dev/null || true
find guides/automation -name "*.md" -exec mv {} operations/automation/ \; 2>/dev/null || true
mv DEPLOY_*.md operations/deployment/ 2>/dev/null || true
mv AUTOMATION_*.md operations/automation/ 2>/dev/null || true
mv GITHUB_*.md operations/deployment/ 2>/dev/null || true
mv BITWARDEN_*.md operations/deployment/ 2>/dev/null || true
mv TELEGRAM_*.md operations/deployment/ 2>/dev/null || true
mv SUPABASE_*.md operations/development/ 2>/dev/null || true
mv DATABASE_*.md operations/development/ 2>/dev/null || true

echo "✅ Operations organized"
echo ""

# Phase 8: Move strategic docs
echo "Phase 8: Organizing strategic documentation..."
mv *_PLAN.md strategic/plans/ 2>/dev/null || true
mv *_STRATEGY.md strategic/plans/ 2>/dev/null || true
mv *_PROPOSAL.md strategic/plans/ 2>/dev/null || true
mv API_*.md strategic/plans/ 2>/dev/null || true
mv EXPANSION_*.md strategic/plans/ 2>/dev/null || true
mv INFORMATION_ARCHITECTURE_*.md strategic/reference/ 2>/dev/null || true
mv architecture/*.md strategic/reference/ 2>/dev/null || true

echo "✅ Strategic docs organized"
echo ""

# Phase 9: Archive session notes and completion files
echo "Phase 9: Archiving session notes..."
mv SESSION_*.md historical/reference-only/ 2>/dev/null || true
mv *_SUMMARY*.md historical/reference-only/ 2>/dev/null || true
find completed -name "*_COMPLETE.md" -exec mv {} historical/reference-only/ \; 2>/dev/null || true
mv FINAL_*.md historical/reference-only/ 2>/dev/null || true

echo "✅ Session notes archived"
echo ""

# Phase 10: Move admin docs
echo "Phase 10: Consolidating admin system..."
find admin -name "*.md" -exec mv {} systems/admin/ \; 2>/dev/null || true

echo "✅ Admin consolidated"
echo ""

# Phase 11: Clean up old directories
echo "Phase 11: Cleaning up old directories..."
rmdir guides/alma guides/deployment guides/automation guides/empathy-ledger guides/brand 2>/dev/null || true
rmdir guides 2>/dev/null || true
rmdir admin 2>/dev/null || true
rmdir features 2>/dev/null || true
rmdir archive 2>/dev/null || true
rmdir sql sql-scripts 2>/dev/null || true
rmdir architecture 2>/dev/null || true

echo "✅ Old directories removed"
echo ""

# Phase 12: Summary
echo "Phase 12: Generating summary..."
echo ""
echo "New structure:"
echo "  /systems/           (System-specific documentation)"
echo "  /operations/        (Deployment, automation, development)"
echo "  /strategic/         (Plans, roadmap, reference)"
echo "  /historical/        (Archived for reference only)"
echo ""

ALMA_COUNT=$(find systems/alma -name "*.md" 2>/dev/null | wc -l | xargs)
PROFILES_COUNT=$(find systems/profiles -name "*.md" 2>/dev/null | wc -l | xargs)
EL_COUNT=$(find systems/empathy-ledger -name "*.md" 2>/dev/null | wc -l | xargs)
SCRAPER_COUNT=$(find systems/scraper -name "*.md" 2>/dev/null | wc -l | xargs)
ADMIN_COUNT=$(find systems/admin -name "*.md" 2>/dev/null | wc -l | xargs)
OPS_COUNT=$(find operations -name "*.md" 2>/dev/null | wc -l | xargs)
STRATEGIC_COUNT=$(find strategic -name "*.md" 2>/dev/null | wc -l | xargs)
HISTORICAL_COUNT=$(find historical -name "*.md" 2>/dev/null | wc -l | xargs)

echo "Files organized:"
echo "  ALMA:              $ALMA_COUNT files"
echo "  Profiles:          $PROFILES_COUNT files"
echo "  Empathy Ledger:    $EL_COUNT files"
echo "  Scraper:           $SCRAPER_COUNT files"
echo "  Admin:             $ADMIN_COUNT files"
echo "  Operations:        $OPS_COUNT files"
echo "  Strategic:         $STRATEGIC_COUNT files"
echo "  Historical:        $HISTORICAL_COUNT files"
echo ""

TOTAL_ACTIVE=$((ALMA_COUNT + PROFILES_COUNT + EL_COUNT + SCRAPER_COUNT + ADMIN_COUNT + OPS_COUNT + STRATEGIC_COUNT))
echo "Total active docs: $TOTAL_ACTIVE (down from 360)"
echo ""

echo "=========================================="
echo "✅ Radical Simplification Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review systems/ folders"
echo "  2. Manual consolidation (merge similar docs)"
echo "  3. Create START_HERE.md"
echo "  4. Create AI-friendly wiki structure"
echo ""

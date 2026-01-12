#!/bin/bash
# Organize JusticeHub Root Documentation
# Moves markdown files from root to appropriate folders

cd /Users/benknight/Code/JusticeHub

echo "📁 Organizing JusticeHub Documentation..."
echo ""

# Move project-specific docs
echo "Moving Aunty Corrine docs..."
mv AUNTY_CORRINE*.md docs/archived/old-root-docs/ 2>/dev/null
mv README_AUNTY*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving PRF/CV docs..."
mv Benjamin_Knight_CV*.md docs/PRF/ 2>/dev/null
mv PRF_*.md docs/PRF/ 2>/dev/null

echo "Moving Mount Isa docs..."
mv MOUNT_ISA*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving NSW Grant docs..."
mv NSW_GRANT*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving Queensland docs..."
mv QUEENSLAND*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving visualization/design docs..."
mv AI_VISUALIZATION*.md docs/archived/old-root-docs/ 2>/dev/null
mv NAPKIN_AI*.md docs/archived/old-root-docs/ 2>/dev/null
mv SIMPLEST_WORKFLOW*.md docs/archived/old-root-docs/ 2>/dev/null
mv SIMPLIFIED_FIGMA*.md docs/archived/old-root-docs/ 2>/dev/null
mv STORYTELLING*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving session/status docs..."
mv SESSION_*.md docs/archived/old-root-docs/ 2>/dev/null
mv PHASE_*.md docs/archived/old-root-docs/ 2>/dev/null
mv WEEK_*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving deployment/setup docs..."
mv DEPLOY*.md docs/archived/old-root-docs/ 2>/dev/null
mv COMPLETE_SETUP*.md docs/archived/old-root-docs/ 2>/dev/null
mv IMPLEMENTATION_STATUS.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving blog drafts..."
mv BLOG_DRAFT*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving email templates..."
mv *_EMAIL*.md docs/archived/old-root-docs/ 2>/dev/null
mv CONSENT_EMAIL*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving strategy/planning docs..."
mv BUDGET_ALIGNMENT*.md docs/archived/old-root-docs/ 2>/dev/null
mv BACKEND_ENHANCEMENT*.md docs/archived/old-root-docs/ 2>/dev/null
mv CODEBASE_CLEANUP*.md docs/archived/old-root-docs/ 2>/dev/null
mv INTEGRATION_PATCH.md docs/archived/old-root-docs/ 2>/dev/null
mv INTERVIEW_GUIDE*.md docs/archived/old-root-docs/ 2>/dev/null
mv LAUNCH_DAY*.md docs/archived/old-root-docs/ 2>/dev/null
mv MINDAROO_EMAIL*.md docs/archived/old-root-docs/ 2>/dev/null
mv MY_TOOLS.md docs/archived/old-root-docs/ 2>/dev/null
mv WIKI_UPDATE*.md docs/archived/old-root-docs/ 2>/dev/null

echo "Moving implementation guides..."
mv IMPLEMENT_AI*.md docs/archived/old-root-docs/ 2>/dev/null
mv STORY_IMPLEMENTATION*.md docs/archived/old-root-docs/ 2>/dev/null

echo ""
echo "✅ Documentation organized!"
echo ""
echo "Remaining root markdown files:"
ls -1 *.md 2>/dev/null | wc -l
echo ""
echo "Files in docs/alma:"
ls -1 docs/alma/*.md 2>/dev/null | wc -l
echo ""
echo "Files in docs/archived/old-root-docs:"
ls -1 docs/archived/old-root-docs/*.md 2>/dev/null | wc -l

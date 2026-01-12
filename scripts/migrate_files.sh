#!/bin/bash
# File: migrate_files.sh
# Purpose: Reorganize JusticeHub codebase into clean folder structure
# Usage: bash migrate_files.sh

set -e  # Exit on error

echo "🧹 JusticeHub Codebase Cleanup - File Migration"
echo "=============================================="
echo ""
echo "This script will reorganize 71+ markdown files into a clean structure."
echo "A git commit will be created before starting."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

# Safety check - ensure we're in git repo
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository root"
    exit 1
fi

# Create safety commit
echo "📸 Creating safety commit..."
git add -A
git commit -m "chore: pre-cleanup snapshot" || echo "Nothing to commit"

# Create new branch
echo "🌿 Creating cleanup branch..."
git checkout -b cleanup/organize-codebase 2>/dev/null || git checkout cleanup/organize-codebase

echo ""
echo "📁 Creating new directory structure..."

# Create new directory structure
mkdir -p docs/{architecture,guides/{setup,deployment,workflows},implementation,reference,archive/{2024-11-sessions,wiki}}
mkdir -p projects/{prf-fellowship/{application,cv,strategy,revisions,archive},aunty-corrine/{analysis,content,setup},mount-isa/{analysis,strategy},nsw-grant,contained-launch/blog-drafts}
mkdir -p content/{blog-drafts,email-templates,social-media,interview-guides}
mkdir -p prompts/{visualization,figma,mindaroo}
mkdir -p database/{setup,deployment,queries}
mkdir -p .archive/2024-11/{sector-wide-framing,budget-alignment,integration-patch,wiki}
mkdir -p config/{env,docker}

echo "✅ Directory structure created"
echo ""
echo "📦 Migrating files..."

# Function to move file safely
move_file() {
    if [ -f "$1" ]; then
        mv "$1" "$2" && echo "  ✓ $1 → $2"
    else
        echo "  ⚠ Skip: $1 (not found)"
    fi
}

# PRF Fellowship
echo ""
echo "📄 PRF Fellowship files..."
move_file "PRF_APPLICATION_PORTAL_READY.md" "projects/prf-fellowship/application/"
move_file "PRF_APPLICATION_FINAL_RESPONSES.md" "projects/prf-fellowship/application/"
move_file "PRF_BUDGET_DETAILED_FOR_TEMPLATE.md" "projects/prf-fellowship/application/"
move_file "PRF_BUDGET_QUICK_REFERENCE.md" "projects/prf-fellowship/application/"
move_file "PRF_FINAL_SUBMISSION_GUIDE.md" "projects/prf-fellowship/application/"
move_file "PRF_FINAL_SUBMISSION_CHECKLIST.md" "projects/prf-fellowship/application/"
move_file "PRF_SUBMISSION_QUICK_REFERENCE.md" "projects/prf-fellowship/application/"

move_file "Benjamin_Knight_CV_PRF_Fellowship_2026.md" "projects/prf-fellowship/cv/"
move_file "PRF_CV_TEMPLATE.md" "projects/prf-fellowship/cv/"
move_file "PRF_CV_CONVERSION_GUIDE.md" "projects/prf-fellowship/cv/"

move_file "PRF_FELLOWSHIP_APPLICATION_STRATEGY.md" "projects/prf-fellowship/strategy/"
move_file "PRF_STRATEGIC_ALIGNMENT_MAP.md" "projects/prf-fellowship/strategy/"
move_file "PRF_RESEARCH_SUMMARY_AND_DELIVERABLES.md" "projects/prf-fellowship/strategy/"

move_file "PRF_CRITICAL_REVISIONS.md" "projects/prf-fellowship/revisions/"
move_file "PRF_REVISIONS_IMPLEMENTED.md" "projects/prf-fellowship/revisions/"

move_file "PRF_Q4_PERSONALIZED.md" "projects/prf-fellowship/archive/"
move_file "PRF_Q9_PERSONALIZED.md" "projects/prf-fellowship/archive/"
move_file "PRF_APPLICATION_DRAFT_RESPONSES.md" "projects/prf-fellowship/archive/"
move_file "PRF_APPLICATION_QUICKSTART.md" "projects/prf-fellowship/archive/"
move_file "PRF_READY_TO_SUBMIT.md" "projects/prf-fellowship/archive/"

# Aunty Corrine
echo ""
echo "📄 Aunty Corrine files..."
move_file "AUNTY_CORRINE_INTERVIEW_ANALYSIS.md" "projects/aunty-corrine/analysis/"
move_file "AUNTY_CORRINE_PROJECT_SUMMARY.md" "projects/aunty-corrine/analysis/"
move_file "STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md" "projects/aunty-corrine/content/"
move_file "BLOG_DRAFT_AUNTY_CORRINE.md" "projects/aunty-corrine/content/"
move_file "README_AUNTY_CORRINE_PROJECT.md" "projects/aunty-corrine/setup/"
move_file "QUICK_START_PUBLISH_AUNTY_STORY.md" "projects/aunty-corrine/setup/"

# Mount Isa
echo ""
echo "📄 Mount Isa files..."
move_file "MOUNT_ISA_CONTENT_ANALYSIS.md" "projects/mount-isa/analysis/"
move_file "MOUNT_ISA_AUNTIES_ANALYSIS.md" "projects/mount-isa/analysis/"
move_file "MOUNT_ISA_PLATFORM_STRATEGY.md" "projects/mount-isa/strategy/"

# NSW Grant
echo ""
echo "📄 NSW Grant files..."
move_file "NSW_GRANT_APPLICATION_TOOLKIT.md" "projects/nsw-grant/"
move_file "NSW_GRANT_QUICK_START.md" "projects/nsw-grant/"
move_file "NSW_GRANT_STRATEGIC_ANALYSIS.md" "projects/nsw-grant/"

# Documentation
echo ""
echo "📄 Documentation files..."
move_file "SYSTEM_ARCHITECTURE_OVERVIEW.md" "docs/architecture/"
move_file "BACKEND_ENHANCEMENT_PLAN.md" "docs/architecture/"
move_file "STORIES_UNIFIED_SYSTEM.md" "docs/architecture/"

move_file "COMPLETE_SETUP_GUIDE.md" "docs/guides/setup/"
move_file "IMPLEMENT_AI_STORYTELLING_QUICKSTART.md" "docs/guides/setup/"
move_file "DEPLOY_CHECKLIST.md" "docs/guides/deployment/"
move_file "LAUNCH_DAY_CHECKLIST.md" "docs/guides/deployment/"
move_file "STORYTELLING_WORKFLOW_TEMPLATE.md" "docs/guides/workflows/"
move_file "SIMPLEST_WORKFLOW_GUIDE.md" "docs/guides/workflows/"
move_file "STORYTELLING_SYSTEM_README.md" "docs/guides/workflows/"

move_file "IMPLEMENTATION_STATUS.md" "docs/implementation/"
move_file "STORY_IMPLEMENTATION_GUIDE.md" "docs/implementation/"

move_file "SITE_PAGES_REFERENCE.md" "docs/reference/"
move_file "STORY_OWNERSHIP_FRAMEWORK.md" "docs/reference/"
move_file "STORY_STRUCTURE_ANALYSIS.md" "docs/reference/"

# Session files
for f in SESSION_1_*.md; do
    [ -f "$f" ] && move_file "$f" "docs/archive/2024-11-sessions/"
done

for f in SESSION_2_*.md; do
    [ -f "$f" ] && move_file "$f" "docs/archive/2024-11-sessions/"
done

move_file "STRATEGIC_REVIEW_WORKFLOW.md" "docs/archive/2024-11-sessions/"

# Wiki files
for f in WIKI_*.md; do
    [ -f "$f" ] && move_file "$f" "docs/archive/wiki/"
done

# Content
echo ""
echo "📄 Content files..."
if [ -d "blog-drafts" ]; then
    mv blog-drafts content/ && echo "  ✓ blog-drafts/ → content/"
fi
move_file "BLOG_DRAFT_SEO_GATEWAY.md" "content/blog-drafts/"
move_file "CONSENT_EMAIL_TEMPLATE.md" "content/email-templates/"
move_file "MINDAROO_EMAIL_DRAFT.md" "content/email-templates/"
move_file "SOCIAL_MEDIA_TEMPLATES.md" "content/social-media/"
move_file "INTERVIEW_GUIDE_TEMPLATE.md" "content/interview-guides/"

# Prompts
echo ""
echo "📄 Prompt files..."
move_file "AI_VISUALIZATION_PROMPTS.md" "prompts/visualization/"
move_file "NAPKIN_AI_VISUALIZATION_PROMPTS.md" "prompts/visualization/"
move_file "VISUALIZATION_PLACEMENT_GUIDE.md" "prompts/visualization/"
move_file "SIMPLIFIED_FIGMA_PROMPTS.md" "prompts/figma/"
move_file "MINDAROO_ONE_PAGER_NAPKIN_PROMPTS.md" "prompts/mindaroo/"

# Database
echo ""
echo "📄 Database files..."
move_file "setup-aunty-corrine-profile.sql" "database/setup/"
move_file "setup-aunty-corrine-story.sql" "database/setup/"
move_file "setup-mount-isa-program.sql" "database/setup/"
move_file "deploy-all-aunty-corrine.sql" "database/deployment/"
move_file "verify-related-content.sql" "database/queries/"

# Archive
echo ""
echo "📄 Archive files..."
move_file "SECTOR_WIDE_FRAMING_STRATEGY.md" ".archive/2024-11/sector-wide-framing/"
move_file "SECTOR_WIDE_REFRAMING_COMPLETE.md" ".archive/2024-11/sector-wide-framing/"
move_file "BUDGET_ALIGNMENT_UPDATE.md" ".archive/2024-11/budget-alignment/"
move_file "INTEGRATION_PATCH.md" ".archive/2024-11/integration-patch/"
move_file "WIKI_ENHANCEMENT_IMPLEMENTATION_PLAN.md" ".archive/2024-11/wiki/"
move_file "WIKI_FORMATTING_IMPROVEMENTS.md" ".archive/2024-11/wiki/"
move_file "WIKI_UPDATE_COMPLETE.md" ".archive/2024-11/wiki/"

# Config (copy, don't move - need to keep working versions)
echo ""
echo "📄 Config files..."
if [ -f ".env.example" ]; then
    cp .env.example config/env/ && echo "  ✓ .env.example → config/env/ (copied)"
fi
if [ -f ".env.schema.json" ]; then
    cp .env.schema.json config/env/ && echo "  ✓ .env.schema.json → config/env/ (copied)"
fi

# Docker files - move to config
if [ -f "Dockerfile.app" ]; then
    mv Dockerfile.app config/docker/ && echo "  ✓ Dockerfile.app → config/docker/"
fi
if [ -f "Dockerfile.dev" ]; then
    mv Dockerfile.dev config/docker/ && echo "  ✓ Dockerfile.dev → config/docker/"
fi
if [ -f "docker-compose.yml" ]; then
    mv docker-compose.yml config/docker/ && echo "  ✓ docker-compose.yml → config/docker/"
fi
if [ -f "docker-compose.dev.yml" ]; then
    mv docker-compose.dev.yml config/docker/ && echo "  ✓ docker-compose.dev.yml → config/docker/"
fi

echo ""
echo "📝 Creating README files..."

# Create README files for major directories
cat > docs/README.md << 'EOF'
# JusticeHub Documentation

## Structure

- **architecture/** - System architecture and design documents
- **guides/** - How-to guides organized by category
  - setup/ - Setup and configuration guides
  - deployment/ - Deployment procedures
  - workflows/ - Process and workflow documentation
- **implementation/** - Implementation status and guides
- **reference/** - Reference materials and frameworks
- **archive/** - Historical and completed documentation

## Quick Links

- [System Architecture](architecture/SYSTEM_ARCHITECTURE_OVERVIEW.md)
- [Setup Guide](guides/setup/COMPLETE_SETUP_GUIDE.md)
- [Deployment Checklist](guides/deployment/DEPLOY_CHECKLIST.md)
- [Storytelling Workflow](guides/workflows/STORYTELLING_WORKFLOW_TEMPLATE.md)
EOF

cat > projects/README.md << 'EOF'
# JusticeHub Projects

This directory contains project-specific work organized by initiative.

## Active Projects

- **prf-fellowship/** - PRF Fellowship application (Dec 2024)
- **aunty-corrine/** - Aunty Corrine story project
- **mount-isa/** - Mount Isa community initiative
- **nsw-grant/** - NSW Grant application

## Project Structure

Each project follows this structure:
- analysis/ - Research and analysis
- content/ - Written content and drafts
- strategy/ - Strategic documents
- setup/ - Setup and implementation guides
- archive/ - Superseded materials
EOF

cat > projects/prf-fellowship/README.md << 'EOF'
# PRF Fellowship Application 2026

**Status:** In preparation - Deadline December 19, 2025

## Application Components

- **application/** - Final application documents ready to submit
- **cv/** - CV and resume materials
- **strategy/** - Strategic planning documents
- **revisions/** - Revision history and reviewer feedback
- **archive/** - Superseded versions

## Quick Links

- [Final Application](application/PRF_APPLICATION_PORTAL_READY.md)
- [CV](cv/Benjamin_Knight_CV_PRF_Fellowship_2026.md)
- [Submission Guide](application/PRF_FINAL_SUBMISSION_GUIDE.md)
- [Budget](application/PRF_BUDGET_DETAILED_FOR_TEMPLATE.md)
EOF

cat > content/README.md << 'EOF'
# JusticeHub Content

Content creation workspace for blogs, emails, social media, and interview guides.

- **blog-drafts/** - Blog post drafts
- **email-templates/** - Email templates
- **social-media/** - Social media content
- **interview-guides/** - Interview guide templates
EOF

cat > prompts/README.md << 'EOF'
# AI & Design Prompts

Prompts for AI-assisted content creation and design work.

- **visualization/** - Visualization and diagram prompts
- **figma/** - Figma design prompts
- **mindaroo/** - Mindaroo-specific prompts
EOF

cat > database/README.md << 'EOF'
# Database Scripts

Database setup, migration, and utility scripts.

- **setup/** - One-time setup scripts
- **deployment/** - Deployment scripts
- **queries/** - Utility queries
- **migrations/** - See supabase/migrations/ for migration files
EOF

cat > .archive/README.md << 'EOF'
# Archive

Completed work and historical documents organized by date.

## Archival Policy

Files are moved here when:
- Project is completed
- Document is superseded by newer version
- Initiative is ended or deprioritized

Format: `.archive/YYYY-MM/project-name/`
EOF

echo "✅ README files created"

echo ""
echo "🔧 Updating .gitignore..."

# Backup original .gitignore
cp .gitignore .gitignore.backup

# Add new rules to .gitignore
cat >> .gitignore << 'EOF'

# === Added by cleanup script ===

# Documentation drafts and WIP
*_DRAFT.md
*_WIP.md
*_TODO.md
NOTES.md
SCRATCH.md

# Temporary analysis files
*_ANALYSIS_TEMP.md
*_REVIEW_*.md

# Large exports
*.csv
*.xlsx
!config/**/*.example.xlsx
exports/
data-exports/

# Personal notes
PERSONAL_*.md
MY_*.md

# Duplicate/backup files
*.backup
*.bak
*_OLD.md
*_BACKUP_*.md

# SQL dumps and backups
*.sql.backup
*.dump
database/backups/

# Generated documentation
docs/generated/

# Presentation drafts
*.ppt
*.pptx
*.key
presentations/drafts/
EOF

echo "✅ .gitignore updated"

echo ""
echo "🔍 Cleanup verification..."

# Count remaining .md files in root
ROOT_MD_COUNT=$(find . -maxdepth 1 -name "*.md" -type f | wc -l)
ROOT_SQL_COUNT=$(find . -maxdepth 1 -name "*.sql" -type f | wc -l)

echo "  Root .md files: $ROOT_MD_COUNT (target: <5)"
echo "  Root .sql files: $ROOT_SQL_COUNT (target: 0)"

echo ""
echo "✅ Migration complete!"
echo ""
echo "📊 Summary:"
echo "  - Created organized folder structure"
echo "  - Migrated 70+ files to appropriate locations"
echo "  - Created README files for major directories"
echo "  - Updated .gitignore with anti-bloat rules"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the changes: git status"
echo "  2. Test that the application still runs"
echo "  3. Commit the changes: git add . && git commit -m 'chore: organize codebase'"
echo "  4. Merge to main: git checkout main && git merge cleanup/organize-codebase"
echo ""
echo "📖 See CODEBASE_CLEANUP_PLAN.md for full documentation"

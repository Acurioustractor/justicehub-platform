# JusticeHub Codebase Cleanup & Organization Plan

**Status:** 71 .md files + 9 .sql files in root directory - **NEEDS CLEANUP**

**Goal:** Establish clean, maintainable project structure that prevents future bloat

---

## 🔍 Current State Analysis

### Problems Identified:
1. **71 markdown files in root directory** - unmaintainable
2. **9 SQL files in root** - database scripts scattered
3. **Multiple .env files** (8 env-related files) - configuration chaos
4. **No clear documentation structure** - hard to find information
5. **Mixed concerns** - PRF fellowship docs + project docs + blog drafts + guides all mixed
6. **No archival strategy** - completed work stays in root forever

### File Categories Found:
- **PRF Fellowship Application** (14 files): PRF_*.md, Benjamin_Knight_CV*.md
- **Project Documentation** (20+ files): Implementation guides, architecture, wikis
- **Blog Drafts** (3+ files): Contained launch, Aunty Corrine, SEO
- **Grant Applications** (3 files): NSW_GRANT_*.md
- **Email Templates** (2 files): MINDAROO_EMAIL_DRAFT.md, CONSENT_EMAIL_TEMPLATE.md
- **Content Analysis** (5+ files): Mount Isa, Aunty Corrine analysis
- **Visualization Prompts** (3 files): AI visualization, Napkin prompts
- **SQL Scripts** (9 files): Database setup, migrations
- **Configuration** (Multiple .env files)

---

## ✅ Proposed Folder Structure (Based on Best Practices)

```
JusticeHub/
├── .github/                          # GitHub-specific configs
│   └── workflows/                    # CI/CD workflows
│
├── docs/                             # ALL DOCUMENTATION
│   ├── README.md                     # Documentation index
│   ├── architecture/                 # System design docs
│   │   ├── SYSTEM_ARCHITECTURE_OVERVIEW.md
│   │   └── BACKEND_ENHANCEMENT_PLAN.md
│   ├── guides/                       # How-to guides
│   │   ├── setup/                    # Setup guides
│   │   │   └── COMPLETE_SETUP_GUIDE.md
│   │   ├── deployment/               # Deployment docs
│   │   │   ├── DEPLOY_CHECKLIST.md
│   │   │   └── LAUNCH_DAY_CHECKLIST.md
│   │   └── workflows/                # Process workflows
│   │       ├── STORYTELLING_WORKFLOW_TEMPLATE.md
│   │       └── SIMPLEST_WORKFLOW_GUIDE.md
│   ├── implementation/               # Implementation details
│   │   ├── IMPLEMENTATION_STATUS.md
│   │   └── STORY_IMPLEMENTATION_GUIDE.md
│   ├── reference/                    # Reference materials
│   │   ├── SITE_PAGES_REFERENCE.md
│   │   └── STORY_OWNERSHIP_FRAMEWORK.md
│   └── archive/                      # Completed/historical docs
│       ├── 2024-11-sessions/         # Session-specific docs
│       │   ├── SESSION_1_*.md
│       │   └── SESSION_2_*.md
│       └── wiki/                     # Old wiki docs
│           └── WIKI_*.md
│
├── projects/                         # PROJECT-SPECIFIC WORK
│   ├── prf-fellowship/               # PRF Fellowship Application
│   │   ├── README.md                 # Application overview
│   │   ├── application/              # Application documents
│   │   │   ├── PRF_APPLICATION_PORTAL_READY.md
│   │   │   ├── PRF_APPLICATION_FINAL_RESPONSES.md
│   │   │   └── PRF_BUDGET_*.md
│   │   ├── cv/                       # CV materials
│   │   │   ├── Benjamin_Knight_CV_PRF_Fellowship_2026.md
│   │   │   └── PRF_CV_*.md
│   │   ├── strategy/                 # Strategy documents
│   │   │   ├── PRF_FELLOWSHIP_APPLICATION_STRATEGY.md
│   │   │   └── PRF_STRATEGIC_ALIGNMENT_MAP.md
│   │   ├── revisions/                # Revision documents
│   │   │   ├── PRF_CRITICAL_REVISIONS.md
│   │   │   └── PRF_REVISIONS_IMPLEMENTED.md
│   │   └── archive/                  # Superseded versions
│   │       ├── PRF_Q4_PERSONALIZED.md
│   │       └── PRF_Q9_PERSONALIZED.md
│   ├── aunty-corrine/                # Aunty Corrine Story Project
│   │   ├── README.md
│   │   ├── analysis/
│   │   │   ├── AUNTY_CORRINE_INTERVIEW_ANALYSIS.md
│   │   │   └── AUNTY_CORRINE_PROJECT_SUMMARY.md
│   │   ├── content/
│   │   │   ├── STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md
│   │   │   └── BLOG_DRAFT_AUNTY_CORRINE.md
│   │   └── setup/
│   │       └── README_AUNTY_CORRINE_PROJECT.md
│   ├── mount-isa/                    # Mount Isa Initiative
│   │   ├── README.md
│   │   ├── analysis/
│   │   │   ├── MOUNT_ISA_CONTENT_ANALYSIS.md
│   │   │   └── MOUNT_ISA_AUNTIES_ANALYSIS.md
│   │   └── strategy/
│   │       └── MOUNT_ISA_PLATFORM_STRATEGY.md
│   ├── nsw-grant/                    # NSW Grant Application
│   │   ├── NSW_GRANT_APPLICATION_TOOLKIT.md
│   │   ├── NSW_GRANT_QUICK_START.md
│   │   └── NSW_GRANT_STRATEGIC_ANALYSIS.md
│   └── contained-launch/             # Contained Project Launch
│       └── blog-drafts/
│           └── contained-launch.md
│
├── content/                          # CONTENT CREATION
│   ├── blog-drafts/                  # Blog post drafts
│   │   ├── contained-launch.md
│   │   └── BLOG_DRAFT_SEO_GATEWAY.md
│   ├── email-templates/              # Email templates
│   │   ├── CONSENT_EMAIL_TEMPLATE.md
│   │   └── MINDAROO_EMAIL_DRAFT.md
│   ├── social-media/                 # Social media content
│   │   └── SOCIAL_MEDIA_TEMPLATES.md
│   └── interview-guides/             # Interview guides
│       └── INTERVIEW_GUIDE_TEMPLATE.md
│
├── prompts/                          # AI/DESIGN PROMPTS
│   ├── visualization/                # Visualization prompts
│   │   ├── AI_VISUALIZATION_PROMPTS.md
│   │   ├── NAPKIN_AI_VISUALIZATION_PROMPTS.md
│   │   └── VISUALIZATION_PLACEMENT_GUIDE.md
│   ├── figma/                        # Figma prompts
│   │   └── SIMPLIFIED_FIGMA_PROMPTS.md
│   └── mindaroo/                     # Mindaroo-specific
│       └── MINDAROO_ONE_PAGER_NAPKIN_PROMPTS.md
│
├── database/                         # DATABASE SCRIPTS
│   ├── README.md                     # Database documentation
│   ├── migrations/                   # Migration files
│   │   └── supabase/migrations/      # Supabase migrations (existing)
│   ├── setup/                        # One-time setup scripts
│   │   ├── setup-aunty-corrine-profile.sql
│   │   ├── setup-aunty-corrine-story.sql
│   │   └── setup-mount-isa-program.sql
│   ├── deployment/                   # Deployment scripts
│   │   └── deploy-all-aunty-corrine.sql
│   └── queries/                      # Utility queries
│       └── verify-related-content.sql
│
├── config/                           # CONFIGURATION FILES
│   ├── env/                          # Environment configs
│   │   ├── .env.example              # Example env file
│   │   ├── .env.schema.json          # Env schema
│   │   └── README.md                 # Env setup guide
│   └── docker/                       # Docker configs
│       ├── Dockerfile.app
│       ├── Dockerfile.dev
│       ├── docker-compose.yml
│       └── docker-compose.dev.yml
│
├── src/                              # SOURCE CODE (existing)
│   └── [existing app structure]
│
├── public/                           # PUBLIC ASSETS (existing)
│   └── [existing public files]
│
├── data/                             # DATA FILES (existing)
│   └── webflow-migration/
│       └── articles-markdown/
│
├── .archive/                         # ARCHIVED/COMPLETED WORK
│   ├── 2024-11/                      # Date-based archival
│   │   ├── sector-wide-framing/      # Completed initiatives
│   │   │   ├── SECTOR_WIDE_FRAMING_STRATEGY.md
│   │   │   └── SECTOR_WIDE_REFRAMING_COMPLETE.md
│   │   ├── budget-alignment/
│   │   │   └── BUDGET_ALIGNMENT_UPDATE.md
│   │   └── integration-patch/
│   │       └── INTEGRATION_PATCH.md
│   └── README.md                     # Archive index
│
├── .github/                          # GitHub configuration
├── node_modules/                     # Dependencies (gitignored)
├── .next/                            # Next.js build (gitignored)
│
├── README.md                         # Project README
├── CLAUDE.md                         # Claude Code context
├── CHANGELOG.md                      # Version history
├── CONTRIBUTING.md                   # Contribution guidelines
│
├── .gitignore                        # Git ignore rules
├── .env                              # Local env (gitignored)
├── .env.local                        # Local env override (gitignored)
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── vercel.json                       # Vercel config
```

---

## 🗂️ File Categorization & Migration Map

### 1. PRF Fellowship → `projects/prf-fellowship/`

**Application Documents:**
- PRF_APPLICATION_PORTAL_READY.md → `projects/prf-fellowship/application/`
- PRF_APPLICATION_FINAL_RESPONSES.md → `projects/prf-fellowship/application/`
- PRF_BUDGET_DETAILED_FOR_TEMPLATE.md → `projects/prf-fellowship/application/`
- PRF_BUDGET_QUICK_REFERENCE.md → `projects/prf-fellowship/application/`
- PRF_APPLICATION_DRAFT_RESPONSES.md → `projects/prf-fellowship/archive/` (superseded)
- PRF_APPLICATION_QUICKSTART.md → `projects/prf-fellowship/archive/` (superseded)

**CV Materials:**
- Benjamin_Knight_CV_PRF_Fellowship_2026.md → `projects/prf-fellowship/cv/`
- PRF_CV_TEMPLATE.md → `projects/prf-fellowship/cv/`
- PRF_CV_CONVERSION_GUIDE.md → `projects/prf-fellowship/cv/`

**Strategy Documents:**
- PRF_FELLOWSHIP_APPLICATION_STRATEGY.md → `projects/prf-fellowship/strategy/`
- PRF_STRATEGIC_ALIGNMENT_MAP.md → `projects/prf-fellowship/strategy/`
- PRF_RESEARCH_SUMMARY_AND_DELIVERABLES.md → `projects/prf-fellowship/strategy/`

**Submission Materials:**
- PRF_FINAL_SUBMISSION_GUIDE.md → `projects/prf-fellowship/application/`
- PRF_FINAL_SUBMISSION_CHECKLIST.md → `projects/prf-fellowship/application/`
- PRF_SUBMISSION_QUICK_REFERENCE.md → `projects/prf-fellowship/application/`
- PRF_READY_TO_SUBMIT.md → `projects/prf-fellowship/archive/` (superseded)

**Revisions:**
- PRF_CRITICAL_REVISIONS.md → `projects/prf-fellowship/revisions/`
- PRF_REVISIONS_IMPLEMENTED.md → `projects/prf-fellowship/revisions/`

**Personalized Docs (Superseded):**
- PRF_Q4_PERSONALIZED.md → `projects/prf-fellowship/archive/`
- PRF_Q9_PERSONALIZED.md → `projects/prf-fellowship/archive/`

---

### 2. Aunty Corrine Project → `projects/aunty-corrine/`

**Analysis:**
- AUNTY_CORRINE_INTERVIEW_ANALYSIS.md → `projects/aunty-corrine/analysis/`
- AUNTY_CORRINE_PROJECT_SUMMARY.md → `projects/aunty-corrine/analysis/`

**Content:**
- STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md → `projects/aunty-corrine/content/`
- BLOG_DRAFT_AUNTY_CORRINE.md → `projects/aunty-corrine/content/`

**Setup:**
- README_AUNTY_CORRINE_PROJECT.md → `projects/aunty-corrine/setup/`
- QUICK_START_PUBLISH_AUNTY_STORY.md → `projects/aunty-corrine/setup/`

---

### 3. Mount Isa Initiative → `projects/mount-isa/`

**Analysis:**
- MOUNT_ISA_CONTENT_ANALYSIS.md → `projects/mount-isa/analysis/`
- MOUNT_ISA_AUNTIES_ANALYSIS.md → `projects/mount-isa/analysis/`

**Strategy:**
- MOUNT_ISA_PLATFORM_STRATEGY.md → `projects/mount-isa/strategy/`

---

### 4. NSW Grant → `projects/nsw-grant/`

- NSW_GRANT_APPLICATION_TOOLKIT.md → `projects/nsw-grant/`
- NSW_GRANT_QUICK_START.md → `projects/nsw-grant/`
- NSW_GRANT_STRATEGIC_ANALYSIS.md → `projects/nsw-grant/`

---

### 5. Documentation → `docs/`

**Architecture:**
- SYSTEM_ARCHITECTURE_OVERVIEW.md → `docs/architecture/`
- BACKEND_ENHANCEMENT_PLAN.md → `docs/architecture/`
- STORIES_UNIFIED_SYSTEM.md → `docs/architecture/`

**Guides:**
- COMPLETE_SETUP_GUIDE.md → `docs/guides/setup/`
- DEPLOY_CHECKLIST.md → `docs/guides/deployment/`
- LAUNCH_DAY_CHECKLIST.md → `docs/guides/deployment/`
- IMPLEMENT_AI_STORYTELLING_QUICKSTART.md → `docs/guides/setup/`
- STORYTELLING_WORKFLOW_TEMPLATE.md → `docs/guides/workflows/`
- SIMPLEST_WORKFLOW_GUIDE.md → `docs/guides/workflows/`
- STORYTELLING_SYSTEM_README.md → `docs/guides/workflows/`

**Implementation:**
- IMPLEMENTATION_STATUS.md → `docs/implementation/`
- STORY_IMPLEMENTATION_GUIDE.md → `docs/implementation/`

**Reference:**
- SITE_PAGES_REFERENCE.md → `docs/reference/`
- STORY_OWNERSHIP_FRAMEWORK.md → `docs/reference/`
- STORY_STRUCTURE_ANALYSIS.md → `docs/reference/`

**Archive:**
- SESSION_1_*.md → `docs/archive/2024-11-sessions/`
- SESSION_2_*.md → `docs/archive/2024-11-sessions/`
- WIKI_*.md → `docs/archive/wiki/`
- STRATEGIC_REVIEW_WORKFLOW.md → `docs/archive/2024-11-sessions/`

---

### 6. Content → `content/`

**Blog Drafts:**
- blog-drafts/contained-launch.md → `content/blog-drafts/`
- BLOG_DRAFT_SEO_GATEWAY.md → `content/blog-drafts/`

**Email Templates:**
- CONSENT_EMAIL_TEMPLATE.md → `content/email-templates/`
- MINDAROO_EMAIL_DRAFT.md → `content/email-templates/`

**Social Media:**
- SOCIAL_MEDIA_TEMPLATES.md → `content/social-media/`

**Interview Guides:**
- INTERVIEW_GUIDE_TEMPLATE.md → `content/interview-guides/`

---

### 7. Prompts → `prompts/`

**Visualization:**
- AI_VISUALIZATION_PROMPTS.md → `prompts/visualization/`
- NAPKIN_AI_VISUALIZATION_PROMPTS.md → `prompts/visualization/`
- VISUALIZATION_PLACEMENT_GUIDE.md → `prompts/visualization/`

**Figma:**
- SIMPLIFIED_FIGMA_PROMPTS.md → `prompts/figma/`

**Mindaroo:**
- MINDAROO_ONE_PAGER_NAPKIN_PROMPTS.md → `prompts/mindaroo/`

---

### 8. Database → `database/`

**Setup Scripts:**
- setup-aunty-corrine-profile.sql → `database/setup/`
- setup-aunty-corrine-story.sql → `database/setup/`
- setup-mount-isa-program.sql → `database/setup/`

**Deployment:**
- deploy-all-aunty-corrine.sql → `database/deployment/`

**Queries:**
- verify-related-content.sql → `database/queries/`

**Migrations:**
- supabase/migrations/20250115_story_workspaces.sql → Keep in existing location

---

### 9. Archive → `.archive/`

**Completed Work:**
- SECTOR_WIDE_FRAMING_STRATEGY.md → `.archive/2024-11/sector-wide-framing/`
- SECTOR_WIDE_REFRAMING_COMPLETE.md → `.archive/2024-11/sector-wide-framing/`
- BUDGET_ALIGNMENT_UPDATE.md → `.archive/2024-11/budget-alignment/`
- INTEGRATION_PATCH.md → `.archive/2024-11/integration-patch/`
- WIKI_ENHANCEMENT_IMPLEMENTATION_PLAN.md → `.archive/2024-11/wiki/`
- WIKI_FORMATTING_IMPROVEMENTS.md → `.archive/2024-11/wiki/`
- WIKI_UPDATE_COMPLETE.md → `.archive/2024-11/wiki/`

---

### 10. Root-Level Master Docs (KEEP IN ROOT)

**Keep These:**
- README.md (Project overview)
- CLAUDE.md (Claude Code context)
- PROJECT_MASTER_INDEX.md → Rename to CHANGELOG.md or merge into README.md

---

## 📋 Migration Script

Save this as a bash script to automate the migration:

```bash
#!/bin/bash
# File: migrate_files.sh
# Usage: bash migrate_files.sh

echo "🧹 JusticeHub Codebase Cleanup - File Migration"
echo "=============================================="

# Create new directory structure
mkdir -p docs/{architecture,guides/{setup,deployment,workflows},implementation,reference,archive/{2024-11-sessions,wiki}}
mkdir -p projects/{prf-fellowship/{application,cv,strategy,revisions,archive},aunty-corrine/{analysis,content,setup},mount-isa/{analysis,strategy},nsw-grant,contained-launch/blog-drafts}
mkdir -p content/{blog-drafts,email-templates,social-media,interview-guides}
mkdir -p prompts/{visualization,figma,mindaroo}
mkdir -p database/{setup,deployment,queries}
mkdir -p .archive/2024-11/{sector-wide-framing,budget-alignment,integration-patch,wiki}
mkdir -p config/{env,docker}

# PRF Fellowship
mv PRF_APPLICATION_PORTAL_READY.md projects/prf-fellowship/application/
mv PRF_APPLICATION_FINAL_RESPONSES.md projects/prf-fellowship/application/
mv PRF_BUDGET_DETAILED_FOR_TEMPLATE.md projects/prf-fellowship/application/
mv PRF_BUDGET_QUICK_REFERENCE.md projects/prf-fellowship/application/
mv PRF_FINAL_SUBMISSION_GUIDE.md projects/prf-fellowship/application/
mv PRF_FINAL_SUBMISSION_CHECKLIST.md projects/prf-fellowship/application/
mv PRF_SUBMISSION_QUICK_REFERENCE.md projects/prf-fellowship/application/

mv Benjamin_Knight_CV_PRF_Fellowship_2026.md projects/prf-fellowship/cv/
mv PRF_CV_TEMPLATE.md projects/prf-fellowship/cv/
mv PRF_CV_CONVERSION_GUIDE.md projects/prf-fellowship/cv/

mv PRF_FELLOWSHIP_APPLICATION_STRATEGY.md projects/prf-fellowship/strategy/
mv PRF_STRATEGIC_ALIGNMENT_MAP.md projects/prf-fellowship/strategy/
mv PRF_RESEARCH_SUMMARY_AND_DELIVERABLES.md projects/prf-fellowship/strategy/

mv PRF_CRITICAL_REVISIONS.md projects/prf-fellowship/revisions/
mv PRF_REVISIONS_IMPLEMENTED.md projects/prf-fellowship/revisions/

mv PRF_Q4_PERSONALIZED.md projects/prf-fellowship/archive/
mv PRF_Q9_PERSONALIZED.md projects/prf-fellowship/archive/
mv PRF_APPLICATION_DRAFT_RESPONSES.md projects/prf-fellowship/archive/
mv PRF_APPLICATION_QUICKSTART.md projects/prf-fellowship/archive/
mv PRF_READY_TO_SUBMIT.md projects/prf-fellowship/archive/

# Aunty Corrine
mv AUNTY_CORRINE_INTERVIEW_ANALYSIS.md projects/aunty-corrine/analysis/
mv AUNTY_CORRINE_PROJECT_SUMMARY.md projects/aunty-corrine/analysis/
mv STORY_AUNTY_CORRINE_JUSTICEHUB_DRAFT.md projects/aunty-corrine/content/
mv BLOG_DRAFT_AUNTY_CORRINE.md projects/aunty-corrine/content/
mv README_AUNTY_CORRINE_PROJECT.md projects/aunty-corrine/setup/
mv QUICK_START_PUBLISH_AUNTY_STORY.md projects/aunty-corrine/setup/

# Mount Isa
mv MOUNT_ISA_CONTENT_ANALYSIS.md projects/mount-isa/analysis/
mv MOUNT_ISA_AUNTIES_ANALYSIS.md projects/mount-isa/analysis/
mv MOUNT_ISA_PLATFORM_STRATEGY.md projects/mount-isa/strategy/

# NSW Grant
mv NSW_GRANT_APPLICATION_TOOLKIT.md projects/nsw-grant/
mv NSW_GRANT_QUICK_START.md projects/nsw-grant/
mv NSW_GRANT_STRATEGIC_ANALYSIS.md projects/nsw-grant/

# Documentation
mv SYSTEM_ARCHITECTURE_OVERVIEW.md docs/architecture/
mv BACKEND_ENHANCEMENT_PLAN.md docs/architecture/
mv STORIES_UNIFIED_SYSTEM.md docs/architecture/

mv COMPLETE_SETUP_GUIDE.md docs/guides/setup/
mv IMPLEMENT_AI_STORYTELLING_QUICKSTART.md docs/guides/setup/
mv DEPLOY_CHECKLIST.md docs/guides/deployment/
mv LAUNCH_DAY_CHECKLIST.md docs/guides/deployment/
mv STORYTELLING_WORKFLOW_TEMPLATE.md docs/guides/workflows/
mv SIMPLEST_WORKFLOW_GUIDE.md docs/guides/workflows/
mv STORYTELLING_SYSTEM_README.md docs/guides/workflows/

mv IMPLEMENTATION_STATUS.md docs/implementation/
mv STORY_IMPLEMENTATION_GUIDE.md docs/implementation/

mv SITE_PAGES_REFERENCE.md docs/reference/
mv STORY_OWNERSHIP_FRAMEWORK.md docs/reference/
mv STORY_STRUCTURE_ANALYSIS.md docs/reference/

mv SESSION_1_*.md docs/archive/2024-11-sessions/ 2>/dev/null
mv SESSION_2_*.md docs/archive/2024-11-sessions/ 2>/dev/null
mv STRATEGIC_REVIEW_WORKFLOW.md docs/archive/2024-11-sessions/ 2>/dev/null
mv WIKI_*.md docs/archive/wiki/ 2>/dev/null

# Content
mv blog-drafts content/
mv BLOG_DRAFT_SEO_GATEWAY.md content/blog-drafts/
mv CONSENT_EMAIL_TEMPLATE.md content/email-templates/
mv MINDAROO_EMAIL_DRAFT.md content/email-templates/
mv SOCIAL_MEDIA_TEMPLATES.md content/social-media/
mv INTERVIEW_GUIDE_TEMPLATE.md content/interview-guides/

# Prompts
mv AI_VISUALIZATION_PROMPTS.md prompts/visualization/
mv NAPKIN_AI_VISUALIZATION_PROMPTS.md prompts/visualization/
mv VISUALIZATION_PLACEMENT_GUIDE.md prompts/visualization/
mv SIMPLIFIED_FIGMA_PROMPTS.md prompts/figma/
mv MINDAROO_ONE_PAGER_NAPKIN_PROMPTS.md prompts/mindaroo/

# Database
mv setup-aunty-corrine-profile.sql database/setup/
mv setup-aunty-corrine-story.sql database/setup/
mv setup-mount-isa-program.sql database/setup/
mv deploy-all-aunty-corrine.sql database/deployment/
mv verify-related-content.sql database/queries/

# Archive
mv SECTOR_WIDE_FRAMING_STRATEGY.md .archive/2024-11/sector-wide-framing/
mv SECTOR_WIDE_REFRAMING_COMPLETE.md .archive/2024-11/sector-wide-framing/
mv BUDGET_ALIGNMENT_UPDATE.md .archive/2024-11/budget-alignment/
mv INTEGRATION_PATCH.md .archive/2024-11/integration-patch/
mv WIKI_ENHANCEMENT_IMPLEMENTATION_PLAN.md .archive/2024-11/wiki/
mv WIKI_FORMATTING_IMPROVEMENTS.md .archive/2024-11/wiki/
mv WIKI_UPDATE_COMPLETE.md .archive/2024-11/wiki/

# Config
mv .env.example config/env/
mv .env.schema.json config/env/
mv Dockerfile.app config/docker/
mv Dockerfile.dev config/docker/
mv docker-compose.yml config/docker/
mv docker-compose.dev.yml config/docker/

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Review the new structure"
echo "2. Create README.md files in each major directory"
echo "3. Update .gitignore"
echo "4. Update import paths if needed"
echo "5. Commit changes"
```

---

## 🚫 Updated .gitignore

Add these to prevent future bloat:

```gitignore
# Existing content...

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

# Archive old files (but track in .archive/)
# Nothing needed - we use .archive/ folder

# Personal notes
PERSONAL_*.md
MY_*.md

# Duplicate/backup files
*.backup
*.bak
*_OLD.md
*_BACKUP_*.md

# Environment files (already covered but emphasizing)
.env*
!.env.example
!config/env/.env.example

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
```

---

## 📚 Documentation Conventions Going Forward

### 1. Naming Conventions
- **Use lowercase-with-hyphens** for folders: `prf-fellowship`, `aunty-corrine`
- **Use UPPERCASE_WITH_UNDERSCORES** for markdown: `PRF_APPLICATION.md`
- **Prefix with category** for clarity: `GUIDE_`, `ANALYSIS_`, `TEMPLATE_`

### 2. File Locations
- **Temporary analysis** → Goes in project folder first, moves to archive when complete
- **Templates** → `content/` or `docs/reference/`
- **Active projects** → `projects/[project-name]/`
- **Completed work** → `.archive/[YYYY-MM]/[project-name]/`
- **Process docs** → `docs/guides/workflows/`

### 3. README.md Files
Create `README.md` in every major folder explaining:
- What's in this folder
- How files are organized
- Where to find related information
- Who maintains this section

### 4. Archival Process
**When to archive:**
- Project completed (e.g., PRF fellowship submitted → archive on Dec 20)
- Document superseded by newer version
- Initiative ended or deprioritized

**How to archive:**
```bash
# Create dated archive folder
mkdir -p .archive/2024-12/prf-fellowship

# Move completed project
mv projects/prf-fellowship .archive/2024-12/

# Add README.md explaining what was archived and why
```

### 5. Preventing Bloat - Monthly Review
Add to calendar: **First Monday of each month**
- Review root directory for stray files
- Move completed work to `.archive/`
- Delete duplicates or superseded versions
- Update PROJECT_STATUS.md with active projects

---

## 🤖 Automation to Prevent Future Bloat

### 1. Pre-commit Hook (Optional)
```bash
#!/bin/bash
# .git/hooks/pre-commit
# Warn if adding files to root

ROOT_MD_COUNT=$(git diff --cached --name-only --diff-filter=A | grep -E "^[A-Z_]+\.md$" | wc -l)

if [ "$ROOT_MD_COUNT" -gt 0 ]; then
  echo "⚠️  WARNING: You're adding .md files to root directory"
  echo "   Consider using:"
  echo "   - docs/ for documentation"
  echo "   - projects/ for project-specific work"
  echo "   - content/ for content creation"
  echo ""
  echo "   Continue anyway? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi
```

### 2. GitHub Action - Monthly Cleanup Reminder
```yaml
# .github/workflows/cleanup-reminder.yml
name: Monthly Cleanup Reminder

on:
  schedule:
    - cron: '0 9 1 * *'  # 9 AM on 1st of each month
  workflow_dispatch:

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create Issue
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🧹 Monthly Codebase Cleanup',
              body: `Time for monthly cleanup!

              - [ ] Review root directory for stray files
              - [ ] Archive completed projects to .archive/
              - [ ] Delete duplicate or superseded files
              - [ ] Update docs/README.md index
              - [ ] Review and update .gitignore

              See CODEBASE_CLEANUP_PLAN.md for guidelines.`
            })
```

---

## ✅ Implementation Checklist

### Phase 1: Prepare (Do First)
- [ ] Review this cleanup plan
- [ ] Backup current state: `git commit -am "Pre-cleanup snapshot"`
- [ ] Create new branch: `git checkout -b cleanup/organize-codebase`

### Phase 2: Create Structure
- [ ] Create new folder structure (use script or manually)
- [ ] Create README.md files for major folders
- [ ] Update .gitignore with new rules

### Phase 3: Migrate Files
- [ ] Run migration script OR manually move files following map above
- [ ] Verify no files broken (imports, references)
- [ ] Test application still runs

### Phase 4: Update References
- [ ] Update CLAUDE.md if paths changed
- [ ] Update any documentation links
- [ ] Update any scripts that reference old paths

### Phase 5: Clean Up
- [ ] Delete empty directories
- [ ] Remove duplicate files
- [ ] Git add all changes: `git add .`

### Phase 6: Commit & Review
- [ ] Commit: `git commit -m "chore: organize codebase into logical structure"`
- [ ] Review changes: `git diff main cleanup/organize-codebase --stat`
- [ ] Merge: `git checkout main && git merge cleanup/organize-codebase`

### Phase 7: Establish Practices
- [ ] Add pre-commit hook (optional)
- [ ] Set monthly cleanup reminder
- [ ] Document process in CONTRIBUTING.md
- [ ] Share conventions with team

---

## 🎯 Success Metrics

**After cleanup, you should have:**
- ✅ < 5 .md files in root directory (README.md, CLAUDE.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE.md)
- ✅ 0 .sql files in root
- ✅ 0 .env files tracked in git
- ✅ Clear folder structure with READMEs
- ✅ Archived completed work in `.archive/`
- ✅ Updated .gitignore preventing future bloat
- ✅ Documentation findable within 2 folder levels

---

## 📖 Quick Reference

**Where do I put...**

| File Type | Location | Example |
|-----------|----------|---------|
| New project work | `projects/[project-name]/` | PRF fellowship app |
| System documentation | `docs/architecture/` | System design docs |
| How-to guides | `docs/guides/[category]/` | Setup, deployment |
| Blog drafts | `content/blog-drafts/` | Contained launch post |
| Email templates | `content/email-templates/` | Consent emails |
| AI prompts | `prompts/[category]/` | Visualization prompts |
| Database scripts | `database/[category]/` | Setup, migrations |
| Completed projects | `.archive/YYYY-MM/` | Old grant apps |
| Config files | `config/[category]/` | Docker, env examples |

---

**This cleanup will take 2-3 hours but will save countless hours of searching and confusion going forward.** ✅

**The folder structure follows industry best practices and will scale as the project grows.** 🚀

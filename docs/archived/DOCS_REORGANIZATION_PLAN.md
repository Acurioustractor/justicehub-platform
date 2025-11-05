# Documentation Reorganization Plan

## Current State
**70 markdown files** in root directory - needs organization for clean codebase

## Proposed Structure

```
docs/
├── 00-START-HERE/
│   ├── README.md (main project overview)
│   ├── QUICK_START.md
│   └── NAVIGATION.md (master index to all docs)
│
├── 01-setup/
│   ├── environment/
│   ├── database/
│   └── deployment/
│
├── 02-features/
│   ├── blog-system/
│   ├── profiles/
│   ├── programs/
│   ├── services/
│   └── stories/
│
├── 03-guides/
│   ├── content-creation/
│   ├── data-management/
│   └── integration/
│
├── 04-architecture/
│   ├── database/
│   ├── information-architecture/
│   └── system-design/
│
├── 05-sessions/
│   ├── 2025-10/
│   └── archive/
│
└── 06-archive/
    ├── deprecated/
    └── completed-migrations/
```

## File Categorization

### Category 1: KEEP IN ROOT (Essential)
- **README.md** - Main project documentation
- **CLAUDE.md** - AI assistant context (required for Claude Code)

### Category 2: Setup & Configuration (→ docs/01-setup/)

**Environment:**
- ENV_QUICK_REFERENCE.md
- CONNECT_EXISTING_SUPABASE.md
- SUPABASE_QUICK_START.md
- VERCEL_ENV_SETUP.md

**Database:**
- DATABASE_ARCHITECTURE_CORRECTED.md (current)
- DATABASE_SEPARATION_PLAN.md (reference)
- DATABASE_SETUP_STEPS.md (guide)

**Deployment:**
- APPLY_MIGRATION_INSTRUCTIONS.md
- VERCEL_TESTING_CHECKLIST.md

### Category 3: Feature Documentation (→ docs/02-features/)

**Blog System:**
- BLOG_EDITOR_SESSION_COMPLETE.md (CURRENT - most recent)
- BLOG_SYSTEM_GUIDE.md (reference)
- HOW_TO_WRITE_BLOG_POSTS.md (user guide)
- ~~BLOG_EDITOR_COMPLETE.md~~ (superseded by SESSION_COMPLETE)
- ~~BLOG_RLS_FIX.md~~ (incorporated into SESSION_COMPLETE)
- ~~BLOG_SAVE_TROUBLESHOOTING.md~~ (incorporated into SESSION_COMPLETE)
- ~~BLOG_SYSTEM_FIXED.md~~ (superseded)
- ~~BLOG_SYSTEM_SETUP.md~~ (superseded)
- ~~BLOG_SYSTEM_SUMMARY.md~~ (superseded)

**Profiles:**
- PROFILE_INTEGRATION_ARCHITECTURE.md (reference)
- EMPATHY_LEDGER_INTEGRATION_GUIDE.md (current)
- ~~PROFILE_DISPLAY_IMPLEMENTATION_COMPLETE.md~~ (completed)
- ~~PROFILE_INTEGRATION_READY.md~~ (completed)
- ~~EMPATHY_LEDGER_SETUP_COMPLETE.md~~ (completed)
- ~~EMPATHY_LEDGER_SYNC_COMPLETE.md~~ (completed)

**Programs:**
- COMMUNITY_PROGRAMS_SYSTEM.md (current reference)
- ADDING_COMMUNITY_PROGRAMS_GUIDE.md (how-to guide)
- ~~COMMUNITY_PROGRAMS_COMPLETE.md~~ (completed)
- ~~CONNECTED_SYSTEM_COMPLETE.md~~ (completed)

**Services:**
- SERVICES_PAGE_IMPROVEMENTS.md (reference)
- JUSTICEHUB_TAGGING_QUICKSTART.md (guide)
- ~~IMPORT_READY.md~~ (completed)
- ~~DATA_GOV_AU_EXPLORATION_COMPLETE.md~~ (completed)
- ~~JUSTICE_REINVESTMENT_IMPORT.md~~ (completed)

**Stories/Articles:**
- UNIFIED_STORIES_SYSTEM_COMPLETE.md (current)
- ~~ARTICLES_INTEGRATION_PLAN.md~~ (completed)
- ~~ARTICLE_MIGRATION_STATUS_FINAL.md~~ (completed)
- ~~ARTICLE_SCRAPING_STATUS.md~~ (completed)
- ~~CONTENT_MIGRATION_COMPLETE.md~~ (completed)
- ~~CONTENT_MIGRATION_IN_PROGRESS.md~~ (superseded)
- ~~CONTENT_MIGRATION_STRATEGY.md~~ (completed)
- ~~STORY_LINKING_COMPLETE.md~~ (completed)

**Maps & Visualization:**
- CENTRE_OF_EXCELLENCE_MAP.md (feature guide)
- ADDING_RESEARCH_GUIDE.md (feature guide)
- ~~MAP_INTEGRATION_READY.md~~ (completed)

**Media & Images:**
- IMAGE_UPLOAD_COMPLETE.md (current)
- STORAGE_POLICY_FIX.md (reference for troubleshooting)
- ~~IMAGE_UPLOAD_FEATURE_COMPLETE.md~~ (superseded by COMPLETE)

**CMS:**
- ENHANCED_BLOG_CMS_COMPLETE.md (current)
- MEDIA_LIBRARY_COMPLETE.md (current)
- CMS_IMPROVEMENT_RECOMMENDATIONS.md (future roadmap)
- UNIFIED_CONTENT_SYSTEM_COMPLETE.md (reference)

### Category 4: Architecture & Planning (→ docs/04-architecture/)
- DATABASE_ARCHITECTURE_CORRECTED.md (current reference)
- PROFILE_INTEGRATION_ARCHITECTURE.md (reference)
- PROJECT_STATUS_CURRENT.md (needs updating)

### Category 5: Session Summaries (→ docs/05-sessions/)

**2025-10:**
- SESSION_SUMMARY_CMS_TRANSFORMATION.md (Oct 26)
- BLOG_EDITOR_SESSION_COMPLETE.md (Oct 26)
- NEXT_STEPS_COMPLETE.md (Oct 19)

**Archive:**
- SESSION_2025-10-11_COMPLETE.md
- SESSION_2025-10-11_CONTENT_MIGRATION_COMPLETE.md
- SESSION_2025-10-11_MINING_COMPLETE.md
- SESSION_2025-10-11_PART2_ENRICHMENT.md
- SESSION_COMPLETE_FULL_MIGRATION.md
- SESSION_COMPLETE_MAP_INTEGRATION.md
- SESSION_COMPLETE_SUMMARY.md
- MIGRATION_SUCCESS.md
- ENRICHMENT_COMPLETE.md
- ENRICHMENT_FINAL_REPORT.md
- ENRICHMENT_STATUS.md

### Category 6: Archive (→ docs/06-archive/)

**Completed Migrations:**
- All "COMPLETE.md" files from completed features
- All "_STATUS" intermediate files
- All "_PLAN" files for completed work

**Deprecated:**
- INFOXCHANGE_EMAIL_READY.md (partnership approach changed)
- NEXT_STEPS_ACTION_PLAN.md (incorporated into current planning)
- OPEN_SOURCES_EXPLORATION_SUMMARY.md (exploration complete)

## Recommended Actions

### 1. Keep Current & Active (17 files)
These represent the **current state** of the system:

**Root:**
- README.md
- CLAUDE.md

**Setup:**
- ENV_QUICK_REFERENCE.md
- SUPABASE_QUICK_START.md
- VERCEL_ENV_SETUP.md
- APPLY_MIGRATION_INSTRUCTIONS.md

**Active Features:**
- BLOG_EDITOR_SESSION_COMPLETE.md (blog editor - latest)
- HOW_TO_WRITE_BLOG_POSTS.md (user guide)
- COMMUNITY_PROGRAMS_SYSTEM.md (programs reference)
- ADDING_COMMUNITY_PROGRAMS_GUIDE.md (how-to)
- EMPATHY_LEDGER_INTEGRATION_GUIDE.md (profiles)
- UNIFIED_STORIES_SYSTEM_COMPLETE.md (content)
- IMAGE_UPLOAD_COMPLETE.md (media)
- ENHANCED_BLOG_CMS_COMPLETE.md (CMS)
- MEDIA_LIBRARY_COMPLETE.md (CMS)

**Architecture:**
- DATABASE_ARCHITECTURE_CORRECTED.md
- CMS_IMPROVEMENT_RECOMMENDATIONS.md (roadmap)

### 2. Archive (53 files)
Move to `docs/06-archive/` - these are valuable but historical:
- All session summaries (except latest 3)
- All "COMPLETE" files for finished migrations
- All "STATUS" intermediate files
- All superseded guides

## Proposed Folder Structure

```
JusticeHub/
├── README.md (updated with clear navigation)
├── CLAUDE.md (AI context - stays in root)
│
├── docs/
│   ├── README.md (navigation index)
│   │
│   ├── setup/
│   │   ├── README.md
│   │   ├── environment.md (ENV_QUICK_REFERENCE)
│   │   ├── database.md (SUPABASE_QUICK_START + DATABASE_SETUP_STEPS)
│   │   ├── deployment.md (VERCEL_ENV_SETUP + VERCEL_TESTING)
│   │   └── migrations.md (APPLY_MIGRATION_INSTRUCTIONS)
│   │
│   ├── features/
│   │   ├── README.md (feature overview)
│   │   ├── blog-system.md (BLOG_EDITOR_SESSION_COMPLETE + HOW_TO_WRITE)
│   │   ├── cms.md (ENHANCED_BLOG_CMS + MEDIA_LIBRARY)
│   │   ├── profiles.md (EMPATHY_LEDGER_INTEGRATION_GUIDE)
│   │   ├── programs.md (COMMUNITY_PROGRAMS_SYSTEM + ADDING_GUIDE)
│   │   ├── stories.md (UNIFIED_STORIES_SYSTEM_COMPLETE)
│   │   └── images.md (IMAGE_UPLOAD_COMPLETE + STORAGE_POLICY_FIX)
│   │
│   ├── architecture/
│   │   ├── README.md
│   │   ├── database.md (DATABASE_ARCHITECTURE_CORRECTED)
│   │   └── roadmap.md (CMS_IMPROVEMENT_RECOMMENDATIONS)
│   │
│   └── archive/
│       ├── README.md (index of archived docs)
│       ├── sessions/ (all session summaries)
│       └── completed/ (all COMPLETE.md files)
│
├── [rest of codebase]
```

## Benefits of This Structure

1. **Clear Navigation**: README points to docs/, docs/README provides structure
2. **Easy Onboarding**: New developers find what they need quickly
3. **Reduced Clutter**: Root directory clean, only essential files
4. **Historical Record**: Archived docs preserve development history
5. **Scalability**: Easy to add new feature docs in organized folders
6. **Searchability**: Related docs grouped together

## Implementation Plan

### Phase 1: Create Structure (5 min)
1. Create `docs/` folder structure
2. Create README files for each section

### Phase 2: Consolidate & Move (15 min)
1. Consolidate related docs into single feature docs
2. Move files to appropriate folders
3. Update internal links

### Phase 3: Update Root README (5 min)
1. Clear, concise project overview
2. Link to docs/ for detailed documentation
3. Quick start guide

### Phase 4: Archive (5 min)
1. Move completed/superseded docs to archive
2. Create archive index
3. Preserve git history

## Next Session Goals

After this reorganization:
1. **Clean codebase** - only 2 MD files in root
2. **Clear documentation** - organized by category
3. **Easy navigation** - README → docs → specific feature
4. **Historical record** - archived but accessible
5. **Ready for next phase** - clean slate for new development

---

**Status**: Ready to implement
**Estimated Time**: 30 minutes
**Risk**: Low (just moving files, git preserves history)

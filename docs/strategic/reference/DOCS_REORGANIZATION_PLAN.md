# JusticeHub Documentation Reorganization Plan

**Date**: January 2, 2026
**Philosophy**: DHH-inspired structure - catch issues early, organize by purpose

---

## Current State

**Problem**: 39 markdown files in root + 83 in `/docs/` = 122 total docs scattered

**Impact**:
- Hard to find relevant documentation
- Duplicate/outdated guides unclear
- No clear "start here" path
- Completed work mixed with active guides

---

## Proposed Structure (DHH-Inspired)

```
/docs/
├── /guides/              # HOW-TO guides for current features
│   ├── /alma/           # ALMA system guides
│   ├── /automation/     # GitHub Actions, cron jobs
│   ├── /deployment/     # Deploy, setup, secrets
│   ├── /empathy-ledger/ # EL integration
│   └── /brand/          # Brand/design guides
│
├── /specs/              # Feature specifications (approved)
│   ├── TEMPLATE.md      # Spec template
│   └── YYMMDD-X-slug.md # Versioned specs
│
├── /architecture/       # System design decisions
│   ├── DATABASE_ARCHITECTURE.md
│   ├── ALMA_UNIFICATION_STRATEGY.md
│   └── API_INTEGRATION_PLAN.md
│
├── /completed/          # Completed implementation reports
│   ├── ALMA_SENTIMENT_DEMO_COMPLETE.md
│   ├── DEPLOYMENT_SUCCESS.md
│   └── AUTOMATION_COMPLETE.md
│
├── /archive/            # Outdated/superseded docs
│   └── (old versions, deprecated guides)
│
└── README.md            # Documentation index with clear paths
```

---

## File Categorization

### 1. Guides (Active How-To) → `/docs/guides/`

**ALMA Guides** → `/docs/guides/alma/`:
- ALMA_QUICK_START.md
- ALMA_DATA_PRESENTATION_STRATEGY.md
- ALMA_ANALYTICS_STUDIO_PLAN.md

**Automation Guides** → `/docs/guides/automation/`:
- AUTOMATION_README.md
- AUTOMATION_QUICK_START.md
- AUTOMATION_ENABLED.md
- GITHUB_ACTIONS_SETUP.md
- DATA_INGESTION_AUTOMATION_PLAN.md

**Deployment Guides** → `/docs/guides/deployment/`:
- DEPLOY_NOW.md
- DEPLOYMENT_NEXT_STEPS.md
- BITWARDEN_SECRETS.md
- GITHUB_SECRETS_SETUP.md
- QUICK_REFERENCE.md

**Empathy Ledger Integration** → `/docs/guides/empathy-ledger/`:
- EMPATHY_LEDGER_INTEGRATION_CORRECTED.md

**Brand Guides** → `/docs/guides/brand/`:
- BRAND_COMPONENTS.md

### 2. Architecture (Design Decisions) → `/docs/architecture/`

- ALMA_UNIFICATION_STRATEGY.md
- PROJECT_MASTER_INDEX.md (could be README.md)

### 3. Completed Work (Status Reports) → `/docs/completed/`

- ALMA_MEDIA_SENTIMENT_LIVE.md
- ALMA_SCROLLYTELLING_COMPLETE.md
- ALMA_SENTIMENT_DEMO_COMPLETE.md
- ALMA_UNIFICATION_COMPLETE.md
- BRAND_ALIGNMENT_COMPLETE.md
- BRAND_UNIFICATION_COMPLETE.md
- DEPLOYMENT_SUCCESS.md
- MEDIA_SENTIMENT_TRACKING_COMPLETE.md

### 4. Archive (Superseded) → `/docs/archive/`

These have been superseded by newer versions:
- DEPLOY_AUTOMATION_NOW.md (superseded by DEPLOY_NOW.md)
- DEPLOY_AUTOMATION_CORRECTED.md (superseded)
- ANTHROPIC_MAX_PLAN_SETUP.md (one-time setup, completed)
- CLAUDE.md (generic, unclear purpose)

### 5. Root Level (Keep)

These should stay in root for easy access:
- README.md (main project readme)
- package.json, package-lock.json, tsconfig.json (build config)
- vercel.json (deployment config)

### 6. Scripts & Data → Move to appropriate folders

- `health-check-2026-01-02.json` → `/logs/health-checks/`
- `setup-github-secrets-from-bitwarden.sh` → `/scripts/setup/`

---

## Migration Plan

### Phase 1: Create Structure
```bash
mkdir -p docs/guides/{alma,automation,deployment,empathy-ledger,brand}
mkdir -p docs/specs
mkdir -p docs/architecture
mkdir -p docs/completed
mkdir -p docs/archive
mkdir -p logs/health-checks
mkdir -p scripts/setup
```

### Phase 2: Move Files
```bash
# ALMA guides
mv ALMA_QUICK_START.md docs/guides/alma/
mv ALMA_DATA_PRESENTATION_STRATEGY.md docs/guides/alma/
mv ALMA_ANALYTICS_STUDIO_PLAN.md docs/guides/alma/

# Automation guides
mv AUTOMATION_README.md docs/guides/automation/
mv AUTOMATION_QUICK_START.md docs/guides/automation/
mv AUTOMATION_ENABLED.md docs/guides/automation/
mv GITHUB_ACTIONS_SETUP.md docs/guides/automation/
mv DATA_INGESTION_AUTOMATION_PLAN.md docs/guides/automation/

# Deployment guides
mv DEPLOY_NOW.md docs/guides/deployment/
mv DEPLOYMENT_NEXT_STEPS.md docs/guides/deployment/
mv BITWARDEN_SECRETS.md docs/guides/deployment/
mv GITHUB_SECRETS_SETUP.md docs/guides/deployment/
mv QUICK_REFERENCE.md docs/guides/deployment/

# Empathy Ledger
mv EMPATHY_LEDGER_INTEGRATION_CORRECTED.md docs/guides/empathy-ledger/

# Brand
mv BRAND_COMPONENTS.md docs/guides/brand/

# Architecture
mv ALMA_UNIFICATION_STRATEGY.md docs/architecture/
mv PROJECT_MASTER_INDEX.md docs/architecture/

# Completed work
mv ALMA_MEDIA_SENTIMENT_LIVE.md docs/completed/
mv ALMA_SCROLLYTELLING_COMPLETE.md docs/completed/
mv ALMA_SENTIMENT_DEMO_COMPLETE.md docs/completed/
mv ALMA_UNIFICATION_COMPLETE.md docs/completed/
mv BRAND_ALIGNMENT_COMPLETE.md docs/completed/
mv BRAND_UNIFICATION_COMPLETE.md docs/completed/
mv DEPLOYMENT_SUCCESS.md docs/completed/
mv MEDIA_SENTIMENT_TRACKING_COMPLETE.md docs/completed/

# Archive
mv DEPLOY_AUTOMATION_NOW.md docs/archive/
mv DEPLOY_AUTOMATION_CORRECTED.md docs/archive/
mv ANTHROPIC_MAX_PLAN_SETUP.md docs/archive/
mv CLAUDE.md docs/archive/

# Scripts and data
mv health-check-2026-01-02.json logs/health-checks/
mv setup-github-secrets-from-bitwarden.sh scripts/setup/
```

### Phase 3: Create Index
Create `/docs/README.md` with clear navigation paths

### Phase 4: Create Spec Workflow
- Copy spec template from ACT Farmhand
- Create ACT Code Reviewer skill for JusticeHub
- Document spec review process

---

## Benefits

### Before
- ❌ 39 files in root (scattered)
- ❌ 83 files in /docs/ (flat structure)
- ❌ No clear "start here" path
- ❌ Completed work mixed with active guides
- ❌ Hard to find relevant documentation

### After
- ✅ Clean root (only essential config files)
- ✅ Organized /docs/ by purpose
- ✅ Clear paths: `/docs/guides/` → `/docs/specs/` → `/docs/completed/`
- ✅ Completed work archived separately
- ✅ Easy to find what you need

---

## ACT Principles Applied

1. **Simplicity Over Cleverness** - Clear folder names, no abstraction
2. **Specs Before Code** - New `/docs/specs/` for feature planning
3. **Hard Blocks Over Soft Warnings** - Structure enforces organization
4. **Real-Time Over Batch** - Guides reflect current state, not outdated

---

## Next Steps

1. Review this plan
2. Execute migration (automated script)
3. Create `/docs/README.md` index
4. Set up spec workflow for future features
5. Archive outdated files (don't delete - keep history)

---

*Inspired by DHH's "catch anti-patterns in specs, not production"*
*Applied to documentation: "organize by purpose, not chronology"*

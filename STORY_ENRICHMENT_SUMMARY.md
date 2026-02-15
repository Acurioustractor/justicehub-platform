# Story Enrichment System - Complete ✅

**Created:** February 9, 2026  
**Status:** Ready to deploy  
**Goal:** Scale from 1 to 50+ stories

---

## 📦 WHAT WAS CREATED

### 1. Comprehensive Strategy Document
**File:** `docs/STORY_ENRICHMENT_STRATEGY.md`

**Contents:**
- 3-pronged approach (API sync + Direct onboarding + Partners)
- 30-day MVP plan
- 90-day full enrichment roadmap
- Content guidelines
- Success metrics

### 2. Story Sync Script
**File:** `scripts/sync-empathy-ledger-stories.mjs`

**Features:**
- Pulls public stories from Empathy Ledger
- Calculates quality scores (0-100)
- Auto-detects justice-related content
- Filters by consent (is_public + privacy_level)
- Stores in JusticeHub database

**Usage:**
```bash
node scripts/sync-empathy-ledger-stories.mjs --limit=100
```

### 3. Narrative Score Updater
**File:** `scripts/update-narrative-scores.mjs`

**Features:**
- Auto-links stories to interventions
- Calculates narrative scores (0-10)
- Updates ALMA alpha signals
- Shows before/after comparison

**Usage:**
```bash
node scripts/update-narrative-scores.mjs
```

### 4. Database Migration
**File:** `supabase/migrations/20250209000002_add_empathy_ledger_stories.sql`

**Creates:**
- `empathy_ledger_stories` table
- `story_intervention_links` table
- `story_count` field on interventions
- `narrative_score` field on interventions
- Auto-update triggers
- Views for reporting

### 5. Quick Start Guide
**File:** `STORY_ENRICHMENT_QUICKSTART.md`

**Step-by-step:**
1. Apply migration
2. Run initial sync
3. Set up automation
4. Onboard storytellers
5. Monitor results

---

## 🎯 THREE-PRONGED APPROACH

```
┌──────────────────────────────────────────────────────────────┐
│                   STORY ENRICHMENT                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  API SYNC    │  │   DIRECT     │  │  PARTNERS    │       │
│  │              │  │  ONBOARDING  │  │              │       │
│  │ • Automated  │  │              │  │ • Bulk       │       │
│  │ • Daily      │  │ • Forms      │  │   upload     │       │
│  │ • Existing   │  │ • Interviews │  │ • Training   │       │
│  │   stories    │  │ • Events     │  │ • Support    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Prong 1: API Sync (Fastest)
- Pull existing Empathy Ledger stories
- Requires: `is_public=true`, `privacy_level=public`
- Target: 20-30 stories immediately
- Effort: Run one command

### Prong 2: Direct Onboarding (Highest Quality)
- Interview storytellers directly
- Create `/share-your-story` form
- Curate & edit stories
- Target: 20-30 stories over 30 days
- Effort: Medium (requires time)

### Prong 3: Partner Organizations (Scalable)
- Partner with Aboriginal Legal Services, youth orgs
- Bulk upload capabilities
- Training & support package
- Target: 100+ stories over 90 days
- Effort: High (requires relationship building)

---

## 📊 EXPECTED OUTCOMES

### After Running Sync (Today)
| Metric | Current | Expected |
|--------|---------|----------|
| Stories in JusticeHub | 1 | 10-50+ |
| Quality scores | N/A | All scored 0-100 |
| Justice-related flag | N/A | Auto-detected |

### After 30 Days (MVP)
| Metric | Target |
|--------|--------|
| Total stories | 50+ |
| Active storytellers | 75+ |
| Partner organizations | 10 |
| Average narrative score | 3.5+ |

### After 90 Days (Full)
| Metric | Target |
|--------|--------|
| Total stories | 150+ |
| Active storytellers | 200+ |
| Partner organizations | 25 |
| Geographic coverage | All 8 states |

---

## 🛠️ TECHNICAL ARCHITECTURE

### Data Flow
```
Empathy Ledger (External)
    │
    ├─ stories (public, consented)
    ├─ profiles (justicehub_enabled)
    └─ organizations
         │
         ▼
sync-empathy-ledger-stories.mjs
    │
    ├─ Quality scoring
    ├─ Justice keyword detection
    └─ Deduplication
         │
         ▼
empathy_ledger_stories table (JusticeHub)
    │
    ├─ story_id (EL reference)
    ├─ quality_score (0-100)
    ├─ is_justice_related (boolean)
    └─ synced_at (timestamp)
         │
         ▼
update-narrative-scores.mjs
    │
    ├─ Auto-link to interventions
    └─ Calculate narrative scores
         │
         ▼
alma_interventions table
    │
    ├─ story_count (integer)
    └─ narrative_score (0-10)
         │
         ▼
Alpha Signals API
    │
    ├─ Evidence score (0-10)
    ├─ Narrative score (0-10) ← NEW
    └─ Authority score (0-10)
         │
         ▼
JusticeHub Frontend
    │
    ├─ /stories
    ├─ /intelligence/dashboard
    └─ /youth-justice-report
```

### Quality Scoring Algorithm
```
Base Score: 0

+20 points: Has image (story_image_url)
+15 points: Good summary (100+ chars)
+20 points: Long content (2000+ chars)
+10 points: Medium content (1000+ chars)
+ 5 points: Short content (500+ chars)
+25 points: Justice-related keywords
+10 points: Featured status
+ 5 points: Has themes
+ 5 points: Linked to service

Max: 100 points
```

### Narrative Score Calculation
```
Story Count → Narrative Score

0 stories  = 0
1 story    = 3
2 stories  = 5
3 stories  = 6
4 stories  = 8
6+ stories = 10
```

---

## 🚀 IMMEDIATE NEXT STEPS

### 1. Apply Migration (2 minutes)
```bash
node scripts/apply-migration.mjs supabase/migrations/20250209000002_add_empathy_ledger_stories.sql
```

### 2. Run Initial Sync (1 minute)
```bash
node scripts/sync-empathy-ledger-stories.mjs
```

**Expected:** 10-50 stories synced depending on Empathy Ledger content

### 3. Link to Interventions (1 minute)
```bash
node scripts/update-narrative-scores.mjs
```

**Expected:** Stories linked to relevant interventions, narrative scores updated

### 4. Check Results (1 minute)
```sql
-- View synced stories
SELECT 
  title, 
  quality_score, 
  is_justice_related,
  synced_at
FROM empathy_ledger_stories
ORDER BY quality_score DESC;
```

### 5. Set Up Automation (5 minutes)
```bash
# Edit crontab
crontab -e

# Add daily sync
0 4 * * * cd /Users/benknight/Code/JusticeHub && node scripts/sync-empathy-ledger-stories.mjs >> logs/story-sync.log 2>&1
0 5 * * * cd /Users/benknight/Code/JusticeHub && node scripts/update-narrative-scores.mjs >> logs/narrative-scores.log 2>&1
```

---

## 📈 MONITORING & SUCCESS

### Dashboard Queries
```sql
-- Total stories synced
SELECT COUNT(*) FROM empathy_ledger_stories;

-- Justice-related stories
SELECT COUNT(*) FROM empathy_ledger_stories WHERE is_justice_related = true;

-- Average quality score
SELECT AVG(quality_score) FROM empathy_ledger_stories;

-- Top interventions by narrative score
SELECT name, story_count, narrative_score
FROM alma_interventions
ORDER BY narrative_score DESC
LIMIT 10;
```

### API Endpoints
```bash
# Get all synced stories
curl http://localhost:3000/api/empathy-ledger/stories

# Get featured stories
curl http://localhost:3000/api/empathy-ledger/stories?featured=true

# Get alpha signals (with narrative scores)
curl http://localhost:3000/api/intelligence/alpha-signals
```

---

## 🎉 READY TO LAUNCH

**All systems created:**
- ✅ Database schema
- ✅ Sync scripts
- ✅ Quality scoring
- ✅ Auto-linking
- ✅ Narrative scores
- ✅ Documentation
- ✅ Quick start guide

**Time to first story:** 5 minutes  
**Time to 50 stories:** 30 days  
**Time to 150 stories:** 90 days

---

## 📞 SUPPORT

**If issues arise:**
1. Check logs: `logs/story-sync.log`
2. Verify Empathy Ledger connection
3. Review quality scores
4. Check database tables

**Documentation:**
- Full strategy: `docs/STORY_ENRICHMENT_STRATEGY.md`
- Quick start: `STORY_ENRICHMENT_QUICKSTART.md`
- This summary: `STORY_ENRICHMENT_SUMMARY.md`

---

**Ready? Run this:**
```bash
# Complete setup in one command
cd /Users/benknight/Code/JusticeHub && \
node scripts/apply-migration.mjs supabase/migrations/20250209000002_add_empathy_ledger_stories.sql && \
node scripts/sync-empathy-ledger-stories.mjs && \
node scripts/update-narrative-scores.mjs
```

🚀 **Let's enrich JusticeHub with real stories!**

# Story Enrichment - Quick Start Guide

**Goal:** Go from 1 to 50+ stories in 30 days  
**Current Status:** Ready to begin

---

## 🚀 IMMEDIATE ACTIONS (Do These Now)

### Step 1: Apply Database Migration
```bash
# Create tables for story sync
node scripts/apply-migration.mjs supabase/migrations/20250209000002_add_empathy_ledger_stories.sql
```

### Step 2: Sync Existing Empathy Ledger Stories
```bash
# Pull stories with consent for JusticeHub
node scripts/sync-empathy-ledger-stories.mjs --limit=100

# Expected output:
# ✅ Found X public stories
# ✅ Synced: Y stories
```

### Step 3: Check What You Have
```bash
# View synced stories
curl -s http://localhost:3000/api/empathy-ledger/stories | python3 -m json.tool

# Or query database
psql $DATABASE_URL -c "
  SELECT title, quality_score, is_justice_related, synced_at
  FROM empathy_ledger_stories
  ORDER BY quality_score DESC
  LIMIT 10;
"
```

---

## 📊 EXPECTED RESULTS

After running sync, you should see:
- **Stories synced:** Number of public stories from Empathy Ledger
- **Quality scores:** Each story scored (0-100)
- **Justice-related:** Flagged if relevant to youth justice

### Quality Score Breakdown
| Score | Quality | Action |
|-------|---------|--------|
| 80-100 | 🌟 Excellent | Feature on homepage |
| 60-79 | ⭐ Good | Publish prominently |
| 40-59 | 📄 Okay | Publish with editing |
| 0-39 | ⚠️ Low | Review before publishing |

---

## 🔄 AUTOMATE SYNC

### Set Up Daily Sync
```bash
# Edit crontab
crontab -e

# Add this line for daily 4am sync
0 4 * * * cd /Users/benknight/Code/JusticeHub && node scripts/sync-empathy-ledger-stories.mjs >> logs/story-sync.log 2>&1

# Add this line for daily 5am narrative score update
0 5 * * * cd /Users/benknight/Code/JusticeHub && node scripts/update-narrative-scores.mjs >> logs/narrative-scores.log 2>&1
```

---

## 🔗 LINK STORIES TO INTERVENTIONS

### Auto-Link (Recommended First)
```bash
# Automatically link stories to relevant interventions
node scripts/update-narrative-scores.mjs

# This will:
# 1. Find unlinked stories
# 2. Match to interventions by name/theme
# 3. Create story_intervention_links
# 4. Update narrative scores
```

### Manual Link (For Precision)
```sql
-- Link a specific story to an intervention
INSERT INTO story_intervention_links (story_id, intervention_id, link_type)
VALUES (
  'empathy-ledger-story-id',
  'intervention-uuid',
  'features'  -- or 'mentions', 'operates', 'experienced'
);
```

---

## 📈 VERIFY NARRATIVE SCORES

### Check Alpha Signals
```bash
# Get interventions with updated narrative scores
curl -s http://localhost:3000/api/intelligence/alpha-signals | python3 -m json.tool

# Look for:
# - signal_narrative_score (should be > 0 for stories)
# - alpha_score (increases with narrative)
```

### Top Interventions by Narrative
```sql
-- View top interventions by story count
SELECT 
  name, 
  story_count, 
  narrative_score,
  evidence_level
FROM alma_interventions
ORDER BY narrative_score DESC
LIMIT 10;
```

---

## 👥 ONBOARD NEW STORYTELLERS

### Option 1: Direct Onboarding Form
**Create at:** `/share-your-story`

**Process:**
1. Storyteller fills form
2. Team conducts interview
3. Curate & edit with storyteller
4. Upload to Empathy Ledger
5. Mark `justicehub_enabled = true`
6. Auto-sync to JusticeHub

### Option 2: Partner Organization
**Target:** Aboriginal Legal Services, Youth Orgs, etc.

**Package:**
- Training materials
- Recording equipment
- Upload access
- Ongoing support

### Option 3: Storytelling Events
**Host events:**
- "Stories of Change" gatherings
- Youth justice forums
- Community storytelling circles

---

## 📋 WEEKLY CHECKLIST

### Week 1: Foundation
- [x] Apply database migration
- [x] Run initial story sync
- [x] Review synced story quality
- [x] Set up automated daily sync
- [x] Create `/share-your-story` form

### Week 2: Outreach
- [ ] Email existing storytellers for consent
- [ ] Contact 3 partner organizations
- [ ] Conduct 5 interviews
- [ ] Upload 10 new stories

### Week 3: Scale
- [ ] Partner with 5 more organizations
- [ ] Host 1 storytelling event
- [ ] Reach 30 total stories
- [ ] Review & curate all stories

### Week 4: Polish
- [ ] Reach 50 stories
- [ ] Feature top 10 on homepage
- [ ] Create story collection pages
- [ ] Plan Month 2 expansion

---

## 🛠️ TROUBLESHOOTING

### No Stories Syncing
```bash
# Check Empathy Ledger connection
node scripts/sync-empathy-ledger-stories.mjs --dry-run

# Verify environment variables
echo $EMPATHY_LEDGER_URL
echo $EMPATHY_LEDGER_ANON_KEY
```

### Stories Not Justice-Related
The sync auto-detects justice-related content. If missing:
```sql
-- Manually mark as justice-related
UPDATE empathy_ledger_stories
SET is_justice_related = true
WHERE title ILIKE '%justice%' OR title ILIKE '%youth%';
```

### Low Quality Scores
Stories need:
- Image (+20 points)
- Good summary 100+ chars (+15 points)
- Content 1000+ chars (+10-20 points)
- Justice keywords (+25 points)

### Narrative Scores Not Updating
```bash
# Force update
node scripts/update-narrative-scores.mjs

# Check story-intervention links
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM story_intervention_links;
"
```

---

## 📊 MONITORING

### Daily Stats
```bash
# Quick stats check
curl -s http://localhost:3000/api/admin/data-operations/stats | jq '.totals'

# Should show:
# - interventions: 964+
# - stories: Increasing daily
```

### Story Quality Dashboard
```sql
-- Quality breakdown
SELECT 
  CASE 
    WHEN quality_score >= 80 THEN '🌟 Excellent'
    WHEN quality_score >= 60 THEN '⭐ Good'
    WHEN quality_score >= 40 THEN '📄 Okay'
    ELSE '⚠️ Low'
  END as quality,
  COUNT(*) as count
FROM empathy_ledger_stories
GROUP BY 1
ORDER BY 2 DESC;
```

---

## 🎯 SUCCESS METRICS

| Metric | Current | 30 Days | 90 Days |
|--------|---------|---------|---------|
| Published Stories | 1 | 50 | 150 |
| Storytellers | 34 | 75 | 200 |
| Partner Orgs | 3 | 10 | 25 |
| Avg Narrative Score | 0 | 3.5 | 5.0 |
| States Covered | 3 | 6 | 8 |

---

## 📞 NEXT STEPS

**After running initial sync:**

1. **Review results** in database
2. **Set up automation** with cron
3. **Email storytellers** for consent
4. **Contact partners** for bulk stories
5. **Create onboarding** form/page

**Full documentation:** `docs/STORY_ENRICHMENT_STRATEGY.md`

---

## ✅ READY?

**Run this now:**
```bash
# 1. Apply migration
node scripts/apply-migration.mjs supabase/migrations/20250209000002_add_empathy_ledger_stories.sql

# 2. Sync stories
node scripts/sync-empathy-ledger-stories.mjs

# 3. Link to interventions
node scripts/update-narrative-scores.mjs

# 4. Check results
psql $DATABASE_URL -c "SELECT COUNT(*) FROM empathy_ledger_stories;"
```

🚀 **Let's enrich JusticeHub with real stories!**

# Story Sync Approach - Using Existing `justicehub_enabled` ✅

**Date:** February 9, 2026  
**Status:** Ready to use

---

## 🎯 The Simple Approach

You already have a checkbox in Empathy Ledger! We'll use that:

### For Stories
| Field | Location | Purpose |
|-------|----------|---------|
| `justicehub_enabled` | stories table | Explicit opt-in checkbox for JusticeHub |
| `is_public` + `privacy_level` | stories table | Fallback public consent |

### For Profiles
| Field | Location | Purpose |
|-------|----------|---------|
| `justicehub_enabled` | profiles table | Already exists and working ✅ |

---

## 🔧 How It Works

### Sync Script Priority Order
```
1. Try: stories.justicehub_enabled = true (explicit checkbox)
2. Fallback: is_public=true AND privacy_level=public (general public consent)
```

This means:
- If you tick the "Add to JusticeHub" checkbox on a story → it syncs
- If checkbox doesn't exist yet → falls back to public stories
- Never breaks, always works

---

## 📊 Analytics Support

### What's Tracked

| Metric | Table | Purpose |
|--------|-------|---------|
| **view_count** | empathy_ledger_stories | How many times story viewed |
| **engagement_score** | empathy_ledger_stories | Likes, shares, interactions |
| **quality_score** | empathy_ledger_stories | Auto-calculated (0-100) |
| **Sync runs** | story_sync_analytics | Historical sync tracking |

### Dashboard Commands

```bash
# View story analytics
node scripts/story-analytics.mjs

# Detailed breakdown
node scripts/story-analytics.mjs --detailed

# Export as JSON
node scripts/story-analytics.mjs --json
```

---

## 🚀 Quick Start

### 1. Apply Migration (adds analytics columns)
```bash
node scripts/apply-migration.mjs supabase/migrations/20250209000002_add_empathy_ledger_stories.sql
```

### 2. Sync Stories
```bash
node scripts/sync-empathy-ledger-stories.mjs
```

### 3. View Analytics
```bash
node scripts/story-analytics.mjs
```

---

## 📈 Dashboard Queries

```sql
-- Quick stats
SELECT * FROM story_analytics_summary;

-- Recent sync history
SELECT * FROM story_sync_analytics ORDER BY run_at DESC LIMIT 5;

-- Top stories by quality
SELECT title, quality_score, view_count 
FROM empathy_ledger_stories 
ORDER BY quality_score DESC 
LIMIT 10;

-- Justice-related stories only
SELECT title, story_category, organization_name
FROM empathy_ledger_stories 
WHERE is_justice_related = true;
```

---

## 🎛️ Checkbox Options in Empathy Ledger

If you want to add the checkbox to Empathy Ledger UI:

### Option 1: Add to stories table
```sql
-- Add to Empathy Ledger stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT false;
```

Then in your Empathy Ledger admin UI:
- Add checkbox: "☑️ Share on JusticeHub"
- Default: unchecked
- Only admins or story owners can toggle

### Option 2: Use Existing Fields (No Change Needed)
The sync script already works with:
- `is_public = true` 
- `privacy_level = 'public'`

If a story is public, it can sync to JusticeHub.

---

## 📊 Quality Scoring (Automatic)

Stories are auto-scored 0-100 based on:

| Factor | Points |
|--------|--------|
| Has image | +20 |
| Good summary (100+ chars) | +15 |
| Long content (2000+ chars) | +20 |
| Justice-related keywords | +25 |
| Featured status | +10 |
| Has themes | +5 |
| Linked to service | +5 |

**High quality (60+):** Prioritized on homepage  
**Medium (40-59):** Standard display  
**Low (<40):** Hidden unless specifically searched

---

## 🔗 Files Created/Updated

| File | Purpose |
|------|---------|
| `scripts/sync-empathy-ledger-stories.mjs` | Sync with checkbox support |
| `scripts/story-analytics.mjs` | Analytics dashboard |
| `scripts/update-narrative-scores.mjs` | Link stories to interventions |
| `supabase/migrations/...add_empathy_ledger_stories.sql` | Database schema |

---

## ✅ Ready to Run

```bash
# Complete setup
cd /Users/benknight/Code/JusticeHub && \
  node scripts/apply-migration.mjs supabase/migrations/20250209000002_add_empathy_ledger_stories.sql && \
  node scripts/sync-empathy-ledger-stories.mjs && \
  node scripts/story-analytics.mjs
```

---

## 🎉 Result

- Stories with checkbox ticked → Synced to JusticeHub
- Full analytics tracking → View counts, engagement
- Quality scoring → Best stories prioritized
- Historical sync data → Track over time

**Your checkbox approach stays. Analytics added. Done.**

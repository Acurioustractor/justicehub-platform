# 🚀 Quick Start: Run Database Migration

## TL;DR - 5 Minute Setup

### Step 1: Open Supabase SQL Editor (1 min)
```
https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/editor
```

### Step 2: Run Migration 1 (2 min)
1. Open: `supabase/migrations/20250121000001_unify_services_schema.sql`
2. Copy entire file contents
3. Paste into SQL Editor
4. Click **"Run"** button
5. Wait for success message ✅

### Step 3: Run Migration 2 (1 min)
1. Open: `supabase/migrations/20250121000002_migrate_seed_data.sql`
2. Copy entire file contents
3. Paste into SQL Editor
4. Click **"Run"** button
5. Look for migration summary in output ✅

### Step 4: Verify (1 min)
Run this query in SQL Editor:
```sql
-- Quick verification
SELECT
  COUNT(*) as total_services,
  COUNT(*) FILTER (WHERE youth_specific = true) as youth_services,
  COUNT(*) FILTER (WHERE indigenous_specific = true) as indigenous_services,
  COUNT(*) FILTER (WHERE slug IS NOT NULL) as has_slug
FROM services;

-- Check view works
SELECT * FROM services_complete LIMIT 3;
```

Expected results:
- ✅ 80+ total services
- ✅ 50+ youth services
- ✅ 10+ indigenous services
- ✅ All services have slugs
- ✅ View returns 3 services

### Step 5: Test Frontend
```bash
npm run dev
```

Visit: http://localhost:3003/service-finder

---

## ✅ Success Checklist

After running migrations:

- [ ] Migration 1 completed without errors
- [ ] Migration 2 completed without errors
- [ ] Verification query returns expected counts
- [ ] `services_complete` view returns data
- [ ] Frontend service finder loads
- [ ] Services display correctly
- [ ] Search works
- [ ] Stats show correct numbers

---

## 🐛 Troubleshooting

### "column already exists"
✅ Safe to ignore - migrations use `IF NOT EXISTS`

### "view doesn't exist"
❌ Migration 1 didn't complete. Re-run it.

### "Invalid API key" on frontend
❌ Check `.env` has correct `SUPABASE_ANON_KEY`

### No services showing
❌ Run verification query to check data exists:
```sql
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM services WHERE is_active = true;
```

---

## 📦 What Got Created

### New Database Objects
- ✅ 20+ new columns in `services` table
- ✅ `service_locations` table
- ✅ `service_contacts` table
- ✅ `services_complete` view
- ✅ Helper functions for data quality
- ✅ Indexes for performance

### Updated Code
- ✅ `/api/services` - Uses new view
- ✅ `/api/services/search` - Uses new view
- ✅ `/api/services/stats` - Enhanced stats

---

## 🎯 Next: AI Scraping Setup

Once migration verified, proceed to Phase 0:

```bash
# Install scraping dependencies
npm install playwright @anthropic-ai/sdk openai chromadb zod cheerio

# Install Playwright browsers
npx playwright install

# Set up ChromaDB
docker run -d -p 8000:8000 chromadb/chroma

# Start building scrapers!
```

See: [SERVICE_FINDER_AI_UPGRADE_PLAN.md](SERVICE_FINDER_AI_UPGRADE_PLAN.md#-phase-0-mvp-with-freeexisting-tools-weeks-1-2--start-here)

---

## 📚 Full Documentation

- **Migration Details**: [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
- **Schema Analysis**: [SCHEMA_ANALYSIS_AND_SCRAPING_STRATEGY.md](SCHEMA_ANALYSIS_AND_SCRAPING_STRATEGY.md)
- **AI Scraping Plan**: [SERVICE_FINDER_AI_UPGRADE_PLAN.md](SERVICE_FINDER_AI_UPGRADE_PLAN.md)
- **Migration README**: [../supabase/migrations/README.md](../supabase/migrations/README.md)

---

**Estimated Time**: 5-10 minutes
**Difficulty**: Easy (copy-paste SQL)
**Risk**: Low (can rollback if needed)

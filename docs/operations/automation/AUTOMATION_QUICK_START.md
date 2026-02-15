# JusticeHub Automation - Quick Start Guide

## 🚀 Getting Started

This guide walks you through setting up JusticeHub's automated data pipelines in **under 30 minutes**.

---

## Prerequisites

- [ ] GitHub repository admin access
- [ ] Supabase project access (JusticeHub + Empathy Ledger)
- [ ] Anthropic API account
- [ ] Firecrawl API account
- [ ] Slack workspace (optional, for alerts)

---

## Step 1: Configure GitHub Secrets (10 minutes)

Go to **Settings → Secrets and variables → Actions → New repository secret**

### Critical Secrets (Required)

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Get from: Supabase → Project Settings → API → Project URL
   - Example: `https://tednluwflfhxyucgwigh.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Get from: Supabase → Project Settings → API → service_role key
   - ⚠️ Keep this secret! Full database access.

3. **EMPATHY_LEDGER_SUPABASE_URL**
   - Get from: Empathy Ledger Supabase → Project Settings → API → Project URL

4. **EMPATHY_LEDGER_SUPABASE_ANON_KEY**
   - Get from: Empathy Ledger Supabase → Project Settings → API → anon key

5. **ANTHROPIC_API_KEY**
   - Get from: https://console.anthropic.com → API Keys
   - Format: `sk-ant-...`

6. **FIRECRAWL_API_KEY**
   - Get from: https://firecrawl.dev/dashboard → API Keys
   - Format: `fc-...`

### Optional (Recommended)

7. **SLACK_WEBHOOK_URL**
   - Get from: Slack → Apps → Incoming Webhooks → Add to Workspace
   - Format: `https://hooks.slack.com/services/...`

8. **NEXT_PUBLIC_SITE_URL**
   - Your production URL: `https://justicehub.org.au`

---

## Step 2: Enable GitHub Actions (2 minutes)

1. Go to **Actions** tab in your repository
2. If prompted, click **"I understand my workflows, go ahead and enable them"**
3. You should see 4 workflows:
   - ✅ ALMA Ingestion (already running)
   - ✅ Daily Media Sentiment (already running)
   - ⭐ Sync Empathy Ledger Profiles (NEW)
   - ⭐ Data Source Health Monitoring (NEW)
   - ⭐ Service Directory Scraping (NEW)

---

## Step 3: Prepare Empathy Ledger (5 minutes)

In your **Empathy Ledger V2 database**, add columns to `public_profiles`:

```sql
-- Add JusticeHub integration fields
ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_role TEXT;

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_synced_at TIMESTAMPTZ;

-- Mark profiles for JusticeHub
UPDATE public_profiles
SET justicehub_enabled = TRUE
WHERE id IN (
  -- Add profile IDs you want to sync to JusticeHub
  'uuid-1',
  'uuid-2',
  'uuid-3'
);
```

---

## Step 4: Test Workflows (10 minutes)

### Test 1: Empathy Ledger Sync

```bash
# Via GitHub CLI
gh workflow run sync-empathy-ledger.yml

# Or via UI: Actions → Sync Empathy Ledger Profiles → Run workflow
```

**Verify**:
```sql
-- In JusticeHub database
SELECT
  display_name,
  role,
  empathy_ledger_profile_id,
  updated_at
FROM public_profiles
WHERE empathy_ledger_profile_id IS NOT NULL;
```

Expected: Profiles from Empathy Ledger now in JusticeHub

### Test 2: Health Monitoring

```bash
gh workflow run health-monitoring.yml
```

**Verify**:
- Check workflow logs for source status
- Download artifact `health-check-report-[number].json`
- If Slack configured: Check for alert message

Expected: 10-12 sources up, 2-4 down (some may be 404)

### Test 3: Service Scraping

```bash
# Test with small batch
gh workflow run service-directory-scraping.yml \
  -f priority=high \
  -f batch_size=3
```

**Verify**:
```sql
-- In JusticeHub database
SELECT
  name,
  organization_name,
  scrape_confidence_score,
  created_at
FROM services
ORDER BY created_at DESC
LIMIT 10;
```

Expected: New services added from headspace, Legal Aid, etc.

---

## Step 5: Verify Automation Schedule (2 minutes)

Check that workflows are scheduled:

```bash
# List all workflows
gh workflow list

# Check next scheduled runs
gh run list --workflow=sync-empathy-ledger.yml --limit 1
gh run list --workflow=health-monitoring.yml --limit 1
```

**Expected Schedule**:
- **02:00 UTC** - ALMA Ingestion (existing)
- **03:00 UTC** - Service Directory Scraping
- **04:00 UTC** - Empathy Ledger Sync
- **06:00 UTC** - Media Sentiment Tracking (existing)
- **Every 6 hours** - Health Monitoring

---

## Troubleshooting

### "Workflow not found"
**Fix**: Push your code to GitHub first
```bash
git add .
git commit -m "Add automation workflows"
git push
```

### "Secret not found" error
**Fix**: Double-check secret name (case-sensitive) and value

### Empathy Ledger sync returns 0 profiles
**Fix**: Mark profiles with `justicehub_enabled=true` in Empathy Ledger

### Health check shows all sources down
**Fix**: Check workflow logs - may be network timeout, retry workflow

### Service scraping fails with API error
**Fix**: Check Firecrawl API key and quota

---

## Monitoring

### Daily Monitoring (5 min/day)

1. **Check failed workflows**:
   ```bash
   gh run list --status failure --limit 5
   ```

2. **Review artifacts**:
   - Health reports (every 6 hours)
   - Sync logs (daily at 4am UTC)
   - Scraping logs (daily at 3am UTC)

3. **Check data freshness**:
   ```sql
   -- Latest interventions
   SELECT created_at FROM alma_interventions
   ORDER BY created_at DESC LIMIT 1;

   -- Latest profiles synced
   SELECT updated_at FROM public_profiles
   WHERE empathy_ledger_profile_id IS NOT NULL
   ORDER BY updated_at DESC LIMIT 1;

   -- Latest services
   SELECT created_at FROM services
   ORDER BY created_at DESC LIMIT 1;
   ```

### Weekly Monitoring (15 min/week)

1. **Review costs**:
   - Anthropic Console: Token usage
   - Firecrawl Dashboard: Scrape counts
   - Supabase: Database size, API requests

2. **Check data quality**:
   ```sql
   -- Services with low confidence
   SELECT name, scrape_confidence_score
   FROM services
   WHERE scrape_confidence_score < 0.7
   ORDER BY created_at DESC;

   -- Failed ingestion jobs
   SELECT source_url, error_message, created_at
   FROM alma_ingestion_jobs
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Review Slack alerts**: Check for recurring failures

---

## Optimization Tips

### Reduce Costs

1. **Decrease scraping frequency** for low-priority sources
   ```yaml
   # In service-directory-scraping.yml
   schedule:
     - cron: '0 3 * * 0'  # Weekly instead of daily
   ```

2. **Reduce batch size**
   ```yaml
   batch_size:
     default: '5'  # Instead of '10'
   ```

3. **Cache unchanged content** (health monitoring already does this via MD5)

### Improve Data Quality

1. **Increase scraping depth**:
   - Modify `scrape-qld-services-batch.ts` to follow detail pages
   - Extract more fields per service

2. **Add cross-validation**:
   - Run duplicate detection monthly
   - Verify contact information

3. **Expand sources**:
   - Add more Legal Aid offices (SA, WA, TAS, ACT)
   - Add Ask Izzy comprehensive
   - Add state service directories

---

## Success Criteria

After 1 week of automation:

- ✅ Daily Empathy Ledger sync successful (no failures)
- ✅ 500+ services in database (up from ~50)
- ✅ 90%+ sources healthy (health monitoring)
- ✅ <5 workflow failures per week
- ✅ Fresh data (interventions/media updated daily)
- ✅ Slack alerts working (if configured)

---

## Next Steps

Once basic automation is stable:

1. **Add research evidence scraping** (weekly)
2. **Implement auto-linking** (profiles ↔ interventions)
3. **Deploy cross-validation** (duplicates, contacts)
4. **Add smart source discovery** (Google Custom Search)
5. **Build QLD Intelligence Dashboard** (`/intelligence/qld`)

---

## Support

### Workflow Issues
- Check workflow logs: Actions → [Workflow Name] → Latest run
- View artifacts: Scroll to bottom of workflow run

### Script Issues
- Test locally: `node scripts/[script-name].mjs`
- Check `.env.local` has all required vars

### Database Issues
- Use Supabase SQL Editor for queries
- Check RLS policies if data not appearing

---

## Quick Reference

### Useful Commands

```bash
# Run workflow manually
gh workflow run [workflow-name].yml

# Check recent runs
gh run list --limit 10

# View workflow logs
gh run view [run-id] --log

# Download artifacts
gh run download [run-id]

# List secrets (names only, not values)
gh secret list

# Set a secret
gh secret set SECRET_NAME
```

### Workflow Files

- `.github/workflows/sync-empathy-ledger.yml` - Profile sync (daily 4am)
- `.github/workflows/health-monitoring.yml` - Health checks (every 6h)
- `.github/workflows/service-directory-scraping.yml` - Service scraping (daily 3am)
- `.github/workflows/alma-ingestion.yml` - ALMA scraping (daily 2am)
- `.github/workflows/daily-media-sentiment.yml` - Media sentiment (daily 6am)

### Script Files

- `scripts/sync-empathy-ledger.mjs` - Sync profiles from Empathy Ledger
- `scripts/health-check-sources.mjs` - Monitor data source health
- `scripts/apply-unification-migration.mjs` - Apply SQL migrations remotely
- `src/scripts/scrape-qld-services-batch.ts` - Scrape service directories

---

**Total Setup Time**: ~30 minutes
**Maintenance**: ~5 min/day, 15 min/week
**Result**: Fully automated data pipelines, fresh data 24/7

*Last updated: January 2, 2026*

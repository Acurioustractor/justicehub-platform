# JusticeHub Automation - Deployment Next Steps

**Status**: Ready to deploy automation workflows
**Date**: January 2, 2026

---

## ✅ Completed Infrastructure

- [x] ALMA unification migration applied (51 statements, 100% success)
- [x] Empathy Ledger sync script created
- [x] Health monitoring script created (tested locally, 10/14 sources up)
- [x] Service directory scraping workflow created
- [x] GitHub Actions workflows configured
- [x] Documentation completed (10,000+ words)

---

## 🎯 Immediate Deployment Tasks

### Task 1: Configure Critical GitHub Secrets (5 minutes)

Navigate to: **JusticeHub GitHub → Settings → Secrets and variables → Actions**

#### Add These Secrets:

```bash
# Via GitHub CLI (recommended)
gh secret set EMPATHY_LEDGER_SUPABASE_URL
# When prompted, paste: [Get from Empathy Ledger V2 Supabase → Project Settings → API → Project URL]

gh secret set EMPATHY_LEDGER_SUPABASE_ANON_KEY
# When prompted, paste: [Get from Empathy Ledger V2 Supabase → Project Settings → API → anon key]

# Optional (for alerts)
gh secret set SLACK_WEBHOOK_URL
# When prompted, paste: [Get from Slack → Apps → Incoming Webhooks]
```

#### Or Via GitHub Web UI:

1. Go to https://github.com/[your-username]/JusticeHub/settings/secrets/actions
2. Click **New repository secret**
3. Add each secret:
   - Name: `EMPATHY_LEDGER_SUPABASE_URL`
   - Value: `https://[empathy-ledger-project-id].supabase.co`
4. Repeat for `EMPATHY_LEDGER_SUPABASE_ANON_KEY`
5. (Optional) Add `SLACK_WEBHOOK_URL`

---

### Task 2: Prepare Empathy Ledger Database (3 minutes)

In **Empathy Ledger V2 Supabase → SQL Editor**, run:

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

-- Mark profiles to sync to JusticeHub
UPDATE public_profiles
SET
  justicehub_enabled = TRUE,
  justicehub_role = 'founder'  -- or 'staff', 'researcher', etc.
WHERE id IN (
  -- Add profile IDs you want to sync
  'uuid-1',
  'uuid-2',
  'uuid-3'
);

-- Verify
SELECT id, display_name, justicehub_enabled, justicehub_role
FROM public_profiles
WHERE justicehub_enabled = TRUE;
```

---

### Task 3: Test Empathy Ledger Sync Workflow (5 minutes)

#### Trigger Via GitHub CLI:
```bash
cd /Users/benknight/Code/JusticeHub
gh workflow run sync-empathy-ledger.yml
```

#### Or Via GitHub Actions UI:
1. Go to https://github.com/[username]/JusticeHub/actions
2. Click **Sync Empathy Ledger Profiles** workflow
3. Click **Run workflow** → **Run workflow**

#### Monitor Progress:
```bash
# Check latest run
gh run list --workflow=sync-empathy-ledger.yml --limit 1

# View logs
gh run view [run-id] --log

# Download artifacts
gh run download [run-id]
```

#### Verify Success:

In **JusticeHub Supabase → SQL Editor**, run:
```sql
-- Check synced profiles
SELECT
  display_name,
  role,
  empathy_ledger_profile_id,
  updated_at
FROM public_profiles
WHERE empathy_ledger_profile_id IS NOT NULL
ORDER BY updated_at DESC;
```

**Expected Result**: Profiles from Empathy Ledger now appear in JusticeHub

---

### Task 4: Test Health Monitoring Workflow (3 minutes)

```bash
# Trigger manually
gh workflow run health-monitoring.yml

# Check logs
gh run view --log
```

**Expected Result**:
- ✅ 10-12 sources reported as "up"
- ✅ 2-4 sources may be "down" (some 404s expected)
- ✅ Health report artifact uploaded
- ✅ Slack alert sent (if configured) for any down sources

---

### Task 5: Test Service Directory Scraping (5 minutes)

```bash
# Test with small batch first
gh workflow run service-directory-scraping.yml \
  -f priority=high \
  -f batch_size=3
```

#### Monitor Progress:
```bash
gh run list --workflow=service-directory-scraping.yml --limit 1
gh run view [run-id] --log
```

#### Verify Services Added:

In **JusticeHub Supabase → SQL Editor**, run:
```sql
SELECT
  name,
  organization_name,
  scrape_confidence_score,
  created_at
FROM services
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result**: 3-5 new services from headspace, Legal Aid, etc.

---

## 🔍 Troubleshooting

### Issue: "Secret not found" error in workflow
**Fix**: Check secret name is exact match (case-sensitive)
```bash
# List all secrets (names only)
gh secret list
```

### Issue: Empathy Ledger sync returns 0 profiles
**Fix**: Verify profiles marked with `justicehub_enabled=true` in Empathy Ledger
```sql
SELECT COUNT(*) FROM public_profiles WHERE justicehub_enabled = TRUE;
```

### Issue: Health check shows all sources down
**Fix**: Network timeout, retry workflow
```bash
gh run rerun [run-id]
```

### Issue: Service scraping fails with API error
**Fix**: Check Firecrawl API key and quota
```bash
# Verify secret exists
gh secret list | grep FIRECRAWL
```

---

## 📊 Post-Deployment Verification

After all workflows run successfully:

### Check Automation Schedule
```bash
# List all workflows
gh workflow list

# Check next scheduled runs
gh run list --workflow=sync-empathy-ledger.yml --limit 1
gh run list --workflow=health-monitoring.yml --limit 1
gh run list --workflow=service-directory-scraping.yml --limit 1
```

### Verify Data Freshness
```sql
-- Latest ALMA interventions
SELECT created_at FROM alma_interventions
ORDER BY created_at DESC LIMIT 1;

-- Latest synced profiles
SELECT updated_at FROM public_profiles
WHERE empathy_ledger_profile_id IS NOT NULL
ORDER BY updated_at DESC LIMIT 1;

-- Latest services
SELECT created_at FROM services
ORDER BY created_at DESC LIMIT 1;

-- Latest media articles
SELECT created_at FROM alma_media_articles
ORDER BY created_at DESC LIMIT 1;
```

---

## 🎉 Success Criteria

After 24 hours of automation:

- ✅ Empathy Ledger sync ran at 4am UTC (no failures)
- ✅ Health monitoring ran 4 times (every 6 hours)
- ✅ Service scraping ran at 3am UTC
- ✅ ALMA ingestion ran at 2am UTC
- ✅ Media sentiment tracking ran at 6am UTC
- ✅ All artifacts uploaded successfully
- ✅ Slack alerts working (if configured)
- ✅ No critical workflow failures

---

## 📈 Next Phase (Week 2)

Once basic automation is stable:

1. **Expand Service Scraping**
   - Add VIC, SA, WA, TAS, ACT Legal Aid offices
   - Add Ask Izzy comprehensive scraping
   - Add state service directories

2. **Research Evidence Automation**
   - Weekly Google Scholar scraping
   - Auto-link evidence to interventions
   - Extract author profiles

3. **Cross-Validation**
   - Monthly duplicate detection
   - Contact verification
   - Data quality checks

4. **Build QLD Intelligence Dashboard**
   - Create `/intelligence/qld` route
   - Show 39 programs vs detention data
   - Visualize sentiment trends

---

## 🚀 Ready to Deploy

All infrastructure is in place. Follow Tasks 1-5 above to deploy automation workflows.

**Estimated Time**: 20 minutes total
**Result**: Fully automated data pipelines running 24/7

---

*Last updated: January 2, 2026*
*Status: READY FOR DEPLOYMENT*

# GitHub Actions Setup for ALMA Automation

**Status**: Ready to Enable 🚀

---

## Required GitHub Secrets

Add these secrets to your GitHub repository to enable automated daily ingestion:

### How to Add Secrets

1. Go to: https://github.com/YOUR_USERNAME/JusticeHub/settings/secrets/actions
2. Click **"New repository secret"**
3. Add each secret below

---

## Secrets to Add

### 1. NEXT_PUBLIC_SUPABASE_URL
**Value**: Get from `.env.local` file
```bash
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

### 2. SUPABASE_SERVICE_ROLE_KEY
**Value**: Get from `.env.local` file
```bash
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

### 3. FIRECRAWL_API_KEY
**Value**: Get from `.env.local` file
```bash
grep FIRECRAWL_API_KEY .env.local
```

### 4. ANTHROPIC_API_KEY
**Value**: Get from `.env.local` file (uses your Max Plan key)
```bash
grep ANTHROPIC_API_KEY .env.local
```

**Quick Setup Command**:
```bash
# Add all secrets at once using GitHub CLI
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)"
gh secret set FIRECRAWL_API_KEY --body "$(grep FIRECRAWL_API_KEY .env.local | cut -d'=' -f2)"
gh secret set ANTHROPIC_API_KEY --body "$(grep ANTHROPIC_API_KEY .env.local | cut -d'=' -f2)"
```

---

## Workflow Configuration

### Automatic Daily Run

**File**: `.github/workflows/alma-ingestion.yml`

**Schedule**: Daily at 2:00 AM UTC (12:00 PM AEST)

**What it does**:
1. Scrapes configured sources (Guardian, ABC, government sites)
2. Extracts interventions using Claude Sonnet 4.5
3. Runs ALMA ethics checks
4. Stores approved data in JusticeHub database
5. Generates intelligence reports

### Manual Trigger

You can also trigger the workflow manually:

1. Go to: https://github.com/YOUR_USERNAME/JusticeHub/actions
2. Click **"ALMA Continuous Ingestion"**
3. Click **"Run workflow"**
4. Select mode (auto/media/government/indigenous/research/legal)
5. Click **"Run workflow"**

---

## Workflow Jobs

### Job 1: Ingestion
- **Runs**: `scripts/alma-scheduler.mjs`
- **Duration**: ~5-10 minutes
- **Sources**:
  - Media: Guardian, ABC (daily)
  - Government: AIC, AIHW, State Departments (weekly)
  - Research: Universities, Think tanks (monthly)
  - Legal: AustLII (weekly)

### Job 2: Pattern Detection
- **Runs**: `scripts/alma-agent-bridge.mjs`
- **Duration**: ~2-3 minutes
- **Generates**:
  - Pattern analysis (Knowledge Extraction, Community Authority, etc.)
  - Signal tracking (Community Controlled interventions)
  - Intelligence report

---

## Cost Estimates

### Daily Automated Run

**Claude Sonnet 4.5 API**:
- 2 media sources × $0.045/source = **~$0.09/day**
- Monthly: **~$2.70/month**

**Firecrawl API**:
- 2 sources × $0.001/scrape = **~$0.002/day**
- Monthly: **~$0.06/month**

**Total Monthly Cost**: **~$2.76/month**

### Weekly Government + Legal Run

- 4 sources × $0.045/source = **~$0.18/week**
- Monthly: **~$0.72/month**

**Combined Total**: **~$3.50/month** for full automation

---

## Testing the Workflow

### Test Before Enabling

**Option 1: Local Test**
```bash
# Test media ingestion
node scripts/alma-continuous-ingestion.mjs media

# Test scheduler (simulates GitHub Actions)
node scripts/alma-scheduler.mjs auto
```

**Option 2: Manual GitHub Trigger**
1. Add secrets to GitHub
2. Manually trigger workflow (see above)
3. Check logs in Actions tab
4. Verify data in Supabase dashboard

### What to Check

- ✅ Workflow runs without errors
- ✅ New interventions appear in Supabase
- ✅ ALMA ethics checks are enforced
- ✅ Intelligence report is generated
- ✅ Logs show detailed output

---

## Monitoring

### GitHub Actions Logs

View detailed logs:
1. Go to: https://github.com/YOUR_USERNAME/JusticeHub/actions
2. Click on the latest workflow run
3. Expand each job to see logs

### Supabase Dashboard

Check ingested data:
1. Go to: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh
2. Click **"Table Editor"**
3. View `alma_interventions`, `alma_evidence`, `alma_outcomes`

### Intelligence Reports

Artifacts are uploaded after each run:
1. Go to workflow run page
2. Scroll to **"Artifacts"** section
3. Download `alma-intelligence-report`
4. Contains pattern detection results

---

## Schedule Configuration

Current schedule in `.github/workflows/alma-ingestion.yml:6`:

```yaml
schedule:
  - cron: '0 2 * * *'  # 2:00 AM UTC = 12:00 PM AEST
```

**To change schedule**:
```yaml
# Every 6 hours
- cron: '0 */6 * * *'

# Twice daily (6am and 6pm UTC)
- cron: '0 6,18 * * *'

# Weekdays only at 2am UTC
- cron: '0 2 * * 1-5'
```

---

## Ingestion Modes

### Auto Mode (Default)
- **Daily**: Media sources (Guardian, ABC)
- **Weekly**: Government + Legal sources
- **Monthly**: Research sources
- **Smart**: Respects `update_frequency` in source config

### Manual Modes
- `media` - News outlets only
- `government` - AIC, AIHW, state departments
- `indigenous` - NIAA, community organizations
- `research` - Universities, think tanks
- `legal` - AustLII court cases

---

## Source Configuration

### Current Sources

**File**: `scripts/alma-continuous-ingestion.mjs`

```javascript
const SOURCES = {
  media: [
    { name: 'The Guardian', url: '...', frequency: 'daily' },
    { name: 'ABC News', url: '...', frequency: 'daily' }
  ],
  government: [
    { name: 'AIC', url: '...', frequency: 'weekly' },
    { name: 'AIHW', url: '...', frequency: 'weekly' },
    { name: 'Qld Youth Justice', url: '...', frequency: 'weekly' }
  ],
  legal: [
    { name: 'AustLII', url: '...', frequency: 'weekly' }
  ]
}
```

**To add more sources**: Edit the `SOURCES` object in the script

---

## Ethics & Governance

### Sacred Boundaries Enforced

The workflow automatically enforces ALMA's sacred boundaries:

- ❌ **NO** individual profiling (blocked by ALMA ethics checks)
- ❌ **NO** community ranking (governance constraints)
- ❌ **NO** extraction without consent (consent ledger tracking)
- ✅ **YES** system-level pattern detection
- ✅ **YES** Community Controlled data (highest priority)
- ✅ **YES** Public Knowledge Commons (properly attributed)

### Consent Tracking

Every ingestion job is tracked:
- **Source URL**: Where data came from
- **Consent Level**: Public Knowledge Commons / Community Controlled
- **Cultural Authority**: Boolean flag for community-led programs
- **Review Status**: Pending → Approved → Published

---

## Troubleshooting

### Workflow Fails: Missing Secrets

**Error**: `Error: Input required and not supplied: ANTHROPIC_API_KEY`

**Fix**: Add all 4 secrets to GitHub (see above)

### Workflow Fails: Permission Denied

**Error**: `Permission denied: scripts/alma-scheduler.mjs`

**Fix**: Workflow includes `chmod +x` command - should auto-fix

### No Data Ingested

**Check**:
1. Are sources recently updated? (skips if last run < frequency)
2. Did Claude extraction return empty results?
3. Were interventions blocked by ethics checks?

**Debug**: Download logs from Actions artifacts

### High API Costs

**Monitor**:
- Anthropic Console: https://console.anthropic.com/settings/billing
- Firecrawl Dashboard: Check usage

**Reduce**:
- Decrease scraping frequency
- Limit number of sources
- Use smaller max_tokens in Claude requests

---

## Next Steps

### 1. Add Secrets (5 minutes)
- Go to GitHub repo settings
- Add all 4 secrets listed above

### 2. Test Manually (10 minutes)
- Trigger workflow manually
- Check logs for errors
- Verify data in Supabase

### 3. Enable Automation
- Once manual test passes, leave it enabled
- Workflow will run daily at 2 AM UTC
- Monitor first few runs

### 4. Optional Enhancements
- Add Slack/Discord notifications (workflow line 86)
- Increase source coverage
- Add email reports
- Create dashboard for intelligence insights

---

## Quick Commands

```bash
# Check workflow syntax
gh workflow view "ALMA Continuous Ingestion"

# Trigger manually
gh workflow run "ALMA Continuous Ingestion" -f mode=media

# View latest run
gh run list --workflow="ALMA Continuous Ingestion" --limit 1

# Download artifacts
gh run download RUN_ID
```

---

**Ready to rock!** 🚀

Add the 4 secrets to GitHub, trigger a manual test run, and watch ALMA automatically build intelligence on youth justice interventions while respecting Indigenous data sovereignty.

**Last Updated**: January 1, 2026
**Status**: Production Ready
**Estimated Cost**: ~$3.50/month for full automation

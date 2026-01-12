# JusticeHub Automation - Quick Reference Card

**Date**: January 2, 2026
**Status**: Ready for deployment (2 secrets needed)

---

## 🚀 Quick Deploy (15 minutes)

### 1. Add GitHub Secrets
```bash
gh secret set EMPATHY_LEDGER_SUPABASE_URL
gh secret set EMPATHY_LEDGER_SUPABASE_ANON_KEY
```

### 2. Prepare Empathy Ledger
```sql
-- In Empathy Ledger Supabase SQL Editor
ALTER TABLE public_profiles
ADD COLUMN IF NOT EXISTS justicehub_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS justicehub_role TEXT;

UPDATE public_profiles
SET justicehub_enabled = TRUE, justicehub_role = 'founder'
WHERE verified = TRUE LIMIT 10;
```

### 3. Test Workflow
```bash
gh workflow run sync-empathy-ledger.yml
gh run list --limit 1
```

---

## 📋 Automation Schedule

```
02:00 UTC - ALMA Ingestion
03:00 UTC - Service Scraping
04:00 UTC - Empathy Ledger Sync ⭐
06:00 UTC - Media Sentiment
Every 6h  - Health Monitoring ⭐
```

---

## 🔧 Common Commands

```bash
# Workflows
gh workflow list
gh workflow run [workflow-name].yml
gh run list --limit 10
gh run view [run-id] --log

# Verification
node scripts/verify-deployment-ready.mjs
node scripts/health-check-sources.mjs

# Secrets
gh secret list
gh secret set [SECRET_NAME]

# Database
# Check synced profiles:
SELECT * FROM public_profiles WHERE empathy_ledger_profile_id IS NOT NULL;

# Check related content:
SELECT * FROM article_related_interventions;
```

---

## 📂 Key Files

### Workflows
- `.github/workflows/sync-empathy-ledger.yml` ⭐
- `.github/workflows/health-monitoring.yml` ⭐
- `.github/workflows/service-directory-scraping.yml` ⭐
- `.github/workflows/alma-ingestion.yml`
- `.github/workflows/daily-media-sentiment.yml`

### Scripts
- `scripts/sync-empathy-ledger.mjs` ⭐
- `scripts/health-check-sources.mjs` ⭐
- `scripts/apply-unification-migration.mjs`
- `scripts/verify-deployment-ready.mjs` ⭐

### Migrations
- `supabase/migrations/20260102_alma_unification_links.sql` ⭐

### Documentation
- `DEPLOY_AUTOMATION_NOW.md` ⭐ (START HERE)
- `AUTOMATION_QUICK_START.md`
- `GITHUB_SECRETS_SETUP.md`
- `DATA_INGESTION_AUTOMATION_PLAN.md`
- `ALMA_UNIFICATION_COMPLETE.md`

---

## ✅ Deployment Checklist

- [ ] Add EMPATHY_LEDGER_SUPABASE_URL secret
- [ ] Add EMPATHY_LEDGER_SUPABASE_ANON_KEY secret
- [ ] Prepare Empathy Ledger database
- [ ] Run verification: `node scripts/verify-deployment-ready.mjs`
- [ ] Test workflow: `gh workflow run sync-empathy-ledger.yml`
- [ ] Verify profiles synced to JusticeHub
- [ ] Monitor for 24 hours

---

## 🎯 Success Criteria

After 24 hours:
- ✅ All 5 workflows run successfully
- ✅ Profiles syncing daily from Empathy Ledger
- ✅ Health checks running every 6 hours
- ✅ Fresh data (ALMA, media, services)
- ✅ No critical failures

---

## 🚨 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Secret not found" | Check exact name with `gh secret list` |
| Sync returns 0 profiles | Mark profiles with `justicehub_enabled=true` |
| Health check all down | Network timeout, re-run workflow |
| API error | Check API key and quota |

---

## 📊 What We Built (Today's Session)

### Database
- 4 new relationship tables
- 2 new foreign key columns
- 3 helper functions
- 6 RLS policies
- Remote migration system (ACT ecosystem-wide)

### Automation
- 2 new workflows (Empathy Ledger sync, Health monitoring)
- 2 new scripts (sync, health check)
- Service scraping workflow (ready to deploy)

### Frontend
- 3 detail page types (programs, evidence, media)
- Universal RelatedContent component
- API route for related content

### Documentation
- 10,000+ words across 5 comprehensive guides
- Deployment checklists
- Troubleshooting guides

---

## 💡 Key Insights

**Before Today**: Isolated data silos, manual profile sync, no monitoring
**After Today**: Interconnected intelligence network, automated pipelines, proactive monitoring

**Impact**:
- 100% automated profile sync
- Seamless navigation between related content
- Proactive data source monitoring
- Fresh data 24/7

---

## 📞 Need Help?

1. **Deployment**: See `DEPLOY_AUTOMATION_NOW.md`
2. **Quick Start**: See `AUTOMATION_QUICK_START.md`
3. **Secrets Setup**: See `GITHUB_SECRETS_SETUP.md`
4. **Architecture**: See `DATA_INGESTION_AUTOMATION_PLAN.md`
5. **Migration**: See `ALMA_UNIFICATION_COMPLETE.md`

---

## 🎉 Next Steps

1. Configure 2 Empathy Ledger secrets
2. Test Empathy Ledger sync workflow
3. Monitor for 24 hours
4. Expand to Phase 2 (service scraping, research automation)

**Ready to go live!** Start with `DEPLOY_AUTOMATION_NOW.md`

---

*Last updated: January 2, 2026*

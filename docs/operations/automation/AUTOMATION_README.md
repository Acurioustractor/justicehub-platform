# JusticeHub Automation System

**Status**: ✅ Architecture Corrected & Ready for Deployment
**Date**: January 2, 2026

---

## 🎯 Quick Start

**New to this project?** Start here:

1. **Read**: [DEPLOY_AUTOMATION_CORRECTED.md](DEPLOY_AUTOMATION_CORRECTED.md) (25-minute deployment)
2. **Understand**: [EMPATHY_LEDGER_INTEGRATION_CORRECTED.md](EMPATHY_LEDGER_INTEGRATION_CORRECTED.md) (architecture)
3. **Deploy**: Follow the deployment guide
4. **Monitor**: Check WhatsApp for notifications!

---

## ✅ What Was Fixed

### Original Issue (From User):

> "Error: Failed to run sql query: ERROR: 42P01: relation 'public_profiles' does not exist"

**Root Cause**: Tried to duplicate Empathy Ledger profiles into JusticeHub `public_profiles` table

### Corrected Approach:

✅ **Use `profile_appearances` pattern** (links only, no duplication)
✅ **Empathy Ledger remains source of truth** (photos, bios, stories, consent)
✅ **WhatsApp notifications** instead of Slack (via Twilio)
✅ **Real-time profile data** fetched when displayed

---

## 📊 Architecture Overview

```
EMPATHY LEDGER (Source of Truth)
├── Profiles, Photos, Bios
├── Stories with Consent
├── Cultural Protocols
└── Privacy Settings

    ↓ Daily Sync (4am UTC)
    ↓ Creates LINKS not COPIES

JUSTICEHUB
├── profile_appearances (links only)
│   ├── empathy_ledger_profile_id → reference
│   ├── appears_on_type → program/service/article
│   ├── role → founder/service_user/etc
│   └── story_excerpt → context
│
└── When displaying content:
    ↓ Fetch profile data in real-time from Empathy Ledger
    ↓ Always fresh, respects consent, preserves cultural protocols
```

---

## 📁 File Structure

### ✅ Corrected Files (USE THESE):

```
scripts/
├── sync-empathy-ledger-profiles.mjs ⭐ Creates profile_appearances (links only)
├── health-check-sources.mjs ⭐ WhatsApp alerts for down sources
└── verify-deployment-ready.mjs (checks secrets)

.github/workflows/
├── sync-empathy-ledger-profiles.yml ⭐ Daily profile sync
├── health-monitoring.yml ⭐ Every 6 hours (WhatsApp)
├── service-directory-scraping.yml (existing)
├── alma-ingestion.yml (existing)
└── daily-media-sentiment.yml (existing)

Documentation/
├── DEPLOY_AUTOMATION_CORRECTED.md ⭐ START HERE
├── EMPATHY_LEDGER_INTEGRATION_CORRECTED.md ⭐ Architecture
├── AUTOMATION_README.md (this file)
└── QUICK_REFERENCE.md
```

### ❌ Old Files (DELETE THESE):

```
scripts/
├── sync-empathy-ledger.mjs (duplicated profiles - WRONG)
└── prepare-empathy-ledger.sql (not needed)

.github/workflows/
└── sync-empathy-ledger.yml (old workflow)
```

---

## 🔐 Required Secrets

### JusticeHub (Already Configured ✅):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `FIRECRAWL_API_KEY`

### Empathy Ledger (NEW ⭐):
- `EMPATHY_LEDGER_SUPABASE_URL` - Project URL
- `EMPATHY_LEDGER_SUPABASE_ANON_KEY` - Read-only anon key

### WhatsApp via Twilio (NEW ⭐):
- `TWILIO_ACCOUNT_SID` - From Twilio Console
- `TWILIO_AUTH_TOKEN` - From Twilio Console
- `TWILIO_WHATSAPP_FROM` - `whatsapp:+14155238886` (sandbox)
- `TWILIO_WHATSAPP_TO` - `whatsapp:+61412345678` (your number)

**Total**: 10 secrets (4 existing, 6 new)

---

## 🚀 Deployment (25 Minutes)

### Step 1: Get Twilio WhatsApp (10 min)

1. Sign up: https://www.twilio.com/try-twilio
2. Enable WhatsApp sandbox
3. Join sandbox from your WhatsApp: Send "join <code>"
4. Get credentials from Console Dashboard

### Step 2: Configure Secrets (5 min)

```bash
# WhatsApp
gh secret set TWILIO_ACCOUNT_SID
gh secret set TWILIO_AUTH_TOKEN
gh secret set TWILIO_WHATSAPP_FROM
gh secret set TWILIO_WHATSAPP_TO

# Empathy Ledger
gh secret set EMPATHY_LEDGER_SUPABASE_URL
gh secret set EMPATHY_LEDGER_SUPABASE_ANON_KEY
```

### Step 3: Test Locally (5 min)

```bash
node scripts/sync-empathy-ledger-profiles.mjs
# Should receive WhatsApp notification!
```

### Step 4: Deploy (2 min)

```bash
gh workflow run sync-empathy-ledger-profiles.yml
gh workflow run health-monitoring.yml
```

### Step 5: Verify (3 min)

- ✅ Check WhatsApp for notifications
- ✅ Verify `profile_appearances` created in database
- ✅ Monitor workflows for 24 hours

**Full Guide**: [DEPLOY_AUTOMATION_CORRECTED.md](DEPLOY_AUTOMATION_CORRECTED.md)

---

## 📅 Automation Schedule

```
Daily:
02:00 UTC  ALMA Ingestion (existing)
03:00 UTC  Service Scraping (existing)
04:00 UTC  Empathy Ledger Sync ⭐ NEW (WhatsApp notification)
06:00 UTC  Media Sentiment (existing)

Every 6 Hours:
Health Monitoring ⭐ NEW (WhatsApp alerts for down sources)
```

---

## 📱 WhatsApp Notifications

### Profile Sync Success:
```
✅ JusticeHub Profile Sync Complete

Stories: 47
Created: 12
Updated: 8
Errors: 0
```

### Health Check Alert:
```
🚨 JusticeHub Data Source Alert

3 source(s) are currently down (1 high priority):

🔴 Legal Aid Queensland
   services
   Error: HTTP 503
```

---

## 🧪 Testing

### Test Profile Sync:
```bash
node scripts/sync-empathy-ledger-profiles.mjs
```

**Expected**:
- ✅ Fetches justice-related stories from Empathy Ledger
- ✅ Creates `profile_appearances` for stories linked to services
- ✅ Sends WhatsApp notification
- ✅ No profile data duplication

### Test Health Check:
```bash
node scripts/health-check-sources.mjs
```

**Expected**:
- ✅ Checks 15+ data sources
- ✅ Sends WhatsApp alert if sources down
- ✅ Saves health report JSON

### Verify Database:
```sql
-- Check profile appearances
SELECT
  pa.empathy_ledger_profile_id,
  pa.appears_on_type,
  pa.role,
  s.name as service_name
FROM profile_appearances pa
LEFT JOIN services s ON pa.appears_on_id = s.id
ORDER BY pa.created_at DESC
LIMIT 20;
```

---

## ✅ Benefits of Corrected Architecture

| Feature | Old (Duplicate) ❌ | New (Link) ✅ |
|---------|-------------------|---------------|
| **Data Freshness** | Stale (24h old) | Real-time |
| **Photo Hosting** | Duplicate files | Empathy Ledger infrastructure |
| **Consent Changes** | Delayed | Immediate |
| **Cultural Protocols** | Could be lost | Always preserved |
| **Storage** | ~50KB per profile | ~1KB per link |
| **Sync Conflicts** | Possible | None |
| **Source of Truth** | Split | Single (Empathy Ledger) |

---

## 🚨 Troubleshooting

### "No WhatsApp notification received"
- ✅ Join Twilio WhatsApp sandbox: Send "join <code>"
- ✅ Verify secrets: `gh secret list`
- ✅ Check Twilio logs: Console → Monitor → Logs

### "Sync returns 0 stories"
- ✅ Verify Empathy Ledger has `is_public=true` stories
- ✅ Check stories have justice-related themes
- ✅ Check stories linked to services (`service_id`)

### "Health check shows all sources down"
- ✅ Test URLs manually: `curl -I <url>`
- ✅ Re-run workflow: `gh run rerun [run-id]`

**Full Guide**: [DEPLOY_AUTOMATION_CORRECTED.md](DEPLOY_AUTOMATION_CORRECTED.md#troubleshooting)

---

## 📚 Documentation Index

### Deployment:
- **[DEPLOY_AUTOMATION_CORRECTED.md](DEPLOY_AUTOMATION_CORRECTED.md)** ⭐ START HERE (25-minute guide)
- **[AUTOMATION_QUICK_START.md](AUTOMATION_QUICK_START.md)** - Original 30-minute guide (outdated)

### Architecture:
- **[EMPATHY_LEDGER_INTEGRATION_CORRECTED.md](EMPATHY_LEDGER_INTEGRATION_CORRECTED.md)** ⭐ Why link-based is better
- **[DATA_INGESTION_AUTOMATION_PLAN.md](DATA_INGESTION_AUTOMATION_PLAN.md)** - Complete architecture

### Reference:
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Commands cheat sheet
- **[GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)** - Secrets reference (needs WhatsApp update)

### Code:
- **[src/lib/integrations/profile-linking.ts](src/lib/integrations/profile-linking.ts)** - Integration library
- **[src/lib/supabase/empathy-ledger.ts](src/lib/supabase/empathy-ledger.ts)** - Empathy Ledger client

---

## 💡 Key Insights

### Why This Approach is Better:

1. **Empathy Ledger Already Has Infrastructure**
   - Photo hosting, CDN, image optimization
   - Consent management, privacy controls
   - Cultural protocol workflows
   - Story management

2. **JusticeHub Adds Context, Not Duplication**
   - Links profiles to programs/services/articles
   - Adds role context (founder, service_user, etc.)
   - Provides story excerpts for context
   - Marks featured appearances

3. **Real-Time Data = Respect for Consent**
   - Privacy changes apply immediately
   - No stale profile data
   - Cultural warnings preserved
   - Elder approvals tracked

4. **WhatsApp > Slack for This Use Case**
   - Instant mobile notifications
   - No need for Slack workspace
   - Twilio free tier sufficient
   - Works globally

---

## 🎯 Success Criteria

After 24 hours:

- ✅ Profile sync runs daily at 4am UTC
- ✅ Health checks run every 6 hours
- ✅ WhatsApp notifications received
- ✅ `profile_appearances` growing (new stories)
- ✅ No profile data duplication
- ✅ Real-time profile data from Empathy Ledger

---

## 📞 Support

### Issues?
1. Check troubleshooting in deployment guide
2. Review workflow logs: `gh run view --log`
3. Verify secrets: `gh secret list`
4. Test locally first: `node scripts/sync-empathy-ledger-profiles.mjs`

### Need Help?
- **Architecture**: See [EMPATHY_LEDGER_INTEGRATION_CORRECTED.md](EMPATHY_LEDGER_INTEGRATION_CORRECTED.md)
- **Deployment**: See [DEPLOY_AUTOMATION_CORRECTED.md](DEPLOY_AUTOMATION_CORRECTED.md)
- **Code**: Check [src/lib/integrations/profile-linking.ts](src/lib/integrations/profile-linking.ts)

---

## 🎉 Ready to Deploy!

**Time**: 25 minutes
**Cost**: ~$5-15/month (Twilio WhatsApp)
**Benefit**: Automated, consent-controlled, real-time profile linking

**Start**: [DEPLOY_AUTOMATION_CORRECTED.md](DEPLOY_AUTOMATION_CORRECTED.md)

---

*Last updated: January 2, 2026*
*Architecture: Link-based, real-time, WhatsApp-enabled*
*Status: READY FOR DEPLOYMENT ✅*

# 🚀 Deploy JusticeHub Automation - FINAL Guide

**Date**: January 2, 2026
**Status**: ✅ Ready to Deploy (Telegram notifications, corrected architecture)

---

## ✅ What's Ready

1. **Empathy Ledger Integration**: Uses `profile_appearances` (links only, no duplication)
2. **Telegram Notifications**: Simple, free, instant setup
3. **Automation Scripts**: Profile sync + health monitoring
4. **GitHub Workflows**: All configured and ready

---

## 🎯 Quick Deploy (20 Minutes Total)

### Step 1: Create Telegram Bot (5 min)

**Full guide**: See [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)

**Quick version**:
1. Open Telegram, search `@BotFather`
2. Send `/newbot`
3. Name it: `JusticeHub Alerts`
4. Copy the token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Send your bot a message
6. Get chat ID: Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
7. Find `"chat":{"id":123456789}`

✅ **You now have**: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`

---

### Step 2: Get Empathy Ledger Credentials (2 min)

1. Go to: **Empathy Ledger V2 Supabase → Project Settings → API**
2. Copy:
   - **Project URL**: `https://[project-id].supabase.co`
   - **anon/public key**: `eyJ...` (read-only key)

✅ **You now have**: `EMPATHY_LEDGER_SUPABASE_URL` and `EMPATHY_LEDGER_SUPABASE_ANON_KEY`

---

### Step 3: Configure GitHub Secrets (3 min)

```bash
cd /Users/benknight/Code/JusticeHub

# Telegram (2 secrets)
gh secret set TELEGRAM_BOT_TOKEN
# Paste: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

gh secret set TELEGRAM_CHAT_ID
# Paste: 123456789

# Empathy Ledger (2 secrets)
gh secret set EMPATHY_LEDGER_SUPABASE_URL
# Paste: https://[project-id].supabase.co

gh secret set EMPATHY_LEDGER_SUPABASE_ANON_KEY
# Paste: eyJ...

# Verify all secrets
gh secret list
```

**Expected output**:
```
ANTHROPIC_API_KEY                 ✅ (existing)
EMPATHY_LEDGER_SUPABASE_ANON_KEY  ⭐ NEW
EMPATHY_LEDGER_SUPABASE_URL       ⭐ NEW
FIRECRAWL_API_KEY                 ✅ (existing)
NEXT_PUBLIC_SUPABASE_URL          ✅ (existing)
SUPABASE_SERVICE_ROLE_KEY         ✅ (existing)
TELEGRAM_BOT_TOKEN                ⭐ NEW
TELEGRAM_CHAT_ID                  ⭐ NEW
```

---

### Step 4: Test Locally (5 min)

Add to `.env.local`:
```bash
cat >> .env.local << EOF
EMPATHY_LEDGER_SUPABASE_URL=https://[project-id].supabase.co
EMPATHY_LEDGER_SUPABASE_ANON_KEY=eyJ...
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
EOF
```

Test profile sync:
```bash
node scripts/sync-empathy-ledger-profiles.mjs
```

**Expected**:
- ✅ Fetches justice stories from Empathy Ledger
- ✅ Creates `profile_appearances` in database
- ✅ Sends Telegram notification
- ✅ No errors

**Check Telegram**: You should receive a message!

Test health check:
```bash
node scripts/health-check-sources.mjs
```

**Expected**:
- ✅ Checks 15 data sources
- ✅ Sends Telegram alert if sources down
- ✅ Saves health report JSON

---

### Step 5: Deploy Workflows (2 min)

```bash
# Trigger profile sync
gh workflow run sync-empathy-ledger-profiles.yml

# Trigger health check
gh workflow run health-monitoring.yml

# Check status
gh run list --limit 5
```

**Expected**:
- ✅ Both workflows complete successfully
- ✅ Telegram notifications received
- ✅ Artifacts uploaded

---

### Step 6: Verify Database (3 min)

```sql
-- Check profile appearances created
SELECT
  pa.empathy_ledger_profile_id,
  pa.appears_on_type,
  pa.role,
  pa.story_excerpt,
  s.name as service_name,
  pa.created_at
FROM profile_appearances pa
LEFT JOIN services s ON pa.appears_on_id = s.id
WHERE pa.appears_on_type = 'service'
ORDER BY pa.created_at DESC
LIMIT 20;
```

**Expected**: List of profile appearances with service names

---

## 📅 Automation Schedule

Once deployed, workflows run automatically:

```
Daily:
02:00 UTC  ALMA Ingestion (existing)
03:00 UTC  Service Scraping (existing)
04:00 UTC  Empathy Ledger Sync ⭐ NEW (Telegram notification)
06:00 UTC  Media Sentiment (existing)

Every 6 Hours:
Health Monitoring ⭐ NEW (Telegram alerts)
```

---

## 📱 Telegram Notification Examples

### Profile Sync Success:
```
✅ JusticeHub Profile Sync Complete

Stories: 47
Created: 12
Updated: 8
Errors: 0
```

### Profile Sync Failure:
```
❌ JusticeHub Profile Sync Failed

Error: Failed to fetch stories: Network timeout
```

### Health Check Alert:
```
🚨 JusticeHub Data Source Alert

3 source(s) are currently down (1 high priority):

🔴 Legal Aid Queensland
   services
   Error: `HTTP 503`

🟡 NITV News
   media
   Error: `Timeout`
```

---

## ✅ Success Criteria

After 24 hours:

### Profile Sync:
- ✅ Workflow runs at 4am UTC (no failures)
- ✅ Profile appearances created (not duplicate profiles!)
- ✅ Telegram notification received
- ✅ Real-time profile data from Empathy Ledger

### Health Monitoring:
- ✅ Runs every 6 hours
- ✅ Health reports uploaded as artifacts
- ✅ Telegram alerts for down sources
- ✅ High-priority sources monitored

### Database Check:
```sql
-- Latest sync
SELECT MAX(created_at) FROM profile_appearances;
-- Should be recent

-- Count of appearances
SELECT COUNT(*) FROM profile_appearances;
-- Should be growing

-- Featured profiles
SELECT COUNT(*) FROM profile_appearances WHERE featured = true;
```

---

## 🚨 Troubleshooting

### No Telegram Message Received

**Check**:
1. Did you send a message to your bot first?
2. Is the chat ID correct? (visit `/getUpdates` URL)
3. Is the bot token correct? (check BotFather)
4. Are secrets configured? (`gh secret list | grep TELEGRAM`)

**Fix**:
```bash
# Re-check chat ID
curl https://api.telegram.org/bot<TOKEN>/getUpdates

# Update secrets
gh secret set TELEGRAM_BOT_TOKEN
gh secret set TELEGRAM_CHAT_ID
```

### Sync Returns 0 Stories

**Check**:
1. Does Empathy Ledger have `is_public=true` stories?
2. Do stories have justice-related themes?
3. Are stories linked to services? (`service_id` field)

**Fix**:
```sql
-- In Empathy Ledger database
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_public = true) as public,
  COUNT(*) FILTER (WHERE service_id IS NOT NULL) as linked
FROM stories;
```

### Health Check Shows All Down

**Check**:
1. Network connectivity
2. Are URLs actually up? (test manually)

**Fix**:
```bash
# Test a source manually
curl -I https://www.aihw.gov.au/reports/youth-justice

# Re-run workflow
gh run rerun [run-id]
```

---

## 💰 Cost Estimates

**Telegram**: FREE forever ✨
**Empathy Ledger**: FREE (read-only access)
**Other services** (unchanged):
- Firecrawl: ~$1-5/day
- Anthropic: ~$2-10/day
- Supabase: Free tier
- GitHub Actions: Free (public repos)

**Total Monthly**: ~$90-450 (mostly AI/scraping, **notifications are free!**)

---

## 📚 Documentation

**Setup**:
- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) ⭐ Telegram bot setup guide

**Architecture**:
- [EMPATHY_LEDGER_INTEGRATION_CORRECTED.md](EMPATHY_LEDGER_INTEGRATION_CORRECTED.md) - Why link-based is better
- [AUTOMATION_README.md](AUTOMATION_README.md) - Complete overview

**Reference**:
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands cheat sheet

---

## ✅ Deployment Checklist

- [ ] Create Telegram bot via BotFather
- [ ] Get bot token
- [ ] Send message to bot
- [ ] Get chat ID from `/getUpdates`
- [ ] Get Empathy Ledger Supabase URL
- [ ] Get Empathy Ledger anon key
- [ ] Configure `TELEGRAM_BOT_TOKEN` secret
- [ ] Configure `TELEGRAM_CHAT_ID` secret
- [ ] Configure `EMPATHY_LEDGER_SUPABASE_URL` secret
- [ ] Configure `EMPATHY_LEDGER_SUPABASE_ANON_KEY` secret
- [ ] Test locally: profile sync
- [ ] Test locally: health check
- [ ] Verify Telegram notifications received
- [ ] Deploy workflows via GitHub
- [ ] Verify profile appearances created
- [ ] Monitor for 24 hours

---

## 🎉 Ready to Deploy!

**Total Time**: 20 minutes
**Cost**: FREE (Telegram notifications)
**Complexity**: Simple (just 4 new secrets)

**Result**:
- ✅ Automated profile linking (no duplication!)
- ✅ Real-time data from Empathy Ledger
- ✅ Free Telegram notifications
- ✅ Proper consent & cultural protocols

**Start with Step 1** above!

---

*Last updated: January 2, 2026*
*Notifications: Telegram Bot API (free)*
*Architecture: Link-based, real-time, consent-controlled*
*Status: READY FOR DEPLOYMENT ✅*

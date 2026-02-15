# Telegram Bot Setup - 5 Minutes

**Why Telegram?**
- ✅ Completely FREE (no quotas, no limits)
- ✅ No phone verification needed for bot
- ✅ Dead simple API (just HTTP POST)
- ✅ Instant setup
- ✅ Production-ready immediately (no sandbox)

---

## 🤖 Step 1: Create Telegram Bot (2 minutes)

1. **Open Telegram** (on phone or desktop)
2. **Search for**: `@BotFather`
3. **Send**: `/newbot`
4. **Choose a name**: `JusticeHub Alerts` (or any name you want)
5. **Choose a username**: `justicehub_alerts_bot` (must end with `_bot`)
6. **Copy the token**: You'll get something like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
   ⚠️ **Keep this secret!** This is your `TELEGRAM_BOT_TOKEN`

---

## 💬 Step 2: Get Your Chat ID (2 minutes)

1. **Find your bot** in Telegram (search for the username you just created)
2. **Send it a message**: Type anything, like "Hello"
3. **Get your chat ID**:

   **Option A: Via Browser**
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Replace `<YOUR_BOT_TOKEN>` with your actual token
   - Look for `"chat":{"id":123456789}`
   - Your chat ID is the number: `123456789`

   **Option B: Via Terminal**
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   - Find `"chat":{"id":123456789}` in the response

---

## 🔐 Step 3: Configure GitHub Secrets (1 minute)

```bash
cd /Users/benknight/Code/JusticeHub

# Set bot token
gh secret set TELEGRAM_BOT_TOKEN
# When prompted, paste: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Set chat ID
gh secret set TELEGRAM_CHAT_ID
# When prompted, paste: 123456789

# Verify
gh secret list | grep TELEGRAM
```

**Expected output**:
```
TELEGRAM_BOT_TOKEN    Updated 2026-01-02
TELEGRAM_CHAT_ID      Updated 2026-01-02
```

---

## ✅ Step 4: Test Locally (1 minute)

Add to `.env.local`:
```bash
cat >> .env.local << EOF
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
EOF
```

Test health check:
```bash
node scripts/health-check-sources.mjs
```

**Expected**: You should receive a Telegram message if any sources are down!

Test profile sync:
```bash
node scripts/sync-empathy-ledger-profiles.mjs
```

**Expected**: You should receive a Telegram message with sync results!

---

## 📱 What the Messages Look Like

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
   Error: `HTTP 503`

🟡 NITV News
   media
   Error: `Timeout`
```

---

## 🎯 Deploy to GitHub Actions

Once local testing works:

```bash
# Deploy workflows
gh workflow run sync-empathy-ledger-profiles.yml
gh workflow run health-monitoring.yml

# Check logs
gh run list --limit 3
```

---

## 🔧 Troubleshooting

### "No updates found" when getting chat ID

**Issue**: Bot didn't receive your message

**Fix**:
1. Make sure you sent a message to YOUR bot (not BotFather)
2. Wait 5 seconds and try the `/getUpdates` URL again
3. The message must be recent (last 24 hours)

### "Unauthorized" error

**Issue**: Bot token is wrong

**Fix**:
1. Go back to BotFather
2. Send `/mybots`
3. Select your bot → API Token
4. Copy the token again
5. Update the secret: `gh secret set TELEGRAM_BOT_TOKEN`

### "Chat not found" error

**Issue**: Chat ID is wrong

**Fix**:
1. Send another message to your bot
2. Visit `/getUpdates` URL again
3. Look for the `"id"` field under `"chat"`
4. Use that number (it might be negative like `-123456789`)

---

## 🎁 Bonus: Send to a Group

Want alerts in a Telegram group instead?

1. **Create a group** in Telegram
2. **Add your bot** to the group
3. **Send a message** in the group
4. **Get the group chat ID**:
   - Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Look for `"chat":{"id":-1001234567890,"type":"supergroup"}`
   - The group ID starts with a minus sign: `-1001234567890`
5. **Update the secret**:
   ```bash
   gh secret set TELEGRAM_CHAT_ID
   # Enter: -1001234567890
   ```

Now all team members in the group will get alerts!

---

## 📊 Required Secrets Summary

For JusticeHub automation, you now need:

**JusticeHub** (already configured):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `ANTHROPIC_API_KEY`
- ✅ `FIRECRAWL_API_KEY`

**Empathy Ledger** (need to add):
- ⭐ `EMPATHY_LEDGER_SUPABASE_URL`
- ⭐ `EMPATHY_LEDGER_SUPABASE_ANON_KEY`

**Telegram** (just configured):
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `TELEGRAM_CHAT_ID`

**Total**: 8 secrets (4 existing, 4 new)

---

## 🎉 That's It!

**Setup time**: ~5 minutes
**Cost**: FREE forever
**Complexity**: Dead simple

Way easier than WhatsApp/Twilio! 🎊

---

*Last updated: January 2, 2026*

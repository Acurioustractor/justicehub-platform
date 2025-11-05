# 🔐 Environment Variables - Quick Reference

## 📍 Your API Keys Are Safe!

All real API keys are backed up in:
```
~/.justicehub-secure-backup/
```

## 🚀 Quick Commands

### Backup Your Keys (Before Changes)
```bash
./scripts/backup-env.sh
```

### Restore Lost Keys
```bash
# List backups (newest first)
ls -lt ~/.justicehub-secure-backup/

# Restore specific backup
cp ~/.justicehub-secure-backup/.env.local.backup-YYYYMMDD-HHMMSS .env.local
```

### View Current Backups
```bash
ls -lh ~/.justicehub-secure-backup/
```

## 📁 File Structure

| File | Usage | In Git? |
|------|-------|---------|
| `.env.local` | **USE THIS** - Your real keys | ❌ Never |
| `.env` | Shared defaults | ❌ Never |
| `.env.example` | Template for others | ✅ Yes |
| `.env.development` | Dev defaults | ✅ Yes |
| `.env.production` | Prod template | ✅ Yes |

## 🎯 Where to Set Variables

### Local Development
Edit `.env.local` - it overrides everything else

### Production (Vercel)
Use Vercel Dashboard → Settings → Environment Variables

**Never commit production keys to git!**

## 🆘 Emergency: Lost Keys

1. **Check backups:**
   ```bash
   ls ~/.justicehub-secure-backup/
   ```

2. **Restore latest:**
   ```bash
   cp ~/.justicehub-secure-backup/.env.local.backup-* .env.local
   ```

3. **If no backups exist**, get fresh keys from:
   - Supabase: https://supabase.com/dashboard
   - Auth0: https://manage.auth0.com
   - OpenAI: https://platform.openai.com/api-keys
   - Notion: https://www.notion.so/my-integrations

## ✅ Security Checklist

- [ ] `.env.local` exists and has your real keys
- [ ] Backup created (`./scripts/backup-env.sh`)
- [ ] `.env.local` is in `.gitignore`
- [ ] Production keys set in Vercel (not in git)
- [ ] No keys committed to git history

## 📚 Full Documentation

See [`docs/guides/ENV_MANAGEMENT.md`](docs/guides/ENV_MANAGEMENT.md) for complete guide.

---

**Key Principle:** Keep secrets in `.env.local`, back them up regularly, never commit them!

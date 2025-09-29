# Environment Variable Management Guide

## 🔐 Security Strategy

JusticeHub uses a **layered approach** to environment variable management that keeps your secrets safe while maintaining easy access.

## 📁 File Structure

```
.env                    # ❌ GITIGNORED - Never commit
.env.local              # ❌ GITIGNORED - Never commit (Next.js priority)
.env.development        # ⚠️  Safe defaults for development
.env.production         # ⚠️  Template with placeholders
.env.example            # ✅ Public template
.env.local.example      # ✅ Public template with comments
```

## 🎯 Priority Order (Next.js)

Next.js loads environment files in this order (later files override earlier):

1. `.env` (all environments)
2. `.env.local` (all environments, gitignored)
3. `.env.development`, `.env.production` (specific environment)
4. `.env.development.local`, `.env.production.local` (gitignored)

**For local development**: Use `.env.local` - it has highest priority and is never committed.

## 🔒 Secure Backup System

### Automatic Backup Location
All real API keys are backed up to:
```
~/.justicehub-secure-backup/
```

This directory is:
- ✅ Outside the git repository
- ✅ In your home directory (accessible across projects)
- ✅ Timestamped for version history
- ✅ Protected by OS-level permissions

### Creating Backups

**Manual backup:**
```bash
cp .env.local ~/.justicehub-secure-backup/.env.local.backup-$(date +%Y%m%d-%H%M%S)
```

**Restore from backup:**
```bash
ls -lt ~/.justicehub-secure-backup/  # List backups (newest first)
cp ~/.justicehub-secure-backup/.env.local.backup-YYYYMMDD-HHMMSS .env.local
```

### Automated Backup Script

Create `scripts/backup-env.sh`:
```bash
#!/bin/bash
BACKUP_DIR=~/.justicehub-secure-backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

if [ -f .env.local ]; then
  cp .env.local $BACKUP_DIR/.env.local.backup-$TIMESTAMP
  echo "✅ Backed up .env.local to $BACKUP_DIR"
fi

if [ -f .env ]; then
  cp .env $BACKUP_DIR/.env.backup-$TIMESTAMP
  echo "✅ Backed up .env to $BACKUP_DIR"
fi

# Keep only last 10 backups
ls -t $BACKUP_DIR/.env.local.backup-* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
ls -t $BACKUP_DIR/.env.backup-* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null

echo "✅ Backup complete! Location: $BACKUP_DIR"
```

**Make it executable:**
```bash
chmod +x scripts/backup-env.sh
```

**Run before major changes:**
```bash
./scripts/backup-env.sh
```

## 🚀 Production Deployment (Vercel)

**Never commit production keys to git!** Instead, use Vercel's environment variable system:

### Via Vercel Dashboard
1. Go to your project → Settings → Environment Variables
2. Add each variable with the appropriate scope:
   - Production
   - Preview
   - Development

### Via Vercel CLI
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production
# ... add all required variables
```

### Required Production Variables
```env
# Core App
NODE_ENV=production
APP_URL=https://your-domain.com
API_URL=https://your-domain.com/api

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Auth0 (if using)
AUTH0_SECRET=xxxxx
AUTH0_BASE_URL=https://your-domain.com
AUTH0_ISSUER_BASE_URL=https://xxx.auth0.com
AUTH0_CLIENT_ID=xxxxx
AUTH0_CLIENT_SECRET=xxxxx

# AI Services (optional)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Notion (if using)
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
```

## 🛡️ Security Best Practices

### DO ✅
- Keep secrets in `.env.local` (never committed)
- Use backup system before making changes
- Use Vercel dashboard for production secrets
- Rotate API keys regularly
- Use separate keys for dev/staging/production

### DON'T ❌
- Never commit `.env` or `.env.local` files
- Never share `.env.local` via Slack/email
- Never hardcode secrets in source code
- Never use production keys in development
- Never commit real API keys to documentation

## 🔄 Rotating API Keys

When rotating keys:

1. **Backup current environment:**
   ```bash
   ./scripts/backup-env.sh
   ```

2. **Generate new keys** from service providers

3. **Update `.env.local`** with new keys

4. **Test locally:**
   ```bash
   npm run dev
   ```

5. **Update Vercel** (production):
   ```bash
   vercel env rm SUPABASE_SERVICE_KEY production
   vercel env add SUPABASE_SERVICE_KEY production
   ```

6. **Trigger new deployment:**
   ```bash
   git commit --allow-empty -m "chore: rotate API keys"
   git push origin main
   ```

## 🆘 Emergency Recovery

**Lost your .env.local?**

1. Check backups:
   ```bash
   ls -lt ~/.justicehub-secure-backup/
   ```

2. Restore latest:
   ```bash
   cp ~/.justicehub-secure-backup/.env.local.backup-* .env.local
   ```

3. If no backups exist, copy from `.env.local.example` and refill values from:
   - Supabase Dashboard → Settings → API
   - Auth0 Dashboard → Applications
   - OpenAI Dashboard → API Keys
   - Notion Dashboard → Integrations

## 📋 Environment Variable Checklist

Before deploying:

- [ ] `.env.local` has all required variables
- [ ] Backup exists in `~/.justicehub-secure-backup/`
- [ ] `.gitignore` includes `.env` and `.env.local`
- [ ] Production variables set in Vercel dashboard
- [ ] No secrets committed to git history
- [ ] API keys are environment-specific (dev/prod separate)

## 🔍 Verifying Setup

**Check gitignore protection:**
```bash
git status --ignored | grep .env
```

Should show:
```
.env
.env.local
```

**Verify backup system:**
```bash
ls -la ~/.justicehub-secure-backup/
```

**Check loaded environment (local dev):**
```bash
npm run dev
# Visit http://localhost:3000/api/health
```

---

**Questions?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for full setup instructions.

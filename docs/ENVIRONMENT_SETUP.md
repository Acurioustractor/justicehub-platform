# 🔒 Environment Setup & Security Guide

**Complete guide to securely configuring your Youth Justice Service Finder instance.**

## 🚨 **IMMEDIATE SECURITY ACTIONS**

### 1. Secure Your API Keys
```bash
# If you accidentally exposed API keys, immediately:
# 1. Revoke the exposed key at https://firecrawl.dev
# 2. Generate a new API key
# 3. Update your production environment
# 4. Check git history for any committed secrets
```

### 2. Verify .gitignore Protection
```bash
# Check that .env files are ignored
git status
# Should NOT show any .env files

# If .env files appear, immediately:
git rm --cached .env .env.local .env.production
git commit -m "Remove accidentally committed .env files"
```

## 📋 **Environment Files Overview**

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env.example` | Template with dummy values | ✅ YES |
| `.env` | Local development secrets | ❌ NEVER |
| `.env.local` | Local overrides | ❌ NEVER |
| `.env.production` | Production secrets | ❌ NEVER |
| `frontend/.env.example` | Frontend template | ✅ YES |
| `frontend/.env` | Frontend config | ❌ NEVER |

## 🔧 **Setup Steps**

### Step 1: Copy Templates
```bash
# Backend environment
cp .env.example .env

# Frontend environment  
cd frontend
cp .env.example .env
cd ..
```

### Step 2: Generate Secure Secrets
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate encryption key (32 characters)
openssl rand -hex 16
```

### Step 3: Configure Required Variables

#### 🔑 **Backend (.env)**
```bash
# REQUIRED: Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# REQUIRED: Security  
JWT_SECRET=your_generated_jwt_secret_here

# REQUIRED: API Keys
FIRECRAWL_API_KEY=fc-your_actual_api_key_here
```

#### 🌐 **Frontend (frontend/.env)**
```bash
# REQUIRED: API endpoint
VITE_API_URL=https://your-api-deployment.railway.app
```

## 🏗️ **Deployment Environment Setup**

### Railway Deployment
```bash
# Set environment variables in Railway dashboard:
railway login
railway env set DATABASE_URL="postgresql://..."
railway env set JWT_SECRET="your_secure_secret"
railway env set FIRECRAWL_API_KEY="fc-your_key"
```

### Vercel Deployment
```bash
# Set environment variables in Vercel dashboard:
vercel env add DATABASE_URL
vercel env add JWT_SECRET  
vercel env add FIRECRAWL_API_KEY
```

### Docker Deployment
```bash
# Use environment files with Docker
docker-compose --env-file .env.production up -d
```

## 🛡️ **Security Best Practices**

### ✅ **DO**
- Use strong, unique secrets for each environment
- Rotate API keys regularly (quarterly)
- Use environment-specific databases
- Enable SSL/TLS in production
- Use least-privilege database users
- Monitor for exposed secrets in logs

### ❌ **DON'T**
- Commit .env files to version control
- Share API keys in messages/emails
- Use production secrets in development
- Log sensitive environment variables
- Use default/weak passwords
- Expose admin endpoints publicly

## 🔍 **Environment Variable Reference**

### **Required Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your_super_secure_secret_here` |
| `FIRECRAWL_API_KEY` | Firecrawl API key | `fc-abc123...` |

### **Optional Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `ELASTICSEARCH_URL` | Elasticsearch endpoint | Falls back to PostgreSQL |
| `REDIS_URL` | Redis cache endpoint | No caching |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `API_RATE_LIMIT` | Requests per minute | `50` |

### **Frontend Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |
| `VITE_APP_TITLE` | Application title | `Youth Justice Finder` |

## 🔄 **API Key Management**

### Firecrawl API Key
1. **Get Key**: Sign up at [firecrawl.dev](https://firecrawl.dev)
2. **Usage**: Monitor usage in dashboard
3. **Limits**: Free tier has monthly limits
4. **Rotation**: Generate new key quarterly

### Database Credentials
1. **Development**: Use local PostgreSQL
2. **Production**: Use managed database (Railway, RDS)
3. **Security**: Enable SSL, use strong passwords
4. **Backup**: Regular automated backups

## 🚨 **Emergency Procedures**

### If API Key is Exposed
```bash
# 1. Immediately revoke at provider dashboard
# 2. Generate new API key
# 3. Update all deployments
# 4. Rotate related secrets (JWT, etc.)
# 5. Check logs for unauthorized usage
```

### If Database is Compromised
```bash
# 1. Change database password
# 2. Rotate JWT secrets (invalidates all sessions)
# 3. Check for data integrity
# 4. Review access logs
# 5. Consider database migration
```

## ✅ **Security Checklist**

- [ ] All .env files are in .gitignore
- [ ] No secrets in git history
- [ ] Strong JWT secret generated
- [ ] API keys are valid and monitored
- [ ] Production uses HTTPS
- [ ] Database uses SSL
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Incident response plan ready

## 📞 **Need Help?**

- **Documentation**: See `/docs` directory
- **Security Issues**: Create private GitHub issue
- **API Problems**: Check provider status pages
- **Database Issues**: Review connection logs

---

*🔒 Security is critical for protecting user data and maintaining service availability. Follow this guide carefully and review regularly.*
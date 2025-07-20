# 🔒 Environment Setup - Best Practices Guide

**Complete audit-based guide for secure environment configuration**

## 📊 **Current Analysis of Your Setup**

### ✅ **What You Have Working:**
- **Local Development**: `.env` and `.env.local` with working Firecrawl API key
- **Production Template**: `.env.production` with placeholders 
- **Frontend Config**: `frontend/.env` pointing to Railway deployment
- **Database**: Local PostgreSQL setup working

### 🎯 **APIs Actually Needed (From Code Audit):**

#### **CRITICAL (Must Have):**
1. **PostgreSQL Database** - Core data storage
2. **Firecrawl API** - Web scraping (`fc-ab5f175f47e545afb3151e9c3fd94ab8`)
3. **JWT Secret** - Security (currently missing from your setup!)

#### **Optional (Performance Enhancement):**
1. **Elasticsearch** - Better search (falls back to PostgreSQL)
2. **Redis** - Caching (falls back to memory cache)
3. **Temporal** - Workflow automation (manual processes work)

#### **Public APIs (No Keys Needed):**
- All government open data portals
- Ask Izzy directory
- Service directories

## 🏗️ **Best Practice Environment Structure**

### **Recommended File Structure:**
```
.env.local          # Your personal dev overrides (KEEP PRIVATE)
.env.development    # Shared dev defaults (can commit)
.env.staging        # Staging environment (KEEP PRIVATE)  
.env.production     # Production secrets (KEEP PRIVATE)
.env.example        # Template for sharing (COMMIT THIS)
```

### **Security Layers:**
1. **Local Development** - `.env.local` (your personal secrets)
2. **Team Development** - `.env.development` (shared, safe defaults)
3. **Staging** - `.env.staging` (staging secrets)
4. **Production** - `.env.production` (production secrets)

## 🔧 **Safe Migration Plan (No Data Loss)**

### Step 1: Backup Everything
```bash
# Create timestamped backup
mkdir -p ~/env-backups/youth-justice-$(date +%Y%m%d-%H%M)
cp .env ~/env-backups/youth-justice-$(date +%Y%m%d-%H%M)/
cp .env.local ~/env-backups/youth-justice-$(date +%Y%m%d-%H%M)/
cp .env.production ~/env-backups/youth-justice-$(date +%Y%m%d-%H%M)/
cp frontend/.env ~/env-backups/youth-justice-$(date +%Y%m%d-%H%M)/frontend.env
echo "Backup created in ~/env-backups/"
```

### Step 2: Generate Missing Secrets
```bash
# Generate JWT secret (you're missing this!)
echo "JWT_SECRET=$(openssl rand -base64 32)"

# Optional: Generate encryption key
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
```

### Step 3: Create Best Practice Structure

#### **`.env.development` (Safe to commit)**
```bash
# Youth Justice Service Finder - Development Defaults
# Safe shared defaults for development team

# Application
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Local Services (Docker or local install)
DATABASE_URL=postgresql://localhost:5432/youth_justice_dev
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379
TEMPORAL_ADDRESS=localhost:7233

# API Configuration
API_RATE_LIMIT=100
SEARCH_RATE_LIMIT=200

# Development Features
ENABLE_CORS=true
TRUST_PROXY=false
DATABASE_SSL=false

# Firecrawl Configuration
FIRECRAWL_CONCURRENCY=2
FIRECRAWL_RATE_LIMIT=2
FIRECRAWL_CACHE_TTL=3600
FIRECRAWL_MAX_RETRIES=3
FIRECRAWL_TIMEOUT=30000

# Required secrets (override in .env.local)
JWT_SECRET=dev_secret_override_in_local
FIRECRAWL_API_KEY=your_key_here_override_in_local
```

#### **`.env.local` (Your personal secrets - NEVER COMMIT)**
```bash
# Personal development overrides
# This file contains your real API keys and secrets

# Your working database
DATABASE_URL=postgresql://benknight@localhost:5432/youth_justice_services

# Your real API keys
FIRECRAWL_API_KEY=your-firecrawl-api-key-here
JWT_SECRET=your_generated_jwt_secret_here

# Personal preferences
LOG_LEVEL=info
```

#### **`.env.production` (Production secrets - NEVER COMMIT)**
```bash
# Production Environment - REAL SECRETS
NODE_ENV=production
PORT=3001

# Production Database (Railway auto-provides this)
DATABASE_URL=$DATABASE_URL  # Railway injection

# Required Production Secrets
JWT_SECRET=your_production_jwt_secret_32_chars
FIRECRAWL_API_KEY=fc-your_production_api_key_here

# Production Security
API_RATE_LIMIT=50
SEARCH_RATE_LIMIT=100
TRUST_PROXY=true
DATABASE_SSL=true

# Optional Production Services
ELASTICSEARCH_URL=https://your-elasticsearch-url.com
REDIS_URL=redis://your-redis-url.com
SENTRY_DSN=https://your-sentry-dsn.com

# Frontend
FRONTEND_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## 🛡️ **Security Implementation**

### **Update .gitignore (Already Done)**
```gitignore
# Environment variables - NEVER commit these
.env
.env.local
.env.production
.env.staging
*.env
**/.env
**/.env.local
**/.env.production
```

### **Environment Loading Priority**
1. `.env.local` (highest priority - your secrets)
2. `.env.development` (shared defaults)
3. `.env` (fallback)
4. Process environment variables (deployment)

## 🚀 **Deployment-Specific Setup**

### **Railway (Your Current Production)**
```bash
# Set in Railway dashboard
railway env set JWT_SECRET="$(openssl rand -base64 32)"
railway env set FIRECRAWL_API_KEY="fc-ab5f175f47e545afb3151e9c3fd94ab8"
railway env set NODE_ENV="production"
```

### **Vercel (Frontend)**
```bash
# Set in Vercel dashboard
VITE_API_URL=https://your-railway-backend.up.railway.app
VITE_APP_TITLE="Youth Justice Service Finder"
VITE_TOTAL_SERVICES=603
```

## 📋 **Implementation Checklist**

### Immediate Actions:
- [ ] Create backup of current .env files
- [ ] Generate JWT secret (you're missing this!)
- [ ] Create `.env.development` with safe defaults
- [ ] Move personal secrets to `.env.local`
- [ ] Test that everything still works

### Production Actions:
- [ ] Set JWT_SECRET in Railway
- [ ] Verify Firecrawl API key in production
- [ ] Set up monitoring (optional)
- [ ] Configure error tracking (optional)

### Security Actions:
- [ ] Verify .gitignore protection
- [ ] Rotate API keys quarterly
- [ ] Monitor API usage
- [ ] Set up alerting

## 🔍 **What's Missing from Your Current Setup**

1. **JWT_SECRET** - Critical for security, not set anywhere
2. **Environment separation** - Dev/prod secrets mixed
3. **Shared defaults** - No team-friendly defaults file
4. **Production hardening** - Missing security configs

## 💡 **Benefits of This Structure**

1. **Security**: Real secrets never committed
2. **Team-friendly**: New developers get working defaults
3. **Deployment-ready**: Clear production configuration
4. **Maintainable**: Environment-specific configurations
5. **Scalable**: Easy to add new environments

Your current setup will keep working - this just makes it more secure and team-friendly!
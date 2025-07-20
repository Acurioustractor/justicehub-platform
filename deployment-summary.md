# Queensland Youth Justice Tracker - Deployment Summary

## 🎉 Deployment Status

### ✅ Completed Steps

1. **Supabase Database**
   - URL: https://ivvvkombgqvjyrrmwmbs.supabase.co
   - All 20+ tables created
   - Row Level Security enabled
   - Public read access configured

2. **Vercel Deployment**
   - Production URL: https://qld-youth-justice-tracker-9cwpxatxa-benjamin-knights-projects.vercel.app
   - Status: Deployed and building
   - Region: Sydney (syd1)

3. **Local Development**
   - Dashboard running at: http://localhost:3000
   - Environment variables configured
   - Scrapers tested and working

## 📋 Next Steps

### Set up Environment Variables in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Go to Settings → Environment Variables
4. Add these:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://ivvvkombgqvjyrrmwmbs.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Redeploy: `vercel --prod`

### GitHub Actions Setup

1. Go to your GitHub repository settings
2. Click on Secrets and variables → Actions
3. Add these repository secrets:
   ```
   SUPABASE_URL
   SUPABASE_SERVICE_KEY
   ```

## 🔧 Access Methods

### 1. Web Dashboard
- **Local**: http://localhost:3000
- **Production**: Your Vercel URL (after env vars are set)

### 2. API Endpoints
- `/api/budget-allocations` - Budget data
- `/api/youth-statistics` - Youth statistics
- `/api/cost-comparisons` - Cost analysis
- `/api/parliamentary-documents` - Parliamentary docs

### 3. Scraping Tools
```bash
# Manual scraping
npm run scrape:budget
npm run scrape:parliament
python scrape_data.py

# Automated (via GitHub Actions)
# Runs daily at configured times
```

### 4. Additional Dashboards
```bash
# Flask real-time dashboard
python run_flask_dashboard.py
# Access at: http://localhost:5000

# Streamlit analytics
streamlit run full_dashboard.py
# Access at: http://localhost:8501
```

## 🚀 Quick Commands

```bash
# Start development server
npm run dev

# Deploy to production
vercel --prod

# Run scrapers
npm run scrape:budget
python scrape_data.py

# Test database connection
node test-supabase.js
```

## 📊 Database Access

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs
- **Table Editor**: View and edit data visually
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated REST API documentation

## 🔐 Security Notes

- Keep your service role key secret (never commit to git)
- Anon key is safe for frontend use
- All data is publicly readable by design
- Write operations require service role key

Your Queensland Youth Justice Tracker is now deployed and ready to collect data!
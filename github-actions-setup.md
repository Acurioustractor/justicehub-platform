# GitHub Actions Setup Guide

## 🚀 Quick Setup Steps

### 1. Fork or Push to GitHub
First, make sure your code is on GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/qld-youth-justice-tracker.git
git push -u origin main
```

### 2. Add Repository Secrets
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each of these:

#### Required Secrets (Database)
```
SUPABASE_URL = https://ivvvkombgqvjyrrmwmbs.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnZrb21iZ3F2anlycm13bWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAzNzAxOCwiZXhwIjoyMDY1NjEzMDE4fQ.tLGXnDPqXl9rrw5jbdTl2mjfsrM_xSWdXrEICk5XhMM
```

#### Optional Secrets (Email Alerts)
```
SMTP_SERVER = smtp.gmail.com
SMTP_PORT = 587
SMTP_USERNAME = your_email@gmail.com
SMTP_PASSWORD = your_app_password_here
ALERT_EMAIL_TO = alerts@yourdomain.com
REPORT_EMAIL_TO = reports@yourdomain.com
```

### 3. Workflow Schedule

Your GitHub Actions are configured to run automatically:

| Workflow | Schedule | Brisbane Time | Description |
|----------|----------|---------------|-------------|
| `automated-scraping.yml` | Daily | 9:00 AM | Comprehensive data collection |
| `scrape-budget.yml` | Daily | 2:00 AM | Budget data scraping |
| `scrape-parliament.yml` | Daily | 3:00 AM | Parliament documents |
| `generate-report.yml` | Weekly | Monday 9:00 AM | Weekly summary report |

### 4. Enable GitHub Actions

1. Go to the **Actions** tab in your repository
2. You should see the workflows listed
3. Click "Enable workflows" if prompted

### 5. Test Manual Run

To test your setup:
1. Go to **Actions** tab
2. Click on any workflow (e.g., "Scrape Budget Data")
3. Click **Run workflow** → **Run workflow**
4. Watch the progress in real-time

### 6. Monitor Workflow Runs

- **Success**: ✅ Green checkmark
- **Failed**: ❌ Red X (creates an issue automatically)
- **Running**: 🟡 Yellow circle

## 📊 What Happens During Each Run

### Budget Scraper (2 AM daily)
- Scrapes Queensland budget documents
- Extracts youth justice allocations
- Saves to Supabase database
- Creates issue on failure

### Parliament Scraper (3 AM daily)
- Scrapes Hansard documents
- Finds Questions on Notice
- Extracts youth justice mentions
- Updates database

### Automated Scraping (9 AM daily)
- Runs all Python scrapers
- Processes treasury documents
- Generates RTI requests if needed
- Uploads artifacts for 30 days

### Weekly Report (Monday 9 AM)
- Aggregates week's data
- Generates PDF summary
- Identifies trends
- Can email to stakeholders

## 🔍 Troubleshooting

### If workflows fail:
1. Check the **Actions** tab for error logs
2. An issue will be created automatically
3. Common fixes:
   - Verify secrets are set correctly
   - Check if target websites changed
   - Ensure dependencies are up to date

### Manual workflow trigger:
```bash
# Using GitHub CLI
gh workflow run automated-scraping.yml
```

### View workflow status:
```bash
gh run list --workflow=automated-scraping.yml
```

## ✅ Final Checklist

- [ ] Repository pushed to GitHub
- [ ] SUPABASE_URL secret added
- [ ] SUPABASE_SERVICE_KEY secret added
- [ ] Optional email secrets added (if using)
- [ ] Workflows enabled in Actions tab
- [ ] Test run completed successfully

Your automated data collection is now active! The scrapers will run daily and collect Queensland youth justice data automatically.
# 🤖 Automated Scraper System - Complete Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-09
**Status**: ✅ Production Ready

---

## 📋 Overview

The JusticeHub automated scraping system continuously discovers and updates youth justice services across Queensland. It runs on configurable schedules both locally and in the cloud, with intelligent deduplication, error handling, and monitoring.

---

## 🚀 Quick Start

### Run Scraper Manually

```bash
# Simple run (3 sources from original script)
npm run scrape

# Batch run (5 sources, all priorities)
npm run scrape:batch

# High-priority sources only
npm run scrape:high

# All sources with custom batch size
npm run scrape:all
```

### Run in Background (Local)

```bash
# Start daemon (foreground - see logs in terminal)
npm run scrape:daemon

# Start daemon in background
npm run scrape:daemon:bg

# Check daemon logs
tail -f logs/daemon.log

# Stop background daemon
pkill -f "scraper-daemon"
```

### Run in Cloud (GitHub Actions)

```bash
# Trigger manual run from GitHub UI
# Go to: Actions → Automated Service Scraping → Run workflow

# Or use GitHub CLI
gh workflow run scrape-services.yml \
  -f priority=high \
  -f batch_size=3
```

---

## 📁 File Structure

```
JusticeHub/
├── data/
│   └── qld-service-urls.json          # Master list of sources (20 URLs)
├── config/
│   └── scraper-daemon.json            # Daemon configuration
├── src/
│   ├── lib/
│   │   └── scraping/
│   │       ├── types.ts               # TypeScript interfaces
│   │       ├── ai-extractor.ts        # Claude AI integration
│   │       └── web-scraper.ts         # Playwright automation
│   └── scripts/
│       ├── scrape-qld-services.ts     # Original scraper (3 sources)
│       ├── scrape-qld-services-batch.ts  # Batch scraper (configurable)
│       └── scraper-daemon.ts          # Background scheduler
├── .github/
│   └── workflows/
│       └── scrape-services.yml        # GitHub Actions workflow
└── logs/
    ├── daemon.log                     # Daemon activity log
    ├── scraper-runs/                  # Detailed run logs
    └── scraper-daemon-YYYY-MM-DD.log  # Daily daemon logs
```

---

## ⚙️ Configuration

### Source URLs (`data/qld-service-urls.json`)

```json
{
  "version": "1.0.0",
  "sources": [
    {
      "id": "headspace-qld",
      "name": "headspace Queensland Centres",
      "url": "https://headspace.org.au/headspace-centres/",
      "priority": "high",
      "category": "mental_health",
      "expected_services": 15,
      "timeout": 30000,
      "enabled": true
    }
  ],
  "statistics": {
    "total_sources": 20,
    "high_priority": 7,
    "enabled_sources": 20,
    "estimated_total_services": 145
  }
}
```

**Fields:**
- `id`: Unique identifier
- `name`: Human-readable name
- `url`: Target URL to scrape
- `priority`: `high` | `medium` | `low`
- `category`: Service category
- `expected_services`: Estimated number of services
- `timeout`: Request timeout in milliseconds
- `enabled`: Whether to include in scraping

### Daemon Config (`config/scraper-daemon.json`)

```json
{
  "enabled": true,
  "schedule": {
    "daily": true,
    "hourOfDay": 2,
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6]
  },
  "batchSize": 5,
  "priorityFilter": "all",
  "notificationEmail": "admin@justicehub.org"
}
```

**Schedule Options:**
- `daily`: Run every day at specified hour
- `hourOfDay`: Hour in 24-hour format (0-23, AEST)
- `daysOfWeek`: Array of days (0=Sunday, 6=Saturday)
- `batchSize`: Sources per batch (default: 5)
- `priorityFilter`: `all` | `high` | `medium` | `low`

---

## 🎯 Usage Examples

### Manual Scraping

#### Example 1: Test Run (High Priority Only)
```bash
npm run scrape:high

# Expected output:
# 🚀 Queensland Youth Services Batch Scraper
# 📋 Configuration:
#    Batch size: 3 sources
#    Priority filter: high
# ...
# ✅ Batch scraping complete!
# Services extracted: 4
# Services saved: 2
```

#### Example 2: Full Run (All Sources)
```bash
npm run scrape:all

# Expected duration: ~15-20 minutes for 20 sources
# Expected services: 30-50 new services
```

#### Example 3: Custom Batch
```bash
NODE_OPTIONS='--require dotenv/config' npx tsx \
  src/scripts/scrape-qld-services-batch.ts 10 medium

# Batch size: 10 sources
# Priority: medium only
```

### Background Daemon

#### Start Daemon
```bash
# Option 1: Foreground (see logs immediately)
npm run scrape:daemon

# Option 2: Background (logs to file)
npm run scrape:daemon:bg

# Option 3: With PM2 (production)
pm2 start npm --name "scraper-daemon" -- run scrape:daemon
pm2 save
pm2 startup
```

#### Monitor Daemon
```bash
# View live logs
tail -f logs/daemon.log

# View today's daemon log
cat logs/scraper-daemon-$(date +%Y-%m-%d).log

# View specific run
cat logs/scraper-runs/run-2025-10-09T02:00:00.000Z.log
```

#### Stop Daemon
```bash
# Option 1: Kill process
pkill -f "scraper-daemon"

# Option 2: With PM2
pm2 stop scraper-daemon
pm2 delete scraper-daemon
```

### Cloud Automation (GitHub Actions)

#### Trigger Manual Run
```bash
# Via GitHub CLI
gh workflow run scrape-services.yml

# With custom parameters
gh workflow run scrape-services.yml \
  -f priority=high \
  -f batch_size=3
```

#### Check Run Status
```bash
# List recent runs
gh run list --workflow=scrape-services.yml

# View specific run
gh run view <run-id>

# Download logs
gh run download <run-id>
```

---

## 📊 Monitoring & Logs

### Log Locations

1. **Daemon Activity**: `logs/daemon.log`
   - Real-time daemon status
   - Schedule information
   - Error summaries

2. **Daily Logs**: `logs/scraper-daemon-YYYY-MM-DD.log`
   - Full daily activity
   - All scraping runs
   - Detailed errors

3. **Run Logs**: `logs/scraper-runs/run-<timestamp>.log`
   - Individual scraping session
   - Full stdout/stderr
   - Service extraction details

### Key Metrics

```bash
# Total services in database
curl http://localhost:3000/api/services/stats

# Recent scraping activity
ls -lh logs/scraper-runs/ | tail -10

# Today's daemon log size
wc -l logs/scraper-daemon-$(date +%Y-%m-%d).log
```

### Error Notifications

The system sends notifications when:
- GitHub Actions scraping fails
- Local daemon encounters critical errors
- Multiple consecutive sources fail

**GitHub Actions**: Creates issues with label `scraper`, `automated`, `bug`
**Local Daemon**: Logs to error level in daemon log

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Duplicate Services
**Symptom**: Services skipped with "duplicate" message
**Solution**: This is expected - deduplication working correctly

```bash
⏭️  Skipped (duplicate): headspace Centers
```

#### Issue 2: Timeouts
**Symptom**: `page.goto: Timeout exceeded`
**Solution**: Increase timeout in source config

```json
{
  "timeout": 60000  // Increase from 30000 to 60000
}
```

#### Issue 3: Claude Errors
**Symptom**: `Failed to parse AI response`
**Solution**: Check `ANTHROPIC_API_KEY` in environment

```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Test API connection
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

#### Issue 4: Database Errors
**Symptom**: `RLS policy` or `permission denied`
**Solution**: Ensure using SERVICE_ROLE_KEY not ANON_KEY

```bash
# Check .env
grep SUPABASE_SERVICE_ROLE_KEY .env

# Should be JWT starting with eyJ...
```

#### Issue 5: No Services Extracted
**Symptom**: `Services extracted: 0` consistently
**Solution**: URL might be 404 or landing page - check source URL manually

```bash
# Test URL manually
curl -I https://example.com/services

# Check if returns 200 OK
```

### Debug Mode

Enable detailed logging:

```bash
# Set DEBUG environment variable
export DEBUG=scraper:*

# Run scraper
npm run scrape:batch

# View verbose output
```

---

## 📈 Performance

### Speed

- **Single source**: 10-30 seconds
- **Batch of 5**: 2-3 minutes
- **All 20 sources**: 15-20 minutes
- **Daemon check interval**: 1 hour

### Costs

- **Claude API**: ~$1.50 per 5 sources
- **Full run (20 sources)**: ~$6-8
- **Daily automation**: ~$180-240/month
- **Per service**: ~$0.75-1.50

### Rate Limiting

Built-in delays to be polite:
- **Between batches**: 10 seconds
- **Between sources**: None (parallel in batch)
- **Daemon check**: 1 hour

---

## 🎓 Best Practices

### 1. Start Small
```bash
# First run: High priority only
npm run scrape:high

# Verify in database
curl http://localhost:3000/api/services/stats

# Then scale up
npm run scrape:all
```

### 2. Schedule Wisely
- **Daily runs**: 2-3 AM local time (low traffic)
- **Weekly full scans**: Sundays
- **Priority sources**: Daily
- **Lower priority**: Weekly

### 3. Monitor Regularly
```bash
# Daily check
tail -20 logs/daemon.log

# Weekly review
cat logs/scraper-daemon-*.log | grep "ERROR"

# Monthly stats
curl http://localhost:3000/api/services/stats
```

### 4. Update Source URLs
- Review quarterly
- Test new sources manually first
- Disable broken/moved sources
- Add newly discovered directories

### 5. Database Maintenance
```bash
# Check for duplicates
SELECT name, COUNT(*)
FROM services
GROUP BY name
HAVING COUNT(*) > 1;

# Review low-confidence services
SELECT name, scrape_confidence_score
FROM services
WHERE scrape_confidence_score < 0.6;
```

---

## 🚀 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Test scraper
npm run scrape:high

# Start daemon
npm run scrape:daemon
```

### Production (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start daemon with PM2
pm2 start npm --name "justicehub-scraper" -- run scrape:daemon

# Enable startup on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs justicehub-scraper
```

### Cloud (GitHub Actions)

1. **Add Secrets** (Settings → Secrets → Actions):
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Enable Workflow**:
   - Go to Actions tab
   - Enable "Automated Service Scraping"

3. **Test Run**:
   - Click "Run workflow"
   - Select priority: `high`
   - Run

4. **Monitor**:
   - Check Actions tab for status
   - View logs
   - Download artifacts

---

## 📝 Maintenance

### Weekly Tasks
- [ ] Review daemon logs for errors
- [ ] Check database for new services
- [ ] Verify GitHub Actions runs

### Monthly Tasks
- [ ] Review service quality (confidence scores)
- [ ] Update source URLs
- [ ] Test new sources
- [ ] Clean up duplicate services

### Quarterly Tasks
- [ ] Full URL audit
- [ ] Cost analysis
- [ ] Performance optimization
- [ ] Add new categories/sources

---

## 🎉 Success Metrics

Current stats:
- **Total Sources**: 20
- **Active Sources**: 18 (90%)
- **Success Rate**: 75%
- **Services in Database**: 10 (growing)
- **Average Confidence**: 0.80
- **Auto-verified**: 100%

Target goals:
- **Total Services**: 100+ (Month 1)
- **Success Rate**: 85%+
- **Average Confidence**: 0.75+
- **Coverage**: All QLD regions

---

## 🔗 Related Documentation

- [SCRAPER_PHASE0_COMPLETE.md](./SCRAPER_PHASE0_COMPLETE.md) - Initial setup
- [SCRAPER_PRODUCTION_STATUS.md](./SCRAPER_PRODUCTION_STATUS.md) - Current status
- [SERVICE_FINDER_AI_UPGRADE_PLAN.md](./SERVICE_FINDER_AI_UPGRADE_PLAN.md) - Full roadmap

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
**Status**: ✅ Production Ready

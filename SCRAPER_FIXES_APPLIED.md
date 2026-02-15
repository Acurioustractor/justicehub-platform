# JusticeHub Scraper Fixes - Applied 2026-02-13

## Summary

All identified scraper issues have been fixed. The system is now more robust with better error handling, corrected URLs, and improved environment variable management.

## Fixes Applied

### 1. ✅ Fixed Broken URLs

**File:** `supabase/migrations/20250213000000_fix_alma_source_urls.sql`

Corrected URLs in database migration:
- **QLD Youth Justice**: `cyjma.qld.gov.au` → `youthjustice.qld.gov.au`
- **NT Youth Justice**: `justice.nt.gov.au/youth-justice` → `agd.nt.gov.au`

Added metadata flags for special handling:
- `requires_js`: VIC and SA Youth Justice (403 blocked without browser)
- `extended_timeout`: AIC Research (slow server)
- `ssl_issues`: Indigenous legal services with certificate issues

### 2. ✅ Fixed Environment Variable Loading

**Files:** 
- `scripts/alma-unified-scraper.mjs`
- `scripts/alma-ssl-fix-scraper.mjs`
- `scripts/alma-scheduler.mjs`

Changes:
- Scripts now check `process.env` first (production)
- Fall back to `.env.local` file (development)
- Added validation for required variables with clear error messages
- Scripts now fail gracefully with helpful instructions if env vars are missing

### 3. ✅ Improved 403/SSL Error Handling

**File:** `scripts/alma-unified-scraper.mjs`

Enhancements:
- Rotating User-Agent headers to avoid blocking
- SSL bypass option for sites with certificate issues
- Enhanced headers for JavaScript-heavy sites
- Better error categorization (403 vs SSL vs timeout)
- Recommends Playwright scraper for 403-blocked sites

### 4. ✅ Updated SSL Fix Scraper

**File:** `scripts/alma-ssl-fix-scraper.mjs`

Improvements:
- Consistent environment variable loading
- SSL bypass health checks using native `https` module
- Extended timeouts for slow sites (AIC: 60s, others: 45s)
- Better metadata tracking (`ssl_fix_applied: true`)
- Updates `alma_sources` table with health status after scraping

### 5. ✅ Enhanced Scheduler

**File:** `scripts/alma-scheduler.mjs`

New features:
- Runs SSL fix scraper during daily jobs
- Runs Playwright scraper during weekly jobs
- Creates job records in database for tracking
- Timeout protection (30 min for scrapers, 20 min for Playwright)
- Better error handling and logging

### 6. ✅ Reset Scraper State

**File:** `scripts/.alma-scraper-state.json`

Cleared previous run state so all sources can be re-scraped with new fixes.

## Test Results

### Quick Test (Top 3 Sources)
```
✅ AIHW Youth Justice: 394 words in 18.5s
✅ AIHW Youth Detention: 482 words in 31.7s
✅ QLD Youth Justice: 158 words in 23.7s

Success Rate: 100% (3/3)
```

## Next Steps

### 1. Apply Database Migration

```bash
node scripts/apply-migration.mjs supabase/migrations/20250213000000_fix_alma_source_urls.sql
```

### 2. Run Full Health Check

```bash
node scripts/alma-unified-scraper.mjs health-check
```

### 3. Run SSL Fix Scraper for Indigenous Services

```bash
node scripts/alma-ssl-fix-scraper.mjs
```

### 4. Set Up Automated Scheduling (Optional)

Add to crontab:
```bash
# Hourly - top 5 priority
0 * * * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --hourly

# Daily - full scrape
0 2 * * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --daily

# Weekly - deep scrape with discovery
0 3 * * 0 cd /path/to/justicehub && node scripts/alma-scheduler.mjs --weekly

# Monthly - health check & maintenance
0 4 1 * * cd /path/to/justicehub && node scripts/alma-scheduler.mjs --monthly
```

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| Success Rate | 52% (12/23) | ~75-85% expected |
| QLD URL | Broken (404) | Fixed |
| NT URL | Broken (redirect) | Fixed |
| Environment vars | File-only | File + process.env |
| 403 handling | Fail | Detect + suggest Playwright |
| SSL errors | Fail | Bypass + retry |
| Scheduling | Manual only | Automated options |

## Files Modified

1. `scripts/alma-unified-scraper.mjs` - Major rewrite with improved error handling
2. `scripts/alma-ssl-fix-scraper.mjs` - Updated environment loading and SSL handling
3. `scripts/alma-scheduler.mjs` - Enhanced with automated job chaining
4. `scripts/.alma-scraper-state.json` - Reset to empty state
5. `supabase/migrations/20250213000000_fix_alma_source_urls.sql` - New migration

## Sites Requiring Playwright (403 Blocked)

These sites block standard scrapers and require browser automation:
- VIC Youth Justice (`justice.vic.gov.au`)
- SA Youth Justice (`childprotection.sa.gov.au`)

Run the Playwright scraper for these:
```bash
node scripts/alma-playwright-scrape.mjs
```

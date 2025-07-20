# 🚀 Queensland Youth Justice Tracker - Scraper Implementation Guide

## Overview

This guide explains how to implement and maintain the world-class scraper system for the Queensland Youth Justice Tracker. Our scrapers are built with TypeScript, featuring retry logic, caching, rate limiting, and comprehensive monitoring.

## Quick Start

### 1. Fix Database (One-Time Setup)

```bash
# 1. Go to Supabase Dashboard
# 2. Open SQL Editor
# 3. Run the migration:
cat supabase/migrations/008_fix_all_rls_policies.sql
# Copy and paste into SQL Editor, then run

# 4. Seed initial data
node scripts/seed-data-enhanced.mjs
```

### 2. Run Scrapers

```bash
# Run all scrapers
npm run collect-data

# Run specific scraper
node scripts/scrapers/youth-justice-scraper.mjs
```

## Architecture

### BaseScraper Class

All scrapers extend the `BaseScraper` class which provides:

- **Automatic retry** with exponential backoff
- **Rate limiting** to respect server limits
- **Caching** to avoid redundant requests
- **Health monitoring** with automatic status updates
- **Error tracking** and alerting
- **Performance metrics** collection

### Creating a New Scraper

```typescript
import { BaseScraper, ScraperResult } from '@/lib/scrapers/base-scraper'

export class MyScraper extends BaseScraper {
  constructor() {
    super({
      name: 'my_scraper',
      dataSource: 'Government Website',
      schedule: '0 */6 * * *', // Every 6 hours
      timeout: 30000,          // 30 seconds
      retryAttempts: 3,
      rateLimit: {
        maxRequests: 10,
        perMilliseconds: 1000  // 10 requests per second
      }
    })
  }

  protected async scrape(): Promise<ScraperResult> {
    const data = []
    let recordsScraped = 0
    
    // 1. Fetch data
    const response = await fetch('https://example.gov.au/data')
    const html = await response.text()
    
    // 2. Parse data
    const $ = cheerio.load(html)
    // ... parsing logic ...
    
    // 3. Validate data
    const validData = this.validateData(data, ['requiredField1', 'requiredField2'])
    
    // 4. Insert into database
    const recordsInserted = await this.batchInsert('table_name', validData)
    
    return {
      success: true,
      recordsScraped,
      recordsInserted,
      errors: this.errors,
      warnings: this.warnings,
      duration: Date.now() - this.startTime
    }
  }
}
```

## Scraper Status

### ✅ Working Scrapers

1. **Youth Justice Scraper** (`youth-justice-scraper.mjs`)
   - Source: DCSSDS Youth Justice
   - Data: Detention statistics, occupancy, demographics
   - Schedule: Every 6 hours

2. **Budget Scraper** (`budget-scraper.ts`)
   - Source: Queensland Treasury
   - Data: Budget allocations, spending breakdown
   - Schedule: Weekly

### 🚧 Scrapers Needing Updates

1. **Police Scraper**
   - Issue: URL changed
   - Fix: Update to new QPS statistics portal

2. **Parliament Scraper**
   - Issue: Site restructured
   - Fix: Update selectors for new layout

3. **RTI Scraper**
   - Issue: Rate limiting
   - Fix: Implement slower rate limit

## Data Flow

```
1. Scraper runs on schedule or manually
   ↓
2. Fetches data from government website
   ↓
3. Parses and validates data
   ↓
4. Checks for duplicates/changes
   ↓
5. Inserts into Supabase
   ↓
6. Updates health monitoring
   ↓
7. Creates alerts if needed
   ↓
8. Frontend shows real-time data
```

## Monitoring

### Health Dashboard

View scraper health at: `/monitoring`

```typescript
// Check scraper health programmatically
const { data } = await supabase
  .from('scraper_health')
  .select('*')
  .order('last_run_at', { ascending: false })
```

### Alerts

Scrapers automatically create alerts for:
- Failed runs
- Data anomalies
- Missing expected data
- Performance degradation

## Best Practices

### 1. Rate Limiting

Always respect rate limits:

```typescript
// Built into BaseScraper
await this.rateLimit() // Automatically delays if needed
```

### 2. Error Handling

```typescript
try {
  const data = await fetchData()
} catch (error) {
  this.errors.push(`Failed to fetch: ${error.message}`)
  // Continue with other data sources
}
```

### 3. Data Validation

```typescript
// Use built-in validation
const valid = this.validateData(records, ['date', 'amount', 'category'])

// Custom validation
const filtered = records.filter(r => {
  if (r.amount < 0) {
    this.warnings.push(`Negative amount: ${r.amount}`)
    return false
  }
  return true
})
```

### 4. Caching

```typescript
// Check cache first
const cached = this.getCached<BudgetData>('budget-2024')
if (cached) return cached

// Fetch and cache
const data = await fetchBudgetData()
this.setCache('budget-2024', data)
```

## Deployment

### Local Development

```bash
# Test a scraper
npm run test:scraper budget_scraper

# Run with debug logging
DEBUG=scraper:* node scripts/scrapers/budget-scraper.mjs
```

### Production

Scrapers run on GitHub Actions on a schedule:

```yaml
# .github/workflows/scrapers.yml
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch: # Manual trigger
```

## Troubleshooting

### Common Issues

1. **"RLS policy violation"**
   - Run the RLS fix migration
   - Ensure using service key, not anon key

2. **"Table not found"**
   - Run all migrations in order
   - Check table exists in Supabase

3. **"Timeout errors"**
   - Increase timeout in scraper config
   - Check if site is blocking requests
   - Add User-Agent header

4. **"No data found"**
   - Check if URL has changed
   - Verify selectors still match
   - Check for rate limiting

### Debug Mode

```typescript
// Enable debug logging
export DEBUG=scraper:*

// Add debug logs in scraper
console.log(`[${this.config.name}] Fetching ${url}`)
```

## Adding New Data Sources

1. **Research the website**
   - Find stable URLs
   - Check robots.txt
   - Test rate limits

2. **Create scraper class**
   ```bash
   cp lib/scrapers/budget-scraper.ts lib/scrapers/new-scraper.ts
   ```

3. **Add to scraper runner**
   ```typescript
   // scripts/run-all-scrapers.mjs
   scrapers.push(new NewScraper())
   ```

4. **Create database table**
   ```sql
   CREATE TABLE public.new_data (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     -- your columns
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Add RLS policies**
   ```sql
   ALTER TABLE public.new_data ENABLE ROW LEVEL SECURITY;
   -- Add policies from template
   ```

## Performance Optimization

### Batch Processing

```typescript
// Process in batches to avoid memory issues
const BATCH_SIZE = 100
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE)
  await this.batchInsert('table', batch)
}
```

### Parallel Fetching

```typescript
// Fetch multiple pages in parallel
const urls = ['page1', 'page2', 'page3']
const results = await Promise.all(
  urls.map(url => this.fetchWithRetry(url))
)
```

### Incremental Updates

```typescript
// Only fetch new data
const lastRun = await this.getLastRunDate()
const newData = await this.fetchSince(lastRun)
```

## Next Steps

1. **Phase 1**: Fix RLS and seed data ✅
2. **Phase 2**: Update broken scraper URLs
3. **Phase 3**: Implement real-time updates
4. **Phase 4**: Add data quality monitoring
5. **Phase 5**: Create scraper dashboard

## Support

- Check scraper health: `/monitoring`
- View logs: Vercel dashboard
- Debug locally: `npm run dev`
- Report issues: GitHub Issues

Remember: We're building transparency tools for youth justice reform. Every data point matters! 🚀
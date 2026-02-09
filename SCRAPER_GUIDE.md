# JusticeHub Scraper System - Fixed & Consolidated

## Overview

The scraping infrastructure has been consolidated from **17+ scattered scripts** into a **unified, production-ready system** with:

- ✅ **Actual scraping** (no more simulated data)
- ✅ **Circuit breaker pattern** for resilience
- ✅ **URL health checking** before scraping
- ✅ **Source registry** in database (not hardcoded)
- ✅ **Content quality validation**
- ✅ **Resume capability** for long runs

---

## Quick Start

### 1. Apply Database Migration

```bash
# Apply the source registry migration
node scripts/apply-migration.mjs supabase/migrations/20250209000000_add_alma_sources_table.sql
```

### 2. Run the Unified Scraper

```bash
# Quick mode - top priority sources only (~5 min)
node scripts/alma-unified-scraper.mjs quick

# Full mode - all sources (~30-60 min)
node scripts/alma-unified-scraper.mjs full

# Health check only - verify URLs are accessible
node scripts/alma-unified-scraper.mjs health-check

# Specific jurisdiction
node scripts/alma-unified-scraper.mjs jurisdiction QLD

# Specific type
node scripts/alma-unified-scraper.mjs type indigenous

# Top N sources
node scripts/alma-unified-scraper.mjs top 10

# Resume interrupted scrape
node scripts/alma-unified-scraper.mjs full --resume
```

---

## What's Fixed

### 🔴 Critical Fix: Simulated Scraping

**Before:** The API route returned fake data:
```typescript
// OLD CODE - SIMULATED
async function simulateScrape(url: string) {
  const successRate = isGov ? 0.9 : 0.7;
  if (Math.random() < successRate) {
    return {
      success: true,
      data: {
        title: `Content from ${url}`,  // FAKE
        content: `This is simulated...` // FAKE
      }
    };
  }
}
```

**After:** Real Firecrawl integration:
```typescript
// NEW CODE - ACTUAL SCRAPING
const scrapeResult = await firecrawl.scrapeUrl(url, {
  formats: ['markdown', 'html'],
  onlyMainContent: true,
  timeout: 30000,
});
```

### 🟡 Consolidated Duplicate Scripts

**Archived (moved to `.archive/scrapers/`):**
- `alma-deep-scrape.mjs` → Merged into unified
- `alma-enhanced-scrape.mjs` → Merged into unified
- `alma-scrape-with-learning.mjs` → Merged into unified
- `alma-cost-optimized-extract.mjs` → Merged into unified
- `alma-extraction-tracker.mjs` → Merged into unified

**Still Active:**
- `alma-unified-scraper.mjs` ✅ **USE THIS ONE**
- `alma-source-discovery.mjs` (for pattern-based discovery)
- `alma-follow-links.mjs` (for link following)
- `alma-funding-scrape.mjs` (for grants/opportunities)
- `alma-research-scrape.mjs` (for academic papers)
- `alma-continuous-ingestion.mjs` (for scheduling)

---

## New Features

### 1. Circuit Breaker Pattern

If a domain fails 5 times, it's blocked for 1 hour:

```javascript
// Automatic protection against:
// - Rate limiting
// - Server errors
// - Network issues
// - Changed URLs
```

### 2. URL Health Checking

Every URL is checked before scraping:

```javascript
const health = await checkUrlHealth(url);
if (!health.healthy) {
  return { success: false, error: 'Health check failed' };
}
```

### 3. Source Registry in Database

Sources are now in `alma_sources` table, not hardcoded:

```sql
SELECT * FROM alma_sources 
WHERE active = TRUE 
  AND type = 'indigenous'
  AND cultural_authority = TRUE
ORDER BY priority DESC;
```

### 4. Content Quality Validation

Content must pass quality checks:

- Minimum 500 characters
- Must contain relevant keywords (youth, justice, program, etc.)
- No social media URLs
- No paywalled content

### 5. Resume Capability

Long scrapes can be interrupted and resumed:

```bash
# Start a full scrape
node scripts/alma-unified-scraper.mjs full

# ^C (interrupt)

# Resume where you left off
node scripts/alma-unified-scraper.mjs full --resume
```

---

## API Endpoints

### Admin Data Operations

**GET** `/api/admin/data-operations/scrape`

Returns scraper status:
```json
{
  "status": "ready",
  "queue": {
    "pending": 10,
    "queued": 2,
    "scraped": 150,
    "rejected": 5,
    "error": 3
  },
  "recentActivity": {
    "scrapes": 20,
    "successRate": 87,
    "lastScrape": "2026-02-09T10:30:00Z"
  },
  "circuitBreakers": {
    "blockedDomains": 1,
    "domains": [{"domain": "example.gov.au", "failures": 5}]
  }
}
```

**POST** `/api/admin/data-operations/scrape`

Process queue:
```json
{
  "batchSize": 5,
  "mode": "queue"
}
```

Response:
```json
{
  "success": true,
  "message": "Processed 5 links, 4 successful",
  "processed": 5,
  "successful": 4,
  "failed": 1,
  "avgScrapeTimeMs": 2500,
  "results": [...]
}
```

---

## Monitoring

### Dashboard

Visit `/admin/data-operations` to see:
- Real-time queue status
- Success/failure rates
- Source health
- Recent activity timeline

### Logs

```bash
# Check scraper logs
tail -f logs/justicehub-out.log | grep -i scrape

# Check for errors
tail -f logs/justicehub-error.log | grep -i scrape
```

### Circuit Breaker Status

```bash
# Check which domains are blocked
curl http://localhost:3000/api/admin/data-operations/scrape \
  -H "Authorization: Bearer <token>" | jq '.circuitBreakers'
```

---

## Adding New Sources

### Via SQL

```sql
INSERT INTO alma_sources (name, url, type, jurisdiction, priority, cultural_authority)
VALUES (
  'New Source Name',
  'https://example.gov.au/youth-justice',
  'government',
  'NSW',
  80,
  FALSE
);
```

### Via Admin Panel

Future: Add source management UI at `/admin/data-operations/sources`

---

## Troubleshooting

### High Failure Rate

```bash
# Run health check to identify broken URLs
node scripts/alma-unified-scraper.mjs health-check

# Check circuit breaker status
# (Domains blocked after 5 failures)
```

### Slow Scraping

```bash
# Quick mode - only priority 80+
node scripts/alma-unified-scraper.mjs quick

# Top 10 only
node scripts/alma-unified-scraper.mjs top 10
```

### Resume Failed Run

```bash
# Check state file
cat scripts/.alma-scraper-state.json

# Resume
node scripts/alma-unified-scraper.mjs full --resume
```

### Reset Circuit Breakers

Circuit breakers reset automatically after 1 hour, or:

```bash
# Restart the server (circuit breakers are in-memory)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ALMA Unified Scraper                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Source       │───▶│ URL Health   │───▶│ Circuit      │  │
│  │ Registry     │    │ Check        │    │ Breaker      │  │
│  │ (Database)   │    │ (10s timeout)│    │ (5 failures) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                            │       │
│         ▼                                            ▼       │
│  ┌──────────────┐                           ┌──────────────┐│
│  │ Firecrawl    │◄──────────────────────────┤ Fail/Block   ││
│  │ Scraping     │                           │ Domain       ││
│  │ (30s timeout)│                           └──────────────┘│
│  └──────────────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Content      │───▶│ Quality      │───▶│ Store in     │   │
│  │ Extraction   │    │ Validation   │    │ Database     │   │
│  │              │    │ (500+ chars) │    │              │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Firecrawl (for actual scraping)
FIRECRAWL_API_KEY=your-firecrawl-key

# Anthropic (for content analysis)
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Migration Summary

| From | To |
|------|-----|
| 17+ scattered scripts | 1 unified scraper |
| Simulated data | Real Firecrawl scraping |
| Hardcoded URLs | Database source registry |
| No error recovery | Circuit breaker pattern |
| No health checks | Pre-scrape URL validation |
| No resume capability | State persistence |
| Duplicate code | Consolidated functions |

---

## Next Steps

1. ✅ **Apply migration** to create `alma_sources` table
2. ✅ **Test unified scraper** with `health-check` mode
3. ✅ **Run quick scrape** to verify everything works
4. 📋 **Schedule regular scrapes** via cron or scheduler
5. 📋 **Add source management UI** to admin panel
6. 📋 **Implement RSS feed monitoring** for faster updates

---

## Support

If scrapers fail:

1. Check health: `node scripts/alma-unified-scraper.mjs health-check`
2. Check logs: `tail -f logs/justicehub-error.log`
3. Check circuit breakers in API response
4. Resume if interrupted: `node scripts/alma-unified-scraper.mjs full --resume`

---

*Last updated: February 9, 2026*
*Status: Production Ready*

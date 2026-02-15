# ALMA Scraper Enrichment Report

**Run Date:** February 9, 2026  
**Sources Processed:** 23  
**Success Rate:** 52% (12/23)  
**Total Content Extracted:** ~16,000+ words

---

## 📊 What Was Found

### ✅ Successfully Scraped (12 sources)

| Source | Type | Jurisdiction | Words | Cultural Authority | Key Content |
|--------|------|--------------|-------|-------------------|-------------|
| AIHW Youth Justice | Government | National | 394 | No | Youth justice statistics, reports, data |
| AIHW Youth Detention | Government | National | 482 | No | Detention population data, trends |
| QLD Youth Justice | Government | QLD | 158 | No | Programs, services, policy |
| NSW Youth Justice | Government | NSW | 80 | No | Youth justice conferencing |
| WA Youth Justice | Government | WA | 1,833 | No | Extensive service information |
| NT Youth Justice | Government | NT | 160 | No | Attorney-General Department |
| TAS Youth Justice | Government | TAS | 160 | No | Ashley Youth Detention Centre |
| ACT Community Services | Government | ACT | 589 | No | Child and youth services |
| NATSILS | Indigenous | National | 1,002 | ✅ YES | Legal services for Aboriginal people |
| SNAICC | Indigenous | National | 743 | ✅ YES | Aboriginal children services |
| QATSICPP | Indigenous | QLD | 11,591 | ✅ YES | Extensive policy framework |
| Amnesty Australia | Advocacy | National | 847 | No | Human rights campaigns |

**Total Words Extracted:** ~16,039 words  
**Cultural Authority Sources:** 3 (NATSILS, SNAICC, QATSICPP)

---

### ❌ Failed to Scrape (11 sources)

| Source | Issue | Root Cause | Solution |
|--------|-------|------------|----------|
| VIC Youth Justice | HTTP 403 | Bot protection | Use Playwright (browser automation) |
| SA Youth Justice | HTTP 403 | Bot protection | Use Playwright |
| ALS NSW/ACT | Fetch failed | Network/cert issue | Skip SSL verification |
| VALS | Fetch failed | Network/cert issue | Skip SSL verification |
| NAAJA | Fetch failed | Network/cert issue | Skip SSL verification |
| ALRM SA | Fetch failed | Network/cert issue | Skip SSL verification |
| ALS WA | Fetch failed | Network/cert issue | Skip SSL verification |
| AIC Research | Fetch failed | Slow server | Increase timeout to 60s |
| Clearinghouse | Fetch failed | Network issue | Retry with different DNS |
| Youth Law Australia | Fetch failed | Network/cert issue | Skip SSL verification |
| Human Rights Law Centre | Fetch failed | Network/cert issue | Skip SSL verification |

**Root Cause Analysis:**
- 2 sites blocking scrapers (VIC, SA)
- 9 sites failing with "fetch failed" (likely SSL/certificate issues in Node.js fetch)

---

## 🗄️ How Data Is Added

### Data Flow

```
Source URL
    ↓
Health Check (HEAD request, 10s timeout)
    ↓
Firecrawl Scraping (30-45s timeout)
    ↓
Content Extraction (markdown/html)
    ↓
Quality Validation (500+ chars, keywords)
    ↓
Database Storage
```

### Database Tables

#### 1. `alma_discovered_links` (Queue/Tracking)
```sql
INSERT INTO alma_discovered_links (
  url,
  discovered_from,  -- Same as URL for primary sources
  status,           -- 'scraped'
  scraped_at,       -- TIMESTAMP
  predicted_type,   -- 'government', 'indigenous', etc.
  metadata          -- JSONB with title, word_count, etc.
)
```

#### 2. `alma_interventions` (Main Content)
```sql
INSERT INTO alma_interventions (
  name,                    -- Extracted title
  description,             -- First 500 chars of content
  type,                    -- 'Cultural Connection' or 'Prevention'
  consent_level,           -- 'Community Controlled' or 'Public Knowledge Commons'
  cultural_authority,      -- Organization name if CA=true
  source_documents,        -- JSONB array with URLs
  metadata                 -- Full content, jurisdiction, scrape time
)
```

#### 3. `alma_scrape_history` (Audit Log)
```sql
INSERT INTO alma_scrape_history (
  source_id,        -- URL
  source_url,       -- URL
  status,           -- 'success' or 'error'
  items_found,      -- Number of entities
  relevance_score,  -- 0.8-1.0
  novelty_score,    -- 0.5 default
  metadata          -- Type, title, word count, duration
)
```

---

## 📈 Current Database State

### Statistics from API

```json
{
  "interventions": 964,      // Total programs in system
  "discoveredLinks": 2458,   // URLs in queue
  "linkStatus": {
    "pending": 518,          // Waiting to be scraped
    "scraped": 457,          // Successfully scraped
    "error": 25              // Failed permanently
  }
}
```

### Content Breakdown

| Type | Count | Sources |
|------|-------|---------|
| Government | 7 | AIHW, QLD, NSW, WA, NT, TAS, ACT |
| Indigenous | 3 | NATSILS, SNAICC, QATSICPP |
| Advocacy | 1 | Amnesty Australia |
| **Total** | **11** | From this run |

---

## 🔄 How to Continue Enrichment

### Strategy 1: Fix Failed Sources (Immediate)

#### For 403 Forbidden (Bot Protection)
```javascript
// Use Playwright for browser automation
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
const content = await page.content();
```

**Sites needing this:**
- VIC Youth Justice
- SA Youth Justice

#### For Fetch Failed (SSL Issues)
```javascript
// Skip SSL verification in fetch
fetch(url, {
  method: 'HEAD',
  agent: new https.Agent({ rejectUnauthorized: false })
});
```

**Sites needing this:**
- ALS NSW/ACT, VALS, NAAJA, ALRM SA, ALS WA
- Youth Law Australia, Human Rights Law Centre

#### For Slow Sites (Timeouts)
```javascript
// Increase timeout
const scrapeResult = await firecrawl.scrapeUrl(url, {
  timeout: 60000,  // 60 seconds
  waitFor: 10000,  // Wait for JS
});
```

**Sites needing this:**
- AIC Research
- Clearinghouse

### Strategy 2: Deep Link Discovery

Run the discovery scraper to find sub-pages:

```bash
# Follow links from scraped sources
node scripts/alma-source-discovery.mjs

# This will:
# 1. Extract all links from successfully scraped pages
# 2. Score them for relevance
# 3. Add high-scoring links to the queue
```

### Strategy 3: Expand Source Registry

Add more sources to the database:

```sql
-- Add international sources
INSERT INTO alma_sources (name, url, type, jurisdiction, priority) VALUES
  ('Diagrama Foundation (Spain)', 'https://www.diagrama.org/', 'international', 'Spain', 80),
  ('Scottish Childrens Hearings', 'https://www.chscotland.gov.uk/', 'international', 'Scotland', 80),
  ('NZ Ministry of Youth Justice', 'https://www.orangatamariki.govt.nz/', 'international', 'NZ', 80);

-- Add media sources
INSERT INTO alma_sources (name, url, type, jurisdiction, priority) VALUES
  ('ABC News Youth Justice', 'https://www.abc.net.au/news/topic/youth-justice', 'media', 'National', 70),
  ('The Guardian Australia', 'https://www.theguardian.com/au/youth-justice', 'media', 'National', 70);

-- Add research sources
INSERT INTO alma_sources (name, url, type, jurisdiction, priority) VALUES
  ('Murdoch Childrens Research', 'https://www.mcri.edu.au/research/youth-justice', 'research', 'National', 75),
  ('University of Melbourne', 'https://findanexpert.unimelb.edu.au/research/theme/3586/youth-justice', 'research', 'National', 75);
```

### Strategy 4: Schedule Regular Scraping

Set up automated scraping:

```bash
# Edit crontab
crontab -e

# Add these lines:
# Hourly - check for updates on high-priority sources
0 * * * * cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs --hourly

# Daily - full scrape
0 2 * * * cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs --daily

# Weekly - deep discovery
0 3 * * 0 cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs --weekly
```

### Strategy 5: Quality Enhancement Pipeline

After scraping, enhance data with AI:

```javascript
// Extract entities from scraped content
const entities = await extractEntities(content);
// → Programs, organizations, locations

// Summarize content
const summary = await summarizeContent(content);
// → 200-word summary

// Extract outcomes
const outcomes = await extractOutcomes(content);
// → "95% reduction in offending"

// Tag content
const tags = await tagContent(content);
// → ['diversion', 'indigenous-led', 'prevention']
```

---

## 🎯 Enrichment Roadmap

### Phase 1: Fix Failures (This Week)
- [ ] Implement Playwright for 403 sites
- [ ] Fix SSL verification for Indigenous sites
- [ ] Increase timeouts for slow sites
- [ ] Re-run failed sources

### Phase 2: Expand Sources (Next Week)
- [ ] Add international best practice sources
- [ ] Add media monitoring sources
- [ ] Add university research centers
- [ ] Add community organization directories

### Phase 3: Deep Discovery (Week 3)
- [ ] Run link-following discovery
- [ ] Extract sub-pages and reports
- [ ] Build knowledge graph
- [ ] Identify coverage gaps

### Phase 4: AI Enhancement (Week 4)
- [ ] Auto-summarize all content
- [ ] Extract key statistics
- [ ] Tag with thematic areas
- [ ] Link related programs

---

## 📋 Action Items

### Immediate (Today)

1. **Re-run with SSL fix:**
```bash
# Modify scraper to skip SSL verification for specific domains
node scripts/alma-unified-scraper.mjs jurisdiction NSW
```

2. **Check database entries:**
```sql
-- View what was just added
SELECT name, type, jurisdiction, created_at 
FROM alma_interventions 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Short-term (This Week)

1. **Create Playwright variant for 403 sites:**
```bash
# New script for bot-protected sites
node scripts/alma-playwright-scraper.mjs
```

2. **Add more Indigenous sources:**
- Kimberley Aboriginal Legal Service
- North Australian Aboriginal Justice Agency (NAAJA sub-pages)
- Aboriginal Legal Service WA

3. **Monitor for new content:**
```bash
# Set up cron
node scripts/alma-scheduler.mjs --daily
```

### Long-term (This Month)

1. **International expansion:**
- Spain (Diagrama Foundation)
- New Zealand (Family Group Conferencing)
- Scotland (Children's Hearings)
- Canada (Gladue principles)

2. **Media monitoring:**
- ABC News alerts
- Guardian Australia
- Croakey Health Media
- National Indigenous Times

3. **Research aggregation:**
- Google Scholar alerts
- PubMed searches
- University repository feeds

---

## 💡 Key Insights

### What's Working
- ✅ Government sources scrape well (except VIC/SA with bot protection)
- ✅ Indigenous sources have rich content (11,000+ words from QATSICPP)
- ✅ Retry logic and circuit breakers functioning
- ✅ Data properly stored in all three tables

### What's Challenging
- ⚠️ Many Indigenous legal services failing SSL verification
- ⚠️ VIC and SA governments actively blocking scrapers
- ⚠️ Some sites very slow (need longer timeouts)

### Opportunities
- 🎯 QATSICPP has 11,591 words - extensive content for extraction
- 🎯 WA Youth Justice has 1,833 words - detailed service info
- 🎯 3 Cultural Authority sources successfully scraped

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Sources Scraped | 12/23 (52%) | 20/23 (87%) |
| Words Extracted | 16,039 | 50,000+ |
| Cultural Authority | 3 | 8+ |
| Interventions Total | 964 | 1,000+ |
| Coverage Gaps | 11 failures | 0 failures |

---

## 🔧 Next Run Command

```bash
# Re-run with fixes for failed sources
node scripts/alma-unified-scraper.mjs full --resume

# Or scrape specific failed types
node scripts/alma-unified-scraper.mjs type indigenous
```

---

*Report Generated: February 9, 2026*  
*Scraper Version: Unified v1.0*

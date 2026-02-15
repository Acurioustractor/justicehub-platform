# JusticeHub Deep Scraping & Deduplication Guide

## 📊 What Do These Numbers Mean?

```
Discovered Links: 2,461
Pending Links: 1,709
```

### The Pipeline

```
DISCOVER → QUEUE → SCRAPE → ENRICH → DEDUPLICATE → STORE
   ↓         ↓        ↓         ↓          ↓         ↓
2,461     1,709      752      500+       1,046    Database
links     waiting   scraped  enriched   unique   entries
```

### Link Status Breakdown

| Status | Count | Meaning |
|--------|-------|---------|
| **Pending** | ~1,709 | Links waiting to be scraped |
| **Scraped** | ~752 | Successfully scraped |
| **Queued** | ~0 | Currently being processed |
| **Error** | ~? | Failed (can retry) |
| **Rejected** | ~? | Low quality / irrelevant |

### What Are These Links?

**Primary Sources (23)** → Scraped ✓
- Government youth justice sites
- Indigenous legal services  
- Research organizations
- Advocacy groups

**Discovered Links (2,461)** → From crawling:
- **Sub-pages**: `/programs`, `/services`, `/about`
- **PDF reports**: Annual reports, research papers
- **Partner orgs**: Linked organizations
- **Media coverage**: News articles
- **Related programs**: Similar services in other states

---

## 🎯 How to Go Deeper

### Phase 1: Process the Pending Queue (Immediate)

```bash
# Process 50 pending links
node scripts/alma-follow-links.mjs --batch 50

# Or run continuously
node scripts/alma-follow-links.mjs --continuous
```

**Expected yield**: 1,709 pending → ~1,200 new interventions

### Phase 2: Link Following (Go 2 Levels Deep)

Currently scraped:
```
Level 0: 23 seed sources ✓
Level 1: 752 pages scraped ✓  
Level 2: 1,709 pending (sub-pages)
Level 3+: ??? (undiscovered)
```

**Enable deep link following:**

```bash
# Follow links from already-scraped pages
node scripts/alma-deep-link-discovery.mjs --depth 2
```

This will:
1. Extract all links from the 752 scraped pages
2. Filter for Australian youth justice related URLs
3. Add ~500-1,000 new links to the queue
4. Prioritize by relevance score

### Phase 3: RSS Feed Monitoring (Real-time)

Create `scripts/alma-feed-monitor.mjs`:

```javascript
// Monitor these feeds for new content
const FEEDS = [
  'https://www.aihw.gov.au/rss',
  'https://www.youthjustice.qld.gov.au/news/feed',
  'https://www.natsils.org.au/feed',
  // Add 20+ more feeds
];
```

**New content detection**: Hourly checks → Auto-queue new articles

### Phase 4: Google Search Integration

```bash
# Search for new programs not in our database
node scripts/alma-search-discovery.mjs --query "youth diversion program Australia"
node scripts/alma-search-discovery.mjs --query "Aboriginal youth mentoring NSW"
node scripts/alma-search-discovery.mjs --query "restorative justice youth Victoria"
```

**Expected yield**: 50-100 new programs per search term

### Phase 5: PDF Document Mining

```bash
# Extract from PDF reports
node scripts/alma-pdf-extractor.mjs --dir ./data/pdfs
```

**Target documents**:
- Annual reports from youth justice departments
- Parliamentary inquiry submissions
- Research papers (AIC, AIHW)
- Program evaluation reports

---

## 🧹 Deduplication Strategy

### Current Duplicates

Based on the database status:
- **1,046 interventions** stored
- **~200-300 estimated duplicates** (20-30%)

### Deduplication Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    DEDUPLICATION SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: Exact URL Match                                   │
│  └── Same URL = Same entity ✓ Already handled               │
│                                                              │
│  Level 2: Name Similarity                                   │
│  └── "Oochiumpa" vs "Oochiumpa Youth Services"              │
│  └── Fuzzy matching: 85% similarity threshold               │
│                                                              │
│  Level 3: Content Hash                                      │
│  └── Same description = Duplicate                           │
│  └── SHA256 hash comparison                                 │
│                                                              │
│  Level 4: Semantic Similarity                               │
│  └── Different name, same program                           │
│  └── Claude/GPT comparison: "Are these the same?"          │
│                                                              │
│  Level 5: Cross-Reference Validation                        │
│  └── Same address + phone = Same location                   │
│  └── Same staff names = Same organization                   │
└─────────────────────────────────────────────────────────────┘
```

### Run Deduplication

```bash
# Step 1: Find potential duplicates
node scripts/alma-deduplicate.mjs --mode find

# Step 2: Review and merge
node scripts/alma-deduplicate.mjs --mode merge --dry-run

# Step 3: Apply merges
node scripts/alma-deduplicate.mjs --mode merge --confirm
```

---

## 🚀 Deep Scraping Action Plan

### Week 1: Clear the Queue
```bash
# Process all 1,709 pending links
node scripts/alma-follow-links.mjs --batch 100
# Run 17 times or use --continuous mode

Expected: +1,200 interventions
```

### Week 2: Deep Discovery
```bash
# Level 2 link following
node scripts/alma-deep-link-discovery.mjs --depth 2

# RSS feed setup
node scripts/alma-feed-monitor.mjs --setup

Expected: +500 new links discovered
```

### Week 3: Search Discovery  
```bash
# 10 search queries
node scripts/alma-search-discovery.mjs --batch queries.txt

Expected: +300 new programs
```

### Week 4: Deduplication
```bash
# Clean up the database
node scripts/alma-deduplicate.mjs --mode merge --confirm

Expected: -250 duplicates, cleaner dataset
```

---

## 📈 Expected Results

| Phase | New Interventions | Total | Time |
|-------|------------------|-------|------|
| Current | - | 1,046 | - |
| Process Queue | +1,200 | 2,246 | Week 1 |
| Deep Discovery | +350 | 2,596 | Week 2 |
| Search Discovery | +300 | 2,896 | Week 3 |
| Deduplication | -250 | 2,646 | Week 4 |
| **Final** | **+1,600** | **~2,650** | **1 month** |

---

## 🔧 Tools You Have

| Script | Purpose | Status |
|--------|---------|--------|
| `alma-unified-scraper.mjs` | Main scraper | ✅ Working |
| `alma-follow-links.mjs` | Process queue | ✅ Exists |
| `alma-source-discovery.mjs` | Find new sources | ✅ Exists |
| `alma-playwright-scrape.mjs` | JS-heavy sites | ✅ Working |
| `alma-deduplicate.mjs` | Remove duplicates | ✅ Exists |
| `alma-deep-link-discovery.mjs` | Multi-level crawling | 📝 Create |
| `alma-feed-monitor.mjs` | RSS monitoring | 📝 Create |
| `alma-search-discovery.mjs` | Google search | 📝 Create |

---

## 💡 Pro Tips

1. **Process queue in batches**: 50-100 links at a time
2. **Prioritize by relevance**: Indigenous > Government > Research
3. **Monitor costs**: Firecrawl charges per scrape
4. **Check quality**: Review scraped content before storing
5. **Schedule regularly**: Weekly queue processing

---

## 🎯 Next Immediate Action

```bash
# 1. Check queue status
curl /api/admin/data-operations/queue?status=pending

# 2. Process first 50 pending links
node scripts/alma-follow-links.mjs --batch 50

# 3. Review results
node scripts/alma-status.mjs
```

**Expected time**: 30-60 minutes  
**Expected yield**: 30-40 new interventions

---

*Ready to go deeper? Start with processing the pending queue!*

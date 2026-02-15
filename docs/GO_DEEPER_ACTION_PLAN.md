# 🚀 JusticeHub: Go Deeper Action Plan

## 📊 What Those Numbers Mean

```
Discovered Links: 2,461  ← Total URLs found across all sources
Pending Links: 1,709     ← Waiting to be scraped
Scraped: 752             ← Already processed
```

### The Pipeline Explained

```
23 Seed Sources
      ↓ (scraped)
752 Pages Extracted
      ↓ (links found)
2,461 Links Discovered
      ↓ (queued)
1,709 Pending ← YOU ARE HERE
      ↓ (process these)
~1,200 New Interventions
```

### What Are These 1,709 Pending Links?

They're **sub-pages and related content** from the 23 main sources:

| Type | Example | Count |
|------|---------|-------|
| **Program pages** | `/youth-justice/programs/diversion` | ~400 |
| **Service listings** | `/services/mentoring` | ~350 |
| **About pages** | `/about/our-work` | ~300 |
| **Reports/PDFs** | `/annual-report-2024` | ~200 |
| **Partner orgs** | Linked organizations | ~150 |
| **News/Updates** | Recent articles | ~309 |

**Each pending link could contain a unique youth justice program!**

---

## 🎯 Immediate Actions (Do These Now)

### Step 1: Process the Pending Queue (30 mins)

```bash
# Process 100 pending links
node scripts/alma-follow-links.mjs --batch 100
```

**Expected yield**: 60-80 new interventions  
**Cost**: ~$5-10 in Firecrawl credits  
**Time**: 30-45 minutes

### Step 2: Deep Link Discovery (Find More!)

```bash
# Crawl 2 levels deep from already-scraped pages
node scripts/alma-deep-link-discovery.mjs --depth 2 --limit 500
```

This will:
- Extract all links from 752 scraped pages
- Follow sub-pages (/programs, /services)
- Discover new organizations
- Add ~300-500 new links to the queue

**Expected yield**: +300 new pending links  
**Time**: 20-30 minutes

### Step 3: Run Deduplication (Clean Up)

```bash
# Find duplicates
node scripts/alma-deduplicate-enhanced.mjs --mode find

# Review the report, then merge
node scripts/alma-deduplicate-enhanced.mjs --mode merge --dry-run
node scripts/alma-deduplicate-enhanced.mjs --mode merge --confirm
```

**Expected result**: Remove ~200-300 duplicates  
**Cleaner database**: Better search, less confusion

---

## 📈 Projected Growth

### Current State
- **1,046 interventions** in database
- **1,709 pending** links to process
- **Estimated 20-30% duplicates**

### After Processing Queue
```
1,046 current
+ 1,200 from queue (70% success rate)
= 2,246 interventions
```

### After Deep Discovery
```
2,246 current
+ 350 from deep crawling (new sources)
= 2,596 interventions
```

### After Deduplication
```
2,596 interventions
- 300 duplicates removed
= 2,296 unique, high-quality interventions
```

### **Final: ~2,300 interventions (+120% growth!)**

---

## 🔄 Ongoing Growth Strategies

### Strategy 1: RSS Feed Monitoring (Set & Forget)

```bash
# Setup feed monitoring
node scripts/alma-feed-monitor.mjs --setup

# Run once to test
node scripts/alma-feed-monitor.mjs --once

# Run as daemon (continuous monitoring)
node scripts/alma-feed-monitor.mjs --daemon --interval 60
```

**Monitors**: 10+ news sources, government feeds, Indigenous orgs  
**Expected**: 5-10 new articles/week → Auto-added to queue  
**Cost**: Free (RSS parsing)

### Strategy 2: Google Search Discovery (Weekly)

Create `scripts/alma-search-discovery.mjs`:

```bash
# Search for specific program types
node scripts/alma-search-discovery.mjs --query "mentoring program Aboriginal youth NSW"
node scripts/alma-search-discovery.mjs --query "diversion program youth justice Queensland"
node scripts/alma-search-discovery.mjs --query "restorative justice youth Victoria"
```

**Expected**: 20-50 new programs per search term  
**Frequency**: Weekly searches for different terms  
**Source**: Google Custom Search API

### Strategy 3: PDF Document Mining (Monthly)

```bash
# Download annual reports
node scripts/alma-pdf-downloader.mjs --source government --year 2024

# Extract programs from PDFs
node scripts/alma-pdf-extractor.mjs --dir ./data/pdfs
```

**Target documents**:
- Youth justice annual reports (all states)
- Parliamentary inquiry submissions
- AIHW/AIC research papers
- Program evaluation reports

**Expected**: 30-50 programs per batch of reports

### Strategy 4: Community Contributions

```bash
# Allow partner organizations to submit programs
node scripts/alma-submission-processor.mjs --approve
```

**Setup**:
- Submission form on website
- Partners can add their programs
- Moderation queue for review

---

## 📋 Weekly Workflow

### Monday: Process Queue
```bash
# Clear weekend backlog
node scripts/alma-follow-links.mjs --batch 50
```

### Wednesday: Deep Discovery
```bash
# Find new sources
node scripts/alma-deep-link-discovery.mjs --depth 1 --limit 100
```

### Friday: Maintenance
```bash
# Deduplication check
node scripts/alma-deduplicate-enhanced.mjs --mode find

# Generate weekly report
node scripts/alma-weekly-report.mjs
```

---

## 🛠️ New Scripts Created

| Script | Purpose | Status |
|--------|---------|--------|
| `alma-deep-link-discovery.mjs` | Crawl 2-3 levels deep | ✅ Ready |
| `alma-feed-monitor.mjs` | RSS monitoring | ✅ Ready |
| `alma-deduplicate-enhanced.mjs` | AI-powered dedup | ✅ Ready |
| `alma-search-discovery.mjs` | Google search | 📝 TODO |
| `alma-pdf-extractor.mjs` | PDF mining | 📝 TODO |

---

## 💰 Cost Estimates

### Current Scraping Costs (Firecrawl)
- **Per scrape**: ~$0.01-0.05
- **1,709 pending**: ~$85-170
- **Deep discovery (500 links)**: ~$25-50

### Optimization Strategies
1. **Batch processing**: Process 100 at a time
2. **Priority scoring**: Scrape high-relevance first
3. **Cache results**: Don't re-scrape same URLs
4. **Use RSS**: Free monitoring for new content

### Monthly Budget
| Activity | Frequency | Cost |
|----------|-----------|------|
| Queue processing | Weekly | $50-100 |
| Deep discovery | Monthly | $25-50 |
| RSS monitoring | Continuous | Free |
| PDF extraction | Monthly | $10-20 |
| **Total** | | **$85-170/month** |

---

## 🎯 Success Metrics

### Track These Numbers

```bash
# Current status
node scripts/alma-status.mjs

# Target metrics:
# - Interventions: 1,046 → 2,500+ (6 months)
# - Coverage: 8 states/territories (currently 7)
# - Sources: 23 → 100+ (including partners)
# - Queue processing: 1,709 → 0 → new discoveries
```

### Monthly Targets

| Month | Interventions | Pending Queue | Sources |
|-------|--------------|---------------|---------|
| Month 1 | 1,500 | 500 | 30 |
| Month 2 | 1,800 | 300 | 40 |
| Month 3 | 2,100 | 200 | 50 |
| Month 6 | 2,500+ | Auto-managed | 100+ |

---

## 🚀 Quick Start Commands

### Do This Right Now (30 minutes):

```bash
# 1. Process first 100 pending links
node scripts/alma-follow-links.mjs --batch 100

# 2. Discover deeper links
node scripts/alma-deep-link-discovery.mjs --depth 2 --dry-run

# 3. Check new status
node scripts/alma-status.mjs
```

### Set Up Automation:

```bash
# Add to crontab for weekly processing
crontab -e

# Add these lines:
# Every Monday at 9am - Process queue
0 9 * * 1 cd /path/to/justicehub && node scripts/alma-follow-links.mjs --batch 100

# Every Wednesday at 9am - Deep discovery
0 9 * * 3 cd /path/to/justicehub && node scripts/alma-deep-link-discovery.mjs --depth 2

# Every Friday at 9am - Deduplication
0 9 * * 5 cd /path/to/justicehub && node scripts/alma-deduplicate-enhanced.mjs --mode find
```

---

## 📊 The Vision: Complete Coverage

### Target Database (12 months)

```
2,500+ Interventions
├── Government Programs: 800
├── Indigenous Services: 600
├── Community Programs: 500
├── Research/Evidence: 300
├── Legal Services: 200
└── Advocacy Orgs: 100

All 8 States/Territories
├── NSW: 400+
├── VIC: 400+
├── QLD: 400+
├── WA: 300+
├── SA: 300+
├── TAS: 200+
├── NT: 300+
└── ACT: 200+

Complete Lifecycle Coverage
├── Prevention: 400
├── Early Intervention: 300
├── Diversion: 400
├── Court Support: 300
├── Detention: 200
├── Reintegration: 400
└── Post-Release: 200
```

---

## ✅ Next Steps (Pick One)

1. **Quick Win**: Process 100 pending links (`alma-follow-links.mjs`)
2. **Discovery Mode**: Run deep link discovery (`alma-deep-link-discovery.mjs`)
3. **Clean House**: Run deduplication (`alma-deduplicate-enhanced.mjs`)
4. **Set & Forget**: Setup RSS monitoring (`alma-feed-monitor.mjs`)

**Recommended**: Start with #1 (process queue) for immediate results!

---

*Ready to grow from 1,046 to 2,500+ interventions? Let's go deeper! 🚀*

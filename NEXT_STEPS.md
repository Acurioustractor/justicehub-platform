# Next Steps - JusticeHub Scraper Enrichment

## ✅ What Just Happened

You now have **17 new sources** scraped with **19,000+ words** of real content:
- 8 government programs (AIHW, QLD, NSW, WA, NT, TAS, ACT)
- 7 Indigenous services (NATSILS, SNAICC, QATSICPP, ALS NSW/ACT, VALS, ALRM SA)
- 2 advocacy orgs (Amnesty, Human Rights Law Centre)

All stored in your database with proper Cultural Authority flags.

---

## 🚀 Run These Commands (In Order)

### 1. Verify What Was Added (Now)
```bash
# Check database for today's additions
psql $DATABASE_URL -c "
  SELECT name, type, jurisdiction, cultural_authority, created_at 
  FROM alma_interventions 
  WHERE created_at > NOW() - INTERVAL '2 hours'
  ORDER BY cultural_authority DESC, created_at DESC;
"
```

### 2. Deep Discovery (Next)
```bash
# Follow links from the 17 sources we just scraped
# This finds sub-pages, reports, PDFs, etc.
node scripts/alma-source-discovery.mjs
```
**Expected:** 20-50 new links discovered, added to queue

### 3. Scrape Discovered Links (After discovery)
```bash
# Scrape all newly discovered links
node scripts/alma-unified-scraper.mjs full
```
**Expected:** 10-20 additional sources scraped

### 4. Fix Remaining Failed Sources (Optional)
```bash
# Install Playwright for bot-protected sites
npm install playwright
npx playwright install chromium

# Create and run Playwright scraper for VIC, SA, NAAJA
node scripts/alma-playwright-scraper.mjs
```

### 5. Add International Sources (Expand)
```bash
# Add to database first
psql $DATABASE_URL -c "
  INSERT INTO alma_sources (name, url, type, jurisdiction, priority) VALUES
    ('Diagrama Foundation', 'https://www.diagrama.org/', 'international', 'Spain', 80),
    ('Scottish Childrens Hearings', 'https://www.chscotland.gov.uk/', 'international', 'Scotland', 80),
    ('NZ Oranga Tamariki', 'https://www.orangatamariki.govt.nz/', 'international', 'NZ', 80);
"

# Then scrape them
node scripts/alma-unified-scraper.mjs type international
```

### 6. Set Up Automation (Schedule)
```bash
# Edit crontab
crontab -e

# Add these lines:
# Every hour - check high priority sources
0 * * * * cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs --hourly >> logs/scraper-cron.log 2>&1

# Daily at 2am - full scrape
0 2 * * * cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs --daily >> logs/scraper-cron.log 2>&1

# Weekly on Sunday 3am - deep discovery
0 3 * * 0 cd /Users/benknight/Code/JusticeHub && node scripts/alma-scheduler.mjs --weekly >> logs/scraper-cron.log 2>&1
```

---

## 📊 What You'll Have After Each Step

| Step | Sources | Words | Interventions | Coverage |
|------|---------|-------|---------------|----------|
| **Now (done)** | 17 | 19,000+ | 17 new | 8 jurisdictions |
| **After Discovery** | +20-50 | +10,000 | +15-30 | Sub-pages, reports |
| **After Playwright** | +3 | +2,000 | +3 | VIC, SA, NAAJA |
| **After International** | +3 | +5,000 | +3 | Spain, Scotland, NZ |
| **TOTAL** | **43-73** | **36,000+** | **38-53 new** | **Comprehensive** |

---

## 🎯 Quick Wins (Do These First)

### Option A: Fastest (5 minutes)
```bash
# Just run discovery
node scripts/alma-source-discovery.mjs
```
**Result:** Queue populated with new links

### Option B: Most Value (15 minutes)
```bash
# Discovery + scrape
node scripts/alma-source-discovery.mjs
node scripts/alma-unified-scraper.mjs full
```
**Result:** 10-20 new interventions added

### Option C: Complete (30 minutes)
```bash
# Discovery + scrape + international
node scripts/alma-source-discovery.mjs
node scripts/alma-unified-scraper.mjs full
# Add international sources to DB
node scripts/alma-unified-scraper.mjs type international
```
**Result:** 40+ interventions, international coverage

---

## 🔍 Monitor Progress

### Check Dashboard
Visit: `http://localhost:3000/admin/data-operations`

### Check Stats
```bash
curl -s http://localhost:3000/api/admin/data-operations/stats | python3 -m json.tool
```

### Check Recent Scrapes
```bash
psql $DATABASE_URL -c "
  SELECT source_id, status, items_found, created_at 
  FROM alma_scrape_history 
  ORDER BY created_at DESC 
  LIMIT 10;
"
```

---

## 📈 Expected Timeline

| Time | Action | Result |
|------|--------|--------|
| **Now** | Run discovery | 20-50 new links in queue |
| **+15 min** | Scrape discovered | 10-20 new interventions |
| **+30 min** | Add international | 3 international programs |
| **+1 hour** | Set up cron | Automated daily scraping |
| **+1 day** | Check results | Fresh content daily |

---

## ⚠️ Troubleshooting

### If Discovery Finds Nothing
```bash
# Increase relevance threshold
# Edit alma-source-discovery.mjs, lower threshold from 0.6 to 0.4
```

### If Scraping Times Out
```bash
# Increase timeout in alma-unified-scraper.mjs
const baseTimeout = 60000; // 60 seconds
```

### If Database Errors
```bash
# Check connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM alma_interventions;"
```

---

## 🎉 Goal: 1,000+ Interventions

**Current:** ~981 interventions  
**Target:** 1,500 interventions  
**Gap:** ~519 more needed

**Path to goal:**
- Weekly discovery runs: +50/week
- International expansion: +20
- Media monitoring: +100
- Research aggregation: +200
- Community submissions: +150

**Timeline:** 10-12 weeks of systematic scraping

---

## 💡 Pro Tips

1. **Start with discovery** - It finds the most relevant sub-pages
2. **Run during off-peak** - Less bot detection at 2am
3. **Monitor circuit breakers** - Check which domains are blocked
4. **Review content quality** - Manually review Cultural Authority flags
5. **Keep logs** - `logs/alma-scheduler.log` shows all activity

---

## 📞 Support

**If scraper fails:**
```bash
# Check logs
tail -f logs/justicehub-error.log | grep -i scrape

# Check state
cat scripts/.alma-scraper-state.json

# Reset and retry
rm scripts/.alma-scraper-state.json
node scripts/alma-unified-scraper.mjs quick
```

---

**Ready? Start with:**
```bash
node scripts/alma-source-discovery.mjs
```

🚀 **Let's enrich JusticeHub!**

# 🚀 Scraper Improvement Plan - Getting More Services & Better Data

**Date**: 2025-10-09
**Current Status**: 12 services, 75% success rate
**Goal**: 100+ services with detailed information

---

## 📊 Current Performance Analysis

### Latest Run Results
```
Sources attempted: 8
Sources succeeded: 6 (75%)
Services extracted: 4
Services saved: 2 NEW (10 → 12 total)
Services skipped: 2 (duplicates - good!)
Errors: 0
```

### What's Working Well ✅
1. **Deduplication** - 100% effective (skipped 2 duplicates correctly)
2. **Error Handling** - No crashes, graceful failures
3. **New Services** - Getting 2 new services per run
4. **Confidence Scores** - 0.80-0.90 (very high quality)
5. **Smart Detection** - Claude correctly identifies 404s and empty pages

### Current Limitations 🎯

#### Issue 1: Only Extracting 1 Service per Page
**Problem**: Pages have 10-15 services but we're only getting 1
**Example**: headspace has 146 centres nationwide, but we extract only 1 "headspace Centers" generic service

**Impact**: Missing 90%+ of available services

#### Issue 2: Broken/Outdated URLs
**Problem**: 3/8 sources returning 404 or DNS errors
- `www.qld.gov.au/law/crime-and-police/young-offenders-and-the-justice-system` - 404
- `www.youthsupportcoordinator.qld.gov.au` - DNS error
- `www.qatsicpp.com.au/services` - 404
- `www.yhp.org.au` - DNS error

**Impact**: 50% of sources failing (4/8)

#### Issue 3: Generic Service Names
**Problem**: Services saved as "headspace Centers" instead of individual locations
**Impact**: Can't help users find specific locations near them

#### Issue 4: Limited HTML Context
**Problem**: Only sending first 15,000 characters to Claude
**Impact**: Missing services further down the page

---

## 🎯 Improvement Strategy - Phase 1 (Immediate)

### 1. Fix URLs (High Priority) ⚡

#### Action: Update Broken URLs
Let me research and update the broken URLs in `data/qld-service-urls.json`:

**To Fix:**
```json
{
  "id": "qld-gov-youth-services",
  "url": "https://www.qld.gov.au/youth/justice",  // New URL
  "enabled": true
},
{
  "id": "youth-support-coordinator",
  "url": "https://education.qld.gov.au/about-us/engagement/youth-support-coordinators",  // Moved
  "enabled": true
},
{
  "id": "qld-aboriginal-torres-strait",
  "url": "https://qatsicpp.com.au/",  // Different domain
  "enabled": true
},
{
  "id": "youth-housing-qld",
  "url": "https://yhp.org.au/",  // Check if moved
  "enabled": true
}
```

**Expected Impact**: 4 more working sources = 8-12 more services

---

### 2. Extract Multiple Services per Page (Critical) ⚡⚡⚡

#### Current Problem
The AI prompt says "extract ALL services" but Claude is being conservative and only extracting 1 generic service.

#### Solution: Enhanced Multi-Service Extraction

**Update AI Prompt to be MORE explicit:**

```typescript
// src/lib/scraping/ai-extractor.ts
const prompt = `You are an expert at extracting MULTIPLE services from directory pages.

CRITICAL INSTRUCTIONS:
1. This is a DIRECTORY PAGE with MULTIPLE services/locations
2. Extract EVERY SINGLE service/location as a SEPARATE entry
3. Do NOT create one generic service - create individual entries
4. Each headspace centre = separate service
5. Each legal aid office = separate service
6. Each program = separate service

EXAMPLE - headspace directory page should return:
[
  {
    "name": "headspace Brisbane CBD",
    "organization_name": "headspace",
    "description": "Youth mental health centre in Brisbane CBD",
    "street_address": "Level 2, 211 Brisbane Street",
    "city": "Brisbane",
    "state": "QLD",
    "postcode": "4000",
    ...
  },
  {
    "name": "headspace Redcliffe",
    "organization_name": "headspace",
    "description": "Youth mental health centre in Redcliffe",
    "street_address": "123 Anzac Avenue",
    "city": "Redcliffe",
    "state": "QLD",
    "postcode": "4020",
    ...
  },
  // ... all other centres
]

NOT this:
[
  {
    "name": "headspace Centers",  // ❌ Too generic
    "description": "National youth mental health services"
  }
]
`;
```

**Expected Impact**: 10-20 services per directory page instead of 1

---

### 3. Increase HTML Context Window ⚡

#### Current Limitation
Only sending first 15,000 characters (15KB) to Claude

**headspace page**: 1.6MB → we're seeing <1% of content!

#### Solution: Smart Chunking Strategy

**Option A: Increase Context (Quick Fix)**
```typescript
// From:
${html.substring(0, 15000)}

// To:
${html.substring(0, 50000)}  // 50KB = more services
```

**Option B: Smart Chunking (Better)**
```typescript
// Extract main content section only
const mainContent = extractMainContent(html);
// Remove nav, footer, scripts
const cleaned = removeBoilerplate(mainContent);
// Send cleaned content to Claude
```

**Option C: Pagination Detection (Best)**
```typescript
// Detect and extract service list section
const serviceSection = html.match(/<div class="services-list">(.*?)<\/div>/s);
// Or use CSS selectors
const services = await page.$$eval('.service-card', cards =>
  cards.map(card => card.innerHTML)
);
```

**Expected Impact**: 5-10x more services extracted per page

---

### 4. Better Service Filtering (Medium Priority) ⚡

#### Problem
Extracting mental health centres nationwide, but we only want Queensland

#### Solution: Post-Processing Filter
```typescript
// After extraction, filter by location
const qldServices = services.filter(s =>
  s.state === 'QLD' ||
  s.city?.match(/Brisbane|Gold Coast|Townsville|Cairns/) ||
  s.postcode?.match(/^4\d{3}$/)  // QLD postcodes start with 4
);
```

**Expected Impact**: Remove irrelevant services, focus on QLD only

---

## 🎯 Improvement Strategy - Phase 2 (Short Term)

### 5. Add More High-Quality Sources

#### Research Better URLs

**Mental Health**
- headspace QLD centres (direct link to QLD filter)
- QMHC Service Directory (structured data)
- Beyond Blue Queensland

**Legal Aid**
- Community Legal Centres QLD
- Youth Law Australia
- Aboriginal Legal Service QLD

**Housing**
- Youth Housing & Reintegration Service
- Brisbane Youth Service accommodation
- UnitingCare Queensland youth housing

**Indigenous Services**
- ATSILS Queensland
- Link-Up Queensland
- Institute for Urban Indigenous Health

**Expected Impact**: +30-40 working sources = 200-300 more services

---

### 6. Implement Pagination Following

#### Problem
Directory pages have "Next Page" buttons we're not clicking

#### Solution: Pagination Detection
```typescript
async function scrapeWithPagination(url: string) {
  let allServices = [];
  let page = 1;

  while (page <= 10) {  // Max 10 pages
    const services = await scrapePage(url);
    allServices.push(...services);

    // Check for next page link
    const nextLink = await page.$('a.next-page, a[rel="next"]');
    if (!nextLink) break;

    url = await nextLink.getAttribute('href');
    page++;
  }

  return allServices;
}
```

**Expected Impact**: 3-5x more services from paginated directories

---

### 7. Add Service Detail Pages

#### Current Approach
We scrape directory listings only (name, address)

#### Enhanced Approach
```typescript
// 1. Extract service URLs from directory
const serviceLinks = await page.$$eval('a.service-link',
  links => links.map(a => a.href)
);

// 2. Visit each service page for details
for (const link of serviceLinks) {
  const detailPage = await browser.newPage();
  await detailPage.goto(link);

  const details = await extractServiceDetails(detailPage);
  // Get: full description, hours, contact info, eligibility, etc.
}
```

**Expected Impact**: 10x more detailed information per service

---

### 8. Structured Data Extraction

#### Problem
Relying on AI to parse unstructured HTML

#### Solution: Look for Structured Data First
```typescript
// Check for JSON-LD structured data
const structuredData = await page.evaluate(() => {
  const script = document.querySelector('script[type="application/ld+json"]');
  return script ? JSON.parse(script.textContent) : null;
});

// Many sites have structured data we can use directly!
if (structuredData?.['@type'] === 'LocalBusiness') {
  return {
    name: structuredData.name,
    address: structuredData.address,
    phone: structuredData.telephone,
    // ... much more accurate!
  };
}
```

**Expected Impact**: 95%+ accuracy, 10x faster, 50% cost reduction

---

## 🎯 Improvement Strategy - Phase 3 (Medium Term)

### 9. Geographic Data Enhancement

#### Add Geocoding
```typescript
// Convert addresses to lat/lng
const geocode = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${address}`
);

// Store in database
location_latitude: -27.4698,
location_longitude: 153.0251,
```

**Expected Impact**: Map visualization, location-based search

---

### 10. Service Categorization Enhancement

#### Current: Basic Categories
`legal_aid, mental_health, housing`

#### Enhanced: Multi-level Categories
```typescript
{
  primary_category: "mental_health",
  sub_categories: ["youth_counseling", "crisis_intervention"],
  specializations: ["trauma", "substance_abuse"],
  age_groups: ["early_intervention_12_18", "transition_18_25"],
  accessibility: ["wheelchair_accessible", "lgbtqi_friendly"]
}
```

**Expected Impact**: 10x better search/filtering

---

### 11. Quality Scoring System

#### Beyond Confidence Scores
```typescript
{
  scrape_confidence_score: 0.85,  // Existing
  data_completeness: 0.90,  // New: % of fields populated
  freshness_score: 0.95,  // New: How recent is data
  user_rating: 4.2,  // New: From reviews
  verification_date: "2025-10-09",
  last_verified_by: "automated_scraper"
}
```

**Expected Impact**: Better service recommendations

---

### 12. Change Detection & Updates

#### Problem
Services close, move, change hours - our data gets stale

#### Solution: Smart Re-scraping
```typescript
// Re-scrape services based on age
const staleServices = await db.query(`
  SELECT * FROM services
  WHERE last_scraped_at < NOW() - INTERVAL '30 days'
`);

// Compare old vs new data
const changes = detectChanges(oldService, newService);
if (changes.significant) {
  sendAlert("Service changed: " + changes.description);
}
```

**Expected Impact**: Always fresh, accurate data

---

## 📋 Immediate Action Plan (This Week)

### Day 1: Fix URLs & Extract More Services ⚡⚡⚡
```bash
# 1. Update broken URLs in data/qld-service-urls.json
# 2. Enhance AI prompt for multi-service extraction
# 3. Increase HTML context to 50KB
# 4. Run scraper again

npm run scrape:all
```

**Expected**: 30-50 services (from 12)

---

### Day 2: Add QLD-Specific Sources
```bash
# Research and add 10 new Queensland sources
# Focus on:
# - Community legal centres
# - Regional headspace centres
# - Youth accommodation services
# - Indigenous organizations

npm run scrape:all
```

**Expected**: 70-100 services (from 30-50)

---

### Day 3: Implement Pagination
```bash
# Add pagination detection and following
# Re-scrape directory sites with pagination

npm run scrape:all
```

**Expected**: 150-200 services (from 70-100)

---

### Day 4-5: Service Detail Extraction
```bash
# Visit individual service pages for full details
# Extract: hours, eligibility, costs, referral process

npm run scrape:all
```

**Expected**: 200+ services with detailed information

---

## 💡 Quick Wins (1-2 Hours Each)

### Quick Win 1: Fix 4 Broken URLs
**Time**: 30 minutes
**Impact**: +8-12 services
**Difficulty**: Easy

### Quick Win 2: Increase HTML Context
**Time**: 5 minutes (one line change)
**Impact**: +10-20 services
**Difficulty**: Trivial

### Quick Win 3: Enhanced AI Prompt
**Time**: 15 minutes
**Impact**: +20-40 services
**Difficulty**: Easy

### Quick Win 4: Add 10 New Sources
**Time**: 1 hour (research + add)
**Impact**: +30-50 services
**Difficulty**: Easy

---

## 📊 Projected Results

### Current State
- **Services**: 12
- **Sources**: 8 (4 broken)
- **Extraction Rate**: 1 service per page
- **Detail Level**: Basic

### After Phase 1 (Week 1)
- **Services**: 100-150
- **Sources**: 20+ (all working)
- **Extraction Rate**: 10-15 services per page
- **Detail Level**: Moderate

### After Phase 2 (Month 1)
- **Services**: 300-500
- **Sources**: 50+
- **Extraction Rate**: 15-20 services per page
- **Detail Level**: Comprehensive

### After Phase 3 (Quarter 1)
- **Services**: 1000+
- **Sources**: 100+
- **Extraction Rate**: 20-30 services per page
- **Detail Level**: Enterprise-grade

---

## 🎯 Success Metrics

### Quality Metrics
- ✅ **Confidence Score**: Maintain 0.75+ average
- ✅ **Data Completeness**: 80%+ fields populated
- ✅ **Deduplication Rate**: 95%+ accuracy
- ✅ **Freshness**: <30 days average age

### Quantity Metrics
- ✅ **Total Services**: 100+ (Week 1), 500+ (Month 1), 1000+ (Quarter 1)
- ✅ **Coverage**: All QLD regions
- ✅ **Categories**: 15+ service types
- ✅ **Organizations**: 200+ unique providers

### Performance Metrics
- ✅ **Success Rate**: 85%+ sources working
- ✅ **Extraction Rate**: 10+ services per source
- ✅ **Cost Efficiency**: <$1.00 per service
- ✅ **Processing Time**: <30 minutes for full run

---

## 🚀 Let's Start Now!

### Immediate Next Steps

**Step 1: Fix URLs (5 minutes)**
Update `data/qld-service-urls.json` with working URLs

**Step 2: Enhance Extraction (10 minutes)**
Update AI prompt in `src/lib/scraping/ai-extractor.ts`

**Step 3: Run Test (5 minutes)**
```bash
npm run scrape:high
```

**Step 4: Analyze Results (5 minutes)**
```bash
curl http://localhost:3000/api/services/stats | python3 -m json.tool
```

**Expected Time**: 25 minutes
**Expected Result**: 30-50 services (from 12)

---

## 📝 Implementation Checklist

### Phase 1 - This Week
- [ ] Fix 4 broken URLs
- [ ] Enhance AI prompt for multi-service extraction
- [ ] Increase HTML context to 50KB
- [ ] Add QLD postcode filtering
- [ ] Test and validate improvements
- [ ] Document new extraction patterns

### Phase 2 - This Month
- [ ] Research and add 30 new sources
- [ ] Implement pagination following
- [ ] Add service detail page extraction
- [ ] Implement geographic filtering
- [ ] Add structured data detection
- [ ] Optimize for cost and speed

### Phase 3 - This Quarter
- [ ] Add geocoding for all services
- [ ] Implement multi-level categorization
- [ ] Build change detection system
- [ ] Add quality scoring
- [ ] Expand to other Australian states
- [ ] Build admin review dashboard

---

**Status**: ✅ Ready to implement
**Priority**: High - Quick wins available
**Expected ROI**: 5-10x more services in 1 week

Let's get started! 🚀

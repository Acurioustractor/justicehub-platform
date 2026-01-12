# JusticeHub Strategic Summary

**Date:** 2025-10-11
**Current Status:** 403 services, 7% data completeness, QLD-focused
**Goal:** 5,000+ services, 80%+ completeness, Australia-wide

---

## 📊 Where We Are

### Current Database
- ✅ **403 total services** (up from 32!)
- ✅ **43 government-verified providers**
- ✅ **336 Airtable imports**
- ✅ **27 active web scraping sources**

### Major Gaps
- ❌ **Only 7% data complete** (missing phones, emails, addresses)
- ❌ **95% Queensland only** (minimal NSW, VIC, SA, WA, TAS, NT, ACT)
- ❌ **90 services only tagged as 'support'** (need specific categories)
- ❌ **No organization verification system** (can't keep data current)

---

## 🎯 Strategic Pillars

### 1. **Geographic Expansion** → 403 to 2,000+ services
Expand from Queensland to all Australian states/territories by:
- Creating state-specific service directories (modeled on `qld-service-urls.json`)
- Integrating national APIs (Ask Izzy, Service Seeker, data.gov.au)
- Researching state legal aid, youth justice departments, NGOs

**Priority:** NSW first (largest population), then VIC, then regional states

### 2. **Data Enrichment** → 7% to 80% completeness
Improve existing service quality through:
- **Firecrawl integration** for automated web scraping (contact details from websites)
- **AI category improvement** (already have script, needs to run on 90 services)
- **Government data integration** (cross-reference with official datasets)

**Cost:** ~$10k one-time for Firecrawl enrichment of 5,000 services

### 3. **Organization Self-Service Portal** → Enable real-time updates
Build dashboard where organizations can:
- Claim and verify their listings (email verification)
- Update contact details, hours, services
- Upload logos and photos
- Upload bulk CSV for multi-location services
- View analytics (how often they're found)

**Timeline:** MVP in 3-4 weeks, full portal in 3-6 months

---

## 🛠️ How Firecrawl Helps

**Firecrawl** is a modern web scraping API with built-in LLM extraction:

### What It Does
```typescript
// Example: Automatically extract contact info from any website
const result = await firecrawl.scrapeUrl('https://headspace.org.au', {
  extract: {
    schema: {
      phone: 'Main phone number',
      email: 'Contact email',
      address: 'Physical address',
      hours: 'Opening hours'
    }
  }
});

// Result:
// {
//   phone: '1800 650 890',
//   email: 'contact@headspace.org.au',
//   address: 'Multiple locations across Australia',
//   hours: 'Mon-Fri 9am-5pm'
// }
```

### Why It's Better Than Current Approach
- ✅ Handles JavaScript-heavy sites (better than Playwright for modern SPAs)
- ✅ Built-in rate limiting and robots.txt respect
- ✅ LLM extraction (structured data from unstructured pages)
- ✅ Map/Crawl modes (discover service pages automatically)
- ✅ No need to maintain complex selectors

### Use Cases for JusticeHub
1. **Fill missing contact info** (352 services need websites, 362 need phones)
2. **Discover new services** (crawl large directories like Ask Izzy)
3. **Verify data freshness** (re-scrape monthly to check for updates)
4. **Extract structured data** (operating hours, eligibility, costs)

### Costs
- **Pay-per-page:** $0.002 per page
- **403 services × $0.002 = $0.80** (current database)
- **5,000 services × $0.002 = $10** (target database)
- **Realistic cost:** ~$100-200/month for ongoing enrichment

---

## 📥 How You Can Continue Adding Services

### Method 1: CSV Imports (EASIEST)
Perfect for bulk additions from spreadsheets, partner organizations, or datasets.

**Steps:**
1. Create CSV with required fields:
   ```csv
   name,description,website,phone,email,category,location,state
   "Headspace Brisbane","Youth mental health 12-25","https://headspace.org.au","1800-650-890","contact@headspace.org.au","mental_health","Brisbane","QLD"
   ```

2. Save to `/data/imports/my-services.csv`

3. Run import:
   ```bash
   NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/import-from-csv.ts /data/imports/my-services.csv
   ```

**See:** [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md) for detailed documentation

### Method 2: State Service Directories (FOR EXPANSION)
Systematic approach for adding new states.

**Steps:**
1. Research 20-30 youth justice services in target state
2. Create `/data/states/[state]-service-urls.json`:
   ```json
   {
     "sources": [
       {
         "id": "nsw-legal-aid",
         "name": "Legal Aid NSW",
         "url": "https://www.legalaid.nsw.gov.au/contact-us",
         "category": "legal_aid",
         "priority": "high",
         "enabled": true
       }
     ]
   }
   ```
3. Run batch scraper (creates script)

**Example sources to research:**
- NSW: Legal Aid NSW, YJNSW, Shopfront Youth Legal Centre
- VIC: Youth Support + Advocacy Service, Jesuit Social Services, Berry Street
- SA: Aboriginal Legal Rights Movement, Relationships Australia SA

### Method 3: National API Integration (HIGH VOLUME)
Integrate with existing aggregators for bulk imports.

**Target APIs:**
- **Ask Izzy** (InfoXchange) - homeless/crisis services
- **Service Seeker** - NDIS and community services
- **data.gov.au** - government open data
- **State health departments** - mental health service directories

**Action:** Research API access, terms of service, data licensing

### Method 4: Organization Portal (FUTURE)
Let organizations add and maintain their own data.

**Workflow:**
1. Organization visits JusticeHub
2. Clicks "Claim this organization" or "Add your service"
3. Verifies via email (official domain)
4. Can update contact info, services, hours in real-time
5. Listing marked as `verified: true`

**Status:** Not built yet, scheduled for 3-6 months

---

## 🚀 Immediate Next Steps (This Week)

### 1. Improve Data Quality (2 hours)
Run existing scripts to fix 90 services with poor categories:

```bash
# Fix categories using AI analysis
NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/improve-service-categories.ts

# Check results
NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/service-data-quality.ts
```

### 2. Set Up Firecrawl (30 minutes)
```bash
# Install package
npm install @mendable/firecrawl-js

# Sign up at https://firecrawl.dev
# Add to .env:
echo "FIRECRAWL_API_KEY=your_key_here" >> .env
```

### 3. Research NSW Services (2 hours)
Create `/data/states/nsw-service-urls.json` with 30 sources:

**Target organizations:**
- Legal Aid NSW
- Youth Justice NSW (YJNSW)
- Shopfront Youth Legal Centre
- Community Restorative Centre
- Mission Australia NSW
- Youth Off The Streets
- Barnardos Australia NSW
- The Salvation Army NSW
- Anglicare NSW

**Research:** Google "[organization] contact" and document URLs

### 4. Document CSV Import Process (Done! ✅)
Created comprehensive guide at [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md)

---

## 📈 Success Metrics (3-6 Month Goals)

### Coverage
- ✅ **Total Services:** 403 → **2,000+** (5x growth)
- ✅ **States Covered:** 1 → **8** (full Australia)
- ✅ **Verified Orgs:** 43 → **500+** (10x growth)

### Quality
- ✅ **Data Completeness:** 7% → **80%+** (11x improvement)
- ✅ **Contact Info:** 10% → **90%+**
- ✅ **Specific Categories:** 78% → **95%+**

### Engagement
- ✅ **Claimed Organizations:** 0 → **200+**
- ✅ **Monthly Self-Service Updates:** **50+** org-initiated updates
- ✅ **User Corrections:** Community-driven data improvements

---

## 💰 Budget & Resources

### Tools & Services
- **Firecrawl:** $100-200/month for ongoing enrichment
- **Google Maps API:** $50/month for geocoding addresses
- **Email Verification:** $20/month for organization claims
- **Supabase:** Free tier currently, may need Pro ($25/month) at 5,000+ services

**Total:** ~$200-300/month for automated data quality

### Development Time
- **Immediate improvements** (data quality): 1 week
- **Firecrawl integration**: 1 week
- **NSW expansion**: 2-3 hours research + 1 day implementation
- **Organization portal (MVP)**: 3-4 weeks
- **Full portal with analytics**: 3-6 months

---

## 🤔 Key Decisions Needed

### Question 1: State Expansion Priority
**Option A:** Focus on NSW next (largest population, most services)
**Option B:** Integrate national APIs first (Ask Izzy, Service Seeker)

**Recommendation:** Do both in parallel - NSW research (3 hours) + API research (2 hours)

### Question 2: Firecrawl Budget
**Costs:**
- One-time enrichment of 403 services: **$0.80**
- Enrich to 5,000 services: **$10**
- Monthly re-validation: **$100-200/month**

**Recommendation:** Start with current 403 services ($0.80) to test, then scale

### Question 3: Organization Portal Timeline
**Option A:** Build now (delays data collection)
**Option B:** Focus on data collection, build portal later

**Recommendation:** Focus on data first (get to 2,000 services), then build portal for maintenance

### Question 4: API Partnerships
Should we partner with Ask Izzy, Service Seeker, or similar platforms?

**Pros:** Instant access to thousands of services
**Cons:** Licensing restrictions, data freshness, attribution requirements

**Recommendation:** Research terms of service, start conversation with InfoXchange

---

## 📚 Documentation Created

1. ✅ [EXPANSION_STRATEGY.md](./EXPANSION_STRATEGY.md) - Full strategic plan (this document)
2. ✅ [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md) - Detailed CSV import instructions
3. ✅ [STRATEGIC_SUMMARY.md](./STRATEGIC_SUMMARY.md) - Executive summary (you are here)

---

## 🎯 What to Do Next

### If you want to add services NOW:
1. **Create a CSV** with your services (see [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md))
2. **Run the import script** (documented in guide)
3. **Check results** on http://localhost:3000/services

### If you want to improve QUALITY:
1. **Run category improvement** (`improve-service-categories.ts`)
2. **Set up Firecrawl** and test enrichment
3. **Run data quality report** to track progress

### If you want to EXPAND geographically:
1. **Research NSW services** (2 hours)
2. **Create nsw-service-urls.json** (30 minutes)
3. **Run batch scraper** (automated)

### If you want to plan LONG-TERM:
1. **Review full strategy** ([EXPANSION_STRATEGY.md](./EXPANSION_STRATEGY.md))
2. **Decide on priorities** (state expansion vs API integration vs portal)
3. **Set budget** for Firecrawl and other tools
4. **Create timeline** for next 3-6 months

---

**Next conversation, just tell me:**
- "Let's improve quality" → I'll run enrichment scripts
- "Let's expand to NSW" → I'll research and create NSW directory
- "Let's set up Firecrawl" → I'll build the integration
- "Let's build the portal" → I'll create organization dashboard
- "Here's a CSV of services" → I'll import them

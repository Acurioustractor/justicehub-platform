# JusticeHub Expansion Strategy
## Australia-Wide Service Discovery & Data Enrichment

**Date:** 2025-10-11
**Current Status:** 403 services (QLD-focused)
**Goal:** 5,000+ services (Australia-wide, comprehensive)

---

## 📊 Current State Analysis

### Database Metrics
- **Total Services:** 403
- **Data Completeness:** 7% (Poor - needs significant enrichment)
  - ✅ Website: 51 services (13%)
  - ✅ Phone: 41 services (10%)
  - ✅ Email: 22 services (5%)
  - ✅ Address: 10 services (2%)
  - ⚠️ Multiple categories: 267 services (66%)
  - ❌ Generic 'support' only: 90 services (22%)

### Current Data Sources
1. **QLD Government Verified Providers** (43 organizations)
2. **Manual Airtable Import** (336 organizations)
3. **Web Scraped Services** (27 active sources in `qld-service-urls.json`)

### Key Gaps
1. **Geographic Coverage:** 95% Queensland, minimal other states
2. **Data Quality:** Most services lack contact details
3. **Verification:** Only government sources verified
4. **Freshness:** No automated update mechanism

---

## 🎯 Strategic Objectives

### Phase 1: Australia-Wide Discovery (Next 3 months)
**Goal:** Expand to 2,000+ services across all states

#### 1.1 State-by-State Expansion
Create service directories for each state/territory:

**Priority Order:**
1. **NSW** (largest population, most services)
   - Legal Aid NSW
   - YJNSW (Youth Justice NSW)
   - Community Restorative Centre
   - Youth Off The Streets
   - Mission Australia NSW

2. **VIC** (second largest)
   - Youth Support + Advocacy Service (YSAS)
   - Jesuit Social Services
   - Berry Street
   - Victorian Legal Aid

3. **SA, WA, TAS, NT, ACT** (regional coverage)
   - Each territory's Legal Aid office
   - State government youth justice departments
   - Regional community organizations

**Implementation:**
- Create `/data/[state]-service-urls.json` for each state
- Model after existing `qld-service-urls.json`
- Research 20-30 high-quality sources per state
- Prioritize government and established NGOs

#### 1.2 National Service Directories
Target Australia-wide aggregators:

1. **Ask Izzy** (InfoXchange)
   - API access: https://www.askizzy.org.au/
   - Comprehensive homeless/crisis services
   - Already structured data

2. **Service Seeker** (Infoxchange)
   - API: https://www.serviceseeker.com.au/
   - NDIS and community services

3. **Australian Government Services**
   - data.gov.au datasets
   - Department of Social Services directory

4. **Youth Central** (Victoria)
   - Model for other states

5. **headspace** (National)
   - 157+ centres Australia-wide
   - Already have QLD, expand to all states

**Implementation:**
- Research API access and terms of service
- Build dedicated importers for each platform
- Respect rate limits and attribution requirements

### Phase 2: Data Enrichment Pipeline (Ongoing)
**Goal:** Achieve 80%+ data completeness

#### 2.1 Automated Web Scraping with Firecrawl

**Why Firecrawl?**
- Handles JavaScript-heavy sites (better than Playwright for some cases)
- Built-in LLM extraction (structured data from unstructured pages)
- Respects robots.txt and rate limiting
- Map/Crawl modes for discovering service pages

**Use Cases:**
1. **Organization Website Discovery**
   - Input: Organization name
   - Output: Official website URL, social media

2. **Contact Information Extraction**
   - Input: Website URL
   - Output: Phone, email, address, hours

3. **Service Detail Enhancement**
   - Input: Service page URL
   - Output: Full description, eligibility, costs, waitlist info

**Implementation Plan:**
```typescript
// /src/lib/scraping/firecrawl-enrichment.ts
import FirecrawlApp from '@mendable/firecrawl-js';

async function enrichServiceWithFirecrawl(service: Service) {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

  // 1. Find organization website if missing
  if (!service.organization.website_url) {
    const searchResult = await firecrawl.search(`${service.name} official website`);
    service.organization.website_url = searchResult.url;
  }

  // 2. Scrape website for contact details
  const scraped = await firecrawl.scrapeUrl(service.organization.website_url, {
    formats: ['markdown', 'structured'],
    extract: {
      schema: {
        phone: 'Phone number for contacting the organization',
        email: 'Email address',
        address: 'Physical address',
        hours: 'Opening hours',
        services: 'List of services offered'
      }
    }
  });

  // 3. Update service with extracted data
  return {
    ...service,
    phone: scraped.phone,
    email: scraped.email,
    address: scraped.address,
    hours: scraped.hours
  };
}
```

**Batch Processing Strategy:**
- Prioritize services with missing contact info (352 services)
- Rate limit: 5 requests/second (Firecrawl limit)
- Cost estimate: $0.002 per page = ~$800 for all 403 services
- Run nightly enrichment batches (50 services/night)

#### 2.2 AI-Powered Category Improvement

**Current Issue:** 90 services only tagged as 'support'

**Solution:**
```typescript
// /src/scripts/improve-service-categories.ts (already exists!)
// Enhanced with Claude to analyze:
// 1. Service description
// 2. Organization mission
// 3. Website content
// Output: Specific categories + confidence scores
```

**Action:** Run existing script on 90 services needing categories

#### 2.3 Government Data Integration

**Sources:**
1. **AIHW** (Australian Institute of Health and Welfare)
   - Youth justice statistics
   - Service availability reports

2. **data.gov.au**
   - Community services datasets
   - Funded organization lists

3. **State/Territory Open Data Portals**
   - NSW: data.nsw.gov.au
   - VIC: data.vic.gov.au
   - QLD: data.qld.gov.au

**Implementation:**
- Create `/src/scripts/discovery/import-govt-data.ts`
- Parse CSV/JSON datasets
- Cross-reference with existing services
- Add `government_verified: true` flag

### Phase 3: Organization Self-Service Portal (3-6 months)
**Goal:** Enable organizations to claim, verify, and update their listings

#### 3.1 Organization Dashboard Features

**Core Functionality:**
```
/dashboard/organization/[slug]
├─ Claim Organization (email verification)
├─ Update Contact Details (phone, email, address)
├─ Add Services (multiple services per org)
├─ Upload Logo & Photos
├─ Set Operating Hours
├─ Add Staff Members
└─ Analytics (how often viewed, contacted)
```

**Verification Flow:**
1. Organization staff clicks "Claim this organization"
2. System sends verification email to official domain
3. Staff verifies email and creates account
4. Organization marked as `verified: true`
5. Staff can update details in real-time

#### 3.2 Bulk Update Interface

**CSV Upload for Multi-Location Services:**
```csv
service_name,address,phone,email,postcode,hours,categories
headspace Brisbane,123 Main St,07-1234-5678,brisbane@headspace.org.au,4000,Mon-Fri 9-5,"mental_health,youth_development"
headspace Cairns,456 Oak Ave,07-8765-4321,cairns@headspace.org.au,4870,Mon-Fri 9-5,"mental_health,youth_development"
```

**Import Process:**
1. Organization uploads CSV
2. System validates format
3. Preview changes before committing
4. Bulk insert/update with audit trail

#### 3.3 Data Validation & Quality Checks

**Automated Checks:**
- ✅ Phone number format (Australian standards)
- ✅ Email deliverability
- ✅ Address geocoding (Google Maps API)
- ✅ Website accessibility (not 404)
- ✅ ABN lookup (Australian Business Number validation)

**Human Review Queue:**
- New organization claims require admin approval
- Flagged changes reviewed by moderators
- Community reporting for outdated info

---

## 🛠️ Technical Implementation Roadmap

### Immediate Actions (This Week)

1. **Create State Service Directory Templates**
```bash
# Create directory structure
mkdir -p /data/states/{nsw,vic,sa,wa,tas,nt,act}

# Generate templates
for state in nsw vic sa wa tas nt act; do
  cp /data/qld-service-urls.json /data/states/$state-service-urls.json
done
```

2. **Research National APIs**
- Sign up for Ask Izzy API access
- Review Service Seeker terms of service
- Document data.gov.au datasets

3. **Set Up Firecrawl**
```bash
npm install @mendable/firecrawl-js
# Add FIRECRAWL_API_KEY to .env
```

4. **Run Existing Enrichment Scripts**
```bash
# Improve categories for 90 services
NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/improve-service-categories.ts

# Enrich with web scraping
NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/enrich-imported-services.ts
```

### Short Term (Next 2 Weeks)

1. **Build Firecrawl Enrichment Pipeline**
   - `/src/lib/scraping/firecrawl-enrichment.ts`
   - `/src/scripts/batch-enrich-services.ts`
   - Process 50 services/night automatically

2. **NSW Service Directory**
   - Research 30 NSW youth justice services
   - Create `/data/states/nsw-service-urls.json`
   - Run batch scraper for NSW

3. **CSV Import Workflow**
   - Document CSV format specification
   - Create `/docs/CSV_IMPORT_GUIDE.md`
   - Test with sample datasets

### Medium Term (Next Month)

1. **VIC, SA, WA, TAS Expansion**
   - 25+ services per state
   - State-specific legal aid, health services

2. **Ask Izzy Integration**
   - API integration script
   - Import 1000+ services
   - Deduplicate against existing data

3. **Organization Portal (MVP)**
   - Basic claim flow
   - Contact update form
   - Email verification

### Long Term (3-6 Months)

1. **Full Organization Dashboard**
   - Multi-user accounts per organization
   - Analytics and insights
   - Bulk CSV uploads

2. **Automated Freshness Checks**
   - Monthly website availability checks
   - Contact validation
   - Prompt organizations to update stale data

3. **Community Features**
   - User reviews (moderated)
   - Success stories
   - Resource downloads

---

## 📈 Success Metrics

### Coverage Metrics
- **Total Services:** 403 → 5,000+
- **States Covered:** 1 → 8
- **Verified Organizations:** 43 → 500+

### Quality Metrics
- **Data Completeness:** 7% → 80%+
- **Contact Info:** 10% → 90%+
- **Multiple Categories:** 66% → 95%+
- **Verified Listings:** 11% → 40%+

### Engagement Metrics
- **Claimed Organizations:** 0 → 200+
- **Monthly Updates:** Track organization-initiated updates
- **User Feedback:** Community corrections and additions

---

## 💰 Cost Estimates

### API & Services
- **Firecrawl:** $100-200/month for enrichment (5,000 services = ~$10k one-time)
- **Google Maps API:** $50/month for geocoding
- **Email Verification Service:** $20/month
- **Supabase:** Currently free tier, may need Pro ($25/month) at scale

### Development Time
- **State Expansion:** 2-3 hours per state (research + config)
- **Firecrawl Integration:** 1 week
- **Organization Portal:** 3-4 weeks
- **Automated Enrichment Pipeline:** 1-2 weeks

---

## 🚀 Getting Started

### Step 1: NSW Expansion (Today)
```bash
# Research NSW youth justice services
# Create data/states/nsw-service-urls.json with 30 sources

# Example sources to research:
# - Legal Aid NSW
# - YJNSW
# - Shopfront Youth Legal Centre
# - Mission Australia NSW
# - Youth Off The Streets
# - Community Restorative Centre
```

### Step 2: Set Up Firecrawl (This Week)
```bash
# Install Firecrawl
npm install @mendable/firecrawl-js

# Add to .env
echo "FIRECRAWL_API_KEY=your_key_here" >> .env

# Create enrichment script
# /src/scripts/batch-enrich-services.ts
```

### Step 3: Run Data Quality Improvements (This Week)
```bash
# Fix categories for 90 services
NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/improve-service-categories.ts

# Run nightly enrichment
# Add to cron or GitHub Actions
```

---

## 📝 Next Steps - Prioritized

1. ✅ **Complete this strategic plan** (DONE)
2. 🔄 **Research NSW service sources** (1-2 hours)
3. 🔄 **Set up Firecrawl account and test** (30 mins)
4. 🔄 **Run category improvement on 90 services** (already scripted)
5. 🔄 **Create Firecrawl enrichment pipeline** (1 week)
6. 🔄 **Build CSV import documentation** (2 hours)
7. 🔄 **Research Ask Izzy API access** (1 hour)

---

## 🤝 How You Can Continue Adding Services

### Option 1: CSV Imports
1. Create CSV with format: `name,description,website,phone,email,category,location,state`
2. Save to `/data/imports/[source-name].csv`
3. Run: `npx tsx /src/scripts/import-from-csv.ts /data/imports/[source-name].csv`

### Option 2: State Service URLs
1. Research services for a state (NSW, VIC, etc.)
2. Create `/data/states/[state]-service-urls.json`
3. Run batch scraper: `npx tsx /src/scripts/scrape-batch.ts --state=[state]`

### Option 3: Manual Additions
1. Add to Airtable or spreadsheet
2. Export as CSV
3. Use existing import script (already have this working!)

### Option 4: Organization Portal (Future)
1. Share link with service providers
2. They claim and verify their organizations
3. Real-time updates to database

---

**Questions to Consider:**
1. Should we prioritize NSW next, or focus on national APIs first?
2. What's the budget for Firecrawl enrichment? ($10k for 5,000 services)
3. Do we want to build the organization portal now, or focus on data collection?
4. Should we partner with Ask Izzy or similar platforms for bulk data?

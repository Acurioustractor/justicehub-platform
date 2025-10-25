# JusticeHub Quick Start - Expansion & Data Collection

**Current Status:** 403 services, ready to scale
**Next Goal:** 2,000+ services across Australia

---

## ✅ What's Ready

1. **Firecrawl Integration** - Installed and configured
2. **NSW Service Directory** - 30 sources researched
3. **CSV Import System** - Ready for bulk imports
4. **Government Data Pipeline** - Scripts ready
5. **Strategic Plans** - Comprehensive documentation

---

## 🚀 Choose Your Path

### Path 1: Test Firecrawl (5 minutes)

**Goal:** Validate Firecrawl setup before bulk scraping

```bash
# 1. Get Firecrawl API key
# Visit: https://firecrawl.dev
# Sign up and copy your API key

# 2. Add to .env
echo "FIRECRAWL_API_KEY=fc-your-key-here" >> .env

# 3. Run test
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/test-firecrawl.ts
```

**Expected output:**
- ✅ API connection successful
- ✅ Successfully scraped example service pages
- ✅ Extracted contact details

**If successful:** Continue to Path 2 or 3

---

### Path 2: Improve Current Data Quality (30 minutes)

**Goal:** Enrich existing 403 services with better data

#### Step 1: Fix Categories (90 services need improvement)
```bash
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/improve-service-categories.ts
```

**What it does:**
- Uses Claude AI to analyze service descriptions
- Assigns specific categories instead of generic 'support'
- Improves searchability and filtering

#### Step 2: Check Results
```bash
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/service-data-quality.ts
```

**Expected improvement:**
- Before: 22% only 'support' category
- After: <5% only 'support' category

#### Step 3: Enrich with Firecrawl (requires API key)
```bash
# Scrape contact details from websites for services missing them
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/enrich-with-firecrawl.ts
```

**What it does:**
- Finds services with missing phone/email/address
- Scrapes their websites using Firecrawl
- Fills in missing contact information

**Cost:** ~$0.80 for 403 services (very cheap!)

---

### Path 3: Expand to NSW (2-3 hours)

**Goal:** Add 250+ NSW youth justice services

#### Step 1: Review NSW Directory
```bash
cat data/states/nsw-service-urls.json | jq '.statistics'
```

**Shows:**
- 30 high-quality sources
- 250 estimated services
- Legal aid, housing, mental health, family support

#### Step 2: Create NSW Scraper (needs building)
```bash
# This script needs to be created - see API_INTEGRATION_PLAN.md
# Template available in /src/scripts/discovery/
```

#### Step 3: Manual Research Alternative (if scraper not ready)
For each source in NSW directory:
1. Visit the website
2. Extract service details
3. Create CSV
4. Import using CSV import script

**Example:**
```csv
name,description,website,phone,email,category,location,state
"Legal Aid NSW Sydney","Free legal advice for young people","https://www.legalaid.nsw.gov.au","1300 888 529","laq@legalaid.nsw.gov.au","legal_aid","Sydney","NSW"
```

```bash
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/import-from-csv.ts data/imports/nsw-services.csv
```

---

### Path 4: Import from CSV (30 minutes)

**Goal:** Bulk import services you already have

#### Step 1: Prepare Your CSV
See [CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md) for format

**Minimum required fields:**
- name, description, category, location, state

**Recommended fields:**
- website, phone, email (for better quality)

#### Step 2: Import
```bash
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/import-from-csv.ts /path/to/your/services.csv
```

#### Step 3: Verify
```bash
# Check service count
NODE_OPTIONS='--require dotenv/config' npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { count } = await supabase.from('services').select('*', { count: 'exact', head: true });
console.log('Total services:', count);
"
```

---

### Path 5: Contact Infoxchange for Official API (15 minutes)

**Goal:** Get access to 390,000+ services from Service Seeker

#### Draft Email
```
To: database@infoxchange.org
Subject: Partnership Request - Youth Justice Service Directory

Hi Infoxchange Team,

I'm building JusticeHub, a specialized youth justice service directory
for Australia, currently with 403 services focused on Queensland.

We're looking to expand nationally and would like to discuss:

1. Access to your Service Directory API for youth justice categories
2. Cross-referencing our data with yours for validation
3. Proper attribution and partnership terms
4. Specialized filtering for justice-involved youth

Our platform provides:
- Specialized youth justice focus
- Enhanced categorization for court support, diversion programs
- Integration with government data sources
- Free public access

Could we schedule a call to discuss partnership options?

Best regards,
[Your name]
JusticeHub
[Your email]
```

#### Follow-up Actions
- Document response in `/docs/infoxchange-partnership.md`
- If approved: Build API integration (see [API_INTEGRATION_PLAN.md](./API_INTEGRATION_PLAN.md))
- If not: Continue with Firecrawl scraping approach

---

## 📊 Progress Tracking

### Check Current Stats Anytime
```bash
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/service-data-quality.ts
```

**Shows:**
- Total services
- Data completeness %
- Missing contact info
- Category quality
- Recommended next actions

---

## 🎯 Recommended Order

For fastest results:

1. **Day 1:** Path 1 (Test Firecrawl) → Path 2 (Improve current data)
2. **Day 2:** Path 5 (Email Infoxchange) → Path 4 (Import any CSVs you have)
3. **Week 1:** Path 3 (NSW expansion) → Build scraper or manual research
4. **Week 2:** Repeat Path 3 for VIC, SA, WA
5. **Month 1:** Wait for Infoxchange response, continue manual expansion

---

## 📚 Key Documentation

- **[EXPANSION_STRATEGY.md](./EXPANSION_STRATEGY.md)** - Full strategic plan
- **[API_INTEGRATION_PLAN.md](./API_INTEGRATION_PLAN.md)** - API access strategies
- **[CSV_IMPORT_GUIDE.md](./CSV_IMPORT_GUIDE.md)** - CSV import instructions
- **[STRATEGIC_SUMMARY.md](./STRATEGIC_SUMMARY.md)** - Executive overview

---

## 🆘 Troubleshooting

### "FIRECRAWL_API_KEY is required"
```bash
# Get key at https://firecrawl.dev
echo "FIRECRAWL_API_KEY=fc-your-key" >> .env
```

### "Failed to connect to Firecrawl API"
- Check API key is correct
- Verify account has credits
- Check network connection

### "Import script can't find CSV"
- Use absolute path: `/Users/you/path/to/file.csv`
- Or relative from project root: `./data/imports/file.csv`

### "Service data quality shows 0% completeness"
- Run import scripts first
- Check database connection
- Verify Supabase credentials in .env

---

## 💡 Tips

**Start Small**
- Test with 5-10 services before bulk imports
- Validate Firecrawl on 1-2 URLs first
- Check data quality after each batch

**Document Everything**
- Keep notes on what works/doesn't
- Track data sources
- Note any API rate limits hit

**Ask for Help**
- Review strategic docs when stuck
- Check CSV import guide for format issues
- Test Firecrawl connection first if scraping fails

---

## 🎉 Success Metrics

**Week 1 Goal:** 500+ services (124% growth)
**Month 1 Goal:** 1,000+ services (148% growth)
**Month 3 Goal:** 2,000+ services (396% growth)

**Quality Goal:** 80%+ data completeness

---

## 🚀 Ready to Start?

Pick a path above and let's grow the database!

**Fastest win:** Path 2 (Improve current data) - 30 minutes, big quality boost

**Biggest impact:** Path 5 (Contact Infoxchange) - Could add 10,000+ services

**Most control:** Path 3 (NSW expansion) - Build it exactly how you want

**Got data already?** Path 4 (CSV import) - Import it now!

# Infoxchange Data Access Strategy
## Ask Izzy & Service Seeker Scraping Plan

**Date:** 2025-10-11
**Goal:** Access 450,000+ services from Infoxchange platforms

---

## 🎯 Key Findings

### Ask Izzy (askizzy.org.au)
- **Database Size:** 450,000+ support services
- **Tech Stack:** Next.js (React-based)
- **Data Source:** Infoxchange Service Directory (ISS)
- **Open Source:** Yes! GitHub: ask-izzy/ask-izzy
- **Categories:** 9 main categories
- **Search:** Location + category based
- **Access:** Publicly accessible, dynamically loaded

### Service Seeker (serviceseeker.com.au)
- **Database Size:** 390,000+ services
- **Data Source:** Same Infoxchange Service Directory
- **Access:** Public search interface
- **Target Audience:** Service providers and professionals

---

## 📋 Ask Izzy Categories

### Primary Categories
1. **Food** - Meals, food banks, community kitchens
2. **Housing** - Emergency accommodation, housing services
3. **Money help** - Centrelink, emergency funds, loans
4. **Support and counselling** - Mental health, general support
5. **Domestic and family violence help** - Crisis support, refuges
6. **Everyday needs** - Basic necessities, material aid
7. **Health and wellbeing** - Medical services, health support
8. **Advice and advocacy** - Legal aid, rights support
9. **Work, learning and things to do** - Employment, education, recreation

### JusticeHub Relevant Categories
For youth justice focus, prioritize:
- ✅ **Support and counselling** (mental health)
- ✅ **Housing** (crisis accommodation)
- ✅ **Advice and advocacy** (legal aid)
- ✅ **Domestic and family violence help** (family support)
- ✅ **Health and wellbeing** (substance abuse, health)
- ✅ **Work, learning and things to do** (education, diversion)

---

## 🗺️ URL Patterns Discovered

### Ask Izzy Search URLs
```
Pattern: https://askizzy.org.au/{category}/{location}

Examples:
- Housing in Brisbane: /housing/Brisbane-QLD
- Legal in Sydney: /advice-and-advocacy/Sydney-NSW
- Mental health in Melbourne: /support-and-counselling/Melbourne-VIC

Location formats:
- City-State: Brisbane-QLD, Sydney-NSW, Melbourne-VIC
- Suburb-State: Redfern-NSW, Fortitude-Valley-QLD
- State-wide: Queensland, New South Wales, Victoria
```

### Category URL Slugs
- Housing: `/housing/`
- Legal/Advocacy: `/advice-and-advocacy/`
- Mental Health: `/support-and-counselling/`
- Family Violence: `/domestic-and-family-violence-help/`
- Health: `/health-and-wellbeing/`
- Education: `/work-learning-and-things-to-do/`

---

## 🔥 Scraping Strategy

### Method 1: Firecrawl Systematic Scraping (RECOMMENDED)

**Approach:** Systematically scrape all relevant category + location combinations

#### Step 1: Generate URL List
```typescript
// /src/scripts/discovery/generate-askizzy-urls.ts

const CATEGORIES = [
  'housing',
  'advice-and-advocacy',
  'support-and-counselling',
  'domestic-and-family-violence-help',
  'health-and-wellbeing',
  'work-learning-and-things-to-do'
];

const LOCATIONS = [
  // Queensland
  'Brisbane-QLD', 'Gold-Coast-QLD', 'Sunshine-Coast-QLD',
  'Townsville-QLD', 'Cairns-QLD', 'Toowoomba-QLD',
  'Ipswich-QLD', 'Logan-City-QLD', 'Queensland',

  // New South Wales
  'Sydney-NSW', 'Newcastle-NSW', 'Wollongong-NSW',
  'Parramatta-NSW', 'Liverpool-NSW', 'Penrith-NSW',
  'Blacktown-NSW', 'New South Wales',

  // Victoria
  'Melbourne-VIC', 'Geelong-VIC', 'Ballarat-VIC',
  'Bendigo-VIC', 'Shepparton-VIC', 'Victoria',

  // South Australia
  'Adelaide-SA', 'Mount-Gambier-SA', 'South Australia',

  // Western Australia
  'Perth-WA', 'Mandurah-WA', 'Bunbury-WA', 'Western Australia',

  // Tasmania
  'Hobart-TAS', 'Launceston-TAS', 'Tasmania',

  // Northern Territory
  'Darwin-NT', 'Alice-Springs-NT', 'Northern Territory',

  // ACT
  'Canberra-ACT', 'Australian Capital Territory'
];

function generateAskIzzyURLs(): string[] {
  const urls: string[] = [];

  for (const category of CATEGORIES) {
    for (const location of LOCATIONS) {
      urls.push(`https://askizzy.org.au/${category}/${location}`);
    }
  }

  return urls;
}

// Total URLs: 6 categories × 45 locations = 270 URLs
console.log('Total URLs to scrape:', generateAskIzzyURLs().length);
```

#### Step 2: Scrape with Firecrawl
```typescript
// /src/scripts/discovery/scrape-askizzy-comprehensive.ts

import { firecrawl } from '@/lib/scraping/firecrawl';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function scrapeAskIzzyComprehensive() {
  console.log('🔥 Starting Ask Izzy Comprehensive Scraping\n');

  const urls = generateAskIzzyURLs();
  let totalServices = 0;
  let duplicates = 0;

  console.log(`📊 Total URLs to scrape: ${urls.length}`);
  console.log(`⏱️  Estimated time: ${Math.ceil(urls.length / 60)} hours\n`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] Scraping: ${url}`);

    try {
      // Use Firecrawl to handle dynamic loading
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['extract'],
        extract: {
          schema: {
            services: `Array of services on this page. For each service extract:
              - name: Service name
              - organization: Organization name
              - description: Brief description
              - address: Physical address
              - phone: Phone number
              - website: Website URL
              - email: Email address
              - hours: Opening hours
              - eligibility: Who can access
              - categories: Service types`
          }
        },
        waitFor: 3000 // Wait 3 seconds for dynamic content
      });

      const services = result.extract?.services || [];
      console.log(`  Found ${services.length} services`);

      // Import each service
      for (const service of services) {
        const imported = await importService(service, url);
        if (imported === 'new') {
          totalServices++;
        } else if (imported === 'duplicate') {
          duplicates++;
        }
      }

      // Rate limiting: 1 request per second (conservative)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Progress checkpoint every 50 URLs
      if ((i + 1) % 50 === 0) {
        console.log(`\n✅ Checkpoint: ${i + 1}/${urls.length} URLs scraped`);
        console.log(`   New services: ${totalServices}`);
        console.log(`   Duplicates: ${duplicates}\n`);
      }

    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 SCRAPING COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`URLs scraped: ${urls.length}`);
  console.log(`New services added: ${totalServices}`);
  console.log(`Duplicates skipped: ${duplicates}`);
  console.log(`Success rate: ${((totalServices / urls.length) * 100).toFixed(1)}%`);
}

async function importService(service: any, sourceUrl: string): Promise<'new' | 'duplicate' | 'error'> {
  try {
    // Check if organization exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', service.organization || service.name)
      .single();

    let orgId: string;

    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: service.organization || service.name,
          description: service.description,
          website_url: service.website,
          phone: service.phone
        })
        .select('id')
        .single();

      if (orgError || !newOrg) {
        console.error(`    ❌ Org creation failed: ${orgError?.message}`);
        return 'error';
      }

      orgId = newOrg.id;
    }

    // Check if service already exists
    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('organization_id', orgId)
      .eq('name', service.name)
      .single();

    if (existingService) {
      return 'duplicate';
    }

    // Create service
    const { error: serviceError } = await supabase
      .from('services')
      .insert({
        name: service.name,
        description: service.description,
        organization_id: orgId,
        phone: service.phone,
        email: service.email,
        address: service.address,
        location: extractLocation(sourceUrl),
        categories: mapCategories(service.categories),
        hours: service.hours,
        eligibility_criteria: service.eligibility ? [service.eligibility] : [],
        data_source: 'Ask Izzy (Infoxchange)',
        data_source_url: sourceUrl,
        verification_status: 'pending'
      });

    if (serviceError) {
      console.error(`    ❌ Service creation failed: ${serviceError.message}`);
      return 'error';
    }

    console.log(`    ✅ Created: ${service.name}`);
    return 'new';

  } catch (error: any) {
    console.error(`    ❌ Import error: ${error.message}`);
    return 'error';
  }
}

function extractLocation(url: string): string {
  // Extract location from URL: /housing/Brisbane-QLD -> Brisbane, QLD
  const match = url.match(/\/([^\/]+)$/);
  if (match) {
    return match[1].replace(/-/g, ', ');
  }
  return 'Australia';
}

function mapCategories(categories: string[] = []): string[] {
  const categoryMap: Record<string, string> = {
    'housing': 'housing',
    'accommodation': 'housing',
    'legal': 'legal_aid',
    'advocacy': 'advocacy',
    'counselling': 'mental_health',
    'mental health': 'mental_health',
    'family violence': 'family_support',
    'domestic violence': 'family_support',
    'education': 'education_training',
    'employment': 'education_training',
    'health': 'mental_health',
    'wellbeing': 'mental_health'
  };

  const mapped = new Set<string>();

  for (const category of categories) {
    const lower = category.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lower.includes(key)) {
        mapped.add(value);
      }
    }
  }

  return mapped.size > 0 ? Array.from(mapped) : ['support'];
}
```

#### Cost Estimate
- **270 URLs** × **$0.002 per scrape** = **$0.54**
- Plus extraction costs ~**$0.50**
- **Total:** ~$1-2 for complete scrape
- **Expected services:** 5,000-15,000 unique services

---

### Method 2: Crawl Mode (Alternative)

Use Firecrawl's crawl feature to discover all service pages:

```typescript
async function crawlAskIzzy() {
  const result = await firecrawl.crawlUrl('https://askizzy.org.au/housing/Brisbane-QLD', {
    limit: 500,
    scrapeOptions: {
      formats: ['extract'],
      extract: {
        schema: {
          services: 'All services on page with full details'
        }
      }
    },
    includePaths: ['/housing/*', '/advice-and-advocacy/*', '/support-and-counselling/*'],
    excludePaths: ['/about', '/contact', '/help']
  });

  return result;
}
```

**Pros:** Discovers all pages automatically
**Cons:** Higher cost, may crawl unnecessary pages

---

### Method 3: Service Seeker Scraping

Service Seeker likely has search interface we can query:

```typescript
// /src/scripts/discovery/scrape-service-seeker.ts

async function scrapeServiceSeeker() {
  const searchTerms = [
    'youth legal aid',
    'youth housing',
    'youth mental health',
    'youth justice',
    'young offenders support',
    'juvenile justice',
    'youth counselling',
    'youth case management'
  ];

  const locations = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

  for (const term of searchTerms) {
    for (const location of locations) {
      const searchUrl = `https://www.serviceseeker.com.au/search?q=${encodeURIComponent(term)}&location=${location}`;

      const result = await firecrawl.scrapeUrl(searchUrl, {
        formats: ['extract'],
        extract: {
          schema: {
            services: 'Services from search results with all available details'
          }
        }
      });

      // Process and import services
      await importServices(result.extract?.services || []);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

---

## 📊 Estimated Results

### Ask Izzy Comprehensive Scrape
- **URLs to scrape:** 270 (6 categories × 45 locations)
- **Expected services:** 5,000-15,000 unique
- **Time:** ~5 hours (1 request/second)
- **Cost:** $1-2 (Firecrawl)
- **Duplicates:** ~30-40% (services in multiple categories/locations)

### Service Seeker Scrape
- **Search queries:** 64 (8 terms × 8 states)
- **Expected services:** 3,000-8,000 unique
- **Time:** ~1 hour
- **Cost:** $0.50-1
- **Overlap with Ask Izzy:** High (same database)

### Combined Strategy
- **Total unique services:** 10,000-20,000
- **Youth justice relevant:** ~5,000-10,000 (50% filter rate)
- **Total cost:** $2-5
- **Total time:** ~6-8 hours

---

## 🚀 Implementation Plan

### Phase 1: Small Test (Today - 30 mins)
```bash
# Test with 5 URLs
NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/discovery/test-askizzy-scrape.ts
```

**Test URLs:**
1. `/housing/Brisbane-QLD`
2. `/advice-and-advocacy/Sydney-NSW`
3. `/support-and-counselling/Melbourne-VIC`
4. `/housing/Queensland` (statewide)
5. `/health-and-wellbeing/Adelaide-SA`

**Expected:** 50-200 services, validate data quality

### Phase 2: Single Category Scrape (Tomorrow - 2 hours)
Scrape all housing services across Australia (1 category × 45 locations = 45 URLs)

**Expected:** 1,000-3,000 services
**Cost:** ~$0.20

### Phase 3: Full Scrape (This Week - 8 hours)
Run comprehensive scrape of all 270 URLs

**Expected:** 5,000-15,000 services
**Cost:** ~$2

### Phase 4: Service Seeker (Next Week - 1 hour)
Add Service Seeker data for additional coverage

**Expected:** +3,000-5,000 services

---

## 🔒 Ethical Considerations

### ✅ Respecting Infoxchange
1. **Attribution:** All services marked "Source: Ask Izzy (Infoxchange)"
2. **Links back:** Link to original Ask Izzy pages
3. **Rate limiting:** 1 request/second (very conservative)
4. **Robots.txt:** Check and respect
5. **Data usage:** Public service directory for youth justice focus

### ✅ Terms of Service
- Ask Izzy data is publicly accessible
- Infoxchange mission aligns with JusticeHub (helping people in crisis)
- Contact Infoxchange in parallel for official partnership
- Don't overload servers (conservative rate limits)

### ✅ Data Quality
- Verify scraped data accuracy
- Regular freshness checks
- Allow organizations to claim/update listings
- Cross-reference with official sources

---

## 📧 Parallel Track: Official Partnership

**While scraping, also pursue official API access:**

Email to: database@infoxchange.org

```
Subject: Partnership Request - Youth Justice Service Directory

Hi Infoxchange Team,

I'm building JusticeHub, a specialized youth justice service directory.

We're currently scraping Ask Izzy's public data for youth justice services,
but would prefer official API access to:

1. Reduce server load (currently rate-limited to 1 req/sec)
2. Get more complete data
3. Properly attribute and partner
4. Share insights on youth justice service gaps

Our scraping approach:
- Conservative rate limits
- Clear attribution
- Youth justice categories only
- Free public access

Could we discuss API access to reduce our scraping footprint?

Best regards,
[Name]
JusticeHub
```

---

## 🎯 Success Metrics

### Coverage
- Current: 403 services (QLD-focused)
- After Ask Izzy scrape: 5,000-10,000 services (Australia-wide)
- After Service Seeker: +3,000 services
- **Total target:** 10,000-15,000 services

### Quality
- Data source attribution: 100%
- Contact information: 60-80% (from Infoxchange data)
- Multiple categories: 80%+
- Geographic coverage: All 8 states/territories

### Cost Efficiency
- Cost per service: $0.0002-0.0005
- Much cheaper than manual research ($5-10 per service)
- Faster than manual entry (270 URLs in 5 hours vs weeks manually)

---

## 🛠️ Next Steps

**Right Now:**
1. Create test script with 5 URLs
2. Validate Firecrawl can handle Ask Izzy's dynamic loading
3. Test data extraction quality

**This Week:**
4. Run single-category scrape (housing)
5. Verify deduplication logic works
6. Email Infoxchange about partnership

**Next Week:**
7. Full Ask Izzy scrape (270 URLs)
8. Service Seeker scrape (64 searches)
9. Data quality review and cleanup

**Month 1:**
10. Regular updates (weekly scrapes of new data)
11. Cross-reference with official partnership API if approved
12. Build organization claim system

---

**Ready to start scraping? Let's build the test script first!**

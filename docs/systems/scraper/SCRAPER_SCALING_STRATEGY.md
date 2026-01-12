# 🚀 Service Scraper Scaling Strategy
## How to Grow from 357 to 5,000+ Services

## Current State Analysis

### What We Have
- **357 services** in database
- **353 organizations**
- **Sources**: Mostly Airtable manual mapping (325 orgs)
- **Quality**: Good categorization (74%), poor contact info (4%)

### Problems with Current Approach
1. **Web scraping limitations**: Google blocks automated searches
2. **Manual curation bottleneck**: Airtable mapping doesn't scale
3. **Limited data sources**: Only scraping ~27 known websites
4. **No API integrations**: Missing major service directories

## Major Data Source Opportunities

### 1. 🏆 Infoxchange Service Seeker API (HIGHEST PRIORITY)
**Potential**: 400,000+ services across Australia

**What is it**:
- Australia's largest up-to-date directory of health and welfare services
- Powers Ask Izzy (most comprehensive Australian service directory)
- Professional-grade data with regular updates
- Structured API access available

**Contact**:
- Website: infoxchange.org/au/products-and-services/service-directory
- API access: Contact Infoxchange directly
- Used by: Queensland Government, community organizations, service providers

**Implementation**:
```typescript
// Potential integration
interface InfoxchangeService {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  categories: string[];
  targetDemographic: string;
  location: { lat: number; lng: number };
}

async function fetchFromInfoxchange(filters: {
  location: 'Queensland',
  category: 'youth services'
}): Promise<InfoxchangeService[]> {
  // API integration
}
```

**Next Steps**:
1. Contact Infoxchange for API access
2. Negotiate pricing (may be free for non-profit/community projects)
3. Map their taxonomy to our categories
4. Import Queensland youth services

**Estimated Impact**: +2,000-5,000 Queensland youth services

---

### 2. 📊 Queensland Open Data Portal
**Potential**: 100-500 services

**What is it**:
- data.qld.gov.au
- Government-maintained open datasets
- API access available for tagged datasets
- CKAN 2.11 platform (upgrading June 2025)

**Key Datasets to Explore**:
- Youth justice centre locations
- Community services datasets
- Department of Communities data
- Disability Services NMDS

**Implementation**:
```typescript
async function fetchQldOpenData() {
  // Search for datasets with tags: youth, community, services
  const datasetsUrl = 'https://www.data.qld.gov.au/api/3/action/package_search';

  const response = await fetch(`${datasetsUrl}?q=tags:youth+OR+tags:community`);
  const datasets = await response.json();

  // For each dataset with API access, fetch and import
  for (const dataset of datasets.result.results) {
    if (dataset.tags.includes('api')) {
      // Fetch dataset via API
    }
  }
}
```

**Next Steps**:
1. Explore data.qld.gov.au/dataset/?tags=api
2. Identify youth/community service datasets
3. Build importers for each dataset
4. Schedule regular syncs

**Estimated Impact**: +100-500 services

---

### 3. 🏛️ My Community Directory
**Potential**: 500-1,000 Queensland services

**What is it**:
- mycommunitydirectory.com.au/Queensland
- Consumes 200+ open data sets from Queensland Government
- Overlays Community Information Exchange data
- Up-to-date community organization information

**Approach**:
- Check if they offer API access
- Alternative: Scrape with permission
- Partner for data sharing

**Next Steps**:
1. Contact My Community Directory for API/partnership
2. Check robots.txt and terms of service
3. Build ethical scraper if allowed
4. Set up data sync pipeline

**Estimated Impact**: +500-1,000 services

---

### 4. 🔗 Department of Youth Justice Service Provider List
**Potential**: 50-200 official providers

**URL**: youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list

**What is it**:
- Official list of prescribed entities
- Government-approved service providers
- High-quality, verified organizations
- Updated regularly

**Implementation**:
```typescript
async function scrapeYouthJusticeProviders() {
  const page = await browser.newPage();
  await page.goto('https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list');

  // Extract structured list
  const providers = await page.evaluate(() => {
    // Parse provider list
  });

  // For each provider, get full details
  for (const provider of providers) {
    const details = await scrapeProviderDetails(provider.url);
    await saveToDatabase(details);
  }
}
```

**Next Steps**:
1. Build dedicated scraper for this page
2. Extract all provider links
3. Deep scrape each provider's website
4. Mark as "government-verified"

**Estimated Impact**: +50-200 verified providers

---

### 5. 🌐 Industry Peak Bodies & Networks
**Potential**: 200-500 services

**Organizations to Target**:
- **QATSICPP** (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
- **PeakCare Queensland** (Child & family services peak body)
- **Queensland Council of Social Service (QCOSS)**
- **Youth Affairs Network Queensland (YANQ)**
- **Queensland Network of Alcohol and Drug Agencies (QNADA)**

**Implementation**:
```typescript
const peakBodies = [
  {
    name: 'QATSICPP',
    membersUrl: 'https://qatsicpp.com.au/members',
    focus: 'cultural_support'
  },
  {
    name: 'PeakCare Queensland',
    membersUrl: 'https://peakcare.org.au/our-members/',
    focus: 'family_support'
  },
  {
    name: 'QCOSS',
    membersUrl: 'https://www.qcoss.org.au/members/',
    focus: 'advocacy'
  }
];

async function scrapePeakBodyMembers() {
  for (const org of peakBodies) {
    const members = await scrapeMemberDirectory(org.membersUrl);

    for (const member of members) {
      // Get full details from member website
      const services = await scrapeOrganizationServices(member.website);
      await saveWithCategory(services, org.focus);
    }
  }
}
```

**Next Steps**:
1. Identify all relevant peak bodies
2. Find their member directories
3. Build scrapers for each directory format
4. Deep scrape member organizations

**Estimated Impact**: +200-500 services

---

### 6. 🎯 Google Places API for Service Discovery
**Potential**: 300-800 services

**Approach**:
Use Google Places API to search for youth service organizations across Queensland

**Implementation**:
```typescript
import { Client } from '@googlemaps/google-maps-services-js';

async function discoverServicesViaGooglePlaces() {
  const client = new Client({});

  const searchTerms = [
    'youth support services Queensland',
    'youth mental health Queensland',
    'youth housing services Queensland',
    'youth legal aid Queensland',
    'juvenile justice services Queensland'
  ];

  const qldCities = [
    'Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville',
    'Cairns', 'Toowoomba', 'Mackay', 'Rockhampton', 'Bundaberg'
  ];

  for (const city of qldCities) {
    for (const term of searchTerms) {
      const results = await client.placesNearby({
        params: {
          location: getCityCoordinates(city),
          radius: 50000, // 50km
          keyword: term,
          key: process.env.GOOGLE_PLACES_API_KEY!
        }
      });

      for (const place of results.data.results) {
        // Get place details
        const details = await client.placeDetails({
          params: {
            place_id: place.place_id,
            key: process.env.GOOGLE_PLACES_API_KEY!
          }
        });

        // Extract contact info, hours, website
        await saveServiceFromPlaceDetails(details.data.result);
      }
    }
  }
}
```

**Next Steps**:
1. Get Google Places API key
2. Define comprehensive search terms
3. Build deduplication logic
4. Run discovery for all major QLD cities

**Estimated Impact**: +300-800 services

---

### 7. 📱 AI-Powered Web Discovery
**Potential**: 500-1,500 services

**Approach**:
Use Claude/GPT to intelligently discover and extract service information

**Implementation**:
```typescript
async function aiPoweredDiscovery() {
  // Step 1: AI generates search queries
  const queries = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Generate 50 specific search queries to find Queensland youth justice services.
      Focus on:
      - Regional organizations
      - Indigenous services
      - Mental health providers
      - Housing services
      - Legal aid
      - Family support

      Return as JSON array of strings.`
    }]
  });

  // Step 2: Use Perplexity AI for research
  for (const query of queries) {
    const research = await perplexity.chat.completions.create({
      model: 'sonar-pro',
      messages: [{
        role: 'user',
        content: `Find Queensland youth service organizations for: ${query}
        Return: name, website, description, contact details`
      }]
    });

    // Extract and save services
    await extractAndSaveServices(research);
  }

  // Step 3: Claude extracts structured data from websites
  for (const url of discoveredUrls) {
    const page = await fetchPage(url);

    const services = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{
        role: 'user',
        content: `Extract all youth services from this HTML.
        Return JSON array with: name, description, phone, email, address, categories.

        HTML: ${page.html}`
      }]
    });

    await saveExtractedServices(services);
  }
}
```

**Next Steps**:
1. Build AI-powered discovery pipeline
2. Use Perplexity for research queries
3. Use Claude for extraction
4. Implement quality checks

**Estimated Impact**: +500-1,500 services

---

### 8. 🗺️ Geographic Grid Search
**Potential**: 200-500 services

**Approach**:
Systematically search every suburb/region in Queensland

**Implementation**:
```typescript
const qldRegions = [
  'Brisbane', 'Ipswich', 'Logan', 'Redland', 'Moreton Bay',
  'Gold Coast', 'Sunshine Coast', 'Scenic Rim', 'Somerset',
  'Townsville', 'Cairns', 'Mackay', 'Rockhampton', 'Bundaberg',
  'Toowoomba', 'Gladstone', 'Hervey Bay', 'Mount Isa'
  // ... all QLD regions
];

async function gridSearch() {
  for (const region of qldRegions) {
    // Search multiple directories
    const sources = [
      `https://www.google.com/search?q=youth+services+${region}+Queensland`,
      `https://www.yellowpages.com.au/search/listings?clue=youth+services&locationClue=${region}`,
      `https://www.truelocal.com.au/find/youth-services/${region}-qld`
    ];

    for (const source of sources) {
      const results = await scrapeSearchResults(source);
      await saveUniqueServices(results, region);
    }
  }
}
```

**Next Steps**:
1. Get complete list of QLD suburbs/regions
2. Build scrapers for business directories
3. Run systematic grid search
4. Deduplicate results

**Estimated Impact**: +200-500 services

---

## Technical Implementation Strategy

### Phase 1: API Integrations (Weeks 1-2)
**Goal**: Get bulk data from established sources

1. **Infoxchange Service Seeker API**
   - Contact and negotiate access
   - Build integration
   - Import Queensland youth services
   - **Target**: +2,000 services

2. **Queensland Open Data Portal**
   - Identify relevant datasets
   - Build API consumers
   - Set up sync schedule
   - **Target**: +200 services

### Phase 2: Structured Scraping (Weeks 3-4)
**Goal**: Extract from known structured sources

3. **Government Service Provider List**
   - Scrape official provider list
   - Deep scrape each provider
   - **Target**: +100 services

4. **Peak Body Member Directories**
   - Scrape member directories
   - Extract organization details
   - **Target**: +300 services

### Phase 3: Discovery & Expansion (Weeks 5-6)
**Goal**: Find new services systematically

5. **Google Places API Discovery**
   - Search all major QLD cities
   - Extract place details
   - **Target**: +500 services

6. **AI-Powered Discovery**
   - Generate research queries
   - Use Perplexity for discovery
   - Claude for extraction
   - **Target**: +800 services

### Phase 4: Comprehensive Coverage (Weeks 7-8)
**Goal**: Fill geographical gaps

7. **Geographic Grid Search**
   - Systematic suburb-by-suburb search
   - Multiple directory sources
   - **Target**: +400 services

8. **My Community Directory**
   - Partner or scrape
   - Import QLD services
   - **Target**: +700 services

## Expected Outcomes

### Service Growth Projection
```
Current:          357 services
After Phase 1:  2,557 services (+2,200)
After Phase 2:  2,957 services (+400)
After Phase 3:  4,257 services (+1,300)
After Phase 4:  5,257 services (+1,000)

Total Growth: 5,257 services (1,373% increase)
```

### Data Quality Targets
- **Contact info completeness**: 4% → 60%
- **Geographic coverage**: Brisbane-focused → All Queensland
- **Category diversity**: Good → Excellent
- **Verification status**: 0% → 40% verified

## Implementation Scripts

### 1. Infoxchange Integration
```bash
# Create new script
/src/scripts/integrations/infoxchange-import.ts
```

### 2. QLD Open Data Consumer
```bash
# Create new script
/src/scripts/integrations/qld-open-data-sync.ts
```

### 3. AI Discovery Pipeline
```bash
# Create new script
/src/scripts/discovery/ai-powered-discovery.ts
```

### 4. Geographic Grid Scraper
```bash
# Create new script
/src/scripts/discovery/geographic-grid-search.ts
```

## Budget & Resources

### API Costs (Estimated)
- **Infoxchange API**: $0-500/month (negotiate)
- **Google Places API**: ~$200/month (40,000 requests)
- **Perplexity AI**: ~$100/month (research queries)
- **Claude API**: ~$50/month (extraction)

**Total**: ~$350-850/month

### Free/Low-Cost Options
- Queensland Open Data Portal: FREE
- Government websites: FREE (with respectful scraping)
- Peak body directories: FREE (public data)
- My Community Directory: FREE or partnership

## Success Metrics

### Quantitative
- **Services in database**: 357 → 5,000+
- **Organizations**: 353 → 2,000+
- **Contact info completeness**: 4% → 60%+
- **Geographic coverage**: 10 regions → 50+ regions

### Qualitative
- **Data freshness**: Monthly updates from APIs
- **Verification**: 40% government/peak body verified
- **User value**: Comprehensive statewide coverage
- **Search quality**: 10x improvement in findability

## Risk Mitigation

### Legal/Ethical
- ✅ Always check robots.txt
- ✅ Respect rate limits
- ✅ Get permission for scraping
- ✅ Attribute data sources
- ✅ Terms of service compliance

### Technical
- ✅ Deduplication logic
- ✅ Data validation
- ✅ Error handling
- ✅ Incremental updates
- ✅ Rollback capability

### Quality
- ✅ Manual spot checks
- ✅ AI verification
- ✅ Community feedback
- ✅ Regular audits

## Next Immediate Actions

1. **Contact Infoxchange** - Highest priority, biggest impact
2. **Explore QLD Open Data** - Quick win, free data
3. **Scrape Government Provider List** - High quality, verified
4. **Build Google Places integration** - Good coverage
5. **Set up AI discovery** - Find edge cases

## Long-Term Vision

### Year 1
- 5,000+ services across Queensland
- Comprehensive regional coverage
- API integrations with major directories
- Monthly automated updates

### Year 2
- 10,000+ services (expand to all Australia)
- Real-time verification system
- Community contribution platform
- Mobile app integration

### Year 3
- AI-powered service matching
- Outcome tracking
- Service quality ratings
- National coverage

---

**Document created**: 2025-10-10
**Current services**: 357
**Target services**: 5,000+
**Growth target**: 1,373% (14x increase)

# API & Data Integration Plan

**Date:** 2025-10-11
**Goal:** Access 390,000+ services from Infoxchange and other national directories

---

## 🎯 Key Findings

### 1. Infoxchange Service Directory (Ask Izzy + Service Seeker)
- **Database Size:** 390,000+ health, welfare, and community services
- **API Available:** Yes (requires partnership/contact)
- **Contact:** database@infoxchange.org
- **Open Source:** Ask Izzy frontend is open source on GitHub
- **Open Data Platform:** Aggregate data available, but not raw service listings

**Access Strategy:**
- ✅ **Official API:** Contact Infoxchange for API partnership
- ✅ **Alternative:** Analyze Ask Izzy open source code for data structure
- ✅ **Scraping Fallback:** Use Firecrawl to scrape Ask Izzy search results

### 2. Government Open Data (data.gov.au + AIHW)
- **Youth Justice Detention Data:** Statistics only, not service listings
- **Productivity Commission Reports:** XLSX/CSV with service performance data
- **AIHW Youth Justice Reports:** Statistical reports, limited service details

**Access Strategy:**
- ✅ Download CSV/XLSX datasets
- ✅ Extract service provider names and jurisdictions
- ✅ Cross-reference with our database
- ✅ Use for validation and verification

### 3. State/Territory Service Directories
**WA Youth Service Directory:** wayouthservicesdirectory.org.au
**NSW Legal Aid:** Multiple offices with contact details
**The Shopfront Youth Legal Centre:** NSW-specific
**Youth Law Australia:** National with state pages

**Access Strategy:**
- ✅ Scrape using Firecrawl
- ✅ Build state-specific importers
- ✅ Manual CSV compilation from research

---

## 🚀 Implementation Strategy

### Phase 1: Official API Partnership (Week 1-2)

#### Action: Contact Infoxchange
```
To: database@infoxchange.org
Subject: Partnership Request - Youth Justice Service Directory

Hi Infoxchange Team,

I'm building JusticeHub (justicehub.au), a specialized youth justice service
directory for Queensland expanding to national coverage.

We currently have 403 services and are looking to:
1. Access your Service Directory API for bulk import
2. Cross-reference and validate our data
3. Provide specialized youth justice filtering
4. Attribute all data to Infoxchange appropriately

Could we discuss API access options and partnership terms?

Best regards,
[Your name]
JusticeHub
```

**Expected Timeline:** 2-4 weeks for response and negotiation

#### Backup Plan: If No API Access
- Analyze Ask Izzy GitHub repo for data structure
- Build ethical scraper respecting robots.txt
- Focus on youth justice categories only
- Add clear attribution to Infoxchange

---

### Phase 2: Firecrawl Integration (Week 1) - START NOW

#### Why Firecrawl?
- Handles JavaScript-heavy sites (Ask Izzy is Next.js)
- Built-in LLM extraction for structured data
- Respects rate limits automatically
- Can crawl entire directories

#### Implementation

**Step 1: Install and Configure**
```bash
npm install @mendable/firecrawl-js
echo "FIRECRAWL_API_KEY=your_key_here" >> .env
```

**Step 2: Create Base Firecrawl Service**
```typescript
// /src/lib/scraping/firecrawl.ts
import FirecrawlApp from '@mendable/firecrawl-js';

export const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

export async function scrapeServicePage(url: string) {
  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown', 'structured'],
    extract: {
      schema: {
        name: 'Service or organization name',
        description: 'Brief description of services',
        phone: 'Phone number',
        email: 'Email address',
        address: 'Physical address',
        website: 'Website URL',
        services: 'List of services offered',
        hours: 'Opening hours',
        eligibility: 'Who can access the service'
      }
    }
  });

  return result.data;
}

export async function crawlServiceDirectory(startUrl: string, options: {
  maxPages?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}) {
  const result = await firecrawl.crawlUrl(startUrl, {
    limit: options.maxPages || 100,
    scrapeOptions: {
      formats: ['markdown'],
      extract: {
        schema: {
          services: 'Array of services with name, contact, description'
        }
      }
    },
    includePaths: options.includePatterns,
    excludePaths: options.excludePatterns
  });

  return result;
}
```

**Step 3: Ask Izzy Scraper**
```typescript
// /src/scripts/discovery/scrape-ask-izzy.ts
import { firecrawl } from '@/lib/scraping/firecrawl';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Youth justice search categories on Ask Izzy
const CATEGORIES = [
  'legal',
  'housing',
  'mental-health',
  'family-violence',
  'drug-alcohol',
  'counselling',
  'aboriginal'
];

const LOCATIONS = [
  'Queensland',
  'New South Wales',
  'Victoria',
  'South Australia',
  'Western Australia',
  'Tasmania',
  'Northern Territory',
  'Australian Capital Territory'
];

async function scrapeAskIzzy() {
  console.log('🔥 Scraping Ask Izzy with Firecrawl\\n');

  let totalServices = 0;

  for (const state of LOCATIONS) {
    console.log(`\\n📍 ${state}`);

    for (const category of CATEGORIES) {
      const searchUrl = `https://askizzy.org.au/${category}/${encodeURIComponent(state)}`;

      console.log(`  Searching: ${category}...`);

      try {
        // Scrape search results page
        const results = await firecrawl.scrapeUrl(searchUrl, {
          formats: ['markdown'],
          extract: {
            schema: {
              services: 'Array of services with name, description, address, phone, website'
            }
          }
        });

        const services = results.data?.services || [];
        console.log(`  Found ${services.length} services`);

        // Import each service
        for (const service of services) {
          await importService(service, category, state);
          totalServices++;
        }

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error scraping ${category} in ${state}:`, error);
      }
    }
  }

  console.log(`\\n✅ Total services scraped: ${totalServices}`);
}

async function importService(service: any, category: string, state: string) {
  // Check if organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', service.name)
    .single();

  let orgId: string;

  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    // Create organization
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: service.name,
        description: service.description,
        website_url: service.website,
        phone: service.phone
      })
      .select('id')
      .single();

    if (error || !newOrg) {
      console.error('    ❌ Failed to create organization:', error);
      return;
    }

    orgId = newOrg.id;
  }

  // Check if service exists
  const { data: existingService } = await supabase
    .from('services')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', service.name)
    .single();

  if (existingService) {
    console.log(`    ⏭️  Service already exists: ${service.name}`);
    return;
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
      location: state,
      categories: [mapCategory(category)],
      data_source: 'Ask Izzy (Infoxchange)',
      data_source_url: 'https://askizzy.org.au',
      verification_status: 'pending'
    });

  if (serviceError) {
    console.error('    ❌ Failed to create service:', serviceError);
  } else {
    console.log(`    ✅ Created: ${service.name}`);
  }
}

function mapCategory(askIzzyCategory: string): string {
  const mapping: Record<string, string> = {
    'legal': 'legal_aid',
    'housing': 'housing',
    'mental-health': 'mental_health',
    'family-violence': 'family_support',
    'drug-alcohol': 'substance_abuse',
    'counselling': 'mental_health',
    'aboriginal': 'cultural_support'
  };

  return mapping[askIzzyCategory] || 'support';
}

scrapeAskIzzy()
  .then(() => {
    console.log('\\n✅ Ask Izzy scraping complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n❌ Scraping failed:', error);
    process.exit(1);
  });
```

**Step 4: State Directory Scrapers**
```typescript
// /src/scripts/discovery/scrape-wa-youth-directory.ts
import { firecrawl } from '@/lib/scraping/firecrawl';

async function scrapeWAYouthDirectory() {
  const result = await firecrawl.crawlUrl('https://wayouthservicesdirectory.org.au', {
    limit: 200,
    scrapeOptions: {
      formats: ['markdown'],
      extract: {
        schema: {
          services: 'Array of youth services with name, description, contact details'
        }
      }
    }
  });

  // Process and import services
  for (const page of result.data) {
    const services = page.extract?.services || [];
    for (const service of services) {
      await importService(service, 'WA', 'WA Youth Services Directory');
    }
  }
}
```

---

### Phase 3: Government Data Integration (Week 2)

#### Download and Process Government Datasets

**Step 1: Download Datasets**
```bash
# Create data directory
mkdir -p /data/government

# Download Productivity Commission data
curl -o /data/government/youth-justice-rogs-2025.xlsx \
  "https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/data-tables.xlsx"

# Download AIHW data
curl -o /data/government/aihw-youth-justice.csv \
  "https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2020-21/data"

# Download data.gov.au dataset
curl -o /data/government/youth-justice-detention.csv \
  "https://data.gov.au/data/dataset/youth-justice-detention-data/resource/[resource-id]"
```

**Step 2: Parse and Extract Service Providers**
```typescript
// /src/scripts/discovery/import-govt-datasets.ts
import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function extractServicesFromGovernmentData() {
  console.log('📊 Extracting services from government datasets\\n');

  // Parse Excel file
  const workbook = XLSX.readFile('/data/government/youth-justice-rogs-2025.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  // Extract organization names
  const organizations = new Set<string>();

  for (const row of data) {
    // Look for columns with organization names
    if (row['Service Provider'] || row['Organization'] || row['Agency']) {
      const name = row['Service Provider'] || row['Organization'] || row['Agency'];
      organizations.add(name);
    }
  }

  console.log(`Found ${organizations.size} organizations in government data\\n`);

  // Research each organization
  for (const orgName of organizations) {
    console.log(`Researching: ${orgName}`);

    const details = await researchOrganization(orgName);

    if (details) {
      await importService(details);
      console.log(`  ✅ Imported ${details.services.length} services\\n`);
    } else {
      console.log(`  ⏭️  Unable to find details\\n`);
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function researchOrganization(name: string) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Research this Australian youth justice service provider: "${name}"

      Find and return:
      - Official website
      - Main phone number
      - Email address
      - Physical address
      - Brief description of services
      - List of specific services offered
      - Service locations/states

      Return as JSON.`
    }]
  });

  // Parse Claude's response
  const content = message.content[0];
  if (content.type === 'text') {
    try {
      return JSON.parse(content.text);
    } catch {
      return null;
    }
  }

  return null;
}
```

---

### Phase 4: NSW Service Directory (Week 1-2)

#### Manual Research + Automated Scraping

**Target Sources (30+ organizations):**

**Legal Services:**
- Legal Aid NSW (multiple offices)
- Shopfront Youth Legal Centre
- Youth Law Australia NSW
- Community Legal Centres NSW
- Aboriginal Legal Service NSW

**Youth Justice:**
- Youth Justice NSW (YJNSW)
- Community Restorative Centre
- Justice Advocacy Service
- Juvenile Justice Advisory Council NSW

**Housing:**
- Mission Australia NSW
- Youth Off The Streets
- St Vincent de Paul NSW
- The Salvation Army NSW

**Mental Health:**
- headspace NSW centres (20+ locations)
- Lifeline NSW
- Kids Helpline
- ReachOut Australia

**Family Support:**
- Anglicare NSW
- Barnardos Australia
- Wesley Mission
- Relationships Australia NSW

**Indigenous Services:**
- Aboriginal Legal Service NSW/ACT
- Link-Up NSW
- Awabakal Newcastle Aboriginal Co-op

**Implementation:**
```bash
# Create NSW directory
cat > /data/states/nsw-service-urls.json << 'EOF'
{
  "version": "1.0.0",
  "state": "NSW",
  "sources": [
    {
      "id": "legal-aid-nsw",
      "name": "Legal Aid NSW",
      "url": "https://www.legalaid.nsw.gov.au/contact-us/our-offices",
      "category": "legal_aid",
      "priority": "high",
      "enabled": true
    },
    {
      "id": "shopfront-youth-legal",
      "name": "The Shopfront Youth Legal Centre",
      "url": "https://www.theshopfront.org",
      "category": "legal_aid",
      "priority": "high",
      "enabled": true
    },
    ...
  ]
}
EOF

# Run scraper
NODE_OPTIONS='--require dotenv/config' npx tsx /src/scripts/scrape-state-directory.ts --state=nsw
```

---

## 📊 Expected Results

### Phase 1: Official API (If Approved)
- **Services Added:** 10,000-50,000 (filtered for youth justice)
- **Timeline:** 4-8 weeks (negotiation + integration)
- **Cost:** Likely free for non-profit/research, or partnership terms

### Phase 2: Firecrawl Integration (Immediate)
- **Ask Izzy Scraping:** 5,000-10,000 youth justice services
- **State Directories:** 1,000-2,000 services
- **Timeline:** 1-2 weeks development, 1 week scraping
- **Cost:** $100-500 for Firecrawl credits

### Phase 3: Government Data (Immediate)
- **Direct Service Listings:** 50-100 government agencies
- **Organization Names for Research:** 200-500 providers
- **Timeline:** 1 week
- **Cost:** Free (public data)

### Phase 4: NSW Expansion (Immediate)
- **Services Added:** 500-1,000 NSW services
- **Timeline:** 1 week research + 1 week scraping
- **Cost:** Minimal (Firecrawl credits)

---

## 🎯 Immediate Action Plan

### This Week:

1. **Set Up Firecrawl** (30 minutes)
   ```bash
   npm install @mendable/firecrawl-js
   # Sign up at firecrawl.dev
   echo "FIRECRAWL_API_KEY=fc-xxx" >> .env
   ```

2. **Create Firecrawl Base Service** (2 hours)
   - `/src/lib/scraping/firecrawl.ts`
   - Test with a sample URL

3. **Contact Infoxchange** (15 minutes)
   - Email database@infoxchange.org
   - Request API partnership

4. **Download Government Datasets** (30 minutes)
   - Productivity Commission data
   - AIHW reports
   - data.gov.au CSVs

5. **Research NSW Services** (3 hours)
   - Compile 30+ organization URLs
   - Create `/data/states/nsw-service-urls.json`

### Next Week:

6. **Build Ask Izzy Scraper** (1 day)
   - Test on small subset first
   - Full scrape if successful

7. **Build State Directory Scrapers** (1 day)
   - WA Youth Directory
   - NSW Legal Aid offices

8. **Import Government Data** (1 day)
   - Extract organization names
   - Research with Claude
   - Import services

---

## 🔒 Ethical Considerations

### Respect & Attribution
- ✅ Always attribute data to original source
- ✅ Link back to source directories
- ✅ Respect robots.txt and rate limits
- ✅ Don't overload servers

### Seeking Permission First
- ✅ Contact Infoxchange for official API
- ✅ Only scrape if API unavailable
- ✅ Focus on public youth justice data

### Data Quality
- ✅ Verify scraped data accuracy
- ✅ Regular freshness checks
- ✅ Allow organizations to claim/update listings

---

## 📈 Success Metrics

**Database Growth:**
- Current: 403 services
- After Phase 2-3: 2,000-5,000 services
- After Phase 1 (if API approved): 15,000-50,000 services

**Data Quality:**
- Current: 7% completeness
- Target: 80%+ completeness
- Method: Firecrawl enrichment + organization verification

**Geographic Coverage:**
- Current: 95% Queensland
- Target: Balanced across all 8 states/territories

---

## 🚀 Next Steps

**Right now:** Set up Firecrawl and create base scraping service
**Today:** Contact Infoxchange + download government data
**This week:** NSW research + first Firecrawl scraper test
**Next week:** Full Ask Izzy scraping + state directory imports

Ready to build the Firecrawl integration?

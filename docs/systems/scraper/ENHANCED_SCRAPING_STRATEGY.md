# Enhanced ALMA Scraping Strategy

**Date**: January 2, 2026
**Goal**: Maximize data extraction to build comprehensive youth justice intelligence

---

## Current Challenges Identified

### From Deep Scrape Analysis

| Problem | Sources Affected | Impact |
|---------|------------------|--------|
| **JavaScript rendering** | NSW, QLD, NT government sites | 300-666 chars instead of full content |
| **Large page JSON errors** | QATSICPP (182K chars) | Extraction fails |
| **PDF content not extracted** | AIHW reports, Productivity Commission | Missing key statistics |
| **No funding data captured** | All sources | Can't analyze cost-effectiveness |

### Update: January 2, 2026 - Enhanced Scrape Results

**What we tested:**
- Firecrawl `waitFor: 5000ms` for JavaScript sites
- Firecrawl PDF extraction for government reports

**Results:**
| Approach | Result | Issue |
|----------|--------|-------|
| waitFor on NSW/QLD/NT sites | Still 300-666 chars | waitFor doesn't trigger real browser JS execution |
| PDF extraction AIHW | Timeout (408) | Large PDFs exceed Firecrawl timeout |
| PDF extraction Productivity Commission | Timeout (408) | Same issue |

**Next steps required:**
1. **Use Playwright** for JavaScript sites (real browser rendering)
2. **Download PDFs locally** then use `pdf-parse` npm package
3. **Fix JSON parsing** in extraction (strip markdown code blocks)

---

## Firecrawl Advanced Options

### 1. JavaScript Rendering

**Current (failing)**:
```javascript
const result = await firecrawl.scrapeUrl(url);
```

**Enhanced (with JavaScript wait)**:
```javascript
const result = await firecrawl.scrapeUrl(url, {
  waitFor: 5000,  // Wait 5 seconds for JS to render
  timeout: 30000, // 30 second max timeout
  formats: ['markdown', 'html', 'links'],
  onlyMainContent: true
});
```

### 2. Actions for Complex Pages

For pages requiring interaction (clicking tabs, expanding sections):

```javascript
const result = await firecrawl.scrapeUrl(url, {
  actions: [
    { type: 'wait', milliseconds: 2000 },
    { type: 'click', selector: '.expand-all' },
    { type: 'wait', milliseconds: 1000 },
    { type: 'scroll', direction: 'down', amount: 500 },
    { type: 'wait', selector: '.content-loaded' }
  ],
  formats: ['markdown']
});
```

### 3. PDF Extraction

For extracting content from government PDF reports:

```javascript
const result = await firecrawl.scrapeUrl(pdfUrl, {
  parsers: ['pdf'],
  formats: ['markdown', 'rawHtml']
});
```

### 4. Crawling for Deep Exploration

To follow links and crawl entire sites:

```javascript
const result = await firecrawl.crawl(baseUrl, {
  limit: 50,  // Max pages to crawl
  includePaths: ['/youth-justice/*', '/programs/*'],
  excludePaths: ['/careers/*', '/contact/*'],
  maxDepth: 3,
  waitFor: 3000
});
```

---

## Key PDF Sources to Extract

### Productivity Commission Reports (Funding Data)

| Report | URL | Data Available |
|--------|-----|----------------|
| [ROGS 2025 Youth Justice](https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/) | Main report | Expenditure by state, cost per day |
| [ROGS 2025 Data Tables](https://assets.pc.gov.au/ongoing/report-on-government-services/2025/community-services/rogs-2025-partf-overview-and-sections.pdf) | PDF | Table 17A.10 - Detailed costs |

**Key Statistics (2023-24)**:
- **Total national expenditure**: $1.5 billion
- **Detention costs**: $1.0 billion (65.5% of total)
- **Average cost per day in detention**: $3,320
- **Cost per young person in population**: $581

### AIHW Reports

| Report | URL | Data Available |
|--------|-----|----------------|
| [Youth Justice in Australia 2023-24](https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/summary) | Web | National statistics |
| [State/Territory Appendix](https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/appendices/appendix-d-state-and-territory-systems) | Web | Per-state programs |
| [Full PDF Report](https://www.aihw.gov.au/getmedia/52c8911b-7258-4553-9e3c-fcdb021187f6/Youth-justice-in-Australia-2023-24.pdf) | PDF | Complete data |

### State Budget Documents

| State | Source | Key Data |
|-------|--------|----------|
| **QLD** | Budget papers | $446M youth justice (2023-24) |
| **VIC** | Budget papers | Youth Justice expenditure |
| **NSW** | Budget papers | Juvenile justice spending |
| **WA** | Budget papers | Youth custodial costs |
| **SA** | Budget papers | Youth Court costs |

---

## Cost-Effectiveness Analysis Framework

### The Core Argument

**Detention costs**: ~$3,320/day = ~$1.2M/year per young person

**Community-based programs**: $50-200/day = $18K-73K/year per young person

**Potential savings**: $1.1M+ per young person diverted from detention

### Data Needed for Analysis

1. **Detention costs by state** (from Productivity Commission)
2. **Community program costs** (from state budget papers)
3. **Recidivism rates** (detention vs community)
4. **Long-term outcomes** (employment, further offending)

### Algorithm Concept

```javascript
function calculateCostSavings(intervention) {
  const detentionCostPerDay = 3320;
  const avgDetentionDays = 180; // 6 months
  const detentionCost = detentionCostPerDay * avgDetentionDays;

  const communityProgramCost = intervention.costPerParticipant;
  const diversionSuccessRate = intervention.successRate || 0.7;

  // Expected savings per participant
  const expectedDetentionCost = detentionCost * (1 - diversionSuccessRate);
  const savingsPerParticipant = detentionCost - expectedDetentionCost - communityProgramCost;

  // Generational multiplier (reduced future costs)
  const generationalMultiplier = 3; // Family, community, future children

  return {
    immediateValue: savingsPerParticipant,
    generationalValue: savingsPerParticipant * generationalMultiplier,
    roi: (savingsPerParticipant / communityProgramCost) * 100
  };
}
```

---

## Enhanced Scraper Implementation

### Phase 1: Fix JavaScript Rendering

```javascript
// scripts/alma-enhanced-scrape.mjs

const JAVASCRIPT_SITES = [
  { url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html', wait: 5000 },
  { url: 'https://www.cyjma.qld.gov.au/youth-justice', wait: 5000 },
  { url: 'https://justice.nt.gov.au/youth-justice', wait: 5000 },
  { url: 'https://www.childprotection.sa.gov.au/youth-justice', wait: 3000 },
];

async function scrapeWithJavaScript(source) {
  const result = await firecrawl.scrapeUrl(source.url, {
    waitFor: source.wait,
    timeout: 30000,
    formats: ['markdown', 'links'],
    onlyMainContent: true,
    actions: [
      { type: 'wait', milliseconds: source.wait },
      { type: 'scroll', direction: 'down', amount: 1000 }
    ]
  });

  console.log(`✅ Scraped ${result.markdown.length} chars (with JS wait)`);
  return result;
}
```

### Phase 2: PDF Pipeline

```javascript
// scripts/alma-pdf-extractor.mjs

const PDF_SOURCES = [
  {
    name: 'AIHW Youth Justice 2023-24',
    url: 'https://www.aihw.gov.au/getmedia/52c8911b-7258-4553-9e3c-fcdb021187f6/Youth-justice-in-Australia-2023-24.pdf',
    type: 'research',
    extractFunding: true
  },
  {
    name: 'Productivity Commission ROGS 2025',
    url: 'https://assets.pc.gov.au/ongoing/report-on-government-services/2025/community-services/rogs-2025-partf-overview-and-sections.pdf',
    type: 'government',
    extractFunding: true
  },
  {
    name: 'Cost of Late Intervention 2024',
    url: 'https://www.thefrontproject.org.au/media/attachments/2025/09/26/coli--2024-e-report-190925-86.pdf',
    type: 'research',
    extractFunding: true
  }
];

async function extractPdfContent(source) {
  // Use Firecrawl PDF parser
  const result = await firecrawl.scrapeUrl(source.url, {
    parsers: ['pdf'],
    formats: ['markdown']
  });

  // Extract funding data using Claude
  const fundingData = await extractFundingWithClaude(result.markdown, source);

  return {
    content: result.markdown,
    funding: fundingData
  };
}

async function extractFundingWithClaude(content, source) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Extract all funding and expenditure data from this ${source.type} document about Australian youth justice.

Return JSON with:
{
  "totalExpenditure": { "amount": number, "year": string, "source": string },
  "detentionCosts": {
    "totalAnnual": number,
    "perDayPerPerson": number,
    "percentOfTotal": number
  },
  "communityCosts": {
    "totalAnnual": number,
    "perDayPerPerson": number,
    "percentOfTotal": number
  },
  "stateBreakdown": [
    { "state": "VIC", "expenditure": number, "detentionPercent": number }
  ],
  "programCosts": [
    { "program": string, "costPerParticipant": number, "effectiveness": string }
  ],
  "keyFindings": [string]
}

Document content:
${content.substring(0, 50000)}`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Phase 3: Funding Data Table

```sql
-- Add to ALMA schema
CREATE TABLE IF NOT EXISTS alma_funding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('government', 'research', 'budget')),
  report_year TEXT NOT NULL,

  -- National totals
  total_expenditure DECIMAL(15,2),
  detention_expenditure DECIMAL(15,2),
  community_expenditure DECIMAL(15,2),

  -- Per-unit costs
  cost_per_day_detention DECIMAL(10,2),
  cost_per_day_community DECIMAL(10,2),
  cost_per_participant DECIMAL(10,2),

  -- Jurisdiction
  jurisdiction TEXT CHECK (jurisdiction IN ('VIC', 'QLD', 'NSW', 'NT', 'SA', 'WA', 'TAS', 'ACT', 'National')),

  -- Raw data
  raw_data JSONB DEFAULT '{}'::JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_funding_jurisdiction ON alma_funding_data(jurisdiction);
CREATE INDEX idx_funding_year ON alma_funding_data(report_year);
```

---

## Data Sources for Comprehensive Intelligence

### Tier 1: Government Reports (Funding Focus)

| Source | Frequency | Data Quality | Priority |
|--------|-----------|--------------|----------|
| Productivity Commission ROGS | Annual | Excellent | Critical |
| AIHW Youth Justice Report | Annual | Excellent | Critical |
| State Budget Papers | Annual | Good | High |
| Auditor-General Reports | Occasional | Excellent | Medium |

### Tier 2: Program Details

| Source | Content | Extraction Method |
|--------|---------|-------------------|
| State Youth Justice websites | Programs, eligibility | Firecrawl + JS wait |
| Indigenous organization sites | Community programs | Firecrawl |
| Peak body reports | Evaluations | PDF extraction |
| Jesuit Social Services | Research | Web + PDF |

### Tier 3: Media & Advocacy

| Source | Content | Value |
|--------|---------|-------|
| Raise the Age Campaign | Evidence summaries | Policy context |
| Guardian/ABC Youth Justice | Current events | Real-time awareness |
| NITV | Indigenous perspectives | Community voice |

---

## Chunking Strategy for Large Pages

For pages like QATSICPP (182K chars) that cause JSON errors:

```javascript
async function extractLargeContent(content, source) {
  const MAX_CHUNK_SIZE = 30000; // Claude context-friendly
  const chunks = [];

  // Split content into chunks
  for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
    chunks.push(content.substring(i, i + MAX_CHUNK_SIZE));
  }

  // Extract from each chunk
  const allEntities = {
    interventions: [],
    evidence: [],
    outcomes: [],
    funding: []
  };

  for (const chunk of chunks) {
    const entities = await extractWithClaude(chunk, source);

    // Merge entities
    allEntities.interventions.push(...(entities.interventions || []));
    allEntities.evidence.push(...(entities.evidence || []));
    allEntities.outcomes.push(...(entities.outcomes || []));
    allEntities.funding.push(...(entities.funding || []));
  }

  // Deduplicate
  return deduplicateEntities(allEntities);
}
```

---

## Cost-Effectiveness Dashboard Concept

### Key Metrics to Display

1. **Detention vs Community Cost Comparison**
   - Cost per day: $3,320 (detention) vs $50-200 (community)
   - Annual cost: $1.2M (detention) vs $18K-73K (community)

2. **ROI by Program Type**
   - Prevention: Highest ROI (prevent entry entirely)
   - Diversion: High ROI (avoid detention)
   - Therapeutic: Medium ROI (reduce recidivism)

3. **State-by-State Analysis**
   - Which states invest more in community?
   - Correlation with recidivism rates?

4. **Generational Savings**
   - One young person diverted = $X million lifetime savings
   - Include: healthcare, welfare, justice system, productivity

### Algorithm: Community Investment Score

```javascript
function calculateCommunityInvestmentScore(state) {
  const data = await getFundingData(state);

  // Community percentage (higher = better)
  const communityPercent = data.community_expenditure / data.total_expenditure;

  // Recidivism inverse (lower recidivism = higher score)
  const recidivismScore = 1 - (data.recidivism_rate / 100);

  // Indigenous equity (ratio closer to 1 = better)
  const indigenousEquity = 1 - Math.abs(1 - data.indigenous_ratio);

  // Composite score (0-100)
  return (
    communityPercent * 40 +
    recidivismScore * 30 +
    indigenousEquity * 30
  ) * 100;
}
```

---

## Implementation Roadmap

### Week 1: Fix JavaScript Rendering

1. Update `alma-deep-scrape.mjs` with `waitFor` options
2. Re-scrape NSW, QLD, NT government sites
3. Compare content yield before/after

### Week 2: PDF Pipeline

1. Build PDF extraction script
2. Process Productivity Commission ROGS
3. Process AIHW annual reports
4. Extract all funding data

### Week 3: Funding Database

1. Apply funding table migration
2. Populate with extracted data
3. Build state comparison queries

### Week 4: Cost-Effectiveness Analysis

1. Calculate ROI for known programs
2. Build community investment score
3. Create visualization data

---

## Expected Outcomes

### Data Growth

| Metric | Current | After Enhancement |
|--------|---------|-------------------|
| Interventions | 152 | 300+ |
| Evidence records | 8 | 100+ |
| Funding data points | 0 | 50+ |
| PDF reports processed | 0 | 20+ |

### Intelligence Capabilities

1. **Answer**: "How much does each state spend on detention vs community?"
2. **Answer**: "What's the ROI of prevention programs?"
3. **Answer**: "Which programs show best cost-effectiveness?"
4. **Answer**: "How much could Australia save by investing in community?"

---

## The Big Picture Argument

### Current State
- Australia spends $1.5B/year on youth justice
- 65% goes to detention ($3,320/day per person)
- 35% goes to community ($50-200/day per person)
- Indigenous young people are 24x over-represented

### The Evidence
- Community programs have lower recidivism
- Prevention is cheapest (avoid system entirely)
- Detention often increases reoffending
- Indigenous-led programs show best outcomes

### The Opportunity
- Shift from 65% detention to 65% community
- Potential savings: $500M+ annually
- Better outcomes: reduced recidivism, better life paths
- Generational impact: break cycles of disadvantage

### ALMA's Role
- Provide evidence for this shift
- Track which programs work
- Calculate real costs and savings
- Drive national policy response

---

*"Every dollar invested in community prevention saves $17 in downstream costs."*
— Cost of Late Intervention Report, 2024

Sources:
- [Productivity Commission ROGS 2025](https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/)
- [AIHW Youth Justice 2023-24](https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/summary)
- [Jesuit Social Services](https://jss.org.au/news-and-media/media-releases/new-youth-justice-spending-data-highlights-effectiveness-of-restorative-justice-programs/)
- [Cost of Late Intervention 2024](https://www.thefrontproject.org.au/media/attachments/2025/09/26/coli--2024-e-report-190925-86.pdf)

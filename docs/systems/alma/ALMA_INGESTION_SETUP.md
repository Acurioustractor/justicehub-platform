# ALMA Ingestion Setup - Connect Best-in-Class Scraping Tools

**Goal**: Automatically collect youth justice research from across the web and extract ALMA entities (interventions, evidence, outcomes, contexts) using AI.

---

## What We're Building

```
Web Sources → Firecrawl/Jina → Storage → Claude → ALMA Entities → JusticeHub Database
```

**Flow**:
1. **Firecrawl** crawls government sites, research institutions
2. **Jina AI Reader** cleans HTML → clean markdown
3. **Tavily** searches for specific research topics
4. **Supabase Storage** stores raw documents
5. **Claude (via extraction-service.ts)** extracts structured ALMA entities
6. **Database** stores interventions, evidence, outcomes, contexts

---

## Tools We're Using

### 1. **Firecrawl** - Best-in-Class Web Scraping
**What it does**: Crawls entire websites, extracts clean markdown, handles JS-heavy sites
**Why**: More reliable than Puppeteer/Playwright, built for LLM consumption
**Cost**: $0.50/1000 pages

**Use cases**:
- Crawl AIHW Youth Justice section (50+ reports)
- Scrape state department program pages
- Extract evaluation PDFs from research institutions

**Already integrated in**: `src/lib/alma/ingestion-service.ts`

### 2. **Jina AI Reader** - Clean Markdown Extraction
**What it does**: Converts any URL to LLM-ready markdown in one API call
**Why**: Cleaner output than Firecrawl for single pages, free tier available
**Cost**: Free for 20 requests/minute, $2/1000 requests after

**Use cases**:
- Quick single-page scraping
- News articles about youth justice programs
- Academic paper abstracts

**Already integrated in**: `src/lib/alma/ingestion-service.ts`

### 3. **Tavily** - Research-Grade Search
**What it does**: AI-powered search that returns structured research results
**Why**: Better than Google Custom Search for finding research papers
**Cost**: $5/1000 searches

**Use cases**:
- "Find all Australian youth justice evaluations from 2020-2024"
- "Search for Indigenous-led youth programs in Victoria"
- Discover interventions we don't know about yet

**Already integrated in**: `src/lib/alma/ingestion-service.ts`

### 4. **ACT Knowledge Ingestion** (Existing)
**What it does**: Ingests ACT codebase documentation, creates vector embeddings
**Why**: We already have this working across 9 ACT projects
**Cost**: OpenAI embeddings ($0.0001/1000 tokens)

**Located at**: `/Users/benknight/act-global-infrastructure/scripts/ingest-all-knowledge.mjs`

**Use cases**:
- ACT methodology documentation
- LCAA framework docs
- Technical architecture docs

---

## Setup Instructions

### 1. Get API Keys

```bash
# Firecrawl
# Sign up: https://firecrawl.dev
# Get API key from dashboard
export FIRECRAWL_API_KEY="fc-xxx"

# Jina AI
# Sign up: https://jina.ai
# Get API key from console
export JINA_API_KEY="jina_xxx"

# Tavily
# Sign up: https://tavily.com
# Get API key from dashboard
export TAVILY_API_KEY="tvly-xxx"

# Claude (Anthropic) - REQUIRED for extraction
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

### 2. Add to JusticeHub .env.local

```bash
cd /Users/benknight/Code/JusticeHub

# Add these to .env.local
cat >> .env.local << 'EOF'

# ALMA Ingestion APIs
FIRECRAWL_API_KEY=fc-your-key-here
JINA_API_KEY=jina_your-key-here
TAVILY_API_KEY=tvly-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
EOF
```

### 3. Install Dependencies

```bash
cd /Users/benknight/Code/JusticeHub

# Install Firecrawl SDK
npm install @mendable/firecrawl-js

# Install Anthropic SDK (if not already installed)
npm install @anthropic-ai/sdk
```

### 4. Create Supabase Storage Bucket

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

### 5. Create Ingestion Jobs Table

```sql
-- Run in Supabase SQL Editor
CREATE TABLE alma_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  source_type TEXT NOT NULL CHECK (source_type IN (
    'url', 'website', 'pdf', 'search', 'rss', 'api'
  )),
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'crawling', 'extracting', 'completed', 'failed'
  )),

  documents_found INTEGER DEFAULT 0,
  entities_created INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  error TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alma_ingestion_jobs_status ON alma_ingestion_jobs(status);
CREATE INDEX idx_alma_ingestion_jobs_created_at ON alma_ingestion_jobs(created_at DESC);
```

---

## Usage Examples

### Example 1: Scrape Single Government Report

```typescript
import { ingestionService } from '@/lib/alma/ingestion-service';

// Scrape AIHW Youth Justice report
const result = await ingestionService.ingestDocument(
  'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-australia-2023',
  'user-id',
  {
    extract_immediately: true,
    consent_level: 'Public Knowledge Commons',
  }
);

console.log(`Created ${result.entities_created} ALMA entities`);
// Output: Created 15 ALMA entities
//   - 3 interventions
//   - 8 evidence records
//   - 2 outcomes
//   - 2 contexts
```

### Example 2: Crawl Entire Research Section

```typescript
// Crawl Australian Institute of Criminology youth justice section
const result = await ingestionService.crawlWebsite(
  'https://www.aic.gov.au/publications/youth-justice',
  'user-id',
  {
    maxPages: 100,
    includePaths: ['/publications/*', '/reports/*'],
    excludePaths: ['/events/*', '/news/*'],
  }
);

console.log(`Crawl job started: ${result.jobId}`);
// Job runs in background, check status later
```

### Example 3: Search and Ingest Research on Topic

```typescript
// Find and ingest all research about Indigenous youth programs
const result = await ingestionService.ingestTopicResearch(
  'Indigenous-led youth justice programs',
  'user-id',
  {
    maxDocuments: 20,
    domains: [
      'aic.gov.au',
      'aihw.gov.au',
      'natsils.org.au',
      'alsnswact.org.au',
    ],
  }
);

console.log(`Ingested ${result.documentsIngested} documents`);
```

### Example 4: Ingest All Curated ALMA Sources

```typescript
// Ingest from all pre-configured government, state, Indigenous, research sources
const result = await ingestionService.ingestAllSources('user-id', [
  'government',
  'states',
  'indigenous',
  'research',
]);

console.log(`Queued ${result.jobs.length} ingestion jobs`);
// Output: Queued 15 ingestion jobs
//   - 3 government sources
//   - 3 state departments
//   - 2 Indigenous organizations
//   - 5 research institutions
//   - 2 evaluation databases
```

### Example 5: Monitor Crawl Job Progress

```typescript
// Check status of background crawl
const status = await ingestionService.processCrawlJob(
  'crawl-job-id',
  'user-id'
);

if (status.status === 'completed') {
  console.log(`Processed ${status.documentsProcessed} pages`);
  console.log(`Created ${status.entitiesCreated} ALMA entities`);
}
```

---

## Curated Data Sources

The ingestion service comes pre-configured with curated Australian youth justice sources:

### Government (3 sources)
- **AIHW** - Youth Justice data and reports
- **Productivity Commission** - Youth justice research
- **Australian Institute of Criminology** - Research publications

### States/Territories (3 sources)
- **Youth Justice NSW**
- **Youth Justice Victoria**
- **Queensland Youth Justice**

### Indigenous Organizations (2 sources)
- **NATSILS** - National Aboriginal and Torres Strait Islander Legal Services
- **ALS NSW/ACT** - Aboriginal Legal Service

### Research Institutions (2 sources)
- **Jesuit Social Services** - Youth justice programs
- **Griffith University** - Youth justice research

### Evaluations (1 source)
- **What Works for Children** - Evidence database

**Total**: 11 curated sources ready to crawl

---

## Automated Ingestion Pipeline

### Option A: Manual Script (Run Once)

Create `/Users/benknight/Code/JusticeHub/scripts/ingest-alma-sources.mjs`:

```javascript
#!/usr/bin/env node
import { ingestionService } from '../src/lib/alma/ingestion-service.js';

const userId = 'admin-user';

console.log('🚀 Starting ALMA data ingestion...\n');

const result = await ingestionService.ingestAllSources(userId);

console.log('\n✅ Ingestion complete!');
console.log(`   Total sources: ${result.total}`);
console.log(`   Successful: ${result.successful}`);
console.log(`   Failed: ${result.failed}`);
console.log(`   Jobs queued: ${result.jobs.length}`);
```

Run it:
```bash
cd /Users/benknight/Code/JusticeHub
node scripts/ingest-alma-sources.mjs
```

### Option B: GitHub Action (Weekly Automation)

Create `.github/workflows/alma-ingestion.yml`:

```yaml
name: ALMA Data Ingestion

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sundays at 2 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm install

      - name: Ingest ALMA data sources
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
          JINA_API_KEY: ${{ secrets.JINA_API_KEY }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/ingest-alma-sources.mjs
```

Add secrets to GitHub:
```bash
gh secret set FIRECRAWL_API_KEY
gh secret set JINA_API_KEY
gh secret set TAVILY_API_KEY
gh secret set ANTHROPIC_API_KEY
```

### Option C: Next.js API Route (On-Demand UI)

Create `app/api/alma/ingest/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ingestionService } from '@/lib/alma/ingestion-service';

export async function POST(request: Request) {
  const { source_type, url } = await request.json();

  const result = await ingestionService.ingestDocument(
    url,
    'api-user',
    {
      source_type,
      extract_immediately: true,
      consent_level: 'Public Knowledge Commons',
    }
  );

  return NextResponse.json(result);
}
```

Then call from UI:
```typescript
const response = await fetch('/api/alma/ingest', {
  method: 'POST',
  body: JSON.stringify({
    source_type: 'url',
    url: 'https://www.aihw.gov.au/reports/...',
  }),
});
```

---

## Integration with Existing ACT Knowledge System

The ACT ecosystem already has a knowledge ingestion system. We can **reuse** its infrastructure:

### Leverage Existing ACT Tools

**1. Use ACT's Vector Embeddings for Search**

ACT already creates vector embeddings for semantic search. We can add ALMA entities to the same system:

```typescript
// In ingestion-service.ts, after creating ALMA entities
import { knowledgeIngestion } from '@/lib/ai-intelligence/knowledge-ingestion-service';

// Create embeddings for newly created intervention
await knowledgeIngestion.createKnowledgeChunk({
  content: intervention.description,
  source: 'alma_intervention',
  project: 'justicehub',
  contentType: 'intervention',
  metadata: {
    intervention_id: intervention.id,
    type: intervention.type,
    evidence_level: intervention.evidence_level,
  },
});
```

**2. Use ACT's Knowledge Bot for ALMA Q&A**

The existing `knowledge-bot` subagent can now answer questions about ALMA data:

```
User: "What Indigenous-led youth programs exist in NSW?"
Claude: [Uses knowledge-bot → queries ALMA embeddings]
        Found 5 Indigenous-led interventions in NSW:
        1. Wiradjuri Youth Mentoring (Proven Effective)
        2. Koori Youth Circle (Community-endorsed)
        ...
```

**3. Unified Intelligence Across ACT Ecosystem**

Now the knowledge base includes:
- ACT methodology docs (existing)
- LCAA framework (existing)
- Technical architecture (existing)
- **ALMA interventions** (new)
- **Youth justice evidence** (new)
- **Community contexts** (new)

---

## Cost Estimates

### One-Time Initial Ingestion (11 curated sources)

| Tool | Usage | Cost |
|------|-------|------|
| Firecrawl | 500 pages crawled | $0.25 |
| Claude | 500 pages extracted @ 10K tokens each | $15.00 |
| OpenAI Embeddings | 5M tokens for search | $0.50 |
| **Total** | | **$15.75** |

### Weekly Incremental Updates

| Tool | Usage | Cost |
|------|-------|------|
| Firecrawl | 50 new pages/week | $0.025 |
| Claude | 50 pages extracted | $1.50 |
| OpenAI Embeddings | 500K tokens | $0.05 |
| **Total/Week** | | **$1.58** |
| **Total/Year** | | **$82.00** |

**Cheap for a comprehensive youth justice intelligence system!**

---

## Next Steps

### Week 1: Setup & Test
1. ✅ Get API keys (Firecrawl, Jina, Tavily, Anthropic)
2. ✅ Add to `.env.local`
3. ✅ Install dependencies
4. ✅ Create storage bucket and ingestion jobs table
5. Test single URL scrape: `ingestDocument()`
6. Test single source crawl: `crawlWebsite()`

### Week 2: Initial Data Load
1. Run `ingestAllSources()` for 11 curated sources
2. Monitor crawl jobs with `processCrawlJob()`
3. Review created ALMA entities in database
4. Quality check: Do extracted interventions make sense?

### Week 3: Automation
1. Create `scripts/ingest-alma-sources.mjs` script
2. Set up GitHub Action for weekly runs
3. Create admin UI for manual ingestion
4. Add monitoring/alerts for failed jobs

### Week 4: Integration with ACT Knowledge
1. Connect ALMA entities to ACT vector embeddings
2. Update `knowledge-bot` to query ALMA data
3. Test semantic search: "Find evidence for family-based programs"
4. Build dashboard showing ALMA intelligence growth over time

---

## Monitoring & Maintenance

### Check Ingestion Job Status

```sql
-- Active jobs
SELECT * FROM alma_ingestion_jobs
WHERE status IN ('pending', 'crawling', 'extracting')
ORDER BY created_at DESC;

-- Recently completed
SELECT source_url, documents_found, entities_created
FROM alma_ingestion_jobs
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 20;

-- Failed jobs (need retry)
SELECT source_url, error
FROM alma_ingestion_jobs
WHERE status = 'failed';
```

### Retry Failed Jobs

```typescript
// Get failed jobs
const { data: failedJobs } = await supabase
  .from('alma_ingestion_jobs')
  .select('*')
  .eq('status', 'failed')
  .limit(10);

// Retry each one
for (const job of failedJobs) {
  await ingestionService.ingestDocument(
    job.source_url,
    'retry-user',
    { extract_immediately: true }
  );
}
```

---

## Success Metrics

After initial ingestion, you should have:

- ✅ **100+ interventions** extracted from government reports
- ✅ **300+ evidence records** from evaluations and research
- ✅ **50+ outcomes** documented across programs
- ✅ **30+ community contexts** capturing place-based factors
- ✅ **500+ total ALMA entities** ready for portfolio analysis

**This becomes the foundation for ALMA's intelligence recommendations.**

---

## Files Created

### Services
- ✅ `src/lib/alma/ingestion-service.ts` (620 lines)
- ✅ `src/lib/alma/extraction-service.ts` (620 lines) - already created

### Documentation
- ✅ `ALMA_INGESTION_SETUP.md` (this file)

### Scripts (To Create)
- `scripts/ingest-alma-sources.mjs` - Run all curated sources
- `scripts/check-ingestion-jobs.mjs` - Monitor progress
- `scripts/retry-failed-ingestions.mjs` - Retry failures

### GitHub Actions (To Create)
- `.github/workflows/alma-ingestion.yml` - Weekly automation

---

**Ready to start ingesting? Run the setup steps above, then:**

```bash
cd /Users/benknight/Code/JusticeHub
node -e "
import('./src/lib/alma/ingestion-service.js').then(m =>
  m.ingestionService.ingestDocument(
    'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-australia-2023',
    'test-user',
    { extract_immediately: true, consent_level: 'Public Knowledge Commons' }
  ).then(r => console.log('Result:', r))
)"
```

🚀 **Let's build Australia's most comprehensive youth justice intelligence system!**

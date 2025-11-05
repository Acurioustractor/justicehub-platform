# Global Programs Research & Enrichment Strategy

**Date:** 2025-10-26
**Purpose:** Systematically research, scrape, and enrich international youth justice programs

## Available Research Tools & APIs

### 1. AI Research APIs

#### OpenAI GPT-4 ✅
- **Status:** Active API key configured
- **Capabilities:**
  - Web search through browsing
  - Text analysis and extraction
  - Structured data generation
  - Content summarization
- **Best for:** General research, content extraction, data structuring

#### Anthropic Claude ✅
- **Status:** Active API key configured
- **Capabilities:**
  - Long context analysis (200K tokens)
  - PDF and document analysis
  - Structured data extraction
  - Research synthesis
- **Best for:** Deep research, policy document analysis, synthesizing multiple sources

#### Perplexity AI ⚠️
- **Status:** Placeholder API key (needs real key)
- **Capabilities:**
  - Real-time web search with citations
  - Academic research access
  - Current events and recent publications
  - Source attribution
- **Best for:** Finding recent research, academic papers, latest program data
- **Action needed:** Get API key from https://www.perplexity.ai/settings/api

### 2. Web Scraping Tools

#### Firecrawl ✅
- **Status:** Active API key configured (`fc-ab5f175f47e545afb3151e9c3fd94ab8`)
- **Capabilities:**
  - Clean markdown extraction
  - LLM-powered data extraction
  - Full website crawling
  - JavaScript rendering
  - Search functionality
- **Best for:** Scraping program websites, extracting structured data, crawling directories
- **File:** `/src/lib/scraping/firecrawl.ts`

#### Custom AI Extractor ✅
- **Status:** Available
- **File:** `/src/lib/scraping/ai-extractor.ts`
- **Capabilities:**
  - AI-powered content extraction
  - Structured data parsing
- **Best for:** Complex data extraction from unstructured content

### 3. Database & Storage

#### Supabase (JusticeHub) ✅
- **Table:** `international_programs`
- **Storage:** Can add program images, PDFs, videos
- **Status:** 16 programs currently

#### Empathy Ledger Database ✅
- **Status:** Separate database for cultural storytelling
- **Could use for:** Linking stories to programs

## Research Workflow

### Phase 1: Discovery & Identification (CURRENT)

**Goal:** Find 50+ high-quality international programs

**Sources to Research:**
1. **Academic Databases:**
   - Campbell Collaboration
   - Cochrane Reviews
   - National Institute of Justice
   - Australian Institute of Criminology
   - Ministry of Justice reports (UK, NZ, Canada)

2. **International Organizations:**
   - UNICEF Youth Justice
   - UN Office on Drugs and Crime
   - International Juvenile Justice Observatory
   - Annie E. Casey Foundation
   - Open Society Foundations

3. **Government Websites:**
   - New Zealand Ministry of Justice
   - Scottish Children's Reporter Administration
   - Canadian Department of Justice
   - Nordic Council reports
   - European Juvenile Justice Observatory

4. **NGOs & Foundations:**
   - Diagrama Foundation
   - NICRO (South Africa)
   - Roca, Inc.
   - Justice Reinvestment Network
   - Restorative Justice International

**Research Protocol:**
```typescript
For each potential program:
1. Search academic literature (Perplexity AI)
2. Find official website (Google/Firecrawl)
3. Extract program details (Firecrawl + Claude)
4. Verify evidence quality (GPT-4 analysis)
5. Find media assets (images, videos)
6. Calculate recidivism if available
7. Document Australian relevance
```

### Phase 2: Data Extraction & Enrichment

**For each program, collect:**

#### Core Data (Already in DB)
- [x] Name
- [x] Country/Region
- [x] Description
- [x] Approach summary
- [x] Recidivism rate
- [x] Evidence strength
- [x] Key outcomes
- [x] Australian adaptations

#### Enrichment Data (TO ADD)
- [ ] **Images:**
  - Program facilities
  - Staff and participants (with permission)
  - Logo/branding
  - Infographics

- [ ] **Videos:**
  - Documentary footage
  - Program tours
  - Testimonials
  - News coverage

- [ ] **Documents:**
  - Evaluation reports (PDFs)
  - Academic research papers
  - Government reports
  - Policy documents

- [ ] **Contact Information:**
  - Website URL
  - Email contact
  - Physical address
  - Key personnel

- [ ] **Detailed Outcomes:**
  - Long-term recidivism data
  - Employment outcomes
  - Education completion rates
  - Family reunification
  - Mental health improvements
  - Cost savings data

- [ ] **Implementation Details:**
  - Year established
  - Scale (number of youth served)
  - Budget/funding model
  - Staff qualifications required
  - Training programs
  - Quality assurance processes

#### Rich Content Fields
- [ ] **Key Principles** (array) - Core philosophical approaches
- [ ] **Strengths** (array) - What works well
- [ ] **Challenges** (array) - Known limitations
- [ ] **Resources** (array of objects):
  ```typescript
  {
    title: string;
    type: 'research' | 'video' | 'report' | 'policy';
    url: string;
    description: string;
    year?: number;
  }
  ```

### Phase 3: Automated Scraping Scripts

**Create these scripts:**

#### 1. Program Discovery Script
```typescript
// src/scripts/discover-programs.ts
// - Search for programs by region
// - Use Perplexity to find recent research
// - Create candidate list with sources
```

#### 2. Program Enrichment Script
```typescript
// src/scripts/enrich-program.ts <program-id>
// - Scrape official website with Firecrawl
// - Extract missing data fields
// - Find and download images/videos
// - Upload media to Supabase storage
// - Update database record
```

#### 3. Bulk Research Script
```typescript
// src/scripts/research-programs-bulk.ts
// - Read list of program names/countries
// - For each: search, scrape, extract, save
// - Progress tracking
// - Error handling and retry logic
```

#### 4. Media Harvester Script
```typescript
// src/scripts/harvest-program-media.ts
// - Find YouTube videos about programs
// - Download official images
// - Store in Supabase Storage
// - Link to program records
```

## Database Schema Enhancements

### Add New Fields to `international_programs`

```sql
-- Media fields
ALTER TABLE international_programs
ADD COLUMN images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;

-- Rich content fields
ALTER TABLE international_programs
ADD COLUMN key_principles TEXT[],
ADD COLUMN strengths TEXT[],
ADD COLUMN challenges TEXT[],
ADD COLUMN resources JSONB DEFAULT '[]'::jsonb;

-- Contact & implementation
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT,
ADD COLUMN address TEXT,
ADD COLUMN staff_qualifications TEXT,
ADD COLUMN training_programs TEXT,
ADD COLUMN quality_assurance TEXT;

-- Scale & impact
ADD COLUMN annual_participants INTEGER,
ADD COLUMN total_served INTEGER,
ADD COLUMN annual_budget DECIMAL,
ADD COLUMN funding_model TEXT,
ADD COLUMN cost_per_participant DECIMAL;

-- Detailed outcomes
ADD COLUMN employment_outcomes JSONB,
ADD COLUMN education_outcomes JSONB,
ADD COLUMN family_outcomes JSONB,
ADD COLUMN mental_health_outcomes JSONB,
ADD COLUMN cost_savings JSONB;
```

## Priority Programs to Research & Add

### High Priority (Gold Standard Programs)

1. **Germany - Jugendstrafvollzug (Youth Prisons)**
   - Low recidivism rates
   - Education-focused
   - Small living units

2. **Japan - Juvenile Training Schools**
   - Very low recidivism (7-8%)
   - Intensive rehabilitation
   - Cultural adaptation model

3. **Norway - Youth Welfare System**
   - Minimal custody
   - Therapeutic approach
   - High success rates

4. **Belgium - Community Service Orders**
   - Diversion focus
   - Restorative justice
   - Evidence-based

5. **Italy - Juvenile Justice Centres**
   - Progressive approach
   - Education emphasis
   - Low incarceration

### Medium Priority (Regional Models)

6. **Singapore - Guidance Programme**
7. **South Korea - Diversion System**
8. **Chile - Sename Reform**
9. **Colombia - Restorative Justice**
10. **Argentina - Youth Courts**

### Research Focus (Indigenous/Cultural Models)

11. **Maori Youth Justice (NZ expanded)**
12. **Canadian First Nations Programs**
13. **Australian Aboriginal Programs (detailed)**
14. **Sami Youth Justice (Norway/Finland)**

## Automation Strategy

### Weekly Research Cycle

**Monday:** Discovery
- Run Perplexity searches for new programs
- Review academic papers published in last month
- Check government websites for new reports

**Tuesday-Thursday:** Enrichment
- Scrape 5-10 program websites
- Extract structured data
- Download and catalog media
- Update database

**Friday:** Quality Assurance
- Verify all data fields complete
- Check citation accuracy
- Review media quality
- Update map locations

### Tools Setup Checklist

- [ ] **Get Perplexity API Key** - Essential for research
- [ ] **Test Firecrawl on program websites** - Verify it works
- [ ] **Create image storage bucket in Supabase** - For media
- [ ] **Set up automated backups** - Protect research data
- [ ] **Build admin interface** - For manual additions

## Immediate Next Steps

1. **Upgrade Database Schema**
   - Add media fields
   - Add rich content fields
   - Add contact fields

2. **Create Discovery Script**
   - Use Perplexity (once key obtained) or GPT-4
   - Search for "youth justice programs with evidence"
   - Extract program names and countries

3. **Build Enrichment Pipeline**
   - Script to enrich existing 16 programs
   - Add images, videos, documents
   - Fill in missing fields

4. **Target 50 Programs**
   - Research and add 34 more high-quality programs
   - Focus on diverse regions
   - Prioritize evidence-based programs

5. **Create Admin Interface**
   - Form to add programs manually
   - Media upload capability
   - Preview before publishing

## Success Metrics

**Short-term (1 month):**
- [ ] 50 programs in database
- [ ] All programs have images
- [ ] 80% have rich descriptions
- [ ] All have key outcomes

**Medium-term (3 months):**
- [ ] 100+ programs
- [ ] Video content for top 20 programs
- [ ] Research papers linked
- [ ] Network analysis (connections between programs)

**Long-term (6 months):**
- [ ] 200+ programs
- [ ] Automated monthly updates
- [ ] Community contributions enabled
- [ ] API for researchers

## Budget Considerations

**API Costs (estimated monthly):**
- Perplexity Pro: $20/month (200 requests/day)
- Firecrawl: $29/month (1000 credits)
- OpenAI GPT-4: ~$50/month (research usage)
- Anthropic Claude: ~$30/month (document analysis)

**Total: ~$130/month for comprehensive research capability**

**ROI:** World's most comprehensive youth justice program database

---

**Ready to start?** Let's begin with:
1. Getting Perplexity API key
2. Creating the enrichment script for existing programs
3. Building the discovery pipeline


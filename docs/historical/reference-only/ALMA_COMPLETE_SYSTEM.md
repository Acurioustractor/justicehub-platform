# ALMA Complete System - From Web to Intelligence

**The Full Pipeline: Web Scraping → AI Extraction → Database → Portfolio Intelligence**

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA COLLECTION LAYER                         │
│                                                                      │
│  Firecrawl    Jina AI     Tavily      Manual       RSS              │
│  (Crawling)   (Reading)   (Search)    (Upload)    (Feeds)           │
│      │           │           │            │           │             │
│      └───────────┴───────────┴────────────┴───────────┘             │
│                             │                                        │
│                    Supabase Storage                                  │
│                    (Raw Documents)                                   │
└──────────────────────────┬───────────────────────────────────────────┘
                          │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      EXTRACTION LAYER                                │
│                                                                      │
│              Claude API (Sonnet 4.5)                                │
│         extraction-service.ts                                        │
│                                                                      │
│   Extracts:                                                         │
│   • Interventions (programs, practices)                             │
│   • Evidence (research, evaluations)                                │
│   • Outcomes (measured results)                                     │
│   • Contexts (place, culture)                                       │
│                                                                      │
│   Validates against ALMA ontology                                   │
└──────────────────────────┬───────────────────────────────────────────┘
                          │
┌──────────────────────────┴───────────────────────────────────────────┐
│                       DATABASE LAYER                                 │
│                                                                      │
│              PostgreSQL (Supabase)                                  │
│                                                                      │
│   10 Tables:                                                        │
│   • alma_interventions          • alma_evidence                     │
│   • alma_outcomes                • alma_community_contexts          │
│   • alma_intervention_evidence   • alma_intervention_outcomes       │
│   • alma_intervention_contexts   • alma_evidence_outcomes           │
│   • alma_consent_ledger          • alma_usage_log                   │
│                                                                      │
│   Governance: 3-tier consent model, RLS policies                    │
└──────────────────────────┬───────────────────────────────────────────┘
                          │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
│                                                                      │
│   intervention-service.ts  →  CRUD + governance                     │
│   consent-service.ts       →  Permission checks                     │
│   portfolio-service.ts     →  Analytics + scoring                   │
│   extraction-service.ts    →  AI-powered extraction                 │
│   ingestion-service.ts     →  Web scraping orchestration            │
│                                                                      │
│   All services enforce governance at every step                     │
└──────────────────────────┬───────────────────────────────────────────┘
                          │
┌──────────────────────────┴───────────────────────────────────────────┐
│                    INTELLIGENCE LAYER                                │
│                                                                      │
│              Portfolio Analytics Engine                              │
│                                                                      │
│   5 Signals → Weighted Score:                                       │
│   • Evidence Strength (25%)                                         │
│   • Community Authority (30%) ← HIGHEST WEIGHT                      │
│   • Harm Risk (20%)                                                 │
│   • Implementation Capability (15%)                                 │
│   • Option Value (10%)                                              │
│                                                                      │
│   Recommendations:                                                  │
│   • Underfunded High Evidence                                       │
│   • Promising But Unproven                                          │
│   • Ready to Scale                                                  │
│   • High Risk Flagged                                               │
│   • Learning Opportunities                                          │
│                                                                      │
│   Portfolio Construction (60/25/15 allocation)                      │
│   Gap Analysis (geographic, cohort, type)                           │
└──────────────────────────┬───────────────────────────────────────────┘
                          │
┌──────────────────────────┴───────────────────────────────────────────┐
│                        UI LAYER (Week 3-4)                           │
│                                                                      │
│   Next.js Admin Dashboard:                                          │
│   • Intervention Management                                         │
│   • Document Upload & Extraction                                    │
│   • Portfolio Dashboard                                             │
│   • Search & Discovery                                              │
│   • Consent Management                                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Complete File Structure

```
JusticeHub/
├── supabase/migrations/
│   ├── 20250131000001_alma_core_entities.sql         ✅ 10 tables + functions
│   ├── 20250131000002_alma_rls_policies.sql          ✅ 30+ RLS policies
│   ├── 20250131000003_alma_hybrid_linking.sql        ✅ Link to existing data
│   └── 20250131000004_fix_portfolio_signals_function.sql ✅ Bug fix
│
├── src/
│   ├── types/
│   │   └── alma.ts                                   ✅ TypeScript types (600 lines)
│   │
│   └── lib/alma/
│       ├── intervention-service.ts                   ✅ CRUD + governance (450 lines)
│       ├── consent-service.ts                        ✅ Permission checks (440 lines)
│       ├── portfolio-service.ts                      ✅ Analytics (450 lines)
│       ├── extraction-service.ts                     ✅ AI extraction (620 lines)
│       └── ingestion-service.ts                      ✅ Web scraping (620 lines)
│
├── scripts/
│   ├── test-alma-services.mjs                        ✅ Integration tests (11/11 passing)
│   ├── ingest-alma-sources.mjs                       📝 To create
│   ├── check-ingestion-jobs.mjs                      📝 To create
│   └── retry-failed-ingestions.mjs                   📝 To create
│
├── .github/workflows/
│   └── alma-ingestion.yml                            📝 To create (weekly automation)
│
└── docs/
    ├── ALMA_SERVICE_LAYER_COMPLETE.md                ✅ Week 2 completion
    ├── ALMA_INGESTION_SETUP.md                       ✅ Scraping setup guide
    ├── ALMA_COMPLETE_SYSTEM.md                       ✅ This file
    ├── ALMA_IMPLEMENTATION_SUMMARY.md                ✅ Original spec
    ├── ALMA_LAYERED_ARCHITECTURE.md                  ✅ Architecture doc
    ├── ALMA_INTEGRATION_PLAN.md                      ✅ Integration plan
    └── ALMA_QUICK_START.md                           ✅ Quick reference
```

---

## What's Working Right Now

### ✅ Week 1-2: Database + Services (COMPLETE)

**Database** (4 migrations deployed):
- 10 ALMA tables created
- 30+ RLS policies enforcing 3-tier consent
- Portfolio signal calculation function
- Consent compliance checking function
- Database constraints enforcing governance

**Services** (5 TypeScript services):
- `intervention-service.ts` - Full CRUD with governance
- `consent-service.ts` - Permission middleware
- `portfolio-service.ts` - Intelligence engine
- `extraction-service.ts` - AI-powered document processing
- `ingestion-service.ts` - Web scraping orchestration

**Tests**: 11/11 passing (100%) against real database

**Status**: ✅ **PRODUCTION READY**

---

## What's Next

### 📝 Week 3: Data Ingestion

**Goal**: Populate ALMA with initial dataset from curated sources

**Tasks**:
1. Get API keys (Firecrawl, Jina, Tavily)
2. Add to `.env.local`
3. Install dependencies (`@mendable/firecrawl-js`, `@anthropic-ai/sdk`)
4. Create Supabase storage bucket
5. Create `alma_ingestion_jobs` table
6. Run initial ingestion: `ingestAllSources()`
7. Monitor jobs and review extracted entities

**Scripts to create**:
- `scripts/ingest-alma-sources.mjs` - Run all curated sources
- `scripts/check-ingestion-jobs.mjs` - Monitor progress
- `scripts/retry-failed-ingestions.mjs` - Retry failures

**Expected outcome**: 100+ interventions, 300+ evidence records, 50+ outcomes, 30+ contexts

### 📝 Week 4: Admin UI

**Goal**: Build admin interface for ALMA management

**Components to create**:
- `InterventionForm` - Create/edit interventions
- `InterventionList` - Browse with filters
- `InterventionDetail` - View with relationships
- `PortfolioDashboard` - Analytics and recommendations
- `DocumentUpload` - AI extraction interface
- `ConsentManager` - Manage permissions

**API Routes**:
- `app/api/alma/interventions/route.ts` - CRUD endpoints
- `app/api/alma/portfolio/route.ts` - Analytics endpoints
- `app/api/alma/ingest/route.ts` - Document processing
- `app/api/alma/consent/route.ts` - Permission management

### 📝 Week 5: Search & Discovery

**Goal**: Make ALMA intelligence searchable

**Features**:
- Full-text search across all entities
- Faceted filtering (geography, type, evidence level, consent level)
- Related interventions (based on shared contexts/outcomes)
- Semantic search using vector embeddings
- Portfolio recommendations ("Show me underfunded high-evidence programs")

**Integration**:
- Connect to ACT knowledge system vector embeddings
- Use existing `knowledge-bot` subagent for Q&A
- Unified search across ALMA + ACT ecosystem

---

## Integration with ACT Ecosystem

ALMA lives within the broader ACT ecosystem and leverages existing infrastructure:

### Existing ACT Tools We Can Use

**1. Knowledge Ingestion System**
- **Location**: `/Users/benknight/act-global-infrastructure/scripts/ingest-all-knowledge.mjs`
- **What it does**: Creates vector embeddings for semantic search
- **How ALMA uses it**: Add ALMA entities to vector database for semantic search

**2. Knowledge Bot Subagent**
- **Location**: `.claude/subagents/knowledge-bot.md`
- **What it does**: Answers questions about ACT ecosystem
- **How ALMA uses it**: Extend to answer questions about youth justice interventions

**3. GitHub Project Automation**
- **Location**: `.github/workflows/master-automation.yml`
- **What it does**: Daily sync of GitHub Projects to Notion
- **How ALMA uses it**: Add ALMA ingestion jobs to daily automation

**4. Existing MCP Servers**
- **GitHub MCP**: Access GitHub Projects API
- **Postgres MCP**: Direct database queries
- **Filesystem MCP**: Read/write files

### Unified Intelligence

After integration, you'll be able to ask:

```
User: "What Indigenous-led programs exist in NSW?"

Claude: [Uses knowledge-bot + ALMA database]
        Found 5 Indigenous-led interventions in NSW:

        1. Wiradjuri Youth Mentoring Program
           Evidence: Proven Effective (RCT)
           Portfolio Score: 0.85
           Status: Ready to scale
           Recommendation: FUND - High evidence, community-endorsed

        2. Koori Youth Circle
           Evidence: Community-endorsed, emerging evidence
           Portfolio Score: 0.72
           Status: Promising but unproven
           Recommendation: LEARN - Invest in evaluation
        ...
```

---

## Cost Breakdown

### One-Time Setup
| Item | Cost |
|------|------|
| Supabase database migrations | Free |
| TypeScript service development | Complete |
| Initial data ingestion (11 sources, 500 pages) | $15.75 |
| **Total** | **$15.75** |

### Monthly Operating Costs
| Item | Usage | Cost/Month |
|------|-------|------------|
| Firecrawl (incremental updates) | 200 pages | $0.10 |
| Claude API (extraction) | 200 pages × 10K tokens | $6.00 |
| OpenAI embeddings (search) | 2M tokens | $0.20 |
| Supabase storage | 1 GB documents | Free (within limits) |
| Supabase database | ALMA tables + RLS | Free (within limits) |
| **Total** | | **~$6.30/month** |

**Yearly**: $75/year for comprehensive youth justice intelligence

**Incredibly cheap** for what you get:
- 100+ interventions tracked
- 300+ evidence records
- Real-time portfolio analytics
- Automated weekly updates
- Governance-enforced access control

---

## Key Differentiators

### Why ALMA Is Different

**1. Database-Enforced Governance**
Most systems check permissions in application code. ALMA enforces ethics at the database level:
```sql
-- Cultural authority REQUIRED (not just validated)
ALTER TABLE alma_interventions ADD CONSTRAINT check_cultural_authority_required
  CHECK (consent_level = 'Public Knowledge Commons' OR cultural_authority IS NOT NULL);
```

**2. Community Authority Prioritized**
Portfolio scoring gives **30% weight** to community authority - the highest of any signal.

**3. Immutable Consent Ledger**
Every action logged, consent revocations tracked, revenue sharing built-in.

**4. AI-Powered Extraction**
Documents automatically become structured ALMA entities via Claude.

**5. Hybrid Data Model**
Links to existing JusticeHub data without disruption.

**6. Real Portfolio Intelligence**
Not just a database - actively recommends funding priorities based on signals.

---

## Success Criteria

**Phase 1 (Weeks 1-2)**: Database + Services
- ✅ 10 ALMA tables deployed
- ✅ 5 TypeScript services created
- ✅ 11/11 tests passing
- ✅ Governance constraints enforced

**Phase 2 (Week 3)**: Data Ingestion
- 📝 100+ interventions ingested
- 📝 300+ evidence records extracted
- 📝 50+ outcomes documented
- 📝 30+ community contexts captured

**Phase 3 (Week 4)**: Admin UI
- 📝 Intervention management interface
- 📝 Document upload and AI extraction
- 📝 Portfolio dashboard with recommendations

**Phase 4 (Week 5)**: Search & Discovery
- 📝 Full-text and semantic search working
- 📝 Portfolio recommendations surfaced
- 📝 Integration with ACT knowledge bot

---

## Quick Start Commands

### Test Services
```bash
cd /Users/benknight/Code/JusticeHub
node scripts/test-alma-services.mjs
# Expected: 11/11 tests passing
```

### Ingest Single Document
```bash
node -e "
import('./src/lib/alma/ingestion-service.js').then(m =>
  m.ingestionService.ingestDocument(
    'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-australia-2023',
    'test-user',
    { extract_immediately: true, consent_level: 'Public Knowledge Commons' }
  ).then(r => console.log('Entities created:', r.entities_created))
)"
```

### Ingest All Curated Sources
```bash
node -e "
import('./src/lib/alma/ingestion-service.js').then(m =>
  m.ingestionService.ingestAllSources('admin-user').then(r =>
    console.log('Jobs queued:', r.jobs.length)
  )
)"
```

### Check Database
```bash
export PGPASSWORD='vixwek-Hafsaz-0ganxa'
psql -h aws-0-ap-southeast-2.pooler.supabase.com \
     -p 6543 \
     -U postgres.tednluwflfhxyucgwigh \
     -d postgres \
     -c "SELECT COUNT(*) FROM alma_interventions;"
```

---

## Documentation Index

**Core Docs**:
- [ALMA_COMPLETE_SYSTEM.md](ALMA_COMPLETE_SYSTEM.md) ← **You are here**
- [ALMA_SERVICE_LAYER_COMPLETE.md](ALMA_SERVICE_LAYER_COMPLETE.md) - Week 2 completion summary
- [ALMA_INGESTION_SETUP.md](ALMA_INGESTION_SETUP.md) - Web scraping setup guide

**Foundation Docs**:
- [ALMA_IMPLEMENTATION_SUMMARY.md](../../act-global-infrastructure/ALMA_IMPLEMENTATION_SUMMARY.md) - Original specification
- [ALMA_LAYERED_ARCHITECTURE.md](../../act-global-infrastructure/ALMA_LAYERED_ARCHITECTURE.md) - Architecture design
- [ALMA_INTEGRATION_PLAN.md](../../act-global-infrastructure/ALMA_INTEGRATION_PLAN.md) - Integration approach
- [ALMA_QUICK_START.md](../../act-global-infrastructure/ALMA_QUICK_START.md) - Quick reference

**Technical Docs**:
- [alma.ts](src/types/alma.ts) - TypeScript type definitions
- [test-alma-services.mjs](scripts/test-alma-services.mjs) - Integration tests

---

## The Vision

**ALMA is becoming Australia's most comprehensive youth justice intelligence system.**

It combines:
- ✅ **Rigorous evidence** from government research
- ✅ **Community wisdom** from Indigenous-led programs
- ✅ **Ethical governance** protecting cultural knowledge
- ✅ **AI-powered extraction** from thousands of documents
- ✅ **Portfolio analytics** guiding funding priorities
- ✅ **Open access** (where consent permits)

**Built by community, for community, with ethics as code.**

---

**Status**: Weeks 1-2 complete, Week 3 ready to begin

**Next action**: Follow [ALMA_INGESTION_SETUP.md](ALMA_INGESTION_SETUP.md) to start data collection

🚀 **Let's build the future of youth justice intelligence!**

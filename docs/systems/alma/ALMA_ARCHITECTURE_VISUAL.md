# ALMA + JusticeHub: Complete System Architecture
## Visual Guide to Backend, Frontend, and Integration

**Date**: January 1, 2026

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     JUSTICEHUB + ALMA ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   FRONTEND (Next.js 14)                     │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  Public Pages:                  Admin Pages:               │    │
│  │  ├─ /intelligence (ALMA hub)    ├─ /admin/alma            │    │
│  │  ├─ /interventions              ├─ /admin/ingestion       │    │
│  │  ├─ /portfolio                  ├─ /admin/consent         │    │
│  │  ├─ /evidence                   └─ /admin/revenue         │    │
│  │  ├─ /sponsorships                                          │    │
│  │  ├─ /research                   Revenue Pages:            │    │
│  │  └─ /licensing                  ├─ /dashboard/revenue     │    │
│  │                                  └─ /sponsors/[id]         │    │
│  │  Enhanced Existing:                                        │    │
│  │  ├─ /community-programs (+ ALMA scores)                   │    │
│  │  ├─ /people/[slug] (+ interventions)                      │    │
│  │  └─ /stories/[slug] (+ evidence links)                    │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  API LAYER (Next.js Routes)                 │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ALMA Intelligence:            Revenue Tracking:           │    │
│  │  ├─ GET /api/alma/interventions ├─ POST /api/revenue/grant│    │
│  │  ├─ GET /api/alma/portfolio     ├─ GET /api/revenue/[id]  │    │
│  │  ├─ GET /api/alma/evidence      └─ POST /api/sponsors     │    │
│  │  └─ GET /api/alma/outcomes                                 │    │
│  │                                 Research API:              │    │
│  │  Admin Management:              ├─ POST /api/research      │    │
│  │  ├─ POST /api/alma/create       ├─ GET /api/research/export│   │
│  │  ├─ PUT /api/alma/[id]          └─ Auth via API keys      │    │
│  │  └─ POST /api/alma/auto-link                               │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              SERVICE LAYER (TypeScript)                     │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ✅ intervention-service.ts (CRUD + governance)            │    │
│  │  ✅ portfolio-service.ts (5-signal scoring)                │    │
│  │  ✅ consent-service.ts (governance enforcement)            │    │
│  │  ✅ extraction-service.ts (AI entity extraction)           │    │
│  │  ✅ ingestion-service.ts (automated collection)            │    │
│  │  🔴 linking-service.ts (auto-link programs) ← BUILD        │    │
│  │  🔴 revenue-service.ts (payment tracking) ← BUILD          │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  DATABASE (Supabase PostgreSQL)             │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ALMA Tables (✅ COMPLETE):                                │    │
│  │  ├─ alma_interventions (120 records)                       │    │
│  │  ├─ alma_evidence (8 records)                              │    │
│  │  ├─ alma_outcomes (8 records)                              │    │
│  │  ├─ alma_community_contexts (10 records)                   │    │
│  │  ├─ alma_consent_ledger (governance tracking)              │    │
│  │  └─ alma_usage_log (attribution)                           │    │
│  │                                                             │    │
│  │  Platform Tables (✅ COMPLETE):                            │    │
│  │  ├─ public_profiles (people registry)                      │    │
│  │  ├─ community_programs (curated programs)                  │    │
│  │  ├─ stories (storytelling with ownership)                  │    │
│  │  ├─ services (service directory)                           │    │
│  │  └─ organizations (providers, NGOs)                        │    │
│  │                                                             │    │
│  │  Revenue Tables (🔴 NEED TO BUILD):                        │    │
│  │  ├─ story_revenue_ledger ← BUILD                           │    │
│  │  ├─ corporate_sponsors ← BUILD                             │    │
│  │  ├─ sponsor_grants ← BUILD                                 │    │
│  │  ├─ state_licenses ← BUILD                                 │    │
│  │  └─ research_partnerships ← BUILD                          │    │
│  │                                                             │    │
│  │  Views (🔴 NEED TO BUILD):                                 │    │
│  │  └─ unified_programs (merge community_programs + ALMA)     │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↕                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              EXTERNAL SERVICES                              │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ✅ Firecrawl (web scraping)                               │    │
│  │  ✅ Anthropic Claude (AI extraction)                       │    │
│  │  ✅ Jina AI (document processing)                          │    │
│  │  🔴 Stripe (payments) ← INTEGRATE                          │    │
│  │  🔴 Xero (accounting) ← INTEGRATE                          │    │
│  │                                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: How Everything Connects

### Flow 1: Public User Explores ALMA Intelligence

```
User visits /intelligence
         ↓
Next.js page fetches data
         ↓
API route /api/alma/interventions
         ↓
intervention-service.ts queries database
         ↓
Supabase returns 120 interventions
         ↓
portfolio-service.ts calculates scores
         ↓
API returns enriched data
         ↓
React components render:
  - InterventionCard (with portfolio score)
  - EvidenceBadge (8 evidence records)
  - ConsentIndicator (Community Controlled marked)
         ↓
User clicks intervention
         ↓
/intelligence/interventions/[id] detail page
         ↓
Full intervention data + linked outcomes/evidence/contexts
         ↓
User downloads evidence library for grant application
```

---

### Flow 2: Admin Ingests New Government Report

```
Admin navigates to /admin/alma/ingestion
         ↓
Clicks "New Crawl" → Enters URL (e.g., new AIHW report)
         ↓
API route /api/alma/ingest-document
         ↓
ingestion-service.ts:
  1. Firecrawl scrapes URL → Markdown
  2. extraction-service.ts → Claude extracts entities
  3. Returns { interventions: [], evidence: [], outcomes: [] }
         ↓
Admin reviews extracted entities (manual check)
         ↓
Admin approves → Entities saved to database
         ↓
consent-service.ts validates governance:
  - Check consent_level
  - Enforce cultural_authority for Community Controlled
  - Log to alma_consent_ledger
         ↓
intervention-service.ts creates records
         ↓
New interventions appear on /intelligence
```

---

### Flow 3: Corporate Sponsor Applies for Partnership

```
Corporate visits /sponsorships
         ↓
Explores intervention types (Education/Employment)
         ↓
Views impact metrics (outcomes tracked)
         ↓
Clicks "Sponsor Education/Employment: $100K/year"
         ↓
Fills application form:
  - Company name
  - Contact email
  - Intervention type interest
  - Budget commitment
         ↓
POST /api/sponsors/apply
         ↓
Creates preliminary corporate_sponsors record (status: Pending)
         ↓
Email sent to JusticeHub admin
         ↓
Admin reviews in /admin/alma/revenue
         ↓
Admin approves → status: Active
         ↓
Sponsor receives dashboard access: /sponsors/[id]/dashboard
         ↓
Quarterly: System allocates $60K to communities:
  - 12 Education/Employment programs × $5K each
  - Creates sponsor_grants records
  - Tracks in revenue dashboard
         ↓
Sponsor views impact report:
  - 12 communities supported
  - Quarterly outcomes tracked
  - Grant citations using their sponsorship
```

---

### Flow 4: Storyteller Earns Revenue from Grant Citation

```
Organization writing grant application
         ↓
Cites Aunty Corrine's story in application
         ↓
Grant awarded: $500K
         ↓
Organization reports citation:
  POST /api/revenue/grant-citation
  Body: {
    story_id: "aunty-corrine-story",
    grant_organization: "QLD Government",
    grant_amount: 500000
  }
         ↓
revenue-service.ts:
  1. Calculate 10% share = $50,000
  2. 50% to storyteller = $25,000 (Aunty Corrine)
  3. 30% to platform = $15,000
  4. 20% to community org = $10,000 (Mount Isa Aunties)
         ↓
Creates story_revenue_ledger record (status: Pending)
         ↓
Admin approves payment in /admin/alma/revenue
         ↓
Payment processed via Stripe/Xero
         ↓
status: Paid
         ↓
Aunty Corrine sees in /dashboard/revenue:
  - Total earned: $25,000
  - Grant: QLD Government ($500K)
  - Payment: Received
```

---

### Flow 5: State Government Licenses ALMA Intelligence

```
QLD Government explores /intelligence/licensing
         ↓
Sees pricing: $75K/year (Tier 1 state)
         ↓
Views what's included:
  - 39 QLD programs documented
  - $40.2M budget mapped
  - Policy tension analysis
  - Quarterly updates
  - National benchmarking
         ↓
Submits inquiry via contact form
         ↓
POST /api/licensing/state
         ↓
Creates preliminary state_licenses record (status: Pending)
         ↓
Admin reviews, negotiates, approves
         ↓
status: Active
         ↓
QLD Government gets:
  1. Dashboard access: /intelligence/states/QLD
  2. API key for data export
  3. Quarterly intelligence reports (PDF)
         ↓
Revenue distribution:
  - $75K annual fee
  - 30% to communities = $22.5K
    - QATSICPP: $15K (3 programs documented)
    - Other QLD orgs: $7.5K split
  - 70% to platform = $52.5K (operations)
         ↓
Communities see revenue in their profiles
```

---

## Component Architecture

### Intelligence Hub Page Component Tree

```
/app/intelligence/page.tsx
├─ <StatCard> (4 instances)
│  ├─ Interventions: 120
│  ├─ Evidence: 8
│  ├─ Outcomes: 8
│  └─ States: 7/8
│
├─ <PortfolioDashboard>
│  ├─ <UnderfundedPrograms> (filters interventions)
│  ├─ <ReadyToScale> (high implementation capability)
│  └─ <HighRisk> (harm risk signals)
│
├─ <StateComparison>
│  ├─ <StateCard state="QLD" programs={39} />
│  ├─ <StateCard state="NSW" programs={9} />
│  ├─ <StateCard state="VIC" programs={13} />
│  └─ <StateCard state="NT" programs={11} />
│
├─ <EvidenceLibrary>
│  ├─ <EvidenceCard> (8 instances)
│  │  ├─ Title, type, findings
│  │  ├─ Linked interventions
│  │  └─ Download citation button
│  └─ <FilterBar>
│
└─ <FunderCTASection>
   ├─ State License CTA
   ├─ Corporate Sponsorship CTA
   └─ Research Partnership CTA
```

---

### Intervention Detail Page Component Tree

```
/app/intelligence/interventions/[id]/page.tsx
├─ <Header>
│  ├─ Name, organization
│  ├─ <ConsentBadge>
│  └─ <CulturalAuthority> (if Community Controlled)
│
├─ <PortfolioScoreCard>
│  ├─ Overall score (composite)
│  ├─ <SignalGauge label="Evidence Strength" />
│  ├─ <SignalGauge label="Community Authority" weight={30} />
│  ├─ <SignalGauge label="Harm Risk" inverted />
│  ├─ <SignalGauge label="Implementation Capability" />
│  ├─ <SignalGauge label="Option Value" />
│  └─ Recommendations
│
├─ <DescriptionSection>
│  └─ Rich text description
│
├─ <EvidenceList>
│  └─ <EvidenceCard> (linked evidence records)
│
├─ <OutcomesList>
│  └─ <OutcomeCard> (linked outcomes)
│
├─ <ContextsList>
│  └─ <ContextCard> (linked contexts)
│
├─ <SimilarInterventions>
│  ├─ Same type (Prevention, Diversion, etc.)
│  └─ Same state
│
└─ <SourceDocuments>
   └─ Links to original government reports, research papers
```

---

### Admin Intervention Form Component Tree

```
/app/admin/alma/interventions/new/page.tsx
├─ <MultiStepForm steps={7}>
│
│  Step 1: Basic Info
│  ├─ <Input name="name" />
│  ├─ <Select name="type"> (Prevention, Diversion, etc.)
│  └─ <Textarea name="description" />
│
│  Step 2: Governance
│  ├─ <Select name="consent_level"> (Public, Community Controlled, Private)
│  ├─ <Input name="cultural_authority"> (required if Community Controlled)
│  └─ <Select name="review_status"> (Draft, Community Review, Approved)
│
│  Step 3: Location & Scope
│  ├─ <Input name="location_city" />
│  ├─ <Select name="location_state"> (QLD, NSW, VIC, etc.)
│  └─ <MultiSelect name="service_area"> (LGAs served)
│
│  Step 4: Target Cohort
│  ├─ <Input name="target_age_range"> (e.g., 10-17)
│  └─ <Textarea name="target_cohort"> (e.g., "Indigenous youth at risk")
│
│  Step 5: Operations
│  ├─ <Input name="delivery_model"> (e.g., "Community-based")
│  ├─ <Input name="budget_annual" type="number" />
│  └─ <Input name="staff_count" type="number" />
│
│  Step 6: Evidence Links
│  ├─ <MultiSelect name="outcome_ids"> (select from alma_outcomes)
│  ├─ <MultiSelect name="evidence_ids"> (select from alma_evidence)
│  └─ <MultiSelect name="context_ids"> (select from alma_community_contexts)
│
│  Step 7: Source Documents
│  ├─ <URLInput name="source_url" /> (add multiple)
│  ├─ <DatePicker name="scraped_at" />
│  └─ <Input name="source_name" />
│
└─ <SubmitButton>
   └─ Validates via consent-service.ts before submission
```

---

## Database Schema Relationships

```
public_profiles (people)
    ↓ (many-to-many)
community_programs_profiles
    ↓
community_programs
    ↓ (links to)
alma_interventions
    ↓ (many-to-many)
alma_intervention_outcomes
    ↓
alma_outcomes


alma_interventions
    ↓ (many-to-many)
alma_intervention_evidence
    ↓
alma_evidence


alma_interventions
    ↓ (many-to-many)
alma_intervention_contexts
    ↓
alma_community_contexts


stories
    ↓ (revenue tracking)
story_revenue_ledger
    ↓ (references)
public_profiles (storyteller)
organizations (community org)


corporate_sponsors
    ↓ (grants)
sponsor_grants
    ↓ (references)
alma_interventions
organizations (community org)


state_licenses
    ↓ (usage tracking)
alma_usage_log
    ↓ (references)
alma_interventions


research_partnerships
    ↓ (API access)
alma_usage_log
    ↓ (billing via usage_stats)
```

---

## Build Phases Visual Timeline

```
PHASE 1: Core ALMA Display (3 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1: Component Library
├─ PortfolioScoreCard ✓
├─ SignalGauge ✓
├─ EvidenceBadge ✓
├─ ConsentIndicator ✓
└─ InterventionCard ✓

Week 2: Intelligence Pages
├─ /intelligence (hub) ✓
├─ /intelligence/interventions (directory) ✓
├─ /intelligence/interventions/[id] (detail) ✓
└─ /intelligence/portfolio (dashboard) ✓

Week 3: Evidence & API
├─ /intelligence/evidence (library) ✓
├─ API routes (interventions, portfolio, evidence) ✓
└─ Testing & polish ✓

DELIVERABLE: Public ALMA intelligence hub live ✅


PHASE 2: Admin Management (2 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 4: Intervention CRUD
├─ /admin/alma/interventions (list) ✓
├─ /admin/alma/interventions/new (multi-step form) ✓
└─ Governance validation integration ✓

Week 5: Dashboards
├─ /admin/alma/ingestion (job monitoring) ✓
├─ /admin/alma/consent (ledger admin) ✓
└─ /admin/alma/revenue (tracking) ✓

DELIVERABLE: Team can manage all ALMA data ✅


PHASE 3: Hybrid Linking (1 week)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 6: Auto-linking
├─ linking-service.ts (fuzzy matching) ✓
├─ unified_programs view ✓
├─ Admin linking UI ✓
└─ Update community programs page ✓

DELIVERABLE: All programs show ALMA scores ✅


PHASE 4: Revenue Model (2 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 7: Revenue Tracking
├─ Database tables (revenue_ledger, sponsors, etc.) ✓
├─ revenue-service.ts ✓
└─ API routes (grant-citation, sponsors) ✓

Week 8: Revenue Portals
├─ /dashboard/revenue (storyteller) ✓
├─ /sponsorships (corporate portal) ✓
├─ /sponsors/[id] (sponsor dashboard) ✓
├─ /intelligence/licensing (state govt) ✓
└─ /research (university portal) ✓

DELIVERABLE: All revenue streams tracked ✅


PHASE 5: Integration & Polish (2 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 9: Existing Page Enhancement
├─ /people/[slug] + interventions ✓
├─ /stories/[slug] + evidence links ✓
├─ /community-programs + portfolio scores ✓
└─ /services + ALMA intelligence ✓

Week 10: Advanced & Testing
├─ State-specific dashboards ✓
├─ Research API docs ✓
├─ Testing, bugs, performance ✓
└─ Launch preparation ✓

DELIVERABLE: Full production launch ✅


┌────────────────────────────────────────┐
│   10 WEEKS TO FULL PRODUCTION 🚀       │
└────────────────────────────────────────┘
```

---

## Technology Decisions Summary

### Frontend Framework: Next.js 14 (App Router)
**Why**: Server components, built-in API routes, excellent performance, already in use

### Styling: Tailwind CSS + Shadcn/ui
**Why**: Already implemented, ACT brand theme (ochre, sand, eucalyptus), accessible components

### Database: Supabase (PostgreSQL)
**Why**: Already in use, RLS for security, realtime subscriptions, generous free tier

### AI/ML: Anthropic Claude
**Why**: Already integrated, excellent at entity extraction, structured output

### Web Scraping: Firecrawl
**Why**: Already integrated, handles JavaScript, returns clean markdown, reliable

### Payments: Stripe
**Why**: Industry standard, easy integration, supports DGR-1 tax deductions

### Accounting: Xero
**Why**: Australian-focused, connects to Stripe, used by ACT ecosystem

### Hosting: Vercel
**Why**: Seamless Next.js deployment, edge functions, global CDN

---

## Cost Estimate for Full Build

**Development**: 10 weeks × 40 hours × $100/hour = $40,000
- OR: Build internally (Ben + 1 developer)

**Services** (monthly):
- Supabase: $25/month (Pro plan)
- Vercel: $20/month (Pro plan)
- Firecrawl: $50/month (API usage)
- Anthropic API: $20/month (extraction)
- Stripe: 2.9% + $0.30 per transaction
- Total: ~$115/month

**One-time**:
- Domain: $20/year (justicehub.org already owned)
- SSL: $0 (included with Vercel)
- Design assets: $0 (internal)

**Total Investment**:
- Build: $40K (or internal time)
- First year operations: $1,380
- **Very affordable for the value created**

---

## Success Metrics Dashboard (What We'll Track)

```
INTELLIGENCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Total interventions: 120 → target 200 (Year 1)
├─ Evidence records: 8 → target 50 (Year 1)
├─ Outcome records: 8 → target 50 (Year 1)
├─ Context records: 10 → target 30 (Year 1)
└─ State coverage: 7/8 → target 8/8 (add TAS)

USER ENGAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Intelligence hub visits: 0 → target 500/month
├─ Intervention detail views: 0 → target 2,000/month
├─ Evidence downloads: 0 → target 100/month
├─ Portfolio analysis uses: 0 → target 50/month
└─ Average session duration: target 5+ minutes

REVENUE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ State licenses: 0 → target 2 (Year 1)
├─ Corporate sponsors: 0 → target 1 (Year 1)
├─ Research partnerships: 0 → target 1 (Year 1)
├─ Grant citations tracked: 0 → target 10 (Year 1)
└─ Total revenue: $0 → target $250K (Year 1)

COMMUNITY BENEFIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Revenue to communities: $0 → target $75K (30% of $250K)
├─ Profile pages claimed: 0 → target 20
├─ NETWORK tier orgs: 0 → target 5
├─ CORE tier partnerships: 0 → target 2
└─ Storyteller earnings: $0 → target $10K

TECHNICAL PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Page load time: target <2s
├─ API response time: target <500ms
├─ Uptime: target 99.9%
├─ Mobile responsiveness: target 100% pages
└─ Accessibility score: target AA compliance
```

---

## The Complete Picture

**Backend**: ✅ 85% Complete
- ALMA database schema with 120 interventions
- Service layer with governance enforcement
- Web scraping + AI extraction
- Portfolio analytics engine

**Frontend**: 🔴 15% Complete
- Basic platform exists (profiles, stories, services)
- ALMA intelligence pages NEED TO BE BUILT
- Admin management UI NEEDS TO BE BUILT
- Revenue tracking UI NEEDS TO BE BUILT

**Integration**: 🟡 Designed, Not Built
- Hybrid linking (merge existing + ALMA data)
- Profile page enhancements
- Story page evidence links
- Revenue flow automation

**Timeline**: 10 weeks from start to production
**Cost**: $40K development + $1.4K/year operations
**ROI**: $250K revenue Year 1 → 6.2x return

---

**The intelligence is ready. The strategy is proven. The revenue model is designed.**

**Now we build the interface that brings ALMA to the world.**

✨

---

**Document Created**: January 1, 2026
**Status**: Complete system architecture mapped
**Next Action**: Start Phase 1 (Component Library)

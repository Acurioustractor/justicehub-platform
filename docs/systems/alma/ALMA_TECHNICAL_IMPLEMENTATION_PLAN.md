# ALMA + JusticeHub Technical Implementation Plan
## From Backend Infrastructure → Full Website Integration

**Date**: January 1, 2026
**Status**: Backend COMPLETE, Frontend Integration Required
**Timeline**: 10-13 weeks to full production

---

## Executive Summary

**What Exists** (85% complete backend):
- ✅ ALMA database schema (120 interventions, 8 evidence, 8 outcomes, 10 contexts)
- ✅ Service layer with governance enforcement
- ✅ Profile & content linking system
- ✅ Web scraping + AI extraction infrastructure
- ✅ Portfolio analytics engine

**What's Missing** (Frontend integration):
- 🔴 ALMA intelligence pages (public-facing hub)
- 🔴 Admin management UI (intervention CRUD, ingestion dashboard)
- 🔴 Hybrid linking (merge community_programs + alma_interventions)
- 🔴 Revenue tracking UI (storyteller dashboard, sponsor portal)

**The Gap**: We built the intelligence engine, now we need to surface it across the website.

---

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    JUSTICEHUB TECH STACK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend:     Next.js 14 (App Router)                          │
│                React Server Components                          │
│                Tailwind CSS (custom ACT theme)                  │
│                                                                  │
│  Backend:      Supabase (PostgreSQL)                            │
│                Row-Level Security (RLS)                         │
│                Realtime subscriptions                           │
│                                                                  │
│  Services:     ALMA service layer (TypeScript)                  │
│                Firecrawl (web scraping)                         │
│                Anthropic Claude (AI extraction)                 │
│                Jina AI (document processing)                    │
│                                                                  │
│  Integrations: Empathy Ledger (external profiles)               │
│                Notion (CMS for some content)                    │
│                ACT Placemat (contact intelligence)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema: What Exists vs What Needs Extension

### ✅ COMPLETE - ALMA Core Entities

```sql
-- ALMA Interventions (120 programs documented)
CREATE TABLE alma_interventions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Prevention, Diversion, etc.
  description TEXT,
  consent_level TEXT NOT NULL, -- Public, Community Controlled, Private
  cultural_authority TEXT, -- Required for Community Controlled
  review_status TEXT DEFAULT 'Draft',
  source_documents JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ALMA Evidence (8 records linking programs to research)
CREATE TABLE alma_evidence (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  evidence_type TEXT NOT NULL, -- RCT, Program evaluation, etc.
  findings TEXT NOT NULL,
  methodology TEXT,
  consent_level TEXT NOT NULL,
  metadata JSONB
);

-- ALMA Outcomes (8 records measuring effectiveness)
CREATE TABLE alma_outcomes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  outcome_type TEXT NOT NULL, -- Reduced recidivism, etc.
  description TEXT,
  measurement_method TEXT,
  beneficiary TEXT,
  metadata JSONB
);

-- ALMA Community Contexts (10 place-based contexts)
CREATE TABLE alma_community_contexts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  context_type TEXT NOT NULL, -- First Nations, Remote, Regional
  consent_level TEXT NOT NULL,
  cultural_authority TEXT NOT NULL, -- Always required
  location TEXT,
  state TEXT,
  metadata JSONB
);

-- Relationship Tables
CREATE TABLE alma_intervention_outcomes (
  intervention_id UUID REFERENCES alma_interventions(id),
  outcome_id UUID REFERENCES alma_outcomes(id),
  PRIMARY KEY (intervention_id, outcome_id)
);

CREATE TABLE alma_intervention_evidence (
  intervention_id UUID REFERENCES alma_interventions(id),
  evidence_id UUID REFERENCES alma_evidence(id),
  PRIMARY KEY (intervention_id, evidence_id)
);
```

### 🔴 NEEDS TO BE BUILT - Revenue & Sponsorship Tracking

```sql
-- Story Revenue Ledger (NEW - tracks grant citations)
CREATE TABLE story_revenue_ledger (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories(id),
  grant_application_id TEXT,
  grant_organization TEXT,
  grant_amount DECIMAL(10,2),
  citation_type TEXT, -- Story, ALMA intelligence, Profile
  revenue_share_amount DECIMAL(10,2), -- 10% for stories, 30% for ALMA
  storyteller_id UUID REFERENCES public_profiles(id),
  community_org_id UUID REFERENCES organizations(id),
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate Sponsors (NEW)
CREATE TABLE corporate_sponsors (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT,
  sponsorship_tier TEXT, -- Flagship ($200K), Partner ($100K), Supporter ($50K)
  annual_amount DECIMAL(10,2),
  intervention_type TEXT, -- Education/Employment, Cultural Connection, etc.
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Active', -- Active, Paused, Completed
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sponsor Grants (NEW - track how sponsor money flows to communities)
CREATE TABLE sponsor_grants (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES corporate_sponsors(id),
  intervention_id UUID REFERENCES alma_interventions(id),
  community_org_id UUID REFERENCES organizations(id),
  grant_amount DECIMAL(10,2),
  grant_date DATE,
  impact_report_url TEXT,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Paid
  paid_at TIMESTAMPTZ,
  metadata JSONB
);

-- State Government Licenses (NEW)
CREATE TABLE state_licenses (
  id UUID PRIMARY KEY,
  state TEXT NOT NULL, -- QLD, NSW, VIC, etc.
  license_tier TEXT, -- Tier 1 ($75K), Tier 2 ($50K), Tier 3 ($25K)
  annual_fee DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  contact_name TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'Active',
  usage_count INTEGER DEFAULT 0, -- Track API calls, downloads
  metadata JSONB
);

-- Research Partnerships (NEW)
CREATE TABLE research_partnerships (
  id UUID PRIMARY KEY,
  institution_name TEXT NOT NULL,
  partnership_type TEXT, -- API Access, Data Partnership, Co-design
  annual_fee DECIMAL(10,2),
  api_key TEXT UNIQUE, -- For API access authentication
  rate_limit_per_day INTEGER,
  start_date DATE,
  end_date DATE,
  contact_name TEXT,
  contact_email TEXT,
  co_authorship_agreements JSONB, -- Which Indigenous partners must co-author
  status TEXT DEFAULT 'Active',
  usage_stats JSONB
);
```

### 🟡 NEEDS EXTENSION - Hybrid Linking

```sql
-- Extend existing community_programs table
ALTER TABLE community_programs
  ADD COLUMN alma_intervention_id UUID REFERENCES alma_interventions(id),
  ADD COLUMN auto_link_confidence DECIMAL(3,2), -- 0.0 to 1.0
  ADD COLUMN link_status TEXT DEFAULT 'Unlinked'; -- Unlinked, Pending, Confirmed

-- Create unified view merging both sources
CREATE VIEW unified_programs AS
SELECT
  COALESCE(cp.id::TEXT, ai.id::TEXT) as id,
  COALESCE(cp.name, ai.name) as name,
  COALESCE(cp.organization_id, ai.metadata->>'organization_id')::UUID as organization_id,
  cp.id as community_program_id,
  ai.id as alma_intervention_id,
  -- ALMA intelligence (only if linked)
  ai.type as intervention_type,
  ai.consent_level,
  ai.cultural_authority,
  -- Portfolio scores (calculated via service layer)
  NULL::JSONB as portfolio_scores -- Populated by portfolio-service.ts
FROM community_programs cp
FULL OUTER JOIN alma_interventions ai
  ON cp.alma_intervention_id = ai.id;
```

---

## Frontend Pages: What Exists vs What Needs to Be Built

### ✅ EXISTS - Core Platform Pages

**1. Home Page** (`/app/page.tsx`)
- Hero with rotating stats
- Featured stories carousel
- Service finder CTA
- Truth section with acknowledgment

**2. Services** (`/app/services/page.tsx`)
- Service directory with filters
- Interactive map showing service locations
- State/category filtering
- Verification status badges

**3. Community Programs** (`/app/community-programs/page.tsx`)
- Program directory (currently shows `community_programs` table only)
- Filtering by location, approach, Indigenous-led
- Success metrics display
- Organization linking

**4. People** (`/app/people/page.tsx`)
- Public profiles directory
- Featured profiles
- Profile search
- Individual profile pages (`/app/people/[slug]/page.tsx`)

**5. Stories** (`/app/stories/page.tsx`)
- Storytelling hub
- Story cards with featured images
- Author attribution
- Individual story pages (`/app/stories/[slug]/page.tsx`)

**6. Admin Dashboard** (`/app/admin/page.tsx`)
- Basic content management
- User management
- Service verification
- Story moderation

---

### 🔴 NEEDS TO BE BUILT - ALMA Intelligence Pages

**NEW: Intelligence Hub** (`/app/intelligence/page.tsx`)

**Purpose**: Central portal for ALMA intelligence (funders, researchers, policy makers)

**Layout**:
```tsx
import { PortfolioDashboard } from '@/components/alma/PortfolioDashboard';
import { StateComparison } from '@/components/alma/StateComparison';
import { EvidenceLibrary } from '@/components/alma/EvidenceLibrary';

export default function IntelligencePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Australia's Youth Justice Intelligence
        </h1>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Interventions" value={120} />
          <StatCard label="Evidence Records" value={8} />
          <StatCard label="Outcomes Tracked" value={8} />
          <StatCard label="States Covered" value="7/8" />
        </div>
      </section>

      {/* Portfolio Dashboard */}
      <PortfolioDashboard />

      {/* State Comparison */}
      <StateComparison states={['QLD', 'NSW', 'VIC', 'NT']} />

      {/* Evidence Library */}
      <EvidenceLibrary />

      {/* CTA for funders */}
      <section className="bg-eucalyptus-50 p-8 rounded-lg">
        <h2>Access ALMA Intelligence</h2>
        <div className="grid grid-cols-3 gap-4">
          <CTACard
            title="State Government License"
            price="$50-75K/year"
            href="/intelligence/licensing"
          />
          <CTACard
            title="Corporate Sponsorship"
            price="$100K/year"
            href="/sponsorships"
          />
          <CTACard
            title="Research Partnership"
            price="$50K/year"
            href="/research"
          />
        </div>
      </section>
    </div>
  );
}
```

---

**NEW: Intervention Directory** (`/app/intelligence/interventions/page.tsx`)

**Purpose**: Browse all 120 interventions with filtering

**Features**:
- Filter by state, intervention type, evidence level, consent level
- Sort by portfolio score (high to low)
- Search by name, organization
- Card grid display with portfolio scores
- "Underfunded high-evidence" tag highlighting

**Layout**:
```tsx
import { InterventionCard } from '@/components/alma/InterventionCard';
import { InterventionFilters } from '@/components/alma/InterventionFilters';

export default async function InterventionsPage({
  searchParams
}: {
  searchParams: { state?: string; type?: string; evidence?: string }
}) {
  const interventions = await getFilteredInterventions(searchParams);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1>Youth Justice Interventions</h1>

      <InterventionFilters />

      <div className="grid grid-cols-3 gap-6">
        {interventions.map(intervention => (
          <InterventionCard
            key={intervention.id}
            intervention={intervention}
            showPortfolioScore
            showEvidenceBadge
          />
        ))}
      </div>
    </div>
  );
}
```

---

**NEW: Intervention Detail Page** (`/app/intelligence/interventions/[id]/page.tsx`)

**Purpose**: Rich program profile with ALMA intelligence

**Sections**:
1. **Header** - Name, organization, location, consent level
2. **Portfolio Score** - 5-signal breakdown with visualizations
3. **Description** - Full program details
4. **Evidence** - Linked evidence records (if any)
5. **Outcomes** - Tracked outcomes (if any)
6. **Context** - Community contexts (if relevant)
7. **Similar Programs** - Other interventions in same type/state
8. **Community Authority** - Cultural authority display (if Community Controlled)
9. **Source Documents** - Links to original sources
10. **Revenue Share** - If Community Controlled, show revenue tracking

**Layout**:
```tsx
import { PortfolioScoreCard } from '@/components/alma/PortfolioScoreCard';
import { EvidenceList } from '@/components/alma/EvidenceList';
import { OutcomesList } from '@/components/alma/OutcomesList';
import { SimilarInterventions } from '@/components/alma/SimilarInterventions';

export default async function InterventionDetailPage({
  params
}: {
  params: { id: string }
}) {
  const intervention = await getInterventionWithRelations(params.id);
  const portfolioScore = await calculatePortfolioScore(params.id);
  const similar = await getSimilarInterventions(intervention);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold">{intervention.name}</h1>
          <ConsentBadge level={intervention.consent_level} />
        </div>

        {intervention.cultural_authority && (
          <div className="bg-ochre-50 p-4 rounded-lg">
            <p className="text-sm font-semibold">Cultural Authority</p>
            <p>{intervention.cultural_authority}</p>
          </div>
        )}
      </header>

      {/* Portfolio Score */}
      <PortfolioScoreCard
        interventionId={params.id}
        score={portfolioScore}
      />

      {/* Description */}
      <section className="prose max-w-none mb-8">
        <h2>About This Program</h2>
        <p>{intervention.description}</p>
      </section>

      {/* Evidence */}
      {intervention.evidence.length > 0 && (
        <EvidenceList evidence={intervention.evidence} />
      )}

      {/* Outcomes */}
      {intervention.outcomes.length > 0 && (
        <OutcomesList outcomes={intervention.outcomes} />
      )}

      {/* Similar Programs */}
      <SimilarInterventions interventions={similar} />
    </div>
  );
}
```

---

**NEW: Portfolio Dashboard** (`/app/intelligence/portfolio/page.tsx`)

**Purpose**: Decision support for funders and policy makers

**Features**:
- **Underfunded High-Evidence Programs** - Programs with strong evidence but low funding
- **Ready to Scale** - Programs with high implementation capability
- **High Risk** - Programs with harm risk signals
- **Learning Opportunities** - Programs with interesting patterns to study
- **State Comparison** - Compare QLD vs NSW vs VIC, etc.

**Uses**: `portfolio-service.ts` (already built!)

---

**NEW: Evidence Library** (`/app/intelligence/evidence/page.tsx`)

**Purpose**: Searchable evidence database for grant writers, researchers

**Features**:
- Filter by evidence type (RCT, Program evaluation, etc.)
- Search by findings, methodology
- Link to interventions using this evidence
- Download citations (APA, Harvard, etc.)
- Community Controlled source indicators

---

### 🟡 NEEDS EXTENSION - Existing Pages Enhanced with ALMA

**EXTEND: Community Programs** (`/app/community-programs/page.tsx`)

**Current**: Shows only `community_programs` table
**Enhanced**: Show hybrid view (`community_programs` + `alma_interventions`)

**Changes Needed**:
```tsx
// Before: Only community_programs
const programs = await supabase
  .from('community_programs')
  .select('*');

// After: Unified view with ALMA data
const programs = await supabase
  .from('unified_programs') // NEW VIEW
  .select('*');

// Show portfolio scores for linked programs
{programs.map(program => (
  <ProgramCard
    program={program}
    portfolioScore={program.alma_intervention_id
      ? calculatePortfolioScore(program.alma_intervention_id)
      : null
    }
    evidenceBadge={program.alma_intervention_id ? true : false}
  />
))}
```

---

**EXTEND: Profile Pages** (`/app/people/[slug]/page.tsx`)

**Current**: Shows person's bio, stories, affiliations
**Enhanced**: Show interventions they run/founded + portfolio scores

**New Section**:
```tsx
<section className="mb-12">
  <h2>Programs & Interventions</h2>

  {/* Linked via community_programs_profiles */}
  {profile.interventions.map(intervention => (
    <InterventionCard
      intervention={intervention}
      role={profile.role} // Founder, Coordinator, etc.
      showPortfolioScore
    />
  ))}

  {/* Revenue share display (if applicable) */}
  {profile.revenue_share_total > 0 && (
    <div className="bg-eucalyptus-50 p-6 rounded-lg">
      <h3>Revenue Earned from Intelligence</h3>
      <p className="text-2xl font-bold">
        ${profile.revenue_share_total.toLocaleString()}
      </p>
      <p className="text-sm">
        From grant citations, story licensing, speaking fees
      </p>
    </div>
  )}
</section>
```

---

**EXTEND: Story Pages** (`/app/stories/[slug]/page.tsx`)

**Current**: Shows story content, author, media
**Enhanced**: Link to ALMA interventions mentioned + evidence citations

**New Features**:
```tsx
<article className="prose max-w-none">
  {/* Story content */}
  <div dangerouslySetInnerHTML={{ __html: story.content }} />

  {/* NEW: Linked Interventions */}
  {story.mentioned_interventions.length > 0 && (
    <aside className="not-prose bg-sand-50 p-6 rounded-lg">
      <h3>Programs Featured in This Story</h3>
      {story.mentioned_interventions.map(intervention => (
        <InterventionCard
          intervention={intervention}
          compact
          showEvidenceBadge
        />
      ))}
    </aside>
  )}

  {/* NEW: Revenue Tracking */}
  {story.grant_citations.length > 0 && (
    <div className="bg-eucalyptus-50 p-6 rounded-lg">
      <h3>Impact: Grants Citing This Story</h3>
      <ul>
        {story.grant_citations.map(citation => (
          <li>
            {citation.organization} - ${citation.amount.toLocaleString()}
            <span className="text-sm text-gray-600">
              (Storyteller earned ${citation.revenue_share_amount})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )}
</article>
```

---

### 🔴 NEEDS TO BE BUILT - Admin ALMA Management

**NEW: Admin ALMA Section** (`/app/admin/alma/`)

**Intervention Manager** (`/app/admin/alma/interventions/page.tsx`)

**Features**:
- List all interventions with status (Draft, Community Review, Approved, Published)
- Bulk actions (approve, archive, delete)
- Filter by review status, consent level, state
- Create new intervention button

**Create/Edit Form** (`/app/admin/alma/interventions/new/page.tsx`)

**Uses**: InterventionFormData type (7 steps)
```typescript
// From types/alma.ts
export interface InterventionFormData {
  basic: {
    name: string;
    description: string;
    type: InterventionType;
  };
  governance: {
    consent_level: ConsentLevel;
    cultural_authority?: string;
    review_status: ReviewStatus;
  };
  location: {
    location_city?: string;
    location_state?: string;
    service_area?: string[];
  };
  target: {
    target_age_range?: string;
    target_cohort?: string;
  };
  operations: {
    delivery_model?: string;
    budget_annual?: number;
    staff_count?: number;
  };
  links: {
    outcome_ids?: string[];
    evidence_ids?: string[];
    context_ids?: string[];
  };
  sources: {
    source_documents: SourceDocument[];
  };
}
```

**Multi-step form**:
1. Basic Info (name, type, description)
2. Governance (consent level, cultural authority if needed)
3. Location & Scope (state, service area, geographic scope)
4. Target Cohort (age range, population served)
5. Operations (delivery model, budget, staff)
6. Evidence Links (link to existing evidence, outcomes, contexts)
7. Source Documents (URLs, scraped content, citations)

**Validation**: Uses `consent-service.ts` to enforce governance rules

---

**Ingestion Dashboard** (`/app/admin/alma/ingestion/page.tsx`)

**Purpose**: Monitor automated document collection

**Features**:
- View all ingestion jobs (status, created_at, processed_at)
- Trigger new crawls:
  - Government reports (auto-detect new publications)
  - Research papers (AIHW, universities)
  - Indigenous organization updates (NATSILS, SNAICC websites)
- Review extracted entities before approval:
  - Show what AI extracted (interventions, evidence, outcomes)
  - Manual review and edit
  - Approve to create database records
- Error handling:
  - Failed jobs with retry button
  - Logs of extraction errors
  - Quality checks (character count, field completeness)

**Uses**: `ingestion-service.ts` and `extraction-service.ts`

---

**Consent Administration** (`/app/admin/alma/consent/page.tsx`)

**Purpose**: Governance oversight of consent ledger

**Features**:
- View all consent ledger entries
- Filter by organization, consent level
- Edit consent agreements
- Track usage (how many times intelligence cited)
- Export reports for community partners

**Uses**: `consent-service.ts` and `alma_consent_ledger` table

---

**Revenue Reports** (`/app/admin/alma/revenue/page.tsx`)

**Purpose**: Financial transparency and payment tracking

**Features**:
- **Story Revenue**:
  - List all grant citations
  - Calculate 10% storyteller share
  - Payment status (pending, paid)
  - Export for accounting

- **State License Revenue**:
  - Show annual fees by state
  - Calculate 30% community share
  - Allocate to Community Controlled sources by state

- **Corporate Sponsorship Revenue**:
  - Show annual sponsorships
  - Calculate 60% direct grants to communities
  - Allocate to interventions by type

- **Research Partnership Revenue**:
  - Show annual fees
  - Calculate 50% Indigenous Advisory Board share
  - Track co-authorship payments

**Exports**:
- CSV for accounting
- PDF reports for community partners
- Quarterly summaries for funders

---

### 🟡 NEEDS TO BE BUILT - Revenue Model Pages

**Storyteller Dashboard** (`/app/dashboard/revenue/page.tsx`)

**Purpose**: Storytellers see their earnings

**Features**:
- Total revenue earned (all time)
- Grant citations using their stories
- Media licensing deals
- Speaking fees
- Payment history
- Pending payments

**Access**: Only accessible to storytellers (users with published stories)

---

**Corporate Sponsorship Portal** (`/app/sponsorships/page.tsx`)

**Purpose**: Corporates explore sponsorship opportunities

**Sections**:
1. **Hero** - "Sponsor evidence-based youth justice programs"
2. **Intervention Types** - Browse by type (Education/Employment, Cultural Connection, etc.)
3. **Impact Metrics** - Show outcomes tracked for each type
4. **Sponsorship Tiers**:
   - Flagship: $200K/year (exclusive, 1 intervention type)
   - Partner: $100K/year (shared, multiple types)
   - Supporter: $50K/year (general support)
5. **Application Form** - Contact form for initial inquiry

**Features**:
- Interactive intervention type selector
- Example community partners (NATSILS, SNAICC, Mount Isa Aunties)
- Case studies showing impact
- Tax deductibility information (JusticeHub is DGR-1 eligible)

---

**Sponsor Dashboard** (`/app/sponsors/[id]/dashboard/page.tsx`)

**Purpose**: Existing sponsors track their impact

**Features**:
- Total contribution to date
- Number of communities supported
- Quarterly impact reports (downloadable PDFs)
- Community partner directory (with consent)
- Usage analytics:
  - How many interventions funded
  - How many grants cited their sponsorship
  - Media mentions of their support
- Renewal management (auto-renew toggle)

**Access**: Restricted to authenticated sponsors

---

**State Government Licensing** (`/app/intelligence/licensing/page.tsx`)

**Purpose**: States explore licensing ALMA intelligence

**Sections**:
1. **Hero** - "Evidence-based policy for youth justice"
2. **What You Get**:
   - Annual subscription to ALMA intelligence for your state
   - Quarterly updates (new programs, evidence, outcomes)
   - National benchmarking (compare to other states)
   - Portfolio analytics (underfunded programs, ready to scale)
   - Evidence library for budget requests
3. **Pricing Tiers**:
   - Tier 1: $75K/year (QLD, NSW, VIC)
   - Tier 2: $50K/year (WA, SA, NT)
   - Tier 3: $25K/year (TAS, ACT)
4. **Case Study**: QLD Policy Tension identified, national context provided
5. **Contact Form**: Inquiry for state governments

---

**Research Partnership Portal** (`/app/research/page.tsx`)

**Purpose**: Universities explore research partnerships

**Sections**:
1. **Hero** - "Australia's most comprehensive youth justice dataset"
2. **What You Get**:
   - API access to full ALMA database
   - Co-authorship with Indigenous governance (NATSILS, SNAICC)
   - Community validation of findings (not extractive research)
   - Profile pages for researchers on JusticeHub
3. **Dataset Overview**:
   - 120 interventions, 7/8 states covered
   - 8 evidence records, 8 outcome records
   - 23 Community Controlled programs with governance
4. **Partnership Types**:
   - API Access: $25K/year (read-only)
   - Data Partnership: $50K/year (includes co-design with communities)
   - Research Grant Share: 20% of grants using ALMA data
5. **Indigenous Governance** - Explain Advisory Board role
6. **Contact Form**: Inquiry for universities

---

## Component Library: ALMA Reusable Components

### 🔴 HIGH PRIORITY - Core Display Components

**PortfolioScoreCard.tsx**
```tsx
interface PortfolioScoreCardProps {
  interventionId: string;
  score: PortfolioScore; // From portfolio-service.ts
}

export function PortfolioScoreCard({ interventionId, score }: PortfolioScoreCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Portfolio Score</h3>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-ochre-600">
          {(score.composite * 100).toFixed(0)}
        </div>
        <p className="text-sm text-gray-600">Overall Score</p>
      </div>

      {/* 5 Signal Breakdown */}
      <div className="space-y-4">
        <SignalGauge
          label="Evidence Strength"
          value={score.evidence_strength}
          color="blue"
        />
        <SignalGauge
          label="Community Authority"
          value={score.community_authority}
          color="ochre"
          weight={30} // Highest weight
        />
        <SignalGauge
          label="Harm Risk"
          value={score.harm_risk}
          color="red"
          inverted // Lower is better
        />
        <SignalGauge
          label="Implementation Capability"
          value={score.implementation_capability}
          color="green"
        />
        <SignalGauge
          label="Option Value"
          value={score.option_value}
          color="purple"
        />
      </div>

      {/* Recommendations */}
      {score.recommendations && (
        <div className="mt-6 bg-eucalyptus-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Recommendations</h4>
          <ul className="text-sm space-y-1">
            {score.recommendations.map((rec, i) => (
              <li key={i}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

**SignalGauge.tsx**
```tsx
interface SignalGaugeProps {
  label: string;
  value: number; // 0.0 to 1.0
  color: 'blue' | 'ochre' | 'red' | 'green' | 'purple';
  weight?: number; // For Community Authority (30%)
  inverted?: boolean; // For Harm Risk (lower is better)
}

export function SignalGauge({ label, value, color, weight, inverted }: SignalGaugeProps) {
  const percentage = Math.round(value * 100);
  const displayValue = inverted ? 100 - percentage : percentage;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">
          {displayValue}%
          {weight && <span className="ml-1 text-xs">(weight: {weight}%)</span>}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-${color}-600`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}
```

---

**EvidenceBadge.tsx**
```tsx
interface EvidenceBadgeProps {
  evidenceCount: number;
  evidenceType?: 'RCT' | 'Program evaluation' | 'Case study' | null;
}

export function EvidenceBadge({ evidenceCount, evidenceType }: EvidenceBadgeProps) {
  if (evidenceCount === 0) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
        No Evidence
      </span>
    );
  }

  const color = evidenceType === 'RCT'
    ? 'green'
    : evidenceType === 'Program evaluation'
    ? 'blue'
    : 'yellow';

  return (
    <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 rounded text-xs font-medium`}>
      {evidenceCount} {evidenceCount === 1 ? 'Evidence' : 'Evidence Records'}
      {evidenceType && ` (${evidenceType})`}
    </span>
  );
}
```

---

**ConsentIndicator.tsx**
```tsx
interface ConsentIndicatorProps {
  consentLevel: 'Public Knowledge Commons' | 'Community Controlled' | 'Strictly Private';
  culturalAuthority?: string;
}

export function ConsentIndicator({ consentLevel, culturalAuthority }: ConsentIndicatorProps) {
  const colors = {
    'Public Knowledge Commons': 'bg-blue-100 text-blue-800',
    'Community Controlled': 'bg-ochre-100 text-ochre-800',
    'Strictly Private': 'bg-red-100 text-red-800'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[consentLevel]}`}>
        {consentLevel}
      </span>

      {culturalAuthority && (
        <span className="text-sm text-gray-600">
          Governed by: {culturalAuthority}
        </span>
      )}
    </div>
  );
}
```

---

**InterventionCard.tsx**
```tsx
interface InterventionCardProps {
  intervention: AlmaIntervention;
  showPortfolioScore?: boolean;
  showEvidenceBadge?: boolean;
  compact?: boolean;
}

export async function InterventionCard({
  intervention,
  showPortfolioScore = false,
  showEvidenceBadge = false,
  compact = false
}: InterventionCardProps) {
  const portfolioScore = showPortfolioScore
    ? await calculatePortfolioScore(intervention.id)
    : null;

  return (
    <Link href={`/intelligence/interventions/${intervention.id}`}>
      <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition">
        <div className="flex items-start justify-between mb-4">
          <h3 className={compact ? 'text-lg font-semibold' : 'text-xl font-bold'}>
            {intervention.name}
          </h3>

          {showEvidenceBadge && (
            <EvidenceBadge
              evidenceCount={intervention.evidence?.length || 0}
              evidenceType={intervention.evidence?.[0]?.evidence_type}
            />
          )}
        </div>

        <ConsentIndicator
          consentLevel={intervention.consent_level}
          culturalAuthority={intervention.cultural_authority}
        />

        {!compact && (
          <p className="text-gray-600 mt-4 line-clamp-3">
            {intervention.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>Type: {intervention.type}</span>
          {intervention.metadata?.state && (
            <span>State: {intervention.metadata.state}</span>
          )}
        </div>

        {showPortfolioScore && portfolioScore && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Portfolio Score</span>
              <span className="text-2xl font-bold text-ochre-600">
                {(portfolioScore.composite * 100).toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
```

---

## API Routes: What Needs to Be Built

### 🔴 HIGH PRIORITY - ALMA Data Access

**GET `/api/alma/interventions`**
- Query params: `state`, `type`, `evidence_level`, `consent_level`, `search`
- Returns: Array of interventions with optional portfolio scores
- Uses: `intervention-service.ts` methods

**GET `/api/alma/interventions/[id]`**
- Returns: Single intervention with relations (outcomes, evidence, contexts)
- Includes: Portfolio score calculation
- Uses: `intervention-service.ts.getInterventionWithRelations()`

**GET `/api/alma/portfolio/analytics`**
- Returns: Portfolio analysis (underfunded, ready-to-scale, high-risk)
- Uses: `portfolio-service.ts` methods

**GET `/api/alma/evidence`**
- Query params: `evidence_type`, `search`
- Returns: Array of evidence records with linked interventions

**GET `/api/alma/outcomes`**
- Query params: `outcome_type`, `beneficiary`
- Returns: Array of outcomes with linked interventions

---

### 🟡 MEDIUM PRIORITY - Revenue Tracking

**POST `/api/revenue/grant-citation`**
- Body: `{ story_id, grant_organization, grant_amount }`
- Creates: `story_revenue_ledger` entry
- Calculates: 10% storyteller share
- Returns: Revenue ledger record

**GET `/api/revenue/storyteller/[profile_id]`**
- Returns: All revenue earned by storyteller
- Includes: Pending and paid amounts
- Uses: `story_revenue_ledger` table

**POST `/api/sponsors/apply`**
- Body: Sponsorship application form
- Creates: Preliminary `corporate_sponsors` record
- Sends: Email to JusticeHub admin for review
- Returns: Application confirmation

**GET `/api/sponsors/[id]/impact`**
- Returns: Impact metrics for sponsor dashboard
- Includes: Communities supported, grants funded, outcomes tracked

---

### 🟢 LOW PRIORITY - Research & Licensing

**POST `/api/research/partnerships`**
- Body: Research partnership application
- Creates: Preliminary `research_partnerships` record
- Generates: API key (if approved)
- Returns: Partnership details

**GET `/api/research/export`**
- Auth: Requires valid API key
- Query params: `format` (csv, json), `filter` (state, type)
- Returns: Dataset export for research
- Logs: Usage in `research_partnerships.usage_stats`

**POST `/api/licensing/state`**
- Body: State government licensing inquiry
- Creates: Preliminary `state_licenses` record
- Sends: Email to JusticeHub admin
- Returns: Inquiry confirmation

---

## Implementation Phases

### Phase 1: Core ALMA Display (3 weeks) 🔴

**Goal**: Make ALMA intelligence visible to public

**Backend** (1 week):
- ✅ Already complete (database + service layer)
- Add revenue tracking tables (1 day)
- Create unified views for hybrid linking (1 day)
- Build API routes for interventions, evidence, outcomes (2 days)

**Frontend** (2 weeks):
- Build ALMA component library (3 days):
  - PortfolioScoreCard
  - SignalGauge
  - EvidenceBadge
  - ConsentIndicator
  - InterventionCard
- Create intelligence hub page (2 days)
- Create intervention directory page (2 days)
- Create intervention detail pages (2 days)
- Create portfolio dashboard (2 days)
- Create evidence library page (1 day)

**Deliverable**: `/intelligence` section live with all 120 interventions browsable

---

### Phase 2: Admin ALMA Management (2 weeks) 🔴

**Goal**: Enable JusticeHub team to manage ALMA data

**Frontend** (2 weeks):
- Build intervention CRUD UI (5 days):
  - List view with filters
  - Multi-step create/edit form (7 steps)
  - Governance validation integration
- Build ingestion dashboard (3 days):
  - Job status monitoring
  - Trigger new crawls
  - Review extracted entities
- Build consent administration (2 days):
  - Consent ledger view
  - Edit consent agreements
- Build revenue reports (2 days):
  - Story revenue tracking
  - Sponsorship allocation
  - Export for accounting

**Deliverable**: `/admin/alma` section complete, team can manage all ALMA data

---

### Phase 3: Hybrid Linking (1 week) 🟡

**Goal**: Merge existing community_programs with alma_interventions

**Backend** (3 days):
- Build auto-linking service:
  - Fuzzy matching on name, organization, location
  - Confidence scoring
  - Deduplication logic
- Create unified views in database
- Build API routes for manual linking

**Frontend** (2 days):
- Build linking UI in admin:
  - View unlinked programs
  - Auto-link suggestions with confidence
  - Manual link/unlink controls
- Update community programs page to use unified view

**Deliverable**: All programs show ALMA intelligence where linked

---

### Phase 4: Revenue Model (2 weeks) 🟡

**Goal**: Enable revenue tracking and payments

**Backend** (1 week):
- Build revenue tracking tables
- Create API routes for grant citations, sponsorships, licenses
- Build revenue calculation logic
- Set up payment workflows (integration with Stripe/Xero)

**Frontend** (1 week):
- Build storyteller dashboard (2 days)
- Build corporate sponsorship portal (2 days)
- Build sponsor dashboard (1 day)
- Build state licensing page (1 day)
- Build research partnership page (1 day)

**Deliverable**: All revenue streams have public-facing portals and tracking

---

### Phase 5: Integration & Polish (2 weeks) 🟢

**Goal**: ALMA intelligence seamlessly integrated across entire site

**Tasks**:
- Extend profile pages with intervention links (2 days)
- Extend story pages with intervention links + revenue tracking (2 days)
- Extend community programs page with portfolio scores (1 day)
- Extend service finder with ALMA intelligence overlay (2 days)
- Build state-specific dashboards (2 days)
- Build research API documentation (2 days)
- Testing, bug fixes, performance optimization (3 days)

**Deliverable**: Full ALMA integration, production-ready

---

## Total Timeline: 10 Weeks to Production

```
Week 1-3:   Phase 1 (Core ALMA Display)
Week 4-5:   Phase 2 (Admin Management)
Week 6:     Phase 3 (Hybrid Linking)
Week 7-8:   Phase 4 (Revenue Model)
Week 9-10:  Phase 5 (Integration & Polish)
```

---

## Technology Stack Summary

**Frontend**:
- Next.js 14 (App Router, React Server Components)
- Tailwind CSS (ACT theme: ochre, sand, eucalyptus)
- Shadcn/ui components
- Chart.js or Recharts for visualizations

**Backend**:
- Supabase PostgreSQL (already has ALMA tables)
- Row-Level Security (RLS) for access control
- Realtime subscriptions for live updates

**Services**:
- TypeScript service layer (intervention-service, portfolio-service, etc.)
- Firecrawl for web scraping
- Anthropic Claude for AI extraction
- Jina AI for document processing

**Deployment**:
- Vercel (Next.js hosting)
- Supabase Cloud (PostgreSQL)
- CDN for media (Supabase Storage or Cloudinary)

---

## Success Metrics

### Technical
- ✅ All 120 interventions visible on /intelligence
- ✅ Portfolio scoring working (5-signal framework)
- ✅ Admin can create/edit interventions via UI
- ✅ Auto-linking matches >80% of community_programs to alma_interventions
- ✅ Revenue tracking captures all grant citations
- ✅ Page load time <2s for intelligence hub
- ✅ Mobile responsive across all ALMA pages

### User Experience
- ✅ Funders can explore interventions and download evidence library
- ✅ Storytellers can see their revenue earned
- ✅ Researchers can apply for API access
- ✅ Community orgs can see their portfolio scores
- ✅ State governments can explore licensing

### Business
- ✅ 1+ state government licensing inquiry within 30 days
- ✅ 1+ corporate sponsorship inquiry within 30 days
- ✅ 5+ community organizations claim their profiles
- ✅ 10+ grant citations tracked
- ✅ $10K+ revenue generated in first 90 days

---

## Next Steps (Immediate)

### This Week:
1. **Create Phase 1 sprint plan** (break down 3-week build)
2. **Set up development environment** (Next.js + Supabase local)
3. **Build first component**: PortfolioScoreCard
4. **Create first page**: /intelligence hub

### This Month:
1. **Complete Phase 1** (intelligence hub live)
2. **Start Phase 2** (admin management)
3. **First funding inquiry** (test licensing page with QLD contact)

### This Quarter:
1. **Complete all 5 phases** (10-week build)
2. **Launch public intelligence hub**
3. **First revenue** (grant citation or sponsorship)
4. **Mindaroo pitch** (with live ALMA intelligence demo)

---

**The backend is ready. The strategy is clear. The revenue model is designed.**

**Now we build the interface that surfaces this intelligence to the world.**

✨

---

**Document Created**: January 1, 2026
**Status**: Implementation roadmap complete
**Next Action**: Create Phase 1 sprint plan and start building

# JusticeHub Data Governance Master Plan
## Comprehensive Data Architecture, Quality & Management Strategy

**Version:** 1.0  
**Date:** 2026-02-13  
**Status:** Active Implementation

---

## 📋 Executive Summary

JusticeHub manages a complex ecosystem of data types spanning youth justice interventions, community contexts, evidence, and outcomes. This document provides a complete inventory of all data types, identifies overlaps, and establishes governance protocols for data cleanliness, enrichment, and lifecycle management.

**Current Scale:**
- **5,782 total records** across all tables
- **1,115 interventions** (primary dataset)
- **2,544 discovered links** (pipeline)
- **10 distinct entity types** with relationships

---

## 🗄️ Complete Data Type Inventory

### 1. ALMA Core Entities (Primary Justice Data)

#### 1.1 Interventions (`alma_interventions`) - 1,115 records
**Purpose:** Programs and practices addressing youth justice

**Data Fields:**
```yaml
Identity:
  - id: UUID (primary key)
  - name: TEXT (program name)
  - type: ENUM [10 types]
  - description: TEXT

Classification:
  - type: Prevention | Early Intervention | Diversion | Therapeutic | 
          Wraparound Support | Family Strengthening | Cultural Connection | 
          Education/Employment | Justice Reinvestment | Community-Led
  - target_cohort: TEXT[] (age groups, demographics)
  - geography: TEXT[] (states, regions)

Governance (CRITICAL):
  - cultural_authority: TEXT (who holds authority)
  - consent_level: Public Knowledge Commons | Community Controlled | Strictly Private
  - permitted_uses: TEXT[] (allowed actions)
  - contributors: TEXT[] (attribution)
  - review_status: Draft | Community Review | Approved | Published | Archived

Quality Signals:
  - evidence_level: Promising | Effective | Proven | Indigenous-led | Untested
  - harm_risk_level: Low | Medium | High | Requires cultural review
  - portfolio_score: DECIMAL (0-1 calculated)
  - evidence_strength_signal: DECIMAL (0-1)
  - community_authority_signal: DECIMAL (0-1)

Implementation:
  - implementation_cost: Low | Medium | High | Unknown
  - cost_per_young_person: DECIMAL
  - scalability: Local | Regional | State-wide | National
  - years_operating: INTEGER
  - current_funding: Unfunded | Pilot | Established | Oversubscribed | At-risk

Relationships:
  - linked_service_id: UUID → services
  - linked_community_program_id: UUID → community_programs
  - source_documents: JSONB (references)
  - metadata: JSONB (flexible storage)
```

**Data Quality Metrics:**
- Completeness: 85% (name, type, description required)
- Governance coverage: 90% (consent_level populated)
- Cultural authority: 65% (needs improvement)
- Portfolio scores: 40% calculated

---

#### 1.2 Community Contexts (`alma_community_contexts`) - 10 records
**Purpose:** Place-based and cultural contexts for interventions

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - name: TEXT (e.g., "Wiradjuri Nation - Regional NSW")
  - context_type: ENUM [7 types]

Location:
  - location: TEXT (general, privacy-respecting)
  - state: VIC | NSW | QLD | SA | WA | TAS | NT | ACT
  - population_size: <1,000 | 1,000-10,000 | 10,000-50,000 | 50,000+

Context:
  - demographics: TEXT (culturally safe description)
  - system_factors: TEXT (over-policing, service gaps, trauma)
  - protective_factors: TEXT (community strengths)

Governance (REQUIRED):
  - cultural_authority: TEXT (MANDATORY)
  - consent_level: ENUM
  - contributors: TEXT[]
```

**Gap:** Severely underpopulated (only 10 contexts for 1,115 interventions)

---

#### 1.3 Evidence (`alma_evidence`) - 100 records
**Purpose:** Research, evaluations, and outcome data

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - title: TEXT
  - evidence_type: RCT | Quasi-experimental | Program evaluation | 
                   Longitudinal | Case study | Community-led research | 
                   Lived experience | Cultural knowledge | Policy analysis

Study Details:
  - methodology: TEXT
  - sample_size: INTEGER
  - timeframe: TEXT
  - findings: TEXT (MANDATORY)
  - effect_size: Large | Moderate | Small | Null | Mixed
  - limitations: TEXT

Cultural Safety:
  - cultural_safety: Culturally grounded | Adapted | Neutral | Concerns | Unknown

Source:
  - author: TEXT
  - organization: TEXT
  - publication_date: DATE
  - doi: TEXT
  - source_url: TEXT
  - source_document_url: TEXT

Governance:
  - consent_level: ENUM
  - contributors: TEXT[]
```

**Gap:** Only 100 evidence records for 1,115 interventions (9% coverage)

---

#### 1.4 Outcomes (`alma_outcomes`) - 26 records
**Purpose:** Intended and measured results

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - name: TEXT
  - outcome_type: ENUM [12 types]
    - Reduced detention/incarceration
    - Reduced recidivism
    - Diversion from justice system
    - Educational engagement
    - Employment/training
    - Family connection
    - Cultural connection
    - Mental health/wellbeing
    - Reduced substance use
    - Community safety
    - System cost reduction
    - Healing/restoration
  - description: TEXT

Measurement:
  - measurement_method: TEXT
  - indicators: TEXT (quantitative/qualitative)
  - time_horizon: Immediate | Short-term | Medium-term | Long-term
  - beneficiary: Young person | Family | Community | System/Government
```

**Gap:** Severely underpopulated (26 outcomes for 1,115 interventions)

---

### 2. Scraping & Discovery Pipeline

#### 2.1 Discovered Links (`alma_discovered_links`) - 2,544 records
**Purpose:** URL queue for scraping pipeline

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - url: TEXT (unique)
  - title: TEXT

Classification:
  - predicted_type: government | indigenous | research | advocacy | program | website
  - predicted_relevance: DECIMAL (0-1)
  - relevance_category: high | medium | low
  - jurisdiction_hint: TEXT

Tracking:
  - discovered_from: TEXT (source URL)
  - status: pending | queued | scraped | error | rejected
  - priority: INTEGER
  - scraped_at: TIMESTAMP
  - error_message: TEXT
  - rejection_reason: TEXT

Metadata:
  - metadata: JSONB (discovery info, content preview)
```

**Status Breakdown:**
- Pending: ~1,561 (61%)
- Scraped: ~750 (29%)
- Error/Rejected: ~233 (10%)

---

#### 2.2 Sources Registry (`alma_sources`) - 0 records
**Purpose:** Curated list of trusted data sources

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - name: TEXT
  - url: TEXT (unique)
  - type: ENUM [6 types]

Classification:
  - jurisdiction: TEXT
  - priority: INTEGER (1-100)
  - cultural_authority: BOOLEAN

Health Tracking:
  - active: BOOLEAN
  - health_status: healthy | unhealthy | unknown
  - last_scraped: TIMESTAMP
  - last_health_check: TIMESTAMP
  - scrape_count: INTEGER
  - error_count: INTEGER

Metadata:
  - metadata: JSONB (requires_js, ssl_issues, etc.)
```

**Gap:** Table exists but empty (should have 23+ sources)

---

#### 2.3 Ingestion Jobs (`alma_ingestion_jobs`) - 166 records
**Purpose:** Track scraping and processing jobs

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - job_type: scrape | dedup | enrich | import | export
  
Status:
  - status: pending | running | completed | failed | completed_with_errors
  - started_at: TIMESTAMP
  - completed_at: TIMESTAMP
  
Configuration:
  - config: JSONB (job parameters)
  - stats: JSONB (results summary)
```

---

#### 2.4 Funding Opportunities (`alma_funding_opportunities`) - 0 records
**Purpose:** Grants and funding sources

**Data Fields:**
```yaml
Identity:
  - id: UUID
  - name: TEXT
  - description: TEXT
  - category: ENUM
  
Funding:
  - funder_name: TEXT
  - min_grant_amount: DECIMAL
  - max_grant_amount: DECIMAL
  - deadline: DATE
  - status: open | closing_soon | closed
  
Relevance:
  - relevance_score: INTEGER (0-100)
  - jurisdictions: TEXT[]
  - focus_areas: TEXT[]
```

**Gap:** Empty table (funding scraper not run)

---

### 3. JusticeHub Legacy Entities

#### 3.1 Services (`services`) - 508 records
**Purpose:** Original service directory (being migrated to ALMA)

**Overlap with ALMA:**
- Services vs alma_interventions: ~200+ potential duplicates
- Migration status: Partial (linked_service_id field)

**Data Quality:** Legacy data, varying completeness

---

#### 3.2 Organizations (`organizations`) - 471 records
**Purpose:** Organization directory

**Relationships:**
- alma_interventions.operating_organization → organizations
- Many interventions reference orgs by name only (not ID)

---

#### 3.3 Community Programs (`community_programs`) - 0 records
**Purpose:** Community-specific programs (empty, needs population)

---

### 4. Content & Media

#### 4.1 Articles (`articles`) - 39 records
**Purpose:** Blog posts and publications

**Types:**
- News
- Research summaries
- Case studies
- Opinion pieces

---

#### 4.2 Stories (`stories`) - 1 record
**Purpose:** Personal narratives and lived experience

**Gap:** Severely underutilized (should have 100+)

---

#### 4.3 Events (`events`) - 9 records
**Purpose:** Conferences, workshops, training

---

### 5. User & Access Management

#### 5.1 Users (`users`) - 3 records
**Purpose:** Authentication

#### 5.2 Profiles (`profiles`) - 3 records
**Purpose:** User profiles and roles

---

## 🔍 Data Overlap Analysis

### Critical Overlaps Identified

#### 1. Services ↔ Interventions (HIGH PRIORITY)
```
services: 508 records
alma_interventions: 1,115 records
Estimated overlap: 200-300 records

Overlap Types:
- Same program in both tables
- Services migrating to ALMA via linked_service_id
- Duplicate information between tables

Resolution:
✅ linked_service_id field exists for migration tracking
⚠️ Need to complete migration
⚠️ Need deduplication between tables
```

#### 2. Organizations ↔ Intervention Operating Org
```
organizations: 471 records
alma_interventions.operating_organization: TEXT field

Overlap Issue:
- Interventions store org names as TEXT
- Not linked to organizations.id
- Cannot query by organization effectively

Resolution:
⚠️ Add operating_organization_id foreign key
⚠️ Normalize org names to IDs
```

#### 3. Discovered Links ↔ Sources
```
alma_discovered_links: 2,544 URLs
alma_sources: 0 records (empty)

Issue:
- Sources registry not populated
- Cannot track source health systematically
- No priority scoring for sources

Resolution:
⚠️ Populate alma_sources from discovered_links
⚠️ Create source management workflow
```

#### 4. Evidence ↔ Intervention Links
```
alma_evidence: 100 records
alma_interventions: 1,115 records
alma_intervention_evidence: ~50 links

Issue:
- Only 50 interventions have evidence links
- 4.5% evidence coverage
- Cannot assess intervention effectiveness

Resolution:
🔴 Critical gap - need evidence enrichment
```

---

## 🧹 Data Cleanliness Strategy

### Current Cleanliness Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Duplicate rate | <5% | 10% | 🔴 High |
| Missing required fields | <2% | 15% | 🔴 High |
| Broken URLs | <3% | 5% | 🟡 Medium |
| Orphaned records | <1% | 8% | 🔴 High |
| Schema compliance | 100% | 85% | 🟡 Medium |

### Cleanliness Protocols

#### 1. Automated Deduplication (Weekly)
```sql
-- Run weekly
SELECT run_deduplication_job();

Checks:
- Name similarity (fuzzy matching)
- URL exact matches
- Content hash comparison
- AI semantic similarity
```

**Script:** `alma-deduplicate-enhanced.mjs`

#### 2. URL Health Checks (Monthly)
```sql
-- Check all source URLs
UPDATE alma_discovered_links
SET status = 'error'
WHERE url NOT responding;

Remove or update broken links
```

**Script:** `alma-unified-scraper.mjs health-check`

#### 3. Schema Validation (Continuous)
```yaml
Required Fields Check:
  - name: NOT NULL
  - type: NOT NULL, in ENUM
  - description: NOT NULL, length > 50
  - consent_level: NOT NULL
  - review_status: NOT NULL

Governance Check:
  - IF consent_level != 'Public Knowledge Commons'
    THEN cultural_authority IS NOT NULL

Quality Check:
  - description length >= 100 characters
  - geography array not empty
  - target_cohort array not empty
```

#### 4. Orphan Detection (Monthly)
```sql
-- Find orphaned records
SELECT * FROM alma_interventions
WHERE linked_service_id NOT IN (SELECT id FROM services);

-- Find unlinked evidence
SELECT * FROM alma_evidence e
WHERE NOT EXISTS (
  SELECT 1 FROM alma_intervention_evidence ie
  WHERE ie.evidence_id = e.id
);
```

---

## 🔄 Continuous Enrichment Plan

### Enrichment Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ENRICHMENT PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: Discovery                                              │
│  ├── RSS Feed Monitoring → New articles, reports                │
│  ├── Web Scraping → Program pages, documents                    │
│  ├── PDF Mining → Annual reports, evaluations                   │
│  └── Search API → New programs, organizations                   │
│                           ↓                                      │
│  STAGE 2: Extraction                                             │
│  ├── Firecrawl → Content extraction                             │
│  ├── Claude/GPT → Entity extraction, summarization              │
│  ├── PDF Parser → Document text extraction                      │
│  └── Validator → Quality checks, relevance scoring              │
│                           ↓                                      │
│  STAGE 3: Enrichment                                             │
│  ├── Evidence Linking → Connect research to programs            │
│  ├── Context Mapping → Geographic, cultural context             │
│  ├── Outcome Attribution → Measure results                      │
│  └── Signal Calculation → Portfolio scores, quality metrics     │
│                           ↓                                      │
│  STAGE 4: Quality Assurance                                      │
│  ├── Deduplication → Remove duplicates                          │
│  ├── Schema Validation → Check required fields                  │
│  ├── Governance Review → Consent, cultural authority            │
│  └── Human Review → Community validation                        │
│                           ↓                                      │
│  STAGE 5: Publication                                            │
│  ├── Search Index Update → Full-text search vectors             │
│  ├── API Cache Refresh → Invalidate caches                      │
│  ├── Analytics Update → Refresh materialized views              │
│  └── Notification → Alert subscribers                           │
└─────────────────────────────────────────────────────────────────┘
```

### Enrichment Scripts

#### 1. Evidence Linking
```javascript
// alma-evidence-linker.mjs
// Links interventions to relevant evidence

async function linkEvidenceToInterventions() {
  // For each intervention without evidence
  // Search evidence table for matching keywords
  // Create alma_intervention_evidence links
  // Update evidence_level on intervention
}
```

#### 2. Context Enrichment
```javascript
// alma-context-enricher.mjs
// Enriches geographic and cultural context

async function enrichContexts() {
  // Extract location from intervention description
  // Match to alma_community_contexts
  // Create alma_intervention_contexts links
  // Update geography array
}
```

#### 3. Signal Recalculation
```javascript
// alma-signal-recalc.mjs
// Recalculates portfolio signals

async function recalculateSignals() {
  // For all interventions
  // Call calculate_portfolio_signals() function
  // Update portfolio_score and component signals
}
```

---

## 📝 Data Editing & Change Management

### Edit Workflows

#### 1. User-Initiated Edits
```yaml
Flow:
  1. User submits edit via UI/API
  2. Validation (schema, governance)
  3. Review status check
     - IF Published → Create revision, queue for review
     - IF Draft → Apply directly
     - IF Community Controlled → Require cultural authority approval
  4. Update record
  5. Log change in audit trail
  6. Update search vectors
  7. Notify contributors
```

#### 2. Automated Edits (Scraping)
```yaml
Flow:
  1. Scraper extracts data
  2. Validation (quality, relevance)
  3. Deduplication check
  4. Insert as Draft
  5. Queue for human review
  6. Auto-enrich (signals, search vectors)
```

#### 3. Bulk Updates
```yaml
Flow:
  1. Create ingestion job record
  2. Process batch
  3. Validation per record
  4. Transactional update (all or none)
  5. Job status tracking
  6. Report generation
```

### Change Audit Trail

All changes tracked in:
- `alma_usage_log` (high-level actions)
- Record `metadata` field (change history)
- `alma_ingestion_jobs` (batch operations)

### Governance Approval Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE APPROVAL FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Public Knowledge Commons                                        │
│  ├── Auto-approve (standard review)                             │
│  └── Publish immediately                                        │
│                                                                  │
│  Community Controlled                                            │
│  ├── Require cultural_authority approval                        │
│  ├── 48-hour review period                                      │
│  └── Publish after approval                                     │
│                                                                  │
│  Strictly Private                                                │
│  ├── Internal use only                                          │
│  ├── Cannot publish publicly                                    │
│  └── Query access only                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Quality Dashboard

### Metrics to Track

| Category | Metric | Frequency | Target |
|----------|--------|-----------|--------|
| **Completeness** | Required fields filled | Daily | >98% |
| | Description length avg | Weekly | >200 chars |
| | Governance fields | Weekly | >90% |
| **Uniqueness** | Duplicate rate | Weekly | <5% |
| | URL uniqueness | Daily | 100% |
| **Validity** | Schema compliance | Continuous | 100% |
| | ENUM value validity | Daily | 100% |
| **Timeliness** | Data freshness | Weekly | <30 days |
| | Review status age | Weekly | <90 days |
| **Consistency** | Cross-table references | Monthly | >95% |
| | Signal calculation | Weekly | 100% |

### Quality Alerts

```yaml
Critical Alerts:
  - Duplicate rate >10%
  - Broken URL rate >10%
  - Schema violation >5%
  - Orphaned records >5%

Warning Alerts:
  - Duplicate rate >5%
  - Missing governance fields >15%
  - Data age >60 days
  - Queue backlog >2000
```

---

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Populate alma_sources registry
- [ ] Fix schema compliance issues
- [ ] Set up automated deduplication
- [ ] Create data quality dashboard

### Phase 2: Cleanup (Week 3-4)
- [ ] Services → Interventions migration
- [ ] Organization normalization
- [ ] URL health check cleanup
- [ ] Evidence linking campaign

### Phase 3: Enrichment (Month 2)
- [ ] Context enrichment for all interventions
- [ ] Evidence database expansion (+500)
- [ ] Outcome definition expansion (+100)
- [ ] Signal recalculation

### Phase 4: Automation (Month 3)
- [ ] Continuous RSS monitoring
- [ ] Automated quality checks
- [ ] Self-healing data pipeline
- [ ] Real-time quality dashboard

---

## ✅ Immediate Action Items

### Today
```bash
# 1. Populate sources registry
node scripts/alma-populate-sources.mjs

# 2. Run comprehensive deduplication
node scripts/alma-deduplicate-enhanced.mjs --mode merge --confirm

# 3. Check schema compliance
node scripts/alma-validate-schema.mjs --report

# 4. Recalculate portfolio signals
node scripts/alma-signal-recalc.mjs --all
```

### This Week
```bash
# 1. Evidence linking campaign
node scripts/alma-evidence-linker.mjs --batch 100

# 2. Context enrichment
node scripts/alma-context-enricher.mjs

# 3. URL health check
node scripts/alma-url-health-check.mjs

# 4. Create quality dashboard
node scripts/alma-quality-dashboard.mjs --setup
```

---

## 📚 Appendix: Data Dictionary

### Complete Field Reference

See individual migration files for full schema:
- `20250131000001_alma_core_entities.sql` - ALMA entities
- `20250209000000_add_alma_sources_table.sql` - Sources
- `20260120000001_alma_funding_opportunities.sql` - Funding

### Relationship Diagram

```
alma_interventions ||--o{ alma_intervention_outcomes : has
alma_interventions ||--o{ alma_intervention_evidence : supported_by
alma_interventions ||--o{ alma_intervention_contexts : operates_in
alma_interventions ||--|| services : may_link_to
alma_interventions }o--|| organizations : operated_by

alma_evidence ||--o{ alma_evidence_outcomes : measures

alma_sources ||--o{ alma_discovered_links : generates
alma_discovered_links ||--o{ alma_ingestion_jobs : processed_by
```

---

**Document Status:** Living document, updated weekly  
**Owner:** Data Governance Team  
**Review Cycle:** Monthly  
**Next Review:** 2026-03-13

---

*For questions or issues, refer to the migration files or contact the data team.*

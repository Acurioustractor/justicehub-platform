# ALMA Data Collection Infrastructure

## Overview

ALMA requires a robust, consent-aware data collection system that can:
1. **Automatically discover** new interventions and services
2. **Continuously update** existing records with new evidence
3. **Respect data sovereignty** and community consent levels
4. **Scale across jurisdictions** without manual intervention

## Current State

```
Manual Entry → Database → Static Display
```

### Limitations
- Relies on manual data entry
- Evidence links require human curation
- No automatic updates when new research is published
- Limited coverage of remote and Indigenous-led programs

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA COLLECTION LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Government │  │  Academic   │  │  Community  │  │   NGO/      │       │
│  │  Sources    │  │  Sources    │  │  Sources    │  │   Charity   │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │               │
│         ▼                ▼                ▼                ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INTELLIGENT INGESTION PIPELINE                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Discover│→ │ Extract │→ │ Classify│→ │ Validate│→ │ Store   │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Sources

### 1. Government Sources (High Priority)

| Source | Type | Update Frequency | Consent Level |
|--------|------|------------------|---------------|
| AIHW Youth Justice Reports | Statistics | Annual | Public |
| Productivity Commission ROGS | Cost data | Annual | Public |
| State Youth Justice Depts | Programs | Quarterly | Public |
| Sentencing Advisory Councils | Outcomes | As published | Public |
| AICS Crime Statistics | Research | Monthly | Public |

**Collection Method:** Scheduled scraping + RSS monitoring

### 2. Academic Sources (Medium Priority)

| Source | Type | Collection Method |
|--------|------|-------------------|
| AIC Publications | Research papers | API/RSS |
| University repositories | Theses, evaluations | DOI lookup |
| Criminology journals | Peer-reviewed studies | CrossRef API |
| Google Scholar | Citations, new papers | Scraping |

**Collection Method:** CrossRef API + Google Scholar monitoring

### 3. Community Sources (Critical - Consent Required)

| Source | Type | Consent Process |
|--------|------|-----------------|
| Indigenous organizations | Program data | Direct partnership |
| Community services | Service listings | Opt-in registration |
| Lived experience | Stories, outcomes | Empathy Ledger |
| Cultural authorities | Cultural endorsements | FPIC process |

**Collection Method:** Community portal for direct submission

### 4. NGO/Charity Sources (Medium Priority)

| Source | Type | Collection Method |
|--------|------|-------------------|
| ACNC Registry | Organization data | API |
| Annual reports | Outcomes, reach | Document parsing |
| Grant databases | Funding flows | Web scraping |
| Service directories | Contact, services | API integration |

## Ingestion Pipeline

### Stage 1: Discovery

```typescript
interface DiscoverySource {
  id: string;
  name: string;
  type: 'government' | 'academic' | 'community' | 'ngo';
  url: string;
  discoveryMethod: 'rss' | 'api' | 'scrape' | 'submission';
  schedule: string; // cron expression
  lastRun?: Date;
  enabled: boolean;
}

// Example: AIHW Youth Justice
const aihwSource: DiscoverySource = {
  id: 'aihw-youth-justice',
  name: 'AIHW Youth Justice Publications',
  type: 'government',
  url: 'https://www.aihw.gov.au/reports-data/health-welfare-services/youth-justice',
  discoveryMethod: 'scrape',
  schedule: '0 0 * * 1', // Weekly on Monday
  enabled: true,
};
```

### Stage 2: Extraction

```typescript
interface ExtractionResult {
  sourceId: string;
  rawContent: string;
  contentType: 'html' | 'pdf' | 'json' | 'api';
  extractedAt: Date;

  // Structured extraction
  entities: {
    interventions: ExtractedIntervention[];
    evidence: ExtractedEvidence[];
    statistics: ExtractedStatistic[];
    organizations: ExtractedOrganization[];
  };
}

interface ExtractedIntervention {
  name: string;
  description?: string;
  type?: string;
  geography?: string;
  organization?: string;
  confidence: number;
  sourceSnippet: string;
}
```

### Stage 3: Classification

```typescript
interface ClassificationResult {
  entityType: 'intervention' | 'evidence' | 'outcome' | 'organization';

  // Auto-classification
  suggestedType?: string;
  suggestedEvidenceLevel?: string;
  suggestedConsentLevel: string;

  // Linking
  matchedExistingIds: string[];
  matchConfidence: number;

  // Validation flags
  requiresHumanReview: boolean;
  reviewReason?: string;
}
```

### Stage 4: Validation

```typescript
interface ValidationChecks {
  // Data quality
  hasRequiredFields: boolean;
  passesFormatValidation: boolean;

  // Duplication
  isDuplicate: boolean;
  duplicateOfId?: string;

  // Consent
  hasValidConsentLevel: boolean;
  consentVerificationMethod?: string;

  // Authority
  isFromTrustedSource: boolean;
  trustScore: number;
}
```

### Stage 5: Storage

```typescript
interface StorageAction {
  action: 'create' | 'update' | 'link' | 'queue_review';
  entityType: string;
  entityId?: string;
  data: any;

  // Audit trail
  sourceId: string;
  extractionId: string;
  validationId: string;

  // Review queue
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}
```

## Database Schema Additions

```sql
-- Data source registry
CREATE TABLE alma_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  url TEXT,
  discovery_method TEXT,
  schedule TEXT,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',

  -- Statistics
  total_runs INT DEFAULT 0,
  successful_runs INT DEFAULT 0,
  items_discovered INT DEFAULT 0,
  items_added INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extraction log
CREATE TABLE alma_extraction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES alma_data_sources(id),

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',

  -- Results
  items_extracted INT DEFAULT 0,
  items_classified INT DEFAULT 0,
  items_validated INT DEFAULT 0,
  items_stored INT DEFAULT 0,
  items_queued_review INT DEFAULT 0,

  error_message TEXT,
  extraction_log JSONB DEFAULT '[]'
);

-- Review queue for human validation
CREATE TABLE alma_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID REFERENCES alma_extraction_log(id),

  entity_type TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  data JSONB NOT NULL,

  -- Review metadata
  review_reason TEXT,
  confidence DECIMAL(3,2),
  matched_ids UUID[],

  -- Status
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source mapping for provenance tracking
CREATE TABLE alma_entity_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  source_id UUID REFERENCES alma_data_sources(id),
  extraction_id UUID REFERENCES alma_extraction_log(id),

  source_url TEXT,
  source_snippet TEXT,
  confidence DECIMAL(3,2),

  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  verification_count INT DEFAULT 1
);
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create data source registry tables
- [ ] Build extraction pipeline framework
- [ ] Implement AIHW and AIC scrapers
- [ ] Create admin UI for source management

### Phase 2: Automation (Week 3-4)
- [ ] Set up scheduled extraction jobs (Vercel Cron or external)
- [ ] Implement LLM-based entity extraction
- [ ] Build classification model training pipeline
- [ ] Create review queue UI

### Phase 3: Intelligence (Week 5-6)
- [ ] Add duplicate detection with fuzzy matching
- [ ] Implement automatic linking to existing entities
- [ ] Build confidence scoring system
- [ ] Create data quality dashboard

### Phase 4: Community (Week 7-8)
- [ ] Launch community submission portal
- [ ] Implement consent management workflow
- [ ] Build organization verification system
- [ ] Create partnership onboarding process

## API Endpoints

```
POST /api/intelligence/sources
  Create a new data source

GET /api/intelligence/sources
  List all data sources with status

POST /api/intelligence/sources/:id/run
  Trigger extraction for a source

GET /api/intelligence/extractions
  List recent extractions

GET /api/intelligence/review-queue
  Get items pending review

POST /api/intelligence/review-queue/:id/review
  Submit review decision

POST /api/intelligence/submit
  Community submission endpoint
```

## Consent-Aware Ingestion

### Public Knowledge Commons
- Auto-ingest from government sources
- Auto-link to existing interventions
- No review required for factual data

### Community Controlled
- Require organization verification
- Community review before linking
- Attribution as specified

### Strictly Private
- Only via direct submission
- Explicit consent documented
- No automatic processing

```typescript
function determineConsentLevel(source: DiscoverySource, entity: any): string {
  // Government sources = Public
  if (source.type === 'government') {
    return 'Public Knowledge Commons';
  }

  // Academic published research = Public
  if (source.type === 'academic' && entity.isPublished) {
    return 'Public Knowledge Commons';
  }

  // Community submissions = as specified
  if (source.type === 'community') {
    return entity.specifiedConsentLevel || 'Community Controlled';
  }

  // Default to requiring review
  return 'requires_consent_verification';
}
```

## Monitoring & Alerts

### Health Metrics
- Source availability (uptime)
- Extraction success rate
- Review queue depth
- Data freshness by source

### Alerts
- Source unavailable for 7+ days
- Extraction failure rate > 20%
- Review queue > 100 items
- Duplicate detection anomalies

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data freshness | < 30 days | Average age of source data |
| Coverage | 80%+ | Known programs in ALMA |
| Accuracy | 95%+ | Human review pass rate |
| Efficiency | 90%+ | Auto-processed items |
| Response time | < 24h | Community submission to review |

## Next Steps

1. **Implement Phase 1** - Foundation infrastructure
2. **Pilot with AIHW** - Test extraction pipeline
3. **Build Review UI** - Enable human validation
4. **Onboard Community Partners** - Direct submission flow

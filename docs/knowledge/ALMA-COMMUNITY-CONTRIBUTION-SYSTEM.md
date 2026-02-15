# ALMA Community Contribution System

## Vision

Enable communities, organizations, and individuals across Australia to directly contribute their knowledge, programs, and stories to ALMA - creating a living, community-owned knowledge commons for youth justice.

## Core Principles

### 1. Data Sovereignty
- Communities maintain control over their data
- Clear consent levels for all contributions
- Withdrawal rights respected at all times
- Attribution as communities specify

### 2. Accessibility
- Simple submission process
- Multiple contribution pathways
- Support for low-bandwidth contexts
- Cultural safety in all interactions

### 3. Reciprocity
- Contributors see impact of their data
- Access to ALMA insights and tools
- Recognition of contributions
- Community benefit sharing

### 4. Quality Without Gatekeeping
- Peer validation over expert gatekeeping
- Community endorsement valued equally to academic review
- Diverse evidence types accepted
- Indigenous knowledge systems respected

## Contribution Types

### 1. Program/Service Submission
**Who:** Organizations running youth programs
**What:** Service details, reach, outcomes, evidence
**Consent Options:** Public, Community Controlled, Private

```typescript
interface ProgramSubmission {
  // Required
  programName: string;
  organization: string;
  description: string;
  geography: string; // State/region
  targetPopulation: string[];
  contactEmail: string;

  // Optional but encouraged
  website?: string;
  startYear?: number;
  annualParticipants?: number;
  outcomes?: string[];
  evidenceLinks?: string[];
  culturalAuthority?: string; // Endorsing Elder/community

  // Consent
  consentLevel: 'Public Knowledge Commons' | 'Community Controlled' | 'Strictly Private';
  attributionPreference: string;
  contactConsent: boolean;
}
```

### 2. Evidence Submission
**Who:** Researchers, evaluators, community researchers
**What:** Research findings, evaluations, reports
**Consent Options:** Public, Community Controlled

```typescript
interface EvidenceSubmission {
  // Required
  title: string;
  evidenceType: string; // 'RCT', 'Community-led', 'Case study', etc.
  findings: string;
  methodology?: string;
  sampleSize?: number;
  publicationDate?: Date;
  author: string;

  // Linking
  relatedProgramName?: string;
  relatedProgramId?: string;

  // Source
  sourceType: 'published' | 'unpublished' | 'community_report';
  sourceUrl?: string;
  documentUpload?: File;

  // Consent
  consentLevel: string;
  canQuote: boolean;
  attributionRequired: boolean;
}
```

### 3. Outcome Data
**Who:** Programs, researchers, communities
**What:** Measurable outcomes, success indicators
**Consent Options:** Aggregated Public, De-identified Community, Individual Private

```typescript
interface OutcomeSubmission {
  programId?: string;
  programName?: string;

  outcomeType: string; // 'recidivism', 'education', 'wellbeing', etc.
  measurementMethod: string;
  timeHorizon: string;

  // Aggregated data (preferred)
  aggregatedResults?: {
    sampleSize: number;
    metric: string;
    value: number;
    comparisonGroup?: string;
    comparisonValue?: number;
  };

  // Qualitative outcomes
  qualitativeOutcomes?: string[];

  // Consent
  dataLevel: 'aggregated' | 'deidentified' | 'individual';
  consentDocumentation?: string;
}
```

### 4. Story/Lived Experience
**Who:** Young people, families, workers
**What:** Personal narratives, testimonials
**Consent Options:** Full public, Anonymous, Private archive

```typescript
interface StorySubmission {
  // The story
  storyType: 'journey' | 'impact' | 'program_feedback' | 'policy_voice';
  content: string;
  media?: {
    type: 'audio' | 'video' | 'image';
    file: File;
  }[];

  // Connection to programs
  relatedPrograms?: string[];
  jurisdiction?: string;

  // Identity
  contributorType: 'young_person' | 'family' | 'worker' | 'community_member';
  culturalBackground?: string;

  // Consent
  publishConsent: 'full_public' | 'anonymous' | 'private_archive';
  contactConsent: boolean;
  mediaConsent?: boolean;

  // Support
  supportContactOptIn: boolean;
}
```

### 5. Cultural Authority Endorsement
**Who:** Elders, Traditional Owners, community leaders
**What:** Cultural endorsement of programs, practices
**Consent:** Always Community Controlled

```typescript
interface CulturalEndorsement {
  endorserName: string;
  endorserRole: string;
  community: string;
  countryName?: string;

  // What's being endorsed
  programId?: string;
  programName: string;
  endorsementType: 'cultural_safety' | 'effectiveness' | 'community_benefit' | 'full';

  // The endorsement
  statement: string;
  conditions?: string[];
  validityPeriod?: string;

  // Verification
  verificationMethod: string;
  contactForVerification: boolean;
}
```

## Submission Workflows

### Quick Submit (5 minutes)
1. Select contribution type
2. Fill required fields only
3. Choose consent level
4. Submit → Queue for review

### Full Submit (15 minutes)
1. Create/login to contributor account
2. Complete full form with evidence
3. Upload supporting documents
4. Review and submit
5. Track status and receive updates

### Organization Registration
1. Register organization
2. Verify organization (ACNC, ABN, or community verification)
3. Designate authorized contributors
4. Access batch upload and API

## Review & Validation

### Tiers of Validation

```
┌─────────────────────────────────────────────────────────────┐
│                    VALIDATION PYRAMID                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                          │
│                    │   Expert    │  ← Academic peer review  │
│                    │   Review    │                          │
│                    └──────┬──────┘                          │
│               ┌───────────┴───────────┐                     │
│               │   Community Review    │  ← Community peer   │
│               │   (3+ endorsements)   │    validation       │
│               └───────────┬───────────┘                     │
│          ┌────────────────┴────────────────┐                │
│          │     Organization Verified       │  ← Verified    │
│          │     (registered org submission) │    source      │
│          └────────────────┬────────────────┘                │
│     ┌─────────────────────┴─────────────────────┐           │
│     │          Self-Reported                    │  ← Basic  │
│     │          (any submission)                 │    entry  │
│     └───────────────────────────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Review Process

```typescript
interface ReviewDecision {
  submissionId: string;
  reviewerType: 'staff' | 'community' | 'expert';

  decision: 'approve' | 'request_changes' | 'flag_for_review' | 'reject';

  // Quality checks
  qualityChecks: {
    completeness: boolean;
    accuracy: boolean;
    consentValid: boolean;
    culturallyAppropriate: boolean;
    duplicateCheck: boolean;
  };

  // Feedback
  feedbackToContributor?: string;
  internalNotes?: string;

  // Linking
  matchedEntities?: {
    type: string;
    id: string;
    action: 'link' | 'merge' | 'update';
  }[];
}
```

## User Interface

### Submission Portal Pages

1. **Landing Page** (`/contribute`)
   - Why contribute
   - Contribution types
   - Data sovereignty commitment
   - Quick start options

2. **Submission Form** (`/contribute/[type]`)
   - Type-specific form
   - Progress indicator
   - Save draft functionality
   - Consent explanation at each step

3. **Contributor Dashboard** (`/contribute/dashboard`)
   - My submissions
   - Status tracking
   - Edit/withdraw options
   - Impact metrics (how data is used)

4. **Organization Portal** (`/contribute/organization`)
   - Batch upload
   - Team management
   - API access
   - Analytics

### Mobile-First Design
- Works on low-spec phones
- Offline form saving
- Minimal data usage
- Voice input option for stories

## API for Organizations

```typescript
// Batch submission endpoint
POST /api/contribute/batch
{
  organizationId: string;
  apiKey: string;
  submissions: Submission[];
}

// Status check
GET /api/contribute/submissions?org={orgId}

// Update submission
PATCH /api/contribute/submissions/:id

// Withdraw submission
DELETE /api/contribute/submissions/:id
```

## Consent Management

### Consent Dashboard
Contributors can:
- View all their contributions
- Modify consent levels
- Withdraw specific items
- Export their data
- Delete their account

### Consent Recording
```typescript
interface ConsentRecord {
  contributorId: string;
  submissionId: string;

  consentType: string;
  consentLevel: string;
  grantedAt: Date;

  // Specifics
  usagePermissions: string[];
  attributionPreference: string;
  contactPermission: boolean;
  withdrawalRights: string;

  // Documentation
  consentMethod: 'online_form' | 'verbal' | 'written' | 'community_process';
  documentationUrl?: string;
}
```

## Recognition & Benefits

### For Contributors
- **Attribution**: Name/organization credited as specified
- **Impact Reports**: Quarterly reports on how data is used
- **Early Access**: Preview new ALMA features
- **Network Access**: Connect with other contributors
- **Skills Development**: Data literacy workshops

### For Organizations
- **Verified Badge**: Displayed on ALMA listings
- **Analytics Dashboard**: Usage and impact metrics
- **API Access**: Integrate ALMA data into own systems
- **Research Partnership**: Collaborate on evidence building
- **Funding Insights**: What funders are looking for

### For Communities
- **Data Ownership**: Community controls their data
- **Capacity Building**: Support for data collection
- **Research Co-design**: Shape how data is used
- **Benefit Sharing**: Access to insights and tools

## Implementation Phases

### Phase 1: MVP Submission (Week 1-2)
- [ ] Basic program submission form
- [ ] Simple consent workflow
- [ ] Manual review queue
- [ ] Email notifications

### Phase 2: Full Portal (Week 3-4)
- [ ] All submission types
- [ ] Contributor accounts
- [ ] Organization verification
- [ ] Submission tracking

### Phase 3: Community Features (Week 5-6)
- [ ] Community review/endorsement
- [ ] Cultural authority verification
- [ ] Consent dashboard
- [ ] Impact reporting

### Phase 4: Scale (Week 7-8)
- [ ] Batch upload API
- [ ] Organization portal
- [ ] Analytics dashboard
- [ ] Mobile optimization

## Success Metrics

| Metric | Target (Year 1) | Measurement |
|--------|-----------------|-------------|
| Submissions | 500+ | Total contributions |
| Organizations | 100+ | Verified contributors |
| Coverage | 50% states | Geographic spread |
| Approval Rate | 85%+ | Quality of submissions |
| Withdrawal Rate | <5% | Consent satisfaction |
| Active Contributors | 200+ | Monthly active |

## Risk Mitigation

### Data Quality
- Staged rollout with manual review
- Community validation for Indigenous content
- Duplicate detection
- Source verification

### Consent Violations
- Clear consent at every step
- Easy withdrawal process
- Regular consent audits
- Legal review of terms

### Spam/Abuse
- Rate limiting
- Organization verification
- Community reporting
- AI content detection

### Cultural Safety
- Indigenous advisory input
- Cultural review process
- Community liaison support
- Trauma-informed design

## Technical Requirements

### Database Tables
```sql
-- Contributor accounts
CREATE TABLE alma_contributors (
  id UUID PRIMARY KEY,
  type TEXT, -- 'individual', 'organization'
  name TEXT,
  email TEXT UNIQUE,
  organization_id UUID,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions
CREATE TABLE alma_submissions (
  id UUID PRIMARY KEY,
  contributor_id UUID REFERENCES alma_contributors(id),
  submission_type TEXT NOT NULL,
  data JSONB NOT NULL,
  consent_level TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE alma_submission_reviews (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES alma_submissions(id),
  reviewer_id UUID,
  decision TEXT,
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent records
CREATE TABLE alma_consent_records (
  id UUID PRIMARY KEY,
  contributor_id UUID REFERENCES alma_contributors(id),
  submission_id UUID REFERENCES alma_submissions(id),
  consent_type TEXT,
  consent_level TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);
```

## Next Steps

1. **Design Review** - Get Indigenous advisory input
2. **Legal Review** - Consent forms and terms
3. **MVP Build** - Basic submission flow
4. **Pilot** - Test with 5 partner organizations
5. **Iterate** - Incorporate feedback
6. **Launch** - Public contribution portal

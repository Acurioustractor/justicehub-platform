# ALMA Autonomous Research System

## Inspiration: Dexter Financial Research Agent

Dexter (github.com/virattt/dexter) demonstrates a powerful pattern for autonomous research:

1. **Query Decomposition** - Break complex questions into research tasks
2. **Tool Execution** - Run specialized tools for each task
3. **Validation** - Verify data sufficiency before synthesis
4. **Context Compaction** - Summarize findings for efficiency
5. **Synthesis** - Generate comprehensive answers

## ALMA Equivalent Architecture

### Current State
```
Static scrapers → Database → API → Dashboard
```

### Proposed: ALMA Research Agent
```
Research Query
     ↓
┌─────────────────────────────────────────────────────────┐
│  PLANNING AGENT                                          │
│  "What programs reduce youth recidivism in NT?"         │
│  → Task 1: Search ALMA for NT interventions              │
│  → Task 2: Find linked evidence/outcomes                 │
│  → Task 3: Cross-reference with external sources         │
│  → Task 4: Validate findings against authoritative data  │
└─────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────┐
│  ACTION AGENT (Tool Execution)                           │
│  Tools:                                                  │
│  - search_alma_interventions(geography, type, evidence)  │
│  - get_intervention_evidence(intervention_id)            │
│  - get_intervention_outcomes(intervention_id)            │
│  - search_external_research(query)                       │
│  - fetch_government_data(source_url)                     │
│  - verify_against_aihw(metric, jurisdiction)             │
└─────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────┐
│  VALIDATION AGENT                                        │
│  - Is evidence sufficient?                               │
│  - Are sources authoritative?                            │
│  - Do findings align with known statistics?              │
│  - Are cultural protocols respected?                     │
└─────────────────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────────────┐
│  SYNTHESIS AGENT                                         │
│  - Generate research summary                             │
│  - Cite sources with consent levels                      │
│  - Highlight evidence gaps                               │
│  - Suggest next research steps                           │
└─────────────────────────────────────────────────────────┘
```

## Proposed Tools for ALMA

### 1. Internal Knowledge Tools

```typescript
// Search ALMA interventions with filters
interface SearchInterventionsInput {
  query?: string;
  geography?: string[];    // ['NT', 'QLD']
  type?: string;           // 'Community-Led', 'Diversion'
  evidence_level?: string; // 'Proven', 'Promising'
  consent_level?: string;  // 'Public Knowledge Commons'
  limit?: number;
}

// Get related content for intervention
interface GetRelatedContentInput {
  intervention_id: string;
  include_evidence?: boolean;
  include_outcomes?: boolean;
  include_stories?: boolean;
  include_profiles?: boolean;
}

// Search across all ALMA entities
interface UnifiedSearchInput {
  query: string;
  entity_types?: ('intervention' | 'evidence' | 'outcome' | 'funding')[];
  jurisdictions?: string[];
}
```

### 2. External Research Tools

```typescript
// Search academic/government sources
interface ExternalResearchInput {
  query: string;
  sources?: ('aihw' | 'aic' | 'pc' | 'academic')[];
  date_range?: { from: string; to: string };
}

// Verify against authoritative data
interface VerifyStatisticInput {
  claim: string;           // "NT has 24x Indigenous overrepresentation"
  metric_type: string;     // 'overrepresentation', 'recidivism', 'cost'
  jurisdiction: string;
  source_preference?: string[];
}

// Fetch and parse government reports
interface FetchReportInput {
  url: string;
  extract_sections?: string[];  // ['key findings', 'recommendations']
}
```

### 3. Analysis Tools

```typescript
// Calculate cost-effectiveness
interface CostAnalysisInput {
  intervention_id: string;
  comparison_baseline?: 'detention' | 'court' | 'no_intervention';
}

// Find evidence gaps
interface GapAnalysisInput {
  intervention_id?: string;
  jurisdiction?: string;
  outcome_type?: string;
}

// Compare interventions
interface CompareInterventionsInput {
  intervention_ids: string[];
  metrics: ('evidence_level' | 'cost' | 'outcomes' | 'cultural_authority')[];
}
```

## Implementation Phases

### Phase 1: Tool Infrastructure (Week 1-2)
- Create Supabase RPC functions for complex queries
- Build API endpoints that return structured tool outputs
- Implement external source fetchers (AIHW, AIC, PC)

### Phase 2: Single-Agent Research (Week 3-4)
- Build ReAct-style research agent
- Integrate with existing Claude Code infrastructure
- Add to Intelligence Dashboard as "Research Assistant"

### Phase 3: Multi-Agent Pipeline (Week 5-6)
- Implement planning → action → validation → synthesis flow
- Add scratchpad/memory for multi-step research
- Build streaming UI for research progress

### Phase 4: Autonomous Discovery (Week 7-8)
- Schedule periodic research runs
- Auto-discover evidence gaps
- Generate research reports
- Update ALMA data based on findings

## Example Research Flows

### Query: "What works for reducing Indigenous youth incarceration?"

**Planning Output:**
```
1. Search ALMA for Indigenous-focused interventions (evidence_level >= Promising)
2. Retrieve linked evidence and outcomes for top results
3. Cross-reference with AIC/AIHW research on effective programs
4. Verify recidivism claims against official statistics
5. Identify programs with cultural authority endorsement
6. Synthesize findings with source attribution
```

**Tool Execution:**
```
→ search_alma_interventions({ evidence_level: 'Indigenous-led', limit: 20 })
→ [For each result] get_related_content({ include_evidence: true })
→ external_research({ query: 'Indigenous youth justice programs effective', sources: ['aic', 'aihw'] })
→ verify_statistic({ claim: 'Justice reinvestment reduces recidivism 23%', source: 'Bourke JR' })
```

**Validation:**
```
✓ Found 15 Indigenous-led interventions with evidence
✓ 8 have verified outcome data
✓ External sources corroborate 6 programs
⚠ 3 programs have consent_level: Community Controlled (limited sharing)
✗ Evidence gap: No RCT data for cultural healing programs
```

**Synthesis:**
```markdown
## Research Summary: Indigenous Youth Justice Programs

Based on ALMA data and external verification, the following approaches show
evidence of effectiveness:

1. **Justice Reinvestment (Bourke)** - 23% reduction in youth crime
   - Evidence: Quasi-experimental (KPMG 2024)
   - Consent: Public Knowledge Commons

2. **Cultural Healing Programs** - 82% improvement in cultural connection
   - Evidence: Community-led research
   - Consent: Community Controlled (cited with permission)

...

### Evidence Gaps Identified
- No RCT studies for cultural programs (may not be appropriate methodology)
- Limited longitudinal data beyond 3 years
- Need: Cost-effectiveness analysis for Oonchiumpa model

### Suggested Next Research
1. Request permission to include Strictly Private evidence
2. Contact Groote Eylandt for 5-year follow-up data
3. Commission economic analysis of cultural programs
```

## Integration Points

### Dashboard Integration
- Add "Research This" button on Alpha Opportunities
- Research results feed back into ALMA (new evidence links)
- Gap analysis informs data collection priorities

### API Endpoints Needed
```
POST /api/intelligence/research
  body: { query: string, depth: 'quick' | 'thorough' }
  returns: { task_id: string }

GET /api/intelligence/research/:task_id
  returns: { status, progress, results }

POST /api/intelligence/research/:task_id/feedback
  body: { helpful: boolean, corrections: string[] }
```

### Database Tables Needed
```sql
-- Research sessions
CREATE TABLE alma_research_sessions (
  id UUID PRIMARY KEY,
  query TEXT NOT NULL,
  status TEXT, -- 'planning', 'executing', 'validating', 'complete'
  scratchpad JSONB,
  results JSONB,
  created_at TIMESTAMPTZ
);

-- Research findings (feed back into ALMA)
CREATE TABLE alma_research_findings (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES alma_research_sessions,
  finding_type TEXT, -- 'evidence_link', 'gap_identified', 'verification'
  entity_type TEXT,
  entity_id UUID,
  content JSONB,
  confidence DECIMAL,
  sources TEXT[]
);
```

## Consent-Aware Research

Critical difference from Dexter: ALMA must respect data sovereignty.

**Research must:**
1. Only include Public Knowledge Commons in general queries
2. Request permission for Community Controlled content
3. Never expose Strictly Private without explicit consent
4. Attribute sources according to cultural protocols
5. Flag when research is limited by consent constraints

```typescript
// Consent-aware search
function searchWithConsent(query, userConsentLevel) {
  const allowedLevels = {
    'public': ['Public Knowledge Commons'],
    'authenticated': ['Public Knowledge Commons', 'Community Controlled'],
    'authorized': ['Public Knowledge Commons', 'Community Controlled', 'Strictly Private']
  };

  return search(query, { consent_level: allowedLevels[userConsentLevel] });
}
```

## Success Metrics

1. **Research Quality**
   - % of findings with verified sources
   - User satisfaction with research summaries
   - Evidence gaps discovered and filled

2. **Data Growth**
   - New evidence links created from research
   - External sources integrated
   - Verification rate of existing claims

3. **User Engagement**
   - Research queries per month
   - Time from query to actionable insight
   - Research results shared/exported

## Next Steps

1. [ ] Review this proposal with team
2. [ ] Prioritize Phase 1 tools
3. [ ] Design research UI mockups
4. [ ] Spec out Supabase RPC functions
5. [ ] Evaluate LLM costs for research agent

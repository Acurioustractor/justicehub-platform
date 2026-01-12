# ALMA Youth Justice Intelligence Architecture

**Based on ACT Personal AI Production Patterns**

## Mission
Build the world's most comprehensive, searchable, and radical youth justice LLM and wiki - demonstrating that community-based alternatives are more effective and cost-efficient than detention.

## Core Principles (from ACT Philosophy)

### 1. **Signals Not Scores**
- Use directional indicators (0.0-1.0) not competitive rankings
- **Community Authority** weighted highest (30%)
- Portfolio reasoning instead of leaderboards
- Multiple signal families for holistic assessment

### 2. **Cultural Data Sovereignty First**
- Hard blocks on culturally sensitive data (not soft warnings)
- OCAP principles enforced at system level
- Local LLMs for privacy-sensitive content
- Provenance tracking for all evidence

### 3. **Fat Agents, Skinny Tools**
- Agents own business logic and decision-making
- Natural language interfaces
- Clear domain responsibilities
- Tools are thin wrappers around external APIs

## Layered Architecture

```
User Query → ALMA Router → Is this youth justice intelligence?
                          │
                          ├─ NO → General search
                          │
                          └─ YES → ALMA Pipeline
                                   │
                                   ├─ Cultural Protocol Check
                                   ├─ Domain Filter (youth justice)
                                   ├─ RAG Retrieval (vector search)
                                   ├─ Portfolio Reasoning (signal analysis)
                                   └─ Evidence-Based Response
```

## Data Model - Layered Intelligence

### Operational Layer (JusticeHub Supabase)
```
alma_interventions        # Programs and services
alma_organizations        # Service providers
alma_source_documents     # Evidence and research
alma_raw_content          # Scraped data
alma_discovered_links     # Scraping queue
```

### Intelligence Layer (New)
```
alma_embeddings           # Vector search (1536-dim)
alma_evidence_strength    # Signal: Quality of evidence
alma_community_authority  # Signal: Indigenous-led, community control
alma_cost_effectiveness   # Signal: Cost per outcome
alma_harm_risk           # Signal: Potential negative impacts
alma_implementation      # Signal: Feasibility and readiness
alma_knowledge_graph     # Entity relationships
alma_governance_ledger   # Consent, provenance, access logs
```

## Signal Families (5-Signal Portfolio)

### 1. Evidence Strength (25% weight)
```sql
CREATE OR REPLACE FUNCTION calculate_evidence_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.0;
BEGIN
  -- RCT or quasi-experimental = 1.0
  -- Strong evaluation = 0.8
  -- Qualitative with triangulation = 0.6
  -- Promising but unproven = 0.4
  -- Anecdotal = 0.2

  SELECT
    CASE evidence_level
      WHEN 'Proven (RCT/quasi-experimental, replicated)' THEN 1.0
      WHEN 'Effective (strong evaluation, positive outcomes)' THEN 0.8
      WHEN 'Indigenous-led (culturally grounded, community authority)' THEN 0.7
      WHEN 'Promising (community-endorsed, emerging evidence)' THEN 0.5
      ELSE 0.3
    END INTO signal
  FROM alma_interventions
  WHERE id = intervention_id;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;
```

### 2. Community Authority (30% weight - HIGHEST)
```sql
CREATE OR REPLACE FUNCTION calculate_community_authority_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.0;
  cultural_auth TEXT;
BEGIN
  SELECT cultural_authority INTO cultural_auth
  FROM alma_interventions
  WHERE id = intervention_id;

  -- Aboriginal Community Controlled Organization = 1.0
  -- Indigenous-led with community partnership = 0.9
  -- Co-designed with Aboriginal community = 0.7
  -- Culturally adapted mainstream = 0.5
  -- Mainstream with consultation = 0.3
  -- No community involvement = 0.0

  IF cultural_auth LIKE '%Aboriginal Community Controlled%' OR
     cultural_auth LIKE '%community-controlled%' THEN
    signal := 1.0;
  ELSIF cultural_auth LIKE '%Indigenous-led%' OR
        cultural_auth LIKE '%Aboriginal-led%' THEN
    signal := 0.9;
  ELSIF cultural_auth LIKE '%co-design%' OR
        cultural_auth LIKE '%partnership%' THEN
    signal := 0.7;
  ELSIF cultural_auth LIKE '%culturally adapted%' OR
        cultural_auth LIKE '%Culturally Responsive%' THEN
    signal := 0.5;
  ELSIF cultural_auth LIKE '%consultation%' THEN
    signal := 0.3;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;
```

### 3. Harm Risk (20% weight - INVERTED)
```sql
CREATE OR REPLACE FUNCTION calculate_harm_risk_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 1.0; -- Start high (low risk)
  risk_level TEXT;
  risks TEXT;
BEGIN
  SELECT harm_risk_level, risks INTO risk_level, risks
  FROM alma_interventions
  WHERE id = intervention_id;

  -- High harm risk = 0.0 (detention, incarceration)
  -- Medium harm risk = 0.5 (intensive supervision, tracking)
  -- Low harm risk = 1.0 (community-based, cultural programs)

  IF risk_level = 'High' OR risks LIKE '%detention%' OR risks LIKE '%incarceration%' THEN
    signal := 0.0;
  ELSIF risk_level = 'Medium' OR risks LIKE '%surveillance%' THEN
    signal := 0.5;
  ELSE
    signal := 1.0;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;
```

### 4. Implementation Capability (15% weight)
```sql
CREATE OR REPLACE FUNCTION calculate_implementation_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.5;
  impl_data JSONB;
BEGIN
  SELECT metadata -> 'implementation' INTO impl_data
  FROM alma_interventions
  WHERE id = intervention_id;

  -- Currently running with stable funding = 1.0
  -- Pilot with promising results = 0.7
  -- Design stage with community buy-in = 0.5
  -- Concept only = 0.3

  IF impl_data->>'status' = 'running' AND impl_data->>'funding' = 'stable' THEN
    signal := 1.0;
  ELSIF impl_data->>'status' = 'pilot' THEN
    signal := 0.7;
  ELSIF impl_data->>'status' = 'design' THEN
    signal := 0.5;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;
```

### 5. Option Value (10% weight - Learning Potential)
```sql
CREATE OR REPLACE FUNCTION calculate_option_value_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.5;
  metadata JSONB;
BEGIN
  SELECT metadata INTO metadata
  FROM alma_interventions
  WHERE id = intervention_id;

  -- High learning potential (innovative approach, fills gap) = 1.0
  -- Medium (builds on known approaches) = 0.6
  -- Low (well-established, little to learn) = 0.3

  IF metadata->>'innovation_level' = 'high' OR
     metadata->>'fills_critical_gap' = 'true' THEN
    signal := 1.0;
  ELSIF metadata->>'innovation_level' = 'medium' THEN
    signal := 0.6;
  ELSE
    signal := 0.3;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;
```

### Portfolio Score (Weighted Composite)
```sql
CREATE OR REPLACE FUNCTION calculate_portfolio_score(intervention_id UUID)
RETURNS TABLE(
  intervention_name TEXT,
  evidence_strength FLOAT,
  community_authority FLOAT,
  harm_risk FLOAT,
  implementation FLOAT,
  option_value FLOAT,
  composite_score FLOAT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.name,
    calculate_evidence_signal(i.id) as evidence,
    calculate_community_authority_signal(i.id) as authority,
    calculate_harm_risk_signal(i.id) as harm,
    calculate_implementation_signal(i.id) as implementation,
    calculate_option_value_signal(i.id) as option_val,
    -- Weighted composite
    (calculate_evidence_signal(i.id) * 0.25 +
     calculate_community_authority_signal(i.id) * 0.30 +
     calculate_harm_risk_signal(i.id) * 0.20 +
     calculate_implementation_signal(i.id) * 0.15 +
     calculate_option_value_signal(i.id) * 0.10) as composite,
    -- Recommendation based on signals
    CASE
      WHEN calculate_evidence_signal(i.id) > 0.7 AND
           calculate_community_authority_signal(i.id) > 0.7 AND
           calculate_harm_risk_signal(i.id) > 0.7 THEN
        'Ready to Scale - High evidence + Community authority + Low harm'
      WHEN calculate_community_authority_signal(i.id) > 0.8 AND
           calculate_evidence_signal(i.id) < 0.5 THEN
        'Promising but Unproven - Indigenous-led, needs evaluation'
      WHEN calculate_evidence_signal(i.id) > 0.7 AND
           (i.metadata->>'funding_gap')::float > 0.5 THEN
        'Underfunded High-Evidence - Proven but lacks funding'
      ELSE
        'Needs More Data'
    END as recommendation
  FROM alma_interventions i
  WHERE i.id = intervention_id;
END;
$$ LANGUAGE plpgsql;
```

## Vector Search Architecture

### Dual Embedding Strategy
```sql
-- High-accuracy search (OpenAI 1536-dim)
CREATE TABLE alma_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'intervention', 'evidence', 'source_document'
  embedding_high vector(1536), -- OpenAI text-embedding-3-small
  embedding_fast vector(384),  -- BAAI/bge-small-en-v1.5 (local)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (content_id) REFERENCES alma_raw_content(id)
);

-- IVFFlat index for fast cosine similarity
CREATE INDEX idx_embeddings_high ON alma_embeddings
USING ivfflat (embedding_high vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_embeddings_fast ON alma_embeddings
USING ivfflat (embedding_fast vector_cosine_ops)
WITH (lists = 100);
```

### Confidence Scoring (Research-Backed)
```sql
-- Logistic function: 1 / (1 + e^(-k(x - x0)))
CREATE OR REPLACE FUNCTION similarity_to_confidence(similarity FLOAT)
RETURNS FLOAT AS $$
DECLARE
  k FLOAT := 10.0;  -- Steepness
  x0 FLOAT := 0.5;  -- Midpoint
BEGIN
  RETURN 1.0 / (1.0 + EXP(-k * (similarity - x0)));
END;
$$ LANGUAGE plpgsql;

-- Semantic search with confidence filtering
CREATE OR REPLACE FUNCTION find_similar_interventions(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  intervention_id UUID,
  intervention_name TEXT,
  similarity FLOAT,
  confidence FLOAT,
  portfolio_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    1 - (e.embedding_high <=> query_embedding) AS similarity,
    similarity_to_confidence(1 - (e.embedding_high <=> query_embedding)) AS confidence,
    (SELECT composite_score FROM calculate_portfolio_score(i.id)) AS portfolio_score
  FROM alma_embeddings e
  JOIN alma_interventions i ON e.content_id = i.id
  WHERE e.content_type = 'intervention'
    AND 1 - (e.embedding_high <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

## Agent Architecture

### 1. JusticeIntelligenceAgent
**Purpose**: Query routing, signal tracking, portfolio analysis

```python
class JusticeIntelligenceAgent:
    """
    Main intelligence agent for youth justice queries.
    Routes queries, tracks signals, provides portfolio reasoning.
    """

    async def run(self, task: str) -> str:
        """Execute task from natural language"""

        # Route based on query type
        if 'what works for' in task.lower():
            return await self.find_effective_interventions(task)

        elif 'compare' in task.lower():
            return await self.compare_interventions(task)

        elif 'cost' in task.lower() or 'funding' in task.lower():
            return await self.analyze_cost_effectiveness(task)

        elif 'evidence' in task.lower():
            return await self.assess_evidence_strength(task)

        else:
            return await self.semantic_search(task)

    async def find_effective_interventions(self, query: str) -> str:
        """Find interventions with high portfolio scores"""

        # Extract target population and context
        population = self.extract_population(query)  # "Indigenous youth", "10-13 year olds"
        context = self.extract_context(query)  # "diversion", "detention alternative"

        # Vector search
        embedding = await self.embed_query(query)
        results = await self.vector_search(embedding, threshold=0.7)

        # Filter by portfolio scores
        high_score = [r for r in results if r.portfolio_score > 0.7]

        # Format response with signals
        return self.format_intervention_response(high_score, include_signals=True)
```

### 2. EvidenceExtractionAgent
**Purpose**: Extract interventions, outcomes, costs from documents

```python
class EvidenceExtractionAgent:
    """
    Extract structured evidence from youth justice documents.
    Uses LLM with JSON schema for structured extraction.
    """

    async def extract_from_document(self, document_id: UUID) -> dict:
        """Extract all evidence from a document"""

        # Get raw content
        content = await self.get_raw_content(document_id)

        # Cultural protocol check first
        protocol_check = await self.check_cultural_protocols(content)
        if protocol_check.requires_elder_consent:
            return {"status": "blocked", "reason": "requires_elder_consent"}

        # LLM extraction with schema
        extraction = await self.llm_extract(
            content=content,
            schema=YOUTH_JUSTICE_SCHEMA,
            instructions="""
            Extract all interventions, evidence, and outcomes.
            For each intervention include:
            - Name and type
            - Target population
            - Evidence level (RCT/evaluation/promising/anecdotal)
            - Outcomes (quantitative if available)
            - Cost per participant
            - Cultural safety (Indigenous-led/adapted/mainstream)
            - Implementing organization

            Flag any content about:
            - Individual children (privacy)
            - Sacred cultural practices (consent required)
            - Specific detention incidents (trauma)
            """
        )

        return extraction
```

### 3. PatternRecognitionAgent
**Purpose**: Detect reform cycles, failure modes, inflection points

```python
class PatternRecognitionAgent:
    """
    Detect patterns in youth justice reforms and interventions.
    Learns from history to prevent repeated failures.
    """

    FAMILIAR_FAILURE_MODES = [
        {
            "name": "Tough on Crime Cycle",
            "signals": [
                "increased detention beds announced",
                "new 'boot camp' style program",
                "political rhetoric about 'youth crime wave'",
                "community programs defunded"
            ],
            "typical_outcome": "Temporary detention increase, long-term harm, no recidivism reduction",
            "counter_evidence": "Community programs 3-5x more cost-effective"
        },
        {
            "name": "Pilot Program Churn",
            "signals": [
                "promising pilot results",
                "no long-term funding commitment",
                "program ends after 12-18 months",
                "community loses trust"
            ],
            "typical_outcome": "Innovation fatigue, wasted community time, no sustained change",
            "counter_pattern": "10-year funding commitment with community governance"
        },
        {
            "name": "Consultation Theater",
            "signals": [
                "community consultations held",
                "no community control in design",
                "decisions already made",
                "Aboriginal voices in reports, not governance"
            ],
            "typical_outcome": "Performative inclusion, no real power shift, continued overrepresentation",
            "counter_pattern": "Indigenous-led from inception with decision-making authority"
        }
    ]

    async def detect_patterns(self, intervention_history: List[dict]) -> dict:
        """Detect which patterns are emerging"""

        patterns_detected = []

        for failure_mode in self.FAMILIAR_FAILURE_MODES:
            signal_count = sum(
                1 for signal in failure_mode['signals']
                if any(signal.lower() in str(i).lower() for i in intervention_history)
            )

            if signal_count >= 2:
                patterns_detected.append({
                    "pattern": failure_mode['name'],
                    "confidence": signal_count / len(failure_mode['signals']),
                    "counter_evidence": failure_mode['counter_evidence'],
                    "recommended_action": failure_mode.get('counter_pattern')
                })

        return {
            "patterns_detected": patterns_detected,
            "risk_level": "high" if len(patterns_detected) > 0 else "low"
        }
```

## Privacy & Cultural Protocols

### Privacy Tiers
```python
PRIVACY_MODES = {
    'high': {
        # Local only - no external API calls
        'llm': 'ollama/llama3.1:70b',
        'search': 'local-index',
        'usage': 'Individual case data, sacred knowledge'
    },
    'medium': {
        # Local LLM + external search
        'llm': 'ollama/qwen2.5:32b',
        'search': 'duckduckgo',
        'usage': 'Aggregated data, community programs'
    },
    'standard': {
        # Best available (may use external APIs)
        'llm': 'claude-sonnet-4-5',
        'search': 'perplexity',
        'usage': 'Public policy docs, published research'
    }
}
```

### Cultural Protocol Enforcement
```python
def check_cultural_protocols(content: str, metadata: dict) -> dict:
    """Hard blocks on culturally sensitive content"""

    BLOCKED_KEYWORDS = [
        'sorry business',
        'men\'s business',
        'women\'s business',
        'sacred site',
        'initiation ceremony'
    ]

    # Check for sacred content
    for keyword in BLOCKED_KEYWORDS:
        if keyword in content.lower():
            raise PermissionError(
                f"CULTURAL PROTOCOL VIOLATION\n"
                f"Content contains sacred knowledge: '{keyword}'\n"
                f"Requires Elder consent and community authority\n"
                f"Protected by OCAP® principles"
            )

    # Check for Elder tag
    if 'elder' in metadata.get('roles', []):
        return {
            'requires_review': True,
            'blocked_actions': ['automated_email', 'ai_analysis'],
            'recommended_action': 'Personal outreach by Indigenous staff'
        }

    return {'requires_review': False, 'blocked_actions': []}
```

## Knowledge Graph - Entity Relationships

```sql
-- Create knowledge graph table
CREATE TABLE alma_knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL, -- 'intervention', 'organization', 'outcome'
  subject_id UUID NOT NULL,
  relationship TEXT NOT NULL, -- 'implements', 'evaluates', 'funds', 'serves'
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  provenance JSONB, -- Source of this relationship
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Find all interventions implemented by an organization
CREATE OR REPLACE FUNCTION get_organization_interventions(org_id UUID)
RETURNS TABLE (
  intervention_id UUID,
  intervention_name TEXT,
  relationship_confidence FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    kg.confidence
  FROM alma_knowledge_graph kg
  JOIN alma_interventions i ON kg.subject_id = i.id
  WHERE kg.object_id = org_id
    AND kg.relationship = 'implemented_by'
  ORDER BY kg.confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- Find funding sources for an intervention
CREATE OR REPLACE FUNCTION get_intervention_funding(intervention_id UUID)
RETURNS TABLE (
  funder_name TEXT,
  amount NUMERIC,
  year INT,
  source_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.funder,
    f.amount,
    f.year,
    sd.source_url
  FROM alma_intervention_funding f
  JOIN alma_source_documents sd ON f.source_document_id = sd.id
  WHERE f.intervention_id = intervention_id
  ORDER BY f.year DESC;
END;
$$ LANGUAGE plpgsql;
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ALMA Intelligence Layer                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Justice     │  │  Evidence    │  │  Pattern     │      │
│  │  Intelligence│  │  Extraction  │  │  Recognition │      │
│  │  Agent       │  │  Agent       │  │  Agent       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            Multi-Provider AI Orchestration           │    │
│  │  Claude Sonnet 4.5 → GPT-4 → Ollama (local)        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Vector Search (pgvector)                │    │
│  │  1536-dim (accuracy) + 384-dim (speed)              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                  Operational Data Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PostgreSQL (Supabase)                                       │
│  ├─ alma_interventions                                       │
│  ├─ alma_organizations                                       │
│  ├─ alma_source_documents                                    │
│  ├─ alma_raw_content                                         │
│  ├─ alma_embeddings                                          │
│  └─ alma_knowledge_graph                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

1. **Implement Signal Functions** (Week 1)
   - Create 5 signal calculation functions
   - Build portfolio scoring view
   - Test with existing 173 interventions

2. **Add Vector Search** (Week 2)
   - Generate embeddings for all interventions
   - Create IVFFlat indexes
   - Build semantic search API

3. **Build Agents** (Weeks 3-4)
   - JusticeIntelligenceAgent
   - EvidenceExtractionAgent
   - PatternRecognitionAgent

4. **Deploy Intelligence API** (Week 5)
   - Multi-provider orchestration
   - Cultural protocol middleware
   - Cost tracking and optimization

5. **Launch Public Wiki** (Week 6)
   - Evidence-based intervention catalog
   - Portfolio analytics dashboard
   - Searchable knowledge base

## Success Metrics

- **Coverage**: 500+ interventions cataloged with evidence
- **Quality**: >80% high-confidence evidence extraction
- **Access**: <200ms semantic search response time
- **Cost**: <$100/month infrastructure (with caching)
- **Impact**: Used by 10+ youth justice organizations for decision-making

# ALMA Continuous Learning & Improvement Strategy

**How ALMA Gets Smarter Over Time**

## Philosophy: Learning from Every Interaction

ALMA should improve with every document processed, every query answered, every pattern detected. This is inspired by ACT Personal AI's approach of **signals tracking over time** and **pattern recognition from history**.

---

## 1. Extraction Pattern Learning

### The Challenge
When we extract interventions from documents, we learn patterns about:
- What makes a "good" intervention description
- Which metadata fields are most valuable
- What evidence levels map to which language
- Which keywords indicate community authority

### The Solution: Extraction Confidence Tracking

```sql
-- Track extraction quality over time
CREATE TABLE alma_extraction_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES alma_source_documents(id),
  extraction_date TIMESTAMPTZ DEFAULT NOW(),

  -- What we extracted
  entities_extracted JSONB, -- {interventions: 5, organizations: 3, outcomes: 12}
  extraction_method TEXT, -- 'llm_structured', 'manual', 'pattern_match'

  -- Quality signals
  confidence_score FLOAT, -- 0.0-1.0 (from semantic similarity)
  manual_review_score FLOAT, -- Human validation (if reviewed)
  fields_missing JSONB, -- ['cost_per_participant', 'evidence_level']

  -- Learning signals
  prompts_used JSONB, -- Store successful prompts for reuse
  errors_encountered JSONB,
  improvements_made TEXT,

  -- Pattern recognition
  document_type_detected TEXT, -- 'government_report', 'evaluation', 'media'
  extraction_patterns JSONB -- What worked for this doc type
);

-- Learn which prompts work best for each document type
CREATE OR REPLACE FUNCTION get_best_extraction_prompt(doc_type TEXT)
RETURNS TEXT AS $$
DECLARE
  best_prompt TEXT;
BEGIN
  SELECT el.prompts_used->>'intervention_extract' INTO best_prompt
  FROM alma_extraction_learnings el
  WHERE el.document_type_detected = doc_type
    AND el.confidence_score > 0.8
  ORDER BY el.manual_review_score DESC NULLS LAST, el.confidence_score DESC
  LIMIT 1;

  RETURN best_prompt;
END;
$$ LANGUAGE plpgsql;
```

### Example: Improving Over Time

**Initial Extraction** (Document 1 - Government Report):
```json
{
  "prompt": "Extract interventions from this document",
  "result": {
    "interventions": 3,
    "confidence": 0.6,
    "fields_missing": ["cost", "evidence_level", "outcomes"]
  }
}
```

**After Learning** (Document 50 - Government Report):
```json
{
  "prompt": "Extract interventions including: name, type, target population, evidence level (RCT/evaluation/promising), cost per participant, quantitative outcomes, implementing organization. For government reports, look in executive summary and recommendations sections.",
  "result": {
    "interventions": 8,
    "confidence": 0.9,
    "fields_missing": []
  }
}
```

**Key**: ALMA learns that government reports have rich data in specific sections and adjusts prompts accordingly.

---

## 2. Semantic Search Improvement

### The Challenge
Initial semantic search might return irrelevant results. We need to learn from:
- Which results users clicked (relevance signal)
- Which portfolio scores correlated with user interest
- Which query patterns led to good vs bad results

### The Solution: Query Learning Loop

```sql
-- Track search queries and outcomes
CREATE TABLE alma_query_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  query_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Results returned
  results_returned JSONB, -- [{id, name, similarity, portfolio_score}]
  top_result_id UUID,

  -- User interaction signals
  results_clicked UUID[], -- Which results did user click?
  time_on_result JSONB, -- {result_id: seconds_spent}
  user_feedback TEXT, -- 'helpful', 'not_helpful', 'partially_helpful'

  -- Learning signals
  query_intent_detected TEXT, -- 'find_diversion_programs', 'compare_costs', 'aboriginal_led'
  filters_applied JSONB, -- {jurisdiction: 'NSW', type: 'Diversion'}

  -- Improvement tracking
  search_quality_score FLOAT, -- Based on click-through rate and time spent
  query_reformulation TEXT -- If user refined query, store it
);

-- Learn which queries lead to high-quality results
CREATE OR REPLACE VIEW alma_successful_query_patterns AS
SELECT
  query_intent_detected,
  COUNT(*) as query_count,
  AVG(search_quality_score) as avg_quality,
  MODE() WITHIN GROUP (ORDER BY query_text) as common_query_pattern,
  ARRAY_AGG(DISTINCT filters_applied) as effective_filters
FROM alma_query_learnings
WHERE search_quality_score > 0.7
GROUP BY query_intent_detected
ORDER BY avg_quality DESC;

-- Suggest query improvements based on history
CREATE OR REPLACE FUNCTION suggest_query_improvements(user_query TEXT)
RETURNS JSONB AS $$
DECLARE
  suggestions JSONB;
BEGIN
  -- Find similar successful queries
  WITH similar_queries AS (
    SELECT
      query_text,
      query_reformulation,
      filters_applied,
      search_quality_score
    FROM alma_query_learnings
    WHERE query_embedding <=> (SELECT embedding FROM embed_text(user_query)) < 0.3
      AND search_quality_score > 0.7
    ORDER BY search_quality_score DESC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'suggested_queries', jsonb_agg(query_text),
    'recommended_filters', jsonb_agg(DISTINCT filters_applied),
    'better_formulations', jsonb_agg(query_reformulation) FILTER (WHERE query_reformulation IS NOT NULL)
  ) INTO suggestions
  FROM similar_queries;

  RETURN suggestions;
END;
$$ LANGUAGE plpgsql;
```

### Example: Search Gets Smarter

**Initial Query**: "programs for Aboriginal kids"
- Returns 50 results, user scrolls past first 20
- Clicks on 1 result (low engagement)
- **Learning**: Query too vague, needs refinement

**After 100 Similar Queries**, ALMA learns:
- Suggest: "Aboriginal-led diversion programs for ages 10-14 in NSW"
- Auto-apply filters: `{community_authority > 0.8, target_cohort LIKE '%10-14%'}`
- Surface top 5 results with highest portfolio scores
- **Result**: 95% click-through rate on first result

---

## 3. Portfolio Signal Calibration

### The Challenge
Our initial signal weights (Evidence 25%, Authority 30%, etc.) are estimates. We need to learn:
- Do high-authority programs actually get more funding?
- Do high-evidence programs show better outcomes?
- Are our weights aligned with what actually works?

### The Solution: Outcome Tracking & Signal Adjustment

```sql
-- Track real-world outcomes of interventions
CREATE TABLE alma_intervention_outcomes (
  intervention_id UUID REFERENCES alma_interventions(id),
  outcome_date DATE,

  -- Funding outcomes
  funding_secured NUMERIC, -- Did they get funded?
  funding_source TEXT,
  funding_duration_years INT,

  -- Program outcomes
  participants_served INT,
  recidivism_rate FLOAT, -- Lower is better
  community_reconnection_rate FLOAT, -- Higher is better
  cultural_continuity_score FLOAT, -- Self-reported by community

  -- Sustainability signals
  program_still_running BOOLEAN,
  staff_turnover_rate FLOAT,
  community_satisfaction_score FLOAT,

  -- What we predicted vs actual
  predicted_portfolio_score FLOAT,
  predicted_recommendation TEXT,
  actual_outcome_score FLOAT, -- Composite of outcomes above

  -- Learning
  signal_accuracy JSONB -- Which signals were most predictive?
);

-- Analyze signal accuracy over time
CREATE OR REPLACE VIEW alma_signal_calibration AS
SELECT
  DATE_TRUNC('month', outcome_date) as month,

  -- How well did each signal predict outcomes?
  CORR(
    (SELECT evidence_strength FROM calculate_portfolio_score(intervention_id)),
    actual_outcome_score
  ) as evidence_predictive_power,

  CORR(
    (SELECT community_authority FROM calculate_portfolio_score(intervention_id)),
    actual_outcome_score
  ) as authority_predictive_power,

  CORR(
    (SELECT composite_score FROM calculate_portfolio_score(intervention_id)),
    actual_outcome_score
  ) as overall_predictive_power,

  -- How many interventions had outcomes tracked
  COUNT(*) as interventions_tracked
FROM alma_intervention_outcomes
GROUP BY DATE_TRUNC('month', outcome_date)
ORDER BY month DESC;

-- Suggest signal weight adjustments based on real outcomes
CREATE OR REPLACE FUNCTION suggest_signal_weight_adjustments()
RETURNS TABLE(
  signal_name TEXT,
  current_weight FLOAT,
  suggested_weight FLOAT,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH signal_performance AS (
    SELECT
      'Evidence Strength' as signal,
      0.25 as current_weight,
      CORR(
        (SELECT evidence_strength FROM calculate_portfolio_score(intervention_id)),
        actual_outcome_score
      ) as correlation
    FROM alma_intervention_outcomes
    WHERE outcome_date > CURRENT_DATE - INTERVAL '1 year'

    UNION ALL

    SELECT
      'Community Authority' as signal,
      0.30 as current_weight,
      CORR(
        (SELECT community_authority FROM calculate_portfolio_score(intervention_id)),
        actual_outcome_score
      ) as correlation
    FROM alma_intervention_outcomes
    WHERE outcome_date > CURRENT_DATE - INTERVAL '1 year'
  )
  SELECT
    signal,
    current_weight,
    -- Suggest weight proportional to correlation
    (correlation / SUM(correlation) OVER ()) as suggested,
    CASE
      WHEN correlation > current_weight * 1.2 THEN 'Increase - stronger predictor than expected'
      WHEN correlation < current_weight * 0.8 THEN 'Decrease - weaker predictor than expected'
      ELSE 'Maintain - performing as expected'
    END as reason
  FROM signal_performance;
END;
$$ LANGUAGE plpgsql;
```

### Example: Self-Calibrating Signals

**Initial Hypothesis**:
- Evidence Strength: 25%
- Community Authority: 30%
- Harm Risk: 20%
- Implementation: 15%
- Option Value: 10%

**After 1 Year of Tracking 100 Interventions**:
```
Evidence Strength: 0.6 correlation with outcomes → Keep 25%
Community Authority: 0.8 correlation with outcomes → Increase to 35% ⬆️
Harm Risk: 0.5 correlation → Keep 20%
Implementation: 0.4 correlation → Decrease to 10% ⬇️
Option Value: 0.3 correlation → Decrease to 10% ⬇️
```

**Learning**: Community authority is EVEN MORE predictive than we thought. Adjust weights accordingly.

---

## 4. Pattern Recognition Learning

### The Challenge
We want to detect "familiar failure modes" (tough on crime cycles, pilot program churn, consultation theater). But we need to learn new patterns as they emerge.

### The Solution: Crowdsourced Pattern Detection

```sql
-- Community contributions to pattern library
CREATE TABLE alma_pattern_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT, -- 'failure_mode', 'success_pattern', 'early_warning'

  -- Pattern definition
  signals JSONB, -- [{signal: 'detention_beds_announced', weight: 0.8}]
  typical_outcome TEXT,
  counter_pattern TEXT, -- What would work instead?

  -- Learning signals
  times_detected INT DEFAULT 0,
  accuracy_rate FLOAT, -- How often did predicted outcome occur?
  contributed_by TEXT, -- 'community_member', 'researcher', 'system_detected'

  -- Evidence
  historical_examples JSONB, -- [{case: 'NT 2016', outcome: 'Royal Commission'}]
  research_citations JSONB,

  -- Community validation
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  reviewed_by_elders BOOLEAN DEFAULT FALSE
);

-- Detect patterns in intervention history
CREATE OR REPLACE FUNCTION detect_emerging_patterns(intervention_history JSONB)
RETURNS TABLE(
  pattern_name TEXT,
  confidence FLOAT,
  signals_matched INT,
  recommended_action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.pattern_name,
    (COUNT(*) FILTER (WHERE h.signal::text LIKE ANY(ARRAY(SELECT jsonb_array_elements_text(p.signals->>'signal'))))::float / jsonb_array_length(p.signals)) as confidence,
    COUNT(*) FILTER (WHERE h.signal::text LIKE ANY(ARRAY(SELECT jsonb_array_elements_text(p.signals->>'signal')))) as matched,
    p.counter_pattern as action
  FROM alma_pattern_library p
  CROSS JOIN LATERAL jsonb_array_elements(intervention_history) h(signal)
  WHERE p.accuracy_rate > 0.7 -- Only use validated patterns
  GROUP BY p.pattern_name, p.signals, p.counter_pattern
  HAVING COUNT(*) FILTER (WHERE h.signal::text LIKE ANY(ARRAY(SELECT jsonb_array_elements_text(p.signals->>'signal')))) >= 2
  ORDER BY confidence DESC;
END;
$$ LANGUAGE plpgsql;
```

### Example: Community Teaches ALMA New Patterns

**Initial Patterns** (system-defined):
1. Tough on Crime Cycle
2. Pilot Program Churn
3. Consultation Theater

**After 6 Months** (community-contributed):
4. **"Deficit Narrative Creep"**
   - Signals: Media focus shifts to "youth crime wave", politicians demand "tougher penalties", community programs defunded
   - Outcome: Public opinion turns, evidence-based programs lose support
   - Counter: Proactive narrative shift to "community healing" and "cultural reconnection"
   - Contributed by: Aboriginal Youth Justice Network
   - Validated: 12 historical examples (2010 NT, 2015 WA, 2018 QLD)

5. **"Innovation Washing"**
   - Signals: Government announces "world-first" program, no Aboriginal governance, mainstream service provider wins contract
   - Outcome: Program fails to engage community, cancelled after 18 months
   - Counter: Require Aboriginal community control from inception
   - Contributed by: VALS researcher
   - Validated: 8 cases across 4 states

**ALMA learns**: These community-identified patterns are more accurate (85% prediction rate) than system-defined ones (65%). **Prioritize community wisdom**.

---

## 5. Document Type Learning

### The Challenge
Different document types have different information densities and structures:
- Government reports: Rich in statistics, weak on community voice
- Evaluation reports: Strong on outcomes, weak on cultural context
- Community reports: Strong on lived experience, variable on data
- Media articles: Strong on narrative, weak on evidence

### The Solution: Document Intelligence Profiles

```sql
-- Learn document type characteristics
CREATE TABLE alma_document_intelligence (
  document_type TEXT PRIMARY KEY,

  -- Information density
  avg_interventions_per_page FLOAT,
  avg_outcomes_per_intervention FLOAT,
  metadata_completeness_score FLOAT, -- How often all fields present?

  -- Extraction strategies that work
  best_prompts JSONB,
  successful_extraction_patterns JSONB,
  common_sections JSONB, -- {executive_summary: 95%, recommendations: 80%}

  -- Confidence by field
  field_reliability JSONB, -- {cost: 0.9, evidence_level: 0.7, community_authority: 0.3}

  -- Learning
  documents_processed INT,
  avg_confidence_score FLOAT,
  last_updated TIMESTAMPTZ
);

-- Update intelligence after each document processed
CREATE OR REPLACE FUNCTION update_document_intelligence(
  doc_type TEXT,
  extraction_result JSONB
) RETURNS void AS $$
BEGIN
  INSERT INTO alma_document_intelligence (document_type, documents_processed, avg_confidence_score)
  VALUES (doc_type, 1, extraction_result->>'confidence')
  ON CONFLICT (document_type) DO UPDATE SET
    documents_processed = alma_document_intelligence.documents_processed + 1,
    avg_confidence_score = (alma_document_intelligence.avg_confidence_score * alma_document_intelligence.documents_processed + (extraction_result->>'confidence')::float) / (alma_document_intelligence.documents_processed + 1),
    -- Update other fields based on this extraction
    field_reliability = COALESCE(alma_document_intelligence.field_reliability, '{}'::jsonb) || extraction_result->'field_confidence',
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;
```

### Example: ALMA Learns Document Signatures

**Government Reports** (after 50 processed):
```json
{
  "avg_interventions_per_page": 2.3,
  "metadata_completeness": 0.85,
  "best_sections": ["executive_summary", "recommendations", "appendix_A"],
  "field_reliability": {
    "cost_data": 0.9,
    "evidence_level": 0.8,
    "community_authority": 0.4,  // ⚠️ Low - often missing
    "outcomes": 0.7
  },
  "extraction_tip": "Government reports have great cost data but underreport community authority. Cross-reference with community organizations."
}
```

**Community Reports** (after 30 processed):
```json
{
  "avg_interventions_per_page": 1.1,
  "metadata_completeness": 0.6,
  "best_sections": ["lived_experience", "community_voice", "cultural_context"],
  "field_reliability": {
    "cost_data": 0.3,  // ⚠️ Low - often not tracked
    "evidence_level": 0.5,
    "community_authority": 0.95,  // ⭐ Excellent
    "cultural_fit": 0.9
  },
  "extraction_tip": "Community reports are the gold standard for cultural authority. Cost data often missing - estimate from similar programs."
}
```

**Learning**: To get complete intervention profiles, ALMA learns to combine government reports (for costs/evidence) with community reports (for cultural authority). **Triangulate across document types**.

---

## 6. Enrichment Loop: Learn → Scrape → Enrich → Repeat

### The Flywheel

```
1. Extract interventions from documents
   ↓
2. Identify missing fields (cost, outcomes, community authority)
   ↓
3. Search for supplementary sources (grants DB, service directories, org websites)
   ↓
4. Enrich intervention records with new data
   ↓
5. Learn which enrichment sources are most reliable
   ↓
6. Repeat for next intervention
```

### Implementation

```sql
-- Track enrichment sources and success rates
CREATE TABLE alma_enrichment_sources (
  source_type TEXT PRIMARY KEY, -- 'grants_db', 'service_directory', 'org_website', 'research_db'

  -- Success metrics
  queries_made INT DEFAULT 0,
  successful_enrichments INT DEFAULT 0,
  success_rate FLOAT GENERATED ALWAYS AS (successful_enrichments::float / NULLIF(queries_made, 0)) STORED,

  -- What fields does this source provide?
  fields_provided JSONB, -- {cost: 0.8, outcomes: 0.6, contact: 0.95}
  avg_data_quality FLOAT,

  -- Cost
  avg_query_time_ms INT,
  api_calls_per_enrichment FLOAT,
  cost_per_enrichment NUMERIC,

  -- Learning
  best_use_cases TEXT[], -- ['cost_data', 'org_contact', 'funding_history']
  last_updated TIMESTAMPTZ
);

-- Intelligent enrichment strategy
CREATE OR REPLACE FUNCTION plan_enrichment_strategy(intervention_id UUID)
RETURNS TABLE(
  enrichment_step INT,
  source_type TEXT,
  expected_fields TEXT[],
  priority FLOAT
) AS $$
DECLARE
  missing_fields TEXT[];
BEGIN
  -- Identify what's missing
  SELECT ARRAY_AGG(field) INTO missing_fields
  FROM (
    SELECT 'cost' as field WHERE (SELECT metadata->>'cost' FROM alma_interventions WHERE id = intervention_id) IS NULL
    UNION ALL
    SELECT 'outcomes' WHERE (SELECT metadata->>'outcomes' FROM alma_interventions WHERE id = intervention_id) IS NULL
    UNION ALL
    SELECT 'contact' WHERE (SELECT metadata->>'contact' FROM alma_interventions WHERE id = intervention_id) IS NULL
  ) fields;

  -- Return optimal enrichment sequence based on learned success rates
  RETURN QUERY
  WITH source_matches AS (
    SELECT
      s.source_type,
      s.success_rate,
      s.cost_per_enrichment,
      s.fields_provided,
      -- How many missing fields can this source fill?
      (SELECT COUNT(*) FROM unnest(missing_fields) mf
       WHERE (s.fields_provided->>mf)::float > 0.7) as fields_fillable
    FROM alma_enrichment_sources s
    WHERE fields_fillable > 0
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY (success_rate * fields_fillable) / NULLIF(cost_per_enrichment, 0) DESC)::int as step,
    source_type,
    ARRAY(SELECT unnest(missing_fields) mf WHERE (fields_provided->>mf)::float > 0.7) as fields,
    (success_rate * fields_fillable) / NULLIF(cost_per_enrichment, 0) as priority
  FROM source_matches
  ORDER BY priority DESC;
END;
$$ LANGUAGE plpgsql;
```

### Example: Smart Enrichment in Action

**Intervention Extracted**: "Maranguka Justice Reinvestment - Bourke"
**Missing Fields**: `cost_per_participant`, `outcomes`, `contact_email`

**ALMA Plans Enrichment**:
```
Step 1: Search "grants_db" (Australian Government Community Grants)
  → Expected: cost_per_participant (85% success), funding_amount
  → Priority: 0.95 (high success, low cost)

Step 2: Search "service_directory" (Ask Izzy, Infoxchange)
  → Expected: contact_email (92% success), org_website
  → Priority: 0.88

Step 3: Web scrape "org_website" (justreinvest.org.au/bourke-maranguka)
  → Expected: outcomes (65% success), program_description
  → Priority: 0.45

Result:
- Found cost: $2.8M over 5 years (~$1,400 per participant)
- Found contact: maranguka@justreinvest.org.au
- Found outcomes: 23% reduction in charges, 14% reduction in bail breaches
- Completeness: 85% → 98% ✅
```

**ALMA Learns**: Grants DB is 85% successful for cost data → prioritize for future enrichments.

---

## 7. Continuous Intelligence Updates

### The Challenge
Evidence changes. New programs launch. Old programs shut down. ALMA needs to stay current.

### The Solution: Automated Monitoring & Updates

```sql
-- Track source freshness
CREATE TABLE alma_source_monitoring (
  source_url TEXT PRIMARY KEY,

  -- Monitoring
  last_checked TIMESTAMPTZ,
  check_frequency_days INT DEFAULT 30, -- How often to check
  content_hash TEXT, -- SHA256 of content

  -- Change detection
  last_changed TIMESTAMPTZ,
  change_detected BOOLEAN DEFAULT FALSE,
  change_summary TEXT,

  -- Auto-update settings
  auto_update_enabled BOOLEAN DEFAULT TRUE,
  requires_review BOOLEAN DEFAULT FALSE,

  -- Priority
  importance_score FLOAT, -- Based on how many interventions cite this source
  next_check_due TIMESTAMPTZ GENERATED ALWAYS AS (last_checked + (check_frequency_days || ' days')::interval) STORED
);

-- Identify sources due for update
CREATE OR REPLACE VIEW alma_sources_to_check AS
SELECT
  sm.source_url,
  sm.importance_score,
  COUNT(DISTINCT i.id) as interventions_affected,
  sm.last_checked,
  sm.next_check_due
FROM alma_source_monitoring sm
LEFT JOIN alma_interventions i ON i.source_documents::jsonb @> jsonb_build_array(jsonb_build_object('url', sm.source_url))
WHERE sm.next_check_due < NOW()
  OR sm.last_checked IS NULL
ORDER BY sm.importance_score DESC, interventions_affected DESC;
```

### Example: Self-Updating Intelligence

**Day 1**: ALMA processes ROGS 2025 report
- Sets monitoring: Check every 365 days (annual report)
- Importance: 0.95 (affects 50+ interventions)

**Day 365**: ALMA auto-checks
- Detects: ROGS 2026 published
- Content hash changed
- Triggers: Re-extraction of updated statistics
- Updates: All affected intervention records with new data
- Logs: "Updated 52 interventions with ROGS 2026 data"

**Result**: ALMA is always current with the latest evidence.

---

## Summary: The Learning Loop

```
┌─────────────────────────────────────────────────────────┐
│                    ALMA LEARNING LOOP                    │
└─────────────────────────────────────────────────────────┘

1. EXTRACT
   ↓ (learn what works for each doc type)

2. TRACK CONFIDENCE
   ↓ (improve extraction prompts)

3. SEARCH & ENRICH
   ↓ (learn which sources are reliable)

4. MONITOR OUTCOMES
   ↓ (calibrate portfolio signals)

5. DETECT PATTERNS
   ↓ (learn from community wisdom)

6. UPDATE INTELLIGENCE
   ↓ (stay current with latest evidence)

7. SERVE QUERIES
   ↓ (learn what users need)

→ REPEAT (getting smarter each cycle)
```

## Key Metrics to Track

1. **Extraction Accuracy** (target: >85%)
   - Confidence scores trending up
   - Fields missing trending down
   - Manual review needed trending down

2. **Search Relevance** (target: >80% click-through on top result)
   - Query quality scores trending up
   - User feedback positive
   - Time to find answer decreasing

3. **Signal Predictive Power** (target: >0.7 correlation with outcomes)
   - Community authority correlation
   - Evidence strength correlation
   - Composite score correlation

4. **Data Freshness** (target: <30 day lag)
   - % of sources checked in last 30 days
   - % of interventions updated in last 90 days
   - Detected changes processed within 7 days

5. **Coverage Growth** (target: +50 interventions/month)
   - Interventions with >80% metadata completeness
   - Geographic coverage (all 8 jurisdictions)
   - Program type diversity

## Next Steps

1. **Implement extraction learning tables** (this creates the foundation)
2. **Start tracking every extraction** (confidence, patterns, prompts)
3. **Build enrichment pipeline** (automated gap filling)
4. **Deploy outcome tracking** (connect to real-world results)
5. **Create community feedback loop** (pattern library contributions)
6. **Monitor and calibrate** (quarterly signal weight reviews)

---

**The Goal**: ALMA should be 2x smarter in 6 months, 10x smarter in 2 years. Not through manual updates, but through **continuous learning from every interaction**.

This is how we build the world's best youth justice intelligence system.

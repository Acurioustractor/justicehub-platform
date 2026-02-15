# ALMA Continuous Learning System

## Overview

The ALMA Learning System implements a continuous feedback loop that learns from extraction patterns to improve evidence extraction quality over time. Unlike traditional ML systems that optimize for metrics, ALMA's learning system is designed around **transparency, human judgment, and ethical constraints**.

## Philosophy

> "Machines learn patterns. Humans make decisions."

ALMA learns:
- **What** patterns indicate high-quality evidence
- **When** to escalate to human review
- **Which** extraction strategies work for different document types
- **How** confident to be in extractions

ALMA **never** learns to:
- Decide which interventions to fund
- Rank communities or organizations
- Predict individual behavior
- Optimize people

## Architecture

### 1. Extraction History (`alma_extraction_history`)

Tracks every extraction attempt with full metadata:

```sql
CREATE TABLE alma_extraction_history (
  id UUID PRIMARY KEY,
  source_document_id UUID,
  raw_content_id UUID,

  -- Document characteristics
  document_type TEXT,           -- government_report, research_paper, etc.
  document_length INT,
  document_structure TEXT,      -- pdf_table, html_list, etc.

  -- Extraction results
  interventions_extracted INT,
  interventions_validated INT,  -- After human review
  extraction_confidence FLOAT,
  extraction_strategy TEXT,     -- Which approach was used

  -- Quality signals
  evidence_extracted BOOLEAN,
  community_authority_detected BOOLEAN,
  cost_data_extracted BOOLEAN,
  outcomes_extracted BOOLEAN,

  -- Learning signals
  extraction_success BOOLEAN,
  human_review_required BOOLEAN,
  human_feedback JSONB,

  -- Performance
  extraction_time_ms INT,
  llm_tokens_used INT,
  cost_usd NUMERIC(10, 4)
);
```

### 2. Learning Patterns (`alma_learning_patterns`)

Stores discovered patterns that improve future extractions:

```sql
CREATE TABLE alma_learning_patterns (
  id UUID PRIMARY KEY,
  pattern_type TEXT,            -- document_structure, evidence_indicator, etc.
  pattern_name TEXT UNIQUE,
  pattern_description TEXT,

  -- Pattern definition
  pattern_signals JSONB,        -- What indicates this pattern
  confidence_threshold FLOAT,

  -- Effectiveness metrics
  observations_count INT,       -- How many times observed
  success_rate FLOAT,           -- % successful when detected
  precision FLOAT,              -- % detections that were correct
  recall FLOAT,                 -- % actual instances detected

  -- Evolution
  pattern_strength FLOAT,       -- 0-1, how reliable
  pattern_active BOOLEAN,       -- Can be deprecated
  first_observed TIMESTAMPTZ,
  last_observed TIMESTAMPTZ
);
```

### 3. Quality Metrics (`alma_quality_metrics`)

Daily aggregated metrics for monitoring progress:

```sql
CREATE TABLE alma_quality_metrics (
  metric_date DATE PRIMARY KEY,

  -- Extraction performance
  total_extractions INT,
  successful_extractions INT,
  avg_extraction_confidence FLOAT,

  -- Evidence quality
  high_evidence_interventions INT,
  community_led_interventions INT,
  complete_interventions INT,

  -- Learning progress
  new_patterns_discovered INT,
  total_active_patterns INT,

  -- Confidence calibration
  avg_human_agreement_rate FLOAT,
  confidence_calibration_error FLOAT
);
```

### 4. Human Feedback (`alma_human_feedback`)

Captures human corrections for learning:

```sql
CREATE TABLE alma_human_feedback (
  id UUID PRIMARY KEY,
  extraction_history_id UUID,
  intervention_id UUID,

  feedback_type TEXT,          -- correction, validation, enhancement
  field_name TEXT,
  original_value TEXT,
  corrected_value TEXT,
  correction_reason TEXT,

  confidence FLOAT
);
```

## How It Works

### 1. Pattern Discovery

The system automatically discovers patterns in successful extractions:

```javascript
// Example: Document type patterns
{
  pattern_type: 'document_structure',
  pattern_name: 'government_report_optimal_strategy',
  pattern_signals: {
    document_type: 'government_report',
    recommended_strategy: 'table_focused',
    avg_confidence: 0.85,
    evidence_rate: 0.72
  },
  observations_count: 45,
  success_rate: 0.91,
  pattern_strength: 0.85
}
```

### 2. Strategy Selection

Before extraction, the system recommends the best strategy:

```javascript
const strategy = await learningSystem.getExtractionStrategy(
  'government_report',
  'pdf_table'
);

// Returns:
{
  strategy: 'table_focused',
  confidence: 0.85,
  reason: 'Based on 45 successful extractions',
  expectedEvidence: 0.72,
  expectedAuthority: 0.65
}
```

### 3. Quality Tracking

During extraction, quality metrics are tracked:

```javascript
tracker.startExtraction({...documentMetadata});

// For each intervention
tracker.recordIntervention(intervention);

// After completion
await tracker.completeExtraction(success);
```

### 4. Human Review Flagging

System automatically identifies extractions needing review:

```javascript
determineIfReviewNeeded() {
  // Low confidence
  if (confidence < 0.6) return true;

  // No interventions found
  if (interventions_extracted === 0) return true;

  // Missing critical fields
  if (!evidence_extracted && !community_authority_detected) return true;

  // Unknown document type (need to learn)
  if (document_type === 'unknown') return true;

  return false;
}
```

### 5. Confidence Calibration

System learns to align confidence scores with actual accuracy:

```javascript
// Calculate calibration error
const error = Math.abs(
  extraction_confidence -
  (interventions_validated / interventions_extracted)
);

// Adjust thresholds if error > 0.2
if (avg_calibration_error > 0.2) {
  adjustConfidenceThresholds();
}
```

## Usage

### Run Learning Analysis

```bash
# Analyze recent extractions and learn patterns
node scripts/alma-learning-system.mjs
```

This will:
1. Analyze successful extractions
2. Discover patterns by document type
3. Learn quality indicators
4. Calibrate confidence scores
5. Suggest interventions needing review
6. Generate learning report

### Extract with Learning

```bash
# Process documents with learning-enabled extraction
node scripts/alma-scrape-with-learning.mjs batch 10

# Process specific document
node scripts/alma-scrape-with-learning.mjs document <uuid>
```

### View Quality Report

```bash
# Show extraction quality over last 30 days
node scripts/alma-extraction-tracker.mjs
```

### Run Daily Metrics

```sql
-- Calculate today's quality metrics
SELECT calculate_daily_quality_metrics();

-- View recent performance
SELECT * FROM alma_recent_extraction_performance;

-- View learned patterns
SELECT * FROM alma_patterns_by_effectiveness;

-- View interventions needing review
SELECT * FROM alma_interventions_needing_review LIMIT 20;
```

## What the System Learns

### 1. Document Type Strategies

**Learns**: Which extraction approach works best for each document type

Example patterns discovered:
- Government reports with tables → `table_focused` strategy (85% confidence)
- Research papers → `narrative_focused` strategy (78% confidence)
- Service directories → `list_focused` strategy (92% confidence)

### 2. Evidence Indicators

**Learns**: Keywords and patterns that indicate high-quality evidence

Example indicators:
- "randomized controlled trial" → High evidence
- "community-controlled" → High community authority
- "cost per participant" → Cost data present
- "recidivism rate" → Outcomes data present

### 3. Quality Signals

**Learns**: What makes a complete, high-quality extraction

Example signals:
- Interventions with both evidence AND authority → 90% validation rate
- Interventions with 4 fields → 95% keep rate
- Interventions with <2 fields → 60% need enhancement

### 4. Confidence Calibration

**Learns**: When the system is overconfident or underconfident

Example calibration:
- Initial: Confidence 0.8, Actual accuracy 0.6 → Error 0.2 (overconfident)
- After learning: Confidence 0.65, Actual accuracy 0.62 → Error 0.03 (calibrated)

### 5. Review Triggers

**Learns**: When to escalate to humans

Example triggers:
- Unknown document type → Always review (learn new type)
- Confidence < 0.6 → Review
- 0 interventions extracted → Review (might be extraction failure)
- Missing both evidence AND authority → Review

## Performance Metrics

### Extraction Quality Score

Composite score (0-100) based on:

- **Intervention count** (30 points max): More interventions = more evidence
- **Confidence** (25 points max): How confident in extractions
- **Completeness** (45 points max):
  - Evidence extracted: 15 points
  - Community authority: 15 points
  - Cost data: 7.5 points
  - Outcomes data: 7.5 points

### Success Criteria

**High Quality Extraction** (Score ≥ 80):
- Multiple interventions extracted
- High confidence (≥ 0.7)
- Evidence AND community authority detected
- Cost and/or outcomes data present

**Medium Quality** (Score 60-79):
- Some interventions extracted
- Moderate confidence (0.5-0.7)
- Either evidence OR authority detected
- Some completeness gaps

**Needs Review** (Score < 60):
- Few/no interventions
- Low confidence (< 0.5)
- Missing critical fields
- Unknown document type

## Learning Cycle

### Daily Workflow

```bash
# 1. Run extractions with learning
node scripts/alma-scrape-with-learning.mjs batch 20

# 2. Run learning analysis
node scripts/alma-learning-system.mjs

# 3. Calculate daily metrics
psql -c "SELECT calculate_daily_quality_metrics();"

# 4. Review flagged interventions
# (Check alma_interventions_needing_review view)
```

### Weekly Review

1. Check quality trends (are we improving?)
2. Review new patterns discovered
3. Validate high-strength patterns
4. Deprecate outdated patterns
5. Provide feedback on flagged extractions

### Monthly Analysis

1. Generate comprehensive learning report
2. Analyze cost efficiency trends
3. Review confidence calibration
4. Update extraction strategies based on learning
5. Document insights for community

## Ethical Boundaries

### What ALMA Learning System Does

✅ Learns which document structures contain evidence
✅ Learns keywords that indicate community authority
✅ Learns when extractions need human review
✅ Learns which strategies work for which document types
✅ Calibrates confidence scores against accuracy

### What ALMA Learning System NEVER Does

❌ Learns to rank interventions
❌ Learns to predict which interventions to fund
❌ Learns to score communities or organizations
❌ Learns to optimize people or outcomes
❌ Learns from data without consent
❌ Makes funding decisions automatically

## Transparency

Every pattern learned is:
1. **Explainable**: Clear definition of what the pattern detects
2. **Traceable**: Linked to specific observations
3. **Measurable**: Success rate, precision, recall tracked
4. **Reversible**: Can be deprecated if no longer valid
5. **Human-reviewable**: Patterns can be inspected and corrected

Example pattern transparency:

```json
{
  "pattern_name": "government_report_optimal_strategy",
  "pattern_type": "document_structure",
  "description": "Best extraction strategy for government reports",
  "pattern_signals": {
    "document_type": "government_report",
    "recommended_strategy": "table_focused"
  },
  "observations_count": 45,
  "success_rate": 0.91,
  "precision": 0.87,
  "pattern_strength": 0.85,
  "first_observed": "2026-01-01",
  "last_observed": "2026-01-04"
}
```

Any human can understand:
- What this pattern detects
- How many times it's been observed
- How reliable it is
- When it was learned

## Integration with Existing Tools

### With ALMA Agent (`alma_agent.py`)

The Python agent can query learned patterns:

```python
# Get extraction recommendations
patterns = await supabase.from_('alma_learning_patterns')\
  .select('*')\
  .eq('pattern_type', 'document_structure')\
  .order('pattern_strength', desc=True)

# Get quality metrics
metrics = await supabase.from_('alma_quality_metrics')\
  .select('*')\
  .order('metric_date', desc=True)\
  .limit(30)
```

### With Portfolio Scoring (`alma_signal_functions.sql`)

Learning improves portfolio scoring by:
- Better evidence detection → More accurate evidence_strength signals
- Better authority detection → More accurate community_authority signals
- Better completeness → More complete interventions for scoring

### With Continuous Ingestion (`alma-continuous-ingestion.mjs`)

Learning enables smarter ingestion:
- Skip documents that historically yield no interventions
- Prioritize document types with high extraction rates
- Use optimal strategies for each source

## Future Enhancements

### Phase 2: Cross-Project Learning
- Learn patterns from Empathy Ledger story extractions
- Share learned strategies across ACT projects
- Detect cross-domain opportunities

### Phase 3: Active Learning
- Identify highest-value documents to scrape next
- Suggest new sources likely to have evidence
- Learn from community corrections

### Phase 4: Federated Learning
- Learn from other jurisdictions (Canada, NZ, US)
- Share patterns while protecting data sovereignty
- Build global evidence base for Indigenous justice

## Questions?

This system is designed to be **transparent and human-centered**. If you're unsure:
- Check the learned patterns table
- Review the quality metrics
- Look at the extraction history
- Ask humans, not machines

Remember: **ALMA learns to surface patterns. Humans decide what they mean.**

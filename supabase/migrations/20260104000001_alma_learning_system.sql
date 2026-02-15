-- ALMA Learning System Tables
-- Continuous learning feedback loop for improving extraction quality over time

-- 1. Extraction History Table
-- Tracks every extraction attempt with detailed metadata for learning
CREATE TABLE IF NOT EXISTS alma_extraction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES alma_source_documents(id) ON DELETE CASCADE,
  raw_content_id UUID REFERENCES alma_raw_content(id) ON DELETE CASCADE,
  extraction_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Extraction metadata
  document_type TEXT, -- 'government_report', 'research_paper', 'news_article', 'policy_doc'
  document_length INT,
  document_structure TEXT, -- 'pdf_table', 'pdf_narrative', 'html_list', 'html_article'

  -- Extraction results
  interventions_extracted INT DEFAULT 0,
  interventions_validated INT DEFAULT 0, -- After human review
  extraction_confidence FLOAT CHECK (extraction_confidence BETWEEN 0 AND 1),
  extraction_strategy TEXT, -- Which prompt/approach used

  -- Quality metrics (what was successfully extracted)
  evidence_extracted BOOLEAN DEFAULT FALSE,
  community_authority_detected BOOLEAN DEFAULT FALSE,
  cost_data_extracted BOOLEAN DEFAULT FALSE,
  outcomes_extracted BOOLEAN DEFAULT FALSE,
  complete_extraction BOOLEAN DEFAULT FALSE, -- All required fields present

  -- Learning signals
  extraction_success BOOLEAN, -- Did it work overall?
  human_review_required BOOLEAN DEFAULT FALSE,
  human_review_completed BOOLEAN DEFAULT FALSE,
  human_feedback JSONB, -- What humans corrected/improved

  -- Performance metrics
  extraction_time_ms INT,
  llm_tokens_used INT,
  cost_usd NUMERIC(10, 4),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for extraction history
CREATE INDEX IF NOT EXISTS idx_extraction_document_type ON alma_extraction_history(document_type);
CREATE INDEX IF NOT EXISTS idx_extraction_structure ON alma_extraction_history(document_structure);
CREATE INDEX IF NOT EXISTS idx_extraction_success ON alma_extraction_history(extraction_success);
CREATE INDEX IF NOT EXISTS idx_extraction_timestamp ON alma_extraction_history(extraction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_extraction_strategy ON alma_extraction_history(extraction_strategy);
CREATE INDEX IF NOT EXISTS idx_extraction_review_needed ON alma_extraction_history(human_review_required) WHERE human_review_required = TRUE;

-- 2. Learning Patterns Table
-- Stores learned patterns for improving future extractions
CREATE TABLE IF NOT EXISTS alma_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'document_structure', 'evidence_indicator', 'program_naming', 'authority_signal', 'extraction_strategy'
  pattern_name TEXT NOT NULL UNIQUE,
  pattern_description TEXT,

  -- Pattern definition
  pattern_signals JSONB NOT NULL, -- What signals indicate this pattern
  confidence_threshold FLOAT DEFAULT 0.7 CHECK (confidence_threshold BETWEEN 0 AND 1),

  -- Learning metrics
  observations_count INT DEFAULT 0, -- How many times seen
  success_rate FLOAT CHECK (success_rate BETWEEN 0 AND 1), -- % of successful extractions when pattern detected
  precision FLOAT CHECK (precision BETWEEN 0 AND 1), -- % of pattern detections that were correct
  recall FLOAT CHECK (recall BETWEEN 0 AND 1), -- % of actual instances that were detected

  -- Adaptation instructions
  strategy_adjustments JSONB, -- How to adjust extraction when pattern detected
  human_validation_required BOOLEAN DEFAULT FALSE,

  -- Evolution tracking
  first_observed TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ,
  pattern_strength FLOAT DEFAULT 0.5 CHECK (pattern_strength BETWEEN 0 AND 1), -- How strong/reliable is this pattern
  pattern_active BOOLEAN DEFAULT TRUE, -- Can be deprecated if no longer useful

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for learning patterns
CREATE INDEX IF NOT EXISTS idx_learning_pattern_type ON alma_learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_learning_strength ON alma_learning_patterns(pattern_strength DESC);
CREATE INDEX IF NOT EXISTS idx_learning_active ON alma_learning_patterns(pattern_active) WHERE pattern_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_learning_observations ON alma_learning_patterns(observations_count DESC);

-- 3. Quality Metrics Table
-- Daily aggregated metrics for monitoring learning progress
CREATE TABLE IF NOT EXISTS alma_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Extraction quality
  total_extractions INT DEFAULT 0,
  successful_extractions INT DEFAULT 0,
  partial_extractions INT DEFAULT 0,
  failed_extractions INT DEFAULT 0,

  -- Evidence quality
  high_evidence_interventions INT DEFAULT 0, -- evidence_strength > 0.7
  community_led_interventions INT DEFAULT 0, -- community_authority > 0.8
  complete_interventions INT DEFAULT 0, -- All required fields populated

  -- Specific field extraction rates
  evidence_field_rate FLOAT, -- % with evidence_level populated
  authority_field_rate FLOAT, -- % with cultural_authority populated
  cost_field_rate FLOAT, -- % with cost data
  outcomes_field_rate FLOAT, -- % with outcomes

  -- Learning progress
  new_patterns_discovered INT DEFAULT 0,
  patterns_validated INT DEFAULT 0,
  patterns_deprecated INT DEFAULT 0,
  total_active_patterns INT DEFAULT 0,

  -- Confidence calibration
  avg_extraction_confidence FLOAT,
  avg_human_agreement_rate FLOAT, -- % humans agree with extraction
  confidence_calibration_error FLOAT, -- Difference between confidence and accuracy

  -- Efficiency metrics
  avg_extraction_time_ms INT,
  avg_tokens_per_extraction INT,
  avg_cost_per_extraction NUMERIC(10, 4),
  total_cost_usd NUMERIC(10, 2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(metric_date)
);

-- Indexes for quality metrics
CREATE INDEX IF NOT EXISTS idx_quality_date ON alma_quality_metrics(metric_date DESC);

-- 4. Human Feedback Table
-- Captures human corrections and validations for learning
CREATE TABLE IF NOT EXISTS alma_human_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_history_id UUID REFERENCES alma_extraction_history(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES alma_interventions(id) ON DELETE CASCADE,

  -- Feedback type
  feedback_type TEXT NOT NULL, -- 'correction', 'validation', 'enhancement', 'rejection'
  field_name TEXT, -- Which field was corrected

  -- Values
  original_value TEXT,
  corrected_value TEXT,
  correction_reason TEXT,

  -- Reviewer
  reviewer_id UUID, -- Future: link to user table
  reviewer_notes TEXT,

  -- Confidence in correction
  confidence FLOAT CHECK (confidence BETWEEN 0 AND 1),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for human feedback
CREATE INDEX IF NOT EXISTS idx_feedback_extraction ON alma_human_feedback(extraction_history_id);
CREATE INDEX IF NOT EXISTS idx_feedback_intervention ON alma_human_feedback(intervention_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON alma_human_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_field ON alma_human_feedback(field_name);

-- 5. Extraction Strategies Table
-- Defines different extraction strategies that can be learned and improved
CREATE TABLE IF NOT EXISTS alma_extraction_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name TEXT NOT NULL UNIQUE,
  strategy_description TEXT,

  -- Strategy definition
  prompt_template TEXT, -- Base prompt for this strategy
  extraction_instructions JSONB, -- Detailed extraction instructions

  -- Applicability
  document_types TEXT[], -- Which document types this works for
  document_structures TEXT[], -- Which structures this works for

  -- Performance
  total_uses INT DEFAULT 0,
  success_rate FLOAT,
  avg_confidence FLOAT,
  avg_interventions_extracted FLOAT,
  avg_extraction_time_ms INT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE, -- Default strategy for unknown docs

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for extraction strategies
CREATE INDEX IF NOT EXISTS idx_strategy_active ON alma_extraction_strategies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_strategy_success ON alma_extraction_strategies(success_rate DESC);

-- Insert default extraction strategy
INSERT INTO alma_extraction_strategies (strategy_name, strategy_description, is_default, is_active)
VALUES (
  'default',
  'Standard extraction strategy for general documents',
  TRUE,
  TRUE
) ON CONFLICT (strategy_name) DO NOTHING;

-- Functions for automatic metric updates

-- Update extraction history updated_at timestamp
CREATE OR REPLACE FUNCTION update_extraction_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_extraction_history
  BEFORE UPDATE ON alma_extraction_history
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_history_timestamp();

-- Update learning pattern timestamp and increment observations
CREATE OR REPLACE FUNCTION update_learning_pattern_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_observed = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_pattern
  BEFORE UPDATE ON alma_learning_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_pattern_timestamp();

-- Function to calculate daily quality metrics
CREATE OR REPLACE FUNCTION calculate_daily_quality_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  total_ext INT;
  success_ext INT;
  partial_ext INT;
  failed_ext INT;
  high_ev INT;
  comm_led INT;
  complete_int INT;
  ev_rate FLOAT;
  auth_rate FLOAT;
  cost_rate FLOAT;
  out_rate FLOAT;
  new_patterns INT;
  active_patterns INT;
  avg_conf FLOAT;
  avg_agree FLOAT;
  cal_error FLOAT;
  avg_time INT;
  avg_tokens INT;
  avg_cost NUMERIC;
  total_cost NUMERIC;
BEGIN
  -- Extraction metrics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE extraction_success = TRUE),
    COUNT(*) FILTER (WHERE extraction_success = FALSE AND interventions_extracted > 0),
    COUNT(*) FILTER (WHERE extraction_success = FALSE AND interventions_extracted = 0),
    AVG(extraction_confidence),
    AVG(extraction_time_ms)::INT,
    AVG(llm_tokens_used)::INT,
    AVG(cost_usd),
    SUM(cost_usd)
  INTO
    total_ext, success_ext, partial_ext, failed_ext,
    avg_conf, avg_time, avg_tokens, avg_cost, total_cost
  FROM alma_extraction_history
  WHERE extraction_timestamp::date = target_date;

  -- Intervention quality metrics
  SELECT
    COUNT(*) FILTER (WHERE
      (metadata->>'evidence_strength')::FLOAT > 0.7 OR
      evidence_level IN ('Proven (RCT/quasi-experimental, replicated)', 'Effective (strong evaluation, positive outcomes)')
    ),
    COUNT(*) FILTER (WHERE
      (metadata->>'community_authority')::FLOAT > 0.8 OR
      cultural_authority ILIKE '%Aboriginal Community Controlled%' OR
      cultural_authority ILIKE '%Indigenous-led%'
    ),
    COUNT(*) FILTER (WHERE
      evidence_level IS NOT NULL AND
      cultural_authority IS NOT NULL AND
      target_cohort IS NOT NULL AND
      geography IS NOT NULL
    ),
    COUNT(*) FILTER (WHERE evidence_level IS NOT NULL)::FLOAT / NULLIF(COUNT(*), 0),
    COUNT(*) FILTER (WHERE cultural_authority IS NOT NULL)::FLOAT / NULLIF(COUNT(*), 0),
    COUNT(*) FILTER (WHERE costs IS NOT NULL OR metadata->'cost_data' IS NOT NULL)::FLOAT / NULLIF(COUNT(*), 0),
    COUNT(*) FILTER (WHERE outcomes IS NOT NULL OR metadata->'outcomes' IS NOT NULL)::FLOAT / NULLIF(COUNT(*), 0)
  INTO
    high_ev, comm_led, complete_int,
    ev_rate, auth_rate, cost_rate, out_rate
  FROM alma_interventions
  WHERE created_at::date = target_date;

  -- Learning pattern metrics
  SELECT
    COUNT(*) FILTER (WHERE first_observed::date = target_date),
    COUNT(*) FILTER (WHERE pattern_active = TRUE)
  INTO new_patterns, active_patterns
  FROM alma_learning_patterns;

  -- Human feedback metrics
  SELECT
    AVG(CASE WHEN feedback_type = 'validation' THEN 1.0 ELSE 0.0 END)
  INTO avg_agree
  FROM alma_human_feedback
  WHERE created_at::date = target_date;

  -- Calculate calibration error (confidence vs actual accuracy)
  SELECT AVG(ABS(
    eh.extraction_confidence -
    (eh.interventions_validated::FLOAT / NULLIF(eh.interventions_extracted, 0))
  ))
  INTO cal_error
  FROM alma_extraction_history eh
  WHERE eh.extraction_timestamp::date = target_date
    AND eh.human_review_completed = TRUE;

  -- Upsert metrics
  INSERT INTO alma_quality_metrics (
    metric_date,
    total_extractions,
    successful_extractions,
    partial_extractions,
    failed_extractions,
    high_evidence_interventions,
    community_led_interventions,
    complete_interventions,
    evidence_field_rate,
    authority_field_rate,
    cost_field_rate,
    outcomes_field_rate,
    new_patterns_discovered,
    total_active_patterns,
    avg_extraction_confidence,
    avg_human_agreement_rate,
    confidence_calibration_error,
    avg_extraction_time_ms,
    avg_tokens_per_extraction,
    avg_cost_per_extraction,
    total_cost_usd
  ) VALUES (
    target_date,
    COALESCE(total_ext, 0),
    COALESCE(success_ext, 0),
    COALESCE(partial_ext, 0),
    COALESCE(failed_ext, 0),
    COALESCE(high_ev, 0),
    COALESCE(comm_led, 0),
    COALESCE(complete_int, 0),
    ev_rate,
    auth_rate,
    cost_rate,
    out_rate,
    COALESCE(new_patterns, 0),
    COALESCE(active_patterns, 0),
    avg_conf,
    avg_agree,
    cal_error,
    avg_time,
    avg_tokens,
    avg_cost,
    total_cost
  )
  ON CONFLICT (metric_date)
  DO UPDATE SET
    total_extractions = EXCLUDED.total_extractions,
    successful_extractions = EXCLUDED.successful_extractions,
    partial_extractions = EXCLUDED.partial_extractions,
    failed_extractions = EXCLUDED.failed_extractions,
    high_evidence_interventions = EXCLUDED.high_evidence_interventions,
    community_led_interventions = EXCLUDED.community_led_interventions,
    complete_interventions = EXCLUDED.complete_interventions,
    evidence_field_rate = EXCLUDED.evidence_field_rate,
    authority_field_rate = EXCLUDED.authority_field_rate,
    cost_field_rate = EXCLUDED.cost_field_rate,
    outcomes_field_rate = EXCLUDED.outcomes_field_rate,
    new_patterns_discovered = EXCLUDED.new_patterns_discovered,
    total_active_patterns = EXCLUDED.total_active_patterns,
    avg_extraction_confidence = EXCLUDED.avg_extraction_confidence,
    avg_human_agreement_rate = EXCLUDED.avg_human_agreement_rate,
    confidence_calibration_error = EXCLUDED.confidence_calibration_error,
    avg_extraction_time_ms = EXCLUDED.avg_extraction_time_ms,
    avg_tokens_per_extraction = EXCLUDED.avg_tokens_per_extraction,
    avg_cost_per_extraction = EXCLUDED.avg_cost_per_extraction,
    total_cost_usd = EXCLUDED.total_cost_usd;
END;
$$ LANGUAGE plpgsql;

-- View: Recent extraction performance
CREATE OR REPLACE VIEW alma_recent_extraction_performance AS
SELECT
  document_type,
  document_structure,
  extraction_strategy,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE extraction_success = TRUE) as successful,
  AVG(extraction_confidence) as avg_confidence,
  AVG(interventions_extracted) as avg_interventions,
  AVG(extraction_time_ms) as avg_time_ms,
  AVG(llm_tokens_used) as avg_tokens,
  SUM(cost_usd) as total_cost
FROM alma_extraction_history
WHERE extraction_timestamp > NOW() - INTERVAL '30 days'
GROUP BY document_type, document_structure, extraction_strategy
ORDER BY total_attempts DESC;

-- View: Patterns by effectiveness
CREATE OR REPLACE VIEW alma_patterns_by_effectiveness AS
SELECT
  pattern_type,
  pattern_name,
  pattern_strength,
  observations_count,
  success_rate,
  pattern_active,
  last_observed,
  DATE_PART('day', NOW() - last_observed) as days_since_observed
FROM alma_learning_patterns
WHERE pattern_active = TRUE
ORDER BY pattern_strength DESC, observations_count DESC;

-- View: Interventions needing review
CREATE OR REPLACE VIEW alma_interventions_needing_review AS
SELECT
  i.id,
  i.name,
  i.type,
  i.evidence_level,
  i.cultural_authority,
  i.target_cohort,
  i.geography,
  i.created_at,
  eh.extraction_confidence,
  eh.human_review_required,
  ARRAY_AGG(
    CASE
      WHEN i.evidence_level IS NULL OR i.evidence_level = 'Unknown' THEN 'missing_evidence'
      WHEN i.cultural_authority IS NULL THEN 'missing_authority'
      WHEN i.target_cohort IS NULL THEN 'missing_cohort'
      WHEN i.geography IS NULL THEN 'missing_geography'
      WHEN i.type = 'Other' THEN 'uncategorized_type'
      WHEN eh.extraction_confidence < 0.6 THEN 'low_confidence'
    END
  ) FILTER (WHERE eh.extraction_confidence IS NOT NULL) as review_reasons,
  COUNT(*) FILTER (WHERE hf.id IS NOT NULL) as feedback_count
FROM alma_interventions i
LEFT JOIN alma_extraction_history eh ON
  i.source_documents @> jsonb_build_array(jsonb_build_object('url', (
    SELECT source_url FROM alma_source_documents WHERE id = eh.source_document_id LIMIT 1
  )))
LEFT JOIN alma_human_feedback hf ON i.id = hf.intervention_id
WHERE
  i.evidence_level IS NULL OR i.evidence_level = 'Unknown' OR
  i.cultural_authority IS NULL OR
  i.target_cohort IS NULL OR
  i.geography IS NULL OR
  i.type = 'Other' OR
  eh.extraction_confidence < 0.6 OR
  eh.human_review_required = TRUE
GROUP BY i.id, i.name, i.type, i.evidence_level, i.cultural_authority,
         i.target_cohort, i.geography, i.created_at, eh.extraction_confidence,
         eh.human_review_required
ORDER BY
  CASE WHEN eh.human_review_required THEN 0 ELSE 1 END,
  COALESCE(eh.extraction_confidence, 0.5) ASC,
  i.created_at DESC;

-- Permissions
GRANT SELECT ON alma_extraction_history TO authenticated, anon;
GRANT INSERT, UPDATE ON alma_extraction_history TO authenticated;

GRANT SELECT ON alma_learning_patterns TO authenticated, anon;
GRANT INSERT, UPDATE ON alma_learning_patterns TO authenticated;

GRANT SELECT ON alma_quality_metrics TO authenticated, anon;
GRANT INSERT, UPDATE ON alma_quality_metrics TO authenticated;

GRANT SELECT, INSERT ON alma_human_feedback TO authenticated;

GRANT SELECT ON alma_extraction_strategies TO authenticated, anon;
GRANT INSERT, UPDATE ON alma_extraction_strategies TO authenticated;

GRANT SELECT ON alma_recent_extraction_performance TO authenticated, anon;
GRANT SELECT ON alma_patterns_by_effectiveness TO authenticated, anon;
GRANT SELECT ON alma_interventions_needing_review TO authenticated, anon;

GRANT EXECUTE ON FUNCTION calculate_daily_quality_metrics(DATE) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE alma_extraction_history IS 'Tracks every extraction attempt for continuous learning';
COMMENT ON TABLE alma_learning_patterns IS 'Learned patterns that improve extraction quality over time';
COMMENT ON TABLE alma_quality_metrics IS 'Daily aggregated metrics for monitoring learning progress';
COMMENT ON TABLE alma_human_feedback IS 'Human corrections and validations for training the system';
COMMENT ON TABLE alma_extraction_strategies IS 'Different extraction approaches optimized for different document types';

COMMENT ON FUNCTION calculate_daily_quality_metrics IS 'Calculates and stores daily quality metrics. Run daily via cron.';

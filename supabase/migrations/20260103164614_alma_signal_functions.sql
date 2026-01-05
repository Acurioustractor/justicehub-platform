-- ALMA Signal Functions - Portfolio Intelligence
-- Based on ACT Personal AI 5-Signal Framework

-- 1. Evidence Strength Signal (25% weight)
CREATE OR REPLACE FUNCTION calculate_evidence_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.0;
BEGIN
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

  RETURN COALESCE(signal, 0.3);
END;
$$ LANGUAGE plpgsql;

-- 2. Community Authority Signal (30% weight - HIGHEST)
CREATE OR REPLACE FUNCTION calculate_community_authority_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.0;
  cultural_auth TEXT;
BEGIN
  SELECT cultural_authority INTO cultural_auth
  FROM alma_interventions
  WHERE id = intervention_id;

  IF cultural_auth IS NULL THEN
    RETURN 0.0;
  END IF;

  -- Aboriginal Community Controlled Organization = 1.0
  IF cultural_auth ILIKE '%Aboriginal Community Controlled%' OR
     cultural_auth ILIKE '%community-controlled%' THEN
    signal := 1.0;
  -- Indigenous-led with community partnership = 0.9
  ELSIF cultural_auth ILIKE '%Indigenous-led%' OR
        cultural_auth ILIKE '%Aboriginal-led%' THEN
    signal := 0.9;
  -- Co-designed with Aboriginal community = 0.7
  ELSIF cultural_auth ILIKE '%co-design%' OR
        cultural_auth ILIKE '%partnership%' THEN
    signal := 0.7;
  -- Culturally adapted mainstream = 0.5
  ELSIF cultural_auth ILIKE '%culturally adapted%' OR
        cultural_auth ILIKE '%Culturally Responsive%' THEN
    signal := 0.5;
  -- Consultation only = 0.3
  ELSIF cultural_auth ILIKE '%consultation%' THEN
    signal := 0.3;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;

-- 3. Harm Risk Signal (20% weight - INVERTED)
CREATE OR REPLACE FUNCTION calculate_harm_risk_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 1.0; -- Start high (low risk)
  risk_level TEXT;
  risks TEXT;
  int_type TEXT;
BEGIN
  SELECT harm_risk_level, risks, type INTO risk_level, risks, int_type
  FROM alma_interventions
  WHERE id = intervention_id;

  -- High harm risk = 0.0 (detention, incarceration)
  IF risk_level = 'High' OR 
     risks ILIKE '%detention%' OR 
     risks ILIKE '%incarceration%' OR
     int_type = 'Detention' THEN
    signal := 0.0;
  -- Medium harm risk = 0.5 (intensive supervision, tracking)
  ELSIF risk_level = 'Medium' OR 
        risks ILIKE '%surveillance%' OR
        risks ILIKE '%monitoring%' THEN
    signal := 0.5;
  -- Low harm risk = 1.0 (community-based, cultural programs)
  ELSIF risk_level = 'Low' OR
        int_type IN ('Community-Led', 'Cultural Connection', 'Diversion', 'Early Intervention') THEN
    signal := 1.0;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;

-- 4. Implementation Capability Signal (15% weight)
CREATE OR REPLACE FUNCTION calculate_implementation_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.5;
  impl_data JSONB;
  created DATE;
BEGIN
  SELECT metadata -> 'implementation', created_at::date INTO impl_data, created
  FROM alma_interventions
  WHERE id = intervention_id;

  IF impl_data IS NULL THEN
    -- If no implementation data, check if recent (within 2 years = likely active)
    IF created > CURRENT_DATE - INTERVAL '2 years' THEN
      signal := 0.7;
    END IF;
    RETURN signal;
  END IF;

  -- Currently running with stable funding = 1.0
  IF impl_data->>'status' = 'running' AND impl_data->>'funding' = 'stable' THEN
    signal := 1.0;
  -- Pilot with promising results = 0.7
  ELSIF impl_data->>'status' = 'pilot' THEN
    signal := 0.7;
  -- Design stage with community buy-in = 0.5
  ELSIF impl_data->>'status' = 'design' THEN
    signal := 0.5;
  -- Concept only = 0.3
  ELSIF impl_data->>'status' = 'concept' THEN
    signal := 0.3;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;

-- 5. Option Value Signal (10% weight - Learning Potential)
CREATE OR REPLACE FUNCTION calculate_option_value_signal(intervention_id UUID)
RETURNS FLOAT AS $$
DECLARE
  signal FLOAT := 0.5;
  metadata JSONB;
BEGIN
  SELECT metadata INTO metadata
  FROM alma_interventions
  WHERE id = intervention_id;

  IF metadata IS NULL THEN
    RETURN 0.5;
  END IF;

  -- High learning potential (innovative approach, fills gap) = 1.0
  IF metadata->>'innovation_level' = 'high' OR
     metadata->>'fills_critical_gap' = 'true' THEN
    signal := 1.0;
  -- Medium (builds on known approaches) = 0.6
  ELSIF metadata->>'innovation_level' = 'medium' THEN
    signal := 0.6;
  -- Low (well-established, little to learn) = 0.3
  ELSIF metadata->>'innovation_level' = 'low' THEN
    signal := 0.3;
  END IF;

  RETURN signal;
END;
$$ LANGUAGE plpgsql;

-- Portfolio Score Calculation (Weighted Composite)
CREATE OR REPLACE FUNCTION calculate_portfolio_score(intervention_id UUID)
RETURNS TABLE(
  intervention_id UUID,
  intervention_name TEXT,
  intervention_type TEXT,
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
    i.id,
    i.name,
    i.type,
    calculate_evidence_signal(i.id) as evidence,
    calculate_community_authority_signal(i.id) as authority,
    calculate_harm_risk_signal(i.id) as harm,
    calculate_implementation_signal(i.id) as impl,
    calculate_option_value_signal(i.id) as option_val,
    -- Weighted composite: Evidence 25%, Authority 30%, Harm 20%, Implementation 15%, Option 10%
    (calculate_evidence_signal(i.id) * 0.25 +
     calculate_community_authority_signal(i.id) * 0.30 +
     calculate_harm_risk_signal(i.id) * 0.20 +
     calculate_implementation_signal(i.id) * 0.15 +
     calculate_option_value_signal(i.id) * 0.10) as composite,
    -- Recommendation based on signals
    CASE
      -- Ready to Scale: High evidence + Community authority + Low harm
      WHEN calculate_evidence_signal(i.id) > 0.7 AND
           calculate_community_authority_signal(i.id) > 0.7 AND
           calculate_harm_risk_signal(i.id) > 0.7 THEN
        '🚀 Ready to Scale - High evidence + Community authority + Low harm'
      -- Indigenous-led but needs evaluation
      WHEN calculate_community_authority_signal(i.id) > 0.8 AND
           calculate_evidence_signal(i.id) < 0.5 THEN
        '⭐ Promising but Unproven - Indigenous-led, needs evaluation support'
      -- High evidence but underfunded or low community authority
      WHEN calculate_evidence_signal(i.id) > 0.7 AND
           calculate_community_authority_signal(i.id) < 0.5 THEN
        '💡 Effective but Mainstream - Proven outcomes, needs community partnership'
      -- High harm risk (detention)
      WHEN calculate_harm_risk_signal(i.id) < 0.3 THEN
        '⚠️  High Harm Risk - Detention/incarceration approach, redirect to community'
      -- Good signals but needs more data
      ELSE
        '📊 Needs More Data - Gather evidence and community authority'
    END as recommendation
  FROM alma_interventions i
  WHERE i.id = intervention_id;
END;
$$ LANGUAGE plpgsql;

-- Materialized View: Top Interventions by Portfolio Score
CREATE MATERIALIZED VIEW alma_portfolio_rankings AS
SELECT
  ps.*,
  i.geography,
  i.target_cohort,
  ARRAY_AGG(DISTINCT sd.source_organization) FILTER (WHERE sd.source_organization IS NOT NULL) as evidence_sources
FROM alma_interventions i
CROSS JOIN LATERAL calculate_portfolio_score(i.id) ps
LEFT JOIN JSONB_ARRAY_ELEMENTS(i.source_documents) sd_json ON true
LEFT JOIN alma_source_documents sd ON sd.source_url = sd_json->>'url'
GROUP BY ps.intervention_id, ps.intervention_name, ps.intervention_type, 
         ps.evidence_strength, ps.community_authority, ps.harm_risk, 
         ps.implementation, ps.option_value, ps.composite_score, ps.recommendation,
         i.geography, i.target_cohort;

-- Index for fast lookups
CREATE INDEX idx_portfolio_composite ON alma_portfolio_rankings(composite_score DESC);
CREATE INDEX idx_portfolio_recommendation ON alma_portfolio_rankings(recommendation);

-- Refresh function (call after inserting new interventions)
CREATE OR REPLACE FUNCTION refresh_portfolio_rankings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW alma_portfolio_rankings;
END;
$$ LANGUAGE plpgsql;

-- Portfolio Analytics Views

-- View 1: Ready to Scale (High Priority for Investment)
CREATE OR REPLACE VIEW alma_ready_to_scale AS
SELECT * FROM alma_portfolio_rankings
WHERE recommendation LIKE '%Ready to Scale%'
ORDER BY composite_score DESC;

-- View 2: Indigenous-Led Programs Needing Evaluation
CREATE OR REPLACE VIEW alma_indigenous_led_promising AS
SELECT * FROM alma_portfolio_rankings
WHERE recommendation LIKE '%Promising but Unproven%'
ORDER BY community_authority DESC, composite_score DESC;

-- View 3: Effective Programs Needing Community Partnership
CREATE OR REPLACE VIEW alma_effective_mainstream AS
SELECT * FROM alma_portfolio_rankings
WHERE recommendation LIKE '%Effective but Mainstream%'
ORDER BY evidence_strength DESC;

-- View 4: High Harm Programs to Redirect From
CREATE OR REPLACE VIEW alma_high_harm_risk AS
SELECT * FROM alma_portfolio_rankings
WHERE recommendation LIKE '%High Harm Risk%'
ORDER BY harm_risk ASC;

-- Grant "EXECUTE" permissions
GRANT EXECUTE ON FUNCTION calculate_evidence_signal(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_community_authority_signal(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_harm_risk_signal(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_implementation_signal(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_option_value_signal(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_portfolio_score(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_portfolio_rankings() TO authenticated;

-- Grant SELECT on views
GRANT SELECT ON alma_portfolio_rankings TO authenticated, anon;
GRANT SELECT ON alma_ready_to_scale TO authenticated, anon;
GRANT SELECT ON alma_indigenous_led_promising TO authenticated, anon;
GRANT SELECT ON alma_effective_mainstream TO authenticated, anon;
GRANT SELECT ON alma_high_harm_risk TO authenticated, anon;


-- Fix ambiguous column reference in calculate_portfolio_signals function
-- The function parameter conflicts with the column name in the JOIN

-- Drop existing function first
DROP FUNCTION IF EXISTS calculate_portfolio_signals(UUID);

-- Recreate with non-conflicting parameter name
CREATE OR REPLACE FUNCTION calculate_portfolio_signals(p_intervention_id UUID)
RETURNS TABLE (
  evidence_strength DECIMAL(5, 4),
  community_authority DECIMAL(5, 4),
  harm_risk DECIMAL(5, 4),
  implementation_capability DECIMAL(5, 4),
  option_value DECIMAL(5, 4),
  portfolio_score DECIMAL(5, 4)
) AS $$
DECLARE
  v_evidence_level TEXT;
  v_consent_level TEXT;
  v_cultural_authority TEXT;
  v_harm_risk_level TEXT;
  v_replication_readiness TEXT;
  v_years_operating INTEGER;
  v_evidence_count INTEGER;

  sig_evidence DECIMAL(5, 4) := 0.0;
  sig_authority DECIMAL(5, 4) := 0.0;
  sig_harm DECIMAL(5, 4) := 0.0;
  sig_capability DECIMAL(5, 4) := 0.0;
  sig_option DECIMAL(5, 4) := 0.0;
  total_score DECIMAL(5, 4);
BEGIN
  -- Get intervention data (FIXED: use p_intervention_id to avoid ambiguity)
  SELECT
    i.evidence_level,
    i.consent_level,
    i.cultural_authority,
    i.harm_risk_level,
    i.replication_readiness,
    i.years_operating,
    COUNT(ie.evidence_id)
  INTO
    v_evidence_level,
    v_consent_level,
    v_cultural_authority,
    v_harm_risk_level,
    v_replication_readiness,
    v_years_operating,
    v_evidence_count
  FROM alma_interventions i
  LEFT JOIN alma_intervention_evidence ie ON i.id = ie.intervention_id
  WHERE i.id = p_intervention_id
  GROUP BY i.id, i.evidence_level, i.consent_level, i.cultural_authority, i.harm_risk_level, i.replication_readiness, i.years_operating;

  -- Calculate evidence strength signal (0-1)
  sig_evidence := CASE v_evidence_level
    WHEN 'Proven (RCT/quasi-experimental, replicated)' THEN 1.0
    WHEN 'Effective (strong evaluation, positive outcomes)' THEN 0.8
    WHEN 'Indigenous-led (culturally grounded, community authority)' THEN 0.7
    WHEN 'Promising (community-endorsed, emerging evidence)' THEN 0.5
    WHEN 'Untested (theory/pilot stage)' THEN 0.2
    ELSE 0.3
  END;

  -- Boost by number of evidence records
  sig_evidence := LEAST(1.0, sig_evidence + (v_evidence_count * 0.05));

  -- Calculate community authority signal (0-1)
  -- Higher for Indigenous-led, community-controlled, culturally grounded
  sig_authority := CASE
    WHEN v_evidence_level = 'Indigenous-led (culturally grounded, community authority)' THEN 1.0
    WHEN v_consent_level = 'Community Controlled' AND v_cultural_authority IS NOT NULL THEN 0.8
    WHEN v_cultural_authority IS NOT NULL THEN 0.6
    ELSE 0.3
  END;

  -- Calculate harm risk signal (0-1, inverse - high risk = lower score)
  sig_harm := CASE v_harm_risk_level
    WHEN 'Low' THEN 1.0
    WHEN 'Medium' THEN 0.6
    WHEN 'High' THEN 0.2
    WHEN 'Requires cultural review' THEN 0.5
    ELSE 0.7
  END;

  -- Calculate implementation capability signal (0-1)
  sig_capability := CASE v_replication_readiness
    WHEN 'Ready (playbook available)' THEN 1.0
    WHEN 'Ready with support (requires adaptation guidance)' THEN 0.7
    WHEN 'Community authority required' THEN 0.6
    WHEN 'Not ready (needs more development)' THEN 0.3
    ELSE 0.5
  END;

  -- Boost by years operating
  IF v_years_operating IS NOT NULL AND v_years_operating > 0 THEN
    sig_capability := LEAST(1.0, sig_capability + (v_years_operating * 0.02));
  END IF;

  -- Calculate option value signal (0-1)
  -- Higher for promising but unproven (learning potential)
  sig_option := CASE v_evidence_level
    WHEN 'Untested (theory/pilot stage)' THEN 0.8
    WHEN 'Promising (community-endorsed, emerging evidence)' THEN 1.0
    WHEN 'Effective (strong evaluation, positive outcomes)' THEN 0.4
    WHEN 'Proven (RCT/quasi-experimental, replicated)' THEN 0.2
    ELSE 0.5
  END;

  -- Calculate weighted portfolio score
  -- Weights from ALMA Charter (prioritizes community authority)
  total_score := (
    (sig_evidence * 0.25) +       -- 25% Evidence Strength
    (sig_authority * 0.30) +      -- 30% Community Authority (highest weight)
    (sig_harm * 0.20) +           -- 20% Harm Risk
    (sig_capability * 0.15) +     -- 15% Implementation Capability
    (sig_option * 0.10)           -- 10% Option Value
  );

  -- Return signals
  RETURN QUERY SELECT sig_evidence, sig_authority, sig_harm, sig_capability, sig_option, total_score;
END;
$$ LANGUAGE plpgsql;

-- ALMA (Adaptive Learning & Measurement Architecture) - Core Entities
-- Youth Justice Intelligence System with Community Governance
--
-- This migration creates the foundation for ALMA's 4 core entities:
-- 1. Interventions - Programs and practices addressing youth justice
-- 2. Community Contexts - Place-based and cultural contexts
-- 3. Evidence - Research, evaluations, and outcome data
-- 4. Outcomes - Intended and measured results
--
-- ALMA embeds governance as database constraints, not policies.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================
-- ALMA INTERVENTIONS
-- =====================================
CREATE TABLE alma_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic Information
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'Prevention',
    'Early Intervention',
    'Diversion',
    'Therapeutic',
    'Wraparound Support',
    'Family Strengthening',
    'Cultural Connection',
    'Education/Employment',
    'Justice Reinvestment',
    'Community-Led'
  )),
  description TEXT NOT NULL,

  -- Target Population
  target_cohort TEXT[] DEFAULT '{}', -- e.g., ['10-14 years', 'First Nations', 'Care-experienced']
  geography TEXT[] DEFAULT '{}', -- e.g., ['VIC', 'Regional', 'Remote']

  -- Evidence & Authority
  evidence_level TEXT CHECK (evidence_level IN (
    'Promising (community-endorsed, emerging evidence)',
    'Effective (strong evaluation, positive outcomes)',
    'Proven (RCT/quasi-experimental, replicated)',
    'Indigenous-led (culturally grounded, community authority)',
    'Untested (theory/pilot stage)'
  )),

  -- Governance Fields (CRITICAL - enforced as constraints)
  cultural_authority TEXT, -- Who holds authority (Elder council, community org, etc.)
  consent_level TEXT NOT NULL DEFAULT 'Strictly Private' CHECK (consent_level IN (
    'Public Knowledge Commons',
    'Community Controlled',
    'Strictly Private'
  )),
  permitted_uses TEXT[] DEFAULT ARRAY['Query (internal)']::TEXT[], -- What actions are allowed
  contributors TEXT[] DEFAULT '{}', -- Organizations/individuals who contributed
  source_documents JSONB DEFAULT '[]', -- References to original documents

  -- Risk Assessment
  risks TEXT, -- Potential harms, unintended consequences
  harm_risk_level TEXT CHECK (harm_risk_level IN ('Low', 'Medium', 'High', 'Requires cultural review')),

  -- Implementation Details
  implementation_cost TEXT CHECK (implementation_cost IN ('Low (<$50k/year)', 'Medium ($50k-$250k)', 'High (>$250k)', 'Unknown')),
  cost_per_young_person DECIMAL(10, 2), -- Estimated annual cost per participant
  scalability TEXT CHECK (scalability IN ('Local only', 'Regional', 'State-wide', 'National', 'Context-dependent')),
  replication_readiness TEXT CHECK (replication_readiness IN (
    'Not ready (needs more development)',
    'Ready with support (requires adaptation guidance)',
    'Ready (playbook available)',
    'Community authority required'
  )),

  -- Operating Organization
  operating_organization TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  years_operating INTEGER,
  current_funding TEXT CHECK (current_funding IN ('Unfunded', 'Pilot/seed', 'Established', 'Oversubscribed', 'At-risk')),

  -- Portfolio Analytics (calculated fields)
  portfolio_score DECIMAL(5, 4), -- Weighted combination of signals (0-1)
  evidence_strength_signal DECIMAL(5, 4),
  community_authority_signal DECIMAL(5, 4),
  harm_risk_signal DECIMAL(5, 4),
  implementation_capability_signal DECIMAL(5, 4),
  option_value_signal DECIMAL(5, 4),

  -- Workflow & Review
  review_status TEXT NOT NULL DEFAULT 'Draft' CHECK (review_status IN ('Draft', 'Community Review', 'Approved', 'Published', 'Archived')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  -- Link to existing JusticeHub data (HYBRID APPROACH)
  linked_service_id UUID REFERENCES services(id), -- Optional link to services table
  linked_community_program_id UUID REFERENCES community_programs(id), -- Optional link to community programs

  -- Search
  search_vector TSVECTOR,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- GOVERNANCE CONSTRAINT: Community Controlled or Strictly Private interventions MUST have cultural authority
ALTER TABLE alma_interventions ADD CONSTRAINT check_cultural_authority_required
  CHECK (
    consent_level = 'Public Knowledge Commons'
    OR cultural_authority IS NOT NULL
  );

-- =====================================
-- ALMA COMMUNITY CONTEXTS
-- =====================================
CREATE TABLE alma_community_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic Information
  name TEXT NOT NULL, -- e.g., "Wiradjuri Nation - Regional NSW"
  context_type TEXT NOT NULL CHECK (context_type IN (
    'First Nations community',
    'Remote community',
    'Regional area',
    'Metro suburb',
    'Cultural community',
    'Care system',
    'Education setting'
  )),

  -- Location (respectful of privacy)
  location TEXT,
  state TEXT CHECK (state IN ('VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  population_size TEXT CHECK (population_size IN ('<1,000', '1,000-10,000', '10,000-50,000', '50,000+', 'Unknown')),

  -- Context Description
  demographics TEXT, -- Relevant demographic context (culturally safe)
  system_factors TEXT, -- Systemic context (over-policing, service gaps, historical trauma)
  protective_factors TEXT, -- Community strengths, assets, protective factors

  -- Governance (ALWAYS REQUIRED)
  cultural_authority TEXT NOT NULL, -- Who has authority to speak about this context
  consent_level TEXT NOT NULL DEFAULT 'Strictly Private' CHECK (consent_level IN (
    'Public Knowledge Commons',
    'Community Controlled',
    'Strictly Private'
  )),
  contributors TEXT[] DEFAULT '{}',

  -- Search
  search_vector TSVECTOR,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- ALMA EVIDENCE
-- =====================================
CREATE TABLE alma_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic Information
  title TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'RCT (Randomized Control Trial)',
    'Quasi-experimental',
    'Program evaluation',
    'Longitudinal study',
    'Case study',
    'Community-led research',
    'Lived experience',
    'Cultural knowledge',
    'Policy analysis'
  )),

  -- Study Details
  methodology TEXT,
  sample_size INTEGER,
  timeframe TEXT, -- Study period or observation window
  findings TEXT NOT NULL,
  effect_size TEXT CHECK (effect_size IN ('Large positive', 'Moderate positive', 'Small positive', 'Null', 'Mixed', 'Not measured')),
  limitations TEXT,

  -- Cultural Safety
  cultural_safety TEXT CHECK (cultural_safety IN (
    'Culturally grounded (led by community)',
    'Culturally adapted (with community input)',
    'Culturally neutral',
    'Cultural safety concerns',
    'Unknown'
  )),

  -- Source Information
  author TEXT,
  organization TEXT,
  publication_date DATE,
  doi TEXT,
  source_url TEXT,
  source_document_url TEXT,

  -- Governance
  consent_level TEXT NOT NULL DEFAULT 'Strictly Private' CHECK (consent_level IN (
    'Public Knowledge Commons',
    'Community Controlled',
    'Strictly Private'
  )),
  contributors TEXT[] DEFAULT '{}',

  -- Search
  search_vector TSVECTOR,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- ALMA OUTCOMES
-- =====================================
CREATE TABLE alma_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic Information
  name TEXT NOT NULL,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN (
    'Reduced detention/incarceration',
    'Reduced recidivism',
    'Diversion from justice system',
    'Educational engagement',
    'Employment/training',
    'Family connection',
    'Cultural connection',
    'Mental health/wellbeing',
    'Reduced substance use',
    'Community safety',
    'System cost reduction',
    'Healing/restoration'
  )),
  description TEXT,

  -- Measurement
  measurement_method TEXT, -- How this outcome is measured
  indicators TEXT, -- Specific quantitative or qualitative indicators
  time_horizon TEXT CHECK (time_horizon IN ('Immediate (<6 months)', 'Short-term (6-12 months)', 'Medium-term (1-3 years)', 'Long-term (3+ years)')),
  beneficiary TEXT CHECK (beneficiary IN ('Young person', 'Family', 'Community', 'System/Government')),

  -- Search
  search_vector TSVECTOR,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- RELATIONSHIP TABLES (Many-to-Many)
-- =====================================

-- Interventions ↔ Outcomes
CREATE TABLE alma_intervention_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES alma_outcomes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intervention_id, outcome_id)
);

-- Interventions ↔ Evidence
CREATE TABLE alma_intervention_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES alma_evidence(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intervention_id, evidence_id)
);

-- Interventions ↔ Contexts
CREATE TABLE alma_intervention_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  context_id UUID NOT NULL REFERENCES alma_community_contexts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intervention_id, context_id)
);

-- Evidence ↔ Outcomes
CREATE TABLE alma_evidence_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evidence_id UUID NOT NULL REFERENCES alma_evidence(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES alma_outcomes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evidence_id, outcome_id)
);

-- =====================================
-- GOVERNANCE LEDGER
-- =====================================

-- Consent Ledger - tracks all consent and permissions
CREATE TABLE alma_consent_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Polymorphic reference to any ALMA entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('intervention', 'context', 'evidence', 'outcome')),
  entity_id UUID NOT NULL,

  -- Consent Details
  consent_level TEXT NOT NULL CHECK (consent_level IN ('Public Knowledge Commons', 'Community Controlled', 'Strictly Private')),
  permitted_uses TEXT[] DEFAULT '{}',
  cultural_authority TEXT,

  -- Contributors & Attribution
  contributors JSONB DEFAULT '[]', -- [{name, organization, role, contact}]
  attribution_text TEXT, -- How to attribute when used

  -- Consent Management
  consent_given_by TEXT,
  consent_given_at TIMESTAMPTZ DEFAULT NOW(),
  consent_expires_at TIMESTAMPTZ,
  consent_revoked BOOLEAN DEFAULT false,
  consent_revoked_at TIMESTAMPTZ,
  consent_revoked_by TEXT,

  -- Revenue Sharing
  revenue_share_enabled BOOLEAN DEFAULT false,
  revenue_share_percentage DECIMAL(5, 2), -- e.g., 70.00 for 70%

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Usage Log - tracks all access and usage for attribution
CREATE TABLE alma_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- What was accessed
  entity_type TEXT NOT NULL CHECK (entity_type IN ('intervention', 'context', 'evidence', 'outcome')),
  entity_id UUID NOT NULL,

  -- How it was used
  action TEXT NOT NULL CHECK (action IN ('query', 'view', 'export', 'publish', 'training', 'commercial')),
  user_id UUID REFERENCES users(id),

  -- Context
  query_text TEXT,
  destination TEXT, -- Where it was published/exported to

  -- Revenue tracking
  revenue_generated DECIMAL(10, 2), -- For commercial uses

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Interventions
CREATE INDEX idx_alma_interventions_consent_level ON alma_interventions(consent_level);
CREATE INDEX idx_alma_interventions_review_status ON alma_interventions(review_status);
CREATE INDEX idx_alma_interventions_evidence_level ON alma_interventions(evidence_level);
CREATE INDEX idx_alma_interventions_type ON alma_interventions(type);
CREATE INDEX idx_alma_interventions_search ON alma_interventions USING GIN(search_vector);
CREATE INDEX idx_alma_interventions_geography ON alma_interventions USING GIN(geography);
CREATE INDEX idx_alma_interventions_target_cohort ON alma_interventions USING GIN(target_cohort);

-- Contexts
CREATE INDEX idx_alma_contexts_consent_level ON alma_community_contexts(consent_level);
CREATE INDEX idx_alma_contexts_type ON alma_community_contexts(context_type);
CREATE INDEX idx_alma_contexts_state ON alma_community_contexts(state);
CREATE INDEX idx_alma_contexts_search ON alma_community_contexts USING GIN(search_vector);

-- Evidence
CREATE INDEX idx_alma_evidence_consent_level ON alma_evidence(consent_level);
CREATE INDEX idx_alma_evidence_type ON alma_evidence(evidence_type);
CREATE INDEX idx_alma_evidence_search ON alma_evidence USING GIN(search_vector);
CREATE INDEX idx_alma_evidence_publication_date ON alma_evidence(publication_date);

-- Outcomes
CREATE INDEX idx_alma_outcomes_type ON alma_outcomes(outcome_type);
CREATE INDEX idx_alma_outcomes_search ON alma_outcomes USING GIN(search_vector);

-- Relationship tables
CREATE INDEX idx_alma_intervention_outcomes_intervention ON alma_intervention_outcomes(intervention_id);
CREATE INDEX idx_alma_intervention_outcomes_outcome ON alma_intervention_outcomes(outcome_id);
CREATE INDEX idx_alma_intervention_evidence_intervention ON alma_intervention_evidence(intervention_id);
CREATE INDEX idx_alma_intervention_evidence_evidence ON alma_intervention_evidence(evidence_id);
CREATE INDEX idx_alma_intervention_contexts_intervention ON alma_intervention_contexts(intervention_id);
CREATE INDEX idx_alma_intervention_contexts_context ON alma_intervention_contexts(context_id);
CREATE INDEX idx_alma_evidence_outcomes_evidence ON alma_evidence_outcomes(evidence_id);
CREATE INDEX idx_alma_evidence_outcomes_outcome ON alma_evidence_outcomes(outcome_id);

-- Governance
CREATE INDEX idx_alma_consent_ledger_entity ON alma_consent_ledger(entity_type, entity_id);
CREATE INDEX idx_alma_consent_ledger_level ON alma_consent_ledger(consent_level);
CREATE INDEX idx_alma_usage_log_entity ON alma_usage_log(entity_type, entity_id);
CREATE INDEX idx_alma_usage_log_action ON alma_usage_log(action);
CREATE INDEX idx_alma_usage_log_user ON alma_usage_log(user_id);

-- =====================================
-- HELPER FUNCTIONS
-- =====================================

-- Function to update search vectors for interventions
CREATE OR REPLACE FUNCTION update_alma_interventions_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.operating_organization, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.target_cohort, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.geography, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for contexts
CREATE OR REPLACE FUNCTION update_alma_contexts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.demographics, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.system_factors, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.protective_factors, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for evidence
CREATE OR REPLACE FUNCTION update_alma_evidence_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.findings, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.organization, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for outcomes
CREATE OR REPLACE FUNCTION update_alma_outcomes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.measurement_method, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate portfolio signals for an intervention
CREATE OR REPLACE FUNCTION calculate_portfolio_signals(intervention_id UUID)
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
  -- Get intervention data
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
  WHERE i.id = intervention_id
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

  -- Boost if community-endorsed but under-evidenced
  IF sig_authority > 0.6 AND sig_evidence < 0.5 THEN
    sig_option := LEAST(1.0, sig_option + 0.2);
  END IF;

  -- Calculate weighted portfolio score
  -- Weights: evidence(25%), authority(30%), harm(20%), capability(15%), option(10%)
  total_score := (sig_evidence * 0.25) +
                 (sig_authority * 0.30) +
                 (sig_harm * 0.20) +
                 (sig_capability * 0.15) +
                 (sig_option * 0.10);

  RETURN QUERY SELECT
    sig_evidence,
    sig_authority,
    sig_harm,
    sig_capability,
    sig_option,
    total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to check consent compliance before action
CREATE OR REPLACE FUNCTION check_consent_compliance(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_consent_level TEXT;
  v_permitted_uses TEXT[];
  v_consent_revoked BOOLEAN;
BEGIN
  -- Get consent details
  SELECT
    cl.consent_level,
    cl.permitted_uses,
    cl.consent_revoked
  INTO
    v_consent_level,
    v_permitted_uses,
    v_consent_revoked
  FROM alma_consent_ledger cl
  WHERE cl.entity_type = p_entity_type
    AND cl.entity_id = p_entity_id
  LIMIT 1;

  -- Check if consent exists
  IF v_consent_level IS NULL THEN
    RETURN QUERY SELECT false, 'No consent record found';
    RETURN;
  END IF;

  -- Check if consent revoked
  IF v_consent_revoked THEN
    RETURN QUERY SELECT false, 'Consent has been revoked';
    RETURN;
  END IF;

  -- Check if action is permitted
  IF NOT (p_action = ANY(v_permitted_uses)) THEN
    RETURN QUERY SELECT false, FORMAT('Action "%s" not in permitted uses', p_action);
    RETURN;
  END IF;

  -- Check consent level restrictions
  IF v_consent_level = 'Strictly Private' AND p_action NOT IN ('Query (internal)') THEN
    RETURN QUERY SELECT false, 'Strictly Private entities can only be queried internally';
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, 'Action allowed';
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- TRIGGERS
-- =====================================

-- Trigger to update search vectors
CREATE TRIGGER trigger_update_alma_interventions_search_vector
  BEFORE INSERT OR UPDATE ON alma_interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_interventions_search_vector();

CREATE TRIGGER trigger_update_alma_contexts_search_vector
  BEFORE INSERT OR UPDATE ON alma_community_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_contexts_search_vector();

CREATE TRIGGER trigger_update_alma_evidence_search_vector
  BEFORE INSERT OR UPDATE ON alma_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_evidence_search_vector();

CREATE TRIGGER trigger_update_alma_outcomes_search_vector
  BEFORE INSERT OR UPDATE ON alma_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_outcomes_search_vector();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alma_interventions_updated_at
  BEFORE UPDATE ON alma_interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_updated_at();

CREATE TRIGGER trigger_update_alma_contexts_updated_at
  BEFORE UPDATE ON alma_community_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_updated_at();

CREATE TRIGGER trigger_update_alma_evidence_updated_at
  BEFORE UPDATE ON alma_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_updated_at();

CREATE TRIGGER trigger_update_alma_outcomes_updated_at
  BEFORE UPDATE ON alma_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_updated_at();

-- =====================================
-- COMMENTS (Documentation)
-- =====================================

COMMENT ON TABLE alma_interventions IS 'ALMA interventions - programs and practices addressing youth justice outcomes with community governance';
COMMENT ON COLUMN alma_interventions.consent_level IS 'Governance tier - defaults to Strictly Private, requires explicit escalation';
COMMENT ON COLUMN alma_interventions.cultural_authority IS 'REQUIRED for Community Controlled and Strictly Private - enforced by constraint';
COMMENT ON COLUMN alma_interventions.portfolio_score IS 'Weighted combination of 5 signals: evidence(25%), authority(30%), harm(20%), capability(15%), option(10%)';

COMMENT ON TABLE alma_community_contexts IS 'Place-based and cultural contexts where interventions operate';
COMMENT ON COLUMN alma_community_contexts.cultural_authority IS 'ALWAYS REQUIRED - who has authority to speak about this context';

COMMENT ON TABLE alma_evidence IS 'Research, evaluations, and outcome data supporting interventions';
COMMENT ON COLUMN alma_evidence.cultural_safety IS 'Assessment of cultural grounding and community leadership';

COMMENT ON TABLE alma_outcomes IS 'Intended and measured outcomes for young people and communities';

COMMENT ON TABLE alma_consent_ledger IS 'Governance ledger tracking all consent and permissions - foundation of ALMA ethics';
COMMENT ON TABLE alma_usage_log IS 'Usage tracking for attribution and revenue sharing';

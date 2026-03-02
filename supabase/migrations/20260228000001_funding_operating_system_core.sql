-- Funding Operating System Core
-- Purpose: Shift JusticeHub from passive grant tracking to an agentic funding operating system
-- that discovers money, maps it to community capability, tracks public spend, and reports
-- outcomes back to community first.

-- Dedicated updated_at trigger function for the funding operating system tables
CREATE OR REPLACE FUNCTION set_funding_os_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Canonical funder registry
CREATE TABLE IF NOT EXISTS funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('government', 'philanthropy', 'corporate', 'community')),
  source_subtype TEXT,
  website_url TEXT,
  canonical_url TEXT,
  jurisdictions TEXT[] DEFAULT '{}',
  decision_cycle TEXT,
  reporting_orientation TEXT NOT NULL DEFAULT 'community_first'
    CHECK (reporting_orientation IN ('community_first', 'balanced', 'funder_first')),
  discovery_priority INTEGER NOT NULL DEFAULT 50 CHECK (discovery_priority BETWEEN 0 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canonical funding programs and budget lines
CREATE TABLE IF NOT EXISTS funding_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_source_id UUID NOT NULL REFERENCES funding_sources(id) ON DELETE CASCADE,
  linked_opportunity_id UUID REFERENCES alma_funding_opportunities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  program_kind TEXT NOT NULL
    CHECK (program_kind IN ('budget_line', 'grant_program', 'procurement', 'philanthropic_fund', 'pooled_fund')),
  status TEXT NOT NULL DEFAULT 'pipeline'
    CHECK (status IN ('pipeline', 'open', 'active', 'paused', 'closed', 'archived')),
  source_program_code TEXT,
  description TEXT,
  objective TEXT,
  total_budget_amount NUMERIC,
  committed_amount NUMERIC NOT NULL DEFAULT 0,
  disbursed_amount NUMERIC NOT NULL DEFAULT 0,
  budget_currency TEXT NOT NULL DEFAULT 'AUD',
  budget_start_date DATE,
  budget_end_date DATE,
  decision_window TEXT,
  primary_jurisdictions TEXT[] NOT NULL DEFAULT '{}',
  target_populations TEXT[] NOT NULL DEFAULT '{}',
  focus_areas TEXT[] NOT NULL DEFAULT '{}',
  community_reporting_required BOOLEAN NOT NULL DEFAULT true,
  public_transparency_required BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funding_programs_budget_amounts_check CHECK (
    total_budget_amount IS NULL OR (committed_amount <= total_budget_amount AND disbursed_amount <= total_budget_amount)
  ),
  CONSTRAINT funding_programs_commitment_check CHECK (committed_amount >= disbursed_amount),
  CONSTRAINT funding_programs_date_check CHECK (
    budget_start_date IS NULL OR budget_end_date IS NULL OR budget_start_date <= budget_end_date
  )
);

-- Public money movement and payment events
CREATE TABLE IF NOT EXISTS public_spending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_program_id UUID NOT NULL REFERENCES funding_programs(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES alma_funding_opportunities(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN (
      'appropriation',
      'allocation',
      'contract',
      'grant_payment',
      'milestone_payment',
      'clawback',
      'reconciliation'
    )),
  transaction_status TEXT NOT NULL DEFAULT 'planned'
    CHECK (transaction_status IN ('planned', 'committed', 'disbursed', 'reconciled', 'cancelled')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'AUD',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start DATE,
  period_end DATE,
  jurisdiction TEXT,
  source_reference TEXT,
  description TEXT,
  entered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  community_visible BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT public_spending_transactions_period_check CHECK (
    period_start IS NULL OR period_end IS NULL OR period_start <= period_end
  )
);

-- Actual awards and contracts to community organizations
CREATE TABLE IF NOT EXISTS funding_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_program_id UUID NOT NULL REFERENCES funding_programs(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES alma_funding_opportunities(id) ON DELETE SET NULL,
  application_id UUID REFERENCES alma_funding_applications(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  award_status TEXT NOT NULL DEFAULT 'recommended'
    CHECK (award_status IN ('recommended', 'awarded', 'contracted', 'active', 'completed', 'terminated', 'cancelled')),
  award_type TEXT NOT NULL
    CHECK (award_type IN ('grant', 'service_agreement', 'procurement', 'philanthropic_gift', 'pooled_investment')),
  amount_awarded NUMERIC NOT NULL CHECK (amount_awarded >= 0),
  amount_disbursed NUMERIC NOT NULL DEFAULT 0 CHECK (amount_disbursed >= 0),
  currency TEXT NOT NULL DEFAULT 'AUD',
  awarded_at TIMESTAMPTZ,
  contract_start_at TIMESTAMPTZ,
  contract_end_at TIMESTAMPTZ,
  reporting_cadence TEXT,
  community_governance_required BOOLEAN NOT NULL DEFAULT true,
  community_report_due_at TIMESTAMPTZ,
  outcome_summary TEXT,
  public_summary TEXT,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funding_awards_disbursed_check CHECK (amount_disbursed <= amount_awarded),
  CONSTRAINT funding_awards_contract_dates_check CHECK (
    contract_start_at IS NULL OR contract_end_at IS NULL OR contract_start_at <= contract_end_at
  )
);

-- Live organization capability and readiness profile for funder-side discovery
CREATE TABLE IF NOT EXISTS organization_capability_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  service_geographies TEXT[] NOT NULL DEFAULT '{}',
  priority_populations TEXT[] NOT NULL DEFAULT '{}',
  capability_tags TEXT[] NOT NULL DEFAULT '{}',
  operating_models TEXT[] NOT NULL DEFAULT '{}',
  lived_experience_led BOOLEAN NOT NULL DEFAULT false,
  first_nations_led BOOLEAN NOT NULL DEFAULT false,
  annual_revenue_band TEXT,
  funding_readiness_score NUMERIC NOT NULL DEFAULT 0 CHECK (funding_readiness_score BETWEEN 0 AND 100),
  compliance_readiness_score NUMERIC NOT NULL DEFAULT 0 CHECK (compliance_readiness_score BETWEEN 0 AND 100),
  delivery_confidence_score NUMERIC NOT NULL DEFAULT 0 CHECK (delivery_confidence_score BETWEEN 0 AND 100),
  community_trust_score NUMERIC NOT NULL DEFAULT 0 CHECK (community_trust_score BETWEEN 0 AND 100),
  evidence_maturity_score NUMERIC NOT NULL DEFAULT 0 CHECK (evidence_maturity_score BETWEEN 0 AND 100),
  reporting_to_community_score NUMERIC NOT NULL DEFAULT 0 CHECK (reporting_to_community_score BETWEEN 0 AND 100),
  unrestricted_funding_need NUMERIC,
  dgr_status TEXT,
  abn TEXT,
  can_manage_government_contracts BOOLEAN NOT NULL DEFAULT false,
  can_manage_philanthropic_grants BOOLEAN NOT NULL DEFAULT true,
  last_capability_review_at TIMESTAMPTZ,
  next_capability_review_at TIMESTAMPTZ,
  capability_notes TEXT,
  supporting_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Granular signals and evidence that feed the capability profile
CREATE TABLE IF NOT EXISTS organization_capability_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_profile_id UUID NOT NULL REFERENCES organization_capability_profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL
    CHECK (signal_type IN ('governance', 'finance', 'delivery', 'cultural_authority', 'community_trust', 'evidence', 'compliance', 'reporting')),
  signal_name TEXT NOT NULL,
  signal_score NUMERIC NOT NULL DEFAULT 0 CHECK (signal_score BETWEEN 0 AND 100),
  signal_weight NUMERIC NOT NULL DEFAULT 1 CHECK (signal_weight > 0),
  source_kind TEXT NOT NULL DEFAULT 'internal'
    CHECK (source_kind IN ('community', 'internal', 'government', 'philanthropy', 'independent')),
  evidence_url TEXT,
  evidence_note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Community-defined outcome registry
CREATE TABLE IF NOT EXISTS community_outcome_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  outcome_domain TEXT NOT NULL
    CHECK (outcome_domain IN (
      'youth_justice',
      'housing',
      'education',
      'health',
      'employment',
      'culture',
      'family',
      'community_safety',
      'self_determination',
      'system_accountability'
    )),
  unit TEXT,
  description TEXT,
  baseline_method TEXT,
  community_defined BOOLEAN NOT NULL DEFAULT true,
  first_nations_data_sensitive BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, outcome_domain)
);

-- Outcome commitments tied to an award and an organization
CREATE TABLE IF NOT EXISTS funding_outcome_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_award_id UUID NOT NULL REFERENCES funding_awards(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  outcome_definition_id UUID NOT NULL REFERENCES community_outcome_definitions(id) ON DELETE CASCADE,
  commitment_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (commitment_status IN ('draft', 'active', 'completed', 'paused', 'cancelled')),
  baseline_value NUMERIC,
  target_value NUMERIC,
  current_value NUMERIC,
  target_date DATE,
  measurement_notes TEXT,
  evidence_confidence_score NUMERIC NOT NULL DEFAULT 0 CHECK (evidence_confidence_score BETWEEN 0 AND 100),
  community_priority_weight NUMERIC NOT NULL DEFAULT 50 CHECK (community_priority_weight BETWEEN 0 AND 100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (funding_award_id, outcome_definition_id)
);

-- Rolling outcome updates, submitted by organizations or agents
CREATE TABLE IF NOT EXISTS funding_outcome_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES funding_outcome_commitments(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL
    CHECK (update_type IN ('baseline', 'progress', 'milestone', 'final', 'correction')),
  reported_value NUMERIC,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reporting_period_start DATE,
  reporting_period_end DATE,
  reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  narrative TEXT,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  confidence_score NUMERIC NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funding_outcome_updates_period_check CHECK (
    reporting_period_start IS NULL OR reporting_period_end IS NULL OR reporting_period_start <= reporting_period_end
  )
);

-- Community validation so outcomes report back to community, not only funders
CREATE TABLE IF NOT EXISTS community_outcome_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES funding_outcome_updates(id) ON DELETE CASCADE,
  validator_kind TEXT NOT NULL
    CHECK (validator_kind IN ('community_member', 'community_board', 'elder', 'participant', 'independent_evaluator', 'funder')),
  validator_name TEXT,
  validator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validation_status TEXT NOT NULL
    CHECK (validation_status IN ('confirmed', 'contested', 'mixed', 'needs_follow_up')),
  validation_notes TEXT,
  impact_rating INTEGER CHECK (impact_rating BETWEEN 1 AND 5),
  trust_rating INTEGER CHECK (trust_rating BETWEEN 1 AND 5),
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent workflow telemetry for ingestion, matching, and reporting
CREATE TABLE IF NOT EXISTS funding_agent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL
    CHECK (workflow_type IN (
      'source_ingest',
      'opportunity_enrichment',
      'org_profile_refresh',
      'matching',
      'award_reconciliation',
      'community_report'
    )),
  workflow_status TEXT NOT NULL DEFAULT 'queued'
    CHECK (workflow_status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  scope_kind TEXT NOT NULL DEFAULT 'global'
    CHECK (scope_kind IN ('global', 'source', 'opportunity', 'organization', 'award', 'outcome')),
  scope_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_scanned INTEGER NOT NULL DEFAULT 0,
  records_changed INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  workflow_notes TEXT,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  triggered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funding_agent_workflows_timing_check CHECK (
    completed_at IS NULL OR started_at <= completed_at
  )
);

-- Explainable matches between opportunities and community organizations
CREATE TABLE IF NOT EXISTS funding_match_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES alma_funding_opportunities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  capability_profile_id UUID REFERENCES organization_capability_profiles(id) ON DELETE SET NULL,
  generated_by_workflow_id UUID REFERENCES funding_agent_workflows(id) ON DELETE SET NULL,
  recommendation_status TEXT NOT NULL DEFAULT 'candidate'
    CHECK (recommendation_status IN ('candidate', 'notified', 'engaged', 'declined', 'archived')),
  match_score NUMERIC NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  readiness_score NUMERIC NOT NULL DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  community_alignment_score NUMERIC NOT NULL DEFAULT 0 CHECK (community_alignment_score BETWEEN 0 AND 100),
  outcome_alignment_score NUMERIC NOT NULL DEFAULT 0 CHECK (outcome_alignment_score BETWEEN 0 AND 100),
  geographic_fit_score NUMERIC NOT NULL DEFAULT 0 CHECK (geographic_fit_score BETWEEN 0 AND 100),
  explainability JSONB NOT NULL DEFAULT '{}'::jsonb,
  agent_notes TEXT,
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, organization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_funding_sources_type ON funding_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_funding_sources_active ON funding_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_funding_sources_jurisdictions ON funding_sources USING GIN(jurisdictions);

CREATE INDEX IF NOT EXISTS idx_funding_programs_source ON funding_programs(funding_source_id);
CREATE INDEX IF NOT EXISTS idx_funding_programs_opportunity ON funding_programs(linked_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_funding_programs_status ON funding_programs(status);
CREATE INDEX IF NOT EXISTS idx_funding_programs_kind ON funding_programs(program_kind);
CREATE INDEX IF NOT EXISTS idx_funding_programs_jurisdictions ON funding_programs USING GIN(primary_jurisdictions);
CREATE INDEX IF NOT EXISTS idx_funding_programs_focus ON funding_programs USING GIN(focus_areas);

CREATE INDEX IF NOT EXISTS idx_public_spending_transactions_program ON public_spending_transactions(funding_program_id);
CREATE INDEX IF NOT EXISTS idx_public_spending_transactions_org ON public_spending_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_public_spending_transactions_opportunity ON public_spending_transactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_public_spending_transactions_date ON public_spending_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_public_spending_transactions_status ON public_spending_transactions(transaction_status);

CREATE INDEX IF NOT EXISTS idx_funding_awards_program ON funding_awards(funding_program_id);
CREATE INDEX IF NOT EXISTS idx_funding_awards_org ON funding_awards(organization_id);
CREATE INDEX IF NOT EXISTS idx_funding_awards_opportunity ON funding_awards(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_funding_awards_application ON funding_awards(application_id);
CREATE INDEX IF NOT EXISTS idx_funding_awards_status ON funding_awards(award_status);
CREATE INDEX IF NOT EXISTS idx_funding_awards_due ON funding_awards(community_report_due_at);

CREATE INDEX IF NOT EXISTS idx_org_capability_profiles_org ON organization_capability_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_capability_profiles_geographies ON organization_capability_profiles USING GIN(service_geographies);
CREATE INDEX IF NOT EXISTS idx_org_capability_profiles_tags ON organization_capability_profiles USING GIN(capability_tags);
CREATE INDEX IF NOT EXISTS idx_org_capability_profiles_readiness ON organization_capability_profiles(funding_readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_org_capability_profiles_trust ON organization_capability_profiles(community_trust_score DESC);

CREATE INDEX IF NOT EXISTS idx_org_capability_signals_profile ON organization_capability_signals(capability_profile_id);
CREATE INDEX IF NOT EXISTS idx_org_capability_signals_type ON organization_capability_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_org_capability_signals_recorded ON organization_capability_signals(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_outcome_definitions_domain ON community_outcome_definitions(outcome_domain);
CREATE INDEX IF NOT EXISTS idx_community_outcome_definitions_active ON community_outcome_definitions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_funding_outcome_commitments_award ON funding_outcome_commitments(funding_award_id);
CREATE INDEX IF NOT EXISTS idx_funding_outcome_commitments_org ON funding_outcome_commitments(organization_id);
CREATE INDEX IF NOT EXISTS idx_funding_outcome_commitments_outcome ON funding_outcome_commitments(outcome_definition_id);
CREATE INDEX IF NOT EXISTS idx_funding_outcome_commitments_status ON funding_outcome_commitments(commitment_status);
CREATE INDEX IF NOT EXISTS idx_funding_outcome_commitments_target_date ON funding_outcome_commitments(target_date);

CREATE INDEX IF NOT EXISTS idx_funding_outcome_updates_commitment ON funding_outcome_updates(commitment_id);
CREATE INDEX IF NOT EXISTS idx_funding_outcome_updates_reported_at ON funding_outcome_updates(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_funding_outcome_updates_type ON funding_outcome_updates(update_type);

CREATE INDEX IF NOT EXISTS idx_community_outcome_validations_update ON community_outcome_validations(update_id);
CREATE INDEX IF NOT EXISTS idx_community_outcome_validations_status ON community_outcome_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_community_outcome_validations_validated_at ON community_outcome_validations(validated_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_agent_workflows_type ON funding_agent_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_funding_agent_workflows_status ON funding_agent_workflows(workflow_status);
CREATE INDEX IF NOT EXISTS idx_funding_agent_workflows_scope ON funding_agent_workflows(scope_kind, scope_id);
CREATE INDEX IF NOT EXISTS idx_funding_agent_workflows_started_at ON funding_agent_workflows(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_match_recommendations_opportunity ON funding_match_recommendations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_funding_match_recommendations_org ON funding_match_recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_funding_match_recommendations_profile ON funding_match_recommendations(capability_profile_id);
CREATE INDEX IF NOT EXISTS idx_funding_match_recommendations_status ON funding_match_recommendations(recommendation_status);
CREATE INDEX IF NOT EXISTS idx_funding_match_recommendations_score ON funding_match_recommendations(match_score DESC);

-- Enable RLS
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_spending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_capability_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_capability_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_outcome_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_outcome_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_outcome_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_outcome_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_match_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies: public transparency tables
DROP POLICY IF EXISTS "Public read funding_sources" ON funding_sources;
CREATE POLICY "Public read funding_sources"
  ON funding_sources FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read funding_programs" ON funding_programs;
CREATE POLICY "Public read funding_programs"
  ON funding_programs FOR SELECT
  USING (public_transparency_required = true);

DROP POLICY IF EXISTS "Public read public_spending_transactions" ON public_spending_transactions;
CREATE POLICY "Public read public_spending_transactions"
  ON public_spending_transactions FOR SELECT
  USING (community_visible = true);

DROP POLICY IF EXISTS "Public read funding_awards" ON funding_awards;
CREATE POLICY "Public read funding_awards"
  ON funding_awards FOR SELECT
  USING (community_governance_required = true OR public_summary IS NOT NULL);

DROP POLICY IF EXISTS "Public read community_outcome_definitions" ON community_outcome_definitions;
CREATE POLICY "Public read community_outcome_definitions"
  ON community_outcome_definitions FOR SELECT
  USING (is_active = true);

-- RLS policies: authenticated operational access
DROP POLICY IF EXISTS "Authenticated manage funding_sources" ON funding_sources;
CREATE POLICY "Authenticated manage funding_sources"
  ON funding_sources FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage funding_programs" ON funding_programs;
CREATE POLICY "Authenticated manage funding_programs"
  ON funding_programs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage public_spending_transactions" ON public_spending_transactions;
CREATE POLICY "Authenticated manage public_spending_transactions"
  ON public_spending_transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage funding_awards" ON funding_awards;
CREATE POLICY "Authenticated manage funding_awards"
  ON funding_awards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage organization_capability_profiles" ON organization_capability_profiles;
CREATE POLICY "Authenticated manage organization_capability_profiles"
  ON organization_capability_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage organization_capability_signals" ON organization_capability_signals;
CREATE POLICY "Authenticated manage organization_capability_signals"
  ON organization_capability_signals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage community_outcome_definitions" ON community_outcome_definitions;
CREATE POLICY "Authenticated manage community_outcome_definitions"
  ON community_outcome_definitions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage funding_outcome_commitments" ON funding_outcome_commitments;
CREATE POLICY "Authenticated manage funding_outcome_commitments"
  ON funding_outcome_commitments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage funding_outcome_updates" ON funding_outcome_updates;
CREATE POLICY "Authenticated manage funding_outcome_updates"
  ON funding_outcome_updates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage community_outcome_validations" ON community_outcome_validations;
CREATE POLICY "Authenticated manage community_outcome_validations"
  ON community_outcome_validations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage funding_agent_workflows" ON funding_agent_workflows;
CREATE POLICY "Authenticated manage funding_agent_workflows"
  ON funding_agent_workflows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage funding_match_recommendations" ON funding_match_recommendations;
CREATE POLICY "Authenticated manage funding_match_recommendations"
  ON funding_match_recommendations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies: service role full access for automation
DROP POLICY IF EXISTS "Service role manage funding_sources" ON funding_sources;
CREATE POLICY "Service role manage funding_sources"
  ON funding_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage funding_programs" ON funding_programs;
CREATE POLICY "Service role manage funding_programs"
  ON funding_programs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage public_spending_transactions" ON public_spending_transactions;
CREATE POLICY "Service role manage public_spending_transactions"
  ON public_spending_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage funding_awards" ON funding_awards;
CREATE POLICY "Service role manage funding_awards"
  ON funding_awards FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage organization_capability_profiles" ON organization_capability_profiles;
CREATE POLICY "Service role manage organization_capability_profiles"
  ON organization_capability_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage organization_capability_signals" ON organization_capability_signals;
CREATE POLICY "Service role manage organization_capability_signals"
  ON organization_capability_signals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage community_outcome_definitions" ON community_outcome_definitions;
CREATE POLICY "Service role manage community_outcome_definitions"
  ON community_outcome_definitions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage funding_outcome_commitments" ON funding_outcome_commitments;
CREATE POLICY "Service role manage funding_outcome_commitments"
  ON funding_outcome_commitments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage funding_outcome_updates" ON funding_outcome_updates;
CREATE POLICY "Service role manage funding_outcome_updates"
  ON funding_outcome_updates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage community_outcome_validations" ON community_outcome_validations;
CREATE POLICY "Service role manage community_outcome_validations"
  ON community_outcome_validations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage funding_agent_workflows" ON funding_agent_workflows;
CREATE POLICY "Service role manage funding_agent_workflows"
  ON funding_agent_workflows FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage funding_match_recommendations" ON funding_match_recommendations;
CREATE POLICY "Service role manage funding_match_recommendations"
  ON funding_match_recommendations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at triggers
DROP TRIGGER IF EXISTS trigger_funding_sources_updated_at ON funding_sources;
CREATE TRIGGER trigger_funding_sources_updated_at
  BEFORE UPDATE ON funding_sources
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_funding_programs_updated_at ON funding_programs;
CREATE TRIGGER trigger_funding_programs_updated_at
  BEFORE UPDATE ON funding_programs
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_public_spending_transactions_updated_at ON public_spending_transactions;
CREATE TRIGGER trigger_public_spending_transactions_updated_at
  BEFORE UPDATE ON public_spending_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_funding_awards_updated_at ON funding_awards;
CREATE TRIGGER trigger_funding_awards_updated_at
  BEFORE UPDATE ON funding_awards
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_org_capability_profiles_updated_at ON organization_capability_profiles;
CREATE TRIGGER trigger_org_capability_profiles_updated_at
  BEFORE UPDATE ON organization_capability_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_org_capability_signals_updated_at ON organization_capability_signals;
CREATE TRIGGER trigger_org_capability_signals_updated_at
  BEFORE UPDATE ON organization_capability_signals
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_community_outcome_definitions_updated_at ON community_outcome_definitions;
CREATE TRIGGER trigger_community_outcome_definitions_updated_at
  BEFORE UPDATE ON community_outcome_definitions
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_funding_outcome_commitments_updated_at ON funding_outcome_commitments;
CREATE TRIGGER trigger_funding_outcome_commitments_updated_at
  BEFORE UPDATE ON funding_outcome_commitments
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_funding_outcome_updates_updated_at ON funding_outcome_updates;
CREATE TRIGGER trigger_funding_outcome_updates_updated_at
  BEFORE UPDATE ON funding_outcome_updates
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_community_outcome_validations_updated_at ON community_outcome_validations;
CREATE TRIGGER trigger_community_outcome_validations_updated_at
  BEFORE UPDATE ON community_outcome_validations
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_funding_agent_workflows_updated_at ON funding_agent_workflows;
CREATE TRIGGER trigger_funding_agent_workflows_updated_at
  BEFORE UPDATE ON funding_agent_workflows
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

DROP TRIGGER IF EXISTS trigger_funding_match_recommendations_updated_at ON funding_match_recommendations;
CREATE TRIGGER trigger_funding_match_recommendations_updated_at
  BEFORE UPDATE ON funding_match_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION set_funding_os_updated_at();

-- Explainable match score between a live opportunity and a community organization
CREATE OR REPLACE FUNCTION calculate_funding_match_score(
  p_opportunity_id UUID,
  p_organization_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  opp RECORD;
  cap RECORD;
  focus_overlap INTEGER := 0;
  geo_overlap INTEGER := 0;
  score NUMERIC := 0;
BEGIN
  SELECT *
  INTO opp
  FROM alma_funding_opportunities
  WHERE id = p_opportunity_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT *
  INTO cap
  FROM organization_capability_profiles
  WHERE organization_id = p_organization_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
  INTO focus_overlap
  FROM (
    SELECT DISTINCT unnest(COALESCE(opp.focus_areas, ARRAY[]::TEXT[]))
    INTERSECT
    SELECT DISTINCT unnest(COALESCE(cap.capability_tags, ARRAY[]::TEXT[]))
  ) q;

  SELECT COUNT(*)
  INTO geo_overlap
  FROM (
    SELECT DISTINCT unnest(COALESCE(opp.jurisdictions, ARRAY[]::TEXT[]))
    INTERSECT
    SELECT DISTINCT unnest(COALESCE(cap.service_geographies, ARRAY[]::TEXT[]))
  ) q;

  score := score
    + LEAST(35, focus_overlap * 10)
    + LEAST(15, geo_overlap * 8)
    + (cap.funding_readiness_score * 0.20)
    + (cap.delivery_confidence_score * 0.15)
    + (cap.community_trust_score * 0.10)
    + (cap.reporting_to_community_score * 0.05);

  IF opp.source_type = 'government' AND cap.can_manage_government_contracts THEN
    score := score + 5;
  END IF;

  IF opp.source_type = 'philanthropy' AND cap.can_manage_philanthropic_grants THEN
    score := score + 5;
  END IF;

  IF opp.requires_deductible_gift_recipient
     AND LOWER(COALESCE(cap.dgr_status, '')) IN ('endorsed', 'registered', 'item1', 'item2') THEN
    score := score + 5;
  END IF;

  IF opp.requires_abn AND COALESCE(cap.abn, '') <> '' THEN
    score := score + 5;
  END IF;

  RETURN GREATEST(0, LEAST(100, ROUND(score, 2)));
END;
$$ LANGUAGE plpgsql STABLE;

-- Operational view: public money to community plus validation status
CREATE OR REPLACE VIEW v_funding_award_community_accountability AS
SELECT
  fa.id AS funding_award_id,
  fs.name AS funding_source_name,
  fp.name AS funding_program_name,
  o.name AS organization_name,
  fa.award_status,
  fa.amount_awarded,
  fa.amount_disbursed,
  COALESCE((
    SELECT SUM(pst.amount)
    FROM public_spending_transactions pst
    WHERE pst.funding_program_id = fa.funding_program_id
      AND (pst.organization_id = fa.organization_id OR pst.organization_id IS NULL)
      AND pst.transaction_status IN ('committed', 'disbursed', 'reconciled')
  ), 0) AS tracked_public_spend,
  COUNT(DISTINCT foc.id) AS outcome_commitment_count,
  COUNT(DISTINCT fou.id) AS outcome_update_count,
  COUNT(DISTINCT cov.id) AS community_validation_count,
  AVG(cov.trust_rating)::NUMERIC(5,2) AS avg_community_trust_rating,
  AVG(cov.impact_rating)::NUMERIC(5,2) AS avg_community_impact_rating,
  fa.community_report_due_at,
  fa.updated_at
FROM funding_awards fa
JOIN funding_programs fp ON fp.id = fa.funding_program_id
JOIN funding_sources fs ON fs.id = fp.funding_source_id
JOIN organizations o ON o.id = fa.organization_id
LEFT JOIN funding_outcome_commitments foc ON foc.funding_award_id = fa.id
LEFT JOIN funding_outcome_updates fou ON fou.commitment_id = foc.id
LEFT JOIN community_outcome_validations cov ON cov.update_id = fou.id
GROUP BY
  fa.id,
  fs.name,
  fp.name,
  o.name,
  fa.award_status,
  fa.amount_awarded,
  fa.amount_disbursed,
  fa.community_report_due_at,
  fa.updated_at;

-- Operational view: where agents should focus next
CREATE OR REPLACE VIEW v_agentic_funding_queue AS
SELECT
  afo.id AS opportunity_id,
  afo.name AS opportunity_name,
  afo.funder_name,
  afo.source_type,
  afo.deadline,
  afo.status,
  afo.relevance_score,
  COUNT(fmr.id) FILTER (WHERE fmr.match_score >= 70) AS strong_match_count,
  MAX(fmr.match_score) AS best_match_score,
  COUNT(faw.id) AS linked_award_count
FROM alma_funding_opportunities afo
LEFT JOIN funding_match_recommendations fmr ON fmr.opportunity_id = afo.id
LEFT JOIN funding_awards faw ON faw.opportunity_id = afo.id
WHERE afo.status IN ('open', 'closing_soon', 'upcoming')
GROUP BY
  afo.id,
  afo.name,
  afo.funder_name,
  afo.source_type,
  afo.deadline,
  afo.status,
  afo.relevance_score;

GRANT SELECT ON funding_sources, funding_programs, public_spending_transactions, funding_awards, community_outcome_definitions
  TO anon, authenticated, service_role;

GRANT ALL ON funding_sources, funding_programs, public_spending_transactions, funding_awards,
  organization_capability_profiles, organization_capability_signals, community_outcome_definitions,
  funding_outcome_commitments, funding_outcome_updates, community_outcome_validations,
  funding_agent_workflows, funding_match_recommendations
  TO authenticated, service_role;

GRANT SELECT ON v_funding_award_community_accountability TO anon, authenticated, service_role;
GRANT SELECT ON v_agentic_funding_queue TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_funding_match_score(UUID, UUID) TO authenticated, service_role;

COMMENT ON TABLE funding_sources IS 'Canonical registry of funders, departments, and philanthropic actors that put money into the system.';
COMMENT ON TABLE funding_programs IS 'Canonical funding programs and budget lines, used to invert the flow so funders discover qualified community organizations.';
COMMENT ON TABLE public_spending_transactions IS 'Track appropriations, allocations, disbursements, and reconciliations so public money can be measured against outcomes.';
COMMENT ON TABLE funding_awards IS 'Actual grants, contracts, and philanthropic awards to organizations.';
COMMENT ON TABLE organization_capability_profiles IS 'Live capability and readiness profiles that let government and philanthropy discover community organizations instead of waiting for applications.';
COMMENT ON TABLE organization_capability_signals IS 'Granular signals and evidence feeding the capability profile for explainable matching.';
COMMENT ON TABLE community_outcome_definitions IS 'Community-defined outcomes used to hold spending accountable to community priorities.';
COMMENT ON TABLE funding_outcome_commitments IS 'Outcome commitments attached to a specific funding award and organization.';
COMMENT ON TABLE funding_outcome_updates IS 'Rolling progress updates against outcome commitments, submitted by people or agents.';
COMMENT ON TABLE community_outcome_validations IS 'Community-side validation so outcomes are reported back to community, not only to funders.';
COMMENT ON TABLE funding_agent_workflows IS 'Telemetry for agentic ingestion, matching, reconciliation, and community reporting workflows.';
COMMENT ON TABLE funding_match_recommendations IS 'Explainable agent-generated recommendations linking live opportunities to organizations.';
COMMENT ON VIEW v_funding_award_community_accountability IS 'Public accountability layer linking awards, tracked spend, and community-validated outcomes.';
COMMENT ON VIEW v_agentic_funding_queue IS 'Operational queue for agents to prioritize open opportunities with high-fit community matches.';

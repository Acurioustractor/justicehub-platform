-- Campaign Alignment Engine
-- Cross-references 2.7M public records with CRM contacts to identify
-- allies, funders, opponents, and warm paths for the CONTAINED campaign.

-- =============================================================
-- 1. campaign_alignment_entities — scored persons + orgs
-- =============================================================
CREATE TABLE IF NOT EXISTS campaign_alignment_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('person', 'organization')),
  person_id uuid REFERENCES person_identity_map(person_id),
  acnc_abn text,
  organization_name text,
  name text NOT NULL,
  organization text,
  position text,
  email text,
  website text,
  justice_alignment_score integer DEFAULT 0,
  reach_influence_score integer DEFAULT 0,
  accessibility_score integer DEFAULT 0,
  composite_score integer DEFAULT 0,
  alignment_category text DEFAULT 'unknown'
    CHECK (alignment_category IN ('ally', 'potential_ally', 'neutral', 'opponent', 'unknown')),
  campaign_list text
    CHECK (campaign_list IN ('allies_to_activate', 'funders_to_pitch', 'decision_makers', 'opponents_to_understand', 'warm_intros')),
  alignment_signals jsonb DEFAULT '[]'::jsonb,
  warm_paths jsonb DEFAULT '[]'::jsonb,
  funding_history jsonb DEFAULT '[]'::jsonb,
  political_donations_summary jsonb DEFAULT '{}'::jsonb,
  outreach_status text DEFAULT 'pending'
    CHECK (outreach_status IN ('pending', 'draft_ready', 'approved', 'sent', 'responded', 'converted', 'declined')),
  ghl_contact_id text,
  draft_message text,
  recommended_approach text,
  score_confidence text DEFAULT 'medium' CHECK (score_confidence IN ('high', 'medium', 'low')),
  last_scored_at timestamptz,
  scoring_run_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cae_composite_score ON campaign_alignment_entities(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_cae_category ON campaign_alignment_entities(alignment_category);
CREATE INDEX IF NOT EXISTS idx_cae_campaign_list ON campaign_alignment_entities(campaign_list);
CREATE INDEX IF NOT EXISTS idx_cae_person_id ON campaign_alignment_entities(person_id);
CREATE INDEX IF NOT EXISTS idx_cae_acnc_abn ON campaign_alignment_entities(acnc_abn);
CREATE INDEX IF NOT EXISTS idx_cae_outreach_status ON campaign_alignment_entities(outreach_status);
CREATE INDEX IF NOT EXISTS idx_cae_entity_type ON campaign_alignment_entities(entity_type);

-- =============================================================
-- 2. campaign_alignment_runs — audit trail
-- =============================================================
CREATE TABLE IF NOT EXISTS campaign_alignment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  orgs_scored integer DEFAULT 0,
  persons_scored integer DEFAULT 0,
  total_entities integer DEFAULT 0,
  error_message text,
  run_by text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- =============================================================
-- 3. mv_org_justice_signals — materialized view
-- Uses subqueries (not joins) to avoid row multiplication from
-- multiple foundation/ORIC matches per ABN.
-- =============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_org_justice_signals AS
SELECT
  ac.abn,
  ac.name,
  ac.website,
  ac.charity_size,
  COALESCE(
    (CASE WHEN ac.purpose_law_policy THEN 20 ELSE 0 END) +
    (CASE WHEN ac.purpose_human_rights THEN 20 ELSE 0 END) +
    (CASE WHEN ac.purpose_social_welfare THEN 15 ELSE 0 END) +
    (CASE WHEN ac.purpose_reconciliation THEN 25 ELSE 0 END),
    0
  ) AS purpose_score,
  COALESCE(
    (CASE WHEN ac.ben_youth THEN 20 ELSE 0 END) +
    (CASE WHEN ac.ben_children THEN 15 ELSE 0 END) +
    (CASE WHEN ac.ben_aboriginal_tsi THEN 25 ELSE 0 END) +
    (CASE WHEN ac.ben_pre_post_release THEN 25 ELSE 0 END) +
    (CASE WHEN ac.ben_victims_of_crime THEN 15 ELSE 0 END),
    0
  ) AS beneficiary_score,
  ac.purpose_law_policy, ac.purpose_human_rights,
  ac.purpose_social_welfare, ac.purpose_reconciliation,
  ac.ben_youth, ac.ben_children, ac.ben_aboriginal_tsi,
  ac.ben_pre_post_release, ac.ben_victims_of_crime,
  (SELECT f.id FROM foundations f WHERE f.acnc_abn = ac.abn LIMIT 1) AS foundation_id,
  EXISTS(SELECT 1 FROM foundations f WHERE f.acnc_abn = ac.abn) AS has_foundation,
  (SELECT f.total_giving_annual FROM foundations f WHERE f.acnc_abn = ac.abn ORDER BY f.total_giving_annual DESC NULLS LAST LIMIT 1) AS total_giving_annual,
  EXISTS(
    SELECT 1 FROM foundations f WHERE f.acnc_abn = ac.abn
    AND array_to_string(f.thematic_focus, ' ') ~* '(justice|youth|indigenous|aboriginal|detention|incarceration)'
  ) AS has_justice_focus,
  EXISTS(SELECT 1 FROM oric_corporations oc WHERE oc.abn = ac.abn) AS is_oric_registered,
  COALESCE((
    SELECT COUNT(DISTINCT jf2.alma_organization_id)
    FROM justice_funding jf2
    WHERE jf2.recipient_abn = ac.abn AND jf2.alma_organization_id IS NOT NULL
  ), 0) AS intervention_count,
  (
    SELECT array_agg(DISTINCT ai.type) FILTER (WHERE ai.type IS NOT NULL)
    FROM justice_funding jf2
    JOIN alma_interventions ai ON ai.operating_organization_id = jf2.alma_organization_id
    WHERE jf2.recipient_abn = ac.abn AND jf2.alma_organization_id IS NOT NULL
  ) AS intervention_types,
  COALESCE((SELECT SUM(jfund.amount_dollars) FROM justice_funding jfund WHERE jfund.recipient_abn = ac.abn), 0) AS total_funding_received,
  COALESCE((SELECT COUNT(*) FROM justice_funding jfund WHERE jfund.recipient_abn = ac.abn), 0) AS grant_count,
  ac.operates_in_qld, ac.operates_in_nsw, ac.operates_in_vic,
  ac.operates_in_wa, ac.operates_in_sa, ac.operates_in_tas,
  ac.operates_in_act, ac.operates_in_nt
FROM acnc_charities ac;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_ojs_abn ON mv_org_justice_signals(abn);
CREATE INDEX IF NOT EXISTS idx_mv_ojs_purpose ON mv_org_justice_signals(purpose_score DESC);
CREATE INDEX IF NOT EXISTS idx_mv_ojs_beneficiary ON mv_org_justice_signals(beneficiary_score DESC);

-- RLS
ALTER TABLE campaign_alignment_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_alignment_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on campaign_alignment_entities"
  ON campaign_alignment_entities FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on campaign_alignment_runs"
  ON campaign_alignment_runs FOR ALL
  USING (auth.role() = 'service_role');

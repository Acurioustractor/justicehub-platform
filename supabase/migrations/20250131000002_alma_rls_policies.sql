-- ALMA Row-Level Security Policies
-- Implements ALMA's 3-tier consent model as database-enforced security
--
-- Consent Tiers:
-- 1. Public Knowledge Commons - Visible to all (authenticated + anonymous)
-- 2. Community Controlled - Visible to authenticated users, requires approval for actions
-- 3. Strictly Private - Only visible to organization members and platform admins
--
-- This ensures governance is enforced at the database level, not in application code.

-- =====================================
-- ENABLE RLS ON ALL ALMA TABLES
-- =====================================

ALTER TABLE alma_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_community_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_intervention_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_intervention_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_intervention_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_evidence_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_consent_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_usage_log ENABLE ROW LEVEL SECURITY;

-- =====================================
-- INTERVENTIONS - RLS POLICIES
-- =====================================

-- SELECT: Public can see Published + Public Knowledge Commons
CREATE POLICY "Public can view published public interventions"
  ON alma_interventions
  FOR SELECT
  TO anon, authenticated
  USING (
    review_status = 'Published'
    AND consent_level = 'Public Knowledge Commons'
  );

-- SELECT: Authenticated users can see Approved + Community Controlled
CREATE POLICY "Authenticated users can view approved community interventions"
  ON alma_interventions
  FOR SELECT
  TO authenticated
  USING (
    review_status IN ('Approved', 'Published')
    AND consent_level IN ('Public Knowledge Commons', 'Community Controlled')
  );

-- SELECT: Organization members can see all their org's interventions
CREATE POLICY "Organization members can view their interventions"
  ON alma_interventions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.organization_id IN (
          SELECT o.id
          FROM organizations o
          WHERE o.name = alma_interventions.operating_organization
        )
    )
  );

-- SELECT: Platform admins can see everything
CREATE POLICY "Platform admins can view all interventions"
  ON alma_interventions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- INSERT: Authenticated users can create interventions (default to Draft)
CREATE POLICY "Authenticated users can create interventions"
  ON alma_interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    review_status = 'Draft'
    AND (
      -- Must be org member or platform admin
      EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = auth.uid()
          AND u.role IN ('org_admin', 'platform_admin')
      )
    )
  );

-- UPDATE: Organization members can edit their Draft interventions
CREATE POLICY "Organization members can edit draft interventions"
  ON alma_interventions
  FOR UPDATE
  TO authenticated
  USING (
    review_status = 'Draft'
    AND EXISTS (
      SELECT 1
      FROM org_memberships om
      WHERE om.user_id = auth.uid()
        AND om.organization_id IN (
          SELECT o.id
          FROM organizations o
          WHERE o.name = alma_interventions.operating_organization
        )
    )
  )
  WITH CHECK (
    review_status IN ('Draft', 'Community Review')
  );

-- UPDATE: Platform admins can update any intervention
CREATE POLICY "Platform admins can update interventions"
  ON alma_interventions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- DELETE: Only platform admins can delete
CREATE POLICY "Platform admins can delete interventions"
  ON alma_interventions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- =====================================
-- COMMUNITY CONTEXTS - RLS POLICIES
-- =====================================

-- SELECT: Respect consent levels (same pattern as interventions)
CREATE POLICY "Public can view public contexts"
  ON alma_community_contexts
  FOR SELECT
  TO anon, authenticated
  USING (
    consent_level = 'Public Knowledge Commons'
  );

CREATE POLICY "Authenticated users can view community contexts"
  ON alma_community_contexts
  FOR SELECT
  TO authenticated
  USING (
    consent_level IN ('Public Knowledge Commons', 'Community Controlled')
  );

CREATE POLICY "Platform admins can view all contexts"
  ON alma_community_contexts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- INSERT/UPDATE/DELETE: Platform admins and org admins
CREATE POLICY "Admins can manage contexts"
  ON alma_community_contexts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  );

-- =====================================
-- EVIDENCE - RLS POLICIES
-- =====================================

-- SELECT: Public can view public evidence
CREATE POLICY "Public can view public evidence"
  ON alma_evidence
  FOR SELECT
  TO anon, authenticated
  USING (
    consent_level = 'Public Knowledge Commons'
  );

CREATE POLICY "Authenticated users can view community evidence"
  ON alma_evidence
  FOR SELECT
  TO authenticated
  USING (
    consent_level IN ('Public Knowledge Commons', 'Community Controlled')
  );

CREATE POLICY "Platform admins can view all evidence"
  ON alma_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- INSERT/UPDATE/DELETE: Authenticated users with admin role
CREATE POLICY "Admins can manage evidence"
  ON alma_evidence
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  );

-- =====================================
-- OUTCOMES - RLS POLICIES
-- =====================================

-- Outcomes are reference data - public to all
CREATE POLICY "Anyone can view outcomes"
  ON alma_outcomes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: Platform admins only
CREATE POLICY "Platform admins can manage outcomes"
  ON alma_outcomes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- =====================================
-- RELATIONSHIP TABLES - RLS POLICIES
-- =====================================

-- For relationship tables, inherit policies from parent entities
-- Users can see relationships if they can see both related entities

-- Intervention-Outcomes
CREATE POLICY "Users can view intervention-outcome links if they can view intervention"
  ON alma_intervention_outcomes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM alma_interventions i
      WHERE i.id = intervention_id
        AND (
          -- Use same logic as intervention SELECT policies
          (i.review_status = 'Published' AND i.consent_level = 'Public Knowledge Commons')
          OR (
            auth.uid() IS NOT NULL
            AND i.review_status IN ('Approved', 'Published')
            AND i.consent_level IN ('Public Knowledge Commons', 'Community Controlled')
          )
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM users u
              WHERE u.id = auth.uid()
                AND u.role = 'platform_admin'
            )
          )
        )
    )
  );

CREATE POLICY "Admins can manage intervention-outcome links"
  ON alma_intervention_outcomes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  );

-- Intervention-Evidence
CREATE POLICY "Users can view intervention-evidence links if they can view intervention"
  ON alma_intervention_evidence
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM alma_interventions i
      WHERE i.id = intervention_id
        AND (
          (i.review_status = 'Published' AND i.consent_level = 'Public Knowledge Commons')
          OR (
            auth.uid() IS NOT NULL
            AND i.review_status IN ('Approved', 'Published')
            AND i.consent_level IN ('Public Knowledge Commons', 'Community Controlled')
          )
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM users u
              WHERE u.id = auth.uid()
                AND u.role = 'platform_admin'
            )
          )
        )
    )
  );

CREATE POLICY "Admins can manage intervention-evidence links"
  ON alma_intervention_evidence
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  );

-- Intervention-Contexts
CREATE POLICY "Users can view intervention-context links if they can view intervention"
  ON alma_intervention_contexts
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM alma_interventions i
      WHERE i.id = intervention_id
        AND (
          (i.review_status = 'Published' AND i.consent_level = 'Public Knowledge Commons')
          OR (
            auth.uid() IS NOT NULL
            AND i.review_status IN ('Approved', 'Published')
            AND i.consent_level IN ('Public Knowledge Commons', 'Community Controlled')
          )
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM users u
              WHERE u.id = auth.uid()
                AND u.role = 'platform_admin'
            )
          )
        )
    )
  );

CREATE POLICY "Admins can manage intervention-context links"
  ON alma_intervention_contexts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  );

-- Evidence-Outcomes
CREATE POLICY "Anyone can view evidence-outcome links"
  ON alma_evidence_outcomes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage evidence-outcome links"
  ON alma_evidence_outcomes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('org_admin', 'platform_admin')
    )
  );

-- =====================================
-- CONSENT LEDGER - RLS POLICIES
-- =====================================

-- Consent ledger is governance infrastructure
-- Only platform admins can view and manage

CREATE POLICY "Platform admins can view consent ledger"
  ON alma_consent_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can manage consent ledger"
  ON alma_consent_ledger
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- =====================================
-- USAGE LOG - RLS POLICIES
-- =====================================

-- Usage log tracks all access
-- Platform admins can view, system can insert

CREATE POLICY "Platform admins can view usage log"
  ON alma_usage_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

CREATE POLICY "System can insert usage log entries"
  ON alma_usage_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- All authenticated users can log their usage

-- Only platform admins can update/delete
CREATE POLICY "Platform admins can manage usage log"
  ON alma_usage_log
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can delete usage log"
  ON alma_usage_log
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'platform_admin'
    )
  );

-- =====================================
-- HELPER FUNCTIONS FOR POLICIES
-- =====================================

-- Function to check if user has permission for specific action
CREATE OR REPLACE FUNCTION user_can_perform_alma_action(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  -- Use the consent compliance check
  SELECT allowed
  INTO v_allowed
  FROM check_consent_compliance(p_entity_type, p_entity_id, p_action);

  RETURN COALESCE(v_allowed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log usage when entities are accessed
CREATE OR REPLACE FUNCTION log_alma_usage(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_query_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO alma_usage_log (
    entity_type,
    entity_id,
    action,
    user_id,
    query_text
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    auth.uid(),
    p_query_text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION calculate_portfolio_signals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_consent_compliance(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_perform_alma_action(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_alma_usage(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON POLICY "Public can view published public interventions" ON alma_interventions IS 'Public Knowledge Commons tier - visible to all when Published';
COMMENT ON POLICY "Authenticated users can view approved community interventions" ON alma_interventions IS 'Community Controlled tier - visible to authenticated users when Approved';
COMMENT ON POLICY "Organization members can view their interventions" ON alma_interventions IS 'Strictly Private tier - only visible to org members and platform admins';

COMMENT ON FUNCTION user_can_perform_alma_action IS 'Check if current user has permission for specific action based on consent ledger';
COMMENT ON FUNCTION log_alma_usage IS 'Log all ALMA entity access for attribution and revenue sharing';

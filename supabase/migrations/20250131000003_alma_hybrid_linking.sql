-- ALMA Hybrid Linking - Connect existing JusticeHub data to ALMA
--
-- This migration creates the bridge between existing JusticeHub data and ALMA entities.
-- Strategy: Link, don't duplicate. Preserve existing data, add ALMA structure on top.
--
-- Approach:
-- 1. Add foreign key columns to existing tables (services, community_programs)
-- 2. Create view that combines community_programs + ALMA interventions
-- 3. Backfill script to convert existing community programs to ALMA interventions
-- 4. Create helper functions for hybrid queries

-- =====================================
-- EXTEND EXISTING TABLES
-- =====================================

-- Add ALMA intervention reference to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS alma_intervention_id UUID REFERENCES alma_interventions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_alma_intervention
  ON services(alma_intervention_id);

COMMENT ON COLUMN services.alma_intervention_id IS 'Optional link to ALMA intervention for services that represent interventions';

-- Add ALMA intervention reference to community_programs table
ALTER TABLE community_programs
  ADD COLUMN IF NOT EXISTS alma_intervention_id UUID REFERENCES alma_interventions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_programs_alma_intervention
  ON community_programs(alma_intervention_id);

COMMENT ON COLUMN community_programs.alma_intervention_id IS 'Link to ALMA intervention created from this community program';

-- =====================================
-- BACKFILL FUNCTION
-- =====================================

-- Function to convert a community program to an ALMA intervention
CREATE OR REPLACE FUNCTION backfill_community_program_to_alma_intervention(p_program_id UUID)
RETURNS UUID AS $$
DECLARE
  v_intervention_id UUID;
  v_program RECORD;
  v_intervention_type TEXT;
BEGIN
  -- Get the community program
  SELECT * INTO v_program
  FROM community_programs
  WHERE id = p_program_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Community program not found: %', p_program_id;
  END IF;

  -- Map approach to intervention type
  v_intervention_type := CASE v_program.approach
    WHEN 'Indigenous-led' THEN 'Community-Led'
    WHEN 'Community-based' THEN 'Community-Led'
    WHEN 'Grassroots' THEN 'Community-Led'
    WHEN 'Culturally-responsive' THEN 'Cultural Connection'
    ELSE 'Community-Led'
  END;

  -- Create ALMA intervention
  INSERT INTO alma_interventions (
    name,
    type,
    description,
    geography,
    evidence_level,
    cultural_authority,
    consent_level,
    permitted_uses,
    operating_organization,
    years_operating,
    review_status,
    linked_community_program_id,
    metadata
  ) VALUES (
    v_program.name,
    v_intervention_type,
    v_program.description || E'\n\nImpact: ' || v_program.impact_summary,
    ARRAY[v_program.state],
    CASE
      WHEN v_program.indigenous_knowledge THEN 'Indigenous-led (culturally grounded, community authority)'
      WHEN v_program.success_rate >= 80 THEN 'Effective (strong evaluation, positive outcomes)'
      WHEN v_program.success_rate >= 60 THEN 'Promising (community-endorsed, emerging evidence)'
      ELSE 'Promising (community-endorsed, emerging evidence)'
    END,
    CASE
      WHEN v_program.indigenous_knowledge THEN v_program.organization || ' (Indigenous-led)'
      ELSE v_program.organization
    END,
    'Community Controlled', -- Default to Community Controlled for existing programs
    ARRAY['Query (internal)', 'Publish (JusticeHub)']::TEXT[],
    v_program.organization,
    v_program.years_operating,
    'Approved', -- Mark as Approved since they're already published in JusticeHub
    v_program.id,
    jsonb_build_object(
      'source', 'backfill_from_community_programs',
      'original_approach', v_program.approach,
      'success_rate', v_program.success_rate,
      'participants_served', v_program.participants_served,
      'community_connection_score', v_program.community_connection_score,
      'is_featured', v_program.is_featured,
      'tags', v_program.tags
    )
  ) RETURNING id INTO v_intervention_id;

  -- Link back to community program
  UPDATE community_programs
  SET alma_intervention_id = v_intervention_id
  WHERE id = p_program_id;

  -- Create consent ledger entry
  INSERT INTO alma_consent_ledger (
    entity_type,
    entity_id,
    consent_level,
    permitted_uses,
    cultural_authority,
    contributors,
    attribution_text,
    consent_given_by,
    revenue_share_enabled
  ) VALUES (
    'intervention',
    v_intervention_id,
    'Community Controlled',
    ARRAY['Query (internal)', 'Publish (JusticeHub)']::TEXT[],
    CASE
      WHEN v_program.indigenous_knowledge THEN v_program.organization || ' (Indigenous-led)'
      ELSE v_program.organization
    END,
    jsonb_build_array(
      jsonb_build_object(
        'name', v_program.organization,
        'role', 'Program operator',
        'contact', COALESCE(v_program.contact_email, v_program.contact_phone)
      )
    ),
    'Data sourced from ' || v_program.organization || ' community program',
    'JusticeHub backfill migration',
    true -- Enable revenue sharing for community contributions
  );

  RETURN v_intervention_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_community_program_to_alma_intervention IS 'Convert a community program to an ALMA intervention with consent tracking';

-- =====================================
-- BATCH BACKFILL FUNCTION
-- =====================================

-- Function to backfill all community programs
CREATE OR REPLACE FUNCTION backfill_all_community_programs_to_alma()
RETURNS TABLE (
  program_id UUID,
  intervention_id UUID,
  program_name TEXT,
  status TEXT
) AS $$
DECLARE
  v_program RECORD;
  v_intervention_id UUID;
BEGIN
  FOR v_program IN
    SELECT id, name, alma_intervention_id
    FROM community_programs
    WHERE alma_intervention_id IS NULL -- Only backfill programs not yet linked
    ORDER BY is_featured DESC, created_at ASC -- Featured programs first
  LOOP
    BEGIN
      -- Backfill this program
      v_intervention_id := backfill_community_program_to_alma_intervention(v_program.id);

      -- Return success
      program_id := v_program.id;
      intervention_id := v_intervention_id;
      program_name := v_program.name;
      status := 'Success';
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      -- Return error
      program_id := v_program.id;
      intervention_id := NULL;
      program_name := v_program.name;
      status := 'Error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_all_community_programs_to_alma IS 'Batch backfill all community programs to ALMA interventions';

-- =====================================
-- UNIFIED VIEW
-- =====================================

-- Create a view that combines community programs and ALMA interventions
-- This allows querying both legacy and new data in one place
CREATE OR REPLACE VIEW alma_interventions_unified AS
SELECT
  i.id,
  i.name,
  i.type,
  i.description,
  i.target_cohort,
  i.geography,
  i.evidence_level,
  i.cultural_authority,
  i.consent_level,
  i.operating_organization,
  i.contact_email,
  i.contact_phone,
  i.website,
  i.years_operating,
  i.review_status,
  i.portfolio_score,
  i.created_at,
  i.updated_at,
  'alma' AS source,
  i.linked_community_program_id,
  i.linked_service_id,
  -- Aggregate relationships
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', o.id, 'name', o.name, 'type', o.outcome_type))
      FROM alma_outcomes o
      JOIN alma_intervention_outcomes io ON o.id = io.outcome_id
      WHERE io.intervention_id = i.id
    ),
    '[]'::json
  ) AS outcomes,
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', e.id, 'title', e.title, 'type', e.evidence_type))
      FROM alma_evidence e
      JOIN alma_intervention_evidence ie ON e.id = ie.evidence_id
      WHERE ie.intervention_id = i.id
    ),
    '[]'::json
  ) AS evidence,
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'type', c.context_type))
      FROM alma_community_contexts c
      JOIN alma_intervention_contexts ic ON c.id = ic.context_id
      WHERE ic.intervention_id = i.id
    ),
    '[]'::json
  ) AS contexts
FROM alma_interventions i

UNION ALL

-- Include community programs that haven't been backfilled yet
SELECT
  cp.id,
  cp.name,
  'Community-Led' AS type,
  cp.description,
  '{}' AS target_cohort,
  ARRAY[cp.state] AS geography,
  CASE
    WHEN cp.indigenous_knowledge THEN 'Indigenous-led (culturally grounded, community authority)'
    ELSE 'Promising (community-endorsed, emerging evidence)'
  END AS evidence_level,
  cp.organization AS cultural_authority,
  'Community Controlled' AS consent_level,
  cp.organization AS operating_organization,
  cp.contact_email,
  cp.contact_phone,
  cp.website,
  cp.years_operating,
  'Approved' AS review_status,
  NULL AS portfolio_score,
  cp.created_at,
  cp.updated_at,
  'community_programs' AS source,
  NULL AS linked_community_program_id,
  NULL AS linked_service_id,
  '[]'::json AS outcomes,
  '[]'::json AS evidence,
  '[]'::json AS contexts
FROM community_programs cp
WHERE cp.alma_intervention_id IS NULL; -- Only include programs not yet linked

COMMENT ON VIEW alma_interventions_unified IS 'Unified view combining ALMA interventions and legacy community programs';

-- =====================================
-- HELPER FUNCTIONS FOR HYBRID QUERIES
-- =====================================

-- Function to search across both ALMA and legacy data
CREATE OR REPLACE FUNCTION search_interventions_unified(
  p_search_query TEXT,
  p_geography TEXT[] DEFAULT NULL,
  p_consent_level TEXT DEFAULT NULL,
  p_min_evidence_level TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  operating_organization TEXT,
  geography TEXT[],
  evidence_level TEXT,
  source TEXT,
  relevance_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.name,
    i.description,
    i.operating_organization,
    i.geography,
    i.evidence_level,
    i.source,
    ts_rank(i.search_vector, websearch_to_tsquery('english', p_search_query)) AS relevance_rank
  FROM alma_interventions_unified i,
       LATERAL (
         SELECT setweight(to_tsvector('english', COALESCE(i.name, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(i.description, '')), 'B')
       ) AS search_vector(search_vector)
  WHERE
    (p_search_query IS NULL OR search_vector.search_vector @@ websearch_to_tsquery('english', p_search_query))
    AND (p_geography IS NULL OR i.geography && p_geography)
    AND (p_consent_level IS NULL OR i.consent_level = p_consent_level)
    AND (p_min_evidence_level IS NULL OR i.evidence_level >= p_min_evidence_level)
  ORDER BY relevance_rank DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_interventions_unified IS 'Search across both ALMA interventions and legacy community programs';

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

GRANT SELECT ON alma_interventions_unified TO anon, authenticated;
GRANT EXECUTE ON FUNCTION backfill_community_program_to_alma_intervention(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_all_community_programs_to_alma() TO authenticated;
GRANT EXECUTE ON FUNCTION search_interventions_unified(TEXT, TEXT[], TEXT, TEXT) TO anon, authenticated;

-- =====================================
-- INITIAL BACKFILL (Optional - run manually)
-- =====================================

-- Uncomment to run automatic backfill on migration
-- This will convert all existing community programs to ALMA interventions
--
-- SELECT * FROM backfill_all_community_programs_to_alma();
--
-- Or run selectively:
-- SELECT backfill_community_program_to_alma_intervention(id)
-- FROM community_programs
-- WHERE is_featured = true; -- Only backfill featured programs

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON COLUMN services.alma_intervention_id IS 'Hybrid linking: Services can optionally represent ALMA interventions';
COMMENT ON COLUMN community_programs.alma_intervention_id IS 'Hybrid linking: Community programs converted to ALMA interventions';
COMMENT ON VIEW alma_interventions_unified IS 'Unified view for querying both ALMA interventions and legacy community programs together';

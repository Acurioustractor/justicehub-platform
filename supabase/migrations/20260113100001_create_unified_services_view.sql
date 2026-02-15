-- Create unified services view that combines all data sources
-- This provides a single source of truth for all programs/services/interventions
-- Uses UNION ALL approach for better compatibility with Supabase pooler

-- Step 1: Update services with ALMA intervention data where names match
UPDATE services s
SET alma_intervention_id = ai.id
FROM alma_interventions ai
WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(ai.name))
  AND s.alma_intervention_id IS NULL;

-- Step 2: Update ALMA interventions with service IDs where names match
UPDATE alma_interventions ai
SET linked_service_id = s.id
FROM services s
WHERE LOWER(TRIM(ai.name)) = LOWER(TRIM(s.name))
  AND ai.linked_service_id IS NULL;

-- Step 3: Create the unified services view using UNION ALL
DROP VIEW IF EXISTS services_unified;

CREATE OR REPLACE VIEW services_unified AS
-- Services (primary source - has geocoding)
SELECT
  s.id,
  s.name,
  s.slug,
  s.description,
  'services' AS source_table,
  s.latitude,
  s.longitude,
  s.location_city AS city,
  s.location_state AS state,
  s.location_address AS address,
  s.location_postcode AS postcode,
  s.organization_id,
  (SELECT name FROM organizations WHERE id = s.organization_id) AS organization_name,
  s.categories AS service_categories,
  s.service_type AS intervention_type,
  NULL::text AS program_approach,
  s.tags,
  s.contact_phone AS phone,
  s.contact_email AS email,
  s.website_url AS website,
  COALESCE(s.youth_specific, TRUE) AS youth_specific,
  COALESCE(s.indigenous_specific, FALSE) AS indigenous_specific,
  COALESCE(s.is_featured, FALSE) AS is_featured,
  COALESCE(s.is_active, TRUE) AS is_active,
  s.success_rate,
  NULL::integer AS participants_served,
  NULL::integer AS years_operating,
  ai.evidence_level,
  ai.portfolio_score,
  ai.consent_level,
  ai.cultural_authority,
  ai.review_status AS alma_review_status,
  NULL::text AS impact_summary,
  GREATEST(s.updated_at, ai.updated_at) AS updated_at,
  LEAST(s.created_at, ai.created_at) AS created_at,
  s.id AS service_id,
  NULL::uuid AS community_program_id,
  s.alma_intervention_id
FROM services s
LEFT JOIN alma_interventions ai ON s.alma_intervention_id = ai.id
WHERE COALESCE(s.is_active, TRUE) = TRUE

UNION ALL

-- Community programs not already in services
SELECT
  cp.id,
  cp.name,
  LOWER(REPLACE(cp.name, ' ', '-')) AS slug,
  cp.description,
  'community_programs' AS source_table,
  cp.latitude,
  cp.longitude,
  cp.location AS city,
  cp.state,
  NULL::text AS address,
  NULL::text AS postcode,
  cp.organization_id,
  cp.organization AS organization_name,
  cp.tags AS service_categories,
  ai.type AS intervention_type,
  cp.approach AS program_approach,
  cp.tags,
  cp.contact_phone AS phone,
  cp.contact_email AS email,
  cp.website,
  TRUE AS youth_specific,
  COALESCE(cp.indigenous_knowledge, FALSE) AS indigenous_specific,
  COALESCE(cp.is_featured, FALSE) AS is_featured,
  TRUE AS is_active,
  cp.success_rate,
  cp.participants_served,
  cp.years_operating,
  ai.evidence_level,
  ai.portfolio_score,
  ai.consent_level,
  ai.cultural_authority,
  ai.review_status AS alma_review_status,
  cp.impact_summary,
  GREATEST(cp.updated_at, ai.updated_at) AS updated_at,
  LEAST(cp.created_at, ai.created_at) AS created_at,
  NULL::uuid AS service_id,
  cp.id AS community_program_id,
  cp.alma_intervention_id
FROM community_programs cp
LEFT JOIN alma_interventions ai ON cp.alma_intervention_id = ai.id
WHERE NOT EXISTS (
  SELECT 1 FROM services s
  WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(cp.name))
)

UNION ALL

-- ALMA interventions not in services or community_programs
SELECT
  ai.id,
  ai.name,
  LOWER(REPLACE(ai.name, ' ', '-')) AS slug,
  ai.description,
  'alma_interventions' AS source_table,
  ai.latitude,
  ai.longitude,
  NULL::text AS city,
  ai.geography[1] AS state,
  NULL::text AS address,
  NULL::text AS postcode,
  ai.operating_organization_id AS organization_id,
  ai.operating_organization AS organization_name,
  NULL::text[] AS service_categories,
  ai.type AS intervention_type,
  NULL::text AS program_approach,
  NULL::text[] AS tags,
  ai.contact_phone AS phone,
  ai.contact_email AS email,
  ai.website,
  TRUE AS youth_specific,
  FALSE AS indigenous_specific,
  FALSE AS is_featured,
  TRUE AS is_active,
  NULL::numeric AS success_rate,
  NULL::integer AS participants_served,
  ai.years_operating,
  ai.evidence_level,
  ai.portfolio_score,
  ai.consent_level,
  ai.cultural_authority,
  ai.review_status AS alma_review_status,
  NULL::text AS impact_summary,
  ai.updated_at,
  ai.created_at,
  ai.linked_service_id AS service_id,
  ai.linked_community_program_id AS community_program_id,
  ai.id AS alma_intervention_id
FROM alma_interventions ai
WHERE ai.linked_service_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM services s
    WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(ai.name))
  )
  AND NOT EXISTS (
    SELECT 1 FROM community_programs cp
    WHERE LOWER(TRIM(cp.name)) = LOWER(TRIM(ai.name))
  );

-- Grant permissions
GRANT SELECT ON services_unified TO anon, authenticated;

-- Add helpful comments
COMMENT ON VIEW services_unified IS 'Unified view of all services, community programs, and ALMA interventions. Deduplicates by name matching. Services are primary source.';

-- Step 4: Create a summary stats function
CREATE OR REPLACE FUNCTION get_unified_services_stats()
RETURNS TABLE(
  total_count BIGINT,
  with_coordinates BIGINT,
  from_services BIGINT,
  from_alma BIGINT,
  from_community_programs BIGINT,
  indigenous_specific BIGINT,
  youth_specific BIGINT,
  by_state JSONB
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE latitude IS NOT NULL) AS with_coordinates,
    COUNT(*) FILTER (WHERE source_table = 'services') AS from_services,
    COUNT(*) FILTER (WHERE source_table = 'alma_interventions') AS from_alma,
    COUNT(*) FILTER (WHERE source_table = 'community_programs') AS from_community_programs,
    COUNT(*) FILTER (WHERE indigenous_specific = TRUE) AS indigenous_specific,
    COUNT(*) FILTER (WHERE youth_specific = TRUE) AS youth_specific,
    (
      SELECT jsonb_object_agg(state, cnt)
      FROM (
        SELECT COALESCE(state, 'Unknown') AS state, COUNT(*) AS cnt
        FROM services_unified
        GROUP BY state
        ORDER BY cnt DESC
      ) sub
    ) AS by_state
  FROM services_unified;
$$;

GRANT EXECUTE ON FUNCTION get_unified_services_stats() TO anon, authenticated;

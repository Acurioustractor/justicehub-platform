-- Contained tour-intelligence summary aggregates.
-- One Postgres function so the API doesn't hit Supabase's default 1000-row cap.
-- Each value is one SQL query and is defensible in a board meeting.

CREATE OR REPLACE FUNCTION get_contained_intel_summary()
RETURNS TABLE (
  tour_stops integer,
  programs_catalogued integer,
  strong_evidence_count integer,
  orgs_indexed integer,
  indigenous_led_orgs integer,
  funding_tracked_dollars numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    -- Tour stops mapped + costed
    (SELECT count(*)::int FROM tour_stops WHERE campaign_slug = 'the-contained'),

    -- All non-AI-generated programs catalogued
    (SELECT count(*)::int FROM alma_interventions WHERE verification_status != 'ai_generated'),

    -- Strong evidence (verified subset only — peer-citable)
    (SELECT count(*)::int FROM alma_interventions
      WHERE verification_status = 'verified'
        AND evidence_level IN (
          'Proven (RCT/quasi-experimental, replicated)',
          'Effective (strong evaluation, positive outcomes)',
          'Indigenous-led (culturally grounded, community authority)'
        )),

    -- Distinct orgs delivering at least one non-AI program
    (SELECT count(DISTINCT operating_organization_id)::int FROM alma_interventions
      WHERE verification_status != 'ai_generated'
        AND operating_organization_id IS NOT NULL),

    -- Indigenous community-controlled orgs delivering YJ programs
    (SELECT count(DISTINCT i.operating_organization_id)::int
       FROM alma_interventions i
       JOIN organizations o ON o.id = i.operating_organization_id
      WHERE i.verification_status != 'ai_generated'
        AND o.is_indigenous_org = true),

    -- YJ funding linked to interventions (multi-year)
    (SELECT coalesce(sum(amount_dollars), 0) FROM justice_funding
      WHERE alma_intervention_id IS NOT NULL);
$$;

GRANT EXECUTE ON FUNCTION get_contained_intel_summary() TO anon, authenticated, service_role;

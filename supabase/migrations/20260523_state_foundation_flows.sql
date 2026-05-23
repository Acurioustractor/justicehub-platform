-- Per-state foundation-flows aggregator for /intelligence/civic/state/[code].
--
-- foundation_grantees has no state column; grantee state lives on organizations
-- (joined via grantee_abn). foundation_grantees uses yj_relevant (boolean) +
-- yj_confidence (numeric), not a single relevance_score column.
--
-- Returns a single row with the four headline numbers plus the top funders
-- array (top 5 funders by total dollars into the state).

CREATE OR REPLACE FUNCTION state_foundation_flows(state_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH state_abns AS (
    SELECT DISTINCT abn FROM organizations
    WHERE state = upper(state_code) AND abn IS NOT NULL AND archived <> true
  ),
  grants AS (
    SELECT fg.grant_amount, fg.foundation_name, fg.yj_relevant
    FROM foundation_grantees fg
    JOIN state_abns sa ON sa.abn = fg.grantee_abn
    WHERE fg.grant_amount IS NOT NULL
  ),
  agg AS (
    SELECT
      COALESCE(SUM(grant_amount), 0) AS total_dollars,
      COUNT(*) AS grant_count,
      COALESCE(SUM(grant_amount) FILTER (WHERE yj_relevant = true), 0) AS yj_dollars,
      COUNT(*) FILTER (WHERE yj_relevant = true) AS yj_grant_count
    FROM grants
  ),
  funders AS (
    SELECT foundation_name, SUM(grant_amount) AS funder_total
    FROM grants
    WHERE foundation_name IS NOT NULL
    GROUP BY foundation_name
    ORDER BY funder_total DESC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'total_dollars', agg.total_dollars,
    'grant_count', agg.grant_count,
    'yj_dollars', agg.yj_dollars,
    'yj_grant_count', agg.yj_grant_count,
    'top_funders', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('name', foundation_name, 'total', funder_total))
       FROM funders),
      '[]'::jsonb
    )
  )
  FROM agg;
$$;

COMMENT ON FUNCTION state_foundation_flows(text) IS
  'Per-state foundation grant aggregates (joined via organizations.abn = grantee_abn). Powers /intelligence/civic/state/[code].';

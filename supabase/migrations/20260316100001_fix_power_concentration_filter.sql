-- Fix: filter out ROGS aggregate rows from power concentration analysis
-- These rows like 'Total', 'Youth Justice - Total expenditure' etc. are
-- aggregate data from ROGS reports, not real organisations

CREATE OR REPLACE FUNCTION justice_funding_power_concentration(p_state text DEFAULT NULL)
RETURNS json LANGUAGE sql STABLE AS $$
WITH filtered_funding AS (
  SELECT * FROM justice_funding
  WHERE (p_state IS NULL OR state = p_state)
    AND recipient_name NOT IN ('Total', '2', '')
    AND recipient_name NOT LIKE 'Youth Justice - %'
    AND recipient_name NOT LIKE '% - Total%'
    AND LENGTH(TRIM(recipient_name)) > 2
)
SELECT json_build_object(
  'top10_share', (
    SELECT json_build_object(
      'dollars', sum(top_dollars)::bigint,
      'pct', round((sum(top_dollars) / NULLIF((SELECT sum(amount_dollars) FROM filtered_funding), 0) * 100)::numeric, 1),
      'orgs', json_agg(json_build_object('name', recipient_name, 'dollars', top_dollars::bigint) ORDER BY top_dollars DESC)
    )
    FROM (
      SELECT recipient_name, sum(amount_dollars) as top_dollars
      FROM filtered_funding
      GROUP BY recipient_name ORDER BY top_dollars DESC NULLS LAST LIMIT 10
    ) t
  ),
  'repeat_winners', (
    SELECT json_agg(row_to_json(t) ORDER BY t.total_dollars DESC)
    FROM (
      SELECT recipient_name, count(DISTINCT financial_year) as years_active,
        COALESCE(sum(amount_dollars), 0)::bigint as total_dollars,
        count(DISTINCT sector) as sector_count,
        count(*) as grant_count,
        bool_or(recipient_name ~* '(aboriginal|torres strait|indigenous|murri|first nations)') as is_indigenous
      FROM filtered_funding
      GROUP BY recipient_name
      HAVING count(DISTINCT financial_year) >= 10
      ORDER BY total_dollars DESC NULLS LAST
      LIMIT 25
    ) t
  ),
  'intermediaries', (
    SELECT json_agg(row_to_json(t) ORDER BY t.total_dollars DESC)
    FROM (
      SELECT recipient_name,
        COALESCE(sum(amount_dollars), 0)::bigint as total_dollars,
        count(*) as grant_count,
        count(DISTINCT financial_year) as years_active,
        array_agg(DISTINCT sector) FILTER (WHERE sector IS NOT NULL) as sectors
      FROM filtered_funding
      WHERE sector IN ('youth_justice', 'community_services', 'indigenous_services')
        AND NOT (recipient_name ~* '(aboriginal|torres strait|indigenous|murri|first nations)')
        AND amount_dollars > 100000
      GROUP BY recipient_name
      HAVING COALESCE(sum(amount_dollars), 0) > 5000000
      ORDER BY total_dollars DESC NULLS LAST
      LIMIT 20
    ) t
  ),
  'concentration', (
    SELECT json_build_object(
      'total_orgs', count(DISTINCT recipient_name),
      'orgs_for_50pct', (
        SELECT count(*) FROM (
          SELECT recipient_name, sum(amount_dollars) as org_total,
            sum(sum(amount_dollars)) OVER (ORDER BY sum(amount_dollars) DESC) as running_total
          FROM filtered_funding WHERE amount_dollars IS NOT NULL
          GROUP BY recipient_name
        ) sub
        WHERE running_total <= (SELECT sum(amount_dollars) * 0.5 FROM filtered_funding)
      ),
      'orgs_for_80pct', (
        SELECT count(*) FROM (
          SELECT recipient_name, sum(amount_dollars) as org_total,
            sum(sum(amount_dollars)) OVER (ORDER BY sum(amount_dollars) DESC) as running_total
          FROM filtered_funding WHERE amount_dollars IS NOT NULL
          GROUP BY recipient_name
        ) sub
        WHERE running_total <= (SELECT sum(amount_dollars) * 0.8 FROM filtered_funding)
      )
    )
    FROM filtered_funding
  )
);
$$;

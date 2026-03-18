-- Deduplicate political donations by party GROUP (Labor/Liberal/Nationals/Greens/Other)
-- instead of individual branch names. Reduces ~12 rows per org to max ~5 (one per group).
CREATE OR REPLACE FUNCTION power_page_donations(p_state text DEFAULT 'QLD', p_limit int DEFAULT 50)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_data) INTO result
  FROM (
    SELECT json_build_object(
      'org_name', jf.recipient_name,
      'abn', jf.recipient_abn,
      'justice_funding_total', jf.total_funding,
      'grant_count', jf.grant_count,
      'sectors', jf.sectors,
      'political_party', pd.party_group,
      'donation_total', pd.donation_total,
      'donation_count', pd.donation_count,
      'parties_detail', pd.parties_detail
    ) AS row_data
    FROM (
      SELECT
        recipient_abn,
        (ARRAY_AGG(recipient_name ORDER BY LENGTH(recipient_name) DESC)
         FILTER (WHERE recipient_name NOT IN ('Multiple', 'multiple', '(blank)', 'INDIVIDUALS', 'Individual names omitted', 'Various', 'various', 'Not specified', 'Withheld', 'N/A')
                 AND recipient_name !~ '^\s*$')
        )[1] AS recipient_name,
        SUM(amount_dollars) AS total_funding,
        COUNT(*) AS grant_count,
        ARRAY_AGG(DISTINCT sector) FILTER (WHERE sector IS NOT NULL) AS sectors
      FROM justice_funding
      WHERE (p_state IS NULL OR state = UPPER(p_state))
        AND recipient_abn IS NOT NULL
        AND amount_dollars > 0
      GROUP BY recipient_abn
      HAVING COUNT(*) FILTER (WHERE recipient_name NOT IN ('Multiple', 'multiple', '(blank)', 'INDIVIDUALS', 'Individual names omitted', 'Various', 'various', 'Not specified', 'Withheld', 'N/A')
                                AND recipient_name !~ '^\s*$') > 0
    ) jf
    JOIN (
      SELECT
        donor_abn,
        (ARRAY_AGG(donor_name ORDER BY LENGTH(donor_name) DESC))[1] AS donor_name,
        party_group,
        SUM(amount) AS donation_total,
        SUM(cnt) AS donation_count,
        ARRAY_AGG(DISTINCT orig_donation_to) AS parties_detail
      FROM (
        SELECT
          donor_abn,
          donor_name,
          donation_to AS orig_donation_to,
          amount,
          1 AS cnt,
          CASE
            WHEN LOWER(donation_to) LIKE '%labor%' OR LOWER(donation_to) LIKE '%alp%' THEN 'Labor'
            WHEN LOWER(donation_to) LIKE '%liberal%' THEN 'Liberal'
            WHEN LOWER(donation_to) LIKE '%national%' AND LOWER(donation_to) LIKE '%party%' THEN 'Nationals'
            WHEN LOWER(donation_to) LIKE '%greens%' THEN 'Greens'
            ELSE 'Other'
          END AS party_group
        FROM political_donations
        WHERE donor_abn IS NOT NULL
          AND amount > 100
      ) classified
      GROUP BY donor_abn, party_group
    ) pd ON pd.donor_abn = jf.recipient_abn
      AND (
        EXISTS (
          SELECT 1
          FROM unnest(string_to_array(LOWER(regexp_replace(jf.recipient_name, '[^a-zA-Z ]', '', 'g')), ' ')) AS w
          WHERE LENGTH(w) >= 4
            AND w NOT IN ('pty', 'ltd', 'the', 'and', 'for', 'inc', 'limited', 'australia', 'australian', 'services', 'incorporated', 'group', 'association', 'community', 'national', 'council', 'union', 'centre', 'institute', 'training')
            AND LOWER(pd.donor_name) LIKE '%' || w || '%'
        )
      )
    WHERE jf.recipient_name IS NOT NULL
    ORDER BY jf.total_funding DESC
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

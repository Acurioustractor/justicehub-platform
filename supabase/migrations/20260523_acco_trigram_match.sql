-- Second ACCO backfill pass via trigram name match + state agreement.
--
-- After the ABN match closed the easy cases, ~636 orgs remained tagged
-- is_indigenous_org=true (heuristic) but not acco_certified. Most aren't
-- Aboriginal Corporations — they're Indigenous-led NGOs. But trigram name
-- match against the Registered ORIC names found 6 high-confidence cases
-- where the JH register had stored the org name correctly but never picked
-- up the ABN, so the earlier ABN match missed them.
--
-- Match criteria (strict to avoid false positives):
--   - similarity(lower(name), lower(oric.name)) >= 0.85
--   - state agreement
--   - ORIC corp is currently Registered
--
-- The 6 matched orgs include Olabud Doogethu (Halls Creek place-based YJ),
-- Kurdiji (NT), and SAIMA Torres Strait Islander Corporation. We also
-- backfill their ABN where it was missing in the JH register.

UPDATE organizations o
SET
  acco_certified = true,
  abn = COALESCE(o.abn, m.new_abn)
FROM (
  WITH heuristic_indigenous AS (
    SELECT id, name, state FROM organizations
    WHERE is_indigenous_org = true
      AND acco_certified IS NOT TRUE
      AND is_active = true
      AND archived <> true
      AND name IS NOT NULL
      AND state IS NOT NULL
  )
  SELECT h.id, c.abn AS new_abn
  FROM heuristic_indigenous h
  CROSS JOIN LATERAL (
    SELECT abn FROM oric_corporations
    WHERE status = 'Registered'
      AND state = h.state
      AND similarity(lower(h.name), lower(name)) >= 0.85
    ORDER BY similarity(lower(h.name), lower(name)) DESC
    LIMIT 1
  ) c
) m
WHERE o.id = m.id;

-- Re-canonicalise Justice Matrix category tags + merge confirmed synonyms.
--
-- The 2026-05-28 canonicalisation (20260528000001) fixed the then-live rows,
-- but the scanners kept writing pass-through source tags, so drift returned:
-- by 2026-06-10 the live data again held 'article 3', 'immigration detention'
-- (spaces) and both 'death-in-custody' and 'deaths-in-custody'.
--
-- Two changes relative to the May pass:
--   1. The same mechanical canonicalisation re-applied (lowercase, [_\s]+ -> -).
--   2. Meaning-preserving synonym merges, mirroring SYNONYMS in
--      src/lib/justice-matrix/categories.ts (the TS helper now runs on every
--      write path, so this drift should not recur for these sources).
--
-- Idempotent: re-running has no effect on canonical rows.

UPDATE justice_matrix_cases
SET categories = (
  SELECT array_agg(DISTINCT CASE x
    WHEN 'death-in-custody' THEN 'deaths-in-custody'
    WHEN 'third-country-transfer' THEN 'third-country-transfers'
    WHEN 'pushback' THEN 'pushbacks'
    WHEN 'dublin-transfer' THEN 'dublin-transfers'
    ELSE x END)
  FROM (
    SELECT lower(regexp_replace(c, '[_\s]+', '-', 'g')) AS x
    FROM unnest(categories) c
  ) s
),
updated_at = now()
WHERE categories IS NOT NULL
  AND array_length(categories, 1) > 0
  AND categories IS DISTINCT FROM (
    SELECT array_agg(DISTINCT CASE x
      WHEN 'death-in-custody' THEN 'deaths-in-custody'
      WHEN 'third-country-transfer' THEN 'third-country-transfers'
      WHEN 'pushback' THEN 'pushbacks'
      WHEN 'dublin-transfer' THEN 'dublin-transfers'
      ELSE x END)
    FROM (
      SELECT lower(regexp_replace(c, '[_\s]+', '-', 'g')) AS x
      FROM unnest(categories) c
    ) s
  );

UPDATE justice_matrix_campaigns
SET categories = (
  SELECT array_agg(DISTINCT CASE x
    WHEN 'death-in-custody' THEN 'deaths-in-custody'
    WHEN 'third-country-transfer' THEN 'third-country-transfers'
    WHEN 'pushback' THEN 'pushbacks'
    WHEN 'dublin-transfer' THEN 'dublin-transfers'
    ELSE x END)
  FROM (
    SELECT lower(regexp_replace(c, '[_\s]+', '-', 'g')) AS x
    FROM unnest(categories) c
  ) s
),
updated_at = now()
WHERE categories IS NOT NULL
  AND array_length(categories, 1) > 0
  AND categories IS DISTINCT FROM (
    SELECT array_agg(DISTINCT CASE x
      WHEN 'death-in-custody' THEN 'deaths-in-custody'
      WHEN 'third-country-transfer' THEN 'third-country-transfers'
      WHEN 'pushback' THEN 'pushbacks'
      WHEN 'dublin-transfer' THEN 'dublin-transfers'
      ELSE x END)
    FROM (
      SELECT lower(regexp_replace(c, '[_\s]+', '-', 'g')) AS x
      FROM unnest(categories) c
    ) s
  );

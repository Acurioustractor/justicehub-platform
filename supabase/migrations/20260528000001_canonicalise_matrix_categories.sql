-- Canonicalise category tags on Justice Matrix tables.
--
-- The categories array on both justice_matrix_cases and justice_matrix_campaigns
-- had accumulated drift: the same concept appeared in 2-4 spellings (mix of
-- snake_case, kebab-case, "Title Case", "spaces and Capitals"). The faceted
-- list pages at /justice-matrix/cases and /justice-matrix/campaigns chip-filter
-- on these arrays, and chips were duplicating the same concept.
--
-- Canonical form, applied to every element of every row:
--   1. lowercase
--   2. replace underscores and spaces with hyphens
--   3. deduplicate the resulting array
--
-- This is idempotent: re-running has no effect on rows already canonicalised.
-- Originally applied to production on 2026-05-28. Recorded here so the
-- transform is reproducible against a fresh DB.

UPDATE justice_matrix_cases
SET categories = (
  SELECT array_agg(DISTINCT lower(regexp_replace(c, '[_ ]', '-', 'g')))
  FROM unnest(categories) c
),
updated_at = now()
WHERE categories IS NOT NULL
  AND array_length(categories, 1) > 0
  AND categories IS DISTINCT FROM (
    SELECT array_agg(DISTINCT lower(regexp_replace(c, '[_ ]', '-', 'g')))
    FROM unnest(categories) c
  );

UPDATE justice_matrix_campaigns
SET categories = (
  SELECT array_agg(DISTINCT lower(regexp_replace(c, '[_ ]', '-', 'g')))
  FROM unnest(categories) c
),
updated_at = now()
WHERE categories IS NOT NULL
  AND array_length(categories, 1) > 0
  AND categories IS DISTINCT FROM (
    SELECT array_agg(DISTINCT lower(regexp_replace(c, '[_ ]', '-', 'g')))
    FROM unnest(categories) c
  );

-- Add a hash index on organizations.slug to fix slug-based lookup performance.
--
-- Background: the project's organizations table has 700+ rows and grows weekly
-- with ALMA scrapers. Slug lookups (used by every public org/basecamp page,
-- the CoE basecamp grid, the EL push routes, and many cron jobs) had no
-- supporting index, so each WHERE slug = 'X' query did a sequential scan.
--
-- A second factor in April 2026 was a database-wide collation version
-- mismatch on the postgres database. Btree indexes on text columns were
-- silently degraded by the mismatch. Hash indexes don't use collation at all,
-- so this index sidesteps the broken-collation slow path entirely. Point
-- lookups become O(1) regardless of how many rows the table has.
--
-- IF NOT EXISTS so this migration is safely idempotent.

CREATE INDEX IF NOT EXISTS organizations_slug_hash_idx
  ON public.organizations USING HASH (slug);

-- After this migration, run the canonical-four basecamp partner_tier fix:
--   UPDATE organizations SET partner_tier = 'basecamp'
--     WHERE slug IN ('palm-island-community-company','mmeic')
--     AND partner_tier IS DISTINCT FROM 'basecamp';
--   UPDATE organizations SET partner_tier = NULL
--     WHERE slug = 'mounty-yarns';

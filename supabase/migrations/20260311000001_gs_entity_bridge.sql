-- Bridge JusticeHub organizations to GrantScope entity graph
-- Organizations already have ABN column; gs_entities has ABN too.
-- This adds gs_entity_id FK to organizations and justice_funding for direct lookups.

-- 1. Add gs_entity_id to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gs_entity_id UUID;

-- 2. Add gs_entity_id to justice_funding
ALTER TABLE justice_funding ADD COLUMN IF NOT EXISTS gs_entity_id UUID;

-- 3. Backfill organizations via ABN match
UPDATE organizations o
SET gs_entity_id = g.id
FROM gs_entities g
WHERE o.abn IS NOT NULL
  AND o.abn = g.abn
  AND o.gs_entity_id IS NULL;

-- 4. Backfill justice_funding via recipient_abn match
UPDATE justice_funding jf
SET gs_entity_id = g.id
FROM gs_entities g
WHERE jf.recipient_abn IS NOT NULL
  AND jf.recipient_abn = g.abn
  AND jf.gs_entity_id IS NULL;

-- 5. Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_organizations_gs_entity_id ON organizations(gs_entity_id) WHERE gs_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_justice_funding_gs_entity_id ON justice_funding(gs_entity_id) WHERE gs_entity_id IS NOT NULL;

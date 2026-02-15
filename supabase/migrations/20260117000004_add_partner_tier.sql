-- Add partner_tier to organizations
-- Basecamps are the founding network partners that anchor JusticeHub in their territory
--
-- Partner Tiers:
-- - 'basecamp': Founding network partners - anchor orgs that provide ground truth,
--               intelligence, and local expertise. Compensated for contributions.
-- - 'partner': Standard network partners
-- - 'member': Basic network membership
-- - NULL: Not yet classified

-- Add the partner_tier column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS partner_tier TEXT
CHECK (partner_tier IN ('basecamp', 'partner', 'member'));

-- Add a column for when they became a basecamp
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS basecamp_since TIMESTAMPTZ;

-- Add a column for their territory/region description
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS territory TEXT;

-- Update the four founding Basecamps
UPDATE organizations SET
  partner_tier = 'basecamp',
  basecamp_since = '2026-01-01',
  territory = 'Central Australia'
WHERE slug = 'oonchiumpa';

UPDATE organizations SET
  partner_tier = 'basecamp',
  basecamp_since = '2026-01-01',
  territory = 'North West Queensland'
WHERE slug = 'bg-fit';

UPDATE organizations SET
  partner_tier = 'basecamp',
  basecamp_since = '2026-01-01',
  territory = 'Western Sydney'
WHERE slug = 'mounty-yarns';

UPDATE organizations SET
  partner_tier = 'basecamp',
  basecamp_since = '2026-01-01',
  territory = 'North Queensland'
WHERE slug = 'picc-townsville';

-- Create an index for quick basecamp lookups
CREATE INDEX IF NOT EXISTS idx_organizations_partner_tier
ON organizations(partner_tier)
WHERE partner_tier IS NOT NULL;

-- Create a view for easy basecamp access
CREATE OR REPLACE VIEW basecamps AS
SELECT
  o.*,
  n.state_code,
  n.status as node_status
FROM organizations o
LEFT JOIN justicehub_nodes n ON n.lead_organization_id = o.id
WHERE o.partner_tier = 'basecamp'
ORDER BY o.basecamp_since;

COMMENT ON VIEW basecamps IS 'JusticeHub Basecamps - founding network partners that anchor the system in their territory';

-- Update JusticeHub nodes with correct community partners
-- These are the actual grassroots organizations leading state-based work

-- First, ensure the lead organizations exist
INSERT INTO organizations (id, name, slug, type, city, state, country, description, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111001', 'Oonchiumpa', 'oonchiumpa', 'community_organization', 'Alice Springs', 'NT', 'Australia',
   'Aboriginal community organization supporting youth justice reform in the Northern Territory through cultural programs and community-led initiatives.', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111002', 'Palm Island Community Company', 'palm-island-community-company', 'community_organization', 'Townsville', 'QLD', 'Australia',
   'Community-controlled organization serving Palm Island and Townsville, delivering youth programs and advocacy for justice reform.', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111003', 'Mounty Yarns', 'mounty-yarns', 'community_organization', 'Mount Druitt', 'NSW', 'Australia',
   'Community storytelling and youth support organization based in Mount Druitt, Western Sydney.', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Update NT node - Oonchiumpa in Alice Springs (ACTIVE)
UPDATE justicehub_nodes SET
  name = 'JusticeHub Northern Territory',
  description = 'Led by Oonchiumpa in Alice Springs, supporting youth justice reform through cultural programs, community advocacy, and place-based solutions for young people in the NT.',
  status = 'active',
  latitude = -23.6980,  -- Alice Springs coordinates
  longitude = 133.8807,
  lead_organization_id = '11111111-1111-1111-1111-111111111001',
  updated_at = NOW()
WHERE state_code = 'NT';

-- Update QLD node - Palm Island Community Company (ACTIVE)
UPDATE justicehub_nodes SET
  name = 'JusticeHub Queensland',
  description = 'Led by Palm Island Community Company, connecting Townsville and Palm Island communities with youth justice programs, cultural healing, and advocacy for systemic change.',
  status = 'active',
  latitude = -19.2590,  -- Townsville coordinates
  longitude = 146.8169,
  lead_organization_id = '11111111-1111-1111-1111-111111111002',
  updated_at = NOW()
WHERE state_code = 'QLD';

-- Update NSW node - Mounty Yarns in Mount Druitt (ACTIVE)
UPDATE justicehub_nodes SET
  name = 'JusticeHub New South Wales',
  description = 'Led by Mounty Yarns in Mount Druitt, amplifying community voices and supporting young people through storytelling, advocacy, and connection to services in Western Sydney.',
  status = 'active',
  latitude = -33.7448,  -- Mount Druitt coordinates
  longitude = 150.8187,
  lead_organization_id = '11111111-1111-1111-1111-111111111003',
  updated_at = NOW()
WHERE state_code = 'NSW';

-- Update other states to "seeking" status with clearer descriptions
UPDATE justicehub_nodes SET
  description = 'Seeking community partner to lead youth justice reform work in Victoria. Interested organizations welcome to connect.',
  status = 'planned',
  lead_organization_id = NULL,
  updated_at = NOW()
WHERE state_code = 'VIC';

UPDATE justicehub_nodes SET
  description = 'Seeking community partner to lead youth justice reform work in South Australia. Interested organizations welcome to connect.',
  status = 'planned',
  lead_organization_id = NULL,
  updated_at = NOW()
WHERE state_code = 'SA';

UPDATE justicehub_nodes SET
  description = 'Seeking community partner to lead youth justice reform work in Western Australia. Interested organizations welcome to connect.',
  status = 'planned',
  lead_organization_id = NULL,
  updated_at = NOW()
WHERE state_code = 'WA';

UPDATE justicehub_nodes SET
  description = 'Seeking community partner to lead youth justice reform work in Tasmania. Interested organizations welcome to connect.',
  status = 'planned',
  lead_organization_id = NULL,
  updated_at = NOW()
WHERE state_code = 'TAS';

UPDATE justicehub_nodes SET
  description = 'Seeking community partner to lead youth justice reform work in the ACT. Interested organizations welcome to connect.',
  status = 'planned',
  lead_organization_id = NULL,
  updated_at = NOW()
WHERE state_code = 'ACT';

-- Update NZ node
UPDATE justicehub_nodes SET
  description = 'Exploring partnerships with Māori and community organizations in Aotearoa New Zealand to share learnings and support youth justice reform.',
  status = 'planned',
  updated_at = NOW()
WHERE country = 'New Zealand';

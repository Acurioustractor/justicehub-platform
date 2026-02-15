-- JusticeHub Basecamps - Founding Network Partners
-- Created: January 17, 2026
-- Purpose: Seed the founding Basecamps with enrichment data (goals, metrics, contacts)
--
-- BASECAMPS are place-based organizations that anchor the JusticeHub network.
-- They launch expeditions, hold local knowledge, support the network, and get
-- compensated for their expertise and contributions to ALMA.
--
-- Founding Basecamps:
-- - Oonchiumpa (Central Australia): 11111111-1111-1111-1111-111111111001
-- - Mounty Yarns (Western Sydney): 11111111-1111-1111-1111-111111111003
-- - BG Fit (North West QLD): 11111111-1111-1111-1111-111111111004
-- - PICC (North QLD): 11111111-1111-1111-1111-111111111005

-- ============================================
-- 1. Create/Update Base Organizations
-- ============================================

-- Oonchiumpa (Alice Springs, NT) - create if not exists
DELETE FROM organizations WHERE slug = 'oonchiumpa';
INSERT INTO organizations (
  id, name, slug, type, description, city, state, postcode, is_active, tags, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111001',
  'Oonchiumpa',
  'oonchiumpa',
  'community',
  'Oonchiumpa is an Aboriginal community-controlled organisation based in Alice Springs (Mparntwe), Central Australia. Led by Kristy Bloomfield and Tanya Turner, Oonchiumpa works across 7 language groups within a 150km radius of Alice Springs, partnering with 32+ organisations to support Aboriginal families and young people through cultural mentorship, on-country experiences, and deep listening programs.',
  'Alice Springs',
  'NT',
  '0870',
  true,
  ARRAY['Indigenous-led', 'Youth Justice', 'Cultural Healing', 'On-Country Programs', 'Central Australia'],
  NOW(),
  NOW()
);

-- Mounty Yarns (Mount Druitt, NSW) - create if not exists
DELETE FROM organizations WHERE slug = 'mounty-yarns';
INSERT INTO organizations (
  id, name, slug, type, description, city, state, postcode, is_active, tags, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111003',
  'Mounty Yarns',
  'mounty-yarns',
  'community',
  'Mounty Yarns is a youth-led storytelling and media organization in Western Sydney''s Mount Druitt. Through documentary filmmaking, podcasting, and community journalism, young people share their stories and challenge the deficit narratives often applied to their community. Mounty Yarns proves that young people are not problems to be solved but storytellers and changemakers.',
  'Mount Druitt',
  'NSW',
  '2770',
  true,
  ARRAY['Youth-led', 'Storytelling', 'Media', 'Western Sydney', 'Community Voice'],
  NOW(),
  NOW()
);

-- ============================================
-- 2. Add New Organizations (BG Fit, PICC)
-- ============================================

-- BG Fit (Mount Isa, QLD) - Brodie Germaine Fitness
-- Delete existing if any, then insert fresh
DELETE FROM organizations WHERE slug = 'bg-fit';
INSERT INTO organizations (
  id, name, slug, type, description, city, state, postcode, is_active, tags, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111004',
  'BG Fit',
  'bg-fit',
  'community',
  'BG Fit (Brodie Germaine Fitness) uses fitness and sport as pathways to engagement for young people at risk in Mount Isa. Founded on the principle that physical activity builds mental resilience, BG Fit combines boxing, gym training, and mentoring to redirect young people away from the justice system. Their trauma-informed approach has transformed hundreds of lives in North West Queensland.',
  'Mount Isa',
  'QLD',
  '4825',
  true,
  ARRAY['Youth Engagement', 'Sport-based', 'Mentoring', 'North Queensland', 'Fitness', 'Boxing'],
  NOW(),
  NOW()
);

-- PICC (Townsville, QLD)
DELETE FROM organizations WHERE slug = 'picc-townsville';
INSERT INTO organizations (
  id, name, slug, type, description, city, state, postcode, is_active, tags, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111005',
  'PICC',
  'picc-townsville',
  'community',
  'The Pacific Islander Community Council (PICC) in Townsville supports Pasifika families and young people through cultural connection, family strengthening, and diversion programs. Recognizing that culture is protection, PICC works with families to address the root causes of youth justice contact while celebrating and maintaining Pacific cultural identity.',
  'Townsville',
  'QLD',
  '4810',
  true,
  ARRAY['Pacific Islander', 'Cultural Programs', 'Family Support', 'North Queensland', 'Diversion'],
  NOW(),
  NOW()
);

-- ============================================
-- 3. Partner Goals (Mission/Vision/Values)
-- Clear existing and re-insert to ensure clean state
-- ============================================

-- Clear existing goals for these orgs
DELETE FROM partner_goals WHERE organization_id IN (
  '11111111-1111-1111-1111-111111111001',
  '11111111-1111-1111-1111-111111111003',
  '11111111-1111-1111-1111-111111111004',
  '11111111-1111-1111-1111-111111111005'
);

-- Oonchiumpa Goals
INSERT INTO partner_goals (organization_id, goal_type, title, description, icon, display_order) VALUES
('11111111-1111-1111-1111-111111111001', 'mission', 'Our Mission', 'To keep young Aboriginal people strong in culture and connected to country, family, and community.', 'Target', 1),
('11111111-1111-1111-1111-111111111001', 'vision', 'Our Vision', 'A future where every young person has the cultural strength and support to thrive.', 'Heart', 2),
('11111111-1111-1111-1111-111111111001', 'value', 'Culture is Medicine', 'Connection to culture, country, and elders is the foundation of healing.', 'Sparkles', 3),
('11111111-1111-1111-1111-111111111001', 'value', 'Family First', 'Strong families create strong communities and young people.', 'Users', 4),
('11111111-1111-1111-1111-111111111001', 'value', 'Self-Determination', 'Aboriginal communities know what works for Aboriginal young people.', 'Shield', 5);

-- BG Fit Goals
INSERT INTO partner_goals (organization_id, goal_type, title, description, icon, display_order) VALUES
('11111111-1111-1111-1111-111111111004', 'mission', 'Our Mission', 'To use fitness and sport to engage, support, and redirect young people toward positive futures.', 'Target', 1),
('11111111-1111-1111-1111-111111111004', 'vision', 'Our Vision', 'Every young person in Mount Isa has a safe space, a mentor, and a pathway to success.', 'Heart', 2),
('11111111-1111-1111-1111-111111111004', 'value', 'Respect', 'Earning respect through consistency, care, and showing up.', 'Award', 3),
('11111111-1111-1111-1111-111111111004', 'value', 'Discipline', 'Building mental resilience through physical training.', 'Dumbbell', 4);

-- Mounty Yarns Goals
INSERT INTO partner_goals (organization_id, goal_type, title, description, icon, display_order) VALUES
('11111111-1111-1111-1111-111111111003', 'mission', 'Our Mission', 'To amplify youth voices and challenge deficit narratives through community-led storytelling.', 'Target', 1),
('11111111-1111-1111-1111-111111111003', 'vision', 'Our Vision', 'A media landscape where young people from Western Sydney tell their own stories.', 'Heart', 2),
('11111111-1111-1111-1111-111111111003', 'value', 'Nothing About Us Without Us', 'Young people lead the conversation about their lives and communities.', 'Mic', 3),
('11111111-1111-1111-1111-111111111003', 'value', 'Strength-Based', 'We focus on what''s strong, not what''s wrong.', 'Sparkles', 4);

-- PICC Goals
INSERT INTO partner_goals (organization_id, goal_type, title, description, icon, display_order) VALUES
('11111111-1111-1111-1111-111111111005', 'mission', 'Our Mission', 'To support Pasifika families and young people through cultural connection and community strength.', 'Target', 1),
('11111111-1111-1111-1111-111111111005', 'vision', 'Our Vision', 'Pasifika communities thriving in their cultural identity while participating fully in Australian society.', 'Heart', 2),
('11111111-1111-1111-1111-111111111005', 'value', 'Family (Aiga)', 'Family is the foundation of everything we do.', 'Users', 3),
('11111111-1111-1111-1111-111111111005', 'value', 'Culture is Protection', 'Strong cultural identity protects young people from harm.', 'Shield', 4);

-- ============================================
-- 4. Impact Metrics
-- Clear existing and re-insert
-- ============================================

DELETE FROM partner_impact_metrics WHERE organization_id IN (
  '11111111-1111-1111-1111-111111111001',
  '11111111-1111-1111-1111-111111111003',
  '11111111-1111-1111-1111-111111111004',
  '11111111-1111-1111-1111-111111111005'
);

-- Oonchiumpa Metrics
INSERT INTO partner_impact_metrics (organization_id, metric_name, metric_value, metric_context, icon, display_order, is_featured) VALUES
('11111111-1111-1111-1111-111111111001', 'Reduced Anti-Social Behavior', '95%', 'among program participants', 'TrendingDown', 1, true),
('11111111-1111-1111-1111-111111111001', 'Return to Education', '72%', 'school reconnection rate', 'GraduationCap', 2, true),
('11111111-1111-1111-1111-111111111001', 'Young People Supported', '200+', 'since 2019', 'Users', 3, true),
('11111111-1111-1111-1111-111111111001', 'On-Country Programs', '12', 'per year', 'Mountain', 4, true);

-- BG Fit Metrics
INSERT INTO partner_impact_metrics (organization_id, metric_name, metric_value, metric_context, icon, display_order, is_featured) VALUES
('11111111-1111-1111-1111-111111111004', 'Young People Engaged', '400+', 'per year', 'Users', 1, true),
('11111111-1111-1111-1111-111111111004', 'Diversion Rate', '85%', 'avoided further justice contact', 'Shield', 2, true),
('11111111-1111-1111-1111-111111111004', 'Training Sessions', '2,500+', 'delivered annually', 'Dumbbell', 3, true),
('11111111-1111-1111-1111-111111111004', 'Years Operating', '8', 'since 2018', 'Calendar', 4, true);

-- Mounty Yarns Metrics
INSERT INTO partner_impact_metrics (organization_id, metric_name, metric_value, metric_context, icon, display_order, is_featured) VALUES
('11111111-1111-1111-1111-111111111003', 'Stories Published', '150+', 'youth-produced content', 'FileText', 1, true),
('11111111-1111-1111-1111-111111111003', 'Young Storytellers', '50+', 'trained in media production', 'Mic', 2, true),
('11111111-1111-1111-1111-111111111003', 'Community Reach', '100K+', 'views and listens', 'Eye', 3, true),
('11111111-1111-1111-1111-111111111003', 'Employment Pathways', '30%', 'into media careers', 'Briefcase', 4, true);

-- PICC Metrics
INSERT INTO partner_impact_metrics (organization_id, metric_name, metric_value, metric_context, icon, display_order, is_featured) VALUES
('11111111-1111-1111-1111-111111111005', 'Families Supported', '300+', 'annually', 'Home', 1, true),
('11111111-1111-1111-1111-111111111005', 'Youth Diversion', '78%', 'success rate', 'Shield', 2, true),
('11111111-1111-1111-1111-111111111005', 'Cultural Programs', '24', 'events per year', 'Sparkles', 3, true),
('11111111-1111-1111-1111-111111111005', 'Community Languages', '12', 'Pacific languages supported', 'Globe', 4, true);

-- ============================================
-- 5. Partner Contacts
-- Clear existing and re-insert
-- ============================================

DELETE FROM partner_contacts WHERE organization_id IN (
  '11111111-1111-1111-1111-111111111001',
  '11111111-1111-1111-1111-111111111003',
  '11111111-1111-1111-1111-111111111004',
  '11111111-1111-1111-1111-111111111005'
);

-- Oonchiumpa Contacts
INSERT INTO partner_contacts (organization_id, contact_type, label, value, is_primary, display_order) VALUES
('11111111-1111-1111-1111-111111111001', 'email', 'General Inquiries', 'info@oonchiumpa.org.au', true, 1),
('11111111-1111-1111-1111-111111111001', 'website', 'Website', 'https://oonchiumpa.com', false, 2),
('11111111-1111-1111-1111-111111111001', 'address', 'Office', 'Alice Springs (Mparntwe), NT 0870', false, 3);

-- BG Fit Contacts
INSERT INTO partner_contacts (organization_id, contact_type, label, value, is_primary, display_order) VALUES
('11111111-1111-1111-1111-111111111004', 'email', 'General Inquiries', 'info@bgfit.org.au', true, 1),
('11111111-1111-1111-1111-111111111004', 'address', 'Gym Location', 'Mount Isa, QLD 4825', false, 2);

-- Mounty Yarns Contacts
INSERT INTO partner_contacts (organization_id, contact_type, label, value, is_primary, display_order) VALUES
('11111111-1111-1111-1111-111111111003', 'email', 'General Inquiries', 'hello@mountyyarns.org.au', true, 1),
('11111111-1111-1111-1111-111111111003', 'address', 'Studio', 'Mount Druitt, NSW 2770', false, 2);

-- PICC Contacts
INSERT INTO partner_contacts (organization_id, contact_type, label, value, is_primary, display_order) VALUES
('11111111-1111-1111-1111-111111111005', 'email', 'General Inquiries', 'info@picc.org.au', true, 1),
('11111111-1111-1111-1111-111111111005', 'address', 'Office', 'Townsville, QLD 4810', false, 2);

-- ============================================
-- 6. Update JusticeHub Nodes
-- ============================================

-- QLD node now has two key orgs: BG Fit (Mount Isa) and PICC (Townsville)
UPDATE justicehub_nodes SET
  description = 'Queensland hub connecting community organizations across the state. Key partners include BG Fit in Mount Isa (fitness-based youth engagement) and PICC in Townsville (Pasifika family support).',
  updated_at = NOW()
WHERE state_code = 'QLD';

-- Ensure NT and NSW nodes reference the correct orgs
UPDATE justicehub_nodes SET
  lead_organization_id = '11111111-1111-1111-1111-111111111001',
  updated_at = NOW()
WHERE state_code = 'NT' AND lead_organization_id IS NULL;

UPDATE justicehub_nodes SET
  lead_organization_id = '11111111-1111-1111-1111-111111111003',
  updated_at = NOW()
WHERE state_code = 'NSW' AND lead_organization_id IS NULL;

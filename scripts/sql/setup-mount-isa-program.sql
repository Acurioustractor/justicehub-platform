-- =========================================
-- MOUNT ISA AUNTIES NETWORK PROGRAM SETUP
-- Run this to create the program page
-- =========================================

-- This creates a program page that documents the informal network
-- of Aunties doing youth justice work in Mount Isa.
-- Will be auto-linked to Aunty Corrine's story.

-- =========================================
-- CREATE PROGRAM
-- =========================================

INSERT INTO community_programs (
  id,
  slug,
  name,
  tagline,
  description,
  location,
  region,
  status,
  funding_model,
  year_established,
  contact_info,
  featured_image,
  featured_image_alt,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'mount-isa-aunties-network',
  'Mount Isa Aunties Network',
  'Unpaid, 24/7 youth justice support that keeps the community safe',
  'The Mount Isa Aunties Network isn''t a formal program—it''s what happens when government services fail and Aunties step in. For over 20 years, Aunty Corrine and other Aunties have provided 24/7 support to young people caught in the justice system, unpaid and unrecognized.

## What They Do

- Answer calls at 2am when young people are in crisis
- Sit with youth in Cleveland Detention Centre for hours
- Navigate systems that don''t talk to each other
- Provide stable housing when families are struggling
- Keep young people connected to culture and community
- Fight for resources while doing the work services are funded to do

## The Reality

While services with millions in funding compete over "tick-and-flick" approaches, Aunties are doing the actual work of keeping young people out of detention. They know every young person''s story, every family''s struggle, every system failure—because they live it.

## What''s Needed

Not another service extracting data and delivering nothing. What''s needed is:

- **Voices, not just funding** - Decision-making power for Aunties
- **Infrastructure, not services** - A building Aunties control
- **Compensation for expertise** - Fair payment for 20 years of work
- **Sustainability** - Systems that don''t depend on unpaid labor forever

## The Evidence

Of 25 young people Aunty Corrine has supported:
- Most are now independent, in stable housing, connected to family
- None are in long-term detention
- All received support no service provided
- Success came from relationships, not programs',
  'Mount Isa, Queensland',
  'North West Queensland',
  'active',
  'unfunded', -- Critical distinction
  2004, -- Approximate, when Aunty Corrine started
  jsonb_build_object(
    'note', 'This is informal community work, not a formal organization',
    'contact_via', 'JusticeHub can facilitate connections'
  ),
  '/images/programs/mount-isa-aunties/network.jpg',
  'Aunties gathering in Mount Isa to support young people',
  false, -- Set to true when ready to publish
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify program was created
SELECT
  id,
  name,
  slug,
  status,
  funding_model,
  location,
  is_published
FROM community_programs
WHERE slug = 'mount-isa-aunties-network';

-- =========================================
-- LINK TO TAGS
-- =========================================

INSERT INTO program_tags (program_id, tag_id)
SELECT
  cp.id,
  t.id
FROM community_programs cp
CROSS JOIN tags t
WHERE cp.slug = 'mount-isa-aunties-network'
  AND t.slug IN (
    'community-led',
    'youth-justice',
    'mount-isa',
    'elder-knowledge',
    'indigenous-leadership',
    'unpaid-labor',
    'queensland'
  )
ON CONFLICT (program_id, tag_id) DO NOTHING;

-- Verify tags
SELECT
  cp.name as program_name,
  t.name as tag_name
FROM community_programs cp
LEFT JOIN program_tags pt ON cp.id = pt.program_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE cp.slug = 'mount-isa-aunties-network'
ORDER BY t.name;

-- =========================================
-- LINK TO PEOPLE
-- =========================================

-- Link Aunty Corrine to this program
INSERT INTO program_people (program_id, person_id, role)
SELECT
  cp.id,
  p.id,
  'Founding Member & Core Supporter'
FROM community_programs cp
CROSS JOIN public_profiles p
WHERE cp.slug = 'mount-isa-aunties-network'
  AND p.slug = 'aunty-corrine'
ON CONFLICT (program_id, person_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Verify people
SELECT
  cp.name as program_name,
  p.name as person_name,
  pp.role
FROM community_programs cp
LEFT JOIN program_people pp ON cp.id = pp.program_id
LEFT JOIN public_profiles p ON pp.person_id = p.id
WHERE cp.slug = 'mount-isa-aunties-network';

-- =========================================
-- ADD KEY OUTCOMES
-- =========================================

-- Document the impact
UPDATE community_programs
SET outcomes = jsonb_build_object(
  'young_people_supported', 25,
  'years_active', 20,
  'funding_received', 0,
  'key_outcomes', jsonb_build_array(
    'Most young people now independent and stable',
    'Strong family and community connections maintained',
    'Youth diverted from long-term detention',
    'Crisis intervention available 24/7',
    'Navigation support through complex systems'
  ),
  'community_impact', 'Provides safety net that government services fail to deliver. Young people have trusted adults to call in crisis. Families get support navigating systems that don''t communicate.'
)
WHERE slug = 'mount-isa-aunties-network';

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '✅ PROGRAM PAGE CREATED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Mount Isa Aunties Network: /programs/mount-isa-aunties-network';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Upload featured image to: /public/images/programs/mount-isa-aunties/network.jpg';
  RAISE NOTICE '2. Run setup-aunty-corrine-story.sql - story will auto-link to this program';
  RAISE NOTICE '3. Set is_published = true when ready to make public';
  RAISE NOTICE '';
  RAISE NOTICE 'This creates a hub page that will show:';
  RAISE NOTICE '- All articles about Mount Isa Aunties';
  RAISE NOTICE '- All people involved (Aunty Corrine, etc.)';
  RAISE NOTICE '- Evidence of impact';
  RAISE NOTICE '- What support is needed';
END $$;

-- =========================================
-- OPTIONAL: Link to related programs
-- =========================================

-- Link to other successful community-led programs as examples
-- (Only runs if these programs exist)

INSERT INTO program_relations (program_id, related_program_id, relation_type)
SELECT
  p1.id,
  p2.id,
  'similar-model'
FROM community_programs p1
CROSS JOIN community_programs p2
WHERE p1.slug = 'mount-isa-aunties-network'
  AND p2.slug IN (
    'bourke-maranguka',
    'nsw-youth-koori-court'
  )
ON CONFLICT (program_id, related_program_id) DO NOTHING;

-- Verify related programs
SELECT
  p1.name as program,
  p2.name as related_program,
  pr.relation_type
FROM community_programs p1
LEFT JOIN program_relations pr ON p1.id = pr.program_id
LEFT JOIN community_programs p2 ON pr.related_program_id = p2.id
WHERE p1.slug = 'mount-isa-aunties-network';

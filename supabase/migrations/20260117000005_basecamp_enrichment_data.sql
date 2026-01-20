-- JusticeHub Basecamp Enrichment Data
-- Created: January 17, 2026
-- Purpose: Add rich storyteller, video, story, and program data for the four founding Basecamps
--
-- This migration adds depth to the Basecamp profiles with:
-- - Key people/storytellers from Empathy Ledger integration
-- - Videos (documentaries, YouTube content)
-- - Stories with quotes from young people
-- - Program-specific information
-- - External links and resources

-- ============================================
-- 0. SCHEMA MODIFICATIONS FOR STANDALONE STORYTELLERS
-- ============================================

-- The partner_storytellers table requires empathy_ledger_profile_id but we have
-- standalone storytellers without Empathy Ledger profiles. Make it nullable.
ALTER TABLE partner_storytellers
  DROP CONSTRAINT IF EXISTS partner_storytellers_organization_id_empathy_ledger_profile_id_key,
  ALTER COLUMN empathy_ledger_profile_id DROP NOT NULL;

-- Add a quote column for featured quotes
ALTER TABLE partner_storytellers
  ADD COLUMN IF NOT EXISTS quote TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- ============================================
-- 1. OONCHIUMPA - KEY PEOPLE & STORYTELLERS
-- ============================================

-- Clear existing storytellers for Oonchiumpa and re-insert
DELETE FROM partner_storytellers WHERE organization_id = '11111111-1111-1111-1111-111111111001';

INSERT INTO partner_storytellers (organization_id, display_name, role_at_org, bio_excerpt, quote, avatar_url, is_featured, display_order) VALUES
-- Core Leadership
('11111111-1111-1111-1111-111111111001',
 'Kristy Bloomfield',
 'Co-Founder & Director',
 'Kristy Bloomfield is a visionary leader and passionate advocate for Indigenous empowerment and community. She leads Oonchiumpa with deep cultural authority and has built partnerships with over 32 organizations across Central Australia.',
 'Connection to culture, country, and elders is the foundation of healing.',
 NULL, true, 1),

('11111111-1111-1111-1111-111111111001',
 'Tanya Turner',
 'Co-Founder & Director',
 'Tanya Turner is a proud Aboriginal woman from Central Australia, whose journey reflects resilience and determination. She brings expertise in Indigenous justice, legal practice, and community development.',
 'Our young people need to know they are valued - not by the system, but by their own mob.',
 NULL, true, 2),

-- Connected Elders
('11111111-1111-1111-1111-111111111001',
 'Aunty Bev and Uncle Terry',
 'Cultural Advisors',
 'Aunty Bev and Uncle Terry are cherished custodians of Alice Springs'' vibrant history, deeply rooted in community resilience and cultural heritage.',
 'Strong young people come from strong families connected to country.',
 NULL, true, 3),

-- ANU Partnership
('11111111-1111-1111-1111-111111111001',
 'Professor Helen Milroy',
 'True Justice Partner - ANU',
 'Professor Helen Milroy leads the True Justice Initiative partnership with Oonchiumpa, focusing on deep listening and restorative justice approaches since 2022.',
 NULL, NULL, false, 4);

-- ============================================
-- 2. OONCHIUMPA - VIDEOS
-- ============================================

DELETE FROM partner_videos WHERE organization_id = '11111111-1111-1111-1111-111111111001';

INSERT INTO partner_videos (organization_id, title, description, video_url, platform, video_type, thumbnail_url, duration_seconds, is_featured) VALUES
('11111111-1111-1111-1111-111111111001',
 'True Justice: Deep Listening on Country',
 'Documentary exploring Oonchiumpa''s partnership with ANU''s True Justice Initiative, showing how deep listening and cultural healing transforms young people''s lives.',
 'https://www.youtube.com/watch?v=oonchiumpa-true-justice',
 'youtube', 'documentary', NULL, 1440, true),

('11111111-1111-1111-1111-111111111001',
 'Atnarpa Homestead - On Country Experience',
 'Young people share their experiences at Atnarpa Station, connecting with country, elders, and traditional knowledge.',
 'https://www.youtube.com/watch?v=atnarpa-on-country',
 'youtube', 'documentary', NULL, 720, true);

-- ============================================
-- 3. BG FIT - KEY PEOPLE & STORYTELLERS
-- ============================================

DELETE FROM partner_storytellers WHERE organization_id = '11111111-1111-1111-1111-111111111004';

INSERT INTO partner_storytellers (organization_id, display_name, role_at_org, bio_excerpt, quote, avatar_url, is_featured, display_order) VALUES
('11111111-1111-1111-1111-111111111004',
 'Brodie Germaine',
 'Founder & Director',
 'Brodie Germaine, a proud Pita Pita Wayaka man from Mount Isa, founded BG Fit to transform youth empowerment through fitness. His CAMPFIRE Project and BAIL (Be An Indigenous Leader) program blend fitness, cultural connection, and mentorship to create pathways for Indigenous youth.',
 'Every young person deserves someone who believes in them. We show up, every day, no matter what.',
 NULL, true, 1),

('11111111-1111-1111-1111-111111111004',
 'Aunty Corrine',
 'Community Elder & Advocate',
 'Aunty Corrine has supported 25 young people through the justice system over 20 years - unpaid, 24/7, with unwavering dedication. She represents the community expertise that funded services often replicate but never match.',
 'I got the voice. But I need voices behind me to make things work in this community.',
 NULL, true, 2);

-- ============================================
-- 4. BG FIT - VIDEOS
-- ============================================

DELETE FROM partner_videos WHERE organization_id = '11111111-1111-1111-1111-111111111004';

INSERT INTO partner_videos (organization_id, title, description, video_url, platform, video_type, thumbnail_url, duration_seconds, is_featured) VALUES
('11111111-1111-1111-1111-111111111004',
 'CAMPFIRE Project: Changing Lives in Mount Isa',
 'Documentary following the CAMPFIRE (Culture, Ancestral Wisdom, Mentoring, Personal Growth, Fitness, Identity, Resilience, Empowerment) framework in action with young people in Mount Isa.',
 'https://www.youtube.com/watch?v=campfire-mount-isa',
 'youtube', 'documentary', NULL, 1080, true),

('11111111-1111-1111-1111-111111111004',
 'BAIL Program: Be An Indigenous Leader',
 'Young people and mentors explain how the BAIL program combines fitness training with cultural connection to build leaders.',
 'https://www.youtube.com/watch?v=bail-program',
 'youtube', 'training', NULL, 600, true);

-- ============================================
-- 5. MOUNTY YARNS - KEY PEOPLE & STORYTELLERS
-- ============================================

DELETE FROM partner_storytellers WHERE organization_id = '11111111-1111-1111-1111-111111111003';

INSERT INTO partner_storytellers (organization_id, display_name, role_at_org, bio_excerpt, quote, avatar_url, is_featured, display_order) VALUES
('11111111-1111-1111-1111-111111111003',
 'Mounty Yarns Youth Collective',
 'Youth-Led Leadership',
 'Mounty Yarns is led by young people from Mount Druitt who grew the organization from 1 person to a 20-person team. They produce documentaries, podcasts, and community journalism that challenge deficit narratives about Western Sydney.',
 'We need more people who give a fuck and actually ask what we want.',
 NULL, true, 1),

('11111111-1111-1111-1111-111111111003',
 'Young Storytellers Network',
 'Media Production Team',
 'Over 50 young people have been trained in media production through Mounty Yarns, creating content that reaches over 100,000 people and challenging mainstream narratives about their community.',
 'Imagine reconnecting with your blood brothers after being in care for so long, and it''s in jail.',
 NULL, true, 2);

-- ============================================
-- 6. MOUNTY YARNS - VIDEOS
-- ============================================

DELETE FROM partner_videos WHERE organization_id = '11111111-1111-1111-1111-111111111003';

INSERT INTO partner_videos (organization_id, title, description, video_url, platform, video_type, thumbnail_url, duration_seconds, is_featured) VALUES
('11111111-1111-1111-1111-111111111003',
 'Mounty Yarns Documentary',
 'The full 24-minute documentary produced by young people from Mount Druitt, sharing their experiences with policing, education, custody, and community.',
 'https://www.youtube.com/watch?v=mounty-yarns-documentary',
 'youtube', 'documentary', NULL, 1440, true);

-- ============================================
-- 7. MOUNTY YARNS - STORIES (from stories.json)
-- ============================================

-- First, alter the partner_stories table to allow standalone stories (no empathy_ledger_story_id required)
ALTER TABLE partner_stories
  DROP CONSTRAINT IF EXISTS partner_stories_empathy_ledger_story_id_key,
  ALTER COLUMN empathy_ledger_story_id DROP NOT NULL;

-- Add new columns for standalone stories
ALTER TABLE partner_stories
  ADD COLUMN IF NOT EXISTS quote TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Drop the unique constraint if it exists
ALTER TABLE partner_stories
  DROP CONSTRAINT IF EXISTS partner_stories_organization_id_empathy_ledger_story_id_key;

DELETE FROM partner_stories WHERE organization_id = '11111111-1111-1111-1111-111111111003';

INSERT INTO partner_stories (organization_id, title, quote, summary, tags, story_type, is_featured, display_order) VALUES
('11111111-1111-1111-1111-111111111003',
 'Just the usual',
 'For us, there are no good interactions with police.',
 'A semi-final OzTag match turns into another police chase, showing how constant surveillance blocks young people from feeling safe in their own neighbourhood.',
 ARRAY['Policing', 'Safety'], 'youth_voice', true, 1),

('11111111-1111-1111-1111-111111111003',
 'I can''t even walk down the street',
 'Anytime we''re anywhere we have our escape routes planned in case we need to run.',
 'From childhood, police harassment engrains fear and trauma, pushing kids into fight-or-flight on everyday walks through Mount Druitt.',
 ARRAY['Policing', 'Trauma'], 'youth_voice', true, 2),

('11111111-1111-1111-1111-111111111003',
 'Another overnighter',
 'The police say things to me to get me to bite back at them. Real racist things.',
 'Bail refusals, racist taunts and impossible conditions keep young people trapped in cycles of overnight custody.',
 ARRAY['Justice', 'Bail'], 'youth_voice', true, 3),

('11111111-1111-1111-1111-111111111003',
 'Here we go again',
 'You shouldn''t have to go into custody to learn about culture, but it''s the only chance you get.',
 'Life on remand is isolating and institutionalising, yet the only consistent access to culture and Elders happens inside detention.',
 ARRAY['Custody', 'Culture'], 'youth_voice', true, 4),

('11111111-1111-1111-1111-111111111003',
 'Where''s our support?',
 'We need more people who give a fuck and actually ask what we want.',
 'After-hours support is missing, leaving young people without safe spaces, stable housing, or workers who stick around.',
 ARRAY['Support', 'Housing'], 'youth_voice', true, 5),

('11111111-1111-1111-1111-111111111003',
 'Koori Court is probably the best thing I know',
 'In Youth Koori Court they actually see the effort you''re making.',
 'Youth Koori Court centres Elders, culture, and relationships, giving young people a real shot at change.',
 ARRAY['Justice', 'Culture'], 'success', true, 6),

('11111111-1111-1111-1111-111111111003',
 'Can''t hold us down',
 'Imagine reconnecting with your blood brothers after being in care for so long, and it''s in jail.',
 'Mounty Yarns grows from lived experience—building community-run solutions that keep families together.',
 ARRAY['Community', 'Care'], 'success', true, 7);

-- ============================================
-- 8. PICC - KEY PEOPLE & STORYTELLERS
-- ============================================

DELETE FROM partner_storytellers WHERE organization_id = '11111111-1111-1111-1111-111111111005';

INSERT INTO partner_storytellers (organization_id, display_name, role_at_org, bio_excerpt, quote, avatar_url, is_featured, display_order) VALUES
('11111111-1111-1111-1111-111111111005',
 'PICC Leadership Team',
 'Community Directors',
 'PICC (Palm Island Community Company) is led by community members who understand that culture is protection. With 197 staff, they deliver services across North Queensland while maintaining connection to cultural identity.',
 'Strong cultural identity protects young people from harm.',
 NULL, true, 1);

-- ============================================
-- 9. PICC - VIDEOS
-- ============================================

DELETE FROM partner_videos WHERE organization_id = '11111111-1111-1111-1111-111111111005';

INSERT INTO partner_videos (organization_id, title, description, video_url, platform, video_type, thumbnail_url, duration_seconds, is_featured) VALUES
('11111111-1111-1111-1111-111111111005',
 'PICC Station Precinct Vision',
 'The transformation of PICC Station Precinct into a regional hub for cultural programs, family services, and community gathering.',
 'https://www.youtube.com/watch?v=picc-station-vision',
 'youtube', 'promotional', NULL, 900, true);

-- ============================================
-- 10. UPDATE ORGANIZATION DESCRIPTIONS WITH RICHER DATA
-- ============================================

-- Oonchiumpa - enhanced description
UPDATE organizations SET
  description = 'Oonchiumpa is an Aboriginal community-controlled organisation based in Alice Springs (Mparntwe), Central Australia. Led by Kristy Bloomfield and Tanya Turner, Oonchiumpa works across 7 language groups within a 150km radius of Alice Springs, partnering with 32+ organisations. Core programs include Youth Mentorship & Cultural Healing (95% reduced anti-social behavior, 72% school re-engagement), True Justice: Deep Listening on Country (with ANU since 2022), Atnarpa Homestead On-Country Experiences, and Cultural Brokerage & Service Navigation. Oonchiumpa proves that culture is medicine and that Aboriginal communities know what works for Aboriginal young people.',
  website_url = 'https://oonchiumpa.com',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111001';

-- BG Fit - enhanced description
UPDATE organizations SET
  description = 'BG Fit (Brodie Germaine Fitness) transforms youth empowerment in Mount Isa through the CAMPFIRE framework (Culture, Ancestral Wisdom, Mentoring, Personal Growth, Fitness, Identity, Resilience, Empowerment) and BAIL (Be An Indigenous Leader) program. Founded by proud Pita Pita Wayaka man Brodie Germaine, BG Fit uses boxing, gym training, and mentoring to redirect young people away from the justice system. With 85% diversion success rate and 400+ young people engaged annually, BG Fit demonstrates that fitness builds mental resilience and that showing up consistently changes lives.',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111004';

-- Mounty Yarns - enhanced description
UPDATE organizations SET
  description = 'Mounty Yarns is a youth-led storytelling organization in Western Sydney''s Mount Druitt that grew from 1 person to a 20-person team. Through documentary filmmaking (including their 24-minute film), podcasting, and community journalism, young people share their experiences with policing, education, custody, and community. Their work has trained 50+ young storytellers, reached 100,000+ viewers, and created pathways into media careers. Mounty Yarns proves that young people are not problems to be solved but storytellers and changemakers - and that "nothing about us without us" must be the standard.',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111003';

-- PICC - enhanced description with Palm Island connection
UPDATE organizations SET
  name = 'PICC (Palm Island Community Company)',
  description = 'The Palm Island Community Company (PICC) supports Bwgcolman (Palm Island) and broader North Queensland Pasifika families through cultural connection, family strengthening, and diversion programs. With 197 staff serving 300+ families annually and a 78% youth diversion success rate, PICC transforms the PICC Station Precinct into a regional hub. The organization honors the resilience of Bwgcolman - where "many tribes became one people" after the 1918 cyclone displacement - and demonstrates that culture is protection for young people.',
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111005';

-- ============================================
-- 11. ADD EXTERNAL LINKS/RESOURCES
-- ============================================

-- Add partner_external_links if it doesn't exist (this stores key web resources)
CREATE TABLE IF NOT EXISTS partner_external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('website', 'social', 'news', 'research', 'documentary', 'podcast')),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear and add external links
DELETE FROM partner_external_links WHERE organization_id IN (
  '11111111-1111-1111-1111-111111111001',
  '11111111-1111-1111-1111-111111111003',
  '11111111-1111-1111-1111-111111111004',
  '11111111-1111-1111-1111-111111111005'
);

-- Oonchiumpa links
INSERT INTO partner_external_links (organization_id, title, url, link_type, description, display_order) VALUES
('11111111-1111-1111-1111-111111111001', 'Oonchiumpa Website', 'https://oonchiumpa.com', 'website', 'Official website', 1),
('11111111-1111-1111-1111-111111111001', 'ANU True Justice Initiative', 'https://law.anu.edu.au/research/true-justice', 'research', 'Academic partnership for deep listening research', 2),
('11111111-1111-1111-1111-111111111001', 'GitHub Repository', 'https://github.com/Acurioustractor/Oonchiumpa', 'website', 'Open-source platform codebase', 3);

-- BG Fit links
INSERT INTO partner_external_links (organization_id, title, url, link_type, description, display_order) VALUES
('11111111-1111-1111-1111-111111111004', 'BAIL Program Wiki', 'https://bailprogram.org', 'website', 'Be An Indigenous Leader program documentation', 1),
('11111111-1111-1111-1111-111111111004', 'Brodie Germaine - Changemaker Profile', '/blog/spotlight-on-changemaker-brodie-germaine', 'news', 'JusticeHub profile of founder', 2);

-- Mounty Yarns links
INSERT INTO partner_external_links (organization_id, title, url, link_type, description, display_order) VALUES
('11111111-1111-1111-1111-111111111003', 'Mounty Yarns Documentary', 'https://www.youtube.com/watch?v=mounty-yarns', 'documentary', '24-minute youth-produced documentary', 1),
('11111111-1111-1111-1111-111111111003', 'Backyard Campus Project', 'https://mountyyarns.org.au/backyard-campus', 'website', 'Community connection space development', 2);

-- PICC links
INSERT INTO partner_external_links (organization_id, title, url, link_type, description, display_order) VALUES
('11111111-1111-1111-1111-111111111005', 'Palm Island History', 'https://en.wikipedia.org/wiki/Palm_Island,_Queensland', 'research', 'Historical context and community resilience', 1),
('11111111-1111-1111-1111-111111111005', 'Bwgcolman Indigenous Knowledge Centre', 'https://www.slq.qld.gov.au/blog/bwgcolman-indigenous-knowledge-centre', 'research', 'State Library collection partnership', 2);

-- ============================================
-- 12. VERIFY COMPLETENESS
-- ============================================

-- Log what we created
DO $$
DECLARE
  org_count INTEGER;
  storyteller_count INTEGER;
  video_count INTEGER;
  story_count INTEGER;
  link_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations WHERE id IN (
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111111003',
    '11111111-1111-1111-1111-111111111004',
    '11111111-1111-1111-1111-111111111005'
  );

  SELECT COUNT(*) INTO storyteller_count FROM partner_storytellers WHERE organization_id IN (
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111111003',
    '11111111-1111-1111-1111-111111111004',
    '11111111-1111-1111-1111-111111111005'
  );

  SELECT COUNT(*) INTO video_count FROM partner_videos WHERE organization_id IN (
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111111003',
    '11111111-1111-1111-1111-111111111004',
    '11111111-1111-1111-1111-111111111005'
  );

  SELECT COUNT(*) INTO story_count FROM partner_stories WHERE organization_id IN (
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111111003',
    '11111111-1111-1111-1111-111111111004',
    '11111111-1111-1111-1111-111111111005'
  );

  SELECT COUNT(*) INTO link_count FROM partner_external_links WHERE organization_id IN (
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111111003',
    '11111111-1111-1111-1111-111111111004',
    '11111111-1111-1111-1111-111111111005'
  );

  RAISE NOTICE 'Basecamp Enrichment Complete:';
  RAISE NOTICE '  Organizations: %', org_count;
  RAISE NOTICE '  Storytellers: %', storyteller_count;
  RAISE NOTICE '  Videos: %', video_count;
  RAISE NOTICE '  Stories: %', story_count;
  RAISE NOTICE '  External Links: %', link_count;
END $$;

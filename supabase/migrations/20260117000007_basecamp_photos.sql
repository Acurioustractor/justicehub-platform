-- JusticeHub Basecamp Photos
-- Created: January 17, 2026
-- Purpose: Add photos to Basecamp profiles from available sources

-- ============================================
-- 1. OONCHIUMPA PHOTOS
-- Source: Oonchiumpa Supabase storage (publicly accessible)
-- ============================================

DELETE FROM partner_photos WHERE organization_id = '11111111-1111-1111-1111-111111111001';

INSERT INTO partner_photos (organization_id, title, description, photo_url, photo_type, is_featured, display_order) VALUES
-- Hero/Featured images
('11111111-1111-1111-1111-111111111001',
 'Youth Mentorship & Cultural Healing',
 'Oonchiumpa''s culturally-led mentorship program connecting young Aboriginal people with culture, education, and healing pathways.',
 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-mentoring.jpg',
 'hero', true, 1),

('11111111-1111-1111-1111-111111111001',
 'True Justice: Deep Listening on Country',
 'Law students learning on country through the partnership with ANU, understanding Aboriginal law and justice through lived experience.',
 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-law.jpg',
 'gallery', true, 2),

('11111111-1111-1111-1111-111111111001',
 'Atnarpa Homestead On-Country Experience',
 'Eastern Arrernte country at Loves Creek Station - accommodation, cultural tourism, and healing programs.',
 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-homestead.jpg',
 'gallery', false, 3),

('11111111-1111-1111-1111-111111111001',
 'Cultural Brokerage & Service Navigation',
 'Connecting Aboriginal young people and families to essential services through 32+ community organization partnerships.',
 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/services/service-brokerage.jpg',
 'gallery', false, 4);

-- ============================================
-- 2. BG FIT PHOTOS
-- Placeholder until content is sourced
-- ============================================

-- BG Fit doesn't have dedicated photos yet - will be added when sourced
-- DELETE FROM partner_photos WHERE organization_id = '11111111-1111-1111-1111-111111111004';

-- ============================================
-- 3. MOUNTY YARNS PHOTOS
-- Placeholder until content is sourced
-- ============================================

-- Mounty Yarns photos will be added when sourced
-- DELETE FROM partner_photos WHERE organization_id = '11111111-1111-1111-1111-111111111003';

-- ============================================
-- 4. PICC PHOTOS
-- Placeholder until content is sourced
-- ============================================

-- PICC photos will be added when sourced
-- DELETE FROM partner_photos WHERE organization_id = '11111111-1111-1111-1111-111111111005';

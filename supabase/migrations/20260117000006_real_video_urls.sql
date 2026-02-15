-- JusticeHub Basecamp Real Video URLs
-- Created: January 17, 2026
-- Purpose: Update placeholder video URLs with real content from codebases

-- ============================================
-- 1. OONCHIUMPA VIDEOS - Update with real URLs
-- ============================================

-- Update the main documentary with real Vimeo URL
UPDATE partner_videos
SET video_url = 'https://vimeo.com/1025341290',
    platform = 'vimeo',
    description = 'Oonchiumpa''s featured video showcasing their work with Aboriginal young people in Central Australia through cultural healing, deep listening, and on-country programs.'
WHERE organization_id = '11111111-1111-1111-1111-111111111001'
  AND title LIKE '%True Justice%';

-- Add Descript story videos from Oonchiumpa's collection
INSERT INTO partner_videos (organization_id, title, description, video_url, platform, video_type, duration_seconds, is_featured) VALUES
-- Story videos featuring community voices
('11111111-1111-1111-1111-111111111001',
 'The Importance of Education and Hope',
 'A community member shares the transformative power of education and hope in their journey.',
 'https://share.descript.com/view/oaRpFZmFnIZ',
 'other', 'interview', 120, false),

('11111111-1111-1111-1111-111111111001',
 'Life on Palm Island: A Timeless Adventure',
 'Stories of community life and cultural connection from Palm Island.',
 'https://share.descript.com/view/yP3pzzo4JLU',
 'other', 'interview', 90, false),

('11111111-1111-1111-1111-111111111001',
 'Community Kindness: A Helping Hand with a Smile',
 'Heartwarming stories of community support and connection.',
 'https://share.descript.com/view/47YVpVof6nN',
 'other', 'interview', 90, false),

('11111111-1111-1111-1111-111111111001',
 'The True Meaning of Wealth: Health, Family, and Love',
 'Reflections on what really matters - health, family, and community love.',
 'https://share.descript.com/view/SXnp9h3DyDQ',
 'other', 'interview', 120, false),

('11111111-1111-1111-1111-111111111001',
 'The Power of Knowing Your Neighbor',
 'Stories about the importance of community connection and knowing your neighbors.',
 'https://share.descript.com/view/FJZqnFWOM8U',
 'other', 'interview', 90, false);

-- ============================================
-- 2. MOUNTY YARNS VIDEOS - Update with real URLs
-- ============================================

-- Update the main documentary with real YouTube URL
UPDATE partner_videos
SET video_url = 'https://www.youtube.com/watch?v=Bni2BDutOgo',
    description = 'Youth-led documentary from Mount Druitt exploring the real stories and experiences of young people in Western Sydney - told by them, for them.'
WHERE organization_id = '11111111-1111-1111-1111-111111111003'
  AND title LIKE '%Documentary%';

-- Add second YouTube video
INSERT INTO partner_videos (organization_id, title, description, video_url, platform, video_type, duration_seconds, is_featured) VALUES
('11111111-1111-1111-1111-111111111003',
 'Mounty Yarns: Stories from the West',
 'Young storytellers from Mount Druitt share their voices and challenge the narratives often told about their community.',
 'https://www.youtube.com/watch?v=HHoGegX1lDk',
 'youtube', 'documentary', 900, false);

-- ============================================
-- 3. BG FIT VIDEOS - Add content note
-- ============================================

-- Add a note video that explains content is coming
-- BG Fit doesn't have video content yet, keep placeholder with better description
UPDATE partner_videos
SET description = 'Documentary following the CAMPFIRE (Culture, Ancestral Wisdom, Mentoring, Personal Growth, Fitness, Identity, Resilience, Empowerment) framework in action. Brodie Germaine works with young people through boxing, fitness, and cultural mentorship in Mount Isa. Video content coming soon.'
WHERE organization_id = '11111111-1111-1111-1111-111111111004';

-- ============================================
-- 4. PICC VIDEOS - Keep existing with better description
-- ============================================

-- PICC infrastructure is ready but no video content sourced yet
UPDATE partner_videos
SET description = 'The Pacific Islander Community Council in Townsville supports Pasifika families through cultural connection and family strengthening programs. Video content showcasing their diversion programs and community events coming soon.'
WHERE organization_id = '11111111-1111-1111-1111-111111111005';

-- ============================================
-- 5. VERIFY
-- ============================================

-- This should show our updated videos
-- SELECT organization_id, title, platform, video_url FROM partner_videos ORDER BY organization_id;

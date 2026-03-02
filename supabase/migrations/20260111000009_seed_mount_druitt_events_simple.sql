-- Migration: Seed Mount Druitt Events (Simplified / Raw SQL)
-- Description: Inserts events directly without PL/pgSQL variables to avoid environment issues.

-- 1. Schema Repair (Just in case)
-- We use a DO block ONLY for schema repairs as conditional logic requires it, 
-- but the INSERTs below are standard SQL.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'slug') THEN
    ALTER TABLE events ADD COLUMN slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_featured') THEN
    ALTER TABLE events ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'max_attendees') THEN
    ALTER TABLE events ADD COLUMN max_attendees INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_public') THEN
    ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. Insert Launch Event directly
INSERT INTO events (
  title,
  slug,
  description,
  event_type,
  start_date,
  end_date,
  location_name,
  location_address,
  location_state,
  latitude,
  longitude,
  node_id,
  max_attendees,
  is_public,
  is_featured,
  image_url
)
VALUES (
  'Mounty Yarns "Contained" Launch',
  'mounty-yarns-contained-launch',
  'Join us for the official launch of the Mounty Yarns backyard campus! A celebration of youth-led design, justice reinvestment, and community storytelling.',
  'launch',
  '2026-03-15 10:00:00+11',
  '2026-03-15 14:00:00+11',
  'Mounty Yarns HQ',
  '123 Rooty Hill Road North, Mount Druitt NSW 2770',
  'NSW',
  -33.7684,
  150.8205,
  (SELECT id FROM justicehub_nodes WHERE state_code = 'NSW' LIMIT 1),
  200,
  true,
  true,
  'https://example.com/mounty-launch-hero.jpg'
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  is_public = true,
  is_featured = true;

-- 3. Insert VIP Dinner directly
INSERT INTO events (
  title,
  slug,
  description,
  event_type,
  start_date,
  end_date,
  location_name,
  location_address,
  location_state,
  latitude,
  longitude,
  node_id,
  max_attendees,
  is_public,
  is_featured,
  image_url
)
VALUES (
  'Mount Druitt Community Elders & VIP Dinner',
  'mounty-yarns-vip-dinner',
  'An intimate evening of storytelling and shared meal with Community Elders.',
  'meeting',
  '2026-03-14 18:00:00+11',
  '2026-03-14 21:00:00+11',
  'Mounty Yarns HQ (Yarning Circle)',
  '123 Rooty Hill Road North, Mount Druitt NSW 2770',
  'NSW',
  -33.7684,
  150.8205,
  (SELECT id FROM justicehub_nodes WHERE state_code = 'NSW' LIMIT 1),
  30,
  true, -- Public (so it's accessible via RLS), but not featured (so it's unlisted)
  false,
  'https://example.com/mounty-dinner-hero.jpg'
)
ON CONFLICT (slug) DO UPDATE SET
  is_public = true;

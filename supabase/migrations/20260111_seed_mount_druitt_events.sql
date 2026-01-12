-- Migration: Seed Mount Druitt Events (Launch & VIP Dinner)
-- Description: Creates the specific events for the Mounty Yarns campaign.

DO $$
DECLARE
  v_nsw_node_id UUID;
  v_launch_id UUID;
  v_dinner_id UUID;
BEGIN
  -- 0. Schema Repair: Ensure events table has required columns (Bulletproof)
  -- slug
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'slug') THEN
    ALTER TABLE events ADD COLUMN slug TEXT UNIQUE;
  END IF;

  -- image_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
  END IF;

  -- is_featured
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_featured') THEN
    ALTER TABLE events ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  -- max_attendees
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'max_attendees') THEN
    ALTER TABLE events ADD COLUMN max_attendees INTEGER;
  END IF;

    -- is_public
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_public') THEN
    ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;

  -- 1. Get NSW Node ID (should have been created by week_sprint_tables.sql)
  SELECT id INTO v_nsw_node_id FROM justicehub_nodes WHERE state_code = 'NSW' LIMIT 1;

  -- Verify Node Exists
  IF v_nsw_node_id IS NULL THEN
    RAISE EXCEPTION 'NSW Node not found - ensure week_sprint_tables.sql has run.';
  END IF;

  -- 2. Seed "Contained Launch" (Public Event)
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
    'Join us for the official launch of the Mounty Yarns backyard campus! A celebration of youth-led design, justice reinvestment, and community storytelling. Witness the unveiling of the yarning circle, workshop container, and community garden.',
    'launch',
    '2026-03-15 10:00:00+11', -- Hypothetical date
    '2026-03-15 14:00:00+11',
    'Mounty Yarns HQ',
    '123 Rooty Hill Road North, Mount Druitt NSW 2770', -- Placeholder address
    'NSW',
    -33.7684,
    150.8205,
    v_nsw_node_id,
    200,
    true, -- Public
    true, -- Featured
    'https://example.com/mounty-launch-hero.jpg'
  )
  ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    start_date = EXCLUDED.start_date,
    is_public = true,
    is_featured = true
  RETURNING id INTO v_launch_id;

  -- 3. Seed "VIP Community Dinner" (Private Event)
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
    'An intimate evening of storytelling and shared meal with Community Elders, Youth Leaders, and key partners to bless the site before the public launch.',
    'meeting',
    '2026-03-14 18:00:00+11', -- The night before
    '2026-03-14 21:00:00+11',
    'Mounty Yarns HQ (Yarning Circle)',
    '123 Rooty Hill Road North, Mount Druitt NSW 2770',
    'NSW',
    -33.7684,
    150.8205,
    v_nsw_node_id,
    30, -- "Only a few VIPs"
    false, -- Private / Hidden
    false, -- Not featured on public lists
    'https://example.com/mounty-dinner-hero.jpg'
  )
  ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    is_public = false
  RETURNING id INTO v_dinner_id;

  RAISE NOTICE '✅ Mount Druitt Events Seeded Successfully';
  RAISE NOTICE '   - Launch ID: %', v_launch_id;
  RAISE NOTICE '   - Dinner ID: % (Private)', v_dinner_id;

END $$;

-- Update basecamp organizations with complete data
-- Add partner_tier column if not exists, update coordinates and taglines

-- Add partner_tier column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'partner_tier'
  ) THEN
    ALTER TABLE organizations ADD COLUMN partner_tier TEXT;
  END IF;
END $$;

-- Add tagline column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE organizations ADD COLUMN tagline TEXT;
  END IF;
END $$;

-- Oonchiumpa - Alice Springs, NT
UPDATE organizations SET
  partner_tier = 'basecamp',
  latitude = -23.698,
  longitude = 133.880,
  tagline = 'Cultural healing and deep listening on country'
WHERE slug = 'oonchiumpa';

-- BG Fit - Mount Isa, QLD
UPDATE organizations SET
  partner_tier = 'basecamp',
  latitude = -20.725,
  longitude = 139.498,
  tagline = 'Fitness-based youth engagement and mentorship'
WHERE slug = 'bg-fit';

-- Mounty Yarns - Mount Druitt, NSW
UPDATE organizations SET
  partner_tier = 'basecamp',
  latitude = -33.770,
  longitude = 150.820,
  tagline = 'Youth-led storytelling and media production'
WHERE slug = 'mounty-yarns';

-- PICC Townsville - Townsville, QLD
UPDATE organizations SET
  partner_tier = 'basecamp',
  latitude = -19.26,
  longitude = 146.82,
  tagline = 'Pasifika community strength and cultural connection'
WHERE slug = 'picc-townsville';

-- Verify updates
DO $$
DECLARE
  basecamp_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO basecamp_count
  FROM organizations
  WHERE partner_tier = 'basecamp';

  RAISE NOTICE 'Updated % basecamps with partner_tier and coordinates', basecamp_count;
END $$;

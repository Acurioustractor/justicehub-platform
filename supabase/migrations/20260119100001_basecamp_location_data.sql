-- Update basecamp location data for proper map display
-- Adds location field and coordinates for all 4 founding basecamps

-- Oonchiumpa - Alice Springs, NT
UPDATE organizations SET
  city = 'Alice Springs',
  state = 'NT',
  latitude = -23.698,
  longitude = 133.880
WHERE slug = 'oonchiumpa';

-- BG Fit - Mount Isa, QLD
UPDATE organizations SET
  location = 'Mount Isa, QLD',
  latitude = -20.725,
  longitude = 139.498
WHERE slug = 'bg-fit';

-- Mounty Yarns - Mount Druitt (Western Sydney), NSW
UPDATE organizations SET
  location = 'Mount Druitt (Western Sydney), NSW',
  latitude = -33.770,
  longitude = 150.820
WHERE slug = 'mounty-yarns';

-- PICC - Townsville, QLD
UPDATE organizations SET
  location = 'Townsville, QLD',
  latitude = -19.26,
  longitude = 146.82
WHERE slug = 'picc-townsville';

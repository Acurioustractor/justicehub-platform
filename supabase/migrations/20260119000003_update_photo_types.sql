-- Update partner_photos photo_type constraint to allow new assignment types
-- Old values: hero, gallery, profile, event, site, general
-- New values: card_thumbnail, hero_banner, gallery, team, location, program

-- Drop the old constraint
ALTER TABLE partner_photos DROP CONSTRAINT IF EXISTS partner_photos_photo_type_check;

-- Add new constraint with updated values
ALTER TABLE partner_photos ADD CONSTRAINT partner_photos_photo_type_check
  CHECK (photo_type IN ('card_thumbnail', 'hero_banner', 'gallery', 'team', 'location', 'program',
                        -- Keep old values for backwards compatibility
                        'hero', 'profile', 'event', 'site', 'general'));

-- Migrate existing data to new types
UPDATE partner_photos SET photo_type = 'hero_banner' WHERE photo_type = 'hero';
UPDATE partner_photos SET photo_type = 'team' WHERE photo_type = 'profile';
UPDATE partner_photos SET photo_type = 'location' WHERE photo_type = 'site';
UPDATE partner_photos SET photo_type = 'program' WHERE photo_type = 'event';
-- 'gallery' and 'general' stay the same

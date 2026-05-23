-- Hero photo column on organizations.
--
-- The kiosk hook rotator (HOOK_ENTRIES in src/app/kiosk/lib/hook-content.ts)
-- references orgs by slug; the editorial content (name, quote, place, state)
-- stays in code, but the image URL is now DB-driven so admins can upload new
-- hero portraits without a redeploy.
--
-- StorySwiper also reads this as a fallback when alma_stories.media_urls is
-- empty for a community-voice story linked to this org.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS hero_photo_url text;

COMMENT ON COLUMN organizations.hero_photo_url IS
  'Single chosen hero portrait URL for the org. Powers the /kiosk hook rotator and /kiosk/lenses/stories fallback. Editable via /admin/kiosk/heroes.';

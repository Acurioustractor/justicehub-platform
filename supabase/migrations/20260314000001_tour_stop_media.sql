-- Add media and enrichment columns to tour_stops
ALTER TABLE tour_stops
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS interview_notes TEXT,
  ADD COLUMN IF NOT EXISTS services_highlighted JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN tour_stops.hero_image_url IS 'Hero photo for this tour stop location';
COMMENT ON COLUMN tour_stops.video_url IS 'Video URL from this tour stop (YouTube/Vimeo/direct)';
COMMENT ON COLUMN tour_stops.interview_notes IS 'Interview summaries collected at this stop';
COMMENT ON COLUMN tour_stops.services_highlighted IS 'Featured services/orgs that participated at this stop';

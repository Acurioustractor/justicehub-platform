-- Add video_placement column to partner_videos table
-- Allows assigning videos to specific sections on the org page

ALTER TABLE partner_videos
ADD COLUMN IF NOT EXISTS video_placement TEXT DEFAULT 'gallery'
CHECK (video_placement IN ('featured', 'gallery', 'testimonial', 'program'));

-- Set featured videos to 'featured' placement
UPDATE partner_videos SET video_placement = 'featured' WHERE is_featured = true;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_partner_videos_placement ON partner_videos(video_placement);

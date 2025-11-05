-- Add columns to blog_posts table to support Empathy Ledger content sync

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS empathy_ledger_transcript_id UUID,
ADD COLUMN IF NOT EXISTS empathy_ledger_story_id UUID,
ADD COLUMN IF NOT EXISTS synced_from_empathy_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS cultural_sensitivity_flag BOOLEAN DEFAULT false;

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_empathy_transcript
ON blog_posts(empathy_ledger_transcript_id)
WHERE empathy_ledger_transcript_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_empathy_story
ON blog_posts(empathy_ledger_story_id)
WHERE empathy_ledger_story_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_synced_empathy
ON blog_posts(synced_from_empathy_ledger)
WHERE synced_from_empathy_ledger = true;

-- Comments for documentation
COMMENT ON COLUMN blog_posts.empathy_ledger_transcript_id IS 'Reference to transcript in Empathy Ledger if synced from there';
COMMENT ON COLUMN blog_posts.empathy_ledger_story_id IS 'Reference to story in Empathy Ledger if synced from there';
COMMENT ON COLUMN blog_posts.synced_from_empathy_ledger IS 'True if this content was synced from Empathy Ledger';
COMMENT ON COLUMN blog_posts.video_url IS 'URL to video content (from Empathy Ledger or direct upload)';
COMMENT ON COLUMN blog_posts.audio_url IS 'URL to audio content (from Empathy Ledger or direct upload)';
COMMENT ON COLUMN blog_posts.cultural_sensitivity_flag IS 'Requires cultural sensitivity or elder review';

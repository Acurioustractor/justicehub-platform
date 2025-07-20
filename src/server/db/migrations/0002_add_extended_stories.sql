-- Create extended story type enum
CREATE TYPE story_type_extended AS ENUM ('reflection', 'milestone', 'challenge', 'achievement', 'goal', 'update');

-- Create extended visibility enum with anonymous option
CREATE TYPE visibility_extended AS ENUM ('private', 'mentors', 'organization', 'public', 'anonymous');

-- Create extended stories table
CREATE TABLE IF NOT EXISTS stories_extended (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  story_type story_type_extended NOT NULL DEFAULT 'reflection',
  visibility visibility_extended NOT NULL DEFAULT 'private',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create story tags table
CREATE TABLE IF NOT EXISTS story_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories_extended(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create extended story media table
CREATE TABLE IF NOT EXISTS story_media_extended (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories_extended(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_stories_extended_user_id ON stories_extended(user_id);
CREATE INDEX idx_stories_extended_organization_id ON stories_extended(organization_id);
CREATE INDEX idx_stories_extended_visibility ON stories_extended(visibility);
CREATE INDEX idx_stories_extended_published ON stories_extended(published);
CREATE INDEX idx_stories_extended_created_at ON stories_extended(created_at DESC);
CREATE INDEX idx_story_tags_story_id ON story_tags(story_id);
CREATE INDEX idx_story_tags_tag ON story_tags(tag);
CREATE INDEX idx_story_media_extended_story_id ON story_media_extended(story_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stories_extended_updated_at 
  BEFORE UPDATE ON stories_extended 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
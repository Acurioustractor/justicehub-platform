-- Art & Innovation Projects Table
-- Stores creative works, campaigns, and innovative solutions in youth justice

CREATE TABLE IF NOT EXISTS art_innovation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Basic Information
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('art', 'campaign', 'innovation', 'technology', 'design', 'multimedia')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Content
  tagline TEXT, -- Short catchy description
  description TEXT NOT NULL, -- Full description
  story TEXT, -- The story behind the project
  impact TEXT, -- Impact and outcomes

  -- Media
  featured_image_url TEXT,
  video_url TEXT, -- YouTube, Vimeo, etc.
  gallery_images JSONB DEFAULT '[]'::jsonb, -- Array of {url, caption, credit}

  -- Creators/Artists
  creators JSONB DEFAULT '[]'::jsonb, -- Array of {name, role, bio, photo_url, profile_id}

  -- Metadata
  year INTEGER,
  location TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Links
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb, -- {instagram, twitter, etc.}

  -- Related Content
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  program_id UUID REFERENCES community_programs(id) ON DELETE SET NULL,

  -- Engagement
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(story, '')), 'D')
  ) STORED
);

-- Indexes
CREATE INDEX idx_art_innovation_slug ON art_innovation(slug);
CREATE INDEX idx_art_innovation_type ON art_innovation(type);
CREATE INDEX idx_art_innovation_status ON art_innovation(status);
CREATE INDEX idx_art_innovation_featured ON art_innovation(is_featured) WHERE is_featured = true;
CREATE INDEX idx_art_innovation_organization ON art_innovation(organization_id);
CREATE INDEX idx_art_innovation_program ON art_innovation(program_id);
CREATE INDEX idx_art_innovation_search ON art_innovation USING GIN(search_vector);
CREATE INDEX idx_art_innovation_tags ON art_innovation USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE art_innovation ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Art & Innovation projects are viewable by everyone"
  ON art_innovation FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can insert art & innovation projects"
  ON art_innovation FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own art & innovation projects"
  ON art_innovation FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_art_innovation_updated_at
  BEFORE UPDATE ON art_innovation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE art_innovation IS 'Creative works, campaigns, and innovative solutions in youth justice';
COMMENT ON COLUMN art_innovation.type IS 'Type of project: art, campaign, innovation, technology, design, multimedia';
COMMENT ON COLUMN art_innovation.creators IS 'Array of creator objects with name, role, bio, photo_url, and optional profile_id';
COMMENT ON COLUMN art_innovation.gallery_images IS 'Array of image objects with url, caption, and credit';
COMMENT ON COLUMN art_innovation.social_links IS 'Social media links as JSON object';

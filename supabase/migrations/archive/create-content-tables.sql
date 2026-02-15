-- Content Migration Tables for JusticeHub
-- Migrating from justicehub.com.au (Webflow) to new platform

-- ============================================================
-- AUTHORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  role TEXT, -- e.g., "Founder", "Contributor"
  email TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);

-- ============================================================
-- ARTICLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- MDX/Markdown format
  featured_image_url TEXT,
  author_id UUID REFERENCES authors(id),

  -- Category system from old site
  category TEXT CHECK (category IN ('seeds', 'growth', 'harvest', 'roots')),
  is_trending BOOLEAN DEFAULT false,

  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- SEO
  seo_title TEXT,
  seo_description TEXT,

  -- Location tags for Justice Map
  location_tags TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER, -- Calculated from content

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_trending ON articles(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- ============================================================
-- ARTICLE LOCATIONS TABLE (for Justice Map)
-- ============================================================
CREATE TABLE IF NOT EXISTS article_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,

  -- Location details
  location_name TEXT NOT NULL, -- e.g., "Mount Isa", "Brisbane"
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'Australia',

  -- Coordinates for mapping
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Metadata
  description TEXT, -- Optional context for this location
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_locations_article ON article_locations(article_id);
CREATE INDEX IF NOT EXISTS idx_article_locations_coords ON article_locations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================
-- PAGES TABLE (for static content)
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- MDX/Markdown format
  meta_description TEXT,
  published BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ============================================================
-- ARTICLE TAGS TABLE (for flexible tagging)
-- ============================================================
CREATE TABLE IF NOT EXISTS article_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(article_id, tag)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag);

-- ============================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can view published articles"
  ON articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view authors"
  ON authors FOR SELECT
  USING (true);

CREATE POLICY "Public can view article locations"
  ON article_locations FOR SELECT
  USING (true);

CREATE POLICY "Public can view published pages"
  ON pages FOR SELECT
  USING (published = true);

CREATE POLICY "Public can view article tags"
  ON article_tags FOR SELECT
  USING (true);

-- Newsletter: Insert only (for signup)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_authors_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  words_per_minute INTEGER := 200;
BEGIN
  -- Count words (split by whitespace)
  word_count := array_length(regexp_split_to_array(content_text, '\s+'), 1);
  -- Calculate minutes (minimum 1 minute)
  RETURN GREATEST(1, CEIL(word_count::DECIMAL / words_per_minute));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate reading time
CREATE OR REPLACE FUNCTION update_article_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time_minutes := calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_article_reading_time
  BEFORE INSERT OR UPDATE OF content ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_reading_time();

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- View: Articles with author details
CREATE OR REPLACE VIEW articles_with_authors AS
SELECT
  a.*,
  au.name as author_name,
  au.slug as author_slug,
  au.photo_url as author_photo_url,
  au.role as author_role
FROM articles a
LEFT JOIN authors au ON a.author_id = au.id
WHERE a.status = 'published'
ORDER BY a.published_at DESC;

-- View: Articles with location count
CREATE OR REPLACE VIEW articles_with_location_count AS
SELECT
  a.*,
  COUNT(al.id) as location_count
FROM articles a
LEFT JOIN article_locations al ON a.article_id = al.id
WHERE a.status = 'published'
GROUP BY a.id
ORDER BY a.published_at DESC;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE authors IS 'Article authors and contributors';
COMMENT ON TABLE articles IS 'Blog articles and stories from justicehub.com.au';
COMMENT ON TABLE article_locations IS 'Geographic locations mentioned in articles for Justice Map';
COMMENT ON TABLE pages IS 'Static pages like About, Contact';
COMMENT ON TABLE article_tags IS 'Flexible tagging system for articles';
COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscribers';

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert default author (Benjamin Knight)
INSERT INTO authors (slug, name, bio, role)
VALUES (
  'benjamin-knight',
  'Benjamin Knight',
  'Founder and lead contributor exploring transformative approaches to youth justice in Australia.',
  'Founder'
)
ON CONFLICT (slug) DO NOTHING;

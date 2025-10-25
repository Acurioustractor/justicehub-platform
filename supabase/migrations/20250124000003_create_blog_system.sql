-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  featured_image_caption TEXT,

  -- Author (link to profiles)
  author_id UUID REFERENCES public_profiles(id),
  co_authors UUID[], -- Array of profile IDs for multiple authors

  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  tags TEXT[],
  categories TEXT[],

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Engagement
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- Full text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED
);

-- Blog Media (images, videos, files)
CREATE TABLE IF NOT EXISTS blog_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,

  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'file', 'embed')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Metadata
  title TEXT,
  caption TEXT,
  alt_text TEXT, -- For accessibility

  -- Video specific
  video_provider TEXT, -- 'youtube', 'vimeo', 'upload'
  video_embed_code TEXT,

  -- File info
  file_size INTEGER,
  mime_type TEXT,

  -- Position in gallery
  display_order INTEGER DEFAULT 0
);

-- Blog Content Links (link to people, programs, services, art)
CREATE TABLE IF NOT EXISTS blog_content_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,

  -- What is being linked
  link_type TEXT NOT NULL CHECK (link_type IN ('profile', 'program', 'service', 'art', 'story')),

  -- Foreign keys to different tables
  profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  art_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  story_id UUID REFERENCES articles(id) ON DELETE CASCADE,

  -- Context about the link
  context TEXT, -- Why is this linked? "Featured person", "Related program", etc.

  UNIQUE(blog_post_id, link_type, profile_id),
  UNIQUE(blog_post_id, link_type, program_id),
  UNIQUE(blog_post_id, link_type, service_id),
  UNIQUE(blog_post_id, link_type, art_id),
  UNIQUE(blog_post_id, link_type, story_id)
);

-- Blog Comments (optional for future)
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public_profiles(id),

  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'deleted')),

  -- Nested comments
  parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_search ON blog_posts USING GIN(search_vector);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

CREATE INDEX idx_blog_media_post ON blog_media(blog_post_id);
CREATE INDEX idx_blog_content_links_post ON blog_content_links(blog_post_id);
CREATE INDEX idx_blog_content_links_profile ON blog_content_links(profile_id);
CREATE INDEX idx_blog_content_links_program ON blog_content_links(program_id);
CREATE INDEX idx_blog_content_links_service ON blog_content_links(service_id);
CREATE INDEX idx_blog_content_links_art ON blog_content_links(art_id);

CREATE INDEX idx_blog_comments_post ON blog_comments(blog_post_id);
CREATE INDEX idx_blog_comments_author ON blog_comments(author_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_content_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read published blog posts
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can read their own drafts
CREATE POLICY "Users can view their own blog posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = author_id OR auth.uid() = ANY(co_authors));

-- Authenticated users can create blog posts
CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own blog posts
CREATE POLICY "Users can update their own blog posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id OR auth.uid() = ANY(co_authors));

-- Media follows blog post permissions
CREATE POLICY "Blog media inherits post permissions"
  ON blog_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_media.blog_post_id
      AND (blog_posts.status = 'published' OR blog_posts.author_id = auth.uid())
    )
  );

-- Content links follow blog post permissions
CREATE POLICY "Blog links inherit post permissions"
  ON blog_content_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_content_links.blog_post_id
      AND (blog_posts.status = 'published' OR blog_posts.author_id = auth.uid())
    )
  );

-- Comments are viewable for published posts
CREATE POLICY "Comments viewable for published posts"
  ON blog_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = blog_comments.blog_post_id
      AND blog_posts.status = 'published'
    )
  );

-- Authenticated users can comment
CREATE POLICY "Authenticated users can comment"
  ON blog_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

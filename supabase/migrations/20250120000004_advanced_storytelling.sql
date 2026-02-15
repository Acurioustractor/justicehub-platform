-- Advanced Storytelling Features Migration
-- Adds rich text editor support, auto-save, and enhanced content management

-- =====================================
-- ENHANCED STORY CONTENT
-- =====================================

-- Add rich content fields to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS content_json JSONB,
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS reading_time INTEGER,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS media_count INTEGER DEFAULT 0;

-- Story drafts for auto-save functionality
CREATE TABLE IF NOT EXISTS story_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  content_json JSONB NOT NULL,
  content_html TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, version)
);

-- Enhanced story media table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS story_media_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type VARCHAR(50) NOT NULL, -- image, video, audio, document
  file_size INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  metadata JSONB DEFAULT '{}',
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- ENHANCED TAGGING SYSTEM
-- =====================================

-- Tags table for better tag management
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story-tag relationships with confidence scoring
CREATE TABLE IF NOT EXISTS story_tags (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  suggested_by TEXT DEFAULT 'user' CHECK (suggested_by IN ('user', 'ai', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_id, tag_id)
);

-- =====================================
-- STORY ANALYTICS AND ENGAGEMENT
-- =====================================

-- Enhanced story analytics
CREATE TABLE IF NOT EXISTS story_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'view', 'like', 'share', 'comment', 'read_time', 'scroll_depth'
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_data JSONB DEFAULT '{}', -- Additional event-specific data
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story performance metrics (aggregated)
CREATE TABLE IF NOT EXISTS story_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  avg_read_time INTEGER DEFAULT 0, -- in seconds
  avg_scroll_depth FLOAT DEFAULT 0, -- percentage
  bounce_rate FLOAT DEFAULT 0, -- percentage
  engagement_score FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, metric_date)
);

-- =====================================
-- CONTENT RECOMMENDATIONS
-- =====================================

-- Story similarity scores for recommendations
CREATE TABLE IF NOT EXISTS story_similarities (
  story_a_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  story_b_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_type VARCHAR(50) NOT NULL, -- 'content', 'tags', 'engagement', 'collaborative'
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_a_id, story_b_id, similarity_type),
  CHECK (story_a_id != story_b_id)
);

-- User reading preferences for personalized recommendations
CREATE TABLE IF NOT EXISTS user_reading_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferred_tags TEXT[] DEFAULT '{}',
  preferred_story_types TEXT[] DEFAULT '{}',
  preferred_length VARCHAR(20), -- 'short', 'medium', 'long'
  reading_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================
-- SEARCH AND DISCOVERY
-- =====================================

-- Search queries log for analytics and improvement
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  filters_applied JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  clicked_story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular searches cache
CREATE TABLE IF NOT EXISTS popular_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_text TEXT UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_trending BOOLEAN DEFAULT false
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Story drafts indexes
CREATE INDEX IF NOT EXISTS idx_story_drafts_story_id ON story_drafts(story_id);
CREATE INDEX IF NOT EXISTS idx_story_drafts_created_at ON story_drafts(created_at DESC);

-- Enhanced story media indexes
CREATE INDEX IF NOT EXISTS idx_story_media_enhanced_story_id ON story_media_enhanced(story_id);
CREATE INDEX IF NOT EXISTS idx_story_media_enhanced_file_type ON story_media_enhanced(file_type);
CREATE INDEX IF NOT EXISTS idx_story_media_enhanced_processing_status ON story_media_enhanced(processing_status);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Story tags indexes
CREATE INDEX IF NOT EXISTS idx_story_tags_story_id ON story_tags(story_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_tag_id ON story_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_confidence ON story_tags(confidence DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_story_analytics_story_id ON story_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_story_analytics_event_type ON story_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_story_analytics_created_at ON story_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_analytics_user_id ON story_analytics(user_id);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_story_metrics_story_id ON story_metrics(story_id);
CREATE INDEX IF NOT EXISTS idx_story_metrics_date ON story_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_story_metrics_engagement ON story_metrics(engagement_score DESC);

-- Similarity indexes
CREATE INDEX IF NOT EXISTS idx_story_similarities_story_a ON story_similarities(story_a_id);
CREATE INDEX IF NOT EXISTS idx_story_similarities_story_b ON story_similarities(story_b_id);
CREATE INDEX IF NOT EXISTS idx_story_similarities_score ON story_similarities(similarity_score DESC);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);

-- Full-text search indexes for enhanced content
CREATE INDEX IF NOT EXISTS idx_stories_content_html_search ON stories USING GIN(to_tsvector('english', COALESCE(content_html, content)));
CREATE INDEX IF NOT EXISTS idx_tags_search ON tags USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =====================================
-- FUNCTIONS AND TRIGGERS
-- =====================================

-- Function to calculate reading time based on word count
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Average reading speed: 200 words per minute
    RETURN GREATEST(1, CEIL(array_length(string_to_array(content_text, ' '), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Function to update story metrics when content changes
CREATE OR REPLACE FUNCTION update_story_content_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update word count and reading time
    NEW.word_count = array_length(string_to_array(COALESCE(NEW.content, ''), ' '), 1);
    NEW.reading_time = calculate_reading_time(COALESCE(NEW.content, ''));
    
    -- Update media count
    NEW.media_count = (
        SELECT COUNT(*) 
        FROM story_media_enhanced 
        WHERE story_id = NEW.id AND processing_status = 'complete'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update story metrics on content changes
CREATE TRIGGER update_story_content_metrics_trigger
    BEFORE INSERT OR UPDATE OF content, content_html ON stories
    FOR EACH ROW EXECUTE FUNCTION update_story_content_metrics();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tag usage counts
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR DELETE ON story_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to update story media count
CREATE OR REPLACE FUNCTION update_story_media_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE stories 
        SET media_count = (
            SELECT COUNT(*) 
            FROM story_media_enhanced 
            WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) 
            AND processing_status = 'complete'
        )
        WHERE id = COALESCE(NEW.story_id, OLD.story_id);
        RETURN COALESCE(NEW, OLD);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE stories 
        SET media_count = (
            SELECT COUNT(*) 
            FROM story_media_enhanced 
            WHERE story_id = OLD.story_id 
            AND processing_status = 'complete'
        )
        WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update media count
CREATE TRIGGER update_story_media_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON story_media_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_story_media_count();

-- Function to generate tag slug
CREATE OR REPLACE FUNCTION generate_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug = lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate tag slug
CREATE TRIGGER generate_tag_slug_trigger
    BEFORE INSERT OR UPDATE OF name ON tags
    FOR EACH ROW EXECUTE FUNCTION generate_tag_slug();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_metrics_updated_at 
    BEFORE UPDATE ON story_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- INITIAL DATA
-- =====================================

-- Insert some common tags
INSERT INTO tags (name, category, description) VALUES
('personal-growth', 'theme', 'Stories about personal development and growth'),
('community', 'theme', 'Stories about community involvement and impact'),
('education', 'theme', 'Stories related to educational experiences'),
('career', 'theme', 'Stories about career development and work experiences'),
('family', 'theme', 'Stories about family relationships and experiences'),
('health', 'theme', 'Stories about health and wellness journeys'),
('creativity', 'theme', 'Stories about creative pursuits and artistic expression'),
('leadership', 'theme', 'Stories about leadership experiences and development'),
('resilience', 'theme', 'Stories about overcoming challenges and building resilience'),
('mentorship', 'theme', 'Stories about mentoring relationships and guidance')
ON CONFLICT (name) DO NOTHING;

-- Insert story types as tags
INSERT INTO tags (name, category, description) VALUES
('personal-experience', 'type', 'Personal experience stories'),
('journey', 'type', 'Journey and transformation stories'),
('achievement', 'type', 'Achievement and success stories'),
('challenge', 'type', 'Challenge and obstacle stories'),
('reflection', 'type', 'Reflective and introspective stories'),
('program-impact', 'type', 'Stories about program and service impact')
ON CONFLICT (name) DO NOTHING;
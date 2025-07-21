-- Multimedia Stories Database Schema
-- Enhanced stories system supporting blogs, videos, photos, interviews, and multimedia content

-- Authors/Users table for story creators
CREATE TABLE IF NOT EXISTS story_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255),
    age INTEGER,
    location VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    anonymous BOOLEAN DEFAULT false,
    profile_visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'private', 'friends'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media assets table for storing files
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'supabase', -- 'supabase', 'aws', 'cloudinary', 'local'
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    thumbnail_url TEXT,
    cdn_url TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- for video/audio
    alt_text TEXT,
    accessibility_description TEXT,
    metadata JSONB DEFAULT '{}', -- camera info, compression, etc.
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES story_authors(id),
    processing_status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    virus_scan_status VARCHAR(20) DEFAULT 'clean', -- 'pending', 'clean', 'infected', 'error'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimized versions of media assets (thumbnails, different sizes, formats)
CREATE TABLE IF NOT EXISTS media_asset_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    variant_type VARCHAR(50) NOT NULL, -- 'thumbnail', 'small', 'medium', 'large', 'webp', 'avif'
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    quality INTEGER, -- compression quality 1-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main multimedia stories table
CREATE TABLE IF NOT EXISTS multimedia_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'blog', 'video', 'photo', 'interview', 'multimedia', 'podcast'
    category VARCHAR(100) NOT NULL, -- transformation, advocacy, healing, etc.
    author_id UUID REFERENCES story_authors(id) ON DELETE SET NULL,
    content_data JSONB NOT NULL DEFAULT '{}', -- type-specific content structure
    tags TEXT[] DEFAULT '{}',
    visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'network', 'private', 'anonymous'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_review', 'published', 'featured', 'archived'
    featured BOOLEAN DEFAULT false,
    editor_pick BOOLEAN DEFAULT false,
    community_choice BOOLEAN DEFAULT false,
    reading_time VARCHAR(20), -- "5 min read", "12:34" for video
    impact_score DECIMAL(3,1), -- 0.0 to 10.0
    trigger_warnings TEXT[],
    age_appropriate BOOLEAN DEFAULT true,
    content_rating VARCHAR(20) DEFAULT 'general', -- 'general', 'mature', 'sensitive'
    
    -- SEO and discovery
    slug VARCHAR(255) UNIQUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    featured_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_bookmarks INTEGER DEFAULT 0,
    trending_score DECIMAL(10,4) DEFAULT 0.0,
    
    -- Moderation
    flagged BOOLEAN DEFAULT false,
    moderation_notes TEXT,
    moderated_by UUID REFERENCES story_authors(id),
    moderated_at TIMESTAMP WITH TIME ZONE
);

-- Story media assets junction table
CREATE TABLE IF NOT EXISTS story_media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    asset_role VARCHAR(50) NOT NULL, -- 'featured_image', 'gallery', 'video', 'audio', 'thumbnail', 'caption'
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    alt_text TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, media_asset_id, asset_role)
);

-- Story engagement tracking
CREATE TABLE IF NOT EXISTS story_engagement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES story_authors(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'view', 'like', 'comment', 'share', 'bookmark', 'report'
    session_id VARCHAR(255), -- for anonymous tracking
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    engagement_data JSONB DEFAULT '{}', -- duration for views, share platform, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX(story_id, action_type),
    INDEX(user_id, action_type),
    INDEX(created_at)
);

-- Story comments
CREATE TABLE IF NOT EXISTS story_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    author_id UUID REFERENCES story_authors(id) ON DELETE SET NULL,
    parent_comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'published', -- 'pending', 'published', 'hidden', 'spam'
    likes INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    flagged BOOLEAN DEFAULT false,
    flagged_reason TEXT,
    moderated_by UUID REFERENCES story_authors(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Story collections/playlists
CREATE TABLE IF NOT EXISTS story_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_id UUID REFERENCES media_assets(id),
    creator_id UUID REFERENCES story_authors(id) ON DELETE SET NULL,
    collection_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'featured', 'trending', 'editorial'
    visibility VARCHAR(20) DEFAULT 'public',
    collaborative BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    story_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stories in collections
CREATE TABLE IF NOT EXISTS collection_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES story_collections(id) ON DELETE CASCADE,
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    added_by UUID REFERENCES story_authors(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    curator_note TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, story_id)
);

-- Story reactions (like, love, inspire, support, etc.)
CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES story_authors(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- 'like', 'love', 'inspire', 'support', 'strength', 'hope'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id, reaction_type)
);

-- User bookmarks
CREATE TABLE IF NOT EXISTS story_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES story_authors(id) ON DELETE CASCADE,
    folder_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- Content moderation flags
CREATE TABLE IF NOT EXISTS content_moderation_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES story_authors(id) ON DELETE SET NULL,
    flag_type VARCHAR(50) NOT NULL, -- 'inappropriate', 'spam', 'harassment', 'copyright', 'violence'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
    moderator_id UUID REFERENCES story_authors(id),
    moderator_notes TEXT,
    action_taken VARCHAR(100), -- 'no_action', 'content_hidden', 'user_warned', 'user_suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Story analytics aggregated data
CREATE TABLE IF NOT EXISTS story_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    average_reading_time INTEGER, -- seconds
    completion_rate DECIMAL(5,2), -- percentage
    bounce_rate DECIMAL(5,2), -- percentage
    traffic_sources JSONB DEFAULT '{}',
    demographic_data JSONB DEFAULT '{}',
    engagement_by_hour JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, date)
);

-- User reading history
CREATE TABLE IF NOT EXISTS user_reading_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES story_authors(id) ON DELETE CASCADE,
    story_id UUID REFERENCES multimedia_stories(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0, -- 0-100
    reading_time_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_position TEXT, -- for videos: timestamp, for articles: scroll position
    device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
    first_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_count INTEGER DEFAULT 1,
    UNIQUE(user_id, story_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_content_type ON multimedia_stories(content_type);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_category ON multimedia_stories(category);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_author_id ON multimedia_stories(author_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_status ON multimedia_stories(status);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_visibility ON multimedia_stories(visibility);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_featured ON multimedia_stories(featured);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_published_at ON multimedia_stories(published_at);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_trending_score ON multimedia_stories(trending_score);
CREATE INDEX IF NOT EXISTS idx_multimedia_stories_tags ON multimedia_stories USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_story_engagement_story_id ON story_engagement(story_id);
CREATE INDEX IF NOT EXISTS idx_story_engagement_user_id ON story_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_story_engagement_action_type ON story_engagement(action_type);
CREATE INDEX IF NOT EXISTS idx_story_engagement_created_at ON story_engagement(created_at);

CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_author_id ON story_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_parent_comment_id ON story_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_status ON story_comments(status);

CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_file_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_processing_status ON media_assets(processing_status);

CREATE INDEX IF NOT EXISTS idx_story_media_assets_story_id ON story_media_assets(story_id);
CREATE INDEX IF NOT EXISTS idx_story_media_assets_media_asset_id ON story_media_assets(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_story_media_assets_asset_role ON story_media_assets(asset_role);

-- Functions for updating engagement counts
CREATE OR REPLACE FUNCTION update_story_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update engagement counts on the story
    UPDATE multimedia_stories 
    SET 
        total_views = (
            SELECT COUNT(*) FROM story_engagement 
            WHERE story_id = NEW.story_id AND action_type = 'view'
        ),
        total_likes = (
            SELECT COUNT(*) FROM story_engagement 
            WHERE story_id = NEW.story_id AND action_type = 'like'
        ),
        total_comments = (
            SELECT COUNT(*) FROM story_comments 
            WHERE story_id = NEW.story_id AND status = 'published'
        ),
        total_shares = (
            SELECT COUNT(*) FROM story_engagement 
            WHERE story_id = NEW.story_id AND action_type = 'share'
        ),
        total_bookmarks = (
            SELECT COUNT(*) FROM story_engagement 
            WHERE story_id = NEW.story_id AND action_type = 'bookmark'
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.story_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for engagement count updates
CREATE TRIGGER update_story_engagement_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON story_engagement
    FOR EACH ROW EXECUTE FUNCTION update_story_engagement_counts();

CREATE TRIGGER update_story_comment_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON story_comments
    FOR EACH ROW EXECUTE FUNCTION update_story_engagement_counts();

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(story_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    recent_views INTEGER;
    recent_likes INTEGER;
    recent_comments INTEGER;
    recent_shares INTEGER;
    story_age_days INTEGER;
    trending_score DECIMAL;
BEGIN
    -- Get recent engagement (last 7 days)
    SELECT 
        COUNT(CASE WHEN action_type = 'view' THEN 1 END),
        COUNT(CASE WHEN action_type = 'like' THEN 1 END),
        COUNT(CASE WHEN action_type = 'share' THEN 1 END)
    INTO recent_views, recent_likes, recent_shares
    FROM story_engagement 
    WHERE story_engagement.story_id = calculate_trending_score.story_id 
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Get recent comments
    SELECT COUNT(*)
    INTO recent_comments
    FROM story_comments 
    WHERE story_comments.story_id = calculate_trending_score.story_id 
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND status = 'published';
    
    -- Get story age in days
    SELECT EXTRACT(DAY FROM CURRENT_TIMESTAMP - published_at)
    INTO story_age_days
    FROM multimedia_stories 
    WHERE id = calculate_trending_score.story_id;
    
    -- Calculate trending score (higher = more trending)
    -- Formula: (weighted engagement) / (age_factor)
    trending_score := (
        (recent_views * 1.0) +
        (recent_likes * 3.0) +
        (recent_comments * 5.0) +
        (recent_shares * 10.0)
    ) / GREATEST(story_age_days, 1);
    
    RETURN trending_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update trending scores (run periodically)
CREATE OR REPLACE FUNCTION update_all_trending_scores()
RETURNS INTEGER AS $$
DECLARE
    story_count INTEGER := 0;
    story_record RECORD;
BEGIN
    FOR story_record IN 
        SELECT id FROM multimedia_stories 
        WHERE status = 'published' 
        AND published_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
    LOOP
        UPDATE multimedia_stories 
        SET trending_score = calculate_trending_score(story_record.id)
        WHERE id = story_record.id;
        
        story_count := story_count + 1;
    END LOOP;
    
    RETURN story_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate story slug
CREATE OR REPLACE FUNCTION generate_story_slug(title TEXT, story_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from title
    base_slug := lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := substring(base_slug from 1 for 50);
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (
        SELECT 1 FROM multimedia_stories 
        WHERE slug = final_slug AND id != story_id
    ) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_story_slug(NEW.title, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_slug_trigger
    BEFORE INSERT OR UPDATE ON multimedia_stories
    FOR EACH ROW EXECUTE FUNCTION auto_generate_slug();

-- Comments for documentation
COMMENT ON TABLE multimedia_stories IS 'Main table for all multimedia story content including blogs, videos, photos, and interviews';
COMMENT ON TABLE story_authors IS 'Authors and users who create story content';
COMMENT ON TABLE media_assets IS 'File storage and metadata for all multimedia assets';
COMMENT ON TABLE story_engagement IS 'Tracks all user interactions with stories for analytics';
COMMENT ON TABLE story_comments IS 'Comment system for stories with nested replies support';
COMMENT ON TABLE story_collections IS 'Curated collections and playlists of stories';
COMMENT ON TABLE story_analytics IS 'Aggregated daily analytics data for stories';

-- Views for common queries
CREATE OR REPLACE VIEW featured_stories AS
SELECT s.*, a.name as author_name, a.avatar_url as author_avatar
FROM multimedia_stories s
LEFT JOIN story_authors a ON s.author_id = a.id
WHERE s.featured = true AND s.status = 'published' AND s.visibility = 'public'
ORDER BY s.featured_at DESC;

CREATE OR REPLACE VIEW trending_stories AS
SELECT s.*, a.name as author_name, a.avatar_url as author_avatar
FROM multimedia_stories s
LEFT JOIN story_authors a ON s.author_id = a.id
WHERE s.status = 'published' AND s.visibility = 'public'
ORDER BY s.trending_score DESC, s.published_at DESC;

CREATE OR REPLACE VIEW recent_stories AS
SELECT s.*, a.name as author_name, a.avatar_url as author_avatar
FROM multimedia_stories s
LEFT JOIN story_authors a ON s.author_id = a.id
WHERE s.status = 'published' AND s.visibility = 'public'
ORDER BY s.published_at DESC;
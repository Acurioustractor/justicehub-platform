-- JusticeHub Core Schema with Empathy Ledger Integration
-- This creates the foundation for connecting to your existing Empathy Ledger

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- EMPATHY LEDGER CORE TABLE
-- =====================================================
-- This connects to your existing Empathy Ledger system
CREATE TABLE empathy_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core Empathy Ledger Fields
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('story', 'interaction', 'milestone', 'reflection', 'growth')),
    impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
    empathy_metrics JSONB NOT NULL DEFAULT '{}',
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    
    -- Relationships
    related_story_id UUID,
    related_program_id UUID,
    mentor_id UUID,
    
    -- Metadata
    privacy_level VARCHAR(20) DEFAULT 'private' CHECK (privacy_level IN ('private', 'community', 'public')),
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' '))
    ) STORED
);

-- =====================================================
-- YOUTH PROFILES
-- =====================================================
CREATE TABLE youth_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Basic Info
    display_name VARCHAR(100),
    age_range VARCHAR(20) CHECK (age_range IN ('13-15', '16-18', '19-21', '22-25')),
    location JSONB, -- {state, city, postcode}
    
    -- Journey Tracking
    current_goals TEXT[],
    interests TEXT[],
    skills TEXT[],
    challenges TEXT[],
    
    -- Empathy Ledger Integration
    empathy_score INTEGER DEFAULT 0,
    growth_milestones JSONB DEFAULT '[]',
    connection_strength INTEGER DEFAULT 0,
    
    -- Privacy & Safety
    privacy_settings JSONB DEFAULT '{"profile": "private", "stories": "community"}',
    guardian_contact JSONB, -- If under 18
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STORIES PLATFORM
-- =====================================================
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES youth_profiles(id) ON DELETE CASCADE,
    empathy_ledger_id UUID REFERENCES empathy_ledger_entries(id),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    story_type VARCHAR(50) DEFAULT 'personal' CHECK (story_type IN ('personal', 'program_highlight', 'success', 'challenge', 'advice')),
    
    -- Media
    featured_image_url TEXT,
    media_files JSONB DEFAULT '[]',
    
    -- Metadata
    tags TEXT[],
    privacy_level VARCHAR(20) DEFAULT 'community' CHECK (privacy_level IN ('private', 'community', 'public')),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' '))
    ) STORED
);

-- =====================================================
-- GRASSROOTS PROGRAMS
-- =====================================================
CREATE TABLE grassroots_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    organization_name VARCHAR(255),
    
    -- Location & Contact
    location JSONB NOT NULL, -- {state, city, address, postcode}
    contact_info JSONB, -- {email, phone, website}
    
    -- Program Details
    program_type VARCHAR(50) NOT NULL,
    target_age_groups TEXT[],
    focus_areas TEXT[], -- mentorship, education, employment, etc
    
    -- Capacity & Availability
    current_capacity INTEGER,
    max_capacity INTEGER,
    availability_status VARCHAR(20) DEFAULT 'open' CHECK (availability_status IN ('open', 'waitlist', 'closed')),
    
    -- Outcomes & Metrics
    success_rate DECIMAL(5,2),
    participants_served INTEGER DEFAULT 0,
    outcome_metrics JSONB DEFAULT '{}',
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'flagged')),
    verification_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || description || ' ' || organization_name || ' ' || array_to_string(focus_areas, ' '))
    ) STORED
);

-- =====================================================
-- MENTORSHIP CONNECTIONS
-- =====================================================
CREATE TABLE mentorship_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL,
    mentee_id UUID REFERENCES youth_profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES grassroots_programs(id),
    
    -- Connection Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'terminated')),
    connection_type VARCHAR(30) DEFAULT 'one_on_one' CHECK (connection_type IN ('one_on_one', 'group', 'peer', 'program_based')),
    
    -- Relationship Tracking
    connection_strength INTEGER DEFAULT 0 CHECK (connection_strength >= 0 AND connection_strength <= 100),
    meeting_frequency VARCHAR(20), -- weekly, monthly, etc
    last_interaction TIMESTAMPTZ,
    
    -- Goals & Progress
    shared_goals TEXT[],
    progress_notes TEXT,
    milestones_achieved JSONB DEFAULT '[]',
    
    -- Timestamps
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSPARENCY & FUNDING
-- =====================================================
CREATE TABLE funding_transparency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source
    funding_source VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) CHECK (source_type IN ('government', 'grant', 'donation', 'corporate', 'fundraising')),
    
    -- Amount & Allocation
    total_amount DECIMAL(12,2) NOT NULL,
    allocated_amount DECIMAL(12,2) DEFAULT 0,
    spent_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Purpose
    purpose TEXT NOT NULL,
    target_programs TEXT[],
    expected_outcomes TEXT[],
    
    -- Transparency
    is_public BOOLEAN DEFAULT TRUE,
    reporting_period VARCHAR(20), -- quarterly, annual, etc
    
    -- Timestamps
    funding_date DATE NOT NULL,
    reporting_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Full-text search indexes
CREATE INDEX idx_stories_search ON stories USING GIN (search_vector);
CREATE INDEX idx_programs_search ON grassroots_programs USING GIN (search_vector);
CREATE INDEX idx_empathy_search ON empathy_ledger_entries USING GIN (search_vector);

-- Common query indexes
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_stories_published ON stories(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_youth_user ON youth_profiles(user_id);
CREATE INDEX idx_connections_mentor ON mentorship_connections(mentor_id);
CREATE INDEX idx_connections_mentee ON mentorship_connections(mentee_id);
CREATE INDEX idx_programs_location ON grassroots_programs USING GIN ((location->'state'));
CREATE INDEX idx_empathy_user ON empathy_ledger_entries(user_id);
CREATE INDEX idx_empathy_type ON empathy_ledger_entries(entry_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE empathy_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grassroots_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_transparency ENABLE ROW LEVEL SECURITY;

-- Empathy Ledger Security
CREATE POLICY "Users can view their own empathy entries" 
    ON empathy_ledger_entries FOR SELECT 
    USING (auth.uid() = user_id OR privacy_level = 'public');

CREATE POLICY "Users can create their own empathy entries" 
    ON empathy_ledger_entries FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own empathy entries" 
    ON empathy_ledger_entries FOR UPDATE 
    USING (auth.uid() = user_id);

-- Youth Profiles Security
CREATE POLICY "Users can view public profiles" 
    ON youth_profiles FOR SELECT 
    USING (
        auth.uid() = user_id OR 
        (privacy_settings->>'profile')::text = 'public'
    );

CREATE POLICY "Users can manage their own profile" 
    ON youth_profiles FOR ALL 
    USING (auth.uid() = user_id);

-- Stories Security
CREATE POLICY "Users can view published stories based on privacy" 
    ON stories FOR SELECT 
    USING (
        published_at IS NOT NULL AND (
            privacy_level = 'public' OR
            (privacy_level = 'community' AND auth.uid() IS NOT NULL) OR
            auth.uid() = (SELECT user_id FROM youth_profiles WHERE id = author_id)
        )
    );

CREATE POLICY "Users can manage their own stories" 
    ON stories FOR ALL 
    USING (auth.uid() = (SELECT user_id FROM youth_profiles WHERE id = author_id));

-- Programs Security (public read, verified write)
CREATE POLICY "Anyone can view verified programs" 
    ON grassroots_programs FOR SELECT 
    USING (verification_status = 'verified');

CREATE POLICY "Authenticated users can create programs" 
    ON grassroots_programs FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_empathy_ledger_updated_at BEFORE UPDATE ON empathy_ledger_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_profiles_updated_at BEFORE UPDATE ON youth_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON grassroots_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_updated_at BEFORE UPDATE ON funding_transparency 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Empathy Score Calculation
CREATE OR REPLACE FUNCTION calculate_empathy_score(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Calculate based on various factors
    SELECT 
        COALESCE(
            AVG(impact_score) + 
            (COUNT(*) * 2) + -- Engagement points
            (COUNT(DISTINCT entry_type) * 5) -- Diversity points
        , 0)::INTEGER
    INTO score
    FROM empathy_ledger_entries 
    WHERE user_id = user_id_param;
    
    -- Update youth profile
    UPDATE youth_profiles 
    SET empathy_score = score 
    WHERE user_id = user_id_param;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;
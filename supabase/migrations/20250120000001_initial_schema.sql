-- JusticeHub Platform - Initial Database Schema
-- This migration creates the core tables for the platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================
-- ORGANIZATIONS
-- =====================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nonprofit', 'government', 'community', 'corporate')),
  description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  street_address TEXT,
  suburb TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  empathy_ledger_config JSONB DEFAULT NULL
);

-- =====================================
-- USERS & PROFILES
-- =====================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('youth', 'mentor', 'org_admin', 'platform_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  profile_completed BOOLEAN DEFAULT false
);

-- Organization memberships (users can belong to multiple organizations)
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin', 'owner')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, organization_id)
);

-- Youth profiles (extended information for youth users)
CREATE TABLE youth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_of_birth DATE,
  location_city TEXT,
  location_state TEXT,
  interests TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  bio TEXT,
  education_level TEXT,
  employment_status TEXT,
  privacy_settings JSONB DEFAULT '{"story_default_visibility": "organization", "profile_visibility": "mentors"}',
  journey_timeline JSONB DEFAULT '[]'
);

-- Mentor profiles
CREATE TABLE mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bio TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  years_experience INTEGER,
  education_background TEXT,
  current_role TEXT,
  company TEXT,
  location_city TEXT,
  location_state TEXT,
  availability_hours INTEGER DEFAULT 2, -- hours per week
  max_mentees INTEGER DEFAULT 3,
  current_mentees INTEGER DEFAULT 0,
  is_accepting_mentees BOOLEAN DEFAULT true,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  background_check_completed BOOLEAN DEFAULT false,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0
);

-- =====================================
-- STORIES & CONTENT
-- =====================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  youth_profile_id UUID REFERENCES youth_profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'local' CHECK (source IN ('local', 'airtable', 'empathy_ledger', 'import')),
  external_id TEXT, -- For tracking stories from external sources
  story_type TEXT NOT NULL DEFAULT 'personal' CHECK (story_type IN ('personal', 'journey', 'achievement', 'challenge', 'reflection', 'program_impact')),
  visibility TEXT NOT NULL DEFAULT 'organization' CHECK (visibility IN ('private', 'organization', 'mentors', 'public')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'flagged')),
  is_anonymous BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  featured_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  content_warnings TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Story media attachments
CREATE TABLE story_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image, video, audio, document
  mime_type TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  caption TEXT,
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false
);

-- Story interactions (likes, bookmarks, etc.)
CREATE TABLE story_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'bookmark', 'share', 'report')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id, interaction_type)
);

-- =====================================
-- MENTORSHIP SYSTEM
-- =====================================
CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id UUID REFERENCES youth_profiles(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  message TEXT,
  response_message TEXT,
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mentorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id UUID REFERENCES youth_profiles(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'terminated')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  goals TEXT[] DEFAULT '{}',
  meeting_frequency TEXT, -- weekly, biweekly, monthly
  preferred_communication TEXT[] DEFAULT '{}', -- video, phone, text, email
  notes TEXT,
  progress_updates JSONB DEFAULT '[]'
);

-- =====================================
-- SERVICES & OPPORTUNITIES
-- =====================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  program_type TEXT NOT NULL,
  service_category TEXT[] DEFAULT '{}',
  target_age_min INTEGER,
  target_age_max INTEGER,
  delivery_method TEXT[] DEFAULT '{}', -- in_person, online, hybrid, phone
  capacity_total INTEGER,
  capacity_current INTEGER DEFAULT 0,
  is_accepting_referrals BOOLEAN DEFAULT true,
  cost TEXT, -- free, subsidized, fee_for_service
  eligibility_criteria TEXT[] DEFAULT '{}',
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  location_postcode TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website_url TEXT,
  success_rate DECIMAL(5,2), -- percentage
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Opportunities (jobs, apprenticeships, programs)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('job', 'apprenticeship', 'internship', 'volunteer', 'program', 'scholarship')),
  industry TEXT,
  location_type TEXT CHECK (location_type IN ('remote', 'on_site', 'hybrid')),
  location_city TEXT,
  location_state TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_type TEXT CHECK (salary_type IN ('hourly', 'weekly', 'monthly', 'annually', 'stipend')),
  duration_weeks INTEGER,
  start_date DATE,
  application_deadline DATE,
  requirements TEXT[] DEFAULT '{}',
  skills_required TEXT[] DEFAULT '{}',
  skills_preferred TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  application_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}'
);

-- =====================================
-- EMPATHY LEDGER INTEGRATION
-- =====================================
CREATE TABLE empathy_ledger_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'export', 'full_sync')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '{}',
  sync_metadata JSONB DEFAULT '{}'
);

-- Cross-project analytics aggregation
CREATE TABLE cross_project_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- story_count, engagement_rate, program_effectiveness
  metric_value DECIMAL(10,4) NOT NULL,
  metric_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE(project_name, organization_id, metric_type, metric_date)
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_verification_status ON organizations(verification_status);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Stories
CREATE INDEX idx_stories_slug ON stories(slug);
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_organization_id ON stories(organization_id);
CREATE INDEX idx_stories_source ON stories(source);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX idx_stories_tags ON stories USING GIN(tags);
CREATE INDEX idx_stories_search ON stories USING GIN(to_tsvector('english', title || ' ' || content));

-- Services
CREATE INDEX idx_services_organization_id ON services(organization_id);
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_service_category ON services USING GIN(service_category);

-- Opportunities
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_opportunities_opportunity_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_is_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_application_deadline ON opportunities(application_deadline);

-- Mentorships
CREATE INDEX idx_mentorships_youth_id ON mentorships(youth_id);
CREATE INDEX idx_mentorships_mentor_id ON mentorships(mentor_id);
CREATE INDEX idx_mentorships_status ON mentorships(status);

-- =====================================
-- FUNCTIONS AND TRIGGERS
-- =====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youth_profiles_updated_at BEFORE UPDATE ON youth_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON mentor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorships_updated_at BEFORE UPDATE ON mentorships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_requests_updated_at BEFORE UPDATE ON mentorship_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to update story counts
CREATE OR REPLACE FUNCTION update_story_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE stories SET like_count = like_count + 1 WHERE id = NEW.story_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.interaction_type = 'like' THEN
            UPDATE stories SET like_count = like_count - 1 WHERE id = OLD.story_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER story_interaction_counts_trigger
    AFTER INSERT OR DELETE ON story_interactions
    FOR EACH ROW EXECUTE FUNCTION update_story_interaction_counts();
-- Empathy Ledger Integration Migration
-- This migration adds tables needed for JusticeHub integration with existing Empathy Ledger database

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================
-- STORYTELLERS TABLE
-- =====================================
-- Create storytellers table if it doesn't exist
CREATE TABLE IF NOT EXISTS storytellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'granted', 'revoked')),
  privacy_settings JSONB DEFAULT '{"show_name": true, "show_location": false, "show_age": false, "allow_contact": false}',
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- PROJECTS TABLE
-- =====================================
-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL,
  project_type TEXT DEFAULT 'storytelling',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  settings JSONB DEFAULT '{}',
  success_metrics JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE
);

-- =====================================
-- ORGANIZATIONS TABLE
-- =====================================
-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  logo_url TEXT,
  organization_type TEXT DEFAULT 'nonprofit',
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'
);

-- =====================================
-- STORIES TABLE
-- =====================================
-- Create stories table if it doesn't exist
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  storyteller_id UUID NOT NULL,
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  story_type TEXT NOT NULL DEFAULT 'personal',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'organization', 'private')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  featured_image_url TEXT,
  consent_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- STORY INTERACTIONS TABLE
-- =====================================
-- Create story_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  story_id UUID NOT NULL,
  storyteller_id UUID,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'comment')),
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- CONSENT RECORDS TABLE
-- =====================================
-- Create consent_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  storyteller_id UUID NOT NULL,
  story_id UUID,
  consent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked', 'pending')),
  consent_details JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by TEXT
);

-- =====================================
-- CROSS PROJECT METRICS TABLE
-- =====================================
-- Create cross_project_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS cross_project_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- =====================================
-- JUSTICEHUB USERS TABLE (for authentication)
-- =====================================
-- Create justicehub_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS justicehub_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  storyteller_id UUID,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'storyteller' CHECK (role IN ('storyteller', 'mentor', 'admin')),
  auth_provider TEXT DEFAULT 'email',
  auth_id TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'
);

-- =====================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =====================================
-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- storytellers -> projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'storytellers_project_id_fkey') THEN
    ALTER TABLE storytellers ADD CONSTRAINT storytellers_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- storytellers -> organizations
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'storytellers_organization_id_fkey') THEN
    ALTER TABLE storytellers ADD CONSTRAINT storytellers_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- projects -> organizations
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'projects_organization_id_fkey') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- stories -> storytellers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'stories_storyteller_id_fkey') THEN
    ALTER TABLE stories ADD CONSTRAINT stories_storyteller_id_fkey 
    FOREIGN KEY (storyteller_id) REFERENCES storytellers(id) ON DELETE CASCADE;
  END IF;

  -- stories -> projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'stories_project_id_fkey') THEN
    ALTER TABLE stories ADD CONSTRAINT stories_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- stories -> organizations
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'stories_organization_id_fkey') THEN
    ALTER TABLE stories ADD CONSTRAINT stories_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- story_interactions -> stories
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'story_interactions_story_id_fkey') THEN
    ALTER TABLE story_interactions ADD CONSTRAINT story_interactions_story_id_fkey 
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
  END IF;

  -- story_interactions -> storytellers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'story_interactions_storyteller_id_fkey') THEN
    ALTER TABLE story_interactions ADD CONSTRAINT story_interactions_storyteller_id_fkey 
    FOREIGN KEY (storyteller_id) REFERENCES storytellers(id) ON DELETE SET NULL;
  END IF;

  -- consent_records -> storytellers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'consent_records_storyteller_id_fkey') THEN
    ALTER TABLE consent_records ADD CONSTRAINT consent_records_storyteller_id_fkey 
    FOREIGN KEY (storyteller_id) REFERENCES storytellers(id) ON DELETE CASCADE;
  END IF;

  -- consent_records -> stories
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'consent_records_story_id_fkey') THEN
    ALTER TABLE consent_records ADD CONSTRAINT consent_records_story_id_fkey 
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
  END IF;

  -- cross_project_metrics -> projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'cross_project_metrics_project_id_fkey') THEN
    ALTER TABLE cross_project_metrics ADD CONSTRAINT cross_project_metrics_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- cross_project_metrics -> organizations
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'cross_project_metrics_organization_id_fkey') THEN
    ALTER TABLE cross_project_metrics ADD CONSTRAINT cross_project_metrics_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- justicehub_users -> storytellers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'justicehub_users_storyteller_id_fkey') THEN
    ALTER TABLE justicehub_users ADD CONSTRAINT justicehub_users_storyteller_id_fkey 
    FOREIGN KEY (storyteller_id) REFERENCES storytellers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================
-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_storytellers_project_id ON storytellers(project_id);
CREATE INDEX IF NOT EXISTS idx_storytellers_organization_id ON storytellers(organization_id);
CREATE INDEX IF NOT EXISTS idx_storytellers_consent_status ON storytellers(consent_status);
CREATE INDEX IF NOT EXISTS idx_storytellers_is_active ON storytellers(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_verified ON organizations(is_verified);

CREATE INDEX IF NOT EXISTS idx_stories_storyteller_id ON stories(storyteller_id);
CREATE INDEX IF NOT EXISTS idx_stories_project_id ON stories(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_organization_id ON stories(organization_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_visibility ON stories(visibility);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_tags ON stories USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_story_interactions_story_id ON story_interactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_interactions_storyteller_id ON story_interactions(storyteller_id);
CREATE INDEX IF NOT EXISTS idx_story_interactions_type ON story_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_consent_records_storyteller_id ON consent_records(storyteller_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_story_id ON consent_records(story_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_status ON consent_records(status);

CREATE INDEX IF NOT EXISTS idx_cross_project_metrics_project_id ON cross_project_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_cross_project_metrics_organization_id ON cross_project_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_cross_project_metrics_date ON cross_project_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_justicehub_users_storyteller_id ON justicehub_users(storyteller_id);
CREATE INDEX IF NOT EXISTS idx_justicehub_users_email ON justicehub_users(email);

-- =====================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                 WHERE trigger_name = 'update_storytellers_updated_at') THEN
    CREATE TRIGGER update_storytellers_updated_at 
    BEFORE UPDATE ON storytellers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                 WHERE trigger_name = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                 WHERE trigger_name = 'update_organizations_updated_at') THEN
    CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                 WHERE trigger_name = 'update_stories_updated_at') THEN
    CREATE TRIGGER update_stories_updated_at 
    BEFORE UPDATE ON stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                 WHERE trigger_name = 'update_consent_records_updated_at') THEN
    CREATE TRIGGER update_consent_records_updated_at 
    BEFORE UPDATE ON consent_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                 WHERE trigger_name = 'update_justicehub_users_updated_at') THEN
    CREATE TRIGGER update_justicehub_users_updated_at 
    BEFORE UPDATE ON justicehub_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to increment story counters
CREATE OR REPLACE FUNCTION increment_story_counter(story_id UUID, counter_type TEXT)
RETURNS VOID AS $$
BEGIN
  CASE counter_type
    WHEN 'view' THEN
      UPDATE stories SET view_count = view_count + 1 WHERE id = story_id;
    WHEN 'like' THEN
      UPDATE stories SET like_count = like_count + 1 WHERE id = story_id;
    WHEN 'share' THEN
      UPDATE stories SET share_count = share_count + 1 WHERE id = story_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- INSERT SAMPLE DATA
-- =====================================

-- Insert sample organization if it doesn't exist
INSERT INTO organizations (id, name, slug, description, organization_type, is_verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'JusticeHub Platform',
  'justicehub',
  'The main JusticeHub platform organization for managing storytelling and cross-project initiatives.',
  'platform',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample project if it doesn't exist
INSERT INTO projects (id, name, slug, description, organization_id, project_type, status)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Youth Voices Initiative',
  'youth-voices',
  'A storytelling project focused on amplifying youth voices and experiences.',
  '00000000-0000-0000-0000-000000000001',
  'storytelling',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Insert additional sample projects
INSERT INTO projects (id, name, slug, description, organization_id, project_type, status)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'Community Impact Stories',
  'community-impact',
  'Stories showcasing the impact of community programs and initiatives.',
  '00000000-0000-0000-0000-000000000001',
  'storytelling',
  'active'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (id, name, slug, description, organization_id, project_type, status)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'Mentorship Journeys',
  'mentorship-journeys',
  'Stories about mentorship relationships and their transformative power.',
  '00000000-0000-0000-0000-000000000001',
  'storytelling',
  'active'
) ON CONFLICT (slug) DO NOTHING;
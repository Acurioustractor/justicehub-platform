-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  airtable_config JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('youth', 'mentor', 'org_admin', 'platform_admin')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization memberships
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Youth profiles
CREATE TABLE youth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  demographics JSONB DEFAULT '{}',
  skills_interests TEXT[] DEFAULT '{}',
  journey_timeline JSONB DEFAULT '[]',
  privacy_settings JSONB DEFAULT '{"story_default_visibility": "organization"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  youth_profile_id UUID REFERENCES youth_profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('local', 'airtable', 'import')),
  external_id TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'organization', 'mentors', 'public')),
  story_type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story media
CREATE TABLE story_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL,
  caption TEXT,
  external_url BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  youth_profile_id UUID REFERENCES youth_profiles(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  consent_details JSONB NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentor profiles
CREATE TABLE mentor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentorship relationships
CREATE TABLE mentorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  youth_id UUID REFERENCES youth_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('requested', 'active', 'ended', 'declined')),
  goals TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  requirements JSONB DEFAULT '{}',
  location JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Stories access policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories"
ON stories FOR SELECT
USING (youth_profile_id IN (
  SELECT id FROM youth_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view stories from their organizations"
ON stories FOR SELECT
USING (
  (visibility = 'organization' AND organization_id IN (
    SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()
  )) OR
  (visibility = 'public') OR
  (visibility = 'mentors' AND EXISTS (
    SELECT 1 FROM mentor_profiles WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can insert their own stories"
ON stories FOR INSERT
WITH CHECK (
  youth_profile_id IN (
    SELECT id FROM youth_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own stories"
ON stories FOR UPDATE
USING (
  youth_profile_id IN (
    SELECT id FROM youth_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own stories"
ON stories FOR DELETE
USING (
  youth_profile_id IN (
    SELECT id FROM youth_profiles WHERE user_id = auth.uid()
  )
);

-- Story media access policies
ALTER TABLE story_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media access follows story access"
ON story_media FOR SELECT
USING (
  story_id IN (
    SELECT id FROM stories WHERE 
    youth_profile_id IN (SELECT id FROM youth_profiles WHERE user_id = auth.uid()) OR
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()
    )) OR
    (visibility = 'public') OR
    (visibility = 'mentors' AND EXISTS (
      SELECT 1 FROM mentor_profiles WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can insert media for their stories"
ON story_media FOR INSERT
WITH CHECK (
  story_id IN (
    SELECT id FROM stories WHERE 
    youth_profile_id IN (SELECT id FROM youth_profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update media for their stories"
ON story_media FOR UPDATE
USING (
  story_id IN (
    SELECT id FROM stories WHERE 
    youth_profile_id IN (SELECT id FROM youth_profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete media for their stories"
ON story_media FOR DELETE
USING (
  story_id IN (
    SELECT id FROM stories WHERE 
    youth_profile_id IN (SELECT id FROM youth_profiles WHERE user_id = auth.uid())
  )
);

-- Create default organization
INSERT INTO organizations (name, slug) 
VALUES ('JusticeHub', 'justicehub');

-- Create indexes for performance
CREATE INDEX idx_stories_youth_profile_id ON stories(youth_profile_id);
CREATE INDEX idx_stories_organization_id ON stories(organization_id);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_stories_source ON stories(source);
CREATE INDEX idx_story_media_story_id ON story_media(story_id);
CREATE INDEX idx_org_memberships_user_id ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_organization_id ON org_memberships(organization_id);
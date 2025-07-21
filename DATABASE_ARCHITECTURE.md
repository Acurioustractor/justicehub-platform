# JusticeHub Database Architecture

## Overview

This document outlines the comprehensive database architecture for JusticeHub's expanded platform, supporting services, people, organizations, stories, art submissions, innovations, and community features.

## Core Tables

### 1. Organizations
The central hub for all entities providing youth justice services.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  type TEXT NOT NULL CHECK (type IN ('government', 'ngo', 'community', 'religious', 'cultural', 'private', 'social_enterprise')),
  legal_status TEXT CHECK (legal_status IN ('registered_charity', 'incorporated_association', 'company', 'government_agency', 'informal_group')),
  
  -- Mission & Description
  mission TEXT,
  description TEXT,
  vision TEXT,
  values TEXT[],
  
  -- Contact Information
  email TEXT,
  phone TEXT,
  website TEXT,
  social_media JSONB, -- {facebook: url, instagram: url, etc}
  
  -- Address
  street_address TEXT,
  suburb TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'Australia',
  
  -- Geographic Coordinates
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_areas TEXT[], -- Postcodes, suburbs, regions they serve
  
  -- Organizational Details
  founded_date DATE,
  size_category TEXT CHECK (size_category IN ('individual', 'small_1_5', 'medium_6_20', 'large_21_50', 'very_large_50_plus')),
  annual_budget_range TEXT CHECK (annual_budget_range IN ('under_10k', '10k_50k', '50k_200k', '200k_1m', 'over_1m')),
  staff_count INTEGER,
  volunteer_count INTEGER,
  
  -- Funding & Financial
  funding_sources TEXT[], -- ['government', 'grants', 'donations', 'fee_for_service', 'social_enterprise']
  funding_details JSONB, -- Detailed funding breakdown
  
  -- Verification & Quality
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged')),
  verification_date TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  data_source TEXT, -- 'manual', 'ai_scraped', 'api_import', 'community_submitted'
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  media_urls TEXT[], -- Additional photos, videos
  
  -- Certifications & Accreditations
  certifications JSONB, -- Array of certification objects
  accreditations JSONB, -- Array of accreditation objects
  
  -- Cultural Considerations
  cultural_focus TEXT[], -- ['indigenous', 'multicultural', 'refugee', 'lgbtqi', etc]
  languages_supported TEXT[],
  cultural_practices JSONB,
  
  -- Platform Integration
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  platform_notes TEXT, -- Internal notes for platform admin
  
  -- Search & Discovery
  search_vector tsvector, -- Full-text search
  tags TEXT[],
  keywords TEXT[]
);
```

### 2. People
Individuals associated with organizations, including staff, mentors, and key contacts.

```sql
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  pronouns TEXT,
  
  -- Professional Information
  title TEXT,
  role TEXT,
  bio TEXT,
  experience_years INTEGER,
  qualifications TEXT[],
  
  -- Contact Information
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  social_media JSONB,
  
  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Australia',
  timezone TEXT DEFAULT 'Australia/Sydney',
  
  -- Professional Details
  expertise_areas TEXT[], -- ['trauma_informed_care', 'cultural_healing', 'mentorship', etc]
  specializations TEXT[], -- ['young_mothers', 'indigenous_youth', 'justice_involved', etc]
  languages_spoken TEXT[],
  
  -- Availability & Engagement
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'unavailable', 'inactive')),
  response_time_hours INTEGER DEFAULT 24,
  max_mentees INTEGER,
  current_mentees INTEGER DEFAULT 0,
  
  -- Cultural Background
  cultural_identity TEXT[],
  lived_experience TEXT[], -- ['justice_system', 'homelessness', 'care_system', etc]
  
  -- Verification
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged')),
  background_check_status TEXT CHECK (background_check_status IN ('pending', 'cleared', 'flagged', 'expired')),
  background_check_date DATE,
  
  -- Platform Engagement
  is_mentor BOOLEAN DEFAULT false,
  is_public_profile BOOLEAN DEFAULT false,
  profile_photo_url TEXT,
  
  -- Success Metrics
  total_mentees INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage
  avg_rating DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,
  
  -- Search
  search_vector tsvector
);
```

### 3. Enhanced Services
Expanded services table with comprehensive program information.

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Service Details
  description TEXT NOT NULL,
  detailed_description TEXT,
  program_type TEXT NOT NULL, -- 'diversion', 'prevention', 'intervention', 'reintegration', 'support'
  service_category TEXT[], -- ['mentorship', 'education', 'cultural', 'therapeutic', etc]
  
  -- Target Demographics
  target_age_min INTEGER,
  target_age_max INTEGER,
  target_demographics TEXT[], -- ['indigenous', 'care_experienced', 'homeless', etc]
  gender_specific TEXT CHECK (gender_specific IN ('any', 'male', 'female', 'non_binary', 'trans_inclusive')),
  
  -- Service Delivery
  delivery_method TEXT[] NOT NULL, -- ['in_person', 'online', 'phone', 'group', 'individual']
  frequency TEXT, -- 'daily', 'weekly', 'monthly', 'as_needed'
  duration_weeks INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high', 'intensive')),
  
  -- Capacity & Availability
  capacity_total INTEGER,
  capacity_current INTEGER DEFAULT 0,
  waiting_list_count INTEGER DEFAULT 0,
  is_accepting_referrals BOOLEAN DEFAULT true,
  
  -- Location & Access
  service_areas TEXT[], -- Geographic areas served
  transport_provided BOOLEAN DEFAULT false,
  accessibility_features TEXT[],
  
  -- Requirements & Eligibility
  eligibility_criteria TEXT[],
  referral_required BOOLEAN DEFAULT false,
  referral_sources TEXT[], -- ['court', 'police', 'school', 'self', 'family']
  prerequisites TEXT[],
  
  -- Outcomes & Effectiveness
  success_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  participants_total INTEGER DEFAULT 0,
  participants_current INTEGER DEFAULT 0,
  
  -- Evidence Base
  evidence_level TEXT CHECK (evidence_level IN ('emerging', 'promising', 'evidence_based', 'proven')),
  research_backing TEXT[],
  evaluation_reports TEXT[], -- URLs to evaluation documents
  
  -- Cultural Elements
  cultural_approach TEXT[],
  cultural_protocols JSONB,
  elder_involvement BOOLEAN DEFAULT false,
  traditional_practices BOOLEAN DEFAULT false,
  
  -- Cost & Funding
  cost_to_participant DECIMAL(10,2) DEFAULT 0,
  cost_per_participant DECIMAL(10,2), -- Program cost
  funding_model TEXT[], -- ['government', 'fee_for_service', 'philanthropy']
  
  -- Platform Features
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  quality_rating DECIMAL(3,2),
  admin_notes TEXT,
  
  -- Media & Documentation
  image_urls TEXT[],
  video_urls TEXT[],
  document_urls TEXT[],
  brochure_url TEXT,
  
  -- Search & Discovery
  search_vector tsvector,
  tags TEXT[],
  keywords TEXT[]
);
```

### 4. Enhanced Stories
Expanded stories table supporting multiple content types.

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author_id UUID, -- Can be null for anonymous stories
  author_name TEXT, -- Display name, may be anonymous
  
  -- Content
  content TEXT NOT NULL,
  excerpt TEXT,
  content_type TEXT DEFAULT 'story' CHECK (content_type IN ('story', 'blog_post', 'interview', 'video', 'podcast', 'photo_essay')),
  
  -- Story Classification
  story_category TEXT[], -- ['transformation', 'advocacy', 'healing', 'education', 'mentorship']
  themes TEXT[], -- ['second_chances', 'cultural_healing', 'family_reunion', etc]
  life_stage TEXT[], -- ['childhood', 'adolescence', 'young_adult', 'adult']
  
  -- Privacy & Visibility
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'organization', 'mentors', 'private')),
  is_anonymous BOOLEAN DEFAULT false,
  consent_level TEXT DEFAULT 'full' CHECK (consent_level IN ('full', 'limited', 'withdrawn')),
  
  -- Media & Rich Content
  featured_image_url TEXT,
  media_urls TEXT[], -- Additional images, videos, audio
  media_metadata JSONB, -- Captions, alt text, credits
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Editorial
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'published', 'archived')),
  editor_notes TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Program Association
  related_service_id UUID REFERENCES services(id),
  related_organization_id UUID REFERENCES organizations(id),
  mentor_id UUID REFERENCES people(id),
  
  -- Impact & Outcomes
  impact_category TEXT[], -- ['education', 'employment', 'housing', 'relationships', 'legal']
  outcome_achieved BOOLEAN,
  outcome_description TEXT,
  
  -- Search & Discovery
  search_vector tsvector,
  tags TEXT[]
);
```

### 5. Art Submissions
Supporting the Art & Innovation platform.

```sql
CREATE TABLE art_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL, -- May be pseudonym
  artist_age INTEGER,
  artist_id UUID, -- Link to user if they have account
  
  -- Art Details
  medium TEXT NOT NULL, -- 'digital_art', 'photography', 'music', 'poetry', 'video', etc
  technique TEXT,
  description TEXT NOT NULL,
  artist_statement TEXT,
  
  -- Content
  primary_media_url TEXT NOT NULL,
  additional_media_urls TEXT[],
  thumbnail_url TEXT,
  
  -- Technical Specifications
  file_format TEXT,
  resolution TEXT,
  file_size_mb DECIMAL(8,2),
  duration_seconds INTEGER, -- For audio/video
  
  -- Program Association
  program_name TEXT,
  organization_id UUID REFERENCES organizations(id),
  mentor_id UUID REFERENCES people(id),
  
  -- Challenge & Contest
  challenge_id UUID, -- Link to creative challenges
  is_challenge_submission BOOLEAN DEFAULT false,
  
  -- Visibility & Rights
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'organization', 'private')),
  usage_rights TEXT DEFAULT 'platform_use' CHECK (usage_rights IN ('platform_use', 'commercial', 'restricted')),
  consent_form_signed BOOLEAN DEFAULT false,
  
  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES people(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Recognition
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  awards TEXT[],
  recognitions JSONB,
  
  -- Themes & Categorization
  themes TEXT[], -- 'hope', 'transformation', 'culture', 'identity'
  emotions TEXT[], -- 'healing', 'empowerment', 'reflection'
  tags TEXT[]
);
```

### 6. Innovation Projects
Tracking tech innovations and community solutions.

```sql
CREATE TABLE innovation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Project Information
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT,
  
  -- Project Classification
  type TEXT NOT NULL CHECK (type IN ('technology', 'process', 'program', 'policy', 'research')),
  category TEXT[], -- 'ai_matching', 'cultural_tech', 'data_platform', 'therapeutic_tools'
  
  -- Development Status
  status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'research', 'development', 'pilot', 'active', 'completed', 'paused')),
  development_stage TEXT CHECK (development_stage IN ('ideation', 'prototype', 'mvp', 'beta', 'production')),
  
  -- Team & Leadership
  lead_organization_id UUID REFERENCES organizations(id),
  team_members UUID[], -- Array of people IDs
  partners UUID[], -- Array of organization IDs
  
  -- Technical Details
  tech_stack TEXT[],
  implementation_approach TEXT,
  technical_requirements JSONB,
  
  -- Impact & Evaluation
  target_outcomes TEXT[],
  success_metrics JSONB,
  current_metrics JSONB,
  evaluation_method TEXT,
  
  -- Timeline & Resources
  start_date DATE,
  expected_completion DATE,
  budget_range TEXT,
  funding_status TEXT CHECK (funding_status IN ('unfunded', 'partially_funded', 'fully_funded')),
  
  -- Evidence & Documentation
  research_backing TEXT[],
  documentation_urls TEXT[],
  demo_urls TEXT[],
  
  -- Community Engagement
  community_input_method TEXT[],
  user_testing_completed BOOLEAN DEFAULT false,
  feedback_integration JSONB,
  
  -- Visibility & Sharing
  is_public BOOLEAN DEFAULT true,
  is_open_source BOOLEAN DEFAULT false,
  repository_url TEXT,
  license_type TEXT,
  
  -- Search
  search_vector tsvector,
  tags TEXT[]
);
```

## Supporting Tables

### 7. Creative Challenges
Monthly creative challenges for the community.

```sql
CREATE TABLE creative_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  guidelines TEXT,
  
  -- Timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  voting_end_date DATE,
  
  -- Submission Rules
  allowed_media TEXT[] NOT NULL, -- 'photo', 'video', 'audio', 'text', 'digital_art'
  max_submissions_per_person INTEGER DEFAULT 1,
  
  -- Prizes & Recognition
  prizes JSONB, -- Description of prizes for different places
  recognition_type TEXT[], -- 'featured', 'exhibition', 'mentorship'
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'judging', 'completed')),
  submission_count INTEGER DEFAULT 0,
  
  -- Judging
  judging_criteria JSONB,
  judges UUID[], -- Array of people IDs
  
  is_featured BOOLEAN DEFAULT false
);
```

### 8. Organization-People Relationships
Many-to-many relationship between organizations and people.

```sql
CREATE TABLE organization_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('staff', 'volunteer', 'board_member', 'contractor', 'mentor', 'advisor')),
  role_title TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  
  UNIQUE(organization_id, person_id, relationship_type)
);
```

### 9. Contact Information
Flexible contact system for organizations and services.

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id),
  
  contact_type TEXT NOT NULL CHECK (contact_type IN ('primary', 'referrals', 'media', 'emergency', 'administrative')),
  
  name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  
  is_primary BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  hours_available TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'text', 'any')),
  
  notes TEXT
);
```

### 10. Locations
Flexible location system supporting multiple addresses per organization.

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  
  location_type TEXT NOT NULL CHECK (location_type IN ('head_office', 'service_delivery', 'mailing', 'branch')),
  name TEXT, -- Location name like "North Office"
  
  street_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'Australia',
  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  accessibility_features TEXT[],
  parking_available BOOLEAN DEFAULT false,
  public_transport_access TEXT,
  
  is_primary BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true
);
```

## Analytics & Tracking Tables

### 11. User Interactions
Track user engagement across the platform.

```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id UUID, -- Can be null for anonymous users
  session_id TEXT,
  ip_address INET,
  
  action_type TEXT NOT NULL, -- 'view', 'like', 'share', 'download', 'contact', 'apply'
  resource_type TEXT NOT NULL, -- 'service', 'story', 'organization', 'art'
  resource_id UUID NOT NULL,
  
  metadata JSONB, -- Additional context about the interaction
  
  -- Geographic context
  location_city TEXT,
  location_state TEXT,
  location_country TEXT
);
```

### 12. Search Analytics
Track search patterns to improve discoverability.

```sql
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  query TEXT NOT NULL,
  result_count INTEGER,
  user_id UUID,
  session_id TEXT,
  
  filters_applied JSONB,
  results_clicked INTEGER DEFAULT 0,
  
  location_context TEXT, -- User's location when searching
  
  INDEX(query),
  INDEX(created_at)
);
```

## Indexes for Performance

```sql
-- Organization indexes
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_verification ON organizations(verification_status);
CREATE INDEX idx_organizations_location ON organizations(state, city);
CREATE INDEX idx_organizations_search ON organizations USING GIN(search_vector);
CREATE INDEX idx_organizations_tags ON organizations USING GIN(tags);

-- People indexes
CREATE INDEX idx_people_availability ON people(availability_status);
CREATE INDEX idx_people_expertise ON people USING GIN(expertise_areas);
CREATE INDEX idx_people_mentor ON people(is_mentor) WHERE is_mentor = true;

-- Services indexes
CREATE INDEX idx_services_org ON services(organization_id);
CREATE INDEX idx_services_type ON services(program_type);
CREATE INDEX idx_services_category ON services USING GIN(service_category);
CREATE INDEX idx_services_search ON services USING GIN(search_vector);
CREATE INDEX idx_services_accepting ON services(is_accepting_referrals) WHERE is_accepting_referrals = true;

-- Stories indexes
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_published ON stories(published_at) WHERE status = 'published';
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_stories_search ON stories USING GIN(search_vector);

-- Art submissions indexes
CREATE INDEX idx_art_status ON art_submissions(status);
CREATE INDEX idx_art_medium ON art_submissions(medium);
CREATE INDEX idx_art_featured ON art_submissions(is_featured) WHERE is_featured = true;
CREATE INDEX idx_art_challenge ON art_submissions(challenge_id);

-- Innovation projects indexes
CREATE INDEX idx_innovation_status ON innovation_projects(status);
CREATE INDEX idx_innovation_type ON innovation_projects(type);
CREATE INDEX idx_innovation_lead_org ON innovation_projects(lead_organization_id);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on sensitive tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_submissions ENABLE ROW LEVEL SECURITY;

-- Example policies (simplified)
CREATE POLICY "Public profiles are viewable by everyone" ON people
    FOR SELECT USING (is_public_profile = true);

CREATE POLICY "Users can view their own profile" ON people
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Published stories are viewable by everyone" ON stories
    FOR SELECT USING (status = 'published' AND visibility = 'public');

CREATE POLICY "Authors can manage their own stories" ON stories
    FOR ALL USING (auth.uid() = author_id);
```

## Views for Common Queries

### Active Services View
```sql
CREATE VIEW active_services AS
SELECT 
    s.*,
    o.name as organization_name,
    o.type as organization_type,
    o.verification_status as org_verification_status
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE s.is_accepting_referrals = true
    AND o.is_active = true
    AND o.verification_status = 'verified';
```

### Featured Content View
```sql
CREATE VIEW featured_content AS
SELECT 
    'story' as content_type,
    id,
    title,
    created_at,
    'stories' as table_name
FROM stories 
WHERE status = 'published' AND visibility = 'public'

UNION ALL

SELECT 
    'art' as content_type,
    id,
    title,
    created_at,
    'art_submissions' as table_name
FROM art_submissions 
WHERE status = 'approved' AND is_featured = true

UNION ALL

SELECT 
    'innovation' as content_type,
    id,
    title,
    created_at,
    'innovation_projects' as table_name
FROM innovation_projects 
WHERE is_public = true AND status IN ('pilot', 'active')

ORDER BY created_at DESC;
```

## Data Migration Considerations

1. **Existing Data**: Current services data will need to be migrated to the new schema
2. **Backwards Compatibility**: Maintain API compatibility during transition
3. **Gradual Rollout**: Implement new features incrementally
4. **Data Quality**: Implement validation and cleaning processes
5. **Performance**: Monitor query performance and adjust indexes as needed

## Security Considerations

1. **PII Protection**: Encrypt sensitive personal information
2. **Access Control**: Implement role-based access with RLS
3. **Audit Trail**: Track all data modifications
4. **Data Retention**: Implement policies for data lifecycle management
5. **GDPR Compliance**: Ensure data portability and right to deletion

## Next Steps

1. Create migration scripts for existing data
2. Implement new API endpoints for enhanced functionality
3. Update frontend components to use new data structure
4. Implement search functionality with full-text search
5. Add analytics dashboard for platform insights
6. Create AI integration points for automated data enrichment
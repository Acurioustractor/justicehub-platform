-- JusticeHub Platform - Row Level Security Policies
-- This migration sets up comprehensive RLS policies for data security

-- =====================================
-- ENABLE RLS ON ALL TABLES
-- =====================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE youth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE empathy_ledger_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_project_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================
-- ORGANIZATIONS POLICIES
-- =====================================

-- Anyone can view active, verified organizations
CREATE POLICY "Public organizations are viewable by everyone" ON organizations
    FOR SELECT USING (is_active = true AND verification_status = 'verified');

-- Organization members can view their organization
CREATE POLICY "Organization members can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Organization admins can update their organization
CREATE POLICY "Organization admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner') AND is_active = true
        )
    );

-- Platform admins can manage all organizations
CREATE POLICY "Platform admins can manage organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- =====================================
-- USERS POLICIES
-- =====================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Organization admins can view members of their organization
CREATE POLICY "Organization admins can view their members" ON users
    FOR SELECT USING (
        id IN (
            SELECT om1.user_id FROM org_memberships om1
            WHERE om1.organization_id IN (
                SELECT om2.organization_id FROM org_memberships om2
                WHERE om2.user_id = auth.uid() AND om2.role IN ('admin', 'owner')
            )
        )
    );

-- Platform admins can view all users
CREATE POLICY "Platform admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- =====================================
-- ORG MEMBERSHIPS POLICIES
-- =====================================

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON org_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Organization admins can view all memberships in their organization
CREATE POLICY "Organization admins can view org memberships" ON org_memberships
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Organization admins can manage memberships in their organization
CREATE POLICY "Organization admins can manage memberships" ON org_memberships
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- =====================================
-- YOUTH PROFILES POLICIES
-- =====================================

-- Youth can view and manage their own profile
CREATE POLICY "Youth can manage own profile" ON youth_profiles
    FOR ALL USING (user_id = auth.uid());

-- Mentors can view youth profiles of their mentees
CREATE POLICY "Mentors can view mentee profiles" ON youth_profiles
    FOR SELECT USING (
        id IN (
            SELECT youth_id FROM mentorships 
            WHERE mentor_id IN (
                SELECT id FROM mentor_profiles WHERE user_id = auth.uid()
            ) AND status = 'active'
        )
    );

-- Organization admins can view youth profiles in their organization
CREATE POLICY "Organization admins can view youth in their org" ON youth_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT om1.user_id FROM org_memberships om1
            WHERE om1.organization_id IN (
                SELECT om2.organization_id FROM org_memberships om2
                WHERE om2.user_id = auth.uid() AND om2.role IN ('admin', 'owner')
            )
        )
    );

-- =====================================
-- MENTOR PROFILES POLICIES
-- =====================================

-- Mentors can view and manage their own profile
CREATE POLICY "Mentors can manage own profile" ON mentor_profiles
    FOR ALL USING (user_id = auth.uid());

-- Anyone can view verified mentor profiles (for matching)
CREATE POLICY "Anyone can view verified mentors" ON mentor_profiles
    FOR SELECT USING (verification_status = 'verified' AND is_accepting_mentees = true);

-- Organization admins can view mentors in their organization
CREATE POLICY "Organization admins can view mentors in their org" ON mentor_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT om1.user_id FROM org_memberships om1
            WHERE om1.organization_id IN (
                SELECT om2.organization_id FROM org_memberships om2
                WHERE om2.user_id = auth.uid() AND om2.role IN ('admin', 'owner')
            )
        )
    );

-- =====================================
-- STORIES POLICIES
-- =====================================

-- Public stories are viewable by everyone
CREATE POLICY "Public stories are viewable by everyone" ON stories
    FOR SELECT USING (visibility = 'public' AND status = 'published');

-- Organization stories are viewable by organization members
CREATE POLICY "Organization stories viewable by org members" ON stories
    FOR SELECT USING (
        visibility = 'organization' AND status = 'published' AND
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Mentor stories are viewable by mentors
CREATE POLICY "Mentor stories viewable by mentors" ON stories
    FOR SELECT USING (
        visibility = 'mentors' AND status = 'published' AND
        EXISTS (
            SELECT 1 FROM mentor_profiles 
            WHERE user_id = auth.uid() AND verification_status = 'verified'
        )
    );

-- Authors can view and manage their own stories
CREATE POLICY "Authors can manage own stories" ON stories
    FOR ALL USING (author_id = auth.uid());

-- Youth can manage stories through their profile
CREATE POLICY "Youth can manage stories through profile" ON stories
    FOR ALL USING (
        youth_profile_id IN (
            SELECT id FROM youth_profiles WHERE user_id = auth.uid()
        )
    );

-- Organization admins can view stories in their organization
CREATE POLICY "Organization admins can view org stories" ON stories
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- =====================================
-- STORY MEDIA POLICIES
-- =====================================

-- Story media follows story access rules
CREATE POLICY "Story media follows story access" ON story_media
    FOR SELECT USING (
        story_id IN (
            SELECT id FROM stories WHERE
            (visibility = 'public' AND status = 'published') OR
            (visibility = 'organization' AND status = 'published' AND organization_id IN (
                SELECT organization_id FROM org_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )) OR
            (visibility = 'mentors' AND status = 'published' AND EXISTS (
                SELECT 1 FROM mentor_profiles 
                WHERE user_id = auth.uid() AND verification_status = 'verified'
            )) OR
            (author_id = auth.uid()) OR
            (youth_profile_id IN (
                SELECT id FROM youth_profiles WHERE user_id = auth.uid()
            ))
        )
    );

-- Story authors can manage their story media
CREATE POLICY "Story authors can manage story media" ON story_media
    FOR ALL USING (
        story_id IN (
            SELECT id FROM stories WHERE 
            author_id = auth.uid() OR 
            youth_profile_id IN (
                SELECT id FROM youth_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================
-- STORY INTERACTIONS POLICIES
-- =====================================

-- Users can manage their own interactions
CREATE POLICY "Users can manage own story interactions" ON story_interactions
    FOR ALL USING (user_id = auth.uid());

-- Story authors can view interactions on their stories
CREATE POLICY "Story authors can view interactions on their stories" ON story_interactions
    FOR SELECT USING (
        story_id IN (
            SELECT id FROM stories WHERE 
            author_id = auth.uid() OR 
            youth_profile_id IN (
                SELECT id FROM youth_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================
-- MENTORSHIP POLICIES
-- =====================================

-- Youth can view and manage their mentorship requests
CREATE POLICY "Youth can manage own mentorship requests" ON mentorship_requests
    FOR ALL USING (
        youth_id IN (
            SELECT id FROM youth_profiles WHERE user_id = auth.uid()
        )
    );

-- Mentors can view and respond to requests for them
CREATE POLICY "Mentors can manage requests for them" ON mentorship_requests
    FOR ALL USING (
        mentor_id IN (
            SELECT id FROM mentor_profiles WHERE user_id = auth.uid()
        )
    );

-- Mentorship participants can view and manage their mentorships
CREATE POLICY "Mentorship participants can manage their mentorships" ON mentorships
    FOR ALL USING (
        youth_id IN (
            SELECT id FROM youth_profiles WHERE user_id = auth.uid()
        ) OR
        mentor_id IN (
            SELECT id FROM mentor_profiles WHERE user_id = auth.uid()
        )
    );

-- =====================================
-- SERVICES POLICIES
-- =====================================

-- Anyone can view active services
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT USING (is_active = true);

-- Organization members can manage their organization's services
CREATE POLICY "Organization members can manage org services" ON services
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- =====================================
-- OPPORTUNITIES POLICIES
-- =====================================

-- Anyone can view active opportunities
CREATE POLICY "Anyone can view active opportunities" ON opportunities
    FOR SELECT USING (is_active = true);

-- Organization members can manage their organization's opportunities
CREATE POLICY "Organization members can manage org opportunities" ON opportunities
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- =====================================
-- EMPATHY LEDGER POLICIES
-- =====================================

-- Organization admins can view their sync logs
CREATE POLICY "Organization admins can view sync logs" ON empathy_ledger_sync_log
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Organization admins can view their metrics
CREATE POLICY "Organization admins can view their metrics" ON cross_project_metrics
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Platform admins can view all metrics
CREATE POLICY "Platform admins can view all metrics" ON cross_project_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- =====================================
-- STORAGE POLICIES
-- =====================================

-- Create storage bucket policies (to be run after bucket creation)
-- These will be applied via the Supabase dashboard or API

-- Story media bucket policy
-- INSERT INTO storage.buckets (id, name, public) VALUES ('story-media', 'story-media', false);

-- Profile images bucket policy  
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Organization assets bucket policy
-- INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true);
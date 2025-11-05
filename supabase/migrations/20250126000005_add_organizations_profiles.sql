-- Create organizations_profiles junction table for many-to-many relationships
CREATE TABLE IF NOT EXISTS organizations_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  public_profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  role TEXT, -- e.g., 'founder', 'director', 'board member', 'staff', 'volunteer'
  role_description TEXT, -- Additional context about their role
  start_date DATE,
  end_date DATE, -- NULL if current
  is_current BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Feature this person on org page
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Ensure no duplicate person-organization pairs
  UNIQUE(organization_id, public_profile_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_profiles_org_id
ON organizations_profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_organizations_profiles_profile_id
ON organizations_profiles(public_profile_id);

CREATE INDEX IF NOT EXISTS idx_organizations_profiles_featured
ON organizations_profiles(is_featured)
WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_organizations_profiles_current
ON organizations_profiles(is_current)
WHERE is_current = true;

-- Create blog_posts_profiles junction table for linking stories to people
CREATE TABLE IF NOT EXISTS blog_posts_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  public_profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  role TEXT, -- e.g., 'subject', 'author', 'contributor', 'mentioned'
  is_featured BOOLEAN DEFAULT false, -- Feature this person in story
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),

  -- Ensure no duplicate person-story pairs
  UNIQUE(blog_post_id, public_profile_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_profiles_post_id
ON blog_posts_profiles(blog_post_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_profiles_profile_id
ON blog_posts_profiles(public_profile_id);

-- Add updated_at trigger for organizations_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_profiles_updated_at
BEFORE UPDATE ON organizations_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE organizations_profiles IS 'Links people to organizations they work with or founded';
COMMENT ON TABLE blog_posts_profiles IS 'Links people to stories/blog posts they are featured in';

-- Create alma_stories table (if not exists) with story-linker columns
CREATE TABLE IF NOT EXISTS alma_stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  full_story text,
  summary text,
  story_type text,
  story_date date,
  status text DEFAULT 'draft',
  featured boolean DEFAULT false,
  impact_areas jsonb,
  media_urls jsonb,
  contact_id uuid,
  project_id uuid,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  region_slug text,
  linked_organization_ids text[],
  linked_intervention_ids text[]
);

-- Index for finding unlinked stories
CREATE INDEX IF NOT EXISTS idx_alma_stories_region_slug ON alma_stories (region_slug);

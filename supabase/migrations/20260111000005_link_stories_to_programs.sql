-- Migration: Link Community Programs and Stories (Adapted for Stories Table)
-- Replaces functionality of link-programs-and-stories.sql
-- TARGET: public.stories (which serves as the source for the articles view)

-- 1. Add program_id to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.community_programs(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stories_program_id ON public.stories(program_id);

-- 3. Add storyteller metadata to community_programs (as requested in original script)
ALTER TABLE public.community_programs
ADD COLUMN IF NOT EXISTS featured_storyteller_name TEXT,
ADD COLUMN IF NOT EXISTS featured_storyteller_story TEXT;

-- 4. Create a view for programs with their related stories
-- Updated to query 'stories' directly instead of 'articles' view
CREATE OR REPLACE VIEW public.programs_with_stories AS
SELECT
  p.*,
  COUNT(s.id) as story_count,
  json_agg(
    json_build_object(
      'id', s.id,
      'slug', s.slug,
      'title', s.title,
      'excerpt', s.excerpt,
      'featured_image_url', s.featured_image_url,
      'published_at', s.created_at -- stories might use created_at or specific publish date
    ) ORDER BY s.created_at DESC
  ) FILTER (WHERE s.id IS NOT NULL) as stories
FROM public.community_programs p
LEFT JOIN public.stories s ON s.program_id = p.id AND s.status = 'published'
GROUP BY p.id;

-- 5. Grant permissions
GRANT SELECT ON public.programs_with_stories TO anon, authenticated, service_role;

-- 6. Comments
COMMENT ON COLUMN public.stories.program_id IS 'Links a story to the community program it describes';
COMMENT ON COLUMN public.community_programs.featured_storyteller_name IS 'Name of a featured storyteller from this program';
COMMENT ON COLUMN public.community_programs.featured_storyteller_story IS 'Brief quote or story snippet from featured storyteller';
COMMENT ON VIEW public.programs_with_stories IS 'View combining programs with their related stories for easy display';

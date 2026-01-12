-- Migration: Link Community Programs and Stories
-- This enables the connection between programs and the stories about them

-- Add program_id column to articles table to link stories to programs
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.community_programs(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_program_id ON public.articles(program_id);

-- Add storyteller information to community_programs (optional metadata)
ALTER TABLE public.community_programs
ADD COLUMN IF NOT EXISTS featured_storyteller_name TEXT,
ADD COLUMN IF NOT EXISTS featured_storyteller_story TEXT;

-- Create a view for programs with their related stories
CREATE OR REPLACE VIEW public.programs_with_stories AS
SELECT
  p.*,
  COUNT(a.id) as story_count,
  json_agg(
    json_build_object(
      'id', a.id,
      'slug', a.slug,
      'title', a.title,
      'excerpt', a.excerpt,
      'featured_image_url', a.featured_image_url,
      'published_at', a.published_at
    ) ORDER BY a.published_at DESC
  ) FILTER (WHERE a.id IS NOT NULL) as stories
FROM public.community_programs p
LEFT JOIN public.articles a ON a.program_id = p.id AND a.status = 'published'
GROUP BY p.id;

-- Grant permissions
GRANT SELECT ON public.programs_with_stories TO anon, authenticated;

-- Comment on changes
COMMENT ON COLUMN public.articles.program_id IS 'Links a story to the community program it describes';
COMMENT ON COLUMN public.community_programs.featured_storyteller_name IS 'Name of a featured storyteller from this program';
COMMENT ON COLUMN public.community_programs.featured_storyteller_story IS 'Brief quote or story snippet from featured storyteller';
COMMENT ON VIEW public.programs_with_stories IS 'View combining programs with their related stories for easy display';

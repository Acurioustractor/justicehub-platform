-- ============================================
-- JusticeHub Project Setup
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Create projects table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public projects viewable" 
  ON public.projects FOR SELECT 
  USING (is_public = true);

-- Step 2: Insert JusticeHub project
INSERT INTO public.projects (name, slug, description, is_public)
VALUES ('JusticeHub', 'justicehub', 'JusticeHub platform stories', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
RETURNING id;

-- Copy the ID from the result above!

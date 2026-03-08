-- Add avatar and featured flag to project_backers
ALTER TABLE project_backers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE project_backers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

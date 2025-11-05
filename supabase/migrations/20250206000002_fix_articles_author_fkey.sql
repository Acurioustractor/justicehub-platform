-- Fix articles.author_id to reference public_profiles instead of authors table

-- Drop the old foreign key constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;

-- Add new foreign key constraint pointing to public_profiles
ALTER TABLE articles
ADD CONSTRAINT articles_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES public_profiles(id)
ON DELETE SET NULL;

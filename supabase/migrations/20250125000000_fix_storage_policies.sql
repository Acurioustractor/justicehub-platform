-- Fix storage policies for story-images bucket

-- First, remove any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;

-- Create new policies for story-images bucket

-- 1. Allow authenticated users to INSERT (upload)
CREATE POLICY "Allow authenticated upload to story-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'story-images');

-- 2. Allow everyone to SELECT (read/download)
CREATE POLICY "Allow public read from story-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-images');

-- 3. Allow authenticated users to UPDATE
CREATE POLICY "Allow authenticated update in story-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'story-images')
WITH CHECK (bucket_id = 'story-images');

-- 4. Allow authenticated users to DELETE
CREATE POLICY "Allow authenticated delete from story-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'story-images');

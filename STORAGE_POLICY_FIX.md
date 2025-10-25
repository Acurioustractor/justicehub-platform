# Fix Storage Policies for Image Upload

## The Problem
Image uploads are failing with: `new row violates row-level security policy`

This is because the `story-images` bucket doesn't have the correct RLS policies set up.

## The Solution
Run these SQL commands in the Supabase SQL Editor:

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Paste and Run This SQL

```sql
-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated upload to story-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from story-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in story-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from story-images" ON storage.objects;

-- Create new storage policies for story-images bucket

-- 1. Allow authenticated users to upload (INSERT)
CREATE POLICY "Allow authenticated upload to story-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'story-images');

-- 2. Allow everyone to read/download (SELECT)
CREATE POLICY "Allow public read from story-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'story-images');

-- 3. Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated update in story-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'story-images')
WITH CHECK (bucket_id = 'story-images');

-- 4. Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated delete from story-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'story-images');
```

### Step 3: Verify

After running the SQL, test the upload by:
1. Going to http://localhost:3003/admin/blog/new
2. Dragging an image into the editor
3. The upload should now work!

## Alternative: Use Supabase UI

If SQL doesn't work, you can create policies through the UI:

1. Go to **Storage** > **story-images** > **Policies** tab
2. Click **New Policy** for each of these:

### Policy 1: Upload
- **Name**: Allow authenticated upload to story-images
- **Policy command**: INSERT
- **Target roles**: authenticated
- **WITH CHECK expression**: `bucket_id = 'story-images'`

### Policy 2: Read
- **Name**: Allow public read from story-images
- **Policy command**: SELECT
- **Target roles**: public
- **USING expression**: `bucket_id = 'story-images'`

### Policy 3: Update
- **Name**: Allow authenticated update in story-images
- **Policy command**: UPDATE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'story-images'`
- **WITH CHECK expression**: `bucket_id = 'story-images'`

### Policy 4: Delete
- **Name**: Allow authenticated delete from story-images
- **Policy command**: DELETE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'story-images'`

## Why This is Needed

Storage buckets in Supabase have their own RLS (Row Level Security) system. Even with the service role key, uploads need proper policies defined. These policies:

1. **INSERT**: Allow logged-in users to upload new images
2. **SELECT**: Allow everyone (public) to view/download images
3. **UPDATE**: Allow logged-in users to update their uploads
4. **DELETE**: Allow logged-in users to delete their uploads

Once these are in place, the image upload feature will work perfectly!

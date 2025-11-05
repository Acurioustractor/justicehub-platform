# Apply Media Library Migration - Quick Guide

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your JusticeHub project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Copy and Paste This SQL

Copy the ENTIRE contents below and paste into the SQL editor:

```sql
-- Create media_library table for centralized image management
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'uploads',
  versions JSONB DEFAULT '{}'::jsonb,
  blurhash TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_posts INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_mime_type CHECK (mime_type LIKE 'image/%')
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(folder);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_library_file_name ON media_library(file_name);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_media_library_search ON media_library
  USING GIN (to_tsvector('english',
    COALESCE(file_name, '') || ' ' ||
    COALESCE(alt_text, '') || ' ' ||
    COALESCE(caption, '')
  ));

-- Enable RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view media" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media_library;
DROP POLICY IF EXISTS "Users can update their own media" ON media_library;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_library;
DROP POLICY IF EXISTS "Admins can do anything with media" ON media_library;

-- Create policies
CREATE POLICY "Anyone can view media"
  ON media_library FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media_library FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own media"
  ON media_library FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own media"
  ON media_library FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can do anything with media"
  ON media_library FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'user_role' = 'admin'
    )
  );

-- Update trigger function
CREATE OR REPLACE FUNCTION update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS media_library_updated_at ON media_library;

-- Create trigger
CREATE TRIGGER media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at();

-- Add reading_time_minutes to blog_posts if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'reading_time_minutes'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN reading_time_minutes INTEGER;
  END IF;
END $$;
```

## Step 3: Run the Query

Click **RUN** or press `Cmd/Ctrl + Enter`

## Step 4: Verify Success

You should see: ✅ **Success. No rows returned**

Run this verification query:

```sql
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'media_library'
ORDER BY ordinal_position;
```

You should see all the columns listed!

## Step 5: Test Upload

1. Go to http://localhost:3003/admin/blog/new
2. Try uploading an image (drag & drop or click upload button)
3. Go to http://localhost:3003/admin/media
4. You should see your uploaded image with optimized versions!

## Troubleshooting

### If you see "relation already exists"
✅ This is fine! It means the table already exists. Just continue.

### If you see permission errors
- Make sure you're using the SQL Editor in Supabase Dashboard
- Make sure you're logged in as the project owner

### If images still don't upload
- Check that `YJSF_SUPABASE_SERVICE_KEY` is set in Vercel environment variables
- Check browser console for errors
- Verify storage policies were applied

## What This Does

✅ Creates `media_library` table with all metadata fields
✅ Adds search indexes for fast queries
✅ Sets up Row-Level Security policies
✅ Creates auto-update trigger for `updated_at`
✅ Adds `reading_time_minutes` to blog_posts

---

**After running this, your media library will be fully functional!** 🎉

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

  -- Optimized versions stored as JSONB
  -- Example: { "thumbnail": "path/to/thumb.webp", "medium": "path/to/medium.webp", "large": "path/to/large.webp" }
  versions JSONB DEFAULT '{}'::jsonb,

  -- Blurhash for loading placeholders
  blurhash TEXT,

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_posts INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_mime_type CHECK (mime_type LIKE 'image/%')
);

-- Add indexes for common queries
CREATE INDEX idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX idx_media_library_folder ON media_library(folder);
CREATE INDEX idx_media_library_created_at ON media_library(created_at DESC);
CREATE INDEX idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX idx_media_library_file_name ON media_library(file_name);

-- Add full-text search on file_name, alt_text, and caption
CREATE INDEX idx_media_library_search ON media_library
  USING GIN (to_tsvector('english',
    COALESCE(file_name, '') || ' ' ||
    COALESCE(alt_text, '') || ' ' ||
    COALESCE(caption, '')
  ));

-- Enable RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view media
CREATE POLICY "Anyone can view media"
  ON media_library
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert media
CREATE POLICY "Authenticated users can insert media"
  ON media_library
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can update their own media
CREATE POLICY "Users can update their own media"
  ON media_library
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own media
CREATE POLICY "Users can delete their own media"
  ON media_library
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Admins can do anything
CREATE POLICY "Admins can do anything with media"
  ON media_library
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'user_role' = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_library_updated_at();

-- Add reading_time_minutes column to blog_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts'
    AND column_name = 'reading_time_minutes'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN reading_time_minutes INTEGER;
  END IF;
END $$;

COMMENT ON TABLE media_library IS 'Centralized media library for all uploaded images with metadata, versions, and search';
COMMENT ON COLUMN media_library.versions IS 'JSONB object containing paths to optimized versions (thumbnail, medium, large)';
COMMENT ON COLUMN media_library.blurhash IS 'Compact representation for placeholder while image loads';
COMMENT ON COLUMN media_library.used_in_posts IS 'Counter tracking how many posts use this image';

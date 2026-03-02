-- Migration: Add Video and Gallery support to Events
-- Description: Adds video_url and gallery_urls columns to the events table.

DO $$
BEGIN
  -- Add video_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'video_url') THEN
    ALTER TABLE events ADD COLUMN video_url TEXT;
  END IF;

  -- Add gallery_urls column (array of text)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'gallery_urls') THEN
    ALTER TABLE events ADD COLUMN gallery_urls TEXT[];
  END IF;
END $$;

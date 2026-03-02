-- Migration: Add metadata column to event_registrations
-- Description: Adds a JSONB metadata column to store additional registration details not covered by strict schema.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'metadata') THEN
    ALTER TABLE event_registrations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

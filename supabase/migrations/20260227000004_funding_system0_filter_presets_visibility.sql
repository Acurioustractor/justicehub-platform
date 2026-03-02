-- System 0 Audit Filter Preset Visibility
-- Adds shared/private scope and removes global name uniqueness so users can keep private presets with overlapping names.

ALTER TABLE funding_system0_filter_presets
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT TRUE;

DROP INDEX IF EXISTS idx_funding_system0_filter_presets_name_unique;

CREATE INDEX IF NOT EXISTS idx_funding_system0_filter_presets_visibility
  ON funding_system0_filter_presets (is_shared, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_system0_filter_presets_created_by
  ON funding_system0_filter_presets (created_by, updated_at DESC);

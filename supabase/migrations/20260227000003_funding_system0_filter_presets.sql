-- System 0 Shared Audit Filter Presets
-- Team-level reusable presets for System 0 audit trail filters.

CREATE TABLE IF NOT EXISTS funding_system0_filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funding_system0_filter_presets_name_check CHECK (char_length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_funding_system0_filter_presets_name_unique
  ON funding_system0_filter_presets (lower(name));

CREATE INDEX IF NOT EXISTS idx_funding_system0_filter_presets_updated_at
  ON funding_system0_filter_presets(updated_at DESC);

CREATE OR REPLACE FUNCTION update_funding_system0_filter_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_funding_system0_filter_presets_updated_at
  ON funding_system0_filter_presets;

CREATE TRIGGER trigger_funding_system0_filter_presets_updated_at
  BEFORE UPDATE ON funding_system0_filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_system0_filter_presets_updated_at();

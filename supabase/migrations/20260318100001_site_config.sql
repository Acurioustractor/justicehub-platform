-- Simple key-value config store for site settings (photo overrides, feature flags, etc.)
CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: public read, admin write
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_config" ON site_config
  FOR SELECT USING (true);

CREATE POLICY "Admin can write site_config" ON site_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

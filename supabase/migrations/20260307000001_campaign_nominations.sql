-- Campaign nominations: public can nominate people to experience CONTAINED
CREATE TABLE campaign_nominations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES art_innovation(id),
  nominee_name TEXT NOT NULL,
  nominee_title TEXT,
  nominee_org TEXT,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  nominator_name TEXT,
  nominator_email TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nominations_project ON campaign_nominations(project_id);
CREATE INDEX idx_nominations_category ON campaign_nominations(category);

-- RLS: public read for is_public rows, public insert (no auth required)
ALTER TABLE campaign_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read public nominations"
  ON campaign_nominations FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can insert nominations"
  ON campaign_nominations FOR INSERT
  WITH CHECK (true);

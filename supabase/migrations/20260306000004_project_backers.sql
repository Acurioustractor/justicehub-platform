-- Project backers — public support/pressure mechanism
CREATE TABLE project_backers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES art_innovation(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, email)
);

-- RLS
ALTER TABLE project_backers ENABLE ROW LEVEL SECURITY;

-- Anyone can read public backer counts/names
CREATE POLICY "Public backers are viewable by everyone"
  ON project_backers FOR SELECT
  USING (is_public = true);

-- Anyone can insert (no auth required for backing)
CREATE POLICY "Anyone can back a project"
  ON project_backers FOR INSERT
  WITH CHECK (true);

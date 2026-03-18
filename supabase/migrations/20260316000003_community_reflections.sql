-- Community reflections for the Authority page
CREATE TABLE IF NOT EXISTS community_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  reflection text NOT NULL CHECK (char_length(reflection) <= 500),
  city_nomination text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for approved reflections display
CREATE INDEX idx_community_reflections_approved ON community_reflections (is_approved, created_at DESC);

-- RLS
ALTER TABLE community_reflections ENABLE ROW LEVEL SECURITY;

-- Public can read approved reflections
CREATE POLICY "Anyone can read approved reflections"
  ON community_reflections FOR SELECT
  USING (is_approved = true);

-- Public can insert reflections
CREATE POLICY "Anyone can submit reflections"
  ON community_reflections FOR INSERT
  WITH CHECK (true);

-- Admins can update (approve/reject)
CREATE POLICY "Admins can update reflections"
  ON community_reflections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

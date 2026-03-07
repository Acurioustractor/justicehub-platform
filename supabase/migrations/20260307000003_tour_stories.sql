-- Tour stories: attendees share their experience
CREATE TABLE IF NOT EXISTS tour_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES art_innovation(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  tour_stop TEXT NOT NULL,
  story TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tour_stories_project_status ON tour_stories(project_id, status);
CREATE INDEX idx_tour_stories_created ON tour_stories(created_at DESC);

-- RLS
ALTER TABLE tour_stories ENABLE ROW LEVEL SECURITY;

-- Public can read approved stories
CREATE POLICY "Public can read approved tour stories"
  ON tour_stories FOR SELECT
  USING (status = 'approved' AND is_public = true);

-- Anyone can submit a story
CREATE POLICY "Anyone can submit tour stories"
  ON tour_stories FOR INSERT
  WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admins can manage tour stories"
  ON tour_stories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

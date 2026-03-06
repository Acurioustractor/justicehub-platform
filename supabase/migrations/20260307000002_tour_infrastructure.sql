-- 1. Link tour stop events to host basecamps
ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES art_innovation(id);

-- Link existing CONTAINED tour events to their basecamps
UPDATE events SET organization_id = '11111111-1111-1111-1111-111111111003'
  WHERE slug = 'contained-mount-druitt-launch';
UPDATE events SET organization_id = '11111111-1111-1111-1111-111111111003'
  WHERE slug = 'mounty-yarns-contained-launch';
UPDATE events SET organization_id = '5f038d59-9bf2-439b-b018-249790dfb41b'
  WHERE slug = 'contained-tennant-creek';

-- Link all contained events to the-contained project
UPDATE events SET project_id = (SELECT id FROM art_innovation WHERE slug = 'the-contained' LIMIT 1)
  WHERE slug LIKE '%contained%';

CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);

-- 2. Tour attendee reactions / story submissions
CREATE TABLE tour_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  project_id UUID REFERENCES art_innovation(id),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,                    -- 'attendee', 'volunteer', 'media', 'politician', 'educator'
  reaction TEXT NOT NULL,       -- their response/story after experiencing CONTAINED
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN DEFAULT true,
  photo_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tour_reactions_event ON tour_reactions(event_id);
CREATE INDEX idx_tour_reactions_project ON tour_reactions(project_id);

ALTER TABLE tour_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read public reactions"
  ON tour_reactions FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can insert reactions"
  ON tour_reactions FOR INSERT
  WITH CHECK (true);

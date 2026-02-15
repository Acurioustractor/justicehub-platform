-- JusticeHub Week Sprint Migration
-- Events, Nodes, Key People, Historical Inquiries

-- JusticeHub Nodes (state + international) - create first as events references it
CREATE TABLE IF NOT EXISTS justicehub_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  node_type TEXT CHECK (node_type IN ('state', 'territory', 'international')),
  state_code TEXT,
  country TEXT DEFAULT 'Australia',
  lead_organization_id UUID REFERENCES organizations(id),
  description TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status TEXT DEFAULT 'forming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('launch', 'workshop', 'conference', 'webinar', 'exhibition', 'meetup')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  location_state TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  node_id UUID REFERENCES justicehub_nodes(id),
  registration_url TEXT,
  ghl_event_id TEXT,
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  organization TEXT,
  phone TEXT,
  dietary_requirements TEXT,
  accessibility_needs TEXT,
  ghl_contact_id TEXT,
  registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'confirmed', 'cancelled', 'attended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Centre of Excellence key people
CREATE TABLE IF NOT EXISTS coe_key_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public_profiles(id),
  role_title TEXT NOT NULL,
  expertise_area TEXT,
  bio_summary TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Historical inquiries for Youth Justice Report
CREATE TABLE IF NOT EXISTS historical_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  inquiry_type TEXT CHECK (inquiry_type IN ('royal_commission', 'parliamentary', 'coronial', 'ombudsman', 'review')),
  jurisdiction TEXT,
  year_published INTEGER,
  year_started INTEGER,
  summary TEXT,
  source_url TEXT,
  pdf_url TEXT,
  key_findings JSONB DEFAULT '[]',
  recommendations_count INTEGER,
  implementation_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE justicehub_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coe_key_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_inquiries ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view nodes" ON justicehub_nodes FOR SELECT USING (true);
CREATE POLICY "Public can view public events" ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Public can view key people" ON coe_key_people FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view inquiries" ON historical_inquiries FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to nodes" ON justicehub_nodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to events" ON events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to registrations" ON event_registrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to key people" ON coe_key_people FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to inquiries" ON historical_inquiries FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_node_id ON events(node_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_coe_key_people_display_order ON coe_key_people(display_order);
CREATE INDEX IF NOT EXISTS idx_historical_inquiries_jurisdiction ON historical_inquiries(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_historical_inquiries_year ON historical_inquiries(year_published);

-- Seed initial JusticeHub nodes
INSERT INTO justicehub_nodes (name, node_type, state_code, latitude, longitude, status) VALUES
('JusticeHub Queensland', 'state', 'QLD', -27.4698, 153.0251, 'active'),
('JusticeHub New South Wales', 'state', 'NSW', -33.8688, 151.2093, 'forming'),
('JusticeHub Victoria', 'state', 'VIC', -37.8136, 144.9631, 'forming'),
('JusticeHub South Australia', 'state', 'SA', -34.9285, 138.6007, 'forming'),
('JusticeHub Western Australia', 'state', 'WA', -31.9505, 115.8605, 'forming'),
('JusticeHub Tasmania', 'state', 'TAS', -42.8821, 147.3272, 'forming'),
('JusticeHub Northern Territory', 'territory', 'NT', -12.4634, 130.8456, 'forming'),
('JusticeHub ACT', 'territory', 'ACT', -35.2809, 149.1300, 'forming'),
('JusticeHub Aotearoa', 'international', NULL, -41.2865, 174.7762, 'planning')
ON CONFLICT DO NOTHING;

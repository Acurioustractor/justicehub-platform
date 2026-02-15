-- JusticeHub Week Sprint - Core Tables
-- Created: January 6, 2026
-- Purpose: Events, Nodes, Registrations, Key People, Historical Inquiries

-- ============================================
-- JusticeHub Nodes (state + international)
-- Must be created FIRST as events references it
-- ============================================
CREATE TABLE IF NOT EXISTS justicehub_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  node_type TEXT CHECK (node_type IN ('state', 'territory', 'international')),
  state_code TEXT, -- 'NSW', 'VIC', 'QLD', etc.
  country TEXT DEFAULT 'Australia',
  lead_organization_id UUID REFERENCES organizations(id),
  description TEXT,
  contact_email TEXT,
  website_url TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status TEXT DEFAULT 'forming' CHECK (status IN ('active', 'forming', 'planned')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Events table
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('launch', 'workshop', 'conference', 'webinar', 'meeting', 'exhibition')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  location_state TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  node_id UUID REFERENCES justicehub_nodes(id),
  registration_url TEXT,
  ghl_event_id TEXT, -- GoHighLevel calendar ID
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Event registrations
-- ============================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  organization TEXT,
  phone TEXT,
  dietary_requirements TEXT,
  accessibility_needs TEXT,
  plus_one BOOLEAN DEFAULT false,
  ghl_contact_id TEXT, -- GoHighLevel contact ID
  registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'confirmed', 'cancelled', 'attended', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, email) -- Prevent duplicate registrations
);

-- ============================================
-- Centre of Excellence key people
-- ============================================
CREATE TABLE IF NOT EXISTS coe_key_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL, -- 'Director', 'Research Lead', etc.
  expertise_area TEXT,
  bio_override TEXT, -- Optional shorter bio for this context
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- ============================================
-- Historical inquiries for Youth Justice Report
-- ============================================
CREATE TABLE IF NOT EXISTS historical_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  inquiry_type TEXT CHECK (inquiry_type IN ('royal_commission', 'parliamentary', 'government_review', 'judicial', 'coronial', 'ombudsman')),
  jurisdiction TEXT, -- 'National', 'NSW', 'VIC', etc.
  year_published INTEGER,
  year_started INTEGER,
  summary TEXT,
  source_url TEXT,
  pdf_url TEXT,
  key_findings JSONB DEFAULT '[]',
  recommendations_count INTEGER,
  implementation_status TEXT, -- 'pending', 'partial', 'implemented', 'rejected'
  related_intervention_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Newsletter subscriptions (for GHL sync)
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  organization TEXT,
  subscription_type TEXT DEFAULT 'general' CHECK (subscription_type IN ('general', 'steward', 'researcher', 'youth')),
  ghl_contact_id TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_node_id ON events(node_id);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON events(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_coe_key_people_display_order ON coe_key_people(display_order);
CREATE INDEX IF NOT EXISTS idx_historical_inquiries_jurisdiction ON historical_inquiries(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_historical_inquiries_year ON historical_inquiries(year_published);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE justicehub_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coe_key_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access for nodes, events, key people, inquiries
CREATE POLICY "Public can view active nodes" ON justicehub_nodes
  FOR SELECT USING (true);

CREATE POLICY "Public can view public events" ON events
  FOR SELECT USING (is_public = true);

CREATE POLICY "Public can view key people" ON coe_key_people
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view inquiries" ON historical_inquiries
  FOR SELECT USING (true);

-- Registrations - users can view their own
CREATE POLICY "Users can view own registrations" ON event_registrations
  FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Admin policies (service role bypasses RLS)
CREATE POLICY "Service role full access nodes" ON justicehub_nodes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access events" ON events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access registrations" ON event_registrations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access key people" ON coe_key_people
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access inquiries" ON historical_inquiries
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access newsletter" ON newsletter_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Seed initial node data
-- ============================================
INSERT INTO justicehub_nodes (name, node_type, state_code, country, latitude, longitude, status, description) VALUES
  ('JusticeHub Queensland', 'state', 'QLD', 'Australia', -27.4698, 153.0251, 'active', 'Queensland state node, led by A Curious Tractor'),
  ('JusticeHub New South Wales', 'state', 'NSW', 'Australia', -33.8688, 151.2093, 'forming', 'New South Wales state node'),
  ('JusticeHub Victoria', 'state', 'VIC', 'Australia', -37.8136, 144.9631, 'forming', 'Victoria state node'),
  ('JusticeHub South Australia', 'state', 'SA', 'Australia', -34.9285, 138.6007, 'forming', 'South Australia state node'),
  ('JusticeHub Western Australia', 'state', 'WA', 'Australia', -31.9505, 115.8605, 'forming', 'Western Australia state node'),
  ('JusticeHub Tasmania', 'state', 'TAS', 'Australia', -42.8821, 147.3272, 'planned', 'Tasmania state node'),
  ('JusticeHub Northern Territory', 'territory', 'NT', 'Australia', -12.4634, 130.8456, 'forming', 'Northern Territory node'),
  ('JusticeHub ACT', 'territory', 'ACT', 'Australia', -35.2809, 149.1300, 'planned', 'Australian Capital Territory node'),
  ('JusticeHub Aotearoa', 'international', NULL, 'New Zealand', -41.2865, 174.7762, 'planned', 'New Zealand international node')
ON CONFLICT DO NOTHING;

-- ============================================
-- Helper function to generate event slugs
-- ============================================
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_slug
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_event_slug();

-- ============================================
-- Update timestamps trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_historical_inquiries_updated_at
  BEFORE UPDATE ON historical_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_justicehub_nodes_updated_at
  BEFORE UPDATE ON justicehub_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

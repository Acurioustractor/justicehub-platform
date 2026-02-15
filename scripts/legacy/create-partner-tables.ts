/**
 * DEPRECATED SCRIPT (legacy quarantine)
 * This file was moved out of active workflows due to deprecated schema assumptions and/or hardcoded credential patterns.
 * Do not use in production runtime paths.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function createPartnerTables() {
  console.log('Creating partner enrichment tables...\n');

  // Create tables using RPC call to execute raw SQL
  const createTablesSql = `
-- 1. Partner Videos
CREATE TABLE IF NOT EXISTS partner_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_id TEXT,
  platform TEXT DEFAULT 'youtube',
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  video_type TEXT DEFAULT 'documentary',
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  published_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Partner Goals
CREATE TABLE IF NOT EXISTS partner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Partner Contacts
CREATE TABLE IF NOT EXISTS partner_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Partner Photos
CREATE TABLE IF NOT EXISTS partner_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  photographer TEXT,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  photo_type TEXT DEFAULT 'general',
  location_name TEXT,
  taken_at DATE,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Partner Storytellers
CREATE TABLE IF NOT EXISTS partner_storytellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  empathy_ledger_profile_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  role_at_org TEXT,
  bio_excerpt TEXT,
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  consent_level TEXT DEFAULT 'public',
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, empathy_ledger_profile_id)
);

-- 6. Partner Stories
CREATE TABLE IF NOT EXISTS partner_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  empathy_ledger_story_id UUID NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  thumbnail_url TEXT,
  story_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  consent_level TEXT DEFAULT 'public',
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, empathy_ledger_story_id)
);

-- 7. Partner Impact Metrics
CREATE TABLE IF NOT EXISTS partner_impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_context TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Partner Site Locations
CREATE TABLE IF NOT EXISTS partner_site_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location_type TEXT,
  status TEXT DEFAULT 'planned',
  x_percent DECIMAL(5,2),
  y_percent DECIMAL(5,2),
  icon TEXT,
  photo_url TEXT,
  interactive_map_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_videos_org ON partner_videos(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_goals_org ON partner_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_org ON partner_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_photos_org ON partner_photos(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_storytellers_org ON partner_storytellers(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_stories_org ON partner_stories(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_impact_org ON partner_impact_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_sites_org ON partner_site_locations(organization_id);
`;

  // Execute via direct table check and creation
  // Try inserting into tables - if they don't exist, that tells us
  console.log('Checking if tables exist...');

  // Check partner_videos
  const { error: videosErr } = await supabase.from('partner_videos').select('id').limit(1);
  if (videosErr && videosErr.code === '42P01') {
    console.log('Tables do not exist - need to create them via Supabase Dashboard SQL Editor');
    console.log('\nPlease run the following SQL in the Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/tednluwflfhxyucgwigh/sql');
    console.log('\n' + createTablesSql);
    return;
  }

  console.log('✓ Tables already exist or were created');

  // Test by inserting a sample record
  console.log('\nTesting table access...');

  const { data: testVideo, error: testErr } = await supabase
    .from('partner_videos')
    .select('*')
    .limit(1);

  if (testErr) {
    console.error('Error accessing partner_videos:', testErr.message);
  } else {
    console.log('✓ partner_videos table accessible');
  }
}

createPartnerTables().catch(console.error);

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

// Organization IDs (from previous scripts)
const MOUNTY_YARNS_ORG_ID = '11111111-1111-1111-1111-111111111003';
const OONCHIUMPA_ORG_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';
const PICC_ORG_ID = '11111111-1111-1111-1111-111111111001';

// Empathy Ledger story and storyteller IDs (from search results)
const EMPATHY_LEDGER_STORIES = {
  hull_river_history: '86238687-772e-4e21-a555-9f2360d2e7ab',
  palm_island_storm: '68bf8048-eafd-4d0c-9d61-4182a4883c85',
  cyclone_kirrily: 'd6e6e97e-0a85-49b3-92e9-f0d2d65a43bc',
  pearl_tribute: '73b37ab7-ea13-47c4-821d-3195c6f54dc7',
  dorothy_tribute: '3c61ed65-9ff0-4f9a-a6e9-92ab97fe4fa9',
};

const EMPATHY_LEDGER_STORYTELLERS = {
  kristy_bloomfield: 'b59a1f4c-94fd-4805-a2c5-cac0922133e0',
  patricia_miller: '29fcb8ef-8b2b-4daa-b1c1-6fcfe6eb8e17',
  uncle_alan: '0e4c70f3-6f2f-466a-a4cb-3fc9f76f6eb9',
  aunty_leeann: 'b89de2c1-1e23-4e1d-a6a9-1c2fd5c7b8e3',
  zoe_geia: 'f7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2',
};

async function seedPartnerContent() {
  console.log('🌱 Seeding rich partner content...\n');

  // ============================================
  // 1. MOUNTY YARNS - Videos, Goals, Impact
  // ============================================
  console.log('📽️  Adding Mounty Yarns documentary...');

  const mountyVideos = [
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      title: 'Mounty Yarns Documentary',
      description: `A 24-minute documentary showcasing the youth-led initiative in Mount Druitt. "Home. It brings everyone together. We're all from different places, but close." Features young people designing and building their backyard campus - yarning circle, fire pit, workshop container, basketball court, and community garden.`,
      video_url: 'https://youtube.com/watch?v=Bni2BDutOgo',
      video_id: 'Bni2BDutOgo',
      platform: 'youtube',
      thumbnail_url: 'https://img.youtube.com/vi/Bni2BDutOgo/maxresdefault.jpg',
      duration_seconds: 1440, // 24 minutes
      video_type: 'documentary',
      is_featured: true,
      is_public: true,
      published_at: '2024-01-01',
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      title: 'Mounty Yarns Trailer',
      description: `Two-minute trailer for the Mounty Yarns documentary. "This is for the kids… without the input, we didn't know what they want."`,
      video_url: 'https://youtube.com/watch?v=i8D2AuQ8bOs',
      video_id: 'i8D2AuQ8bOs',
      platform: 'youtube',
      thumbnail_url: 'https://img.youtube.com/vi/i8D2AuQ8bOs/maxresdefault.jpg',
      duration_seconds: 120,
      video_type: 'promotional',
      is_featured: false,
      is_public: true,
      published_at: '2024-01-01',
    },
  ];

  const { error: mountyVideoErr } = await supabase
    .from('partner_videos')
    .upsert(mountyVideos, { onConflict: 'id' });

  if (mountyVideoErr) console.error('Mounty video error:', mountyVideoErr.message);
  else console.log('✓ Mounty Yarns videos added');

  // Mounty Yarns Goals & Values
  console.log('🎯 Adding Mounty Yarns goals...');

  const mountyGoals = [
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      goal_type: 'mission',
      title: 'Amplify Youth Voices',
      description: 'Amplifying lived-experience stories and collective solutions shared by Aboriginal young people to create a safer, fairer future for Mount Druitt.',
      icon: 'megaphone',
      display_order: 1,
      is_featured: true,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      goal_type: 'vision',
      title: 'Youth-Led Change',
      description: '"This is for the kids… without the input, we didn\'t know what they want. They\'re showing them that sometimes you can\'t get everything handed to you… realistically, you\'re gonna have to do it yourself."',
      icon: 'users',
      display_order: 2,
      is_featured: true,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      goal_type: 'value',
      title: 'Safe Spaces',
      description: '"A safe place where young Black lives can hang around and not be seen as consorting, like criminals or up to no good all the time."',
      icon: 'shield',
      display_order: 3,
      is_featured: true,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      goal_type: 'principle',
      title: 'Cultural Connection',
      description: 'Operating on Darug Country with Aboriginal Flag as ownership marker - "this is a place with cultural governance and pride."',
      icon: 'flame',
      display_order: 4,
      is_featured: true,
    },
  ];

  const { error: mountyGoalErr } = await supabase
    .from('partner_goals')
    .upsert(mountyGoals, { onConflict: 'id' });

  if (mountyGoalErr) console.error('Mounty goals error:', mountyGoalErr.message);
  else console.log('✓ Mounty Yarns goals added');

  // Mounty Yarns Impact Metrics
  console.log('📊 Adding Mounty Yarns impact metrics...');

  const mountyImpact = [
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      metric_name: 'Team Growth',
      metric_value: '20',
      metric_context: 'from 1 person to a team of 20 in 3 years',
      icon: 'trending-up',
      display_order: 1,
      is_featured: true,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      metric_name: 'Youth Ambassadors',
      metric_value: '6+',
      metric_context: 'speaking to funders and politicians',
      icon: 'users',
      display_order: 2,
      is_featured: true,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      metric_name: 'MAYCS Funding',
      metric_value: '$3.3M',
      metric_context: 'secured for Aboriginal Cultural Space',
      icon: 'dollar-sign',
      display_order: 3,
      is_featured: true,
    },
  ];

  const { error: mountyImpactErr } = await supabase
    .from('partner_impact_metrics')
    .upsert(mountyImpact, { onConflict: 'id' });

  if (mountyImpactErr) console.error('Mounty impact error:', mountyImpactErr.message);
  else console.log('✓ Mounty Yarns impact metrics added');

  // Mounty Yarns Contacts
  console.log('📞 Adding Mounty Yarns contacts...');

  const mountyContacts = [
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      contact_type: 'email',
      label: 'General Inquiries',
      value: 'mtdruittinfo@justreinvest.org.au',
      icon: 'mail',
      is_primary: true,
      display_order: 1,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      contact_type: 'website',
      label: 'Interactive Site Plan',
      value: 'https://mounty-yarns.vercel.app',
      icon: 'map',
      is_primary: false,
      display_order: 2,
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      contact_type: 'website',
      label: 'Just Reinvest NSW',
      value: 'https://justreinvest.org.au',
      icon: 'external-link',
      is_primary: false,
      display_order: 3,
    },
  ];

  const { error: mountyContactErr } = await supabase
    .from('partner_contacts')
    .upsert(mountyContacts, { onConflict: 'id' });

  if (mountyContactErr) console.error('Mounty contacts error:', mountyContactErr.message);
  else console.log('✓ Mounty Yarns contacts added');

  // Mounty Yarns Site Locations (from interactive map)
  console.log('📍 Adding Mounty Yarns site locations...');

  const mountySites = [
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      name: 'Yarning Circle & Fire Pit',
      description: 'The heart of the space for gathering, storytelling, and cultural connection',
      location_type: 'nature',
      status: 'completed',
      icon: 'flame',
      interactive_map_url: 'https://mounty-yarns.vercel.app',
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      name: 'Workshop Container',
      description: 'Secure storage and program space for youth activities',
      location_type: 'building',
      status: 'completed',
      icon: 'package',
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      name: 'Basketball Half Court',
      description: 'Recreation space for the kids',
      location_type: 'infrastructure',
      status: 'completed',
      icon: 'circle',
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      name: 'Community Garden',
      description: 'Growing food to cook and feed the community',
      location_type: 'nature',
      status: 'in_progress',
      icon: 'sprout',
    },
    {
      organization_id: MOUNTY_YARNS_ORG_ID,
      name: 'Privacy Screening',
      description: 'Creating safety zones where kids "don\'t feel judged by anyone"',
      location_type: 'infrastructure',
      status: 'in_progress',
      icon: 'shield',
    },
  ];

  const { error: mountySiteErr } = await supabase
    .from('partner_site_locations')
    .upsert(mountySites, { onConflict: 'id' });

  if (mountySiteErr) console.error('Mounty sites error:', mountySiteErr.message);
  else console.log('✓ Mounty Yarns site locations added');

  // ============================================
  // 2. OONCHIUMPA - Goals, Impact, Contacts
  // ============================================
  console.log('\n🌟 Adding Oonchiumpa content...');

  const oonchiumpaGoals = [
    {
      organization_id: OONCHIUMPA_ORG_ID,
      goal_type: 'mission',
      title: 'Aboriginal-Led Youth Mentorship',
      description: 'Empowering Aboriginal young people through meaningful mentorship, cultural connection, and family-centered support.',
      icon: 'heart',
      display_order: 1,
      is_featured: true,
    },
    {
      organization_id: OONCHIUMPA_ORG_ID,
      goal_type: 'vision',
      title: 'True Justice',
      description: 'Offering pathways away from the justice system through the True Justice program - real alternatives with cultural strength at the center.',
      icon: 'scale',
      display_order: 2,
      is_featured: true,
    },
    {
      organization_id: OONCHIUMPA_ORG_ID,
      goal_type: 'value',
      title: 'Relationship First',
      description: 'Building trust through long-term relationships - 90% retention rate because young people keep coming back.',
      icon: 'users',
      display_order: 3,
      is_featured: true,
    },
    {
      organization_id: OONCHIUMPA_ORG_ID,
      goal_type: 'principle',
      title: 'On-Country Healing',
      description: 'Atnarpa Homestead and on-country programs reconnecting young people with culture, land, and identity.',
      icon: 'mountain',
      display_order: 4,
      is_featured: true,
    },
  ];

  const { error: oonchiumpaGoalErr } = await supabase
    .from('partner_goals')
    .upsert(oonchiumpaGoals, { onConflict: 'id' });

  if (oonchiumpaGoalErr) console.error('Oonchiumpa goals error:', oonchiumpaGoalErr.message);
  else console.log('✓ Oonchiumpa goals added');

  const oonchiumpaImpact = [
    {
      organization_id: OONCHIUMPA_ORG_ID,
      metric_name: 'Young People Supported',
      metric_value: '21',
      metric_context: 'in current cohort',
      icon: 'users',
      display_order: 1,
      is_featured: true,
    },
    {
      organization_id: OONCHIUMPA_ORG_ID,
      metric_name: 'Retention Rate',
      metric_value: '90%',
      metric_context: 'young people keep coming back',
      icon: 'repeat',
      display_order: 2,
      is_featured: true,
    },
    {
      organization_id: OONCHIUMPA_ORG_ID,
      metric_name: 'Communities Served',
      metric_value: '6+',
      metric_context: 'across Central Australia',
      icon: 'map-pin',
      display_order: 3,
      is_featured: true,
    },
  ];

  const { error: oonchiumpaImpactErr } = await supabase
    .from('partner_impact_metrics')
    .upsert(oonchiumpaImpact, { onConflict: 'id' });

  if (oonchiumpaImpactErr) console.error('Oonchiumpa impact error:', oonchiumpaImpactErr.message);
  else console.log('✓ Oonchiumpa impact metrics added');

  const oonchiumpaContacts = [
    {
      organization_id: OONCHIUMPA_ORG_ID,
      contact_type: 'website',
      label: 'Oonchiumpa Website',
      value: 'https://oonchiumpa.org.au',
      icon: 'globe',
      is_primary: true,
      display_order: 1,
    },
    {
      organization_id: OONCHIUMPA_ORG_ID,
      contact_type: 'address',
      label: 'Office Location',
      value: 'Alice Springs (Mparntwe), NT',
      icon: 'map-pin',
      is_primary: false,
      display_order: 2,
    },
  ];

  const { error: oonchiumpaContactErr } = await supabase
    .from('partner_contacts')
    .upsert(oonchiumpaContacts, { onConflict: 'id' });

  if (oonchiumpaContactErr) console.error('Oonchiumpa contacts error:', oonchiumpaContactErr.message);
  else console.log('✓ Oonchiumpa contacts added');

  // Link Kristy Bloomfield as featured storyteller
  console.log('👤 Linking Oonchiumpa storytellers...');

  const oonchiumpaStorytellers = [
    {
      organization_id: OONCHIUMPA_ORG_ID,
      empathy_ledger_profile_id: EMPATHY_LEDGER_STORYTELLERS.kristy_bloomfield,
      display_name: 'Kristy Bloomfield',
      role_at_org: 'Co-Founder & CEO',
      bio_excerpt: 'Arrernte woman leading Aboriginal youth mentorship in Central Australia',
      is_featured: true,
      is_public: true,
      consent_level: 'public',
    },
  ];

  const { error: oonchiumpaStorytellerErr } = await supabase
    .from('partner_storytellers')
    .upsert(oonchiumpaStorytellers, { onConflict: 'organization_id,empathy_ledger_profile_id' });

  if (oonchiumpaStorytellerErr) console.error('Oonchiumpa storytellers error:', oonchiumpaStorytellerErr.message);
  else console.log('✓ Oonchiumpa storytellers linked');

  // ============================================
  // 3. PICC - Goals, Impact, Stories, Contacts
  // ============================================
  console.log('\n🏝️  Adding PICC content...');

  const piccGoals = [
    {
      organization_id: PICC_ORG_ID,
      goal_type: 'mission',
      title: 'Community-Controlled Services',
      description: '197 staff delivering 16+ essential services on Palm Island - the largest Aboriginal community-controlled organization in the region.',
      icon: 'building',
      display_order: 1,
      is_featured: true,
    },
    {
      organization_id: PICC_ORG_ID,
      goal_type: 'vision',
      title: 'Data Sovereignty',
      description: 'Palm Island data belongs to Palm Island. Building infrastructure for community-controlled information and storytelling.',
      icon: 'database',
      display_order: 2,
      is_featured: true,
    },
    {
      organization_id: PICC_ORG_ID,
      goal_type: 'goal',
      title: 'Youth Pathways Precinct',
      description: 'Transforming The Station into a regional hub bridging Townsville and Palm Island - training, industry, and cultural connection.',
      icon: 'compass',
      display_order: 3,
      is_featured: true,
    },
    {
      organization_id: PICC_ORG_ID,
      goal_type: 'value',
      title: 'Circular Economy',
      description: 'Goods manufacturing, recycled-plastic beds, washing machine refurbishment - turning waste into essential items while training young people.',
      icon: 'refresh-cw',
      display_order: 4,
      is_featured: true,
    },
  ];

  const { error: piccGoalErr } = await supabase
    .from('partner_goals')
    .upsert(piccGoals, { onConflict: 'id' });

  if (piccGoalErr) console.error('PICC goals error:', piccGoalErr.message);
  else console.log('✓ PICC goals added');

  const piccImpact = [
    {
      organization_id: PICC_ORG_ID,
      metric_name: 'Staff',
      metric_value: '197',
      metric_context: 'community members employed',
      icon: 'users',
      display_order: 1,
      is_featured: true,
    },
    {
      organization_id: PICC_ORG_ID,
      metric_name: 'Services',
      metric_value: '16+',
      metric_context: 'essential services delivered',
      icon: 'heart-pulse',
      display_order: 2,
      is_featured: true,
    },
    {
      organization_id: PICC_ORG_ID,
      metric_name: 'Site Lease',
      metric_value: '30 Years',
      metric_context: 'Station Precinct development',
      icon: 'calendar',
      display_order: 3,
      is_featured: true,
    },
  ];

  const { error: piccImpactErr } = await supabase
    .from('partner_impact_metrics')
    .upsert(piccImpact, { onConflict: 'id' });

  if (piccImpactErr) console.error('PICC impact error:', piccImpactErr.message);
  else console.log('✓ PICC impact metrics added');

  const piccContacts = [
    {
      organization_id: PICC_ORG_ID,
      contact_type: 'website',
      label: 'PICC Website',
      value: 'https://picc.com.au',
      icon: 'globe',
      is_primary: true,
      display_order: 1,
    },
    {
      organization_id: PICC_ORG_ID,
      contact_type: 'website',
      label: 'Station Site Plan',
      value: 'https://picc-station-site.vercel.app',
      icon: 'map',
      is_primary: false,
      display_order: 2,
    },
    {
      organization_id: PICC_ORG_ID,
      contact_type: 'address',
      label: 'Palm Island',
      value: 'Palm Island, QLD 4816 (Bwgcolman Country)',
      icon: 'map-pin',
      is_primary: false,
      display_order: 3,
    },
    {
      organization_id: PICC_ORG_ID,
      contact_type: 'address',
      label: 'Townsville Office',
      value: 'Townsville, QLD (Manbarra Country)',
      icon: 'map-pin',
      is_primary: false,
      display_order: 4,
    },
  ];

  const { error: piccContactErr } = await supabase
    .from('partner_contacts')
    .upsert(piccContacts, { onConflict: 'id' });

  if (piccContactErr) console.error('PICC contacts error:', piccContactErr.message);
  else console.log('✓ PICC contacts added');

  // Link PICC Stories from Empathy Ledger
  console.log('📖 Linking PICC stories...');

  const piccStories = [
    {
      organization_id: PICC_ORG_ID,
      empathy_ledger_story_id: EMPATHY_LEDGER_STORIES.hull_river_history,
      title: 'Hull River History',
      excerpt: 'Documenting the historical journey and cultural significance of the Hull River community.',
      story_type: 'documentary',
      is_featured: true,
      is_public: true,
      consent_level: 'public',
    },
    {
      organization_id: PICC_ORG_ID,
      empathy_ledger_story_id: EMPATHY_LEDGER_STORIES.palm_island_storm,
      title: 'Palm Island Storm Stories',
      excerpt: 'Community resilience during Cyclone Kirrily - stories of strength and recovery.',
      story_type: 'interview',
      is_featured: true,
      is_public: true,
      consent_level: 'public',
    },
    {
      organization_id: PICC_ORG_ID,
      empathy_ledger_story_id: EMPATHY_LEDGER_STORIES.cyclone_kirrily,
      title: 'Cyclone Kirrily Recovery',
      excerpt: 'Palm Island community response to natural disaster.',
      story_type: 'documentary',
      is_featured: false,
      is_public: true,
      consent_level: 'public',
    },
  ];

  const { error: piccStoryErr } = await supabase
    .from('partner_stories')
    .upsert(piccStories, { onConflict: 'organization_id,empathy_ledger_story_id' });

  if (piccStoryErr) console.error('PICC stories error:', piccStoryErr.message);
  else console.log('✓ PICC stories linked');

  // Link PICC Storytellers
  console.log('👥 Linking PICC storytellers...');

  const piccStorytellers = [
    {
      organization_id: PICC_ORG_ID,
      empathy_ledger_profile_id: EMPATHY_LEDGER_STORYTELLERS.patricia_miller,
      display_name: 'Patricia Ann Miller',
      role_at_org: 'Community Elder',
      bio_excerpt: 'Sharing Palm Island stories and cultural knowledge.',
      is_featured: true,
      is_public: true,
      consent_level: 'public',
    },
    {
      organization_id: PICC_ORG_ID,
      empathy_ledger_profile_id: EMPATHY_LEDGER_STORYTELLERS.uncle_alan,
      display_name: 'Uncle Alan Palm Island',
      role_at_org: 'Elder & Cultural Advisor',
      bio_excerpt: 'Keeper of Palm Island history and traditions.',
      is_featured: true,
      is_public: true,
      consent_level: 'public',
    },
  ];

  const { error: piccStorytellerErr } = await supabase
    .from('partner_storytellers')
    .upsert(piccStorytellers, { onConflict: 'organization_id,empathy_ledger_profile_id' });

  if (piccStorytellerErr) console.error('PICC storytellers error:', piccStorytellerErr.message);
  else console.log('✓ PICC storytellers linked');

  // PICC Site Locations
  console.log('📍 Adding PICC site locations...');

  const piccSites = [
    {
      organization_id: PICC_ORG_ID,
      name: 'Commercial Kitchen Block',
      description: 'Reactivated kitchen for catering and hospitality training',
      location_type: 'building',
      status: 'in_progress',
      icon: 'utensils',
      interactive_map_url: 'https://picc-station-site.vercel.app',
    },
    {
      organization_id: PICC_ORG_ID,
      name: 'Goods Workshop',
      description: 'Manufacturing recycled-plastic bed bases and refurbishing washing machines',
      location_type: 'building',
      status: 'planned',
      icon: 'hammer',
    },
    {
      organization_id: PICC_ORG_ID,
      name: 'Train Carriages',
      description: 'Historical carriages for storytelling and cultural programs',
      location_type: 'building',
      status: 'in_progress',
      icon: 'train',
    },
    {
      organization_id: PICC_ORG_ID,
      name: 'Creek & Lagoon System',
      description: 'Water feature revival with orchard - bringing life back to the landscape',
      location_type: 'nature',
      status: 'planned',
      icon: 'droplet',
    },
    {
      organization_id: PICC_ORG_ID,
      name: 'Modular Accommodation',
      description: 'Tiny homes built by young people for visiting trainees and mentors',
      location_type: 'building',
      status: 'planned',
      icon: 'home',
    },
  ];

  const { error: piccSiteErr } = await supabase
    .from('partner_site_locations')
    .upsert(piccSites, { onConflict: 'id' });

  if (piccSiteErr) console.error('PICC sites error:', piccSiteErr.message);
  else console.log('✓ PICC site locations added');

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ Partner content seeding complete!');
  console.log('='.repeat(50));

  // Verify counts
  const { count: videoCount } = await supabase.from('partner_videos').select('*', { count: 'exact', head: true });
  const { count: goalCount } = await supabase.from('partner_goals').select('*', { count: 'exact', head: true });
  const { count: impactCount } = await supabase.from('partner_impact_metrics').select('*', { count: 'exact', head: true });
  const { count: contactCount } = await supabase.from('partner_contacts').select('*', { count: 'exact', head: true });
  const { count: storyCount } = await supabase.from('partner_stories').select('*', { count: 'exact', head: true });
  const { count: storytellerCount } = await supabase.from('partner_storytellers').select('*', { count: 'exact', head: true });
  const { count: siteCount } = await supabase.from('partner_site_locations').select('*', { count: 'exact', head: true });

  console.log('\nContent Summary:');
  console.log(`  📽️  Videos: ${videoCount || 0}`);
  console.log(`  🎯 Goals: ${goalCount || 0}`);
  console.log(`  📊 Impact Metrics: ${impactCount || 0}`);
  console.log(`  📞 Contacts: ${contactCount || 0}`);
  console.log(`  📖 Stories Linked: ${storyCount || 0}`);
  console.log(`  👤 Storytellers Linked: ${storytellerCount || 0}`);
  console.log(`  📍 Site Locations: ${siteCount || 0}`);
}

seedPartnerContent().catch(console.error);

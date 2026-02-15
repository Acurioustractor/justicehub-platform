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

// Organization IDs
const MOUNTY_YARNS_ORG_ID = '11111111-1111-1111-1111-111111111003';
const OONCHIUMPA_ORG_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';
const PICC_ORG_ID = '11111111-1111-1111-1111-111111111001';

// Empathy Ledger references
const EMPATHY_LEDGER_STORIES = {
  hull_river_history: '86238687-772e-4e21-a555-9f2360d2e7ab',
  palm_island_storm: '68bf8048-eafd-4d0c-9d61-4182a4883c85',
  cyclone_kirrily: 'd6e6e97e-0a85-49b3-92e9-f0d2d65a43bc',
};

const EMPATHY_LEDGER_STORYTELLERS = {
  kristy_bloomfield: 'b59a1f4c-94fd-4805-a2c5-cac0922133e0',
  patricia_miller: '29fcb8ef-8b2b-4daa-b1c1-6fcfe6eb8e17',
  uncle_alan: '0e4c70f3-6f2f-466a-a4cb-3fc9f76f6eb9',
};

async function updatePartnerSettings() {
  console.log('🌱 Updating partner organization settings with rich content...\n');

  // ============================================
  // 1. MOUNTY YARNS
  // ============================================
  console.log('📽️  Updating Mounty Yarns...');

  const mountySettings = {
    partner: {
      videos: [
        {
          title: 'Mounty Yarns Documentary',
          description: 'A 24-minute documentary showcasing the youth-led initiative in Mount Druitt. Features young people designing and building their backyard campus.',
          url: 'https://youtube.com/watch?v=Bni2BDutOgo',
          videoId: 'Bni2BDutOgo',
          thumbnail: 'https://img.youtube.com/vi/Bni2BDutOgo/maxresdefault.jpg',
          duration: '24:00',
          type: 'documentary',
          featured: true,
        },
        {
          title: 'Mounty Yarns Trailer',
          description: 'Two-minute trailer for the Mounty Yarns documentary.',
          url: 'https://youtube.com/watch?v=i8D2AuQ8bOs',
          videoId: 'i8D2AuQ8bOs',
          thumbnail: 'https://img.youtube.com/vi/i8D2AuQ8bOs/maxresdefault.jpg',
          duration: '2:00',
          type: 'promotional',
        },
      ],
      goals: [
        {
          type: 'mission',
          title: 'Amplify Youth Voices',
          description: 'Amplifying lived-experience stories and collective solutions shared by Aboriginal young people to create a safer, fairer future for Mount Druitt.',
          icon: 'megaphone',
        },
        {
          type: 'vision',
          title: 'Youth-Led Change',
          description: '"This is for the kids… without the input, we didn\'t know what they want. They\'re showing them that sometimes you can\'t get everything handed to you."',
          icon: 'users',
        },
        {
          type: 'value',
          title: 'Safe Spaces',
          description: '"A safe place where young Black lives can hang around and not be seen as consorting, like criminals or up to no good all the time."',
          icon: 'shield',
        },
        {
          type: 'principle',
          title: 'Cultural Connection',
          description: 'Operating on Darug Country with Aboriginal Flag as ownership marker - "this is a place with cultural governance and pride."',
          icon: 'flame',
        },
      ],
      impact: [
        { name: 'Team Growth', value: '20', context: 'from 1 person to a team of 20 in 3 years', icon: 'trending-up' },
        { name: 'Youth Ambassadors', value: '6+', context: 'speaking to funders and politicians', icon: 'users' },
        { name: 'MAYCS Funding', value: '$3.3M', context: 'secured for Aboriginal Cultural Space', icon: 'dollar-sign' },
      ],
      contacts: [
        { type: 'email', label: 'General Inquiries', value: 'mtdruittinfo@justreinvest.org.au', primary: true },
        { type: 'website', label: 'Interactive Site Plan', value: 'https://mounty-yarns.vercel.app' },
        { type: 'website', label: 'Just Reinvest NSW', value: 'https://justreinvest.org.au' },
      ],
      siteLocations: [
        { name: 'Yarning Circle & Fire Pit', description: 'The heart of the space for gathering, storytelling, and cultural connection', type: 'nature', status: 'completed', icon: 'flame' },
        { name: 'Workshop Container', description: 'Secure storage and program space for youth activities', type: 'building', status: 'completed', icon: 'package' },
        { name: 'Basketball Half Court', description: 'Recreation space for the kids', type: 'infrastructure', status: 'completed', icon: 'circle' },
        { name: 'Community Garden', description: 'Growing food to cook and feed the community', type: 'nature', status: 'in_progress', icon: 'sprout' },
        { name: 'Privacy Screening', description: 'Creating safety zones where kids don\'t feel judged', type: 'infrastructure', status: 'in_progress', icon: 'shield' },
      ],
      interactiveMapUrl: 'https://mounty-yarns.vercel.app',
      traditionalOwners: 'Darug People',
      quotes: [
        { text: 'Home. It brings everyone together. We\'re all from different places, but close. Mount Druitt is home for a lot of us.', author: 'Isaiah' },
        { text: 'I can express myself, I can be myself around these people… You just don\'t need to feel judged by anyone.', author: 'Polly' },
        { text: 'It\'s almost like a second home. Even a first home for some kids.', author: 'Youth Ambassador' },
      ],
    },
  };

  const { error: mountyErr } = await supabase
    .from('organizations')
    .update({ settings: mountySettings })
    .eq('id', MOUNTY_YARNS_ORG_ID);

  if (mountyErr) console.error('Mounty error:', mountyErr.message);
  else console.log('✓ Mounty Yarns settings updated');

  // ============================================
  // 2. OONCHIUMPA
  // ============================================
  console.log('🌟 Updating Oonchiumpa...');

  const oonchiumpaSettings = {
    partner: {
      videos: [],
      goals: [
        {
          type: 'mission',
          title: 'Aboriginal-Led Youth Mentorship',
          description: 'Empowering Aboriginal young people through meaningful mentorship, cultural connection, and family-centered support.',
          icon: 'heart',
        },
        {
          type: 'vision',
          title: 'True Justice',
          description: 'Offering pathways away from the justice system through the True Justice program - real alternatives with cultural strength at the center.',
          icon: 'scale',
        },
        {
          type: 'value',
          title: 'Relationship First',
          description: 'Building trust through long-term relationships - 90% retention rate because young people keep coming back.',
          icon: 'users',
        },
        {
          type: 'principle',
          title: 'On-Country Healing',
          description: 'Atnarpa Homestead and on-country programs reconnecting young people with culture, land, and identity.',
          icon: 'mountain',
        },
      ],
      impact: [
        { name: 'Young People Supported', value: '21', context: 'in current cohort', icon: 'users' },
        { name: 'Retention Rate', value: '90%', context: 'young people keep coming back', icon: 'repeat' },
        { name: 'Communities Served', value: '6+', context: 'across Central Australia', icon: 'map-pin' },
      ],
      contacts: [
        { type: 'website', label: 'Oonchiumpa Website', value: 'https://oonchiumpa.org.au', primary: true },
        { type: 'address', label: 'Office Location', value: 'Alice Springs (Mparntwe), NT' },
      ],
      linkedStorytellers: [
        {
          empathyLedgerId: EMPATHY_LEDGER_STORYTELLERS.kristy_bloomfield,
          name: 'Kristy Bloomfield',
          role: 'Co-Founder & CEO',
          bio: 'Arrernte woman leading Aboriginal youth mentorship in Central Australia',
          featured: true,
        },
      ],
      leadership: {
        ceo: { name: 'Kristy Bloomfield', background: 'Arrernte woman' },
        director: { name: 'Tanya Turner', background: 'Proud Warlpiri, Luritja and Arrernte woman' },
      },
      programs: [
        { name: 'True Justice', description: 'Alternative pathways from the justice system' },
        { name: 'Atnarpa Homestead', description: 'On-country healing and cultural programs' },
        { name: 'Youth Mentorship', description: 'Long-term relationship-based support' },
      ],
      traditionalOwners: 'Arrernte People (Eastern & Western), Warlpiri, Luritja',
    },
  };

  const { error: oonchiumpaErr } = await supabase
    .from('organizations')
    .update({ settings: oonchiumpaSettings })
    .eq('id', OONCHIUMPA_ORG_ID);

  if (oonchiumpaErr) console.error('Oonchiumpa error:', oonchiumpaErr.message);
  else console.log('✓ Oonchiumpa settings updated');

  // ============================================
  // 3. PICC
  // ============================================
  console.log('🏝️  Updating PICC...');

  const piccSettings = {
    partner: {
      videos: [],
      goals: [
        {
          type: 'mission',
          title: 'Community-Controlled Services',
          description: '197 staff delivering 16+ essential services on Palm Island - the largest Aboriginal community-controlled organization in the region.',
          icon: 'building',
        },
        {
          type: 'vision',
          title: 'Data Sovereignty',
          description: 'Palm Island data belongs to Palm Island. Building infrastructure for community-controlled information and storytelling.',
          icon: 'database',
        },
        {
          type: 'goal',
          title: 'Youth Pathways Precinct',
          description: 'Transforming The Station into a regional hub bridging Townsville and Palm Island - training, industry, and cultural connection.',
          icon: 'compass',
        },
        {
          type: 'value',
          title: 'Circular Economy',
          description: 'Goods manufacturing, recycled-plastic beds, washing machine refurbishment - turning waste into essential items while training young people.',
          icon: 'refresh-cw',
        },
      ],
      impact: [
        { name: 'Staff', value: '197', context: 'community members employed', icon: 'users' },
        { name: 'Services', value: '16+', context: 'essential services delivered', icon: 'heart-pulse' },
        { name: 'Site Lease', value: '30 Years', context: 'Station Precinct development', icon: 'calendar' },
      ],
      contacts: [
        { type: 'website', label: 'PICC Website', value: 'https://picc.com.au', primary: true },
        { type: 'website', label: 'Station Site Plan', value: 'https://picc-station-site.vercel.app' },
        { type: 'address', label: 'Palm Island', value: 'Palm Island, QLD 4816 (Bwgcolman Country)' },
        { type: 'address', label: 'Townsville Office', value: 'Townsville, QLD (Manbarra Country)' },
      ],
      linkedStories: [
        {
          empathyLedgerId: EMPATHY_LEDGER_STORIES.hull_river_history,
          title: 'Hull River History',
          type: 'documentary',
          featured: true,
        },
        {
          empathyLedgerId: EMPATHY_LEDGER_STORIES.palm_island_storm,
          title: 'Palm Island Storm Stories',
          type: 'interview',
          featured: true,
        },
        {
          empathyLedgerId: EMPATHY_LEDGER_STORIES.cyclone_kirrily,
          title: 'Cyclone Kirrily Recovery',
          type: 'documentary',
        },
      ],
      linkedStorytellers: [
        {
          empathyLedgerId: EMPATHY_LEDGER_STORYTELLERS.patricia_miller,
          name: 'Patricia Ann Miller',
          role: 'Community Elder',
          featured: true,
        },
        {
          empathyLedgerId: EMPATHY_LEDGER_STORYTELLERS.uncle_alan,
          name: 'Uncle Alan Palm Island',
          role: 'Elder & Cultural Advisor',
          featured: true,
        },
      ],
      siteLocations: [
        { name: 'Commercial Kitchen Block', description: 'Reactivated kitchen for catering and hospitality training', type: 'building', status: 'in_progress', icon: 'utensils' },
        { name: 'Goods Workshop', description: 'Manufacturing recycled-plastic bed bases and refurbishing washing machines', type: 'building', status: 'planned', icon: 'hammer' },
        { name: 'Train Carriages', description: 'Historical carriages for storytelling and cultural programs', type: 'building', status: 'in_progress', icon: 'train' },
        { name: 'Creek & Lagoon System', description: 'Water feature revival with orchard - bringing life back to the landscape', type: 'nature', status: 'planned', icon: 'droplet' },
        { name: 'Modular Accommodation', description: 'Tiny homes built by young people for visiting trainees and mentors', type: 'building', status: 'planned', icon: 'home' },
      ],
      interactiveMapUrl: 'https://picc-station-site.vercel.app',
      traditionalOwners: 'Bwgcolman People (Palm Island), Manbarra People (Townsville)',
      stationProject: {
        name: 'PICC Station Precinct',
        lease: '30 years',
        pillars: [
          'Goods Manufacturing & Circular Economy',
          'Youth Justice & Pathways',
          'Accommodation & Hospitality',
        ],
        partners: ['Palm Island Aboriginal Shire Council', 'Townsville City Council', 'A Curious Tractor'],
      },
    },
  };

  const { error: piccErr } = await supabase
    .from('organizations')
    .update({ settings: piccSettings })
    .eq('id', PICC_ORG_ID);

  if (piccErr) console.error('PICC error:', piccErr.message);
  else console.log('✓ PICC settings updated');

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ Partner settings updated successfully!');
  console.log('='.repeat(50));

  // Verify
  const { data: orgs } = await supabase
    .from('organizations')
    .select('name, settings')
    .in('id', [MOUNTY_YARNS_ORG_ID, OONCHIUMPA_ORG_ID, PICC_ORG_ID]);

  console.log('\nVerification:');
  orgs?.forEach(org => {
    const partner = org.settings?.partner;
    console.log(`\n${org.name}:`);
    console.log(`  Videos: ${partner?.videos?.length || 0}`);
    console.log(`  Goals: ${partner?.goals?.length || 0}`);
    console.log(`  Impact Metrics: ${partner?.impact?.length || 0}`);
    console.log(`  Contacts: ${partner?.contacts?.length || 0}`);
    console.log(`  Site Locations: ${partner?.siteLocations?.length || 0}`);
    console.log(`  Linked Stories: ${partner?.linkedStories?.length || 0}`);
    console.log(`  Linked Storytellers: ${partner?.linkedStorytellers?.length || 0}`);
  });
}

updatePartnerSettings().catch(console.error);

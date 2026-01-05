import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function seedCoePeople() {
  // Get profiles by slug
  const slugsToSelect = [
    'benjamin-knight',
    'nicholas-marchesi',
    'patricia-ann-miller',
    'uncle-dale',
    'kristy-bloomfield',
    'tanya-turner',
    'olga-havnen',
    'kate-bjur',
    'brodie-germaine',
    'chelsea-rolfe'
  ];

  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, slug, full_name, tagline, bio')
    .in('slug', slugsToSelect);

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found');
    return;
  }

  console.log('Found profiles:', profiles.length);

  // Map profiles to CoE roles
  const roleMapping: Record<string, { role_title: string; expertise_area: string; order: number }> = {
    'benjamin-knight': { role_title: 'Co-Founder & Research Director', expertise_area: 'Youth Justice Research', order: 1 },
    'nicholas-marchesi': { role_title: 'Co-Founder & Creative Director', expertise_area: 'Immersive Experience Design', order: 2 },
    'patricia-ann-miller': { role_title: 'Indigenous Advisory Lead', expertise_area: 'Indigenous Youth Advocacy', order: 3 },
    'uncle-dale': { role_title: 'Elder & Cultural Advisor', expertise_area: 'Cultural Governance', order: 4 },
    'kristy-bloomfield': { role_title: 'Program Development Lead', expertise_area: 'Youth Program Design', order: 5 },
    'tanya-turner': { role_title: 'Community Partnerships Director', expertise_area: 'Community Engagement', order: 6 },
    'olga-havnen': { role_title: 'Policy Advisor', expertise_area: 'Indigenous Policy', order: 7 },
    'kate-bjur': { role_title: 'Practice Lead', expertise_area: 'Evidence-Based Practice', order: 8 },
    'brodie-germaine': { role_title: 'Youth Voice Coordinator', expertise_area: 'Lived Experience Advocacy', order: 9 },
    'chelsea-rolfe': { role_title: 'Communications Lead', expertise_area: 'Strategic Communications', order: 10 }
  };

  const coePeople = profiles.map(profile => ({
    profile_id: profile.id,
    role_title: roleMapping[profile.slug].role_title,
    expertise_area: roleMapping[profile.slug].expertise_area,
    display_order: roleMapping[profile.slug].order
  }));

  const { data, error } = await supabase
    .from('coe_key_people')
    .upsert(coePeople, { onConflict: 'profile_id' })
    .select();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Inserted', data?.length, 'CoE key people');
  data?.forEach(p => console.log('-', p.role_title, '|', p.expertise_area));
}

seedCoePeople();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function linkFounders() {
  console.log('🔗 Linking Oonchiumpa founders...\n');

  // Get Oonchiumpa organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'oonchiumpa')
    .single();

  if (orgError || !org) {
    console.error('❌ Could not find Oonchiumpa organization:', orgError);
    return;
  }

  console.log(`✅ Found organization: ${org.name} (${org.id})\n`);

  // Get the founders
  const founderSlugs = ['kristy-bloomfield', 'tanya-turner', 'patricia-ann-miller'];

  const { data: profiles, error: profilesError } = await supabase
    .from('public_profiles')
    .select('id, full_name, slug')
    .in('slug', founderSlugs);

  if (profilesError || !profiles) {
    console.error('❌ Could not find founder profiles:', profilesError);
    return;
  }

  console.log(`✅ Found ${profiles.length} founder profiles\n`);

  // Link each founder to Oonchiumpa
  for (const profile of profiles) {
    console.log(`Linking ${profile.full_name}...`);

    const { error: linkError } = await supabase
      .from('organizations_profiles')
      .upsert({
        organization_id: org.id,
        public_profile_id: profile.id,
        role: 'Founder & Chair',
        is_current: true,
        is_featured: true,
        start_date: '2018-01-01'
      }, {
        onConflict: 'organization_id,public_profile_id'
      });

    if (linkError) {
      console.error(`  ❌ Failed:`, linkError.message);
    } else {
      console.log(`  ✅ Linked as Founder & Chair`);
    }
  }

  console.log('\n✨ Linking complete!\n');
  console.log('View results:');
  console.log(`  - http://localhost:4000/people/kristy-bloomfield`);
  console.log(`  - http://localhost:4000/organizations/oonchiumpa`);
  console.log('');
}

linkFounders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

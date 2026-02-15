import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function addMissingOrganizations() {
  console.log('Adding missing organizations...\n');

  const organizations = [
    {
      name: 'Independent Storytellers',
      slug: 'independent-storytellers',
      description: 'A collective of individuals sharing personal stories of lived experience in the youth justice system.',
      type: 'storytelling collective',
      is_active: true
    },
    {
      name: 'Snow Foundation',
      slug: 'snow-foundation',
      description: 'Foundation supporting youth justice initiatives and community programs.',
      type: 'foundation',
      is_active: true
    }
  ];

  for (const org of organizations) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', org.slug)
      .single();

    if (existing) {
      console.log(`✓ ${org.name} already exists (${existing.id})`);
      continue;
    }

    // Insert organization
    const { data, error } = await supabase
      .from('organizations')
      .insert(org)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create ${org.name}:`, error);
    } else {
      console.log(`✨ Created: ${org.name} (${data.id})`);
    }
  }

  console.log('\n✅ Done! Now re-sync profiles to auto-link the 19 waiting profiles.');
}

addMissingOrganizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

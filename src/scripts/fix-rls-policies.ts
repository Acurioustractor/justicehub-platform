import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function fixPolicies() {
  console.log('Temporarily disabling RLS for initial data load...\n');

  // For now, let's just try inserting with service key which should bypass RLS
  const program = {
    name: 'Missouri Model Test',
    slug: 'missouri-model-test',
    country: 'United States',
    region: 'north_america',
    program_type: ['custodial_reform'],
    description: 'Test program',
    approach_summary: 'Test approach',
  };

  const { data, error } = await supabase.from('international_programs').insert([program]).select();

  console.log('Data:', data);
  console.log('Error:', error);

  if (data) {
    // Clean up test
    await supabase.from('international_programs').delete().eq('slug', 'missouri-model-test');
    console.log('\n✅ Test passed! Service key can insert.');
  }
}

fixPolicies();

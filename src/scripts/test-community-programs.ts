import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkPrograms() {
  console.log('Checking community_programs table...\n');

  const { data, error } = await supabase
    .from('community_programs')
    .select('*')
    .order('is_featured', { ascending: false });

  console.log('Total programs:', data?.length || 0);
  console.log('');

  if (data && data.length > 0) {
    data.forEach(p => {
      console.log(`✓ ${p.name}`);
      console.log(`  Org: ${p.organization}`);
      console.log(`  State: ${p.state}`);
      console.log(`  Approach: ${p.approach}`);
      console.log(`  Featured: ${p.is_featured ? 'YES' : 'no'}`);
      console.log('');
    });
  } else if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('⚠️  No programs found in database');
  }
}

checkPrograms();

import { supabase } from '@/lib/supabase';

async function testProgramsFetch() {
  console.log('Testing community_programs fetch with frontend supabase client...\n');

  const { data, error } = await supabase
    .from('community_programs')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name');

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Found ${data?.length || 0} programs\n`);
    if (data) {
      data.forEach(p => {
        console.log(`  - ${p.name} (${p.state}, ${p.approach})`);
      });
    }
  }
}

testProgramsFetch();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listOonchiumpaPrograms() {
  const { data, error } = await supabase
    .from('community_programs')
    .select('id, name, location, participants_served, success_rate, founded_year')
    .eq('organization', 'Oonchiumpa Consultancy & Services')
    .order('founded_year', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n✅ All Oonchiumpa Programs:\n');
  console.log('═══════════════════════════════════════════════════\n');

  data?.forEach((program, index) => {
    console.log(`${index + 1}. ${program.name}`);
    console.log(`   ID: ${program.id}`);
    console.log(`   Location: ${program.location}`);
    console.log(`   Founded: ${program.founded_year}`);
    console.log(`   Participants: ${program.participants_served}`);
    console.log(`   Success Rate: ${program.success_rate}%\n`);
  });

  console.log('═══════════════════════════════════════════════════');
  console.log(`\nTotal Programs: ${data?.length}\n`);
}

listOonchiumpaPrograms();

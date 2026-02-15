/**
 * Delete the incorrectly created generic Oonchiumpa programs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteOonchiumpaPrograms() {
  console.log('\n🗑️  Deleting Generic Oonchiumpa Programs\n');
  console.log('═══════════════════════════════════════════\n');

  const { data: programs, error } = await supabase
    .from('community_programs')
    .select('id, name')
    .eq('organization', 'Oonchiumpa Consultancy & Services');

  if (error) {
    console.error('Error finding programs:', error);
    return;
  }

  console.log(`Found ${programs?.length || 0} Oonchiumpa programs to delete:\n`);

  for (const program of programs || []) {
    console.log(`Deleting: ${program.name}`);

    const { error: deleteError } = await supabase
      .from('community_programs')
      .delete()
      .eq('id', program.id);

    if (deleteError) {
      console.log(`  ❌ Error: ${deleteError.message}\n`);
    } else {
      console.log(`  ✅ Deleted\n`);
    }
  }

  console.log('✅ All generic Oonchiumpa programs deleted.');
  console.log('Ready to add the ACTUAL program based on evaluation report.\n');
}

deleteOonchiumpaPrograms().catch(console.error);

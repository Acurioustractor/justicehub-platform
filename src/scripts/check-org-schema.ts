import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSchema() {
  // Try to select from organizations to see what columns exist
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  console.log('\n📊 Organizations Table Schema:\n');

  if (error) {
    console.log('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('Table exists but is empty - checking with insert...');

    // Try minimal insert to see what's required
    const { error: insertError } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org' })
      .select();

    if (insertError) {
      console.log('Insert error shows required columns:', insertError);
    }
  }

  // Also check community_programs for organization_id column
  const { data: programs } = await supabase
    .from('community_programs')
    .select('*')
    .limit(1);

  console.log('\n📋 Community Programs Columns:\n');
  if (programs && programs.length > 0) {
    console.log('Columns:', Object.keys(programs[0]));
  }
}

checkSchema();

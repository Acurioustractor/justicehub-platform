import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function checkUsersTable() {
  console.log('\n🔍 Checking Users Table Schema\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Try to query the users table
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error querying users table:', error.message);
    console.log('\n⚠️  The users table may not exist yet!');
    console.log('\nThe users table should be created by:');
    console.log('  supabase/migrations/20250120000001_initial_schema.sql');
    console.log('\nYou need to run this migration first.');
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Users table exists!');
    console.log('\nColumns found:', Object.keys(data[0]).join(', '));
    console.log('\nSample record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('✅ Users table exists but is empty');
    console.log('\nNeed to check columns by attempting an insert...');

    // Try to see what columns exist by attempting a minimal insert
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'test-check@example.com'
      });

    if (insertError) {
      console.log('\nInsert test error:', insertError.message);
      console.log('\nThis helps us understand the schema.');
    }
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

checkUsersTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

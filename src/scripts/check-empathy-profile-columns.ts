import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';

async function checkColumns() {
  console.log('🔍 Checking Empathy Ledger profiles table columns...\n');

  // Get a single profile with all columns
  const { data, error } = await empathyLedgerClient
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data) {
    console.log('No profiles found.');
    return;
  }

  console.log('Available columns in profiles table:');
  console.log('');

  Object.keys(data).forEach(key => {
    const value = data[key];
    const type = value === null ? 'null' : typeof value;
    console.log(`  - ${key} (${type})`);
  });

  console.log('');
  console.log('Sample profile data:');
  console.log(JSON.stringify(data, null, 2));
}

checkColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

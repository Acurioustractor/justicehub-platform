import { createClient } from '@supabase/supabase-js';

async function checkDatabaseTables() {
  console.log('🔍 Checking JusticeHub Database Tables...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Try to list some known tables
  const tablesToCheck = [
    'articles',
    'community_programs',
    'services',
    'organizations',
    'storytellers',
    'projects',
    'entries',
    'users'
  ];

  console.log('📊 Checking for known tables:\n');
  console.log('=' .repeat(60));

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table.padEnd(25)} - Does not exist or no access`);
      } else {
        console.log(`✅ ${table.padEnd(25)} - EXISTS (${count} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(25)} - Error checking`);
    }
  }

  console.log('=' .repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Tables marked ✅ are in your current database');
  console.log('   2. Identify which are JusticeHub vs Timothy Ledger');
  console.log('   3. See DATABASE_ARCHITECTURE.md for migration plan');
}

checkDatabaseTables();

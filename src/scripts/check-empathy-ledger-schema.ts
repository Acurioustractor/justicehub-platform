import { createClient } from '@supabase/supabase-js';

async function checkEmpathyLedgerSchema() {
  console.log('🔍 Checking Empathy Ledger Database Schema...\n');

  const supabase = createClient(
    'https://yvnuayzslukamizrlhwb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI0NDg1MCwiZXhwIjoyMDcxODIwODUwfQ.natmxpGJM9oZNnCAeMKo_D3fvkBz9spwwzhw7vbkT0k'
  );

  // Check for common Empathy Ledger tables
  const tablesToCheck = [
    'organizations',
    'storytellers',
    'projects',
    'entries',
    'stories',
    'cultural_metadata',
    'consent_records',
    'user_organizations',
    'profiles',
    'media',
    'collaborators'
  ];

  console.log('📊 Checking for tables:\n');
  console.log('=' .repeat(70));

  const existingTables: string[] = [];

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table.padEnd(25)} - Does not exist`);
      } else {
        console.log(`✅ ${table.padEnd(25)} - EXISTS (${count ?? 0} rows)`);
        existingTables.push(table);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(25)} - Error checking`);
    }
  }

  console.log('=' .repeat(70));
  console.log(`\n📋 Found ${existingTables.length} tables in Empathy Ledger database`);

  if (existingTables.length > 0) {
    console.log('\n🔗 Now checking relationships between tables...\n');

    // Get some sample data to understand structure
    for (const table of existingTables.slice(0, 5)) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (data && data.length > 0) {
          console.log(`\n📝 ${table} structure:`);
          console.log('   Columns:', Object.keys(data[0]).join(', '));
        }
      } catch (err) {
        // Skip
      }
    }
  }

  console.log('\n\n💡 Next: Understanding how to connect JusticeHub to Empathy Ledger');
}

checkEmpathyLedgerSchema();

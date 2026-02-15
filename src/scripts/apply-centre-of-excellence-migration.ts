import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function applyMigration() {
  try {
    console.log('📚 Applying Centre of Excellence migration...\n');

    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20250126000004_create_centre_of_excellence.sql'
    );

    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).single();

    if (error) {
      console.error('❌ Migration error:', error);
      return;
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify tables were created
    console.log('Verifying tables...\n');

    const tables = [
      'international_programs',
      'program_outcomes',
      'best_practices',
      'program_visits',
      'international_invitations',
    ];

    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`  ❌ ${table}: ${countError.message}`);
      } else {
        console.log(`  ✅ ${table}: Ready (${count || 0} rows)`);
      }
    }

    console.log('\n📊 Centre of Excellence database is ready!');
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();

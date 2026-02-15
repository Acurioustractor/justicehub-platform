import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function runMigration() {
  console.log('Adding coordinates columns...');

  const { error } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE international_programs
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
    `
  });

  if (error) {
    console.log('Migration result:', error.message);
  } else {
    console.log('✅ Migration complete!');
  }
}

runMigration();

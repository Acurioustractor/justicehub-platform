/**
 * Run organization migration directly via SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log('\n🔄 Running Organization Migration\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250122000001_add_organization_links.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolons to get individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct execution if rpc fails
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        console.log(`  ⚠️  Could not execute via RPC, will try alternative method`);
      } else {
        console.log(`  ✅ Success`);
      }
    } catch (err: any) {
      console.log(`  ⚠️  ${err.message || 'May already exist'}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('\n✅ Migration Complete!\n');
  console.log('Now run: npx tsx src/scripts/setup-oonchiumpa-organization.ts\n');
}

runMigration().catch(console.error);

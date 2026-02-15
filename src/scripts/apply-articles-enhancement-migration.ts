import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function applyMigration() {
  console.log('🔧 Applying Articles Enhancement Migration\n');

  // Read the migration SQL file
  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20250126000003_enhance_articles_for_unification.sql'
  );

  console.log('📄 Reading migration file...');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('✅ Migration file loaded\n');
  console.log('🚀 Executing migration...\n');

  // Execute the SQL
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

  if (error) {
    // If exec_sql doesn't exist, try direct SQL execution
    console.log('   Trying direct SQL execution...');

    // Split by statement and execute each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (!statement) continue;

      const { error: stmtError } = await supabase.from('_migrations').select('*').limit(0);

      // This is a workaround - we'll use the script to manually add columns
      console.log('   Using ALTER TABLE approach...');

      // Execute column additions individually
      const columns = [
        { name: 'featured_image_caption', type: 'TEXT' },
        { name: 'co_authors', type: 'UUID[]' },
        { name: 'tags', type: 'TEXT[]' },
        { name: 'share_count', type: 'INTEGER', default: 0 },
        { name: 'categories', type: 'TEXT[]' },
      ];

      for (const col of columns) {
        const defaultClause = col.default !== undefined ? ` DEFAULT ${col.default}` : '';
        const alterSql = `ALTER TABLE articles ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${defaultClause}`;

        console.log(`   Adding column: ${col.name}`);

        // We need to use raw SQL execution - let's use a stored procedure approach
        // For now, print the SQL that needs to be run
        console.log(`   SQL: ${alterSql}`);
      }
    }

    console.log('\n⚠️  Note: The migration SQL needs to be applied manually via Supabase dashboard.');
    console.log('\n📋 Steps to apply manually:');
    console.log('   1. Go to Supabase dashboard → SQL Editor');
    console.log('   2. Copy the contents of:');
    console.log(`      ${migrationPath}`);
    console.log('   3. Paste and run in SQL Editor');
    console.log('\n   OR run this SQL directly:\n');
    console.log(sql);

    return;
  }

  console.log('✅ Migration applied successfully!\n');
  console.log('📊 New columns added to articles table:');
  console.log('   • featured_image_caption (TEXT)');
  console.log('   • co_authors (UUID[])');
  console.log('   • tags (TEXT[])');
  console.log('   • share_count (INTEGER)');
  console.log('   • categories (TEXT[])');
  console.log('\n🎉 Articles table is now ready for blog post migration!');
}

applyMigration().catch(console.error);

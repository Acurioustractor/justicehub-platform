#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Checking for Oochiumpa duplicates...\n');

const { data, error } = await supabase
  .from('alma_interventions')
  .select('id, name, created_at, metadata')
  .eq('name', 'Oochiumpa Youth Services')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} records:\n`);
  data.forEach((record, i) => {
    console.log(`${i + 1}. ID: ${record.id}`);
    console.log(`   Created: ${record.created_at}`);
    console.log(`   Has metadata: ${!!record.metadata}`);
    console.log('');
  });

  if (data.length > 1) {
    console.log('⚠️  Multiple records found. Keeping most recent, deleting older duplicates...\n');

    const keepId = data[0].id;
    const deleteIds = data.slice(1).map((r) => r.id);

    for (const id of deleteIds) {
      const { error: deleteError } = await supabase
        .from('alma_interventions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete ${id}:`, deleteError.message);
      } else {
        console.log(`   ✅ Deleted ${id}`);
      }
    }

    console.log(`\n✅ Kept most recent record: ${keepId}`);
  }
}

#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
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
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n📝 Publishing All ALMA Interventions...\n');
console.log('This will update all interventions from Draft → Published');
console.log('so they are visible to the public.\n');

async function publishAll() {
  // Update all Draft interventions to Published
  const { data, error, count } = await supabase
    .from('alma_interventions')
    .update({ review_status: 'Published' })
    .eq('review_status', 'Draft')
    .select('id', { count: 'exact' });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Successfully published ${count} interventions!\n`);

  // Verify the update
  const { count: publishedCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'Published');

  const { count: draftCount } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'Draft');

  console.log('📊 Final Status:');
  console.log(`   Published: ${publishedCount}`);
  console.log(`   Draft: ${draftCount}`);
  console.log('\n✨ All interventions are now publicly visible!\n');
}

publishAll();

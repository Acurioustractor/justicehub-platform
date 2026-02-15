#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

console.log('\nTesting ALMA Learning Tables...\n');

// Test extraction_history
const { data, error } = await supabase
  .from('alma_extraction_history')
  .insert({
    document_type: 'test',
    document_length: 100,
    interventions_extracted: 1,
    extraction_success: true,
  })
  .select();

if (error) {
  console.log('❌ alma_extraction_history:', error.message);
  console.log('   Code:', error.code);
  console.log('   Details:', error.details);
} else {
  console.log('✅ alma_extraction_history: Working!');
  console.log('   Inserted ID:', data[0].id);

  // Clean up test
  await supabase.from('alma_extraction_history').delete().eq('id', data[0].id);
}

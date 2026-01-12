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

console.log('Testing Oochiumpa query...\n');

const { data, error } = await supabase
  .from('alma_interventions')
  .select('id, name, metadata')
  .eq('name', 'Oochiumpa Youth Services')
  .single();

if (error) {
  console.error('Error:', error);
} else if (!data) {
  console.log('No data found');
} else {
  console.log('✅ Found intervention:');
  console.log('   ID:', data.id);
  console.log('   Name:', data.name);
  console.log('   Metadata keys:', Object.keys(data.metadata || {}));
}

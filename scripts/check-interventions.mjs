#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log('\n🔍 Checking ALMA Interventions...\n');

const { data, error } = await supabase
  .from('alma_interventions')
  .select('*')
  .limit(3);

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log(`✅ Found ${data.length} interventions:\n`);
  data.forEach((intervention) => {
    console.log(JSON.stringify(intervention, null, 2));
    console.log('\n---\n');
  });
}

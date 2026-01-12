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

const { data, error } = await supabase
  .from('alma_raw_content')
  .select('id, source_url, source_type, file_mime_type, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.log('Error:', error.message);
} else {
  console.log(`\nFound ${data?.length || 0} recent raw content items:\n`);
  data?.forEach((d, i) => {
    console.log(`${i+1}. ${d.source_url?.substring(0, 70)}`);
    console.log(`   Type: ${d.source_type || d.file_mime_type}, Created: ${new Date(d.created_at).toLocaleDateString()}`);
    console.log(`   ID: ${d.id}\n`);
  });
}

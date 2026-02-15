#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

// Test with SERVICE ROLE (bypasses RLS)
const supabaseService = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Test with ANON (uses RLS)
const supabaseAnon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🔐 Testing RLS Geography Field Access\n');

console.log('1. Testing with SERVICE ROLE (bypasses RLS):');
const { data: serviceData } = await supabaseService
  .from('alma_interventions')
  .select('name, geography, review_status, consent_level')
  .limit(5);

console.log('   Found:', serviceData?.length || 0, 'interventions');
if (serviceData && serviceData.length > 0) {
  serviceData.slice(0, 3).forEach(i => {
    console.log(`   - ${i.name}: ${JSON.stringify(i.geography)}`);
  });
}

console.log('\n2. Testing with ANON KEY (uses RLS):');
const { data: anonData } = await supabaseAnon
  .from('alma_interventions')
  .select('name, geography, review_status, consent_level')
  .eq('review_status', 'Published')
  .limit(5);

console.log('   Found:', anonData?.length || 0, 'interventions');
if (anonData && anonData.length > 0) {
  anonData.slice(0, 3).forEach(i => {
    console.log(`   - ${i.name}: ${JSON.stringify(i.geography)}`);
  });
}

console.log('\n3. Checking NT interventions specifically:');
const ntWithService = serviceData?.filter(i => i.geography && i.geography.includes('NT')) || [];
const ntWithAnon = anonData?.filter(i => i.geography && i.geography.includes('NT')) || [];

console.log(`   Service role finds ${ntWithService.length} NT programs`);
console.log(`   Anon key finds ${ntWithAnon.length} NT programs`);

if (ntWithService.length > 0 && ntWithAnon.length === 0) {
  console.log('\n❌ PROBLEM: RLS is filtering out geography data for anonymous users');
  console.log('   This suggests a column-level RLS policy or SELECT permission issue');
}

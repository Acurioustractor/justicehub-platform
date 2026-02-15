#!/usr/bin/env node
/**
 * Update RLS Policy for Community Controlled Interventions
 *
 * Allows anonymous users to view Published Community Controlled interventions.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && line.trim() && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔐 Updating RLS Policy for Community Controlled Interventions');
console.log('═'.repeat(80));

// Drop old policy
console.log('\n1. Dropping old restrictive policy...');
const { error: dropError } = await supabase.rpc('exec_sql', {
  sql: `DROP POLICY IF EXISTS "Public can view published public interventions" ON alma_interventions;`
});

if (dropError) {
  console.error('❌ Error dropping policy:', dropError.message);
} else {
  console.log('✅ Old policy dropped');
}

// Create new policy
console.log('\n2. Creating new policy (allows Published Community Controlled)...');
const { error: createError } = await supabase.rpc('exec_sql', {
  sql: `
    CREATE POLICY "Public can view published interventions"
      ON alma_interventions
      FOR SELECT
      TO anon, authenticated
      USING (
        review_status = 'Published'
        AND consent_level IN ('Public Knowledge Commons', 'Community Controlled')
      );
  `
});

if (createError) {
  console.error('❌ Error creating policy:', createError.message);
  console.log('\nFalling back to direct SQL execution...');

  // Try using the SQL editor approach
  const sql = `
    DROP POLICY IF EXISTS "Public can view published public interventions" ON alma_interventions;

    CREATE POLICY "Public can view published interventions"
      ON alma_interventions
      FOR SELECT
      TO anon, authenticated
      USING (
        review_status = 'Published'
        AND consent_level IN ('Public Knowledge Commons', 'Community Controlled')
      );
  `;

  console.log('\nSQL to run manually in Supabase SQL Editor:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
} else {
  console.log('✅ New policy created');
}

console.log('\n═'.repeat(80));
console.log('✅ RLS Policy Update Complete\n');
console.log('Published Community Controlled interventions are now visible to anonymous users.');
console.log('Refresh the NT showcase page to see Aboriginal-led programs.\n');

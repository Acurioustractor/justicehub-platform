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


const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Dropping old policy via Supabase admin API...');
const dropSql = `DROP POLICY IF EXISTS "Public can view published public interventions" ON alma_interventions;`;
const createSql = `
CREATE POLICY "Public can view published interventions"
  ON alma_interventions
  FOR SELECT
  USING (
    review_status = 'Published'
    AND consent_level IN ('Public Knowledge Commons', 'Community Controlled')
  );
`;

console.log('\n⚠️  Manual SQL required - Supabase JS client cannot execute DDL');
console.log('\nCopy and paste this SQL into Supabase Dashboard → SQL Editor:\n');
console.log('─'.repeat(80));
console.log(dropSql);
console.log(createSql);
console.log('─'.repeat(80));


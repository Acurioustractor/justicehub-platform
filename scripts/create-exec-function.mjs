#!/usr/bin/env node
/**
 * Create exec() SQL function in Supabase to enable remote migrations
 * This function allows us to execute arbitrary SQL remotely via RPC
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(projectRoot, '.env.local'), 'utf8')
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

console.log('\n🚀 Creating exec() function for remote SQL execution...\n');

// SQL to create the exec function
const createExecFunction = `
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS exec(text);

-- Create exec function that allows arbitrary SQL execution
-- SECURITY: Only callable with service role key
CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION exec(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec(text) TO service_role;

COMMENT ON FUNCTION exec(text) IS 'Execute arbitrary SQL - service role only';
`;

async function createFunction() {
  try {
    // We need to execute this SQL somehow
    // Try using Supabase's query method
    const { data, error } = await supabase.rpc('exec', {
      sql: createExecFunction
    });

    if (error) {
      console.log('⚠️  exec() function might not exist yet');
      console.log('   This is a chicken-and-egg problem!\n');
      console.log('📋 Manual step required:');
      console.log('   1. Open Supabase SQL Editor');
      console.log('   2. Paste and run this SQL:\n');
      console.log('─'.repeat(60));
      console.log(createExecFunction);
      console.log('─'.repeat(60));
      console.log('\n   3. Then run: node scripts/apply-unification-migration.mjs\n');

      // Copy to clipboard
      const { execSync } = await import('child_process');
      execSync('pbcopy', { input: createExecFunction });
      console.log('✅ SQL copied to clipboard!\n');

      return false;
    }

    console.log('✅ exec() function created successfully!\n');
    return true;

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please create this function manually in Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(createExecFunction);
    console.log('─'.repeat(60));
    return false;
  }
}

createFunction();

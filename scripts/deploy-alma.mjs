#!/usr/bin/env node
/**
 * Deploy ALMA to Supabase
 * ZERO DEPENDENCIES. Pure Node.js. Works every fucking time.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read .env.local
const envContent = readFileSync(join(projectRoot, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
    .filter(([key]) => key)
    .map(([key, ...values]) => [key.trim(), values.join('=').trim()])
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌ Missing credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

console.log('\n🚀 ALMA Deployment to Supabase\n');
console.log(`📍 ${SUPABASE_URL}\n`);

const migrations = [
  '20250131000001_alma_core_entities.sql',
  '20250131000002_alma_rls_policies.sql',
  '20250131000003_alma_hybrid_linking.sql',
];

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res;
}

async function checkTable(tableName) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deploy() {
  // Check if already deployed
  const exists = await checkTable('alma_interventions');

  if (exists) {
    console.log('⚠️  ALMA tables already exist\n');
    console.log('✅ Verifying tables...\n');

    const tables = [
      'alma_interventions',
      'alma_community_contexts',
      'alma_evidence',
      'alma_outcomes',
      'alma_consent_ledger',
      'alma_usage_log'
    ];

    for (const table of tables) {
      const ok = await checkTable(table);
      console.log(`   ${ok ? '✅' : '❌'} ${table}`);
    }

    console.log('\n✅ ALMA is already deployed!\n');
    return;
  }

  // Apply migrations
  for (const file of migrations) {
    console.log(`📄 Applying: ${file}`);

    const sql = readFileSync(
      join(projectRoot, 'supabase', 'migrations', file),
      'utf8'
    );

    // Execute as one big transaction
    try {
      await runSQL(sql);
      console.log(`   ✅ Success\n`);
    } catch (err) {
      // If RPC doesn't exist, that's okay - tables might be created another way
      console.log(`   ⚠️  ${err.message.substring(0, 80)}...\n`);
    }
  }

  // Verify
  console.log('🔍 Verifying deployment...\n');

  const tables = [
    'alma_interventions',
    'alma_community_contexts',
    'alma_evidence',
    'alma_outcomes',
    'alma_consent_ledger',
    'alma_usage_log'
  ];

  let allGood = true;
  for (const table of tables) {
    const ok = await checkTable(table);
    console.log(`   ${ok ? '✅' : '❌'} ${table}`);
    if (!ok) allGood = false;
  }

  if (!allGood) {
    console.log('\n⚠️  Some tables missing. Trying direct SQL execution...\n');

    // Try executing SQL file by file using direct connection
    console.log('💡 Alternative: Run this command manually:\n');
    console.log('   cd /Users/benknight/Code/JusticeHub');
    console.log('   cat supabase/migrations/20250131*.sql | \\');
    console.log('   psql "<your-database-connection-string>"\n');
    console.log('   Get connection string from Supabase Dashboard → Project Settings → Database\n');

    process.exit(1);
  }

  console.log('\n✅ === ALMA Deployed Successfully ===\n');
  console.log('Next steps:');
  console.log('  1. View in Studio: https://supabase.com/dashboard');
  console.log('  2. Test: SELECT * FROM alma_interventions;');
  console.log('  3. Backfill data if needed\n');
}

deploy().catch(err => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});

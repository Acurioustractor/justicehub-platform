#!/usr/bin/env node
/**
 * Sync Public Profiles from Empathy Ledger V2
 *
 * Fetches profiles marked with justicehub_enabled=true from Empathy Ledger
 * and syncs them to JusticeHub's public_profiles table.
 *
 * Usage: node scripts/sync-empathy-ledger.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local for local runs, fallback to env vars for CI
let env = {};
try {
  const envFile = readFileSync(join(root, '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...values] = line.split('=');
      env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch {
  // Use environment variables in CI
  env = process.env;
}

// Validate required environment variables
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'EMPATHY_LEDGER_SUPABASE_URL',
  'EMPATHY_LEDGER_SUPABASE_ANON_KEY'
];

for (const key of required) {
  if (!env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Create Supabase clients
const justiceHubSupabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const empathyLedgerSupabase = createClient(
  env.EMPATHY_LEDGER_SUPABASE_URL,
  env.EMPATHY_LEDGER_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('\n🔄 === Empathy Ledger Profile Sync ===\n');
console.log(`📍 JusticeHub: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`📍 Empathy Ledger: ${env.EMPATHY_LEDGER_SUPABASE_URL}\n`);

async function syncProfiles() {
  // Fetch profiles marked for JusticeHub
  console.log('📥 Fetching profiles from Empathy Ledger...');

  const { data: profiles, error: fetchError } = await empathyLedgerSupabase
    .from('public_profiles')
    .select('*')
    .eq('justicehub_enabled', true);

  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('\n⚠️  No profiles found with justicehub_enabled=true');
    console.log('   Make sure profiles are marked for JusticeHub in Empathy Ledger\n');
    return { created: 0, updated: 0, failed: 0, total: 0 };
  }

  console.log(`✅ Found ${profiles.length} profiles to sync\n`);

  let created = 0, updated = 0, failed = 0;

  for (const profile of profiles) {
    try {
      // Check if profile already exists in JusticeHub
      const { data: existing } = await justiceHubSupabase
        .from('public_profiles')
        .select('id, updated_at')
        .eq('empathy_ledger_profile_id', profile.id)
        .single();

      // Prepare profile data
      const profileData = {
        empathy_ledger_profile_id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || null,
        role: profile.justicehub_role || 'community_member',
        featured: profile.justicehub_featured || false,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing profile
        const { error: updateError } = await justiceHubSupabase
          .from('public_profiles')
          .update(profileData)
          .eq('id', existing.id);

        if (updateError) throw updateError;

        console.log(`   ✅ Updated: ${profileData.display_name}`);
        updated++;
      } else {
        // Create new profile
        const { error: insertError } = await justiceHubSupabase
          .from('public_profiles')
          .insert({ ...profileData, created_at: new Date().toISOString() });

        if (insertError) throw insertError;

        console.log(`   ✅ Created: ${profileData.display_name}`);
        created++;
      }

      // Update sync timestamp in Empathy Ledger
      await empathyLedgerSupabase
        .from('public_profiles')
        .update({ justicehub_synced_at: new Date().toISOString() })
        .eq('id', profile.id);

    } catch (error) {
      console.error(`   ❌ Failed: ${profile.display_name || profile.id} - ${error.message}`);
      failed++;
    }
  }

  return { created, updated, failed, total: profiles.length };
}

async function main() {
  const startTime = Date.now();

  const results = await syncProfiles();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n📊 === Sync Summary ===');
  console.log(`   ✅ Created: ${results.created}`);
  console.log(`   🔄 Updated: ${results.updated}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📈 Total: ${results.total}`);
  console.log(`   ⏱️  Duration: ${duration}s\n`);

  if (results.failed > 0) {
    console.error('⚠️  Some profiles failed to sync');
    process.exit(1);
  }

  console.log('✅ === Sync Complete ===\n');
}

main();

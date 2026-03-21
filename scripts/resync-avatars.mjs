#!/usr/bin/env node
/**
 * Re-sync avatar URLs from Empathy Ledger storytellers → JusticeHub public_profiles.
 *
 * For profiles where photo_url is null but EL has an avatar_url.
 * Uses EL service client to read storytellers directly.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const jhUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const jhServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const elUrl = process.env.EMPATHY_LEDGER_URL;
const elServiceKey = process.env.EMPATHY_LEDGER_SERVICE_KEY;

if (!jhUrl || !jhServiceKey) { console.error('Missing JH Supabase env'); process.exit(1); }
if (!elUrl || !elServiceKey) { console.error('Missing EL Supabase env'); process.exit(1); }

const jh = createClient(jhUrl, jhServiceKey);
const el = createClient(elUrl, elServiceKey);

async function main() {
  // 1. Get JH profiles synced from EL that are missing photo_url
  const { data: missing, error: mErr } = await jh
    .from('public_profiles')
    .select('id, full_name, empathy_ledger_profile_id')
    .eq('synced_from_empathy_ledger', true)
    .is('photo_url', null)
    .not('empathy_ledger_profile_id', 'is', null);

  if (mErr) { console.error('Error fetching JH profiles:', mErr); return; }
  console.log(`Found ${missing.length} profiles missing avatars\n`);

  if (missing.length === 0) { console.log('Nothing to do!'); return; }

  const elProfileIds = missing.map(p => p.empathy_ledger_profile_id);

  // 2. Check EL storytellers for avatar_url (storyteller IDs may differ from profile IDs)
  // First try: look up storytellers by profile_id
  const { data: storytellers } = await el
    .from('storytellers')
    .select('id, profile_id, display_name, avatar_url')
    .in('profile_id', elProfileIds);

  // Also check profiles table directly
  const { data: profiles } = await el
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', elProfileIds);

  // Build a map: EL profile_id → avatar_url
  const avatarMap = new Map();

  for (const st of (storytellers || [])) {
    if (st.avatar_url && st.profile_id) {
      avatarMap.set(st.profile_id, st.avatar_url);
    }
  }

  for (const p of (profiles || [])) {
    if (p.avatar_url && !avatarMap.has(p.id)) {
      avatarMap.set(p.id, p.avatar_url);
    }
  }

  console.log(`Found ${avatarMap.size} avatars on EL side\n`);

  // 3. Also try storytellers by ID (some profiles use storyteller ID as empathy_ledger_profile_id)
  const stillMissing = elProfileIds.filter(id => !avatarMap.has(id));
  if (stillMissing.length > 0) {
    const { data: stById } = await el
      .from('storytellers')
      .select('id, display_name, avatar_url')
      .in('id', stillMissing);

    for (const st of (stById || [])) {
      if (st.avatar_url) {
        avatarMap.set(st.id, st.avatar_url);
      }
    }
    console.log(`After storyteller ID lookup: ${avatarMap.size} avatars total\n`);
  }

  // 4. Update JH profiles
  let updated = 0;
  let noAvatar = 0;

  for (const profile of missing) {
    const avatarUrl = avatarMap.get(profile.empathy_ledger_profile_id);
    if (!avatarUrl) {
      console.log(`  ✗ ${profile.full_name} — no avatar in EL`);
      noAvatar++;
      continue;
    }

    const { error } = await jh
      .from('public_profiles')
      .update({ photo_url: avatarUrl, last_synced_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      console.log(`  ✗ ${profile.full_name} — update failed: ${error.message}`);
    } else {
      console.log(`  ✓ ${profile.full_name} → ${avatarUrl.substring(0, 60)}...`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${noAvatar} genuinely have no avatar in EL`);
}

main().catch(console.error);

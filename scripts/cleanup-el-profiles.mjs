/**
 * Cleanup EL-synced profiles that are NOT in the 'justicehub' channel.
 *
 * These profiles were synced by org membership (which pulls ALL org members)
 * instead of by channel membership (which only pulls JH-tagged storytellers).
 *
 * Run: node --env-file=.env.local scripts/cleanup-el-profiles.mjs
 * Dry run (default): shows what would be removed
 * Live run: node --env-file=.env.local scripts/cleanup-el-profiles.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const jh = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const el = createClient(process.env.EMPATHY_LEDGER_URL, process.env.EMPATHY_LEDGER_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dryRun = !process.argv.includes('--apply');

async function getJusticeHubChannelMembers() {
  // Find the 'justicehub' syndication channel
  const { data: channel, error: chErr } = await el
    .from('syndication_channels')
    .select('id')
    .eq('slug', 'justicehub')
    .maybeSingle();

  if (chErr || !channel) {
    console.error('Could not find justicehub syndication channel:', chErr?.message);
    process.exit(1);
  }

  console.log(`Found justicehub channel: ${channel.id}`);

  // Get all storyteller IDs in this channel
  const { data: members, error: mErr } = await el
    .from('storyteller_channels')
    .select('storyteller_id')
    .eq('channel_id', channel.id);

  if (mErr) {
    console.error('Error fetching channel members:', mErr.message);
    process.exit(1);
  }

  const storytellerIds = new Set((members || []).map(m => m.storyteller_id));
  console.log(`JusticeHub channel has ${storytellerIds.size} storytellers`);

  // Resolve storyteller IDs to profile IDs
  const profileIds = new Set();
  if (storytellerIds.size > 0) {
    const { data: storytellers } = await el
      .from('storytellers')
      .select('id, profile_id')
      .in('id', [...storytellerIds]);

    for (const st of storytellers || []) {
      profileIds.add(st.profile_id || st.id);
      profileIds.add(st.id); // also add storyteller ID since some JH records use it
    }
  }

  return profileIds;
}

async function cleanup() {
  console.log(dryRun ? '\n=== DRY RUN (use --apply to execute) ===' : '\n=== LIVE RUN ===');

  // Get JH channel members from EL
  const jhChannelProfileIds = await getJusticeHubChannelMembers();

  // Get all EL-synced profiles from JusticeHub
  const { data: syncedProfiles, error } = await jh
    .from('public_profiles')
    .select('id, full_name, slug, empathy_ledger_profile_id')
    .eq('synced_from_empathy_ledger', true);

  if (error) {
    console.error('Error fetching synced profiles:', error.message);
    process.exit(1);
  }

  console.log(`\nJH has ${syncedProfiles.length} EL-synced profiles`);

  const keep = [];
  const remove = [];

  for (const profile of syncedProfiles) {
    const elId = profile.empathy_ledger_profile_id;
    if (elId && jhChannelProfileIds.has(elId)) {
      keep.push(profile);
    } else {
      remove.push(profile);
    }
  }

  console.log(`\nKeep: ${keep.length} (in justicehub channel)`);
  console.log(`Remove: ${remove.length} (NOT in justicehub channel)\n`);

  if (remove.length > 0) {
    console.log('Profiles to remove:');
    for (const p of remove) {
      console.log(`  - ${p.full_name} (/${p.slug}) [EL: ${p.empathy_ledger_profile_id}]`);
    }
  }

  if (!dryRun && remove.length > 0) {
    const removeIds = remove.map(p => p.id);

    // Delete org links first
    const { count: orgLinksRemoved } = await jh
      .from('organizations_profiles')
      .delete({ count: 'exact' })
      .in('public_profile_id', removeIds);
    console.log(`\nRemoved ${orgLinksRemoved} organizations_profiles links`);

    // Delete the profiles
    const { count: profilesRemoved } = await jh
      .from('public_profiles')
      .delete({ count: 'exact' })
      .in('id', removeIds);
    console.log(`Removed ${profilesRemoved} public_profiles`);
  }

  console.log('\nDone.');
}

cleanup();

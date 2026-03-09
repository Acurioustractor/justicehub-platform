/**
 * Run the full push-sync logic (same as push-sync.ts) for an org.
 * Bypasses auth — service role key.
 * Run: node --env-file=.env.local scripts/run-push-sync.mjs [orgId]
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const jh = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const el = createClient(process.env.EMPATHY_LEDGER_URL, process.env.EMPATHY_LEDGER_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const SYN_URL = process.env.EMPATHY_LEDGER_SYNDICATION_URL || 'http://localhost:3030';
const SYN_KEY = process.env.EMPATHY_LEDGER_SYNDICATION_KEY || '';
const DEFAULT_TENANT_ID = '8891e1a9-92ae-423f-928b-cec602660011';

function generateSlug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Fetch syndication profiles as enrichment lookup
async function fetchProfileLookup() {
  const map = new Map();
  try {
    const res = await fetch(`${SYN_URL}/api/syndication/justicehub/profiles?limit=500`, {
      headers: { 'X-API-Key': SYN_KEY }, cache: 'no-store',
    });
    if (!res.ok) return map;
    const data = await res.json();
    for (const p of data.profiles || []) {
      map.set(p.profile_id, p);
      map.set(p.id, p);
    }
  } catch {}
  return map;
}

// Get storyteller IDs that are in the 'justicehub' syndication channel
async function getJusticeHubChannelMembers() {
  const { data: channel } = await el
    .from('syndication_channels')
    .select('id')
    .eq('slug', 'justicehub')
    .maybeSingle();

  if (!channel) {
    console.log('  WARNING: justicehub channel not found — no channel filter applied');
    return null; // null = no filter (allow all)
  }

  const { data: members } = await el
    .from('storyteller_channels')
    .select('storyteller_id')
    .eq('channel_id', channel.id);

  const storytellerIds = new Set((members || []).map(m => m.storyteller_id));

  // Resolve to profile IDs too
  const profileIds = new Set();
  if (storytellerIds.size > 0) {
    const { data: storytellers } = await el
      .from('storytellers')
      .select('id, profile_id')
      .in('id', [...storytellerIds]);
    for (const st of storytellers || []) {
      profileIds.add(st.profile_id || st.id);
      profileIds.add(st.id);
    }
  }

  return { storytellerIds, profileIds };
}

// Get all org members from stories + storyteller_organizations + project_storytellers
async function getOrgMembers(elOrgId) {
  const [storiesRes, junctionRes] = await Promise.all([
    el.from('stories').select('storyteller_id').eq('organization_id', elOrgId),
    el.from('storyteller_organizations').select('storyteller_id').eq('organization_id', elOrgId),
  ]);
  const storytellerIdSet = new Set();
  for (const r of (storiesRes.data || [])) if (r.storyteller_id) storytellerIdSet.add(r.storyteller_id);
  for (const r of (junctionRes.data || [])) if (r.storyteller_id) storytellerIdSet.add(r.storyteller_id);

  const { data: projects } = await el.from('projects').select('id').eq('organization_id', elOrgId);
  const projectProfileIdSet = new Set();
  if (projects && projects.length > 0) {
    const { data: ps } = await el.from('project_storytellers').select('storyteller_id').in('project_id', projects.map(p => p.id));
    for (const r of (ps || [])) if (r.storyteller_id) projectProfileIdSet.add(r.storyteller_id);
  }

  const members = new Map();

  // Resolve storytellers
  if (storytellerIdSet.size > 0) {
    const { data: sts } = await el.from('storytellers').select('id, display_name, profile_id, bio').in('id', [...storytellerIdSet]);
    for (const st of sts || []) {
      const profileId = st.profile_id || st.id;
      members.set(profileId, { profileId, storytellerId: st.id, displayName: st.display_name || 'Unknown', bio: st.bio });
    }
  }

  // Resolve project profile IDs
  const missing = [...projectProfileIdSet].filter(id => !members.has(id));
  if (missing.length > 0) {
    const { data: profiles } = await el.from('profiles').select('id, full_name, display_name, bio, avatar_url').in('id', missing);
    for (const p of profiles || []) {
      if (!members.has(p.id)) {
        const { data: st } = await el.from('storytellers').select('id').eq('profile_id', p.id).maybeSingle();
        members.set(p.id, { profileId: p.id, storytellerId: st?.id, displayName: p.display_name || p.full_name || 'Unknown', bio: p.bio });
      }
    }
  }
  return [...members.values()];
}

async function syncOrg(orgId) {
  const { data: org } = await jh.from('organizations').select('id, name, empathy_ledger_org_id').eq('id', orgId).single();
  if (!org) { console.log('Org not found'); return; }
  console.log(`\n=== ${org.name} ===`);

  const elOrgId = org.empathy_ledger_org_id;
  if (!elOrgId) { console.log('No EL link'); return; }

  const { data: elOrg } = await el.from('organizations').select('tenant_id').eq('id', elOrgId).single();
  const tenantId = elOrg?.tenant_id || DEFAULT_TENANT_ID;

  const profileLookup = await fetchProfileLookup();

  // Get JH people (push step)
  const [orgProfilesRes, communityProfilesRes] = await Promise.all([
    jh.from('organizations_profiles').select('public_profile_id').eq('organization_id', orgId),
    jh.from('community_programs_profiles').select('public_profile_id').eq('organization_id', orgId),
  ]);
  const jhProfileIdSet = new Set();
  for (const r of (orgProfilesRes.data || [])) if (r.public_profile_id) jhProfileIdSet.add(r.public_profile_id);
  for (const r of (communityProfilesRes.data || [])) if (r.public_profile_id) jhProfileIdSet.add(r.public_profile_id);

  const processedProfileIds = new Set();
  let created = 0, linked = 0, updated = 0, skipped = 0;

  // Push: JH people → EL (ensure they have EL records)
  if (jhProfileIdSet.size > 0) {
    const { data: people } = await jh.from('public_profiles')
      .select('id, full_name, bio, photo_url, empathy_ledger_profile_id').in('id', [...jhProfileIdSet]);
    for (const p of people || []) {
      if (p.empathy_ledger_profile_id) {
        processedProfileIds.add(p.empathy_ledger_profile_id);
        updated++;
      }
    }
    console.log(`  Push: ${updated} already linked`);
  }

  // Pull: EL people → JH
  const allOrgMembers = await getOrgMembers(elOrgId);
  console.log(`  EL org members: ${allOrgMembers.length}`);

  // Filter by justicehub channel (unless --all flag)
  const skipChannelFilter = process.argv.includes('--all');
  let orgMembers = allOrgMembers;
  if (!skipChannelFilter) {
    const channelMembers = await getJusticeHubChannelMembers();
    if (channelMembers) {
      orgMembers = allOrgMembers.filter(m =>
        channelMembers.profileIds.has(m.profileId) ||
        (m.storytellerId && channelMembers.storytellerIds.has(m.storytellerId))
      );
      console.log(`  After justicehub channel filter: ${orgMembers.length} (filtered out ${allOrgMembers.length - orgMembers.length})`);
    }
  } else {
    console.log('  --all flag: skipping channel filter');
  }

  for (const member of orgMembers) {
    if (processedProfileIds.has(member.profileId)) continue;

    const { data: existingJH } = await jh.from('public_profiles').select('id')
      .eq('empathy_ledger_profile_id', member.profileId).maybeSingle();

    if (existingJH) {
      const { data: ol } = await jh.from('organizations_profiles').select('id')
        .eq('organization_id', orgId).eq('public_profile_id', existingJH.id).maybeSingle();
      if (!ol) {
        await jh.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: existingJH.id });
        console.log(`  ${member.displayName} — org link added`);
      }
      processedProfileIds.add(member.profileId);
      updated++;
      continue;
    }

    const baseSlug = generateSlug(member.displayName || 'storyteller');
    const { data: bySlug } = await jh.from('public_profiles').select('id').eq('slug', baseSlug).maybeSingle();
    const synData = profileLookup.get(member.profileId) || (member.storytellerId ? profileLookup.get(member.storytellerId) : undefined);

    let jhProfileId;

    if (bySlug) {
      await jh.from('public_profiles').update({
        empathy_ledger_profile_id: member.profileId,
        synced_from_empathy_ledger: true,
        last_synced_at: new Date().toISOString(),
      }).eq('id', bySlug.id);
      jhProfileId = bySlug.id;
      console.log(`  ${member.displayName} — linked by slug`);
      linked++;
    } else {
      const { data: np, error } = await jh.from('public_profiles').insert({
        empathy_ledger_profile_id: member.profileId,
        full_name: member.displayName.trim(),
        slug: baseSlug,
        bio: synData?.bio || member.bio || null,
        photo_url: synData?.profile_image_url || null,
        is_public: true, synced_from_empathy_ledger: true,
        sync_type: 'full', last_synced_at: new Date().toISOString(),
      }).select('id').single();

      if (error) {
        if (error.message.includes('slug')) {
          const { data: retry, error: re } = await jh.from('public_profiles').insert({
            empathy_ledger_profile_id: member.profileId,
            full_name: member.displayName.trim(),
            slug: `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`,
            bio: synData?.bio || member.bio || null, photo_url: synData?.profile_image_url || null,
            is_public: true, synced_from_empathy_ledger: true,
            sync_type: 'full', last_synced_at: new Date().toISOString(),
          }).select('id').single();
          if (re) { console.log(`  ${member.displayName} — FAILED: ${re.message}`); skipped++; continue; }
          jhProfileId = retry.id;
        } else { console.log(`  ${member.displayName} — FAILED: ${error.message}`); skipped++; continue; }
      } else {
        jhProfileId = np.id;
      }
      console.log(`  ${member.displayName} — created in JH`);
      created++;
    }

    // Ensure org link
    const { data: ol } = await jh.from('organizations_profiles').select('id')
      .eq('organization_id', orgId).eq('public_profile_id', jhProfileId).maybeSingle();
    if (!ol) await jh.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: jhProfileId });
    processedProfileIds.add(member.profileId);
  }

  console.log(`\n  Summary: ${created} created, ${linked} linked, ${updated} already synced, ${skipped} skipped`);
}

const specificOrg = process.argv[2];
if (specificOrg) {
  await syncOrg(specificOrg);
} else {
  const { data: orgs } = await jh.from('organizations').select('id').not('empathy_ledger_org_id', 'is', null);
  for (const org of orgs || []) await syncOrg(org.id);
}
console.log('\nDone.');

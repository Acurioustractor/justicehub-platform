/**
 * Link JH orgs to matching EL orgs by name, then run push-sync for all.
 * Run: node --env-file=.env.local scripts/link-and-sync-all.mjs
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const jh = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const el = createClient(process.env.EMPATHY_LEDGER_URL, process.env.EMPATHY_LEDGER_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const DEFAULT_TENANT_ID = '8891e1a9-92ae-423f-928b-cec602660011';

function generateSlug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Fetch EL storyteller profiles as enrichment lookup (direct Supabase query)
async function fetchProfileLookup() {
  const map = new Map();
  try {
    const { data: storytellers } = await el.from('storytellers')
      .select('id, profile_id, display_name, bio, slug')
      .eq('is_active', true).limit(500);
    if (!storytellers) return map;

    const profileIds = storytellers.map(s => s.profile_id).filter(Boolean);
    const avatarMap = new Map();
    if (profileIds.length > 0) {
      const { data: profiles } = await el.from('profiles').select('id, avatar_url').in('id', profileIds);
      for (const p of profiles || []) if (p.avatar_url) avatarMap.set(p.id, p.avatar_url);
    }

    for (const st of storytellers) {
      const entry = {
        id: st.id,
        profile_id: st.profile_id || st.id,
        slug: st.slug || generateSlug(st.display_name || 'unknown'),
        display_name: st.display_name || 'Unknown',
        bio: st.bio || null,
        profile_image_url: avatarMap.get(st.profile_id) || null,
      };
      map.set(entry.profile_id, entry);
      map.set(entry.id, entry);
    }
  } catch (err) { console.error('fetchProfileLookup error:', err.message); }
  return map;
}

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
  if (storytellerIdSet.size > 0) {
    const { data: sts } = await el.from('storytellers').select('id, display_name, profile_id, bio').in('id', [...storytellerIdSet]);
    for (const st of sts || []) {
      const profileId = st.profile_id || st.id;
      members.set(profileId, { profileId, storytellerId: st.id, displayName: st.display_name || 'Unknown', bio: st.bio });
    }
  }
  const missing = [...projectProfileIdSet].filter(id => !members.has(id));
  if (missing.length > 0) {
    const { data: profiles } = await el.from('profiles').select('id, full_name, display_name, bio').in('id', missing);
    for (const p of profiles || []) {
      if (!members.has(p.id)) {
        const { data: st } = await el.from('storytellers').select('id').eq('profile_id', p.id).maybeSingle();
        members.set(p.id, { profileId: p.id, storytellerId: st?.id, displayName: p.display_name || p.full_name || 'Unknown', bio: p.bio });
      }
    }
  }
  return [...members.values()];
}

// Step 1: Link unlinked JH orgs to matching EL orgs
const { data: jhOrgs } = await jh.from('organizations').select('id, name, empathy_ledger_org_id').order('name');
const { data: elOrgs } = await el.from('organizations').select('id, name');

console.log('=== LINKING ===\n');
let linkedCount = 0;
for (const o of jhOrgs || []) {
  if (o.empathy_ledger_org_id) continue;
  const match = (elOrgs || []).find(e => e.name.toLowerCase().trim() === o.name.toLowerCase().trim());
  if (match) {
    await jh.from('organizations').update({ empathy_ledger_org_id: match.id }).eq('id', o.id);
    console.log(`  LINKED: ${o.name} → ${match.id}`);
    o.empathy_ledger_org_id = match.id;
    linkedCount++;
  }
}
console.log(`\nLinked ${linkedCount} new orgs.\n`);

// Step 2: Sync all linked orgs
console.log('=== SYNCING ===\n');
const profileLookup = await fetchProfileLookup();

const linkedOrgs = (jhOrgs || []).filter(o => o.empathy_ledger_org_id);
for (const org of linkedOrgs) {
  const elOrgId = org.empathy_ledger_org_id;
  const { data: elOrg } = await el.from('organizations').select('tenant_id').eq('id', elOrgId).single();
  const tenantId = elOrg?.tenant_id || DEFAULT_TENANT_ID;

  const orgMembers = await getOrgMembers(elOrgId);

  // Get existing JH people for this org
  const { data: existingOps } = await jh.from('organizations_profiles').select('public_profile_id').eq('organization_id', org.id);
  const existingIds = new Set((existingOps || []).map(o => o.public_profile_id));

  // Get their EL profile IDs
  const processedProfileIds = new Set();
  if (existingIds.size > 0) {
    const { data: existingPeople } = await jh.from('public_profiles')
      .select('empathy_ledger_profile_id').in('id', [...existingIds]).not('empathy_ledger_profile_id', 'is', null);
    for (const p of existingPeople || []) processedProfileIds.add(p.empathy_ledger_profile_id);
  }

  let created = 0, linked = 0, updated = 0;
  for (const member of orgMembers) {
    if (processedProfileIds.has(member.profileId)) { updated++; continue; }

    const { data: existingJH } = await jh.from('public_profiles').select('id')
      .eq('empathy_ledger_profile_id', member.profileId).maybeSingle();
    if (existingJH) {
      const { data: ol } = await jh.from('organizations_profiles').select('id')
        .eq('organization_id', org.id).eq('public_profile_id', existingJH.id).maybeSingle();
      if (!ol) await jh.from('organizations_profiles').insert({ organization_id: org.id, public_profile_id: existingJH.id });
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
          if (re) { console.log(`  ${org.name}: ${member.displayName} FAILED: ${re.message}`); continue; }
          jhProfileId = retry.id;
        } else { console.log(`  ${org.name}: ${member.displayName} FAILED: ${error.message}`); continue; }
      } else {
        jhProfileId = np.id;
      }
      created++;
    }

    const { data: ol } = await jh.from('organizations_profiles').select('id')
      .eq('organization_id', org.id).eq('public_profile_id', jhProfileId).maybeSingle();
    if (!ol) await jh.from('organizations_profiles').insert({ organization_id: org.id, public_profile_id: jhProfileId });
    processedProfileIds.add(member.profileId);
  }

  const total = orgMembers.length;
  if (total > 0 || created > 0 || linked > 0) {
    console.log(`  ${org.name}: ${total} EL members → ${created} created, ${linked} linked, ${updated} existing`);
  }
}

console.log('\nDone.');

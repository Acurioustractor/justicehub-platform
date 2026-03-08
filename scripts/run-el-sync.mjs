/**
 * Run EL sync for all linked orgs via syndication API.
 * Usage: node --env-file=.env.local scripts/run-el-sync.mjs [orgId]
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const jh = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const el = createClient(process.env.EMPATHY_LEDGER_URL, process.env.EMPATHY_LEDGER_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const SYN_URL = process.env.EMPATHY_LEDGER_SYNDICATION_URL || 'http://localhost:3030';
const SYN_KEY = process.env.EMPATHY_LEDGER_SYNDICATION_KEY || '';

function generateSlug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchELProfiles(elOrgId) {
  const params = new URLSearchParams({ limit: '200' });
  if (elOrgId) params.set('organizationId', elOrgId);
  const res = await fetch(`${SYN_URL}/api/syndication/justicehub/profiles?${params}`, {
    headers: { 'X-API-Key': SYN_KEY },
  });
  if (!res.ok) throw new Error(`Syndication API: ${res.status}`);
  const data = await res.json();
  return data.profiles || [];
}

async function syncOrg(orgId) {
  const { data: org } = await jh.from('organizations').select('name, empathy_ledger_org_id').eq('id', orgId).single();
  if (!org) { console.log('Org not found:', orgId); return; }
  const elOrgId = org.empathy_ledger_org_id;
  if (!elOrgId) { console.log(org.name + ': no EL link'); return; }

  console.log('\n=== ' + org.name + ' ===');

  // Fetch EL profiles via syndication API
  const elProfiles = await fetchELProfiles(elOrgId);
  console.log(`  EL syndication profiles: ${elProfiles.length}`);

  // Fetch JH people
  const { data: op } = await jh.from('organizations_profiles').select('public_profile_id').eq('organization_id', orgId);
  const { data: cpp } = await jh.from('community_programs_profiles').select('public_profile_id').eq('organization_id', orgId);
  const jhIds = new Set();
  for (const r of [...(op || []), ...(cpp || [])]) if (r.public_profile_id) jhIds.add(r.public_profile_id);
  console.log(`  JH people: ${jhIds.size}`);

  let created = 0, linked = 0, updated = 0, skipped = 0;
  const processedProfileIds = new Set();

  // Push: JH people → EL
  if (jhIds.size > 0) {
    const { data: people } = await jh.from('public_profiles').select('id, full_name, empathy_ledger_profile_id').in('id', [...jhIds]);
    for (const p of people || []) {
      if (p.empathy_ledger_profile_id) {
        const match = elProfiles.find(ep => ep.profile_id === p.empathy_ledger_profile_id);
        if (match) { processedProfileIds.add(match.profile_id); updated++; continue; }
      }
      const nameMatch = elProfiles.find(ep => ep.display_name.trim().toLowerCase() === (p.full_name || '').trim().toLowerCase());
      if (nameMatch) {
        await jh.from('public_profiles').update({ empathy_ledger_profile_id: nameMatch.profile_id }).eq('id', p.id);
        processedProfileIds.add(nameMatch.profile_id);
        console.log(`  ${p.full_name} — linked by name`);
        linked++;
      }
    }
  }

  // Pull: EL profiles → JH
  for (const ep of elProfiles) {
    if (processedProfileIds.has(ep.profile_id)) continue;

    const { data: byEL } = await jh.from('public_profiles').select('id').eq('empathy_ledger_profile_id', ep.profile_id).maybeSingle();
    if (byEL) {
      const { data: ol } = await jh.from('organizations_profiles').select('id').eq('organization_id', orgId).eq('public_profile_id', byEL.id).maybeSingle();
      if (!ol) await jh.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: byEL.id });
      updated++;
      continue;
    }

    const slug = generateSlug(ep.display_name || 'storyteller');
    const { data: bySlug } = await jh.from('public_profiles').select('id').eq('slug', slug).maybeSingle();
    if (bySlug) {
      await jh.from('public_profiles').update({
        empathy_ledger_profile_id: ep.profile_id, synced_from_empathy_ledger: true, last_synced_at: new Date().toISOString(),
      }).eq('id', bySlug.id);
      const { data: ol } = await jh.from('organizations_profiles').select('id').eq('organization_id', orgId).eq('public_profile_id', bySlug.id).maybeSingle();
      if (!ol) await jh.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: bySlug.id });
      console.log(`  ${ep.display_name} — linked by slug`);
      linked++;
      continue;
    }

    const { data: np, error } = await jh.from('public_profiles').insert({
      empathy_ledger_profile_id: ep.profile_id, full_name: (ep.display_name || 'Unknown').trim(), slug,
      bio: ep.bio || null, photo_url: ep.profile_image_url || null,
      is_public: true, synced_from_empathy_ledger: true, sync_type: 'full', last_synced_at: new Date().toISOString(),
    }).select('id').single();

    if (error) {
      if (error.message.includes('slug')) {
        const { data: retry, error: retryErr } = await jh.from('public_profiles').insert({
          empathy_ledger_profile_id: ep.profile_id, full_name: (ep.display_name || 'Unknown').trim(),
          slug: `${slug}-${crypto.randomUUID().slice(0, 6)}`,
          bio: ep.bio || null, photo_url: ep.profile_image_url || null,
          is_public: true, synced_from_empathy_ledger: true, sync_type: 'full', last_synced_at: new Date().toISOString(),
        }).select('id').single();
        if (retryErr) { console.log(`  ${ep.display_name} — FAILED: ${retryErr.message}`); skipped++; continue; }
        await jh.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: retry.id });
      } else { console.log(`  ${ep.display_name} — FAILED: ${error.message}`); skipped++; continue; }
    } else {
      await jh.from('organizations_profiles').insert({ organization_id: orgId, public_profile_id: np.id });
    }
    console.log(`  ${ep.display_name} — pulled into JH`);
    created++;
  }

  console.log(`  Summary: ${created} created, ${linked} linked, ${updated} existing, ${skipped} skipped`);
}

const specificOrg = process.argv[2];
if (specificOrg) {
  await syncOrg(specificOrg);
} else {
  const { data: orgs } = await jh.from('organizations').select('id').not('empathy_ledger_org_id', 'is', null);
  for (const org of orgs || []) await syncOrg(org.id);
}
console.log('\nDone.');

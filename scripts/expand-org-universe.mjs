#!/usr/bin/env node
/**
 * Expand Organization Universe
 *
 * Creates organizations from ACNC data for every ABN that appears in justice_funding
 * but doesn't have an organization record yet. Then links funding + GS entities.
 *
 * Phases:
 *   1. Find funding ABNs without org records → create orgs from ACNC
 *   2. Link all justice_funding to new orgs by ABN
 *   3. Link new orgs to GS entities by ABN
 *   4. Link ORIC corporations to orgs by ABN
 *   5. Enrich org contact data from ACNC (website, email, location)
 *   6. Link orphan interventions by org name
 *   7. Report
 *
 * Usage:
 *   node scripts/expand-org-universe.mjs              # dry-run
 *   node scripts/expand-org-universe.mjs --apply       # write to DB
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const applyMode = process.argv.includes('--apply');

function loadEnv() {
  const env = { ...process.env };
  const envFile = join(root, '.env.local');
  try {
    const content = readFileSync(envFile, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function paginate(table, select, filter) {
  const all = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) { console.error(`  Error loading ${table}:`, error.message); break; }
    if (!data?.length) break;
    all.push(...data);
    process.stderr.write(`\r  Loading ${table}... ${all.length}`);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  if (all.length > 0) process.stderr.write('\n');
  return all;
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ── Phase 1: Create orgs from ACNC for funding ABNs ──────────

async function phase1() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 1: Create organizations from ACNC for funding ABNs');
  console.log('='.repeat(60));

  // Get all unique ABNs from justice_funding that have no org
  const funding = await paginate('justice_funding', 'recipient_abn, recipient_name',
    q => q.not('recipient_abn', 'is', null));

  // Get existing org ABNs
  const existingOrgs = await paginate('organizations', 'abn',
    q => q.not('abn', 'is', null));
  const existingAbnSet = new Set(existingOrgs.map(o => o.abn));

  // Find unique ABNs not in orgs table
  const abnToNames = new Map();
  for (const f of funding) {
    if (!f.recipient_abn || existingAbnSet.has(f.recipient_abn)) continue;
    if (!abnToNames.has(f.recipient_abn)) {
      abnToNames.set(f.recipient_abn, f.recipient_name || 'Unknown');
    }
  }

  console.log(`  Funding records with ABN: ${funding.length}`);
  console.log(`  Existing orgs with ABN: ${existingAbnSet.size}`);
  console.log(`  Unique ABNs needing org records: ${abnToNames.size}`);

  // Lookup these ABNs in ACNC for enrichment
  const acnc = await paginate('acnc_charities',
    'abn, name, charity_size, state, town_city, website, ben_youth, ben_aboriginal_tsi, ben_pre_post_release, ben_children, ben_families, purpose_education, purpose_health, purpose_social_welfare, purpose_law_policy, purpose_human_rights, purpose_reconciliation, registration_date, number_of_responsible_persons');

  const acncByAbn = new Map();
  for (const c of acnc) {
    if (c.abn) acncByAbn.set(c.abn, c);
  }
  console.log(`  ACNC charities loaded: ${acncByAbn.size}`);

  // Build org records
  const newOrgs = [];
  let acncMatched = 0;
  let noAcnc = 0;

  for (const [abn, recipientName] of abnToNames) {
    const ac = acncByAbn.get(abn);

    const purposes = ac ? [
      ac.purpose_education && 'education',
      ac.purpose_health && 'health',
      ac.purpose_social_welfare && 'social_welfare',
      ac.purpose_law_policy && 'law_policy',
      ac.purpose_human_rights && 'human_rights',
      ac.purpose_reconciliation && 'reconciliation',
    ].filter(Boolean) : [];

    const beneficiaries = ac ? [
      ac.ben_youth && 'youth',
      ac.ben_aboriginal_tsi && 'aboriginal_tsi',
      ac.ben_pre_post_release && 'pre_post_release',
      ac.ben_children && 'children',
      ac.ben_families && 'families',
    ].filter(Boolean) : [];

    const name = ac?.name || recipientName;
    const isIndigenous = ac?.ben_aboriginal_tsi ||
      /aboriginal|indigenous|torres strait|first nations|koori|murri/i.test(name);

    if (ac) acncMatched++;
    else noAcnc++;

    newOrgs.push({
      name,
      slug: slugify(name),
      abn,
      state: ac?.state || null,
      city: ac?.town_city || null,
      website: ac?.website || null,
      charity_size: ac?.charity_size || null,
      acnc_purposes: purposes.length > 0 ? purposes : null,
      acnc_beneficiaries: beneficiaries.length > 0 ? beneficiaries : null,
      acnc_registration_date: ac?.registration_date || null,
      is_indigenous_org: isIndigenous,
      is_active: true,
      archived: false,
      verification_status: 'auto_created',
      acnc_data: ac ? {
        charity_size: ac.charity_size,
        town_city: ac.town_city,
        state: ac.state,
        website: ac.website,
        responsible_persons: ac.number_of_responsible_persons,
        purposes,
        beneficiaries,
      } : null,
    });
  }

  console.log(`  ACNC matched: ${acncMatched}`);
  console.log(`  No ACNC match (funding name only): ${noAcnc}`);
  console.log(`  Total new orgs to create: ${newOrgs.length}`);

  if (applyMode && newOrgs.length > 0) {
    let created = 0;
    const batchSize = 100;
    for (let i = 0; i < newOrgs.length; i += batchSize) {
      const batch = newOrgs.slice(i, i + batchSize);
      const { error } = await supabase.from('organizations').insert(batch);
      if (error) {
        // Try one by one for conflicts (duplicate slugs etc)
        for (const org of batch) {
          const { error: singleError } = await supabase.from('organizations').insert(org);
          if (!singleError) created++;
          else if (!singleError.message?.includes('duplicate')) {
            console.error(`  Error creating ${org.name}: ${singleError.message}`);
          }
        }
      } else {
        created += batch.length;
      }
      process.stderr.write(`\r  Created ${created}/${newOrgs.length}`);
    }
    console.log(`\n  Created: ${created} new organizations`);
  }

  return newOrgs.length;
}

// ── Phase 2: Link ALL justice_funding to orgs by ABN ─────────

async function phase2() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 2: Link justice_funding → organizations (by ABN)');
  console.log('='.repeat(60));

  // Get orgs with ABN
  const orgs = await paginate('organizations', 'id, abn',
    q => q.not('abn', 'is', null));
  const orgByAbn = new Map();
  for (const o of orgs) orgByAbn.set(o.abn, o.id);
  console.log(`  Organizations with ABN: ${orgByAbn.size}`);

  // Get unlinked funding with ABN
  const funding = await paginate('justice_funding', 'id, recipient_abn',
    q => q.not('recipient_abn', 'is', null).is('alma_organization_id', null));
  console.log(`  Unlinked funding with ABN: ${funding.length}`);

  let matched = 0;
  const updates = [];
  for (const f of funding) {
    const orgId = orgByAbn.get(f.recipient_abn);
    if (orgId) {
      updates.push({ id: f.id, alma_organization_id: orgId });
      matched++;
    }
  }
  console.log(`  Matched: ${matched}`);

  if (applyMode && updates.length > 0) {
    let applied = 0;
    for (const u of updates) {
      const { error } = await supabase.from('justice_funding')
        .update({ alma_organization_id: u.alma_organization_id })
        .eq('id', u.id);
      if (!error) applied++;
      if (applied % 500 === 0) process.stderr.write(`\r  Applied ${applied}/${updates.length}`);
    }
    console.log(`\n  Applied: ${applied}`);
  }
}

// ── Phase 3: Link new orgs to GS entities by ABN ────────────

async function phase3() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 3: Link organizations → gs_entities (by ABN)');
  console.log('='.repeat(60));

  const orgs = await paginate('organizations', 'id, abn',
    q => q.not('abn', 'is', null).is('gs_entity_id', null));
  console.log(`  Orgs with ABN but no GS link: ${orgs.length}`);

  if (orgs.length === 0) return;

  // Batch lookup GS entities
  const batchSize = 50;
  let matched = 0;

  for (let i = 0; i < orgs.length; i += batchSize) {
    const batch = orgs.slice(i, i + batchSize);
    const abns = batch.map(o => o.abn);

    const { data: gsEntities } = await supabase
      .from('gs_entities')
      .select('id, abn')
      .in('abn', abns);

    if (!gsEntities?.length) continue;

    const gsByAbn = new Map();
    for (const e of gsEntities) {
      if (e.abn) gsByAbn.set(e.abn, e.id);
    }

    for (const org of batch) {
      const gsId = gsByAbn.get(org.abn);
      if (gsId) {
        if (applyMode) {
          await supabase.from('organizations')
            .update({ gs_entity_id: gsId })
            .eq('id', org.id);
        }
        matched++;
      }
    }
    process.stderr.write(`\r  Processed ${Math.min(i + batchSize, orgs.length)}/${orgs.length}, matched ${matched}`);
  }
  console.log(`\n  Matched: ${matched}`);
}

// ── Phase 4: Link ORIC corporations ──────────────────────────

async function phase4() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 4: Link ORIC corporations → organizations (by ABN)');
  console.log('='.repeat(60));

  // Check if oric_corporations table exists and has ABN
  const { data: oricSample, error } = await supabase
    .from('oric_corporations')
    .select('abn, name')
    .not('abn', 'is', null)
    .limit(1);

  if (error) {
    console.log(`  ORIC table not accessible: ${error.message}`);
    return;
  }

  const oric = await paginate('oric_corporations', 'abn, name, state, town_city, corporation_type',
    q => q.not('abn', 'is', null));
  console.log(`  ORIC corporations with ABN: ${oric.length}`);

  // Get existing orgs
  const orgs = await paginate('organizations', 'abn',
    q => q.not('abn', 'is', null));
  const existingAbns = new Set(orgs.map(o => o.abn));

  // Find ORIC corps not in orgs
  const newOric = oric.filter(o => !existingAbns.has(o.abn));
  console.log(`  ORIC corps not in organizations: ${newOric.length}`);

  if (applyMode && newOric.length > 0) {
    let created = 0;
    for (const corp of newOric) {
      const { error } = await supabase.from('organizations').insert({
        name: corp.name,
        slug: slugify(corp.name),
        abn: corp.abn,
        state: corp.state || null,
        city: corp.town_city || null,
        is_indigenous_org: true,
        is_active: true,
        archived: false,
        verification_status: 'auto_created',
        type: corp.corporation_type || 'indigenous_corporation',
      });
      if (!error) created++;
      if (created % 100 === 0) process.stderr.write(`\r  Created ${created}`);
    }
    console.log(`\n  Created: ${created} ORIC organizations`);
  }
}

// ── Phase 5: Enrich org contact data ─────────────────────────

async function phase5() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 5: Enrich organization contact data from ACNC');
  console.log('='.repeat(60));

  // Get orgs missing website/contact
  const orgs = await paginate('organizations', 'id, abn, website, email, state, city',
    q => q.not('abn', 'is', null));

  const needsEnrichment = orgs.filter(o => !o.website || !o.state);
  console.log(`  Orgs needing enrichment: ${needsEnrichment.length}`);

  if (needsEnrichment.length === 0) return;

  // Load ACNC
  const acnc = await paginate('acnc_charities', 'abn, website, state, town_city, email');
  const acncByAbn = new Map();
  for (const c of acnc) {
    if (c.abn) acncByAbn.set(c.abn, c);
  }

  let enriched = 0;
  for (const org of needsEnrichment) {
    const ac = acncByAbn.get(org.abn);
    if (!ac) continue;

    const updates = {};
    if (!org.website && ac.website) updates.website = ac.website;
    if (!org.state && ac.state) updates.state = ac.state;
    if (!org.city && ac.town_city) updates.city = ac.town_city;
    if (!org.email && ac.email) updates.email = ac.email;

    if (Object.keys(updates).length === 0) continue;

    if (applyMode) {
      await supabase.from('organizations').update(updates).eq('id', org.id);
    }
    enriched++;
    if (enriched % 200 === 0) process.stderr.write(`\r  Enriched ${enriched}`);
  }
  console.log(`\n  Enriched: ${enriched} organizations`);
}

// ── Phase 6: Link orphan interventions ───────────────────────

async function phase6() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 6: Link orphan interventions → organizations');
  console.log('='.repeat(60));

  const orphans = await paginate('alma_interventions', 'id, operating_organization, name',
    q => q.not('operating_organization', 'is', null)
          .is('operating_organization_id', null)
          .neq('verification_status', 'ai_generated'));
  console.log(`  Orphan interventions: ${orphans.length}`);

  if (orphans.length === 0) return;

  // Get all orgs for matching
  const orgs = await paginate('organizations', 'id, name');
  const orgByName = new Map();
  for (const o of orgs) orgByName.set(o.name.toLowerCase(), o.id);

  let matched = 0;
  for (const inv of orphans) {
    const orgId = orgByName.get(inv.operating_organization.toLowerCase());
    if (orgId) {
      if (applyMode) {
        await supabase.from('alma_interventions')
          .update({ operating_organization_id: orgId })
          .eq('id', inv.id);
      }
      matched++;
    }
  }
  console.log(`  Matched: ${matched}`);
}

// ── Phase 7: Report ──────────────────────────────────────────

async function phase7() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 7: Final Report');
  console.log('='.repeat(60));

  const [
    { count: orgCount },
    { count: orgWithAbn },
    { count: orgWithGs },
    { count: orgWithAcnc },
    { count: orgWithWebsite },
    { count: orgIndigenous },
    { count: fundingLinked },
    { count: fundingTotal },
    { count: interventionLinked },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).not('abn', 'is', null),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).not('gs_entity_id', 'is', null),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).not('acnc_data', 'is', null),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).not('website', 'is', null),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_indigenous_org', true),
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }).not('alma_organization_id', 'is', null),
    supabase.from('justice_funding').select('*', { count: 'exact', head: true }),
    supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).not('operating_organization_id', 'is', null).neq('verification_status', 'ai_generated'),
  ]);

  console.log(`
  --- Organizations ---
  Total:              ${orgCount}
  With ABN:           ${orgWithAbn}
  With GS link:       ${orgWithGs}
  With ACNC data:     ${orgWithAcnc}
  With website:       ${orgWithWebsite}
  Indigenous:         ${orgIndigenous}

  --- Funding Linkage ---
  Total records:      ${fundingTotal}
  Linked to org:      ${fundingLinked} (${((fundingLinked/fundingTotal)*100).toFixed(1)}%)

  --- Interventions ---
  Linked to org:      ${interventionLinked}
  `);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('\n  Expand Organization Universe');
  console.log('='.repeat(60));
  console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (read only)'}`);

  await phase1();
  await phase2();
  await phase3();
  await phase4();
  await phase5();
  await phase6();
  await phase7();

  console.log('='.repeat(60));
  console.log('  Pipeline complete.');
  console.log('='.repeat(60));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

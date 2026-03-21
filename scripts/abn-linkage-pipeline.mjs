#!/usr/bin/env node
/**
 * ABN Linkage Pipeline — Wire ALL JusticeHub data through ABN as universal key
 *
 * Phases:
 *   1. Backfill justice_funding ABNs via ACNC name matching
 *   2. Link justice_funding -> organizations (by ABN)
 *   3. Link justice_funding -> alma_interventions (by org)
 *   4. Enrich organizations with ACNC data
 *   5. Link organizations -> gs_entities (by ABN)
 *   6. Link alma_interventions -> gs_entities (via org)
 *   7. Print comprehensive report
 *
 * Usage:
 *   node scripts/abn-linkage-pipeline.mjs              # dry-run
 *   node scripts/abn-linkage-pipeline.mjs --apply       # write to DB
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Env loading ──────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .forEach((l) => {
        const eqIdx = l.indexOf('=');
        const key = l.slice(0, eqIdx).trim();
        const val = l.slice(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');

// ── Utilities ────────────────────────────────────────────────

const SUFFIXES_TO_STRIP = [
  'pty ltd', 'pty limited', 'proprietary limited', 'limited', 'ltd',
  'incorporated', 'inc', 'association', 'corporation', 'corp',
  'trust', 'trustee', 'trustees',
];

function normalize(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function stripSuffixes(name) {
  let n = normalize(name);
  for (const suffix of SUFFIXES_TO_STRIP) {
    if (n.endsWith(' ' + suffix)) {
      n = n.slice(0, -(suffix.length + 1)).trim();
    }
  }
  return n;
}

async function paginate(table, select, filters = {}, pageSize = 1000) {
  const results = [];
  let offset = 0;
  while (true) {
    let query = supabase.from(table).select(select).range(offset, offset + pageSize - 1);
    for (const [key, val] of Object.entries(filters)) {
      if (val === null) query = query.is(key, null);
      else if (typeof val === 'object' && val.neq !== undefined) query = query.neq(key, val.neq);
      else if (typeof val === 'object' && val.not_null) query = query.not(key, 'is', null);
      else query = query.eq(key, val);
    }
    const { data, error } = await query;
    if (error) {
      console.error(`  Error fetching ${table}: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
    process.stdout.write(`\r  Loading ${table}... ${results.length}`);
  }
  if (results.length > 1000) process.stdout.write('\n');
  return results;
}

async function batchUpdate(table, updates, idField = 'id') {
  let applied = 0;
  const BATCH = 100;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    for (const item of batch) {
      const id = item[idField];
      const fields = { ...item };
      delete fields[idField];
      const { error } = await supabase.from(table).update(fields).eq(idField, id);
      if (error) {
        console.error(`  Update error for ${table} ${id}: ${error.message}`);
      } else {
        applied++;
      }
    }
    process.stdout.write(`\r  Applied ${applied}/${updates.length}`);
  }
  if (updates.length > 0) process.stdout.write('\n');
  return applied;
}

// ── Stats tracking ───────────────────────────────────────────

const stats = {
  phase1: { before: 0, after: 0, matched: 0 },
  phase2: { before: 0, after: 0, linked: 0 },
  phase3: { before: 0, after: 0, linked: 0 },
  phase4: { enriched: 0 },
  phase5: { before: 0, after: 0, linked: 0 },
  phase6: { before: 0, after: 0, linked: 0 },
};

// ── Phase 1: Backfill justice_funding ABNs via ACNC name matching ──

async function phase1() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 1: Backfill justice_funding ABNs via ACNC name matching');
  console.log('='.repeat(60));

  // Count before
  const { count: withAbnBefore } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('recipient_abn', 'is', null);
  stats.phase1.before = withAbnBefore || 0;
  console.log(`  Funding records WITH ABN (before): ${stats.phase1.before}`);

  // Get funding records without ABN
  const fundingNoAbn = await paginate(
    'justice_funding',
    'id, recipient_name',
    { recipient_abn: null }
  );
  console.log(`  Funding records WITHOUT ABN: ${fundingNoAbn.length}`);

  if (fundingNoAbn.length === 0) {
    console.log('  No records to process.');
    stats.phase1.after = stats.phase1.before;
    return;
  }

  // Build unique recipient names
  const uniqueNames = new Map();
  for (const f of fundingNoAbn) {
    if (!f.recipient_name) continue;
    const norm = normalize(f.recipient_name);
    if (!norm) continue;
    if (!uniqueNames.has(norm)) {
      uniqueNames.set(norm, { original: f.recipient_name, ids: [] });
    }
    uniqueNames.get(norm).ids.push(f.id);
  }
  console.log(`  Unique recipient names to match: ${uniqueNames.size}`);

  // Load ALL ACNC charities
  const acnc = await paginate('acnc_charities', 'abn, name');
  console.log(`  ACNC charities loaded: ${acnc.length}`);

  // Build ACNC indexes: exact normalized name, and suffix-stripped name
  const acncByNorm = new Map();
  const acncByStripped = new Map();
  for (const c of acnc) {
    if (!c.name || !c.abn) continue;
    const norm = normalize(c.name);
    const stripped = stripSuffixes(c.name);
    if (norm && !acncByNorm.has(norm)) acncByNorm.set(norm, c.abn);
    if (stripped && !acncByStripped.has(stripped)) acncByStripped.set(stripped, c.abn);
  }

  // Match: exact normalized first, then suffix-stripped
  const updates = [];
  let matched = 0;
  for (const [norm, entry] of uniqueNames) {
    let abn = acncByNorm.get(norm);
    if (!abn) {
      const stripped = stripSuffixes(entry.original);
      abn = acncByStripped.get(stripped);
    }
    if (abn) {
      matched++;
      for (const id of entry.ids) {
        updates.push({ id, recipient_abn: abn });
      }
    }
  }

  stats.phase1.matched = matched;
  console.log(`  Matched ${matched} unique names -> ${updates.length} funding records`);

  if (applyMode && updates.length > 0) {
    const applied = await batchUpdate('justice_funding', updates);
    console.log(`  Applied: ${applied}`);
  }

  // Count after
  const { count: withAbnAfter } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('recipient_abn', 'is', null);
  stats.phase1.after = applyMode ? (withAbnAfter || 0) : stats.phase1.before + updates.length;
  console.log(`  Funding records WITH ABN (after): ${stats.phase1.after}`);
}

// ── Phase 2: Link justice_funding -> organizations ───────────

async function phase2() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 2: Link justice_funding -> organizations (by ABN)');
  console.log('='.repeat(60));

  // Count before
  const { count: linkedBefore } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_organization_id', 'is', null);
  stats.phase2.before = linkedBefore || 0;
  console.log(`  Funding linked to orgs (before): ${stats.phase2.before}`);

  // Get funding with ABN but no org link
  const unlinked = await paginate(
    'justice_funding',
    'id, recipient_abn',
    { alma_organization_id: null }
  );
  const withAbn = unlinked.filter((f) => f.recipient_abn);
  console.log(`  Funding with ABN but no org link: ${withAbn.length}`);

  if (withAbn.length === 0) {
    stats.phase2.after = stats.phase2.before;
    return;
  }

  // Get all orgs with ABN
  const orgs = await paginate('organizations', 'id, abn', {});
  const orgsByAbn = new Map();
  for (const o of orgs) {
    if (o.abn) orgsByAbn.set(o.abn, o.id);
  }
  console.log(`  Organizations with ABN: ${orgsByAbn.size}`);

  // Match
  const updates = [];
  for (const f of withAbn) {
    const orgId = orgsByAbn.get(f.recipient_abn);
    if (orgId) {
      updates.push({ id: f.id, alma_organization_id: orgId });
    }
  }

  stats.phase2.linked = updates.length;
  console.log(`  Matched: ${updates.length} funding records -> organizations`);

  if (applyMode && updates.length > 0) {
    const applied = await batchUpdate('justice_funding', updates);
    console.log(`  Applied: ${applied}`);
  }

  const { count: linkedAfter } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_organization_id', 'is', null);
  stats.phase2.after = applyMode ? (linkedAfter || 0) : stats.phase2.before + updates.length;
  console.log(`  Funding linked to orgs (after): ${stats.phase2.after}`);
}

// ── Phase 3: Link justice_funding -> alma_interventions ──────

async function phase3() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 3: Link justice_funding -> alma_interventions (by org)');
  console.log('='.repeat(60));

  // Count before
  const { count: linkedBefore } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_intervention_id', 'is', null);
  stats.phase3.before = linkedBefore || 0;
  console.log(`  Funding linked to interventions (before): ${stats.phase3.before}`);

  // Get funding linked to orgs but not to interventions
  const fundingWithOrg = await paginate(
    'justice_funding',
    'id, alma_organization_id, recipient_abn',
    { alma_intervention_id: null }
  );
  const hasOrg = fundingWithOrg.filter((f) => f.alma_organization_id);
  console.log(`  Funding with org but no intervention link: ${hasOrg.length}`);

  if (hasOrg.length === 0) {
    stats.phase3.after = stats.phase3.before;
    return;
  }

  // Get all verified youth justice interventions with org links
  const interventions = await paginate(
    'alma_interventions',
    'id, operating_organization_id',
    { serves_youth_justice: true }
  );
  // Filter out ai_generated
  const verified = interventions.filter((i) => i.operating_organization_id);
  // Also need to check verification_status - fetch that too
  const interventionsFull = await paginate(
    'alma_interventions',
    'id, operating_organization_id, verification_status',
    { serves_youth_justice: true }
  );
  const validInterventions = interventionsFull.filter(
    (i) => i.operating_organization_id && i.verification_status !== 'ai_generated'
  );

  // Build map: org_id -> intervention_ids
  const interventionsByOrg = new Map();
  for (const i of validInterventions) {
    if (!interventionsByOrg.has(i.operating_organization_id)) {
      interventionsByOrg.set(i.operating_organization_id, []);
    }
    interventionsByOrg.get(i.operating_organization_id).push(i.id);
  }
  console.log(`  Orgs with valid youth justice interventions: ${interventionsByOrg.size}`);

  // Match: if org has exactly 1 intervention, link directly. If multiple, pick first.
  const updates = [];
  for (const f of hasOrg) {
    const intIds = interventionsByOrg.get(f.alma_organization_id);
    if (intIds && intIds.length > 0) {
      updates.push({ id: f.id, alma_intervention_id: intIds[0] });
    }
  }

  stats.phase3.linked = updates.length;
  console.log(`  Matched: ${updates.length} funding records -> interventions`);

  if (applyMode && updates.length > 0) {
    const applied = await batchUpdate('justice_funding', updates);
    console.log(`  Applied: ${applied}`);
  }

  const { count: linkedAfter } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_intervention_id', 'is', null);
  stats.phase3.after = applyMode ? (linkedAfter || 0) : stats.phase3.before + updates.length;
  console.log(`  Funding linked to interventions (after): ${stats.phase3.after}`);
}

// ── Phase 4: Enrich organizations with ACNC data ────────────

async function phase4() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 4: Enrich organizations with ACNC charity data');
  console.log('='.repeat(60));

  // Get organizations with ABN
  const orgs = await paginate('organizations', 'id, abn', {});
  const orgsWithAbn = orgs.filter((o) => o.abn);
  console.log(`  Organizations with ABN: ${orgsWithAbn.length}`);

  if (orgsWithAbn.length === 0) {
    return;
  }

  // Get ACNC charities with their enrichment data
  const acnc = await paginate(
    'acnc_charities',
    'abn, charity_size, town_city, state, website, number_of_responsible_persons, purpose_education, purpose_health, purpose_social_welfare, purpose_law_policy, purpose_human_rights, purpose_reconciliation, ben_youth, ben_aboriginal_tsi, ben_pre_post_release, ben_children, ben_families'
  );

  const acncByAbn = new Map();
  for (const c of acnc) {
    if (c.abn) acncByAbn.set(c.abn, c);
  }
  console.log(`  ACNC charities with data: ${acncByAbn.size}`);

  // Build updates — store enrichment as JSON metadata
  const updates = [];
  for (const org of orgsWithAbn) {
    const acncData = acncByAbn.get(org.abn);
    if (!acncData) continue;

    const purposes = [
      acncData.purpose_education && 'education',
      acncData.purpose_health && 'health',
      acncData.purpose_social_welfare && 'social_welfare',
      acncData.purpose_law_policy && 'law_policy',
      acncData.purpose_human_rights && 'human_rights',
      acncData.purpose_reconciliation && 'reconciliation',
    ].filter(Boolean);

    const beneficiaries = [
      acncData.ben_youth && 'youth',
      acncData.ben_aboriginal_tsi && 'aboriginal_tsi',
      acncData.ben_pre_post_release && 'pre_post_release',
      acncData.ben_children && 'children',
      acncData.ben_families && 'families',
    ].filter(Boolean);

    // Store in metadata JSON column (safe — doesn't require schema changes)
    updates.push({
      id: org.id,
      acnc_data: {
        charity_size: acncData.charity_size,
        town_city: acncData.town_city || null,
        state: acncData.state || null,
        website: acncData.website || null,
        responsible_persons: acncData.number_of_responsible_persons || null,
        purposes,
        beneficiaries,
      },
    });
  }

  stats.phase4.enriched = updates.length;
  console.log(`  Organizations enrichable with ACNC data: ${updates.length}`);

  if (applyMode && updates.length > 0) {
    // Update using metadata column if it exists, otherwise try acnc_data
    let applied = 0;
    for (const u of updates) {
      const { error } = await supabase
        .from('organizations')
        .update({ acnc_data: u.acnc_data })
        .eq('id', u.id);
      if (error) {
        // If acnc_data column doesn't exist, try metadata
        if (error.message.includes('acnc_data')) {
          console.log('  Note: acnc_data column does not exist on organizations. Skipping enrichment writes.');
          console.log('  Run this SQL to add it: ALTER TABLE organizations ADD COLUMN IF NOT EXISTS acnc_data JSONB;');
          break;
        }
      } else {
        applied++;
      }
    }
    console.log(`  Applied: ${applied}`);
  }
}

// ── Phase 5: Link organizations -> GS entities ──────────────

async function phase5() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 5: Link organizations -> gs_entities (by ABN)');
  console.log('='.repeat(60));

  // Count before
  const { count: linkedBefore } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .not('gs_entity_id', 'is', null);
  stats.phase5.before = linkedBefore || 0;
  console.log(`  Organizations linked to GS (before): ${stats.phase5.before}`);

  // Get orgs without GS link that have ABN
  const orgs = await paginate('organizations', 'id, abn', { gs_entity_id: null });
  const orgsWithAbn = orgs.filter((o) => o.abn);
  console.log(`  Orgs with ABN but no GS link: ${orgsWithAbn.length}`);

  if (orgsWithAbn.length === 0) {
    stats.phase5.after = stats.phase5.before;
    return;
  }

  // Get GS entities with ABN
  let gsEntities;
  try {
    gsEntities = await paginate('gs_entities', 'id, abn', {});
  } catch (err) {
    console.log(`  gs_entities table not accessible: ${err.message}. Skipping.`);
    stats.phase5.after = stats.phase5.before;
    return;
  }

  const gsByAbn = new Map();
  for (const g of gsEntities) {
    if (g.abn) gsByAbn.set(g.abn, g.id);
  }
  console.log(`  GS entities with ABN: ${gsByAbn.size}`);

  const updates = [];
  for (const org of orgsWithAbn) {
    const gsId = gsByAbn.get(org.abn);
    if (gsId) {
      updates.push({ id: org.id, gs_entity_id: gsId });
    }
  }

  stats.phase5.linked = updates.length;
  console.log(`  Matched: ${updates.length} organizations -> GS entities`);

  if (applyMode && updates.length > 0) {
    const applied = await batchUpdate('organizations', updates);
    console.log(`  Applied: ${applied}`);
  }

  const { count: linkedAfter } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .not('gs_entity_id', 'is', null);
  stats.phase5.after = applyMode ? (linkedAfter || 0) : stats.phase5.before + updates.length;
  console.log(`  Organizations linked to GS (after): ${stats.phase5.after}`);
}

// ── Phase 6: Link alma_interventions -> GS entities via org ──

async function phase6() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 6: Link alma_interventions -> gs_entities (via org)');
  console.log('='.repeat(60));

  // Check if alma_interventions has gs_entity_id column
  const { data: testRow, error: testErr } = await supabase
    .from('alma_interventions')
    .select('id, gs_entity_id')
    .limit(1);

  if (testErr && testErr.message.includes('gs_entity_id')) {
    console.log('  alma_interventions does not have gs_entity_id column. Skipping.');
    console.log('  Run: ALTER TABLE alma_interventions ADD COLUMN IF NOT EXISTS gs_entity_id UUID;');
    return;
  }

  // Count before
  const { count: linkedBefore } = await supabase
    .from('alma_interventions')
    .select('id', { count: 'exact', head: true })
    .not('gs_entity_id', 'is', null);
  stats.phase6.before = linkedBefore || 0;
  console.log(`  Interventions linked to GS (before): ${stats.phase6.before}`);

  // Get interventions without GS link but with org link
  const interventions = await paginate(
    'alma_interventions',
    'id, operating_organization_id',
    { gs_entity_id: null }
  );
  const withOrg = interventions.filter((i) => i.operating_organization_id);
  console.log(`  Interventions with org but no GS link: ${withOrg.length}`);

  if (withOrg.length === 0) {
    stats.phase6.after = stats.phase6.before;
    return;
  }

  // Get orgs that have gs_entity_id
  const orgs = await paginate('organizations', 'id, gs_entity_id', {});
  const orgGsMap = new Map();
  for (const o of orgs) {
    if (o.gs_entity_id) orgGsMap.set(o.id, o.gs_entity_id);
  }
  console.log(`  Organizations with GS entity: ${orgGsMap.size}`);

  const updates = [];
  for (const i of withOrg) {
    const gsId = orgGsMap.get(i.operating_organization_id);
    if (gsId) {
      updates.push({ id: i.id, gs_entity_id: gsId });
    }
  }

  stats.phase6.linked = updates.length;
  console.log(`  Matched: ${updates.length} interventions -> GS entities`);

  if (applyMode && updates.length > 0) {
    const applied = await batchUpdate('alma_interventions', updates);
    console.log(`  Applied: ${applied}`);
  }

  const { count: linkedAfter } = await supabase
    .from('alma_interventions')
    .select('id', { count: 'exact', head: true })
    .not('gs_entity_id', 'is', null);
  stats.phase6.after = applyMode ? (linkedAfter || 0) : stats.phase6.before + updates.length;
  console.log(`  Interventions linked to GS (after): ${stats.phase6.after}`);
}

// ── Phase 7: Report ──────────────────────────────────────────

async function phase7() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 7: Comprehensive ABN Linkage Report');
  console.log('='.repeat(60));

  // Total counts
  const { count: totalFunding } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true });
  const { count: fundingWithAbn } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('recipient_abn', 'is', null);
  const { count: fundingWithOrg } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_organization_id', 'is', null);
  const { count: fundingWithInt } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_intervention_id', 'is', null);
  const { count: totalOrgs } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true });
  const { count: orgsWithAbn } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .not('abn', 'is', null);
  const { count: orgsWithGs } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .not('gs_entity_id', 'is', null);

  console.log('\n  --- Justice Funding ---');
  console.log(`  Total records:              ${totalFunding}`);
  console.log(`  With ABN:                   ${fundingWithAbn} (${pct(fundingWithAbn, totalFunding)})`);
  console.log(`    Phase 1 delta:            ${stats.phase1.before} -> ${stats.phase1.after} (+${stats.phase1.after - stats.phase1.before})`);
  console.log(`  Linked to organizations:    ${fundingWithOrg} (${pct(fundingWithOrg, totalFunding)})`);
  console.log(`    Phase 2 delta:            ${stats.phase2.before} -> ${stats.phase2.after} (+${stats.phase2.after - stats.phase2.before})`);
  console.log(`  Linked to interventions:    ${fundingWithInt} (${pct(fundingWithInt, totalFunding)})`);
  console.log(`    Phase 3 delta:            ${stats.phase3.before} -> ${stats.phase3.after} (+${stats.phase3.after - stats.phase3.before})`);

  console.log('\n  --- Organizations ---');
  console.log(`  Total:                      ${totalOrgs}`);
  console.log(`  With ABN:                   ${orgsWithAbn} (${pct(orgsWithAbn, totalOrgs)})`);
  console.log(`  Enriched with ACNC data:    ${stats.phase4.enriched}`);
  console.log(`  Linked to GS entities:      ${orgsWithGs} (${pct(orgsWithGs, totalOrgs)})`);
  console.log(`    Phase 5 delta:            ${stats.phase5.before} -> ${stats.phase5.after} (+${stats.phase5.after - stats.phase5.before})`);

  // Interventions
  const { count: totalInt } = await supabase
    .from('alma_interventions')
    .select('id', { count: 'exact', head: true })
    .neq('verification_status', 'ai_generated');

  let intWithGs = 0;
  try {
    const { count } = await supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .not('gs_entity_id', 'is', null);
    intWithGs = count || 0;
  } catch {}

  console.log('\n  --- Interventions ---');
  console.log(`  Total (verified):           ${totalInt}`);
  console.log(`  Linked to GS entities:      ${intWithGs}`);
  console.log(`    Phase 6 delta:            ${stats.phase6.before} -> ${stats.phase6.after} (+${stats.phase6.after - stats.phase6.before})`);

  // Top 20 funded organizations
  console.log('\n  --- Top 20 Funded Organizations ---');
  const { data: topFunded } = await supabase
    .from('justice_funding')
    .select('recipient_name, recipient_abn, alma_organization_id, amount_dollars')
    .not('recipient_abn', 'is', null)
    .not('amount_dollars', 'is', null)
    .order('amount_dollars', { ascending: false })
    .limit(500);

  if (topFunded && topFunded.length > 0) {
    // Aggregate by ABN
    const byAbn = new Map();
    for (const f of topFunded) {
      const key = f.recipient_abn;
      if (!byAbn.has(key)) {
        byAbn.set(key, {
          name: f.recipient_name,
          abn: f.recipient_abn,
          total: 0,
          count: 0,
          hasOrg: !!f.alma_organization_id,
        });
      }
      const entry = byAbn.get(key);
      entry.total += parseFloat(f.amount_dollars) || 0;
      entry.count++;
      if (f.alma_organization_id) entry.hasOrg = true;
    }

    const sorted = [...byAbn.values()].sort((a, b) => b.total - a.total).slice(0, 20);

    // Check ACNC data for these ABNs
    const topAbns = sorted.map((s) => s.abn).filter(Boolean);
    const { data: acncData } = await supabase
      .from('acnc_charities')
      .select('abn, charity_size, purpose_law_policy, purpose_reconciliation, ben_youth, ben_aboriginal_tsi')
      .in('abn', topAbns);

    const acncMap = new Map();
    if (acncData) {
      for (const c of acncData) acncMap.set(c.abn, c);
    }

    console.log(`  ${'#'.padEnd(3)} ${'Organization'.padEnd(40)} ${'Total $'.padStart(14)} ${'Grants'.padStart(6)} ${'Org?'.padStart(5)} ${'ACNC Size'.padStart(12)}`);
    console.log(`  ${'-'.repeat(3)} ${'-'.repeat(40)} ${'-'.repeat(14)} ${'-'.repeat(6)} ${'-'.repeat(5)} ${'-'.repeat(12)}`);

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      const acnc = acncMap.get(s.abn);
      const size = acnc?.charity_size || '-';
      console.log(
        `  ${String(i + 1).padEnd(3)} ${(s.name || 'Unknown').slice(0, 40).padEnd(40)} ${formatDollars(s.total).padStart(14)} ${String(s.count).padStart(6)} ${(s.hasOrg ? 'Yes' : 'No').padStart(5)} ${size.padStart(12)}`
      );
    }
  }
}

function pct(n, total) {
  if (!total) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

function formatDollars(n) {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ── Main ─────────────────────────────────────────────────────

console.log('\n  ABN Linkage Pipeline');
console.log('='.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}`);
if (!applyMode) {
  console.log('  Run with --apply to write changes to database');
}

const phases = [
  { name: 'Phase 1', fn: phase1 },
  { name: 'Phase 2', fn: phase2 },
  { name: 'Phase 3', fn: phase3 },
  { name: 'Phase 4', fn: phase4 },
  { name: 'Phase 5', fn: phase5 },
  { name: 'Phase 6', fn: phase6 },
  { name: 'Phase 7', fn: phase7 },
];

for (const phase of phases) {
  try {
    await phase.fn();
  } catch (err) {
    console.error(`\n  ${phase.name} FAILED: ${err.message}`);
    console.error(`  Stack: ${err.stack?.split('\n').slice(0, 3).join('\n  ')}`);
    console.log('  Continuing to next phase...\n');
  }
}

console.log('\n' + '='.repeat(60));
console.log('  Pipeline complete.');
console.log('='.repeat(60) + '\n');

#!/usr/bin/env node
/**
 * Backfill YJ-org data so the intelligence map shows all 822 orgs:
 *
 *   1. Match unlinked YJ orgs to gs_entities by normalised name
 *   2. Pull missing postcodes from acnc_charities via ABN
 *   3. Geocode missing postcodes via the Australia Post API or ACNC town/state
 *
 * Run: node scripts/backfill-yj-org-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envText = readFileSync(envPath, 'utf-8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function norm(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\b(inc\.?|ltd\.?|limited|pty\.?\s*ltd\.?|corporation|corp\.?|incorporated|the)\b/g, '')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function step1_nameMatch() {
  console.log('\n=== STEP 1 — Name-match unlinked YJ orgs to gs_entities ===');

  // Pull all unlinked YJ orgs
  const { data: unlinked, error: e1 } = await sb.rpc('get_yj_orgs_for_map');
  if (e1) throw e1;
  const targets = unlinked.filter((o) => o.unmappable_reason === 'no_gs_entity_link');
  console.log(`  ${targets.length} unlinked YJ orgs to try matching`);

  // Pull a working set of gs_entities (paginated, charity/company/indigenous_corp types)
  const allGsEntities = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from('gs_entities')
      .select('id, canonical_name, abn')
      .in('entity_type', ['charity', 'company', 'foundation', 'indigenous_corp', 'social_enterprise', 'government_body', 'trust', 'unknown'])
      .range(from, from + PAGE - 1);
    if (error) throw error;
    allGsEntities.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
    if (from > 200000) break;
  }
  console.log(`  Loaded ${allGsEntities.length} gs_entities for matching`);

  // Build normalised lookup index
  const indexByName = new Map();
  for (const e of allGsEntities) {
    const n = norm(e.canonical_name);
    if (!n) continue;
    if (!indexByName.has(n)) indexByName.set(n, []);
    indexByName.get(n).push(e);
  }

  let matched = 0;
  let ambiguous = 0;
  const updates = [];
  for (const t of targets) {
    const n = norm(t.name);
    if (!n) continue;
    const candidates = indexByName.get(n) || [];
    if (candidates.length === 1) {
      updates.push({ org_id: t.org_id, gs_entity_id: candidates[0].id, target_name: t.name, matched_name: candidates[0].canonical_name });
      matched++;
    } else if (candidates.length > 1) {
      ambiguous++;
    }
  }
  console.log(`  Exact normalised matches: ${matched}`);
  console.log(`  Ambiguous (multiple candidates): ${ambiguous}`);

  // Apply
  for (const u of updates) {
    const { error } = await sb.from('organizations').update({ gs_entity_id: u.gs_entity_id }).eq('id', u.org_id);
    if (error) console.warn(`  ! failed ${u.target_name}: ${error.message}`);
  }
  console.log(`  ✓ Linked ${updates.length} organizations to gs_entities`);
  return updates.length;
}

async function step2_acncPostcode() {
  console.log('\n=== STEP 2 — Backfill missing gs_entities.postcode from acnc_charities by ABN ===');

  // Find gs_entities used by YJ orgs that have ABN but no postcode
  const { data: targets, error } = await sb.rpc('get_yj_orgs_for_map');
  if (error) throw error;
  const noPC = targets.filter((t) => t.unmappable_reason === 'no_postcode_in_gs_entity');
  console.log(`  ${noPC.length} YJ orgs have gs_entity but no postcode`);

  if (!noPC.length) return 0;

  // Their ABNs
  const abns = noPC.map((t) => t.abn).filter(Boolean);
  if (!abns.length) {
    console.log('  No ABNs available, cannot lookup ACNC');
    return 0;
  }

  const { data: acnc, error: e2 } = await sb
    .from('acnc_charities')
    .select('abn, postcode, state, town_city')
    .in('abn', abns);
  if (e2) throw e2;

  let updated = 0;
  const acncByAbn = new Map(acnc.map((a) => [a.abn, a]));
  for (const t of noPC) {
    if (!t.abn) continue;
    const a = acncByAbn.get(t.abn);
    if (!a || !a.postcode) continue;
    const { error } = await sb
      .from('gs_entities')
      .update({ postcode: a.postcode, state: a.state || null })
      .eq('abn', t.abn);
    if (!error) updated++;
  }
  console.log(`  ✓ Backfilled postcode on ${updated} gs_entities from ACNC`);
  return updated;
}

async function step3_geocodeMissingPostcodes() {
  console.log('\n=== STEP 3 — Geocode missing postcodes (insert into postcode_geo) ===');

  // Get distinct postcodes used by YJ orgs that don't have a geocoded entry
  const { data: targets, error } = await sb.rpc('get_yj_orgs_for_map');
  if (error) throw error;
  const needs = targets.filter((t) => t.unmappable_reason === 'postcode_not_geocoded' && t.postcode);
  const distinctPostcodes = Array.from(new Set(needs.map((t) => t.postcode)));
  console.log(`  ${needs.length} orgs with ${distinctPostcodes.length} distinct postcodes need geocoding`);

  if (!distinctPostcodes.length) return 0;

  // Use ACNC town_city as locality input + Nominatim for geocoding
  // Look up via postcode + state from gs_entities
  const { data: gsRows, error: e3 } = await sb
    .from('gs_entities')
    .select('postcode, state')
    .in('postcode', distinctPostcodes);
  if (e3) throw e3;

  const stateByPostcode = new Map();
  for (const g of gsRows ?? []) {
    if (!stateByPostcode.has(g.postcode)) stateByPostcode.set(g.postcode, g.state);
  }

  // Geocode via Nominatim (free, no key, but rate-limited to 1/sec)
  let inserted = 0;
  let failed = 0;
  const FETCH_HEADERS = { 'User-Agent': 'JusticeHub/1.0 (justicehub.com.au)' };

  for (const pc of distinctPostcodes) {
    const state = stateByPostcode.get(pc) || '';
    const query = `${pc}, ${state}, Australia`;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&country=Australia&postalcode=${encodeURIComponent(pc)}&limit=1`;
      const res = await fetch(url, { headers: FETCH_HEADERS });
      const json = await res.json();
      const r = json[0];
      if (!r) {
        failed++;
        continue;
      }
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      // Insert into postcode_geo. Use postcode + dummy locality so the unique key is satisfied.
      const locality = (r.display_name || `Postcode ${pc}`).split(',')[0].trim();
      const { error: insErr } = await sb.from('postcode_geo').upsert(
        { postcode: pc, locality, state, latitude: lat, longitude: lng },
        { onConflict: 'postcode,locality' },
      );
      if (insErr) {
        console.warn(`  ! ${pc}: ${insErr.message}`);
        failed++;
      } else {
        inserted++;
      }
    } catch (err) {
      failed++;
      console.warn(`  ! ${pc}: ${err.message}`);
    }
    // Nominatim rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(`  ✓ Inserted ${inserted} new postcode_geo rows (${failed} failed)`);
  return inserted;
}

async function main() {
  console.log('JusticeHub YJ-org backfill — running all three steps');
  const linked = await step1_nameMatch();
  const postcoded = await step2_acncPostcode();
  // Step 3 is slow (1 req/sec for ~363 postcodes ~= 6 min). Off by default.
  if (process.argv.includes('--geocode')) {
    const geocoded = await step3_geocodeMissingPostcodes();
    console.log(`\nDone. Linked: ${linked}. ACNC postcoded: ${postcoded}. Geocoded: ${geocoded}.`);
  } else {
    console.log(`\nDone. Linked: ${linked}. ACNC postcoded: ${postcoded}.`);
    console.log('Re-run with --geocode flag to also geocode the remaining missing postcodes (~6 min via Nominatim).');
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});

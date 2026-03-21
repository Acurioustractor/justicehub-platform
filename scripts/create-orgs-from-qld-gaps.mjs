#!/usr/bin/env node
/**
 * Create organizations from ACNC data for unlinked QLD funding recipients.
 *
 * Flow:
 * 1. Load unlinked QLD funding names + ACNC charities + existing org ABNs
 * 2. Fuzzy match unlinked names → ACNC charities
 * 3. For matches where no org exists with that ABN → create org from ACNC data
 * 4. Link funding records to newly created orgs
 *
 * Usage:
 *   node scripts/create-orgs-from-qld-gaps.mjs --dry-run
 *   node scripts/create-orgs-from-qld-gaps.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const ACNC_SIM_THRESHOLD = 0.7;

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\b(inc\.?|incorporated|ltd\.?|limited|pty\.?|proprietary|association|assoc\.?|co-?op(erative)?|trust|group|services?|centre|center|the)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(str) {
  const padded = `  ${str} `;
  const result = new Set();
  for (let i = 0; i < padded.length - 2; i++) result.add(padded.substring(i, i + 3));
  return result;
}

function trigramSimilarity(a, b) {
  const triA = trigrams(a);
  const triB = trigrams(b);
  let intersection = 0;
  for (const t of triA) { if (triB.has(t)) intersection++; }
  const union = triA.size + triB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

async function fetchAll(table, select, pageSize = 1000, filterFn = null) {
  let all = [];
  let page = 0;
  while (true) {
    let query = sb.from(table).select(select).range(page * pageSize, (page + 1) * pageSize - 1);
    if (filterFn) query = filterFn(query);
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await query;
      if (!error) {
        all = all.concat(data);
        if (data.length < pageSize) return all;
        page++;
        break;
      }
      const wait = (attempt + 1) * 5000;
      console.log(`    Retry ${attempt + 1}/5 for ${table} page ${page} (${wait/1000}s)...`);
      await new Promise(r => setTimeout(r, wait));
      if (attempt === 4) throw new Error(`Failed fetching ${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);
  const t0 = Date.now();

  // === LOAD DATA ===
  console.log('Loading data...');

  console.log('  Fetching unlinked funding...');
  const unlinked = await fetchAll('justice_funding', 'id, recipient_name', 1000,
    q => q.eq('source', 'qld-historical-grants').is('alma_organization_id', null).neq('recipient_name', 'Total'));

  console.log('  Fetching existing org ABNs...');
  const existingOrgs = await fetchAll('organizations', 'abn');
  const existingAbns = new Set(existingOrgs.map(o => o.abn).filter(Boolean));

  console.log('  Fetching ACNC charities...');
  const acncCharities = await fetchAll('acnc_charities', 'abn, name, state, postcode, website, town_city');

  console.log(`  ${unlinked.length} unlinked records`);
  console.log(`  ${existingAbns.size} existing org ABNs`);
  console.log(`  ${acncCharities.length} ACNC charities`);
  console.log(`  Loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // Build name → funding IDs map
  const nameCounts = {};
  for (const r of unlinked) {
    if (!nameCounts[r.recipient_name]) nameCounts[r.recipient_name] = [];
    nameCounts[r.recipient_name].push(r.id);
  }
  const names = Object.keys(nameCounts);
  console.log(`${names.length} distinct unlinked names\n`);

  // Build ACNC lookup by normalized name
  const acncByNormName = new Map();
  for (const c of acncCharities) {
    if (!c.name) continue;
    const norm = normalize(c.name);
    if (norm && !acncByNormName.has(norm)) acncByNormName.set(norm, c);
  }

  // === MATCH ===
  const toCreate = []; // { recipientName, acnc, fundingIds }

  for (const name of names) {
    const norm = normalize(name);
    if (norm.length < 4) continue;

    // Try exact normalized match first
    let bestAcnc = acncByNormName.get(norm);
    let bestSim = bestAcnc ? 1.0 : 0;

    // Then fuzzy match
    if (!bestAcnc) {
      const prefix = norm.substring(0, 4);
      for (const [acncNorm, charity] of acncByNormName) {
        if (!acncNorm.startsWith(prefix)) continue;
        const sim = trigramSimilarity(norm, acncNorm);
        if (sim > bestSim) { bestSim = sim; bestAcnc = charity; }
      }
    }

    // Reject cross-state matches (QLD funding should match QLD or national orgs)
    if (bestAcnc && bestAcnc.state && !['QLD', 'Queensland'].includes(bestAcnc.state) && bestSim < 0.85) {
      bestAcnc = null;
      bestSim = 0;
    }

    if (bestAcnc && bestSim >= ACNC_SIM_THRESHOLD && !existingAbns.has(bestAcnc.abn)) {
      toCreate.push({
        recipientName: name,
        acnc: bestAcnc,
        sim: bestSim,
        fundingIds: nameCounts[name]
      });
      existingAbns.add(bestAcnc.abn); // prevent duplicates
    }
  }

  console.log(`Found ${toCreate.length} ACNC matches for new org creation`);
  console.log(`Will link ${toCreate.reduce((s, c) => s + c.fundingIds.length, 0)} funding records\n`);

  // Show samples
  const samples = toCreate.slice(0, 15);
  console.log('Sample matches:');
  for (const c of samples) {
    console.log(`  "${c.recipientName}" → ACNC: "${c.acnc.name}" (ABN: ${c.acnc.abn}, ${c.acnc.state}, sim: ${c.sim.toFixed(3)})`);
  }

  // === CREATE ORGS + LINK ===
  if (!DRY_RUN && toCreate.length > 0) {
    console.log('\nCreating orgs and linking...');
    let created = 0, linked = 0, errors = 0;

    for (const item of toCreate) {
      const orgId = randomUUID();
      const org = {
        id: orgId,
        name: item.acnc.name,
        abn: item.acnc.abn,
        state: item.acnc.state || null,
        postcode: item.acnc.postcode || null,
        website: item.acnc.website || null,
        acnc_data: { source: 'qld-funding-gap-fill', matched_from: item.recipientName, similarity: item.sim },
      };

      // Create org
      const { error: createErr } = await sb.from('organizations').insert(org);
      if (createErr) {
        errors++;
        if (errors <= 5) console.log(`  ERR creating "${item.acnc.name}": ${createErr.message}`);
        continue;
      }
      created++;

      // Link funding records
      for (let i = 0; i < item.fundingIds.length; i += 100) {
        const batch = item.fundingIds.slice(i, i + 100);
        const { error: linkErr } = await sb
          .from('justice_funding')
          .update({ alma_organization_id: orgId })
          .in('id', batch);
        if (linkErr) {
          // Retry once
          await new Promise(r => setTimeout(r, 2000));
          await sb.from('justice_funding').update({ alma_organization_id: orgId }).in('id', batch);
        }
        linked += batch.length;
      }

      if (created % 50 === 0) process.stdout.write(`\r  ${created} orgs created, ${linked} records linked...`);
    }

    console.log(`\n\nDone: ${created} orgs created, ${linked} records linked, ${errors} errors`);

    // Verify
    await new Promise(r => setTimeout(r, 2000));
    const { count } = await sb
      .from('justice_funding')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'qld-historical-grants')
      .is('alma_organization_id', null)
      .neq('recipient_name', 'Total');
    console.log(`Remaining unlinked: ${count}`);
  }

  console.log(`\nTime: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(console.error);

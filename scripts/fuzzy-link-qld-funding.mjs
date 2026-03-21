#!/usr/bin/env node
/**
 * Multi-stage fuzzy linkage for QLD historical funding records.
 * All matching done in-memory for speed (~10 seconds vs 30+ minutes).
 *
 * Stages:
 * 1. Exact name match (case-insensitive) against organizations
 * 2. Normalized match (strip suffixes like Inc, Ltd, Pty)
 * 3. ACNC ABN bridge — fuzzy match name to ACNC charity, get ABN, find org by ABN
 * 4. Trigram fuzzy match ≥0.65 against organizations directly
 *
 * Usage:
 *   node scripts/fuzzy-link-qld-funding.mjs --dry-run   # preview only
 *   node scripts/fuzzy-link-qld-funding.mjs              # apply changes
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const FUZZY_THRESHOLD = 0.75;

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
  for (let i = 0; i < padded.length - 2; i++) {
    result.add(padded.substring(i, i + 3));
  }
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
    let lastError;
    for (let attempt = 0; attempt < 5; attempt++) {
      let query = sb.from(table).select(select).range(page * pageSize, (page + 1) * pageSize - 1);
      if (filterFn) query = filterFn(query);
      const { data, error } = await query;
      if (!error) {
        all = all.concat(data);
        if (data.length < pageSize) return all;
        page++;
        lastError = null;
        break;
      }
      lastError = error;
      const wait = (attempt + 1) * 5000;
      console.log(`    Retry ${attempt + 1}/5 for ${table} page ${page} (waiting ${wait/1000}s)...`);
      await new Promise(r => setTimeout(r, wait));
    }
    if (lastError) throw new Error(`Error fetching ${table}: ${lastError.message}`);
  }
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Threshold: ${FUZZY_THRESHOLD}\n`);
  const t0 = Date.now();

  // === LOAD DATA ===
  console.log('Loading data...');

  // Load sequentially to avoid timeout issues
  console.log('  Fetching unlinked funding...');
  const filteredUnlinked = await fetchAll('justice_funding', 'id, recipient_name', 1000,
    q => q.eq('source', 'qld-historical-grants').is('alma_organization_id', null).neq('recipient_name', 'Total'));

  console.log('  Fetching organizations...');
  const allOrgs = await fetchAll('organizations', 'id, name, abn');

  console.log('  Fetching ACNC charities...');
  const acncCharities = await fetchAll('acnc_charities', 'abn, name');

  console.log(`  ${filteredUnlinked.length} unlinked funding records`);
  console.log(`  ${allOrgs.length} organizations`);
  console.log(`  ${acncCharities.length} ACNC charities`);
  console.log(`  Loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // === BUILD LOOKUP MAPS ===
  const nameCounts = {};
  for (const r of filteredUnlinked) {
    if (!nameCounts[r.recipient_name]) nameCounts[r.recipient_name] = [];
    nameCounts[r.recipient_name].push(r.id);
  }
  const names = Object.keys(nameCounts);
  console.log(`${names.length} distinct unlinked names\n`);

  const orgByLowerName = new Map();
  const orgByNormName = new Map();
  const orgByAbn = new Map();
  for (const o of allOrgs) {
    if (!o.name) continue;
    const lower = o.name.toLowerCase();
    if (!orgByLowerName.has(lower)) orgByLowerName.set(lower, o);
    const norm = normalize(o.name);
    if (norm && !orgByNormName.has(norm)) orgByNormName.set(norm, o);
    if (o.abn && !orgByAbn.has(o.abn)) orgByAbn.set(o.abn, o);
  }

  // ACNC lookup: normalized name → { abn, name }
  const acncByNormName = new Map();
  for (const c of acncCharities) {
    if (!c.name) continue;
    const norm = normalize(c.name);
    if (norm && !acncByNormName.has(norm)) acncByNormName.set(norm, c);
  }

  // Pre-compute org normalized names for fuzzy matching
  const orgNormEntries = [];
  for (const o of allOrgs) {
    if (!o.name) continue;
    orgNormEntries.push({ id: o.id, name: o.name, norm: normalize(o.name) });
  }

  const stats = { exact: 0, normalized: 0, acnc: 0, fuzzy: 0, noMatch: 0 };
  const toLink = [];
  const unmatched = [];

  // === STAGE 1: Exact match ===
  const stage2Names = [];
  for (const name of names) {
    const org = orgByLowerName.get(name.toLowerCase());
    if (org) {
      toLink.push({ fundingIds: nameCounts[name], orgId: org.id, orgName: org.name, method: 'exact', recipientName: name });
      stats.exact += nameCounts[name].length;
    } else {
      stage2Names.push(name);
    }
  }
  console.log(`Stage 1 (exact): ${stats.exact} records (${names.length - stage2Names.length} names)`);

  // === STAGE 2: Normalized match ===
  const stage3Names = [];
  for (const name of stage2Names) {
    const norm = normalize(name);
    const org = orgByNormName.get(norm);
    if (org) {
      toLink.push({ fundingIds: nameCounts[name], orgId: org.id, orgName: org.name, method: 'normalized', recipientName: name });
      stats.normalized += nameCounts[name].length;
    } else {
      stage3Names.push(name);
    }
  }
  console.log(`Stage 2 (normalized): ${stats.normalized} records (${stage2Names.length - stage3Names.length} names)`);

  // === STAGE 3: ACNC ABN bridge ===
  const stage4Names = [];
  const acncNormNames = [...acncByNormName.keys()];

  for (const name of stage3Names) {
    const norm = normalize(name);

    // First try exact normalized match against ACNC
    const acncExact = acncByNormName.get(norm);
    if (acncExact) {
      const org = orgByAbn.get(acncExact.abn);
      if (org) {
        toLink.push({ fundingIds: nameCounts[name], orgId: org.id, orgName: org.name, method: 'acnc-exact', recipientName: name });
        stats.acnc += nameCounts[name].length;
        continue;
      }
    }

    // Then try fuzzy match against ACNC (only first 3 words prefix filter for speed)
    const words = norm.split(' ').slice(0, 2).join(' ');
    if (words.length < 4) { stage4Names.push(name); continue; }

    let bestAcnc = null;
    let bestSim = 0;
    for (const [acncNorm, charity] of acncByNormName) {
      if (!acncNorm.startsWith(words.substring(0, 4))) continue; // prefix filter
      const sim = trigramSimilarity(norm, acncNorm);
      if (sim > bestSim) { bestSim = sim; bestAcnc = charity; }
    }

    if (bestAcnc && bestSim >= 0.6) {
      const org = orgByAbn.get(bestAcnc.abn);
      if (org) {
        toLink.push({ fundingIds: nameCounts[name], orgId: org.id, orgName: org.name, method: 'acnc-fuzzy', recipientName: name, sim: bestSim });
        stats.acnc += nameCounts[name].length;
        continue;
      }
    }
    stage4Names.push(name);
  }
  console.log(`Stage 3 (ACNC bridge): ${stats.acnc} records (${stage3Names.length - stage4Names.length} names)`);

  // === STAGE 4: Direct fuzzy match against organizations ===
  let fuzzyChecked = 0;
  for (const name of stage4Names) {
    const norm = normalize(name);
    let bestOrg = null;
    let bestSim = 0;

    for (const entry of orgNormEntries) {
      // Quick length filter — skip if lengths differ too much
      if (Math.abs(norm.length - entry.norm.length) > norm.length * 0.5) continue;

      const sim = trigramSimilarity(norm, entry.norm);
      if (sim > bestSim) { bestSim = sim; bestOrg = entry; }
    }

    if (bestOrg && bestSim >= FUZZY_THRESHOLD) {
      toLink.push({ fundingIds: nameCounts[name], orgId: bestOrg.id, orgName: bestOrg.name, method: 'fuzzy', recipientName: name, sim: bestSim });
      stats.fuzzy += nameCounts[name].length;
    } else {
      unmatched.push({ name, records: nameCounts[name].length, bestSim, bestName: bestOrg?.name });
      stats.noMatch += nameCounts[name].length;
    }

    fuzzyChecked++;
    if (fuzzyChecked % 200 === 0) process.stdout.write(`\r  Fuzzy: ${fuzzyChecked}/${stage4Names.length}...`);
  }
  if (stage4Names.length > 200) console.log('');
  console.log(`Stage 4 (fuzzy ≥${FUZZY_THRESHOLD}): ${stats.fuzzy} records (${stage4Names.length - unmatched.length} names)`);
  console.log(`No match: ${stats.noMatch} records (${unmatched.length} names)\n`);

  // === SUMMARY ===
  const totalLinked = stats.exact + stats.normalized + stats.acnc + stats.fuzzy;
  console.log('=== SUMMARY ===');
  console.log(`Total linkable: ${totalLinked} / ${filteredUnlinked.length} records`);
  console.log(`  Exact:      ${stats.exact}`);
  console.log(`  Normalized: ${stats.normalized}`);
  console.log(`  ACNC ABN:   ${stats.acnc}`);
  console.log(`  Fuzzy:      ${stats.fuzzy}`);
  console.log(`  No match:   ${stats.noMatch}`);
  console.log(`  Time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Show sample matches per method
  for (const method of ['normalized', 'acnc-exact', 'acnc-fuzzy', 'fuzzy']) {
    const samples = toLink.filter(l => l.method === method).slice(0, 5);
    if (samples.length) {
      console.log(`\nSample ${method} matches:`);
      for (const l of samples) {
        console.log(`  "${l.recipientName}" → "${l.orgName}"${l.sim ? ` (${l.sim.toFixed(3)})` : ''}`);
      }
    }
  }

  // Show top unmatched
  if (unmatched.length) {
    const topUnmatched = unmatched.sort((a, b) => b.records - a.records).slice(0, 15);
    console.log('\nTop unmatched (by record count):');
    for (const u of topUnmatched) {
      console.log(`  "${u.name}" (${u.records} recs) — best: "${u.bestName}" (${u.bestSim?.toFixed(3)})`);
    }
  }

  // Save matches to JSON (for SQL-based apply if REST times out)
  const { writeFileSync } = await import('fs');
  writeFileSync('scripts/qld-funding-matches.json', JSON.stringify(toLink.map(l => ({
    recipientName: l.recipientName, orgId: l.orgId, orgName: l.orgName,
    method: l.method, count: l.fundingIds.length
  })), null, 2));
  console.log(`\nSaved ${toLink.length} matches to scripts/qld-funding-matches.json`);

  // === APPLY ===
  if (!DRY_RUN && toLink.length > 0) {
    console.log('\nApplying links...');
    let applied = 0;
    let errors = 0;

    for (const link of toLink) {
      // Batch update: max 100 ids at a time
      for (let i = 0; i < link.fundingIds.length; i += 100) {
        const batch = link.fundingIds.slice(i, i + 100);
        const { error } = await sb
          .from('justice_funding')
          .update({ alma_organization_id: link.orgId })
          .in('id', batch);

        if (error) {
          errors++;
          if (errors <= 3) console.error(`  Error linking to ${link.orgName}:`, error.message);
        } else {
          applied += batch.length;
        }
      }
    }
    console.log(`\nDone: ${applied} records linked, ${errors} errors`);

    // Verify
    const { count } = await sb
      .from('justice_funding')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'qld-historical-grants')
      .is('alma_organization_id', null)
      .neq('recipient_name', 'Total');
    console.log(`Remaining unlinked: ${count}`);
  }
}

main().catch(console.error);

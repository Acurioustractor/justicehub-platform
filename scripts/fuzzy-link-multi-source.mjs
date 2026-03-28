#!/usr/bin/env node
/**
 * Multi-source fuzzy linkage for unlinked funding records.
 * Adapts the proven 4-stage pipeline from fuzzy-link-qld-funding.mjs
 * to work across NSW, SA, foundation, and other sources.
 *
 * Stages:
 * 1. Exact name match (case-insensitive)
 * 2. Normalized match (strip suffixes)
 * 3. ACNC ABN bridge (fuzzy name → ACNC → ABN → org)
 * 4. Trigram fuzzy match ≥0.75 against organizations
 *
 * Usage:
 *   node scripts/fuzzy-link-multi-source.mjs --dry-run     # preview only
 *   node scripts/fuzzy-link-multi-source.mjs                # apply changes
 *   node scripts/fuzzy-link-multi-source.mjs --source nsw-facs-ngo-grants  # single source
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const FUZZY_THRESHOLD = 0.75;

// Sources to process (ordered by expected linkable count)
const ALL_SOURCES = [
  'nsw-facs-ngo-grants',      // 2,650 unlinked
  'nsw-dcj-ngo-grants',       // 630 unlinked
  'sa-grants-portal',         // 634 unlinked
  'foundation-notable-grants', // 596 unlinked
  'vic-grants',               // if any remain
  'wa-grants',                // if any remain
];

const sourceArg = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
  || (process.argv.includes('--source') ? process.argv[process.argv.indexOf('--source') + 1] : null);
const SOURCES = sourceArg ? [sourceArg] : ALL_SOURCES;

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
      console.log(`    Retry ${attempt + 1}/5 for ${table} page ${page}...`);
      await new Promise(r => setTimeout(r, wait));
    }
    if (lastError) throw new Error(`Error fetching ${table}: ${lastError.message}`);
  }
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Threshold: ${FUZZY_THRESHOLD}`);
  console.log(`Sources: ${SOURCES.join(', ')}\n`);
  const t0 = Date.now();

  // === LOAD SHARED DATA (once) ===
  console.log('Loading shared data...');
  const allOrgs = await fetchAll('organizations', 'id, name, abn');
  console.log(`  ${allOrgs.length} organizations`);

  const acncCharities = await fetchAll('acnc_charities', 'abn, name');
  console.log(`  ${acncCharities.length} ACNC charities`);

  // Build lookup maps
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

  const acncByNormName = new Map();
  for (const c of acncCharities) {
    if (!c.name) continue;
    const norm = normalize(c.name);
    if (norm && !acncByNormName.has(norm)) acncByNormName.set(norm, c);
  }

  const orgNormEntries = allOrgs
    .filter(o => o.name)
    .map(o => ({ id: o.id, name: o.name, norm: normalize(o.name) }));

  console.log(`  Loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // === PROCESS EACH SOURCE ===
  const grandTotal = { exact: 0, normalized: 0, acnc: 0, fuzzy: 0, noMatch: 0, applied: 0 };

  for (const source of SOURCES) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  SOURCE: ${source}`);
    console.log(`${'═'.repeat(60)}`);

    // Fetch unlinked for this source
    const unlinked = await fetchAll('justice_funding', 'id, recipient_name', 1000,
      q => q.eq('source', source).is('alma_organization_id', null));

    if (unlinked.length === 0) {
      console.log(`  No unlinked records. Skipping.\n`);
      continue;
    }

    // Group by name
    const nameCounts = {};
    for (const r of unlinked) {
      if (!r.recipient_name) continue;
      if (!nameCounts[r.recipient_name]) nameCounts[r.recipient_name] = [];
      nameCounts[r.recipient_name].push(r.id);
    }
    const names = Object.keys(nameCounts);
    console.log(`  ${unlinked.length} unlinked records, ${names.length} distinct names\n`);

    const stats = { exact: 0, normalized: 0, acnc: 0, fuzzy: 0, noMatch: 0 };
    const toLink = [];
    const unmatched = [];

    // Stage 1: Exact
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
    console.log(`  Stage 1 (exact): ${stats.exact} records`);

    // Stage 2: Normalized
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
    console.log(`  Stage 2 (normalized): ${stats.normalized} records`);

    // Stage 3: ACNC ABN bridge
    const stage4Names = [];
    for (const name of stage3Names) {
      const norm = normalize(name);
      const acncExact = acncByNormName.get(norm);
      if (acncExact) {
        const org = orgByAbn.get(acncExact.abn);
        if (org) {
          toLink.push({ fundingIds: nameCounts[name], orgId: org.id, orgName: org.name, method: 'acnc-exact', recipientName: name });
          stats.acnc += nameCounts[name].length;
          continue;
        }
      }

      const words = norm.split(' ').slice(0, 2).join(' ');
      if (words.length < 4) { stage4Names.push(name); continue; }

      let bestAcnc = null;
      let bestSim = 0;
      for (const [acncNorm, charity] of acncByNormName) {
        if (!acncNorm.startsWith(words.substring(0, 4))) continue;
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
    console.log(`  Stage 3 (ACNC bridge): ${stats.acnc} records`);

    // Stage 4: Direct fuzzy
    for (const name of stage4Names) {
      const norm = normalize(name);
      let bestOrg = null;
      let bestSim = 0;

      for (const entry of orgNormEntries) {
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
    }
    console.log(`  Stage 4 (fuzzy ≥${FUZZY_THRESHOLD}): ${stats.fuzzy} records`);
    console.log(`  No match: ${stats.noMatch} records\n`);

    const totalLinked = stats.exact + stats.normalized + stats.acnc + stats.fuzzy;
    console.log(`  TOTAL: ${totalLinked}/${unlinked.length} linkable (${(totalLinked/unlinked.length*100).toFixed(1)}%)\n`);

    // Sample matches
    for (const method of ['acnc-fuzzy', 'fuzzy']) {
      const samples = toLink.filter(l => l.method === method).slice(0, 3);
      if (samples.length) {
        console.log(`  Sample ${method}:`);
        for (const l of samples) {
          console.log(`    "${l.recipientName}" → "${l.orgName}"${l.sim ? ` (${l.sim.toFixed(3)})` : ''}`);
        }
      }
    }

    // Top unmatched
    if (unmatched.length) {
      const top = unmatched.sort((a, b) => b.records - a.records).slice(0, 5);
      console.log(`\n  Top unmatched:`);
      for (const u of top) {
        console.log(`    "${u.name}" (${u.records} recs) — best: "${u.bestName}" (${u.bestSim?.toFixed(3)})`);
      }
    }

    // Apply
    if (!DRY_RUN && toLink.length > 0) {
      console.log(`\n  Applying ${toLink.length} link groups...`);
      let applied = 0;
      let errors = 0;

      for (const link of toLink) {
        for (let i = 0; i < link.fundingIds.length; i += 100) {
          const batch = link.fundingIds.slice(i, i + 100);
          const { error } = await sb
            .from('justice_funding')
            .update({ alma_organization_id: link.orgId })
            .in('id', batch);

          if (error) {
            errors++;
            if (errors <= 3) console.error(`    Error linking to ${link.orgName}:`, error.message);
          } else {
            applied += batch.length;
          }
        }
      }
      console.log(`  Done: ${applied} records linked, ${errors} errors`);
      grandTotal.applied += applied;
    }

    grandTotal.exact += stats.exact;
    grandTotal.normalized += stats.normalized;
    grandTotal.acnc += stats.acnc;
    grandTotal.fuzzy += stats.fuzzy;
    grandTotal.noMatch += stats.noMatch;
  }

  // === GRAND TOTAL ===
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  GRAND TOTAL');
  console.log(`${'═'.repeat(60)}`);
  const totalLinkable = grandTotal.exact + grandTotal.normalized + grandTotal.acnc + grandTotal.fuzzy;
  console.log(`  Linkable: ${totalLinkable}`);
  console.log(`  Exact:      ${grandTotal.exact}`);
  console.log(`  Normalized: ${grandTotal.normalized}`);
  console.log(`  ACNC ABN:   ${grandTotal.acnc}`);
  console.log(`  Fuzzy:      ${grandTotal.fuzzy}`);
  console.log(`  No match:   ${grandTotal.noMatch}`);
  if (!DRY_RUN) console.log(`  Applied:    ${grandTotal.applied}`);
  console.log(`  Time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(console.error);

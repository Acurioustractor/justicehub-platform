#!/usr/bin/env node
/**
 * ABN Bridge — Match JusticeHub organizations to ACNC charities by name
 *
 * Links organizations (without ABNs) to ACNC charity register entries
 * using fuzzy name matching, then enriches with ACNC data (ABN, size,
 * indigenous status, beneficiary flags).
 *
 * Usage:
 *   node scripts/abn-bridge.mjs              # dry-run (preview matches)
 *   node scripts/abn-bridge.mjs --apply       # write to DB
 *   node scripts/abn-bridge.mjs --apply --threshold 0.85  # stricter matching
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const threshold = parseFloat(args.find((a) => a.startsWith('--threshold='))?.split('=')[1] || '0.9');

// Expand common abbreviations before matching
const STATE_ABBREVS = {
  'nsw': 'new south wales',
  'vic': 'victoria',
  'qld': 'queensland',
  'wa': 'western australia',
  'sa': 'south australia',
  'tas': 'tasmania',
  'nt': 'northern territory',
  'act': 'australian capital territory',
};

// Normalize org name for matching
function normalize(name) {
  let n = name
    .toLowerCase()
    .replace(/\b(inc|incorporated|ltd|limited|pty|co|corp|corporation|assoc|association)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Expand state abbreviations (match as whole words)
  for (const [abbr, full] of Object.entries(STATE_ABBREVS)) {
    n = n.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
  }
  return n.replace(/\s+/g, ' ').trim();
}

// Simple similarity score (Jaccard on word tokens)
function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

// Check if name is a substring match (one contains the other)
// Only count substring matches where the shorter string is meaningful (>= 8 chars)
function substringMatch(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  const shorter = normA.length < normB.length ? normA : normB;
  if (shorter.length < 8) return false; // too short for reliable substring matching
  return normA.includes(normB) || normB.includes(normA);
}

async function main() {
  console.log('ABN Bridge — Matching JusticeHub orgs to ACNC charities');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Threshold: ${threshold}\n`);

  // Get orgs without ABNs that are linked to ALMA interventions
  const { data: orgsWithoutAbn } = await supabase
    .from('organizations')
    .select('id, name')
    .is('abn', null);

  if (!orgsWithoutAbn?.length) {
    console.log('No organisations without ABNs found.');
    return;
  }

  console.log(`Found ${orgsWithoutAbn.length} orgs without ABNs`);

  // Get ACNC charities — paginate because table has 64K+ rows (Supabase default limit is 1000)
  const acncCharities = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('acnc_charities')
      .select('abn, name, charity_size, operates_in_qld, operates_in_nsw, operates_in_vic, operates_in_wa, operates_in_sa, operates_in_tas, operates_in_nt, operates_in_act, purpose_law_policy, purpose_human_rights, purpose_social_welfare, purpose_reconciliation, ben_youth, ben_children, ben_aboriginal_tsi, ben_pre_post_release, ben_victims_of_crime')
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error(`ACNC fetch error at offset ${from}:`, error.message);
      break;
    }
    if (!data?.length) break;
    acncCharities.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    process.stdout.write(`\r  Loading ACNC charities... ${acncCharities.length}`);
  }

  if (!acncCharities.length) {
    console.log('No ACNC charities found.');
    return;
  }

  console.log(`\rLoaded ${acncCharities.length} ACNC charities`);

  // Build index of normalized ACNC names
  const acncIndex = new Map();
  for (const charity of acncCharities) {
    const norm = normalize(charity.name);
    if (!acncIndex.has(norm)) {
      acncIndex.set(norm, []);
    }
    acncIndex.get(norm).push(charity);
  }

  const matches = [];
  const noMatch = [];

  for (const org of orgsWithoutAbn) {
    // Skip government/generic entries and very short names (unreliable matching)
    if (/government|federal|state|territory|police|health$|^services /i.test(org.name)) continue;
    if (org.name.length < 4) continue;
    const normName = normalize(org.name);
    if (normName.split(' ').filter(w => w.length > 2).length < 2) {
      // Single meaningful word — require exact normalized match only
      if (!acncIndex.has(normName)) {
        noMatch.push(org.name);
        continue;
      }
    }

    // Try exact normalized match first
    if (acncIndex.has(normName)) {
      const charity = acncIndex.get(normName)[0];
      matches.push({ org, charity, score: 1.0, method: 'exact' });
      continue;
    }

    // Try fuzzy matching
    let bestMatch = null;
    let bestScore = 0;

    for (const charity of acncCharities) {
      // Quick length filter — skip wildly different lengths
      if (Math.abs(org.name.length - charity.name.length) > 30) continue;

      const score = similarity(org.name, charity.name);

      // Boost for substring matches — only if base Jaccard is already decent (>= 0.6)
      const isSubstring = score >= 0.6 && substringMatch(org.name, charity.name);
      const adjustedScore = isSubstring ? Math.max(score, 0.9) : score;

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestMatch = charity;
      }
    }

    if (bestMatch && bestScore >= threshold) {
      matches.push({ org, charity: bestMatch, score: bestScore, method: bestScore === 1 ? 'exact' : 'fuzzy' });
    } else {
      noMatch.push(org.name);
    }
  }

  console.log(`\nResults: ${matches.length} matches, ${noMatch.length} unmatched\n`);

  // Show matches
  for (const m of matches.slice(0, 30)) {
    const indigenous = m.charity.ben_aboriginal_tsi ? ' [Indigenous]' : '';
    console.log(`  ✓ ${m.org.name}`);
    console.log(`    → ${m.charity.name} (ABN: ${m.charity.abn}, ${m.method}, score: ${m.score.toFixed(2)})${indigenous}`);
  }
  if (matches.length > 30) {
    console.log(`  ... and ${matches.length - 30} more`);
  }

  if (!apply) {
    console.log(`\nDry run complete. Run with --apply to write ${matches.length} matches to DB.`);
    return;
  }

  // Apply matches
  let updated = 0;
  let enriched = 0;

  for (const m of matches) {
    const updateData = {
      abn: m.charity.abn,
    };

    // Enrich with ACNC data
    if (m.charity.charity_size) updateData.charity_size = m.charity.charity_size;
    if (m.charity.ben_aboriginal_tsi) updateData.is_indigenous_org = true;

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', m.org.id);

    if (!error) {
      updated++;
      if (m.charity.charity_size || m.charity.ben_aboriginal_tsi) enriched++;
    } else {
      console.error(`  ✗ ${m.org.name}: ${error.message}`);
    }
  }

  console.log(`\nApplied: ${updated} ABNs set, ${enriched} enriched with ACNC data`);

  // Show final stats
  const { count: totalWithAbn } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .not('abn', 'is', null);

  const { count: totalIndigenous } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('is_indigenous_org', true);

  console.log(`\nTotal orgs with ABN: ${totalWithAbn}`);
  console.log(`Total indigenous orgs: ${totalIndigenous}`);
}

main().catch(console.error);

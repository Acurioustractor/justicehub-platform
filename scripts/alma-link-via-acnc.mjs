#!/usr/bin/env node
/**
 * ALMA ↔ Justice Funding linking via ACNC ABN bridge
 *
 * Strategy:
 *   1. ALMA orgs without ABN → fuzzy match to ACNC charities → copy ABN
 *   2. ALMA orgs with ABN → link justice_funding records by ABN
 *   3. Unlinked justice_funding → fuzzy match recipient_name to ALMA org names
 *
 * Usage:
 *   npx tsx scripts/alma-link-via-acnc.mjs           # dry-run
 *   npx tsx scripts/alma-link-via-acnc.mjs --apply    # write to DB
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
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');

// ── Matching utilities ──────────────────────────────────────

function normalize(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ORG_STOPWORDS = new Set([
  'the', 'and', 'pty', 'ltd', 'limited', 'inc', 'incorporated',
  'co', 'company', 'services', 'service', 'consultancy', 'consulting',
  'collective', 'council', 'program', 'programs', 'initiative', 'initiatives',
  'group', 'foundation', 'association', 'organisation', 'organization',
  'australia', 'australian', 'of', 'for', 'in',
]);

function coreName(value) {
  const base = normalize(value);
  if (!base) return '';
  return base.split(' ').filter((t) => t && !ORG_STOPWORDS.has(t)).join(' ').trim();
}

function tokenOverlap(a, b) {
  const aT = new Set(normalize(a).split(' ').filter(Boolean));
  const bT = new Set(normalize(b).split(' ').filter(Boolean));
  if (aT.size === 0 || bT.size === 0) return 0;
  let inter = 0;
  for (const t of aT) if (bT.has(t)) inter++;
  return inter / Math.max(aT.size, bT.size);
}

// ── Main ────────────────────────────────────────────────────

console.log('\n🔗 ALMA ↔ Justice Funding via ACNC ABN Bridge');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}\n`);

async function main() {
  // ── Phase 1: Enrich ALMA orgs missing ABNs via ACNC name matching ──
  console.log('Phase 1: Match ALMA orgs (no ABN) → ACNC charities by name');
  console.log('─'.repeat(50));

  // Get ALMA org IDs (increase limit to get all)
  const { data: almaOrgIdData } = await supabase
    .from('alma_interventions')
    .select('operating_organization_id')
    .not('operating_organization_id', 'is', null)
    .limit(5000);
  const uniqueAlmaOrgIds = [...new Set((almaOrgIdData || []).map(r => r.operating_organization_id))];
  console.log(`  ALMA org IDs found: ${uniqueAlmaOrgIds.length}`);

  // Fetch in batches of 100 to avoid URL length limits
  let almaOrgsNoAbn = [];
  for (let i = 0; i < uniqueAlmaOrgIds.length; i += 100) {
    const batch = uniqueAlmaOrgIds.slice(i, i + 100);
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn')
      .is('abn', null)
      .in('id', batch);
    if (data) almaOrgsNoAbn.push(...data);
  }

  // Load ACNC charities with justice-relevant purposes (paginate to get all)
  let acncCharities = [];
  let acncOffset = 0;
  const ACNC_PAGE = 1000;
  while (true) {
    const { data: page } = await supabase
      .from('acnc_charities')
      .select('abn, name')
      .or('purpose_law_policy.eq.true,purpose_reconciliation.eq.true,purpose_social_welfare.eq.true,ben_aboriginal_tsi.eq.true,ben_youth.eq.true,ben_pre_post_release.eq.true,ben_victims_of_crime.eq.true')
      .range(acncOffset, acncOffset + ACNC_PAGE - 1);
    if (!page || page.length === 0) break;
    acncCharities.push(...page);
    if (page.length < ACNC_PAGE) break;
    acncOffset += ACNC_PAGE;
  }

  console.log(`  ALMA orgs without ABN: ${almaOrgsNoAbn?.length || 0}`);
  console.log(`  Justice-relevant ACNC charities: ${acncCharities?.length || 0}`);

  // Build ACNC search index
  const acncIndex = (acncCharities || []).map(c => ({
    charity: c,
    norm: normalize(c.name),
    core: coreName(c.name),
  }));
  const acncExactMap = new Map();
  for (const entry of acncIndex) {
    for (const key of [entry.norm, entry.core]) {
      if (!key) continue;
      if (!acncExactMap.has(key)) acncExactMap.set(key, []);
      acncExactMap.get(key).push(entry.charity);
    }
  }

  let phase1Matched = 0;
  let phase1Applied = 0;

  for (const org of almaOrgsNoAbn || []) {
    const normName = normalize(org.name);
    const coreN = coreName(org.name);

    // Tier 1: Exact match
    let match = null;
    const exactHits = new Set();
    for (const key of [normName, coreN]) {
      for (const c of acncExactMap.get(key) || []) exactHits.add(c);
    }
    if (exactHits.size === 1) {
      match = [...exactHits][0];
    }

    // Tier 2: Token overlap ≥ 0.7
    if (!match) {
      let bestScore = 0;
      let bestMatch = null;
      let bestCount = 0;
      for (const entry of acncIndex) {
        const score = tokenOverlap(org.name, entry.charity.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry.charity;
          bestCount = 1;
        } else if (score === bestScore && bestScore > 0) {
          bestCount++;
        }
      }
      if (bestScore >= 0.7 && bestCount === 1) {
        match = bestMatch;
      }
    }

    if (match) {
      phase1Matched++;
      console.log(`  ✓ ${org.name} → ABN ${match.abn} (${match.name})`);
      if (applyMode) {
        const { error } = await supabase
          .from('organizations')
          .update({ abn: match.abn })
          .eq('id', org.id);
        if (!error) phase1Applied++;
        else console.log(`    ⚠️ Update failed: ${error.message}`);
      }
    }
  }

  console.log(`\n  Phase 1 result: ${phase1Matched} matches${applyMode ? `, ${phase1Applied} ABNs applied` : ' (dry run)'}\n`);

  // ── Phase 2: Link justice_funding records by ALMA org ABN (with name verification) ──
  console.log('Phase 2: Link justice_funding by ABN → ALMA orgs (name-verified)');
  console.log('─'.repeat(50));

  // Reload orgs with ABNs (including newly added ones) — batch to avoid URL limits
  let almaOrgsWithAbn = [];
  for (let i = 0; i < uniqueAlmaOrgIds.length; i += 100) {
    const batch = uniqueAlmaOrgIds.slice(i, i + 100);
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn')
      .not('abn', 'is', null)
      .in('id', batch);
    if (data) almaOrgsWithAbn.push(...data);
  }

  console.log(`  ALMA orgs with ABN: ${almaOrgsWithAbn?.length || 0}`);

  // Known abbreviation map for parent orgs with many sub-programs sharing one ABN
  const ABBREV_MAP = {
    'mercy community': ['MCS', 'mercy'],
    'life without barriers': ['LWB'],
    'anglicare southern queensland': ['ASQ', 'anglicare'],
    'australian red cross': ['ARC', 'red cross'],
    'act for kids': ['act for kids', 'act 4 kids'],
    'save the children australia': ['save the children'],
    'churches of christ': ['CCQ', 'CCC', 'churches of christ'],
    'salvation army': ['salvation', 'salvo'],
    'unitingcare': ['UCC', 'UCQ', 'unitingcare'],
    'st vincent de paul': ['SVDP', 'SVdeP', 'vincent de paul'],
    'south burnett ctc': ['south burnett ctc', 'SBCTC'],
    'mission australia': ['mission australia'],
    'centacare': ['centacare'],
    'pcyc': ['PCYC'],
  };

  function nameMatchesOrg(recipientName, orgName) {
    const rn = recipientName.toLowerCase();
    const on = orgName.toLowerCase();
    // Exact or substring match
    if (rn === on) return true;
    if (rn.includes(on) || on.includes(rn)) return true;
    // First significant word match
    const firstWord = on.split(' ')[0];
    if (firstWord.length >= 4 && rn.includes(firstWord)) return true;
    const firstRecipWord = rn.split(/[\s\-]+/)[0];
    if (firstRecipWord.length >= 4 && on.includes(firstRecipWord)) return true;
    // Abbreviation match
    for (const [key, abbrevs] of Object.entries(ABBREV_MAP)) {
      if (on.includes(key)) {
        if (abbrevs.some(a => rn.toLowerCase().includes(a.toLowerCase()))) return true;
      }
    }
    return false;
  }

  let phase2Linked = 0;
  let phase2Skipped = 0;

  for (const org of almaOrgsWithAbn || []) {
    // Get unlinked funding records with this ABN
    const { data: unlinkedRows } = await supabase
      .from('justice_funding')
      .select('id, recipient_name')
      .eq('recipient_abn', org.abn)
      .is('alma_organization_id', null)
      .limit(1000);

    if (!unlinkedRows || unlinkedRows.length === 0) continue;

    // Only link records whose recipient_name matches the ALMA org name
    const matchingIds = unlinkedRows
      .filter(r => r.recipient_name && nameMatchesOrg(r.recipient_name, org.name))
      .map(r => r.id);

    const skipped = unlinkedRows.length - matchingIds.length;
    if (skipped > 0) phase2Skipped += skipped;

    if (matchingIds.length > 0) {
      console.log(`  ✓ ${org.name} (ABN ${org.abn}): ${matchingIds.length} matched, ${skipped} skipped`);
      if (applyMode) {
        // Batch update in chunks of 100
        for (let i = 0; i < matchingIds.length; i += 100) {
          const batch = matchingIds.slice(i, i + 100);
          const { error } = await supabase
            .from('justice_funding')
            .update({ alma_organization_id: org.id })
            .in('id', batch);
          if (error) console.log(`    ⚠️ Update failed: ${error.message}`);
        }
        phase2Linked += matchingIds.length;
      } else {
        phase2Linked += matchingIds.length;
      }
    } else if (skipped > 0) {
      console.log(`  ⊘ ${org.name} (ABN ${org.abn}): 0 matched, ${skipped} skipped (name mismatch)`);
    }
  }

  console.log(`\n  Phase 2 result: ${phase2Linked} records linked, ${phase2Skipped} skipped (name mismatch)${!applyMode ? ' (dry run)' : ''}\n`);

  // ── Phase 3: Fuzzy match unlinked recipient_name → ALMA org names ──
  console.log('Phase 3: Fuzzy match unlinked recipient_name → ALMA orgs');
  console.log('─'.repeat(50));

  // Build ALMA org index
  let allAlmaOrgs = [];
  for (let i = 0; i < uniqueAlmaOrgIds.length; i += 100) {
    const batch = uniqueAlmaOrgIds.slice(i, i + 100);
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn')
      .in('id', batch);
    if (data) allAlmaOrgs.push(...data);
  }

  const almaIndex = (allAlmaOrgs || []).map(o => ({
    org: o,
    norm: normalize(o.name),
    core: coreName(o.name),
  }));
  const almaExactMap = new Map();
  for (const entry of almaIndex) {
    for (const key of [entry.norm, entry.core]) {
      if (!key) continue;
      if (!almaExactMap.has(key)) almaExactMap.set(key, []);
      almaExactMap.get(key).push(entry.org);
    }
  }

  // Get distinct unlinked recipient names
  const { data: unlinkedRecipients } = await supabase
    .from('justice_funding')
    .select('recipient_name')
    .is('alma_organization_id', null)
    .not('recipient_name', 'is', null)
    .limit(5000);

  const uniqueNames = [...new Set((unlinkedRecipients || []).map(r => r.recipient_name))];
  console.log(`  Unique unlinked recipient names: ${uniqueNames.length}`);

  let phase3Matched = 0;
  let phase3Records = 0;

  for (const recipientName of uniqueNames) {
    const normName = normalize(recipientName);
    const coreN = coreName(recipientName);

    // Tier 1: Exact match
    let match = null;
    const exactHits = new Set();
    for (const key of [normName, coreN]) {
      for (const org of almaExactMap.get(key) || []) exactHits.add(org);
    }
    if (exactHits.size === 1) {
      match = [...exactHits][0];
    }

    // Tier 2: Name containment (ALMA name in recipient or vice versa, min 10 chars)
    if (!match) {
      for (const entry of almaIndex) {
        if (entry.org.name.length < 10) continue;
        if (normalize(recipientName).includes(entry.norm) || entry.norm.includes(normalize(recipientName))) {
          match = entry.org;
          break;
        }
      }
    }

    // Tier 3: Token overlap ≥ 0.85 (very strict for funding linkage)
    if (!match) {
      let bestScore = 0;
      let bestMatch = null;
      let bestCount = 0;
      for (const entry of almaIndex) {
        const score = tokenOverlap(recipientName, entry.org.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry.org;
          bestCount = 1;
        } else if (score === bestScore && bestScore > 0) {
          bestCount++;
        }
      }
      if (bestScore >= 0.85 && bestCount === 1) {
        match = bestMatch;
      }
    }

    if (match) {
      phase3Matched++;
      // Count records for this recipient
      const { count } = await supabase
        .from('justice_funding')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_name', recipientName)
        .is('alma_organization_id', null);

      const recordCount = count || 0;
      phase3Records += recordCount;
      console.log(`  ✓ "${recipientName}" → ${match.name} (${recordCount} records)`);

      if (applyMode && recordCount > 0) {
        const { error } = await supabase
          .from('justice_funding')
          .update({ alma_organization_id: match.id })
          .eq('recipient_name', recipientName)
          .is('alma_organization_id', null);
        if (error) console.log(`    ⚠️ Update failed: ${error.message}`);
      }
    }
  }

  console.log(`\n  Phase 3 result: ${phase3Matched} name matches, ${phase3Records} records${applyMode ? ' linked' : ' would be linked (dry run)'}\n`);

  // ── Summary ──
  console.log('═'.repeat(60));
  console.log('Summary:');
  console.log(`  Phase 1 (ABN enrichment): ${phase1Matched} ALMA orgs gained ABNs`);
  console.log(`  Phase 2 (ABN linkage):    ${phase2Linked} funding records linked`);
  console.log(`  Phase 3 (fuzzy match):    ${phase3Records} funding records linked`);
  console.log(`  Total new links:          ${phase2Linked + phase3Records} records`);
  if (!applyMode) console.log('\n  DRY RUN — use --apply to write changes');

  // Show final stats
  const { data: finalStats } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('alma_organization_id', 'is', null);
  console.log(`\n  Current linked records: ${finalStats || 'unknown'}`);
}

main().catch(console.error);

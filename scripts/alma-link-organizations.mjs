#!/usr/bin/env node
/**
 * ALMA Organization Linking
 *
 * Links alma_interventions.operating_organization (text) →
 * alma_interventions.operating_organization_id (FK to organizations.id)
 *
 * 4-tier fuzzy matching:
 *   1. Exact normalized match
 *   2. Core name match (stopwords removed)
 *   3. Substring containment (either direction)
 *   4. Token overlap (Jaccard ≥ 0.6)
 *
 * Usage:
 *   node scripts/alma-link-organizations.mjs           # dry-run
 *   node scripts/alma-link-organizations.mjs --apply    # write to DB
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
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...values] = line.split('=');
          const trimmedKey = key.trim();
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');

// ---------------------------------------------------------------------------
// Matching utilities (from link-programs-to-alma.ts)
// ---------------------------------------------------------------------------

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
  'australia', 'australian',
]);

function coreName(value) {
  const base = normalize(value);
  if (!base) return '';
  return base.split(' ').filter((t) => t && !ORG_STOPWORDS.has(t)).join(' ').trim();
}

function containsEither(a, b) {
  if (!a || !b || a.length < 4 || b.length < 4) return false;
  return a.includes(b) || b.includes(a);
}

function tokenOverlap(a, b) {
  const aT = new Set(normalize(a).split(' ').filter(Boolean));
  const bT = new Set(normalize(b).split(' ').filter(Boolean));
  if (aT.size === 0 || bT.size === 0) return 0;
  let inter = 0;
  for (const t of aT) if (bT.has(t)) inter++;
  return inter / Math.max(aT.size, bT.size);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('\n🔗 ALMA Organization Linking');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}\n`);

async function main() {
  // Load all organizations
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, slug');
  if (orgErr) throw orgErr;
  console.log(`Organizations loaded: ${orgs.length}`);

  // Build search index
  const orgIndex = orgs.map((org) => ({
    org,
    full: normalize(org.name),
    core: coreName(org.name),
    slug: normalize(org.slug || ''),
    coreSlug: coreName(org.slug || ''),
  }));

  // Build exact-match map: normalized name → org(s)
  const exactMap = new Map();
  for (const entry of orgIndex) {
    for (const alias of [entry.full, entry.core, entry.slug, entry.coreSlug]) {
      if (!alias) continue;
      if (!exactMap.has(alias)) exactMap.set(alias, []);
      exactMap.get(alias).push(entry.org);
    }
  }

  // Load interventions needing org linking
  const { data: interventions, error: intErr } = await supabase
    .from('alma_interventions')
    .select('id, name, operating_organization, operating_organization_id')
    .not('operating_organization', 'is', null);
  if (intErr) throw intErr;

  const needsLinking = interventions.filter((i) => !i.operating_organization_id);
  const alreadyLinked = interventions.length - needsLinking.length;
  console.log(`Interventions with operating_organization text: ${interventions.length}`);
  console.log(`Already linked: ${alreadyLinked}`);
  console.log(`Needs linking: ${needsLinking.length}\n`);

  const results = { tier1: [], tier2: [], tier3: [], tier4: [], ambiguous: [], unmatched: [] };

  for (const intervention of needsLinking) {
    const orgText = intervention.operating_organization;
    const normFull = normalize(orgText);
    const normCore = coreName(orgText);

    // Tier 1: Exact normalized match
    const exactHits = new Map();
    for (const alias of [normFull, normCore]) {
      for (const org of exactMap.get(alias) || []) {
        exactHits.set(org.id, org);
      }
    }

    if (exactHits.size === 1) {
      const org = [...exactHits.values()][0];
      results.tier1.push({ intervention, org, confidence: 1.0 });
      continue;
    }

    // Tier 2: Core name match (after removing more stopwords)
    const coreMatches = orgIndex.filter(
      (e) => e.core && normCore && e.core === normCore
    );
    const uniqueCore = new Map(coreMatches.map((m) => [m.org.id, m.org]));
    if (uniqueCore.size === 1) {
      const org = [...uniqueCore.values()][0];
      results.tier2.push({ intervention, org, confidence: 0.95 });
      continue;
    }

    // Tier 3: Substring containment
    const substringMatches = orgIndex.filter(
      (e) =>
        containsEither(normFull, e.full) ||
        containsEither(normFull, e.slug) ||
        containsEither(normCore, e.core) ||
        containsEither(normCore, e.coreSlug)
    );
    const uniqueSubstring = new Map(substringMatches.map((m) => [m.org.id, m.org]));
    if (uniqueSubstring.size === 1) {
      const org = [...uniqueSubstring.values()][0];
      results.tier3.push({ intervention, org, confidence: 0.90 });
      continue;
    }

    // Tier 4: Token overlap (Jaccard ≥ 0.6)
    let bestOverlap = null;
    let bestScore = 0;
    for (const entry of orgIndex) {
      const score = Math.max(
        tokenOverlap(normCore, entry.core),
        tokenOverlap(normCore, entry.coreSlug)
      );
      if (score >= 0.6 && score > bestScore) {
        bestScore = score;
        bestOverlap = entry.org;
      }
    }

    if (bestOverlap) {
      results.tier4.push({ intervention, org: bestOverlap, confidence: bestScore });
      continue;
    }

    // Check for ambiguous (multiple matches across tiers)
    if (exactHits.size > 1 || uniqueCore.size > 1 || uniqueSubstring.size > 1) {
      const candidates = [...(exactHits.size > 1 ? exactHits.values() : uniqueCore.size > 1 ? uniqueCore.values() : uniqueSubstring.values())];
      results.ambiguous.push({
        intervention,
        candidates: candidates.map((c) => c.name).slice(0, 5),
      });
    } else {
      results.unmatched.push({ id: intervention.id, orgText });
    }
  }

  // Report
  const autoLink = [...results.tier1, ...results.tier2, ...results.tier3, ...results.tier4];
  console.log('Match results:');
  console.log(`  Tier 1 (exact):      ${results.tier1.length}`);
  console.log(`  Tier 2 (core name):  ${results.tier2.length}`);
  console.log(`  Tier 3 (substring):  ${results.tier3.length}`);
  console.log(`  Tier 4 (token ≥0.6): ${results.tier4.length}`);
  console.log(`  Total auto-link:     ${autoLink.length}`);
  console.log(`  Ambiguous:           ${results.ambiguous.length}`);
  console.log(`  Unmatched:           ${results.unmatched.length}`);

  // Apply
  if (applyMode && autoLink.length > 0) {
    console.log(`\nApplying ${autoLink.length} links...`);
    let applied = 0;
    let errors = 0;

    for (const match of autoLink) {
      const { error } = await supabase
        .from('alma_interventions')
        .update({ operating_organization_id: match.org.id })
        .eq('id', match.intervention.id);

      if (error) {
        console.error(`  ✗ ${match.intervention.name}: ${error.message}`);
        errors++;
      } else {
        applied++;
      }
    }

    console.log(`\n✅ Applied: ${applied}, Errors: ${errors}`);
  } else if (!applyMode && autoLink.length > 0) {
    console.log('\nSample matches:');
    for (const match of autoLink.slice(0, 10)) {
      console.log(`  "${match.intervention.operating_organization}" → "${match.org.name}" (${match.confidence.toFixed(2)})`);
    }
    console.log('\nRun with --apply to write changes.');
  }

  if (results.ambiguous.length > 0) {
    console.log('\nAmbiguous (manual review needed):');
    for (const a of results.ambiguous.slice(0, 10)) {
      console.log(`  "${a.intervention.operating_organization}" → [${a.candidates.join(', ')}]`);
    }
  }

  if (results.unmatched.length > 0) {
    console.log(`\nUnmatched orgs (${results.unmatched.length} total, showing first 15):`);
    for (const u of results.unmatched.slice(0, 15)) {
      console.log(`  "${u.orgText}"`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});

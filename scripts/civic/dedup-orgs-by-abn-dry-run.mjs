#!/usr/bin/env node
/**
 * ABN-based organization dedup — DRY RUN ONLY.
 *
 * For each ABN with > 1 active (archived=false) organizations row, this
 * script picks a canonical row and prints what WOULD be migrated and
 * what WOULD be archived. It writes nothing. There is no --apply path in
 * v1 by design.
 *
 * Design doc: docs/civic-connectors/abn-dedup-plan.md
 *
 * Usage:
 *   node scripts/civic/dedup-orgs-by-abn-dry-run.mjs
 *     # scan all duplicate ABN groups, print summary stats
 *
 *   node scripts/civic/dedup-orgs-by-abn-dry-run.mjs --abn=11746358763
 *     # focus on one ABN; show full per-row breakdown
 *
 *   node scripts/civic/dedup-orgs-by-abn-dry-run.mjs --sample=5
 *     # print 5 random same-name groups in detail
 *
 *   node scripts/civic/dedup-orgs-by-abn-dry-run.mjs --mixed
 *     # show mixed-name groups that would be flagged (not merged)
 *
 * Categories handled:
 *   - same-name groups: scored, canonical pick proposed, FK migration plan generated
 *   - mixed-name groups: flagged FLAG_FOR_REVIEW, no merge proposal
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8').split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// CLI args
const args = process.argv.slice(2);
const abnArg = args.find((a) => a.startsWith('--abn='))?.split('=')[1];
const sampleArg = args.find((a) => a.startsWith('--sample='))?.split('=')[1];
const showMixed = args.includes('--mixed');
const sampleN = sampleArg ? parseInt(sampleArg, 10) : 0;

// Hardcoded safety: no --apply flag exists in v1.
if (args.includes('--apply')) {
  console.error('ERROR: --apply is not implemented in v1. This is a dry-run-only script.');
  console.error('See docs/civic-connectors/abn-dedup-plan.md for the phased rollout plan.');
  process.exit(1);
}

// =============================================================================
// FK MIGRATION MAP
// Tables that have a UUID FK to organizations.id, with the column name and any
// special handling. Probed against the live DB on 2026-05-23.
// =============================================================================
const FK_TABLES = [
  { table: 'alma_interventions',         col: 'operating_organization_id', strategy: 'update' },
  { table: 'civic_org_classifications',  col: 'organization_id',           strategy: 'merge_unique' },
  { table: 'organization_claims',        col: 'organization_id',           strategy: 'update' },
  { table: 'organizations_profiles',     col: 'organization_id',           strategy: 'merge_unique' },
  { table: 'partner_photos',             col: 'organization_id',           strategy: 'update' },
  { table: 'partner_videos',             col: 'organization_id',           strategy: 'update' },
  { table: 'stories',                    col: 'organization_id',           strategy: 'update' },
  { table: 'projects',                   col: 'organization_id',           strategy: 'update' },
  { table: 'organization_members',       col: 'organization_id',           strategy: 'update' },
  { table: 'org_grants',                 col: 'organization_id',           strategy: 'update' },
];

// Array-column FKs need a different rewrite path (UPDATE ... SET col = array_replace(col, dup, canonical))
const ARRAY_FK_TABLES = [
  { table: 'media_items', col: 'organization_ids' },
];

// Tables known to reference orgs by TEXT/ABN, not UUID FK — must NOT be touched.
const NON_FK_ABN_JOIN = [
  { table: 'justice_funding',  joinKey: 'abn' },
  { table: 'alma_evidence',    joinKey: 'organization (text)' },
];

// =============================================================================
// FETCH ALL ABN GROUPS
// =============================================================================
async function fetchAllOrgs() {
  const all = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, abn, name, slug, type, state, created_at, updated_at, profile_completeness_score, logo_url, email, history_summary, last_synced_at, verification_status, archived, is_indigenous_org')
      .not('abn', 'is', null)
      .neq('abn', '')
      .eq('archived', false)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`fetchAllOrgs: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
    if (from > 200000) throw new Error('pagination guard: > 200k rows');
  }
  return all;
}

function normalizeName(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function normalizeAbn(s) {
  return (s || '').replace(/\s+/g, '');
}

// =============================================================================
// CANONICAL PICK
// Score each row; highest wins. Deterministic on a given snapshot.
// =============================================================================
async function scoreRow(row) {
  // Cheap checks first
  let score = 0;
  if (row.logo_url) score += 100;
  if (row.email) score += 50;
  if (row.history_summary) score += 30;
  if (row.last_synced_at) score += 20;
  score += Math.round((row.profile_completeness_score || 0) * 10);

  // Expensive checks — count FK rows for human-edit signals
  const { count: claimCount } = await supabase
    .from('organization_claims')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', row.id);
  if (claimCount && claimCount > 0) score += 1000;

  const { count: classCount } = await supabase
    .from('civic_org_classifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', row.id);
  if (classCount && classCount > 0) score += 500;

  return { score, claimCount: claimCount || 0, classCount: classCount || 0 };
}

function olderThan(a, b) {
  return new Date(a.created_at).getTime() < new Date(b.created_at).getTime();
}

async function pickCanonical(rows) {
  const scored = [];
  for (const r of rows) {
    const s = await scoreRow(r);
    scored.push({ row: r, ...s });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // tiebreak: oldest created_at wins (the original record)
    return olderThan(a.row, b.row) ? -1 : 1;
  });
  return { canonical: scored[0], all: scored };
}

// =============================================================================
// FK MIGRATION COUNT
// For each dup row, count what would move.
// =============================================================================
async function countFkRows(orgId) {
  const result = {};
  for (const { table, col } of FK_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(col, orgId);
    if (error) {
      result[table] = `ERR(${error.message.slice(0, 40)})`;
    } else {
      result[table] = count || 0;
    }
  }
  // Array FK probe: media_items.organization_ids contains orgId
  for (const { table, col } of ARRAY_FK_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .contains(col, [orgId]);
    if (error) {
      result[`${table}(array)`] = `ERR(${error.message.slice(0, 40)})`;
    } else {
      result[`${table}(array)`] = count || 0;
    }
  }
  return result;
}

function summarizeFkCounts(c) {
  const nonzero = Object.entries(c).filter(([_, n]) => typeof n === 'number' && n > 0);
  if (nonzero.length === 0) return '(no FK rows)';
  return nonzero.map(([t, n]) => `${t}=${n}`).join(', ');
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  console.log(`ABN dedup · DRY RUN ONLY · ${new Date().toISOString()}`);
  console.log(`Reading organizations (archived=false, abn IS NOT NULL)...`);

  const allOrgs = await fetchAllOrgs();
  console.log(`  ${allOrgs.length} active rows with ABN\n`);

  // Group by normalized ABN
  const byAbn = {};
  for (const r of allOrgs) {
    const abn = normalizeAbn(r.abn);
    if (!abn) continue;
    byAbn[abn] = byAbn[abn] || [];
    byAbn[abn].push(r);
  }

  // Filter to dup groups, classify same-name vs mixed-name
  const dupAbns = Object.entries(byAbn).filter(([_, g]) => g.length > 1);
  const sameName = [];
  const mixedName = [];
  for (const [abn, group] of dupAbns) {
    const sig = new Set(group.map((r) => normalizeName(r.name)));
    if (sig.size === 1) sameName.push([abn, group]);
    else mixedName.push([abn, group]);
  }

  console.log(`=== SUMMARY ===`);
  console.log(`Total ABN groups with > 1 active row: ${dupAbns.length}`);
  console.log(`  Same-name (merge candidates):       ${sameName.length}`);
  console.log(`  Mixed-name (FLAG_FOR_REVIEW):       ${mixedName.length}`);
  const sameNameDupRows = sameName.reduce((s, [_, g]) => s + g.length - 1, 0);
  const mixedNameRows = mixedName.reduce((s, [_, g]) => s + g.length, 0);
  console.log(`  Rows that would archive (same-name): ${sameNameDupRows}`);
  console.log(`  Rows held under mixed-name umbrellas: ${mixedNameRows}`);

  // Branch on CLI mode
  if (abnArg) {
    const abn = normalizeAbn(abnArg);
    const group = byAbn[abn] || [];
    if (group.length === 0) {
      console.log(`\nABN ${abn} not found in active rows.`);
      const { data: archivedHit } = await supabase
        .from('organizations')
        .select('id, name, archived')
        .eq('abn', abn);
      console.log(`  Total rows in DB with this ABN (any archived state): ${(archivedHit || []).length}`);
      return;
    }
    const sig = new Set(group.map((r) => normalizeName(r.name)));
    const category = sig.size === 1 ? 'same-name' : (group.length === 1 ? 'singleton' : 'mixed-name');
    console.log(`\n=== ABN ${abn} (${group.length} active rows) · category=${category} ===`);
    if (category === 'mixed-name') {
      console.log(`Distinct name signatures: ${sig.size}`);
      console.log(`Rows:`);
      for (const r of group) {
        console.log(`  ${r.id.slice(0, 8)} · "${r.name}" · ${r.state} · score=${r.profile_completeness_score} · logo=${r.logo_url ? 'Y' : 'N'} · type=${r.type}`);
      }
      console.log(`\n→ ACTION: FLAG_FOR_REVIEW`);
      console.log(`   This ABN holds multiple distinctly-named programs/services.`);
      console.log(`   The script will NOT propose a merge. A human reviewer (or Phase 3 admin UI)`);
      console.log(`   must decide if these are genuinely separate programs (e.g. PCYC branches)`);
      console.log(`   or if some are stale variants that should be merged into one.`);
      console.log(`\n(would write 0 rows — this is a dry run)`);
      return;
    }
    await renderGroup(abn, group);
    return;
  }

  if (showMixed) {
    console.log(`\n=== MIXED-NAME GROUPS (FLAG_FOR_REVIEW — top 10) ===`);
    const sorted = mixedName.sort((a, b) => b[1].length - a[1].length).slice(0, 10);
    for (const [abn, group] of sorted) {
      console.log(`\nABN ${abn} (${group.length} rows):`);
      for (const r of group) {
        console.log(`  ${r.id.slice(0, 8)} · "${r.name}" · ${r.state} · score=${r.profile_completeness_score}`);
      }
      console.log(`  → ACTION: FLAG_FOR_REVIEW (do not auto-merge; programs under shared parent ABN)`);
    }
    return;
  }

  if (sampleN > 0) {
    console.log(`\n=== ${sampleN} sample same-name groups ===`);
    // Pick groups with the most rows first so the dry-run shows work
    const sorted = sameName.sort((a, b) => b[1].length - a[1].length).slice(0, sampleN);
    for (const [abn, group] of sorted) {
      console.log(`\n--- ABN ${abn} ---`);
      await renderGroup(abn, group);
    }
    return;
  }

  // Default: print top 5 same-name + top 3 mixed-name as a teaser
  console.log(`\n=== TOP 5 SAME-NAME GROUPS (merge candidates) ===`);
  const topSame = sameName.sort((a, b) => b[1].length - a[1].length).slice(0, 5);
  for (const [abn, group] of topSame) {
    console.log(`\n--- ABN ${abn} (${group.length} rows) ---`);
    await renderGroup(abn, group);
  }

  console.log(`\n=== TOP 3 MIXED-NAME GROUPS (flagged, NOT merged) ===`);
  const topMixed = mixedName.sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  for (const [abn, group] of topMixed) {
    console.log(`\nABN ${abn} (${group.length} rows):`);
    for (const r of group) {
      console.log(`  ${r.id.slice(0, 8)} · "${r.name}"`);
    }
    console.log(`  → FLAG_FOR_REVIEW`);
  }

  console.log(`\n=== NEXT STEPS ===`);
  console.log(`  · Inspect a single ABN: --abn=<11-digit>`);
  console.log(`  · See N sample groups in detail: --sample=10`);
  console.log(`  · Review mixed-name (parent-ABN) groups: --mixed`);
  console.log(`  · No --apply path exists. See docs/civic-connectors/abn-dedup-plan.md for Phase 2.`);
}

async function renderGroup(abn, group) {
  const { canonical, all } = await pickCanonical(group);
  console.log(`Canonical pick: ${canonical.row.id.slice(0, 8)} · "${canonical.row.name}"`);
  console.log(`  score=${canonical.score} (claims=${canonical.claimCount} classifications=${canonical.classCount})`);
  console.log(`\nAll rows:`);
  for (const s of all) {
    const tag = s.row.id === canonical.row.id ? '[CANONICAL]' : '[ARCHIVE]';
    console.log(`  ${tag} ${s.row.id.slice(0, 8)} score=${s.score}`);
    console.log(`     name="${s.row.name}" · score=${s.row.profile_completeness_score} · logo=${s.row.logo_url ? 'Y' : 'N'} · email=${s.row.email ? 'Y' : 'N'}`);
  }

  console.log(`\nFK migration plan (rows that would move from each dup → canonical):`);
  for (const s of all) {
    if (s.row.id === canonical.row.id) continue;
    const counts = await countFkRows(s.row.id);
    console.log(`  from ${s.row.id.slice(0, 8)}: ${summarizeFkCounts(counts)}`);
  }

  console.log(`\nArchive plan (per non-canonical row):`);
  for (const s of all) {
    if (s.row.id === canonical.row.id) continue;
    console.log(`  ${s.row.id.slice(0, 8)}: SET archived=true, verification_status='merged_duplicate',`);
    console.log(`     slug='${s.row.slug}-archived-<uuid8>',`);
    console.log(`     acnc_data.merge_meta={merged_into:${canonical.row.id.slice(0, 8)}..., merged_at:NOW(), merge_reason:'abn_dedup'}`);
  }

  console.log(`\n(would write 0 rows — this is a dry run)`);
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});

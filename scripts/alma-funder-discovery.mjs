#!/usr/bin/env node
/**
 * ALMA funder discovery — cross-reference annual-report funder mentions
 * against the organizations table to surface concrete funder→funded
 * relationships without admin doing data entry.
 *
 * Reads organizations.acnc_data.annual_report_facts.funders[] (populated
 * by alma-extract-annual-reports.mjs), fuzzy-matches each name against
 * the organizations table, and writes the result back into
 * acnc_data.discovered_funder_mentions for the admin UI to surface.
 *
 * Doesn't write to justice_funding directly — that table holds
 * datasets with verified $$ amounts. Funder mentions become hints for
 * admin to confirm + promote when they have a dollar amount.
 *
 * Usage:
 *   node scripts/alma-funder-discovery.mjs           # dry-run, 20 orgs
 *   node scripts/alma-funder-discovery.mjs --apply   # write mentions back
 *   node scripts/alma-funder-discovery.mjs --apply --batch 100
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

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '20', 10);

// Normalise an org name for comparison: lowercase, strip incorporated/Pty
// suffixes, strip punctuation, collapse whitespace.
function normaliseName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .replace(/\b(pty\s*ltd|limited|inc(orporated)?|ltd|the|foundation)\b/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lightweight similarity check — for AU community orgs, a normalised
// substring match is usually enough. We avoid Levenshtein because it
// over-matches common words like "council" and "centre".
function nameMatches(funderName, orgName) {
  const a = normaliseName(funderName);
  const b = normaliseName(orgName);
  if (!a || !b) return false;
  if (a === b) return { score: 1.0, kind: 'exact' };
  // Funder name fully contained in org name (e.g. "Westpac" in "Westpac
  // Banking Corporation") or vice-versa
  if (a.length >= 6 && b.includes(a)) return { score: 0.9, kind: 'funder_in_org' };
  if (b.length >= 6 && a.includes(b)) return { score: 0.9, kind: 'org_in_funder' };
  // Token overlap — when 80% of the longer name's words appear in the shorter
  const aTok = new Set(a.split(' ').filter((w) => w.length > 2));
  const bTok = new Set(b.split(' ').filter((w) => w.length > 2));
  if (aTok.size === 0 || bTok.size === 0) return false;
  const overlap = [...aTok].filter((t) => bTok.has(t)).length;
  const ratio = overlap / Math.min(aTok.size, bTok.size);
  if (ratio >= 0.8 && overlap >= 2) return { score: 0.75, kind: 'token_overlap' };
  return false;
}

async function buildFunderIndex() {
  // Pull every active org's name + id. ~98K rows. We need this in memory
  // for the per-funder name lookup to avoid 5K+ DB queries per batch.
  console.log('Building funder name index…');
  const index = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .neq('archived', true)
      .range(from, from + 999);
    if (error) {
      console.error('Index fetch failed:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    for (const o of data) {
      index.push({ id: o.id, name: o.name, slug: o.slug, normalised: normaliseName(o.name) });
    }
    if (data.length < 1000) break;
  }
  console.log(`  ${index.length} orgs indexed.\n`);
  return index;
}

function findMatches(funderName, index) {
  // Cheap pre-filter to avoid scanning 98K rows per funder name.
  const norm = normaliseName(funderName);
  if (!norm || norm.length < 4) return [];
  const matches = [];
  for (const o of index) {
    if (o.normalised.length < 3) continue;
    // Quick reject: do any tokens overlap at all?
    const oTokens = o.normalised.split(' ');
    const fTokens = norm.split(' ');
    if (!fTokens.some((t) => t.length > 3 && oTokens.includes(t))) continue;
    const m = nameMatches(funderName, o.name);
    if (m) matches.push({ ...o, ...m });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

async function main() {
  console.log(`ALMA funder discovery · ${apply ? 'APPLY' : 'DRY-RUN'} · batch=${batchSize}\n`);

  // Eligibility: org has annual_report_facts.funders and hasn't been
  // processed yet (discovered_funder_mentions absent).
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, acnc_data')
    .neq('archived', true)
    .not('acnc_data', 'is', null)
    .limit(batchSize * 5);

  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }

  const eligible = (orgs || [])
    .filter((o) => {
      const facts = o.acnc_data?.annual_report_facts;
      return facts?.funders && Array.isArray(facts.funders) && facts.funders.length > 0;
    })
    .filter((o) => !o.acnc_data?.discovered_funder_mentions)
    .slice(0, batchSize);

  if (eligible.length === 0) {
    console.log('Nothing to do — no orgs with funders[] awaiting discovery.');
    return;
  }

  console.log(`Processing ${eligible.length} orgs.\n`);

  const index = await buildFunderIndex();

  let matched = 0;
  let unmatched = 0;
  for (const org of eligible) {
    const funders = org.acnc_data.annual_report_facts.funders || [];
    console.log(`\n→ ${org.name} (${org.slug}) — ${funders.length} funders mentioned`);

    const mentions = funders.map((funder) => {
      const candidates = findMatches(funder, index);
      // Don't match an org to itself (the recipient is the org we're processing)
      const filtered = candidates.filter((c) => c.id !== org.id);
      return {
        name_in_report: funder,
        matched: filtered.length > 0 ? filtered : null,
        match_kind: filtered[0]?.kind || null,
        match_score: filtered[0]?.score || null,
      };
    });

    for (const m of mentions) {
      if (m.matched) {
        matched++;
        console.log(`  ✓ "${m.name_in_report}" → ${m.matched[0].slug} (${m.match_kind}, ${m.match_score})`);
      } else {
        unmatched++;
        console.log(`  · "${m.name_in_report}" — no match`);
      }
    }

    if (apply) {
      const newAcnc = {
        ...org.acnc_data,
        discovered_funder_mentions: {
          mentions,
          run_at: new Date().toISOString(),
          total: mentions.length,
          matched: mentions.filter((m) => m.matched).length,
        },
      };
      const { error: updErr } = await supabase
        .from('organizations')
        .update({ acnc_data: newAcnc })
        .eq('id', org.id);
      if (updErr) console.warn(`  ! DB update failed: ${updErr.message}`);
    }
  }

  console.log(`\n${matched} matched · ${unmatched} unmatched across ${eligible.length} orgs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

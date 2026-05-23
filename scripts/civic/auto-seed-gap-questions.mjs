#!/usr/bin/env node
/**
 * Programmatically detects gaps in the civic dataset and seeds them as
 * data_gap_questions where missing. Examples:
 *
 *  - State has < 3 oversight_recommendations → flag as gap
 *  - State has < 5 confirmed Tier 1 orgs → flag (likely undercounting)
 *  - Top foundation (by total grants) with 0 YJ-classified grants → flag
 *  - State with 0 alma_interventions catalogued → flag
 *
 * Idempotent — checks existing open gap questions before filing new ones.
 *
 * Usage: node scripts/civic/auto-seed-gap-questions.mjs [--apply]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const APPLY = process.argv.includes('--apply');
const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

async function existsOpen(question) {
  const { data } = await supabase
    .from('data_gap_questions')
    .select('id')
    .ilike('question', question.slice(0, 80) + '%')
    .in('status', ['open', 'investigating'])
    .maybeSingle();
  return !!data;
}

async function fileGap(question, topic, priority = 3, owner = 'agent:auto-seed') {
  if (await existsOpen(question)) {
    console.log(`  skip (exists): ${question.slice(0, 70)}...`);
    return false;
  }
  if (!APPLY) {
    console.log(`  WOULD FILE: ${question}`);
    return false;
  }
  await supabase.from('data_gap_questions').insert({
    question, topic, status: 'open', priority, owner,
  });
  console.log(`  filed: ${question}`);
  return true;
}

async function main() {
  let filed = 0;

  // 1) States with low oversight coverage
  console.log('\n[1] Oversight coverage by state...');
  const { data: oversight } = await supabase
    .from('oversight_recommendations')
    .select('jurisdiction');
  const oversightByState = new Map();
  for (const r of oversight || []) {
    if (!r.jurisdiction || r.jurisdiction === 'National') continue;
    oversightByState.set(r.jurisdiction, (oversightByState.get(r.jurisdiction) || 0) + 1);
  }
  for (const s of STATES) {
    const count = oversightByState.get(s) || 0;
    if (count < 3) {
      const q = `Low oversight coverage for ${s}: only ${count} recommendations indexed. Missing sources?`;
      if (await fileGap(q, 'oversight', 2)) filed++;
    }
  }

  // 2) Tier 1 coverage by state (states with <3 confirmed Tier 1 likely undercounted)
  console.log('\n[2] Tier 1 coverage by state...');
  const { data: classRows } = await supabase
    .from('civic_org_classifications')
    .select('organization_id')
    .eq('tier', 1)
    .not('confirmed_at', 'is', null);
  const tier1Ids = (classRows || []).map((c) => c.organization_id);
  if (tier1Ids.length > 0) {
    const tier1ByState = new Map();
    for (let i = 0; i < tier1Ids.length; i += 100) {
      const chunk = tier1Ids.slice(i, i + 100);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('state')
        .in('id', chunk);
      for (const o of orgs || []) {
        if (!o.state) continue;
        tier1ByState.set(o.state, (tier1ByState.get(o.state) || 0) + 1);
      }
    }
    for (const s of STATES) {
      const count = tier1ByState.get(s) || 0;
      if (count < 3) {
        const q = `Likely undercounting Tier 1 frontline YJ orgs in ${s}: only ${count} confirmed. Need to find more.`;
        if (await fileGap(q, 'orgs', 2)) filed++;
      }
    }
  }

  // 3) Top funders with 0 YJ-classified grants
  console.log('\n[3] Top funders with no YJ grants...');
  const { data: grants } = await supabase
    .from('foundation_grantees')
    .select('foundation_name, grant_amount, yj_relevant, yj_classified_at')
    .not('grant_amount', 'is', null)
    .limit(20000);
  const byFunder = new Map();
  for (const r of grants || []) {
    if (!r.foundation_name) continue;
    if (!byFunder.has(r.foundation_name)) {
      byFunder.set(r.foundation_name, { total: 0, classified: 0, yj: 0 });
    }
    const v = byFunder.get(r.foundation_name);
    v.total += Number(r.grant_amount || 0);
    if (r.yj_classified_at) v.classified++;
    if (r.yj_relevant) v.yj++;
  }
  const top = [...byFunder.entries()]
    .filter(([_, v]) => v.classified > 20 && v.total > 5_000_000) // only "real" funders with enough sample
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 30);
  for (const [name, stats] of top) {
    if (stats.yj === 0) {
      const q = `Top funder "${name}" has ${stats.classified} classified grants ($${(stats.total / 1_000_000).toFixed(1)}M) but ZERO YJ-relevant. Verify: is this real or classifier blind-spot?`;
      if (await fileGap(q, 'foundations', 2)) filed++;
    }
  }

  // 4) States with 0 alma interventions catalogued (rare but possible)
  console.log('\n[4] State alma_interventions coverage...');
  const { data: interventions } = await supabase
    .from('alma_interventions')
    .select('id, operating_organization_id')
    .eq('serves_youth_justice', true)
    .neq('verification_status', 'ai_generated');
  const orgIds = (interventions || []).map((i) => i.operating_organization_id).filter(Boolean);
  const stateByOrg = new Map();
  if (orgIds.length > 0) {
    for (let i = 0; i < orgIds.length; i += 100) {
      const chunk = orgIds.slice(i, i + 100);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, state')
        .in('id', chunk);
      for (const o of orgs || []) {
        if (o.state) stateByOrg.set(o.id, o.state);
      }
    }
  }
  const intvByState = new Map();
  for (const i of interventions || []) {
    const st = stateByOrg.get(i.operating_organization_id);
    if (!st) continue;
    intvByState.set(st, (intvByState.get(st) || 0) + 1);
  }
  for (const s of STATES) {
    const count = intvByState.get(s) || 0;
    if (count < 5) {
      const q = `Few ALMA interventions catalogued in ${s} (only ${count}). Discovery pass needed.`;
      if (await fileGap(q, 'orgs', 3)) filed++;
    }
  }

  console.log(`\n${APPLY ? 'Filed' : 'Would file'} ${filed} new gap question(s).`);
  if (!APPLY) console.log('Re-run with --apply.');
}

main().catch((err) => { console.error(err); process.exit(1); });

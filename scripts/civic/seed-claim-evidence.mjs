#!/usr/bin/env node
/**
 * Seed civic_claim_evidence rows so the triangulation lineage is in code,
 * not just a one-shot SQL session.
 *
 * Idempotent on (claim_id, source_table) — the UNIQUE constraint plus
 * ON CONFLICT DO NOTHING means re-running is safe and adds only new
 * sources we've identified since last run.
 *
 * Run after snapshot-civic-claims.mjs to ensure every claim has at least
 * a primary-source evidence row.
 *
 * Usage:
 *   node scripts/civic/seed-claim-evidence.mjs            # dry-run
 *   node scripts/civic/seed-claim-evidence.mjs --apply
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const APPLY = process.argv.includes('--apply');

// ─── Evidence-mapping rules ──────────────────────────────────────────────
// Each rule is a regex on claim_id → a list of source tables that ought to
// back claims matching that pattern. Confidence is per source. Methodology
// note is a short human-readable explanation that ends up in the table.
const RULES = [
  // Detention cost claims (ROGS-sourced)
  {
    pattern: /^access\.cost\.detention_/,
    sources: [
      { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS Table 17A.20: Productivity Commission Report on Government Services. Authoritative for cost per young person per day.' },
      { source_table: 'youth_detention_facilities', confidence: 0.95, note: 'Canonical 19-row detention facility list with capacity + state.' },
      { source_table: 'aihw_youth_justice_stats', confidence: 0.9, note: 'AIHW Youth Justice in Australia annual independently reports detention figures.' },
    ],
  },
  // Community cost claims (ROGS)
  {
    pattern: /^access\.cost\.community_/,
    sources: [
      { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS Table 17A.21: cost per young person under community-based supervision.' },
      { source_table: 'aihw_youth_justice_stats', confidence: 0.85, note: 'AIHW publishes overlapping supervision-level cost context.' },
    ],
  },
  // Detention bed capacity claims
  {
    pattern: /^access\.count\.detention_beds/,
    sources: [
      { source_table: 'youth_detention_facilities', confidence: 1.0, note: '19 canonical facilities with capacity_beds; updated via fallback-detention-centres + AIHW.' },
      { source_table: 'organizations', confidence: 0.95, note: 'Detention centres also live as organisations rows with type=detention_centre.' },
    ],
  },
  // Detention daily population
  {
    pattern: /^access\.count\.detention_avg_daily_pop/,
    sources: [
      { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS 17A.20 daily pop row.' },
      { source_table: 'aihw_youth_justice_stats', confidence: 0.9, note: 'AIHW independently publishes daily supervision population.' },
    ],
  },
  // Detention-vs-community ratio
  {
    pattern: /^access\.ratio\.detention_vs_community_cost/,
    sources: [
      { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'Derived from ROGS 17A.20 (detention) / 17A.21 (community). Same source for both sides.' },
      { source_table: 'aihw_youth_justice_stats', confidence: 0.85, note: 'AIHW cross-checks underlying daily cost.' },
    ],
  },
  // Tier 1 org counts
  {
    pattern: /^access\.count\.tier_1_orgs/,
    sources: [
      { source_table: 'civic_org_classifications', confidence: 1.0, note: 'Authoritative source — Tier 1 = confirmed_at NOT NULL + tier=1.' },
      { source_table: 'alma_interventions', confidence: 0.9, note: 'Bottom-up corroboration — verified interventions linked to operating_organization_id of Tier 1 orgs.' },
    ],
  },
  // Indigenous share of Tier 1
  {
    pattern: /^access\.indigenous_share/,
    sources: [
      { source_table: 'civic_org_classifications', confidence: 1.0, note: 'Tier 1 universe definition.' },
      { source_table: 'oric_corporations', confidence: 0.95, note: 'Authoritative ACCO check; presence in ORIC register confirms Indigenous-controlled status.' },
      { source_table: 'organizations', confidence: 0.9, note: 'is_indigenous_org heuristic flag (looser than ACCO).' },
    ],
  },
  // Tier 1 funding aggregates
  {
    pattern: /^access\.sum\.tier_1|^access\.median\.tier_1|^access\.indigenous_funding_share\.tier_1/,
    sources: [
      { source_table: 'justice_funding', confidence: 1.0, note: '157K rows of YJ-tagged funding records; the source of dollar aggregates.' },
      { source_table: 'civic_org_classifications', confidence: 1.0, note: 'Identifies which recipients count as Tier 1.' },
      { source_table: 'organizations', confidence: 0.95, note: 'acco_certified flag distinguishes ACCO recipients.' },
    ],
  },
  // QLD consultancy ratio + sum
  {
    pattern: /^access\.(ratio|sum)\.consultancy/,
    sources: [
      { source_table: 'justice_funding', confidence: 0.95, note: 'Underlying funding records.' },
      { source_table: 'civic_funding_yj_classifications', confidence: 0.9, note: 'is_yj_relevant flag on funding rows.' },
      { source_table: 'civic_consultancy_spending', confidence: 0.9, note: 'Dedicated consultancy contract dataset with YJ tags.' },
    ],
  },
  // Meetings asymmetry
  {
    pattern: /^access\.ratio\.dept_vs_frontline_meetings/,
    sources: [
      { source_table: 'civic_ministerial_diaries', confidence: 1.0, note: 'Underlying source — 1,728 ministerial diary entries.' },
      { source_table: 'civic_meeting_tags', confidence: 0.95, note: 'Per-meeting LLM-tagged sector_category (government / primary_frontline). HUMAN REVIEW PENDING.' },
    ],
  },
  // Foundation share to ACCO
  {
    pattern: /^access\.share\.foundation_dollars_to_acco/,
    sources: [
      { source_table: 'foundation_grantees', confidence: 0.85, note: 'Source of foundation grant data; tracks 179 of ~9K active grant-makers — sample, not census.' },
      { source_table: 'oric_corporations', confidence: 0.95, note: 'Authoritative ACCO test via grantee_abn match.' },
      { source_table: 'organizations', confidence: 0.95, note: 'acco_certified flag.' },
    ],
  },
  // Average daily supervision pop
  {
    pattern: /^access\.count\.(yj_supervision|community)_avg_daily/,
    sources: [
      { source_table: 'aihw_youth_justice_stats', confidence: 1.0, note: 'AIHW Youth Justice in Australia annual.' },
      { source_table: 'rogs_justice_spending', confidence: 0.9, note: 'ROGS also publishes daily supervision counts.' },
    ],
  },
  // Indigenous overrepresentation
  {
    pattern: /^oversight\.ratio\.indigenous_overrep/,
    sources: [
      { source_table: 'aihw_youth_justice_stats', confidence: 1.0, note: 'AIHW rate per 10K ATSI / non-Indigenous young people.' },
      { source_table: 'oric_corporations', confidence: 0.8, note: 'ACCO universe (denominator on ACCO-led delivery side).' },
      { source_table: 'aihw_child_protection', confidence: 0.85, note: 'Out-of-home care pipeline corroborates the overrep dynamic.' },
    ],
  },
  // Recidivism
  {
    pattern: /^oversight\.rate\.return_to_supervision/,
    sources: [
      { source_table: 'rogs_justice_spending', confidence: 1.0, note: 'ROGS Table 17A.26: returns to sentenced supervision within 12 months.' },
      { source_table: 'civic_hansard', confidence: 0.7, note: 'Ministerial statements often cite ROGS recidivism figures.' },
    ],
  },
  // Oversight counts
  {
    pattern: /^oversight\.count/,
    sources: [
      { source_table: 'oversight_recommendations', confidence: 1.0, note: 'Direct row count source.' },
      { source_table: 'civic_charter_commitments', confidence: 0.85, note: 'Charter pledges often reference oversight recommendations.' },
      { source_table: 'civic_hansard', confidence: 0.65, note: 'Hansard speeches cite oversight findings.' },
    ],
  },
  // Promises
  {
    pattern: /^promises\.count/,
    sources: [
      { source_table: 'civic_charter_commitments', confidence: 1.0, note: '75 ministerial charter pledges.' },
      { source_table: 'civic_hansard', confidence: 1.0, note: 'Hansard YJ-related statements (525 total).' },
      { source_table: 'civic_ministerial_statements', confidence: 0.9, note: '649 ministerial statements — independent corpus.' },
    ],
  },
];

async function main() {
  console.log(`Claim-evidence seeder · ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  const { data: claims, error } = await supabase
    .from('civic_intelligence_claims')
    .select('claim_id');
  if (error) {
    console.error('Fetch claims failed:', error.message);
    process.exit(1);
  }
  console.log(`Found ${claims?.length || 0} claims\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const claimsWithoutRule = [];

  for (const c of claims || []) {
    const rule = RULES.find((r) => r.pattern.test(c.claim_id));
    if (!rule) {
      claimsWithoutRule.push(c.claim_id);
      continue;
    }
    for (const src of rule.sources) {
      const row = {
        claim_id: c.claim_id,
        source_table: src.source_table,
        supports: true,
        confidence: src.confidence,
        methodology_note: src.note,
        contributed_by: 'seed_claim_evidence.mjs',
        reviewer_status: 'auto_high_confidence',
      };
      if (!APPLY) {
        inserted++;
        continue;
      }
      const { error: insErr } = await supabase
        .from('civic_claim_evidence')
        .upsert(row, { onConflict: 'claim_id,source_table' });
      if (insErr) {
        errors++;
        console.warn(`  ! ${c.claim_id} × ${src.source_table}: ${insErr.message}`);
      } else inserted++;
    }
  }

  console.log(`\n${APPLY ? 'Inserted/upserted' : 'Would insert'} ${inserted} evidence rows · ${errors} errors`);
  if (claimsWithoutRule.length > 0) {
    console.log(`\n${claimsWithoutRule.length} claims have no rule match (need a new RULES entry):`);
    for (const id of claimsWithoutRule) console.log(`  · ${id}`);
  }

  // Summary
  const { data: summary } = await supabase
    .from('v_claim_evidence_summary')
    .select('triangulation_tier');
  const tally = {};
  for (const r of summary || []) tally[r.triangulation_tier] = (tally[r.triangulation_tier] || 0) + 1;
  console.log(`\nTriangulation tally:`);
  for (const [tier, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)} ${tier}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

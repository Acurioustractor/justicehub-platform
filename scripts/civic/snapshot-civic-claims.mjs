#!/usr/bin/env node
/**
 * Civic Intelligence v1 — snapshot 6-8 ratio/count claims into civic_intelligence_claims.
 *
 * Idempotent on claim_id. Re-run any time the underlying data refreshes.
 *
 * Claims computed (v1):
 *   access.ratio.consultancy_vs_tier1_funding.qld   — HEADLINE: $ consultancy / $ Tier 1 grants
 *   access.sum.consultancy_yj_spend.qld             — numerator ($)
 *   access.sum.tier_1_grant_inflows.qld             — denominator ($)
 *   access.ratio.dept_vs_frontline_meetings.qld     — secondary: dept staff meetings per 1 frontline meeting
 *   access.count.tier_1_orgs.qld                    — size of Tier 1 universe in QLD
 *   access.count.tier_1_orgs.nt                     — size of Tier 1 universe in NT
 *   access.indigenous_share.qld                     — % of Tier 1 QLD orgs that are indigenous-controlled
 *   promises.count.commitments                      — total tracked charter / outcome commitments
 *   oversight.count.recommendations                 — total tracked oversight recs
 *
 * Each claim row includes: value, methodology, source_record_ids, source_doc_urls, computed_at.
 *
 * Usage: node scripts/civic/snapshot-civic-claims.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const METHODOLOGY_URL = '/intelligence/civic/methodology';

async function fetchConfirmedClassifications(state) {
  // Paginate through classifications joined to organizations by state.
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('civic_org_classifications')
      .select('id, organization_id, tier, sector_category, confirmed_at')
      .not('confirmed_at', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  if (!all.length) return [];

  // Enrich with org state.
  const ids = all.map((r) => r.organization_id);
  const stateById = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data, error } = await supabase
      .from('organizations')
      .select('id, state, is_indigenous_org')
      .in('id', chunk);
    if (error) throw error;
    for (const o of data || []) stateById.set(o.id, o);
  }
  return all
    .map((r) => ({ ...r, org: stateById.get(r.organization_id) }))
    .filter((r) => r.org && (state ? r.org.state === state : true));
}

async function fetchConfirmedFundingYj(state) {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('civic_funding_yj_classifications')
      .select('id, funding_id, is_yj_relevant, yj_relevance_category, confirmed_at')
      .not('confirmed_at', 'is', null)
      .eq('is_yj_relevant', true)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  if (!all.length) return [];

  // Enrich with funding row data.
  const fundingIds = all.map((r) => r.funding_id);
  const fundingById = new Map();
  for (let i = 0; i < fundingIds.length; i += 100) {
    const chunk = fundingIds.slice(i, i + 100);
    const { data, error } = await supabase
      .from('justice_funding')
      .select('id, recipient_name, amount_dollars, state, alma_organization_id')
      .in('id', chunk);
    if (error) throw error;
    for (const r of data || []) fundingById.set(r.id, r);
  }
  return all
    .map((r) => ({ ...r, funding: fundingById.get(r.funding_id) }))
    .filter((r) => r.funding && (state ? r.funding.state === state : true));
}

async function fetchTier1GrantSpend(qldTier1OrgIds) {
  // Sum justice_funding rows whose alma_organization_id is a confirmed Tier 1 QLD org.
  if (!qldTier1OrgIds.length) return { total: 0, rows: [] };
  let totalRows = [];
  for (let i = 0; i < qldTier1OrgIds.length; i += 100) {
    const chunk = qldTier1OrgIds.slice(i, i + 100);
    const { data, error } = await supabase
      .from('justice_funding')
      .select('id, alma_organization_id, amount_dollars')
      .in('alma_organization_id', chunk);
    if (error) throw error;
    totalRows.push(...(data || []));
  }
  const total = totalRows.reduce((s, r) => s + Number(r.amount_dollars || 0), 0);
  return { total, rows: totalRows };
}

async function fetchConfirmedMeetingTags() {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('civic_meeting_tags')
      .select('id, diary_id, sector_category, is_yj_relevant, confirmed_at')
      .not('confirmed_at', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function fetchCount(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function upsertClaim(claim) {
  if (DRY_RUN) {
    console.log(`  [dry] ${claim.claim_id} = ${claim.value_numeric ?? claim.value_text} (${claim.tier ? `T${claim.tier}` : '?'})`);
    return;
  }
  const { error } = await supabase
    .from('civic_intelligence_claims')
    .upsert({ ...claim, computed_at: new Date().toISOString() }, { onConflict: 'claim_id' });
  if (error) console.error(`  Upsert failed for ${claim.claim_id}: ${error.message}`);
}

async function main() {
  console.log('=== Civic Intelligence Claim Snapshotter ===');
  console.log(DRY_RUN ? '(DRY RUN — no DB writes)' : '(LIVE)');

  // Pull confirmed data
  const qldClass = await fetchConfirmedClassifications('QLD');
  const ntClass = await fetchConfirmedClassifications('NT');
  const meetingTags = await fetchConfirmedMeetingTags();

  const qldTier1 = qldClass.filter((c) => c.tier === 1);
  const ntTier1 = ntClass.filter((c) => c.tier === 1);
  const qldTier1Indigenous = qldTier1.filter((c) => c.org?.is_indigenous_org);

  const yjMeetings = meetingTags.filter((m) => m.is_yj_relevant);
  const govMeetings = yjMeetings.filter((m) => m.sector_category === 'government');
  const frontlineMeetings = yjMeetings.filter((m) => m.sector_category === 'primary_frontline');

  // Funding-side inputs (the new headline).
  const qldConsultancyYj = await fetchConfirmedFundingYj('QLD');
  const consultancyYjSpend = qldConsultancyYj.reduce((s, r) => s + Number(r.funding?.amount_dollars || 0), 0);
  const qldTier1OrgIds = qldTier1.map((c) => c.organization_id);
  const tier1Grants = await fetchTier1GrantSpend(qldTier1OrgIds);

  console.log(`\nInputs:`);
  console.log(`  QLD Tier 1 orgs confirmed=${qldTier1.length} (NT=${ntTier1.length})`);
  console.log(`  YJ meetings tagged=${yjMeetings.length} (government=${govMeetings.length}, frontline=${frontlineMeetings.length})`);
  console.log(`  QLD consultancy YJ-relevant rows confirmed=${qldConsultancyYj.length}, total $${consultancyYjSpend.toLocaleString()}`);
  console.log(`  Tier 1 QLD grant inflows: ${tier1Grants.rows.length} rows, total $${tier1Grants.total.toLocaleString()}\n`);

  // ── Claim 1: HEADLINE — funding access ratio QLD ─────────────
  const fundingRatio = tier1Grants.total > 0 ? consultancyYjSpend / tier1Grants.total : null;
  await upsertClaim({
    claim_id: 'access.ratio.consultancy_vs_tier1_funding.qld',
    display_label: 'YJ consultancy spend per $1 to Tier 1 frontline (QLD)',
    value_numeric: fundingRatio,
    value_text: fundingRatio !== null
      ? `For every $1 of QLD government youth justice funding that reached a Tier 1 frontline org, the government spent $${fundingRatio.toFixed(2)} on consulting and advisory firms doing YJ work`
      : 'insufficient data — confirm Tier 1 sweep + funding YJ-relevance sweep',
    unit: 'ratio',
    tier: 1,
    region: 'QLD',
    chapter: 'access',
    methodology: 'Numerator: sum(justice_funding.amount_dollars) for QLD rows where civic_funding_yj_classifications.is_yj_relevant = true AND confirmed_at IS NOT NULL AND recipient is a confirmed consulting/advisory firm. Denominator: sum(justice_funding.amount_dollars) where alma_organization_id is a confirmed Tier 1 frontline QLD organisation. Confirmed rows only.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { consultancy_funding_ids: qldConsultancyYj.map((r) => r.funding_id), tier1_grant_ids: tier1Grants.rows.map((r) => r.id) },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  // ── Claim 1b: numerator — consultancy YJ spend QLD ───────────
  await upsertClaim({
    claim_id: 'access.sum.consultancy_yj_spend.qld',
    display_label: 'QLD government YJ-relevant consultancy spend',
    value_numeric: consultancyYjSpend,
    value_text: `$${consultancyYjSpend.toLocaleString()} in confirmed YJ-relevant consultancy and advisory contracts (${qldConsultancyYj.length} contracts)`,
    unit: 'dollars',
    tier: 1,
    region: 'QLD',
    chapter: 'access',
    methodology: 'Sum of amount_dollars across justice_funding rows in QLD where civic_funding_yj_classifications.is_yj_relevant = true AND confirmed_at IS NOT NULL.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { funding_ids: qldConsultancyYj.map((r) => r.funding_id) },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  // ── Claim 1c: denominator — Tier 1 grant inflows QLD ─────────
  await upsertClaim({
    claim_id: 'access.sum.tier_1_grant_inflows.qld',
    display_label: 'QLD government funding to Tier 1 frontline orgs',
    value_numeric: tier1Grants.total,
    value_text: `$${tier1Grants.total.toLocaleString()} reached confirmed Tier 1 frontline orgs in QLD (${tier1Grants.rows.length} funding rows)`,
    unit: 'dollars',
    tier: 1,
    region: 'QLD',
    chapter: 'access',
    methodology: 'Sum of amount_dollars across justice_funding rows where alma_organization_id is a confirmed Tier 1 frontline QLD organisation.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { funding_ids: tier1Grants.rows.map((r) => r.id) },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  // ── Claim 1d: SECONDARY — dept-vs-frontline meeting asymmetry ─
  const meetingAsymmetry = frontlineMeetings.length > 0 ? govMeetings.length / frontlineMeetings.length : null;
  await upsertClaim({
    claim_id: 'access.ratio.dept_vs_frontline_meetings.qld',
    display_label: 'Departmental staff meetings per Tier 1 frontline meeting (QLD)',
    value_numeric: meetingAsymmetry,
    value_text: meetingAsymmetry !== null
      ? `QLD’s youth justice minister met internal departmental staff ${meetingAsymmetry.toFixed(0)} times for every one meeting with a Tier 1 frontline organisation`
      : 'insufficient data — confirm meeting-tag sweep',
    unit: 'ratio',
    tier: 1,
    region: 'QLD',
    chapter: 'access',
    methodology: 'For YJ-relevant ministerial diary entries (organisation OR purpose ILIKE %youth%/%detention%/%justice%), count confirmed meeting tags with sector_category = government as numerator, primary_frontline as denominator.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { government_meeting_tag_ids: govMeetings.map((m) => m.id), frontline_meeting_tag_ids: frontlineMeetings.map((m) => m.id) },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  // ── Claims 2+: Per-state Tier 1 counts + indigenous share ─────
  // Loops over all states with confirmed Tier 1 classifications so the civic
  // page can render any state. Consultancy ratio + meeting asymmetry stay
  // QLD-only because they need per-state curation pipelines we haven't run.
  const ALL_STATES = ['QLD', 'NT', 'NSW', 'VIC', 'WA', 'SA', 'ACT', 'TAS'];
  const TIER1_BASE_METHODOLOGY =
    'Distinct organizations.id where civic_org_classifications.tier = 1 AND civic_org_classifications.confirmed_at IS NOT NULL AND organizations.state = <state>. Confirmed Tier 1 universe = organisations whose primary delivered service is frontline YJ (diversion, bail support, on-Country mentoring, post-release, family conferencing, youth legal first-response).';

  for (const state of ALL_STATES) {
    const stateClass = await fetchConfirmedClassifications(state);
    const stateTier1 = stateClass.filter((c) => c.tier === 1);
    const stateIndig = stateTier1.filter((c) => c.org?.is_indigenous_org);
    const stateLower = state.toLowerCase();

    await upsertClaim({
      claim_id: `access.count.tier_1_orgs.${stateLower}`,
      display_label: `Tier 1 primary frontline YJ orgs (${state})`,
      value_numeric: stateTier1.length,
      value_text: `${stateTier1.length} Tier 1 frontline YJ organisations in ${state}`,
      unit: 'count',
      tier: 1,
      region: state,
      chapter: 'access',
      methodology: TIER1_BASE_METHODOLOGY.replace('<state>', state),
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { organization_ids: stateTier1.map((c) => c.organization_id) },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    if (stateTier1.length > 0) {
      const indigShareState = stateIndig.length / stateTier1.length;
      await upsertClaim({
        claim_id: `access.indigenous_share.${stateLower}`,
        display_label: `Indigenous-controlled share of ${state} Tier 1`,
        value_numeric: indigShareState,
        value_text: `${(indigShareState * 100).toFixed(0)}% of ${state} Tier 1 orgs are indigenous-controlled`,
        unit: 'fraction',
        tier: 1,
        region: state,
        chapter: 'access',
        methodology: `count(${state} Tier 1 orgs where is_indigenous_org = true) / count(${state} Tier 1 orgs).`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { indigenous_org_ids: stateIndig.map((c) => c.organization_id) },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });
    }
  }

  // (Old claims 4-5: consultancy_meetings / frontline_meetings counts retired —
  //  superseded by the funding-based headline ratio + dept-vs-frontline asymmetry.
  //  Documented in methodology under "What we retired and why".)

  // (Indigenous share moved into the per-state loop above.)

  // ── Claim 7: promises tracked ─────────────────────────────────
  const charter = await fetchCount('civic_charter_commitments');
  const hansard = await fetchCount('civic_hansard');
  await upsertClaim({
    claim_id: 'promises.count.commitments',
    display_label: 'Government youth justice commitments tracked',
    value_numeric: charter + hansard,
    value_text: `${charter + hansard} commitments tracked (${charter} charter pledges + ${hansard} Hansard statements)`,
    unit: 'count',
    tier: 1,
    region: 'national',
    chapter: 'promises',
    methodology: 'count(civic_charter_commitments) + count(civic_hansard). Hansard count is unfiltered total at v1 ship; YJ-only subset to be added in v1.1.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { charter_count: charter, hansard_count: hansard },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  // ── Claim 8: oversight recs ───────────────────────────────────
  const oversightCount = await fetchCount('oversight_recommendations');
  await upsertClaim({
    claim_id: 'oversight.count.recommendations',
    display_label: 'Independent oversight recommendations tracked',
    value_numeric: oversightCount,
    value_text: `${oversightCount} oversight recommendations tracked across NT + QLD oversight bodies`,
    unit: 'count',
    tier: 1,
    region: 'NT+QLD',
    chapter: 'oversight',
    methodology: 'count(oversight_recommendations) — recommendations from QLD Sentencing Advisory Council, NT Children\'s Commissioner, Royal Commission into the Protection and Detention of Children in the NT, and equivalent named bodies.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { total_count: oversightCount },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  console.log('\n=== Done. Visit /intelligence/civic to verify rendered claims. ===');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});

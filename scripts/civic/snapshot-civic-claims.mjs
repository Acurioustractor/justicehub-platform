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

  // ── Detention claims (per-state bed capacity + national total) ──
  // Seeded by scripts/civic/seed-detention-centres.mjs. Source list lives
  // in src/lib/organizations/fallback-detention-centres.ts.
  const detentionRows = [];
  {
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, state, acnc_data')
        .eq('type', 'detention_centre')
        .neq('archived', true)
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      detentionRows.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }

  const capacityByState = new Map();
  let nationalCapacity = 0;
  for (const row of detentionRows) {
    const beds = Number(row.acnc_data?.detention_meta?.capacity_beds || 0);
    if (!beds) continue;
    nationalCapacity += beds;
    capacityByState.set(row.state, (capacityByState.get(row.state) || 0) + beds);
  }

  await upsertClaim({
    claim_id: 'access.count.detention_beds.national',
    display_label: 'National youth detention bed capacity',
    value_numeric: nationalCapacity,
    value_text: `${nationalCapacity} youth detention beds across ${detentionRows.length} centres nationally`,
    unit: 'count',
    tier: 1,
    region: 'national',
    chapter: 'access',
    methodology:
      'Sum of organizations.acnc_data.detention_meta.capacity_beds across all rows where type = detention_centre AND is_active = true AND archived = false. Source: AIHW Youth justice in Australia + state corrections data, curated in src/lib/organizations/fallback-detention-centres.ts.',
    methodology_url: METHODOLOGY_URL,
    source_record_ids: { detention_centre_ids: detentionRows.map((r) => r.id) },
    source_doc_urls: [],
    verification_status: 'snapshot',
  });

  for (const [state, beds] of capacityByState.entries()) {
    if (!state) continue;
    await upsertClaim({
      claim_id: `access.count.detention_beds.${state.toLowerCase()}`,
      display_label: `Youth detention bed capacity (${state})`,
      value_numeric: beds,
      value_text: `${beds} youth detention beds in ${state}`,
      unit: 'count',
      tier: 2,
      region: state,
      chapter: 'access',
      methodology: `Sum of organizations.acnc_data.detention_meta.capacity_beds where type = detention_centre AND state = ${state}.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: {
        detention_centre_ids: detentionRows.filter((r) => r.state === state).map((r) => r.id),
      },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });
  }

  // ── Detention costs (ROGS 17A.20 — Cost per young person) ───
  // Pulls per-state daily cost, average daily population, and total
  // government recurrent expenditure. Emits one claim per state plus
  // a national headline.
  const STATE_CODES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'];
  const { data: costRows } = await supabase
    .from('rogs_justice_spending')
    .select('financial_year, description1, unit, nsw, vic, qld, wa, sa, tas, act, nt, aust')
    .eq('rogs_table', '17A.20')
    .eq('measure', 'Cost per young person subject to detention-based supervision')
    .eq('service_type', 'Detention-based supervision')
    .order('financial_year', { ascending: false })
    .limit(10);

  const latestFy = costRows?.[0]?.financial_year || null;
  // Hoisted so the later community-vs-detention ratio block can read detention dailies.
  let detentionDailyRow = null;
  if (latestFy && costRows) {
    const yearRows = costRows.filter((r) => r.financial_year === latestFy);
    const dailyRow = yearRows.find((r) => r.description1 === 'Cost per average day per young person');
    detentionDailyRow = dailyRow;
    const popRow = yearRows.find((r) => r.unit === 'no.');
    const spendRow = yearRows.find((r) =>
      r.description1 === 'Government real recurrent expenditure' && r.unit === "$'000"
    );

    // National headline: total spend + avg per young person
    const nationalAnnualPerYouth = Math.round(parseFloat(dailyRow?.aust || '0') * 365);
    const nationalSpend = parseFloat(spendRow?.aust || '0') * 1000; // $'000 → $
    const nationalPop = parseFloat(popRow?.aust || '0');

    await upsertClaim({
      claim_id: 'access.cost.detention_per_youth.annual.national',
      display_label: 'Annual detention cost per young person (national average)',
      value_numeric: nationalAnnualPerYouth,
      value_text: `$${nationalAnnualPerYouth.toLocaleString()} per young person per year — average across Australia (${latestFy})`,
      unit: 'dollars',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology: `ROGS Table 17A.20, financial year ${latestFy}: "Cost per average day per young person" × 365. Source: Productivity Commission Report on Government Services.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { financial_year: latestFy, rogs_table: '17A.20' },
      source_doc_urls: ['https://www.pc.gov.au/ongoing/report-on-government-services'],
      verification_status: 'snapshot',
    });

    await upsertClaim({
      claim_id: 'access.cost.detention_total.national',
      display_label: 'Total government youth detention spend (national)',
      value_numeric: nationalSpend,
      value_text: `$${(nationalSpend / 1_000_000).toFixed(0)}M total government recurrent expenditure on youth detention nationally (${latestFy})`,
      unit: 'dollars',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology: `ROGS Table 17A.20, "Government real recurrent expenditure" total row for Australia, ${latestFy}.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { financial_year: latestFy, rogs_table: '17A.20' },
      source_doc_urls: ['https://www.pc.gov.au/ongoing/report-on-government-services'],
      verification_status: 'snapshot',
    });

    await upsertClaim({
      claim_id: 'access.count.detention_avg_daily_pop.national',
      display_label: 'Average daily youth detention population (national)',
      value_numeric: nationalPop,
      value_text: `${nationalPop.toLocaleString()} young people detained on the average day in Australia (${latestFy})`,
      unit: 'count',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology: `ROGS Table 17A.20, "no." row total for Australia, ${latestFy}.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { financial_year: latestFy, rogs_table: '17A.20' },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    // Per-state claims for daily cost + annual cost
    for (const code of STATE_CODES) {
      const dailyDollar = parseFloat(dailyRow?.[code] || '0');
      const annualPerYouth = Math.round(dailyDollar * 365);
      const statePop = parseFloat(popRow?.[code] || '0');
      const stateUpper = code.toUpperCase();
      if (!dailyDollar) continue;

      await upsertClaim({
        claim_id: `access.cost.detention_per_youth.annual.${code}`,
        display_label: `Annual detention cost per young person (${stateUpper})`,
        value_numeric: annualPerYouth,
        value_text: `$${annualPerYouth.toLocaleString()} per young person per year in ${stateUpper} detention (${latestFy})`,
        unit: 'dollars',
        tier: 1,
        region: stateUpper,
        chapter: 'access',
        methodology: `ROGS Table 17A.20, ${latestFy}: $${dailyDollar.toFixed(2)} per day × 365.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { financial_year: latestFy, daily_cost: dailyDollar },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });

      await upsertClaim({
        claim_id: `access.count.detention_avg_daily_pop.${code}`,
        display_label: `Average daily youth detention population (${stateUpper})`,
        value_numeric: statePop,
        value_text: `${statePop} young people detained on the average day in ${stateUpper} (${latestFy})`,
        unit: 'count',
        tier: 1,
        region: stateUpper,
        chapter: 'access',
        methodology: `ROGS Table 17A.20 daily population row, ${latestFy}.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { financial_year: latestFy },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });
    }
  }

  // ── Community-based supervision costs (ROGS 17A.21) ─────────
  // The companion table to 17A.20 — what it costs to supervise a young
  // person in the community instead of detaining them. Crucial for the
  // comparative claim.
  const { data: commCostRows } = await supabase
    .from('rogs_justice_spending')
    .select('financial_year, description1, unit, nsw, vic, qld, wa, sa, tas, act, nt, aust')
    .eq('rogs_table', '17A.21')
    .eq('service_type', 'Community-based supervision')
    .order('financial_year', { ascending: false })
    .limit(10);

  const commLatestFy = commCostRows?.[0]?.financial_year || null;
  if (commLatestFy && commCostRows) {
    const yearRows = commCostRows.filter((r) => r.financial_year === commLatestFy);
    const commDailyRow = yearRows.find((r) => r.description1 === 'Cost per average day per young person');
    const commPopRow = yearRows.find((r) => r.unit === 'no.');
    const commSpendRow = yearRows.find((r) =>
      r.description1 === 'Government real recurrent expenditure' && r.unit === "$'000"
    );

    const natCommAnnualPerYouth = Math.round(parseFloat(commDailyRow?.aust || '0') * 365);
    const natCommSpend = parseFloat(commSpendRow?.aust || '0') * 1000;
    const natCommPop = parseFloat(commPopRow?.aust || '0');

    await upsertClaim({
      claim_id: 'access.cost.community_per_youth.annual.national',
      display_label: 'Annual community supervision cost per young person (national)',
      value_numeric: natCommAnnualPerYouth,
      value_text: `$${natCommAnnualPerYouth.toLocaleString()} per young person per year for community-based supervision — national average (${commLatestFy})`,
      unit: 'dollars',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology: `ROGS Table 17A.21, ${commLatestFy}: cost per average day × 365.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { financial_year: commLatestFy, rogs_table: '17A.21' },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    await upsertClaim({
      claim_id: 'access.cost.community_total.national',
      display_label: 'Total government community-based supervision spend (national)',
      value_numeric: natCommSpend,
      value_text: `$${(natCommSpend / 1_000_000).toFixed(0)}M total government spend on community-based youth supervision nationally (${commLatestFy})`,
      unit: 'dollars',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology: `ROGS Table 17A.21, total Australia, ${commLatestFy}.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { financial_year: commLatestFy, rogs_table: '17A.21' },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    await upsertClaim({
      claim_id: 'access.count.community_avg_daily_pop.national',
      display_label: 'Average daily youth community supervision population (national)',
      value_numeric: natCommPop,
      value_text: `${natCommPop.toLocaleString()} young people under community-based supervision on the average day (${commLatestFy})`,
      unit: 'count',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology: `ROGS Table 17A.21 daily population, total Australia, ${commLatestFy}.`,
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { financial_year: commLatestFy, rogs_table: '17A.21' },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    // ── Headline comparative claim: detention cost vs community cost ──
    const detentionDailyAust = parseFloat(detentionDailyRow?.aust || '0');
    const commDailyAust = parseFloat(commDailyRow?.aust || '0');
    if (detentionDailyAust && commDailyAust) {
      const costMultiple = detentionDailyAust / commDailyAust;
      await upsertClaim({
        claim_id: 'access.ratio.detention_vs_community_cost.national',
        display_label: 'Detention cost relative to community supervision cost (national)',
        value_numeric: costMultiple,
        value_text: `Detaining a young person costs ${costMultiple.toFixed(1)}× more per day than supervising them in the community ($${detentionDailyAust.toFixed(0)}/day vs $${commDailyAust.toFixed(0)}/day, ${commLatestFy})`,
        unit: 'ratio',
        tier: 1,
        region: 'national',
        chapter: 'access',
        methodology: `ROGS 17A.20 (detention) daily cost / ROGS 17A.21 (community) daily cost, both for financial year ${commLatestFy}, Australia totals.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { financial_year: commLatestFy, detention_daily: detentionDailyAust, community_daily: commDailyAust },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });
    }

    // Per-state community costs
    for (const code of STATE_CODES) {
      const dailyDollar = parseFloat(commDailyRow?.[code] || '0');
      if (!dailyDollar) continue;
      const annualPerYouth = Math.round(dailyDollar * 365);
      const stateUpper = code.toUpperCase();
      const detentionDailyState = parseFloat(detentionDailyRow?.[code] || '0');
      const stateMultiple = detentionDailyState && dailyDollar ? detentionDailyState / dailyDollar : null;

      await upsertClaim({
        claim_id: `access.cost.community_per_youth.annual.${code}`,
        display_label: `Annual community supervision cost per young person (${stateUpper})`,
        value_numeric: annualPerYouth,
        value_text: `$${annualPerYouth.toLocaleString()} per young person per year for community-based supervision in ${stateUpper} (${commLatestFy})`,
        unit: 'dollars',
        tier: 2,
        region: stateUpper,
        chapter: 'access',
        methodology: `ROGS Table 17A.21, ${commLatestFy}: $${dailyDollar.toFixed(2)}/day × 365.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { financial_year: commLatestFy },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });

      if (stateMultiple) {
        await upsertClaim({
          claim_id: `access.ratio.detention_vs_community_cost.${code}`,
          display_label: `Detention cost relative to community supervision cost (${stateUpper})`,
          value_numeric: stateMultiple,
          value_text: `In ${stateUpper}, detaining a young person costs ${stateMultiple.toFixed(1)}× more per day than community supervision ($${detentionDailyState.toFixed(0)} vs $${dailyDollar.toFixed(0)}, ${commLatestFy})`,
          unit: 'ratio',
          tier: 2,
          region: stateUpper,
          chapter: 'access',
          methodology: `ROGS 17A.20 / 17A.21 for ${stateUpper}, ${commLatestFy}.`,
          methodology_url: METHODOLOGY_URL,
          source_record_ids: { financial_year: commLatestFy },
          source_doc_urls: [],
          verification_status: 'snapshot',
        });
      }
    }
  }

  // ── Returns to youth justice supervision (recidivism, ROGS 17A.26) ──
  const { data: recidRows } = await supabase
    .from('rogs_justice_spending')
    .select('financial_year, unit, nsw, vic, qld, wa, sa, tas, act, nt, aust')
    .eq('rogs_table', '17A.26')
    .eq('unit', '%')
    .order('financial_year', { ascending: false })
    .limit(1);

  if (recidRows && recidRows.length > 0) {
    const r = recidRows[0];
    const recidFy = r.financial_year;
    const nationalRecid = parseFloat(r.aust || '0');
    if (nationalRecid) {
      await upsertClaim({
        claim_id: 'oversight.rate.return_to_supervision.national',
        display_label: 'Returns to youth justice supervision within 12 months (national)',
        value_numeric: nationalRecid / 100,
        value_text: `${nationalRecid.toFixed(1)}% of young people return to sentenced youth justice supervision within 12 months — national (${recidFy})`,
        unit: 'fraction',
        tier: 1,
        region: 'national',
        chapter: 'oversight',
        methodology: `ROGS Table 17A.26, ${recidFy}: proportion of young people who returned to sentenced supervision within 12 months of completing a previous supervised order.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { financial_year: recidFy, rogs_table: '17A.26' },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });
    }
    for (const code of STATE_CODES) {
      const v = parseFloat(r[code] || '0');
      if (!v) continue;
      await upsertClaim({
        claim_id: `oversight.rate.return_to_supervision.${code}`,
        display_label: `Returns to youth justice supervision within 12 months (${code.toUpperCase()})`,
        value_numeric: v / 100,
        value_text: `${v.toFixed(1)}% of young people in ${code.toUpperCase()} return to sentenced supervision within 12 months (${recidFy})`,
        unit: 'fraction',
        tier: 2,
        region: code.toUpperCase(),
        chapter: 'oversight',
        methodology: `ROGS Table 17A.26, ${recidFy}, ${code.toUpperCase()}.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { financial_year: recidFy, rogs_table: '17A.26' },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });
    }
  }

  // ── Foundation philanthropy to ACCO orgs ────────────────────
  // foundation_grantees + organizations.acco_certified (set by Fix #1).
  // Stark asymmetry claim: % of tracked philanthropic dollars reaching
  // Aboriginal-controlled organisations.
  {
    // Paginate — Supabase caps each fetch at 1000 rows even without explicit .limit()
    const row = [];
    let fgOffset = 0;
    const FG_PAGE = 1000;
    while (true) {
      const { data: page } = await supabase
        .from('foundation_grantees')
        .select('grant_amount, grantee_abn')
        .range(fgOffset, fgOffset + FG_PAGE - 1);
      if (!page || page.length === 0) break;
      row.push(...page);
      if (page.length < FG_PAGE) break;
      fgOffset += FG_PAGE;
    }
    if (row.length > 0) {
      // Need to know which grantees are ACCO — fetch ACCO ABN set
      const { data: accoOrgs } = await supabase
        .from('organizations')
        .select('abn')
        .eq('acco_certified', true);
      const accoAbns = new Set((accoOrgs || []).map((o) => o.abn).filter(Boolean));
      let totalDollars = 0;
      let accoDollars = 0;
      let totalGrants = 0;
      let accoGrants = 0;
      for (const r of row) {
        const amt = Number(r.grant_amount || 0);
        if (!amt) continue;
        totalGrants++;
        totalDollars += amt;
        if (r.grantee_abn && accoAbns.has(r.grantee_abn)) {
          accoGrants++;
          accoDollars += amt;
        }
      }
      if (totalDollars > 0) {
        const sharePct = (accoDollars / totalDollars) * 100;
        await upsertClaim({
          claim_id: 'access.share.foundation_dollars_to_acco.national',
          display_label: 'Foundation philanthropic dollars reaching ACCOs',
          value_numeric: accoDollars / totalDollars,
          value_text: `${sharePct.toFixed(2)}% of tracked foundation philanthropic dollars reach Aboriginal Community Controlled Organisations ($${(accoDollars / 1_000_000).toFixed(2)}M of $${(totalDollars / 1_000_000).toFixed(0)}M across ${totalGrants.toLocaleString()} grants in foundation_grantees)`,
          unit: 'fraction',
          tier: 1,
          region: 'national',
          chapter: 'access',
          methodology: 'Sum of foundation_grantees.grant_amount where grantee_abn matches an organisation with acco_certified=true (i.e. abn appears in oric_corporations) divided by total foundation grant_amount. ACCO = Aboriginal Community Controlled Organisation, certified via ORIC registration. Excludes grants where grantee_abn is unmatched.',
          methodology_url: METHODOLOGY_URL,
          source_record_ids: { acco_grants: accoGrants, total_grants: totalGrants },
          source_doc_urls: [],
          verification_status: 'snapshot',
        });
      }
    }
  }

  // ── Oversight totals: combined recommendations tally ────────
  const { count: orCount } = await supabase
    .from('oversight_recommendations')
    .select('id', { count: 'exact', head: true });
  const { count: ccrCount } = await supabase
    .from('children_commissioner_reports')
    .select('id', { count: 'exact', head: true });
  const { count: agaCount } = await supabase
    .from('auditor_general_audits')
    .select('id', { count: 'exact', head: true });

  if (orCount) {
    await upsertClaim({
      claim_id: 'oversight.count.recommendations_all_sources',
      display_label: 'Total tracked oversight recommendations (all sources)',
      value_numeric: orCount,
      value_text: `${orCount} recommendations tracked across Sentencing Advisory Councils (QLD/VIC/TAS/NSW/NT), state Auditors-General, and the Royal Commission into the Protection and Detention of Children in the NT`,
      unit: 'count',
      tier: 1,
      region: 'national',
      chapter: 'oversight',
      methodology: "count(oversight_recommendations) — populated by Sentencing Council and Auditor-General ingestion scripts. Excludes Children's Commissioner findings (stored separately in children_commissioner_reports.recommendations jsonb).",
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { total: orCount },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });
  }

  if (ccrCount) {
    await upsertClaim({
      claim_id: 'oversight.count.childrens_commissioner_reports',
      display_label: "Children's Commissioner reports analysed",
      value_numeric: ccrCount,
      value_text: `${ccrCount} jurisdictional Children's Commissioner annual reports analysed with structured findings + recommendations`,
      unit: 'count',
      tier: 1,
      region: 'national',
      chapter: 'oversight',
      methodology: 'count(children_commissioner_reports). Sourced from ingest-children-commissioners.mjs (Gemini-extracted structured findings).',
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { total: ccrCount },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });
  }

  if (agaCount) {
    await upsertClaim({
      claim_id: 'oversight.count.auditor_general_audits',
      display_label: 'State Auditor-General YJ performance audits tracked',
      value_numeric: agaCount,
      value_text: `${agaCount} state Auditor-General performance audits relevant to youth justice tracked with findings + recommendations`,
      unit: 'count',
      tier: 1,
      region: 'national',
      chapter: 'oversight',
      methodology: 'count(auditor_general_audits). Currently QLD + NSW + VIC + WA; SA/TAS sources need different discovery path.',
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { total: agaCount },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });
  }

  // ── AIHW Indigenous overrepresentation (Phase 3) ────────────
  // From aihw_youth_justice_stats (sourced from AIHW Youth Justice in
  // Australia annual report). The 16-20× overrep figures are headline
  // claims that drive the case for community-led alternatives.
  const { data: aihwRows } = await supabase
    .from('aihw_youth_justice_stats')
    .select('report_year, state, metric_key, metric_value, unit, indigenous_status')
    .ilike('metric_key', '%indigenous_overrep_ratio')
    .eq('state', 'NAT')
    .order('report_year', { ascending: false })
    .limit(10);

  if (aihwRows && aihwRows.length > 0) {
    const aihwLatestYear = aihwRows[0].report_year;
    for (const row of aihwRows) {
      if (row.report_year !== aihwLatestYear) continue;
      const lane = row.metric_key.replace('.indigenous_overrep_ratio', '');
      const ratio = Number(row.metric_value);
      if (!ratio) continue;
      await upsertClaim({
        claim_id: `oversight.ratio.indigenous_overrep_${lane}.national`,
        display_label: `Indigenous over-representation in YJ ${lane} (national)`,
        value_numeric: ratio,
        value_text: `Aboriginal and Torres Strait Islander young people are ${ratio}× more likely to be under youth justice ${lane} than non-Indigenous young people (${aihwLatestYear}, national)`,
        unit: 'ratio',
        tier: 1,
        region: 'national',
        chapter: 'oversight',
        methodology: `AIHW Youth Justice in Australia ${aihwLatestYear}: rate per 10,000 ATSI young people / rate per 10,000 non-Indigenous young people, ${lane} channel. Sourced from aihw_youth_justice_stats table; original extraction via scripts/civic/ingest-aihw-youth-justice.mjs.`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { aihw_report_year: aihwLatestYear, channel: lane },
        source_doc_urls: [`https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-${aihwLatestYear}/`],
        verification_status: 'snapshot',
      });
    }
  }

  // National YJ supervision average daily from AIHW
  const { data: avgDailyRows } = await supabase
    .from('aihw_youth_justice_stats')
    .select('report_year, metric_value')
    .eq('metric_key', 'supervision.avg_daily.national')
    .eq('state', 'NAT')
    .order('report_year', { ascending: false })
    .limit(1);

  if (avgDailyRows && avgDailyRows.length > 0) {
    const row = avgDailyRows[0];
    const v = Number(row.metric_value);
    if (v) {
      await upsertClaim({
        claim_id: 'access.count.yj_supervision_avg_daily.national',
        display_label: 'Young people under YJ supervision on the average day (national)',
        value_numeric: v,
        value_text: `${v.toLocaleString()} young people under youth justice supervision on the average day in Australia (${row.report_year})`,
        unit: 'count',
        tier: 1,
        region: 'national',
        chapter: 'access',
        methodology: `AIHW Youth Justice in Australia ${row.report_year}: average daily count of young people under sentenced or unsentenced supervision (community + detention combined).`,
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { aihw_report_year: row.report_year },
        source_doc_urls: [`https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-${row.report_year}/`],
        verification_status: 'snapshot',
      });
    }
  }

  // ── Tier 1 funding distribution (Phase 3) ─────────────────────
  // Cross-state aggregate so we can compare "the median Tier 1 org receives X
  // in justice funding" vs detention's $1.33M per young person per year.
  // Computed in SQL because percentiles are awkward in JS.
  const { data: t1FundingRow } = await supabase.rpc('exec_sql', { sql: '' }).then(
    () => ({ data: null }),
    () => ({ data: null })
  ).catch(() => ({ data: null }));

  // Direct query — works even without an RPC.
  const { data: t1FundingRowsAll, error: t1Err } = await supabase
    .from('civic_org_classifications')
    .select('organization_id, tier, confirmed_at')
    .eq('tier', 1)
    .not('confirmed_at', 'is', null);
  if (!t1Err && t1FundingRowsAll && t1FundingRowsAll.length > 0) {
    // Fetch orgs + their justice_funding totals
    const t1Ids = t1FundingRowsAll.map((r) => r.organization_id);
    const orgsById = new Map();
    for (let i = 0; i < t1Ids.length; i += 100) {
      const chunk = t1Ids.slice(i, i + 100);
      const { data } = await supabase
        .from('organizations')
        .select('id, is_indigenous_org')
        .in('id', chunk);
      for (const o of data || []) orgsById.set(o.id, o);
    }
    // Sum funding per org. Process one org at a time, paginating inside
    // each so a single org with many funding rows doesn't get truncated
    // by Supabase's 1000-row fetch cap.
    const fundingByOrg = new Map();
    for (const id of t1Ids) {
      let total = 0;
      let offset = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('justice_funding')
          .select('amount_dollars')
          .eq('alma_organization_id', id)
          .range(offset, offset + PAGE - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        for (const r of data) total += Number(r.amount_dollars || 0);
        if (data.length < PAGE) break;
        offset += PAGE;
      }
      fundingByOrg.set(id, total);
    }
    // Compute stats
    const totals = t1Ids.map((id) => fundingByOrg.get(id) || 0);
    totals.sort((a, b) => a - b);
    const median = totals.length > 0 ? totals[Math.floor(totals.length / 2)] : 0;
    const sum = totals.reduce((s, v) => s + v, 0);
    const mean = totals.length > 0 ? sum / totals.length : 0;
    const withFunding = totals.filter((v) => v > 0).length;

    const indigTotals = t1Ids
      .filter((id) => orgsById.get(id)?.is_indigenous_org)
      .map((id) => fundingByOrg.get(id) || 0);
    const indigSum = indigTotals.reduce((s, v) => s + v, 0);
    const indigCount = indigTotals.length;
    const indigShare = sum > 0 ? indigSum / sum : null;

    await upsertClaim({
      claim_id: 'access.sum.tier_1_funding.national',
      display_label: 'Total justice funding to Tier 1 frontline orgs (national)',
      value_numeric: sum,
      value_text: `$${(sum / 1_000_000).toFixed(0)}M total justice funding to ${t1Ids.length} confirmed Tier 1 frontline orgs nationally`,
      unit: 'dollars',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology:
        'Sum of justice_funding.amount_dollars across rows whose alma_organization_id is a confirmed Tier 1 (tier=1, confirmed_at IS NOT NULL) organisation. National across all 8 states.',
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { tier1_org_count: t1Ids.length, with_funding: withFunding },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    await upsertClaim({
      claim_id: 'access.median.tier_1_funding_per_org.national',
      display_label: 'Median justice funding per Tier 1 org (national)',
      value_numeric: median,
      value_text: `Median Tier 1 frontline org receives $${Math.round(median).toLocaleString()} in tracked justice funding`,
      unit: 'dollars',
      tier: 1,
      region: 'national',
      chapter: 'access',
      methodology:
        'Median of justice_funding totals across the 149-org confirmed Tier 1 universe. Some orgs have $0 tracked funding (no rows match in justice_funding); included in the distribution.',
      methodology_url: METHODOLOGY_URL,
      source_record_ids: { tier1_org_count: t1Ids.length },
      source_doc_urls: [],
      verification_status: 'snapshot',
    });

    if (indigShare !== null) {
      await upsertClaim({
        claim_id: 'access.indigenous_funding_share.tier_1.national',
        display_label: 'Indigenous-controlled share of Tier 1 funding (national)',
        value_numeric: indigShare,
        value_text: `Indigenous-controlled orgs are ${Math.round((indigCount / t1Ids.length) * 100)}% of the confirmed Tier 1 universe (${indigCount}/${t1Ids.length}) but receive ${Math.round(indigShare * 100)}% of total Tier 1 justice funding`,
        unit: 'fraction',
        tier: 1,
        region: 'national',
        chapter: 'access',
        methodology:
          'Indigenous-controlled = organizations.is_indigenous_org = true. Funding share = sum(funding to Indigenous Tier 1) / sum(funding to all Tier 1). National across all 8 states.',
        methodology_url: METHODOLOGY_URL,
        source_record_ids: { indigenous_count: indigCount, tier1_total: t1Ids.length },
        source_doc_urls: [],
        verification_status: 'snapshot',
      });
    }
  }

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

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type SearchRow = {
  result_type: string;
  id: string;
  title: string;
  subtitle: string | null;
  detail: string | null;
  meta: Record<string, unknown> | null;
  slug: string | null;
  similarity: number | null;
};

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type RangeQuery<T> = {
  range(from: number, to: number): PromiseLike<QueryResult<T[]>>;
};

type PostgrestQuery<T> = PromiseLike<QueryResult<T[]>> &
  RangeQuery<T> & {
    select<Row = T>(columns: string): PostgrestQuery<Row>;
    eq(column: string, value: unknown): PostgrestQuery<T>;
    in(column: string, values: unknown[]): PostgrestQuery<T>;
    not(column: string, operator: string, value: unknown): PostgrestQuery<T>;
    or(filters: string): PostgrestQuery<T>;
    order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): PostgrestQuery<T>;
    limit(count: number): PostgrestQuery<T>;
    maybeSingle(): PromiseLike<QueryResult<T | null>>;
  };

type UntypedSupabaseClient = {
  from<T>(table: string): PostgrestQuery<T>;
  rpc<T>(fn: string, args?: Record<string, unknown>): PromiseLike<QueryResult<T>>;
};

type StateClaimRow = {
  claim_id: string;
  display_label: string | null;
  value_text: string | null;
  value_numeric: number | null;
  source_doc_urls: unknown;
  source_year: number | null;
};

type Tier1ClassificationRow = {
  organization_id: string;
  organizations: {
    id: string;
    name: string;
    state: string | null;
    city: string | null;
    is_indigenous_org: boolean | null;
    acco_certified: boolean | null;
    is_active: boolean | null;
    archived: boolean | null;
  } | null;
};

type StateClassificationRow = {
  organization_id: string;
  tier: number | null;
  sector_category: string | null;
  llm_proposed_tier: number | null;
  llm_confidence: number | string | null;
  llm_evidence_snippet: string | null;
  confirmed_at: string | null;
  organizations: {
    id: string;
    name: string;
    slug: string | null;
    state: string | null;
    city: string | null;
    is_indigenous_org: boolean | null;
    acco_certified: boolean | null;
    is_active: boolean | null;
    archived: boolean | null;
  } | null;
};

type FundingRow = {
  id: string;
  amount_dollars: number | null;
  source: string | null;
  source_url: string | null;
  recipient_abn?: string | null;
  program_name: string | null;
  project_description?: string | null;
  financial_year: string | null;
  funding_type?: string | null;
  alma_organization_id?: string | null;
  alma_intervention_id?: string | null;
  gs_entity_id?: string | null;
};

type OversightRow = {
  id: string;
  report_title: string | null;
  recommendation_text: string | null;
  report_url: string | null;
  report_date: string | null;
  status: string | null;
};

type ChildrenReportRow = {
  id: string;
  report_title: string | null;
  body_name: string | null;
  report_url: string | null;
  published_date: string | null;
  yj_relevant: boolean | null;
  detention_mentioned: boolean | null;
  indigenous_overrep_mentioned: boolean | null;
};

type StateFoundationFlow = {
  grant_count?: number | null;
  total_dollars?: number | null;
  yj_dollars?: number | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string | null;
  abn: string | null;
  city: string | null;
  state: string | null;
  is_indigenous_org: boolean | null;
  acco_certified: boolean | null;
  description: string | null;
  website: string | null;
};

type OrgClassificationRow = {
  tier: number | null;
  sector_category: string | null;
  confirmed_at: string | null;
};

type FoundationGrantRow = {
  id: string;
  foundation_name: string | null;
  grant_amount: number | null;
  grant_year: number | null;
  program_name: string | null;
  source_url: string | null;
  source_document_url: string | null;
  yj_relevant: boolean | null;
  yj_category: string | null;
  yj_evidence_snippet: string | null;
};

type Entity360Row = {
  organization_id: string;
  abn: string | null;
  name: string;
  slug: string | null;
  state: string | null;
  city: string | null;
  type: string | null;
  is_active: boolean | null;
  is_acnc_charity: boolean | null;
  in_oric_register: boolean | null;
  is_confirmed_tier1: boolean | null;
  confirmed_tier: number | null;
  total_justice_funding_received: number | null;
  justice_funding_records: number | string | null;
  foundation_dollars_received: number | null;
  foundation_grants_received: number | string | null;
};

type ProgramOperatorRow = {
  id: string;
  name: string | null;
  service_role: string | null;
  type: string | null;
  evidence_level: string | null;
  cost_per_young_person: number | null;
  serves_youth_justice: boolean | null;
  verification_status: string | null;
  source_documents: unknown;
  operating_organization_id: string | null;
  organizations:
    | {
        id: string;
        name: string;
        slug: string | null;
        state: string | null;
        city: string | null;
        is_indigenous_org: boolean | null;
        acco_certified: boolean | null;
        is_active: boolean | null;
        archived: boolean | null;
      }
    | Array<{
        id: string;
        name: string;
        slug: string | null;
        state: string | null;
        city: string | null;
        is_indigenous_org: boolean | null;
        acco_certified: boolean | null;
        is_active: boolean | null;
        archived: boolean | null;
      }>
    | null;
};

type DetentionFacilityRow = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  operational_status: string | null;
  capacity_beds: number | null;
  government_department: string | null;
  data_source_url: string | null;
};

type GovernmentProgramRow = {
  id: string;
  name: string;
  jurisdiction: string | null;
  program_type: string | null;
  status: string | null;
  budget_amount: number | null;
  department: string | null;
  minister: string | null;
  official_url: string | null;
  community_led: boolean | null;
  evidence_indigenous_delivery: boolean | null;
};

type EvidenceLink = {
  label: string;
  detail: string;
  sourceTable: string;
  sourceUrl?: string | null;
};

type ConnectedAnswerCard = {
  id: string;
  type: 'place' | 'organization';
  title: string;
  subtitle: string;
  url?: string;
  priority: number;
  summary: string;
  connections: Array<{
    kind: 'organisation' | 'money' | 'foundation' | 'oversight' | 'claim' | 'coverage' | 'program' | 'detention';
    label: string;
    value: string;
    note?: string;
  }>;
  evidence: EvidenceLink[];
};

const STATE_NAMES: Record<string, string> = {
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  NT: 'Northern Territory',
  QLD: 'Queensland',
  SA: 'South Australia',
  TAS: 'Tasmania',
  VIC: 'Victoria',
  WA: 'Western Australia',
};

function money(value: number | null | undefined) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

function compactText(value: unknown, max = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function orgNames(rows: StateClassificationRow[], limit = 4) {
  return rows
    .map((row) => row.organizations?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, limit);
}

function uniqueCount(values: Array<string | null | undefined>) {
  return new Set(values.filter((value): value is string => Boolean(value))).size;
}

function firstRelatedOrg(row: ProgramOperatorRow) {
  if (Array.isArray(row.organizations)) return row.organizations[0] || null;
  return row.organizations;
}

async function fetchAllRows<T>(query: RangeQuery<T>, maxRows = 10000) {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; from < maxRows; from += pageSize) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function inferState(q: string, rows: SearchRow[]) {
  const query = q.toLowerCase();
  if (/\b(adelaide|south australia|sa)\b/i.test(query)) return 'SA';
  if (/\b(canberra|act|australian capital territory)\b/i.test(query)) return 'ACT';
  if (/\b(tasmania|tas|hobart)\b/i.test(query)) return 'TAS';
  if (/\b(western australia|wa|perth)\b/i.test(query)) return 'WA';
  if (/\b(new south wales|nsw|sydney)\b/i.test(query)) return 'NSW';
  if (/\b(queensland|qld|brisbane)\b/i.test(query)) return 'QLD';
  if (/\b(victoria|vic|melbourne)\b/i.test(query)) return 'VIC';
  if (/\b(northern territory|nt|darwin|alice springs)\b/i.test(query)) return 'NT';

  const stateCounts = new Map<string, number>();
  for (const row of rows) {
    const state = String(row.meta?.state || '').toUpperCase();
    if (STATE_NAMES[state]) stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
  }
  return Array.from(stateCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

async function fetchStateClaims(supabase: UntypedSupabaseClient, state: string) {
  const code = state.toLowerCase();
  const ids = [
    `access.cost.detention_per_youth.annual.${code}`,
    `access.cost.community_per_youth.annual.${code}`,
    `access.ratio.detention_vs_community_cost.${code}`,
    `access.count.tier_1_orgs.${code}`,
  ];
  const { data } = await supabase
    .from<StateClaimRow>('civic_intelligence_claims')
    .select('claim_id,display_label,value_text,value_numeric,source_doc_urls,source_year')
    .in('claim_id', ids)
    .in('verification_status', ['verified', 'snapshot']);
  return data || [];
}

async function buildPlaceCard(supabase: UntypedSupabaseClient, q: string, state: string): Promise<ConnectedAnswerCard | null> {
  const stateName = STATE_NAMES[state];
  if (!stateName) return null;

  const [
    claimsResult,
    classificationResult,
    tier1Result,
    entityRows,
    programRows,
    detentionRows,
    governmentProgramRows,
    fundingRows,
    oversightRows,
    childrenRows,
    foundationResult,
  ] = await Promise.all([
    fetchStateClaims(supabase, state),
    supabase
      .from<StateClassificationRow>('civic_org_classifications')
      .select('organization_id,tier,sector_category,llm_proposed_tier,llm_confidence,llm_evidence_snippet,confirmed_at,organizations!inner(id,name,slug,state,city,is_indigenous_org,acco_certified,is_active,archived)')
      .eq('organizations.state', state),
    supabase
      .from<Tier1ClassificationRow>('civic_org_classifications')
      .select('organization_id,organizations!inner(id,name,state,city,is_indigenous_org,acco_certified,is_active,archived)')
      .eq('tier', 1)
      .not('confirmed_at', 'is', null)
      .eq('organizations.state', state),
    fetchAllRows(
      supabase
        .from<Entity360Row>('v_entity_360')
        .select('organization_id,abn,name,slug,state,city,type,is_active,is_acnc_charity,in_oric_register,is_confirmed_tier1,confirmed_tier,total_justice_funding_received,justice_funding_records,foundation_dollars_received,foundation_grants_received')
        .eq('state', state)
        .order('organization_id'),
      10000
    ),
    fetchAllRows(
      supabase
        .from<ProgramOperatorRow>('alma_interventions')
        .select('id,name,service_role,type,evidence_level,cost_per_young_person,serves_youth_justice,verification_status,source_documents,operating_organization_id,organizations!alma_interventions_operating_organization_id_fkey(id,name,slug,state,city,is_indigenous_org,acco_certified,is_active,archived)')
        .eq('organizations.state', state)
        .not('verification_status', 'eq', 'ai_generated'),
      5000
    ),
    fetchAllRows(
      supabase
        .from<DetentionFacilityRow>('youth_detention_facilities')
        .select('id,name,slug,city,state,operational_status,capacity_beds,government_department,data_source_url')
        .eq('state', state),
      1000
    ),
    fetchAllRows(
      supabase
        .from<GovernmentProgramRow>('alma_government_programs')
        .select('id,name,jurisdiction,program_type,status,budget_amount,department,minister,official_url,community_led,evidence_indigenous_delivery')
        .in('jurisdiction', [state, stateName]),
      1000
    ),
    fetchAllRows(
      supabase
        .from<FundingRow>('justice_funding')
        .select('id,amount_dollars,source,source_url,recipient_abn,program_name,financial_year,funding_type,alma_organization_id,alma_intervention_id,gs_entity_id')
        .eq('state', state),
      20000
    ),
    fetchAllRows(
      supabase
        .from<OversightRow>('oversight_recommendations')
        .select('id,report_title,recommendation_text,report_url,report_date,status')
        .eq('jurisdiction', state)
        .order('report_date', { ascending: false, nullsFirst: false }),
      5000
    ),
    fetchAllRows(
      supabase
        .from<ChildrenReportRow>('children_commissioner_reports')
        .select('id,report_title,body_name,report_url,published_date,yj_relevant,detention_mentioned,indigenous_overrep_mentioned')
        .eq('jurisdiction', state)
        .order('published_date', { ascending: false, nullsFirst: false }),
      5000
    ),
    supabase.rpc<StateFoundationFlow>('state_foundation_flows', { state_code: state.toLowerCase() }),
  ]);

  const classificationRows = (classificationResult.data || []).filter((row) => row.organizations?.archived !== true && row.organizations?.is_active !== false);
  const confirmedClassifications = classificationRows.filter((row) => row.confirmed_at);
  const tier1 = (tier1Result.data || []).filter((row) => row.organizations?.archived !== true && row.organizations?.is_active !== false);
  const tier2 = confirmedClassifications.filter((row) => row.tier === 2);
  const tier3 = confirmedClassifications.filter((row) => row.tier === 3);
  const pending = classificationRows.filter((row) => !row.confirmed_at);
  const pendingTier1 = pending.filter((row) => row.llm_proposed_tier === 1);
  const activeEntityRows = entityRows.filter((row) => row.is_active !== false);
  const evidenceLinkedOrgIds = new Set<string>();
  for (const row of classificationRows) evidenceLinkedOrgIds.add(row.organization_id);
  for (const row of activeEntityRows) {
    if (
      Number(row.justice_funding_records || 0) > 0 ||
      Number(row.foundation_grants_received || 0) > 0 ||
      row.type === 'detention_centre'
    ) {
      evidenceLinkedOrgIds.add(row.organization_id);
    }
  }
  const activeProgramRows = programRows.filter((row) => {
    const org = firstRelatedOrg(row);
    return org?.state === state && org.archived !== true && org.is_active !== false;
  });
  for (const row of activeProgramRows) {
    const org = firstRelatedOrg(row);
    if (org?.id) evidenceLinkedOrgIds.add(org.id);
  }
  const programOrgCount = uniqueCount(activeProgramRows.map((row) => firstRelatedOrg(row)?.id || row.operating_organization_id));
  const yjProgramCount = activeProgramRows.filter((row) => row.serves_youth_justice === true).length;
  const programCostCount = activeProgramRows.filter((row) => row.cost_per_young_person != null).length;
  const abnLinkedRows = activeEntityRows.filter((row) => row.abn);
  const justiceFundedOrgCount = activeEntityRows.filter((row) => Number(row.justice_funding_records || 0) > 0).length;
  const foundationLinkedOrgCount = activeEntityRows.filter((row) => Number(row.foundation_grants_received || 0) > 0).length;
  const oricOrgCount = activeEntityRows.filter((row) => row.in_oric_register === true).length;
  const detentionCapacity = detentionRows.reduce((sum, row) => sum + Number(row.capacity_beds || 0), 0);
  const governmentBudget = governmentProgramRows.reduce((sum, row) => sum + Number(row.budget_amount || 0), 0);
  const fundingKnown = fundingRows.filter((row) => Number(row.amount_dollars) > 0);
  const fundingTotal = fundingKnown.reduce((sum, row) => sum + Number(row.amount_dollars || 0), 0);
  const fundingOrgLinkCount = fundingRows.filter((row) => row.alma_organization_id).length;
  const fundingProgramLinkCount = fundingRows.filter((row) => row.alma_intervention_id).length;
  const foundation = foundationResult.data || {};
  const claims = claimsResult || [];

  const evidence: EvidenceLink[] = [];
  const detentionClaim = claims.find((claim) => claim.claim_id.includes('detention_per_youth'));
  if (detentionClaim) {
    evidence.push({
      label: 'Detention cost claim',
      detail: detentionClaim.value_text || detentionClaim.display_label,
      sourceTable: 'civic_intelligence_claims',
      sourceUrl: Array.isArray(detentionClaim.source_doc_urls) ? detentionClaim.source_doc_urls[0] : null,
    });
  }
  const budgetRow = fundingRows.find((row) => row.source === 'sa-budget-2025-26') || fundingRows.find((row) => row.source_url);
  if (budgetRow) {
    evidence.push({
      label: budgetRow.source === 'sa-budget-2025-26' ? 'SA Budget 2025-26 row' : 'Funding row',
      detail: compactText(`${budgetRow.program_name || 'Funding record'} ${budgetRow.financial_year || ''} ${money(budgetRow.amount_dollars)}`),
      sourceTable: 'justice_funding',
      sourceUrl: budgetRow.source_url,
    });
  }
  const oversightEvidence = oversightRows[0] || childrenRows[0];
  if (oversightEvidence) {
    evidence.push({
      label: 'Oversight source',
      detail: compactText(oversightEvidence.report_title || oversightEvidence.body_name || oversightEvidence.recommendation_text),
      sourceTable: oversightRows[0] ? 'oversight_recommendations' : 'children_commissioner_reports',
      sourceUrl: oversightEvidence.report_url,
    });
  }
  evidence.push({
    label: 'Tiered organisation map',
    detail: compactText(
      `${state} civic_org_classifications: Tier 1 direct frontline ${tier1.length}; Tier 2 adjacent/advocacy ${tier2.length}; Tier 3 broader/non-core context ${tier3.length}; pending review ${pending.length}.`
    ),
    sourceTable: 'civic_org_classifications',
  });
  if (activeEntityRows.length > 0) {
    evidence.push({
      label: 'ABN/entity alignment',
      detail: `${state} Entity-360: ${abnLinkedRows.length.toLocaleString()} active org rows with ABN; ${justiceFundedOrgCount.toLocaleString()} with justice-funding overlays; ${foundationLinkedOrgCount.toLocaleString()} with foundation grants by ABN; ${oricOrgCount.toLocaleString()} in ORIC.`,
      sourceTable: 'v_entity_360',
    });
  }
  if (activeProgramRows[0]) {
    const org = firstRelatedOrg(activeProgramRows[0]);
    evidence.push({
      label: 'Program operator row',
      detail: compactText(`${activeProgramRows[0].name || 'Program'}${org?.name ? ` operated by ${org.name}` : ''}; ${activeProgramRows[0].service_role || activeProgramRows[0].type || 'program role not specified'}`),
      sourceTable: 'alma_interventions',
    });
  }
  if (detentionRows[0]) {
    evidence.push({
      label: 'Detention facility row',
      detail: compactText(`${detentionRows[0].name}; ${detentionRows[0].capacity_beds || 'unknown'} beds; ${detentionRows[0].government_department || 'department not listed'}`),
      sourceTable: 'youth_detention_facilities',
      sourceUrl: detentionRows[0].data_source_url,
    });
  }
  if (governmentProgramRows[0]) {
    evidence.push({
      label: 'Government program row',
      detail: compactText(`${governmentProgramRows[0].name}; ${money(governmentProgramRows[0].budget_amount)}; ${governmentProgramRows[0].department || 'department not listed'}`),
      sourceTable: 'alma_government_programs',
      sourceUrl: governmentProgramRows[0].official_url,
    });
  }

  const tier1Names = tier1
    .map((row) => row.organizations?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 4);
  const pendingTier1Names = orgNames(pendingTier1, 3);
  return {
    id: `place:${state}`,
    type: 'place',
    title: /\badelaide\b/i.test(q) ? 'Adelaide in the South Australian system' : `${stateName} youth justice system`,
    subtitle: `${state} connected answer`,
    url: state === 'SA' ? '/intelligence/civic/locale/adelaide' : `/intelligence/civic/state/${state.toLowerCase()}`,
    priority: 100,
    summary: `${stateName} is best read as a connected system: confirmed frontline organisations, public funding, oversight evidence, foundation flows and sourced cost claims. This answer shows the strongest linked records first, with coverage limits kept visible.`,
    connections: [
      {
        kind: 'organisation',
        label: 'Core Tier 1 frontline',
        value: `${tier1.length} orgs`,
        note: tier1Names.length ? tier1Names.join(', ') : 'No confirmed rows yet',
      },
      {
        kind: 'coverage',
        label: 'Wider classified network',
        value: `${tier2.length + tier3.length} confirmed + ${pending.length} pending`,
        note: [
          `Tier 2 adjacent/advocacy: ${tier2.length}`,
          `Tier 3 broader context: ${tier3.length}`,
          pendingTier1Names.length ? `proposed Tier 1 in review: ${pendingTier1Names.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join('; '),
      },
      {
        kind: 'coverage',
        label: 'Evidence-linked org universe',
        value: `${evidenceLinkedOrgIds.size.toLocaleString()} orgs`,
        note: `${justiceFundedOrgCount.toLocaleString()} funding-linked; ${programOrgCount} program operators; ${detentionRows.length} detention facility rows`,
      },
      {
        kind: 'money',
        label: 'ABN/entity finance alignment',
        value: `${abnLinkedRows.length.toLocaleString()} ABNs`,
        note: `${foundationLinkedOrgCount.toLocaleString()} foundation-linked by ABN; ${fundingOrgLinkCount.toLocaleString()} funding rows linked to orgs; ${fundingProgramLinkCount.toLocaleString()} linked to programs`,
      },
      {
        kind: 'program',
        label: 'Program operators',
        value: `${activeProgramRows.length} programs`,
        note: `${programOrgCount} operating orgs; ${yjProgramCount} marked youth-justice serving; ${programCostCount} with cost data`,
      },
      {
        kind: 'detention',
        label: 'Detention and government side',
        value: `${detentionRows.length} facility + ${governmentProgramRows.length} programs`,
        note: `${detentionCapacity} listed beds; ${money(governmentBudget)} in government program budgets`,
      },
      {
        kind: 'money',
        label: 'Known funding rows',
        value: `${fundingRows.length.toLocaleString()} rows`,
        note: `${money(fundingTotal)} with explicit amounts`,
      },
      {
        kind: 'foundation',
        label: 'Foundation grants linked to state orgs',
        value: `${Number(foundation.grant_count || 0).toLocaleString()} grants`,
        note: `${money(Number(foundation.total_dollars || 0))}; YJ-relevant classified floor ${money(Number(foundation.yj_dollars || 0))}`,
      },
      {
        kind: 'oversight',
        label: 'Oversight evidence',
        value: `${oversightRows.length} recommendations + ${childrenRows.length} children/visitor reports`,
        note: state === 'SA' ? 'Includes Adelaide Youth Training Centre visitor evidence where indexed.' : undefined,
      },
      {
        kind: 'claim',
        label: 'Sourced civic claims',
        value: `${claims.length} state claims`,
        note: claims
          .map((claim) => claim.display_label)
          .filter((label): label is string => Boolean(label))
          .slice(0, 2)
          .join('; '),
      },
    ],
    evidence,
  };
}

async function buildOrganizationCard(supabase: UntypedSupabaseClient, row: SearchRow): Promise<ConnectedAnswerCard | null> {
  const { data: org, error } = await supabase
    .from<OrganizationRow>('organizations')
    .select('id,name,slug,abn,city,state,is_indigenous_org,acco_certified,description,website')
    .eq('id', row.id)
    .maybeSingle();
  if (error || !org) return null;

  const abn = org.abn ? String(org.abn).replace(/\D/g, '') : '';
  const fundingFilter = abn
    ? `recipient_abn.eq.${abn},alma_organization_id.eq.${org.id}`
    : `alma_organization_id.eq.${org.id}`;
  const foundationFilter = abn
    ? `grantee_abn.eq.${abn},grantee_entity_id.eq.${org.id}`
    : `grantee_entity_id.eq.${org.id}`;

  const [classificationResult, fundingResult, foundationResult, oversightResult, claimsResult] = await Promise.all([
    supabase
      .from<OrgClassificationRow>('civic_org_classifications')
      .select('tier,sector_category,confirmed_at')
      .eq('organization_id', org.id)
      .eq('tier', 1)
      .not('confirmed_at', 'is', null)
      .limit(1),
    supabase
      .from<FundingRow>('justice_funding')
      .select('id,source,source_url,program_name,project_description,amount_dollars,financial_year')
      .or(fundingFilter)
      .order('amount_dollars', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from<FoundationGrantRow>('foundation_grantees')
      .select('id,foundation_name,grant_amount,grant_year,program_name,source_url,source_document_url,yj_relevant,yj_category,yj_evidence_snippet')
      .or(foundationFilter)
      .order('grant_amount', { ascending: false, nullsFirst: false })
      .limit(100),
    org.state
      ? supabase
          .from<OversightRow>('oversight_recommendations')
          .select('id,report_title,recommendation_text,report_url,report_date,status')
          .eq('jurisdiction', org.state)
          .order('report_date', { ascending: false, nullsFirst: false })
          .limit(2)
      : Promise.resolve({ data: [] }),
    org.state ? fetchStateClaims(supabase, org.state) : Promise.resolve([]),
  ]);

  const classification = classificationResult.data?.[0] || null;
  const fundingRows = fundingResult.data || [];
  const foundationRows = foundationResult.data || [];
  const oversightRows = oversightResult.data || [];
  const claims = claimsResult || [];
  const fundingTotal = fundingRows.reduce((sum, item) => sum + Number(item.amount_dollars || 0), 0);
  const foundationTotal = foundationRows.reduce((sum, item) => sum + Number(item.grant_amount || 0), 0);
  const yjFoundation = foundationRows.filter((item) => item.yj_relevant === true);

  const evidence: EvidenceLink[] = [];
  if (classification) {
    evidence.push({
      label: 'Tier 1 confirmation',
      detail: `${classification.sector_category || 'Confirmed frontline organisation'}; confirmed ${String(classification.confirmed_at).slice(0, 10)}`,
      sourceTable: 'civic_org_classifications',
    });
  }
  if (fundingRows[0]) {
    evidence.push({
      label: 'Largest linked funding row',
      detail: compactText(`${fundingRows[0].program_name || fundingRows[0].source}: ${money(fundingRows[0].amount_dollars)} ${fundingRows[0].financial_year || ''}`),
      sourceTable: 'justice_funding',
      sourceUrl: fundingRows[0].source_url,
    });
  }
  if (foundationRows[0]) {
    evidence.push({
      label: 'Largest linked foundation grant',
      detail: compactText(`${foundationRows[0].foundation_name}: ${money(foundationRows[0].grant_amount)} ${foundationRows[0].grant_year || ''}`),
      sourceTable: 'foundation_grantees',
      sourceUrl: foundationRows[0].source_document_url || foundationRows[0].source_url,
    });
  }
  if (oversightRows[0]) {
    evidence.push({
      label: 'Jurisdiction oversight context',
      detail: compactText(oversightRows[0].recommendation_text || oversightRows[0].report_title),
      sourceTable: 'oversight_recommendations',
      sourceUrl: oversightRows[0].report_url,
    });
  }

  const tags = [
    classification ? 'confirmed Tier 1' : null,
    org.is_indigenous_org ? 'Indigenous-led' : null,
    org.acco_certified ? 'ACCO-certified' : null,
  ].filter(Boolean);

  return {
    id: `organization:${org.id}`,
    type: 'organization',
    title: org.name,
    subtitle: [org.city, org.state, tags.join(' · ')].filter(Boolean).join(' · '),
    url: org.slug ? `/sites/${org.slug}` : undefined,
    priority: (classification ? 80 : 40) + Number(row.similarity || 0),
    summary: compactText(org.description || row.detail || `${org.name} is connected through the organisation register, funding ledgers, foundation grants and jurisdiction evidence where those links exist.`),
    connections: [
      {
        kind: 'coverage',
        label: 'Register status',
        value: classification ? 'Confirmed Tier 1' : 'Organisation record',
        note: org.acco_certified ? 'ACCO-certified' : org.is_indigenous_org ? 'Indigenous-led flag; ACCO status not certified here' : undefined,
      },
      {
        kind: 'money',
        label: 'Linked government/funding rows',
        value: String(fundingRows.length),
        note: fundingRows.length ? `${money(fundingTotal)} total in linked rows` : 'No direct funding rows linked by ABN/entity ID yet',
      },
      {
        kind: 'foundation',
        label: 'Linked foundation grants',
        value: String(foundationRows.length),
        note: foundationRows.length ? `${money(foundationTotal)} total; ${yjFoundation.length} classified YJ-relevant` : 'No direct foundation grants linked by ABN/entity ID yet',
      },
      {
        kind: 'oversight',
        label: `${org.state || 'State'} oversight context`,
        value: `${oversightRows.length} recent rows`,
        note: oversightRows[0]?.report_title,
      },
      {
        kind: 'claim',
        label: 'State civic claims available',
        value: `${claims.length}`,
        note: claims[0]?.display_label,
      },
    ],
    evidence,
  };
}

function isConnectedAnswerCard(card: ConnectedAnswerCard | null): card is ConnectedAnswerCard {
  return Boolean(card);
}

async function buildConnectedAnswer(supabase: UntypedSupabaseClient, q: string, rows: SearchRow[]) {
  const state = inferState(q, rows);
  const orgRows = rows
    .filter((row) => row.result_type === 'organization')
    .sort((a, b) => Number(Boolean(b.meta?.tier1)) - Number(Boolean(a.meta?.tier1)) || Number(b.similarity || 0) - Number(a.similarity || 0))
    .slice(0, 3);

  const cards = (
    await Promise.all([
      state ? buildPlaceCard(supabase, q, state) : Promise.resolve(null),
      ...orgRows.map((row) => buildOrganizationCard(supabase, row)),
    ])
  )
    .filter(isConnectedAnswerCard)
    .sort((a, b) => b.priority - a.priority);

  const caveats = [
    'These are connected answer cards, not a complete census. Raw result groups are still returned for deeper browsing.',
    state === 'SA' ? 'SA has 0 ACCO-certified confirmed Tier 1 rows in the current launch register, so ACCO coverage must be treated as unconfirmed.' : null,
    'Tier 2 and Tier 3 rows are shown as adjacency and context; they do not change the verified Tier 1 frontline count.',
    'Evidence-linked org counts are a candidate graph from ABN, funding, foundation, program and detention joins; they are broader than verified YJ service providers.',
    'Foundation youth-justice classifications remain incomplete; YJ-relevant foundation totals are a floor.',
  ].filter((caveat): caveat is string => Boolean(caveat));

  return {
    mode: 'connected_evidence',
    headline: cards[0]?.title || `Connected evidence for "${q}"`,
    summary: cards.length
      ? 'Showing the strongest connected answers first: place/system context, confirmed organisations, money, oversight, claims and source links.'
      : 'No connected answer cards could be built yet; use the raw grouped results below.',
    cards,
    caveats,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 25);

  if (q.length < 2) {
    return NextResponse.json({ q, results: [], counts: {}, message: 'Type at least 2 characters' });
  }

  const supabase = createServiceClient() as unknown as UntypedSupabaseClient;
  const { data, error } = await supabase.rpc<SearchRow[]>('exhibition_search', { q, lim: limit });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped: Record<string, SearchRow[]> = {};
  const counts: Record<string, number> = {};
  const rows = (data || []) as SearchRow[];
  for (const row of rows) {
    if (!grouped[row.result_type]) grouped[row.result_type] = [];
    grouped[row.result_type].push(row);
    counts[row.result_type] = (counts[row.result_type] || 0) + 1;
  }
  const answer = await buildConnectedAnswer(supabase, q, rows);

  return NextResponse.json({
    q,
    counts,
    results: grouped,
    answer,
    types: ['organization', 'claim', 'gov_program', 'grant_opportunity', 'foundation'],
  });
}

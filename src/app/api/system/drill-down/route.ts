import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// State column mapping for ROGS (state data is in columns, not rows)
const STATE_COL: Record<string, string> = {
  QLD: 'qld', NSW: 'nsw', VIC: 'vic', WA: 'wa',
  SA: 'sa', TAS: 'tas', ACT: 'act', NT: 'nt',
};

type QueryResult = {
  title: string;
  source: string;
  confidence: 'verified' | 'cross-referenced' | 'estimate';
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  rows: Record<string, string | number | null>[];
  total: number;
  lastUpdated: string;
};

// ── Query handlers ──

async function topSuppliers(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('justice_funding')
    .select('alma_organization_id, amount_dollars, organizations!justice_funding_alma_organization_id_fkey(name)')
    .eq('state', state)
    .not('alma_organization_id', 'is', null)
    .not('amount_dollars', 'is', null)
    .gt('amount_dollars', 0)
    .order('amount_dollars', { ascending: false })
    .limit(5000);

  if (error) throw new Error(error.message);

  const byOrg: Record<string, { name: string; total: number; count: number }> = {};
  for (const row of data || []) {
    const orgId = row.alma_organization_id as string;
    const orgData = row.organizations as any;
    const orgName = Array.isArray(orgData) ? orgData[0]?.name : orgData?.name;
    if (!byOrg[orgId]) byOrg[orgId] = { name: orgName || 'Unknown', total: 0, count: 0 };
    byOrg[orgId].total += Number(row.amount_dollars) || 0;
    byOrg[orgId].count++;
  }
  const sorted = Object.values(byOrg).sort((a, b) => b.total - a.total).slice(0, 30);

  return {
    title: `${state} Justice Funding — Top Suppliers`,
    source: `${state} Open Data Portal, QGIP, AusTender`,
    confidence: 'verified',
    columns: [
      { key: 'name', label: 'Organisation' },
      { key: 'total', label: 'Total Value', align: 'right' },
      { key: 'count', label: 'Records', align: 'right' },
    ],
    rows: sorted.map((s) => ({ name: s.name, total: s.total, count: s.count })),
    total: sorted.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function rogsDetentionCost(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const col = STATE_COL[state] || 'qld';
  const { data, error } = await supabase
    .from('rogs_justice_spending')
    .select('*')
    .eq('rogs_section', 'youth_justice')
    .eq('rogs_table', '17A.20')
    .order('financial_year', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((r: any) => ({
    year: r.financial_year,
    description: r.description3 || r.description2 || r.description,
    value: r[col] != null ? Number(r[col]) : null,
    unit: r.unit,
  }));

  return {
    title: `${state} Detention Cost Per Day (ROGS 17A.20)`,
    source: 'Productivity Commission, ROGS 2025',
    confidence: 'verified',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'description', label: 'Measure' },
      { key: 'value', label: 'Value', align: 'right' },
      { key: 'unit', label: 'Unit' },
    ],
    rows,
    total: rows.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function rogsCommunityCost(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const col = STATE_COL[state] || 'qld';
  const { data, error } = await supabase
    .from('rogs_justice_spending')
    .select('*')
    .eq('rogs_section', 'youth_justice')
    .eq('rogs_table', '17A.21')
    .order('financial_year', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((r: any) => ({
    year: r.financial_year,
    description: r.description3 || r.description2 || r.description,
    value: r[col] != null ? Number(r[col]) : null,
    unit: r.unit,
  }));

  return {
    title: `${state} Community Supervision Cost (ROGS 17A.21)`,
    source: 'Productivity Commission, ROGS 2025',
    confidence: 'verified',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'description', label: 'Measure' },
      { key: 'value', label: 'Value', align: 'right' },
      { key: 'unit', label: 'Unit' },
    ],
    rows,
    total: rows.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function rogsExpenditure(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const col = STATE_COL[state] || 'qld';
  const { data, error } = await supabase
    .from('rogs_justice_spending')
    .select('*')
    .eq('rogs_section', 'youth_justice')
    .eq('rogs_table', '17A.10')
    .order('financial_year', { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((r: any) => ({
    year: r.financial_year,
    description: r.description3 || r.description2 || r.description,
    value_thousands: r[col] != null ? Number(r[col]) : null,
    unit: r.unit || '$\'000',
  }));

  return {
    title: `${state} YJ Total Expenditure (ROGS 17A.10)`,
    source: 'Productivity Commission, ROGS 2025',
    confidence: 'verified',
    columns: [
      { key: 'year', label: 'Year' },
      { key: 'description', label: 'Category' },
      { key: 'value_thousands', label: 'Value ($\'000)', align: 'right' },
      { key: 'unit', label: 'Unit' },
    ],
    rows,
    total: rows.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function fundingBySource(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('justice_funding')
    .select('source, amount_dollars')
    .eq('state', state)
    .limit(5000);

  if (error) throw new Error(error.message);

  const bySource: Record<string, { total: number; count: number }> = {};
  for (const row of data || []) {
    const src = (row.source as string) || 'Unknown';
    if (!bySource[src]) bySource[src] = { total: 0, count: 0 };
    bySource[src].total += Number(row.amount_dollars) || 0;
    bySource[src].count++;
  }

  const sorted = Object.entries(bySource)
    .map(([source, vals]) => ({ source, total: vals.total, count: vals.count }))
    .sort((a, b) => b.total - a.total);

  return {
    title: `${state} Justice Funding by Source`,
    source: `${state} Open Data Portal, AusTender, NIAA`,
    confidence: 'verified',
    columns: [
      { key: 'source', label: 'Source' },
      { key: 'total', label: 'Total Value', align: 'right' },
      { key: 'count', label: 'Records', align: 'right' },
    ],
    rows: sorted,
    total: sorted.reduce((s, r) => s + r.count, 0),
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function interventions(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('alma_interventions')
    .select('name, evidence_level, cost_per_young_person, portfolio_score, organizations(name, state)')
    .neq('verification_status', 'ai_generated')
    .contains('geography', [state])
    .order('portfolio_score', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((r: any) => {
    const org = Array.isArray(r.organizations) ? r.organizations[0] : r.organizations;
    const level = r.evidence_level ? r.evidence_level.split('(')[0].trim() : 'Untested';
    return {
      name: r.name,
      organisation: org?.name || '--',
      evidence: level,
      cost: r.cost_per_young_person,
      score: r.portfolio_score?.toFixed(1) ?? '--',
    };
  });

  return {
    title: `${state} Verified Interventions`,
    source: 'ALMA Database, JusticeHub research',
    confidence: 'cross-referenced',
    columns: [
      { key: 'name', label: 'Intervention' },
      { key: 'organisation', label: 'Organisation' },
      { key: 'evidence', label: 'Evidence' },
      { key: 'cost', label: 'Cost/YP', align: 'right' },
      { key: 'score', label: 'Score', align: 'right' },
    ],
    rows,
    total: rows.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function spotlightFunding(state: string): Promise<QueryResult> {
  const supabase = getClient();
  // NQ locations for QLD; for other states this is a generic location query
  const locations = state === 'QLD'
    ? ['Townsville', 'Cairns', 'Mount Isa', 'Palm Island']
    : [];

  if (locations.length === 0) {
    return {
      title: `${state} Regional Spotlight Funding`,
      source: `${state} Open Data Portal`,
      confidence: 'estimate',
      columns: [{ key: 'note', label: 'Note' }],
      rows: [{ note: 'Regional spotlight data not available for this state' }],
      total: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }

  const { data, error } = await supabase
    .from('justice_funding')
    .select('description, amount_dollars, source, organizations!justice_funding_alma_organization_id_fkey(name)')
    .eq('state', state)
    .limit(500);

  if (error) throw new Error(error.message);

  // Filter rows mentioning spotlight locations in description or org name
  const matchingRows = (data || []).filter((r: any) => {
    const desc = ((r.description as string) || '').toLowerCase();
    const orgData = r.organizations as any;
    const orgName = (Array.isArray(orgData) ? orgData[0]?.name : orgData?.name || '').toLowerCase();
    return locations.some(loc => desc.includes(loc.toLowerCase()) || orgName.includes(loc.toLowerCase()));
  });

  const rows = matchingRows.slice(0, 50).map((r: any) => {
    const orgData = r.organizations as any;
    const orgName = Array.isArray(orgData) ? orgData[0]?.name : orgData?.name;
    return {
      organisation: orgName || '--',
      description: r.description ? String(r.description).slice(0, 80) : '--',
      amount: Number(r.amount_dollars) || 0,
      source: r.source || '--',
    };
  });

  return {
    title: `${state} Regional Spotlight — Funding Records`,
    source: `${state} Open Data Portal, QGIP`,
    confidence: 'verified',
    columns: [
      { key: 'organisation', label: 'Organisation' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', align: 'right' },
      { key: 'source', label: 'Source' },
    ],
    rows,
    total: matchingRows.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

async function crossoverStats(state: string): Promise<QueryResult> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('cross_system_stats')
    .select('*')
    .or(`state.eq.${state},state.eq.National`)
    .order('domain')
    .limit(100);

  if (error) throw new Error(error.message);

  const rows = (data || []).map((r: any) => ({
    domain: r.domain,
    metric: r.metric,
    value: r.value,
    unit: r.unit,
    state: r.state,
    source: r.source_name || '--',
    year: r.financial_year || '--',
  }));

  return {
    title: `${state} Cross-System Statistics`,
    source: 'AIHW, BOCSAR, QFCC, DSS',
    confidence: 'verified',
    columns: [
      { key: 'domain', label: 'Domain' },
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value', align: 'right' },
      { key: 'unit', label: 'Unit' },
      { key: 'state', label: 'Scope' },
      { key: 'year', label: 'Year' },
    ],
    rows,
    total: rows.length,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// ── Org Detail (funding history + interventions + org info) ──

async function orgDetail(state: string, orgName: string): Promise<QueryResult> {
  const supabase = getClient();

  // Find all org records matching this name (may have multiple IDs)
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, abn, website, is_indigenous_org, state, acnc_data')
    .eq('name', orgName);

  const org = orgs?.[0];
  if (!org) {
    return {
      title: `Organisation: ${orgName}`,
      source: 'Not found',
      confidence: 'estimate',
      columns: [{ key: 'message', label: 'Status' }],
      rows: [{ message: 'Organisation not found in database' }],
      total: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }

  const orgIds = (orgs || []).map((o: any) => o.id);

  // Fetch funding by FY + interventions in parallel
  // Use primary org ID with .eq() (most orgs have single ID)
  const primaryId = orgIds[0];

  const [fundingRes, interventionsRes] = await Promise.all([
    supabase
      .from('justice_funding')
      .select('financial_year, amount_dollars, source')
      .eq('alma_organization_id', primaryId)
      .not('financial_year', 'is', null)
      .not('amount_dollars', 'is', null)
      .order('financial_year', { ascending: false })
      .limit(500),
    supabase
      .from('alma_interventions')
      .select('name, evidence_level, cost_per_young_person, portfolio_score')
      .eq('operating_organization_id', primaryId)
      .neq('verification_status', 'ai_generated')
      .order('portfolio_score', { ascending: false })
      .limit(20),
  ]);

  // Aggregate funding by FY
  const fyMap: Record<string, { total: number; count: number; sources: Set<string> }> = {};
  for (const row of (fundingRes.data || [])) {
    const fy = row.financial_year as string;
    if (!fyMap[fy]) fyMap[fy] = { total: 0, count: 0, sources: new Set() };
    fyMap[fy].total += Number(row.amount_dollars) || 0;
    fyMap[fy].count++;
    if (row.source) fyMap[fy].sources.add(row.source as string);
  }

  const fundingRows = Object.entries(fyMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([fy, data]) => ({
      fy,
      total: data.total,
      records: data.count,
      sources: [...data.sources].join(', '),
    }));

  const totalFunding = fundingRows.reduce((s, r) => s + r.total, 0);
  const totalRecords = fundingRows.reduce((s, r) => s + r.records, 0);

  // Build intervention summary
  const intvRows = (interventionsRes.data || []).map((i: any) => ({
    name: i.name,
    evidence: i.evidence_level ? i.evidence_level.split('(')[0].trim() : 'Untested',
    cost: i.cost_per_young_person,
    score: i.portfolio_score,
  }));

  // Combine into sections using a special format
  const rows: Record<string, any>[] = [];

  // Org info section
  rows.push({ fy: '── ORG INFO ──', total: null, records: null, sources: '' });
  rows.push({ fy: 'ABN', total: null, records: null, sources: org.abn || 'Unknown' });
  rows.push({ fy: 'State', total: null, records: null, sources: org.state || state });
  rows.push({ fy: 'Indigenous', total: null, records: null, sources: org.is_indigenous_org ? 'Yes' : 'No' });
  if (org.website) rows.push({ fy: 'Website', total: null, records: null, sources: org.website });

  // Funding section
  rows.push({ fy: '── FUNDING BY FY ──', total: totalFunding, records: totalRecords, sources: '' });
  rows.push(...fundingRows);

  // Interventions section
  if (intvRows.length > 0) {
    rows.push({ fy: '── PROGRAMS ──', total: null, records: intvRows.length, sources: '' });
    for (const intv of intvRows) {
      rows.push({
        fy: intv.name,
        total: intv.cost,
        records: intv.score?.toFixed(1) || '—',
        sources: intv.evidence,
      });
    }
  }

  return {
    title: `${orgName}`,
    source: `${state} Open Data Portal, QGIP, AusTender, ALMA`,
    confidence: state === 'QLD' ? 'verified' : 'estimate',
    columns: [
      { key: 'fy', label: 'Item', align: 'left' },
      { key: 'total', label: 'Value', align: 'right' },
      { key: 'records', label: 'Records/Score', align: 'right' },
      { key: 'sources', label: 'Detail', align: 'left' },
    ],
    rows,
    total: totalRecords,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// ── Route handler ──

const QUERY_MAP: Record<string, (state: string) => Promise<QueryResult>> = {
  'top-suppliers': topSuppliers,
  'rogs-detention-cost': rogsDetentionCost,
  'rogs-community-cost': rogsCommunityCost,
  'rogs-expenditure': rogsExpenditure,
  'funding-by-source': fundingBySource,
  'interventions': interventions,
  'spotlight-funding': spotlightFunding,
  'crossover-stats': crossoverStats,
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const state = searchParams.get('state')?.toUpperCase();
  const orgName = searchParams.get('org');

  if (!id || !state) {
    return NextResponse.json({ error: 'Missing id or state parameter' }, { status: 400 });
  }

  try {
    let result: QueryResult;
    if (id === 'org-detail' && orgName) {
      result = await orgDetail(state, orgName);
    } else {
      const handler = QUERY_MAP[id];
      if (!handler) {
        return NextResponse.json({ error: `Unknown query ID: ${id}` }, { status: 400 });
      }
      result = await handler(state);
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err: any) {
    console.error(`[drill-down] Error for ${id}/${state}:`, err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

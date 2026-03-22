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

  if (!id || !state) {
    return NextResponse.json({ error: 'Missing id or state parameter' }, { status: 400 });
  }

  const handler = QUERY_MAP[id];
  if (!handler) {
    return NextResponse.json({ error: `Unknown query ID: ${id}` }, { status: 400 });
  }

  try {
    const result = await handler(state);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err: any) {
    console.error(`[drill-down] Error for ${id}/${state}:`, err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

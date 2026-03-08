import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/justice-funding
 *
 * Query params:
 *   q=search text         Full-text search across recipient, program, description, location
 *   state=QLD             Filter by state
 *   sector=youth_justice  Filter by sector
 *   source=brisbane_council  Filter by data source
 *   year=2023-24          Filter by financial year
 *   org=uuid              Filter by ALMA organization ID
 *   abn=12345678901       Filter by ABN
 *   indigenous=true       Filter to Indigenous-led orgs only
 *   min_amount=1000       Minimum funding amount
 *   max_amount=500000     Maximum funding amount
 *   limit=50              Results per page (default 50, max 500)
 *   offset=0              Pagination offset
 *   view=summary|by_org|by_program|overview|by_sector|by_year|top_recipients
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const view = params.get('view');
  const stateFilter = params.get('state') || 'QLD';

  // Aggregated overview for the dashboard
  if (view === 'overview') {
    const { data, error } = await supabase.rpc('justice_funding_overview', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    // Fallback: run inline SQL via summary views
    const { data: summary } = await supabase.from('v_justice_funding_summary').select('*');
    return NextResponse.json(summary);
  }

  if (view === 'by_sector') {
    const { data, error } = await supabase.rpc('justice_funding_by_sector', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  if (view === 'by_year') {
    const { data, error } = await supabase.rpc('justice_funding_by_year', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  // Org profile: money + interventions + outcomes in one call
  if (view === 'org_profile') {
    const orgId = params.get('org');
    if (!orgId) return NextResponse.json({ error: 'org parameter required' }, { status: 400 });
    const { data, error } = await supabase.rpc('justice_funding_org_profile', { p_org_id: orgId });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  if (view === 'top_recipients') {
    const sectorParam = params.get('sector');
    const yearParam = params.get('year');
    const indigenousParam = params.get('indigenous');
    const limitParam = Math.min(parseInt(params.get('limit') || '25'), 100);
    const { data, error } = await supabase.rpc('justice_funding_top_recipients', {
      p_state: stateFilter,
      p_sector: sectorParam || null,
      p_year: yearParam || null,
      p_indigenous_only: indigenousParam === 'true',
      p_limit: limitParam,
    });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  // Power concentration analysis
  if (view === 'power') {
    const { data, error } = await supabase.rpc('justice_funding_power_concentration', { p_state: stateFilter });
    if (!error && data) return NextResponse.json(data);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  // Legacy summary views
  if (view === 'summary') {
    const { data, error } = await supabase.from('v_justice_funding_summary').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'by_org') {
    const { data, error } = await supabase.from('v_justice_funding_by_org').select('*').limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'by_program') {
    const { data, error } = await supabase.from('v_justice_funding_by_program').select('*').limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Build query
  let query = supabase
    .from('justice_funding')
    .select('*', { count: 'exact' });

  // Filters
  const q = params.get('q');
  const sector = params.get('sector');
  const source = params.get('source');
  const year = params.get('year');
  const org = params.get('org');
  const abn = params.get('abn');
  const indigenous = params.get('indigenous');
  const minAmount = params.get('min_amount');
  const maxAmount = params.get('max_amount');
  const limit = Math.min(parseInt(params.get('limit') || '50'), 500);
  const offset = parseInt(params.get('offset') || '0');

  if (q) {
    const searchTerm = `%${q}%`;
    query = query.or(
      `recipient_name.ilike.${searchTerm},program_name.ilike.${searchTerm},project_description.ilike.${searchTerm},location.ilike.${searchTerm}`
    );
  }
  if (stateFilter) query = query.eq('state', stateFilter.toUpperCase());
  if (sector) query = query.eq('sector', sector);
  if (source) query = query.eq('source', source);
  if (year) query = query.eq('financial_year', year);
  if (org) query = query.eq('alma_organization_id', org);
  if (abn) query = query.eq('recipient_abn', abn);
  if (indigenous === 'true') {
    query = query.or(
      'recipient_name.ilike.%aboriginal%,recipient_name.ilike.%torres strait%,recipient_name.ilike.%indigenous%,recipient_name.ilike.%murri%,recipient_name.ilike.%first nations%'
    );
  }
  if (minAmount) query = query.gte('amount_dollars', parseFloat(minAmount));
  if (maxAmount) query = query.lte('amount_dollars', parseFloat(maxAmount));

  query = query
    .order('amount_dollars', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    records: data,
    total: count,
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
  });
}

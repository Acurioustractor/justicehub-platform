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
 *   org=uuid              Filter by ALMA organization ID
 *   abn=12345678901       Filter by ABN
 *   min_amount=1000       Minimum funding amount
 *   max_amount=500000     Maximum funding amount
 *   limit=50              Results per page (default 50, max 500)
 *   offset=0              Pagination offset
 *   view=summary          Use summary view (by_org, by_program, summary)
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const view = params.get('view');

  // Summary views
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
  const state = params.get('state');
  const sector = params.get('sector');
  const source = params.get('source');
  const org = params.get('org');
  const abn = params.get('abn');
  const minAmount = params.get('min_amount');
  const maxAmount = params.get('max_amount');
  const limit = Math.min(parseInt(params.get('limit') || '50'), 500);
  const offset = parseInt(params.get('offset') || '0');

  if (q) {
    // Use ilike for simple search since textSearch requires a tsvector column
    const searchTerm = `%${q}%`;
    query = query.or(
      `recipient_name.ilike.${searchTerm},program_name.ilike.${searchTerm},project_description.ilike.${searchTerm},location.ilike.${searchTerm}`
    );
  }
  if (state) query = query.eq('state', state.toUpperCase());
  if (sector) query = query.eq('sector', sector);
  if (source) query = query.eq('source', source);
  if (org) query = query.eq('alma_organization_id', org);
  if (abn) query = query.eq('recipient_abn', abn);
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

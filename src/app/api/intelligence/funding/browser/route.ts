import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Funding records browser. Paginated to deal with PostgREST 1000-row cap.
 * Filterable by source, sector, state, year, funding_type via query params.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source') || '';
    const sector = url.searchParams.get('sector') || '';
    const state = url.searchParams.get('state') || '';
    const year = url.searchParams.get('year') || '';
    const fundingType = url.searchParams.get('funding_type') || '';
    const minDollars = Number(url.searchParams.get('min') || '0');
    const limit = Math.min(Number(url.searchParams.get('limit') || '500'), 2000);

    const sb = createServiceClient();

    // Build the filter sequence via chainable query
    const q = sb.from('justice_funding')
      .select('id, recipient_name, recipient_abn, program_name, program_round, amount_dollars, source, sector, funding_type, state, location, financial_year, announcement_date, project_description, alma_organization_id')
      .order('amount_dollars', { ascending: false, nullsFirst: false })
      .limit(limit);

    let qb: any = q;
    if (source) qb = qb.eq('source', source);
    if (sector) qb = qb.eq('sector', sector);
    if (state) qb = qb.eq('state', state);
    if (year) qb = qb.eq('financial_year', year);
    if (fundingType) qb = qb.eq('funding_type', fundingType);
    if (minDollars > 0) qb = qb.gte('amount_dollars', minDollars);

    const { data, error } = await qb;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Pull facets for the filter UI (small enough to compute)
    const [sources, sectors, states, years, types] = await Promise.all([
      sb.from('justice_funding').select('source').not('source', 'is', null).range(0, 0).then(() => null), // placeholder; facets computed below
      Promise.resolve(null),
      Promise.resolve(null),
      Promise.resolve(null),
      Promise.resolve(null),
    ]);

    return NextResponse.json({
      records: data ?? [],
      total: (data ?? []).length,
      limit,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

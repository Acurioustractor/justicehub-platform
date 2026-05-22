import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/** Return distinct values + per-value totals for the funding filter chips. */
export async function GET() {
  try {
    const sb = createServiceClient();
    const { data: aggData, error } = await sb.rpc('get_yj_funding_facets');
    if (!error && aggData) {
      return NextResponse.json(aggData);
    }
    // Fallback if RPC missing — manual aggregation
    const { data: rows } = await sb
      .from('justice_funding')
      .select('source, sector, state, funding_type, financial_year, amount_dollars')
      .range(0, 200000);
    const tally = (key: string) => {
      const m = new Map<string, { count: number; total: number }>();
      for (const r of rows ?? []) {
        const v = (r as any)[key] || '(none)';
        const t = m.get(v) || { count: 0, total: 0 };
        t.count++;
        t.total += Number((r as any).amount_dollars) || 0;
        m.set(v, t);
      }
      return Array.from(m.entries())
        .map(([key, v]) => ({ key, count: v.count, total: v.total }))
        .sort((a, b) => b.total - a.total);
    };
    return NextResponse.json({
      sources: tally('source'),
      sectors: tally('sector'),
      states: tally('state'),
      funding_types: tally('funding_type'),
      financial_years: tally('financial_year'),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

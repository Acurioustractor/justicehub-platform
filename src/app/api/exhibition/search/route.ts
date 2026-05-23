import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 25);

  if (q.length < 2) {
    return NextResponse.json({ q, results: [], counts: {}, message: 'Type at least 2 characters' });
  }

  const supabase = createServiceClient() as any;
  const { data, error } = await supabase.rpc('exhibition_search', { q, lim: limit });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped: Record<string, any[]> = {};
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    if (!grouped[row.result_type]) grouped[row.result_type] = [];
    grouped[row.result_type].push(row);
    counts[row.result_type] = (counts[row.result_type] || 0) + 1;
  }

  return NextResponse.json({
    q,
    counts,
    results: grouped,
    types: ['organization', 'claim', 'gov_program', 'grant_opportunity', 'foundation'],
  });
}

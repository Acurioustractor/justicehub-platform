import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// PostgREST caps RPC results at 1000 rows; paginate to pull all 1,697 programs.
export async function GET() {
  try {
    const sb = createServiceClient();
    const all: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (from < 50000) {
      const { data, error } = await sb.rpc('get_yj_programs_for_browser').range(from, from + PAGE - 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return NextResponse.json({ programs: all, total: all.length });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

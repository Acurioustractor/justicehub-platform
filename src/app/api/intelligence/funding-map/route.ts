import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  processLgaData,
  type LgaRow,
  type FundingDesertRow,
  type FundingByLgaRow,
} from '@/lib/intelligence/funding-map-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const sb = supabase as any; // Views not in typed schema

    const [lgaRes, desertsRes, fundingByLgaRes] = await Promise.all([
      sb.from('lga_cross_system_stats').select('*'),
      sb.from('mv_funding_deserts').select('*'),
      sb.from('mv_funding_by_lga').select('*'),
    ]);

    if (lgaRes.error) {
      return NextResponse.json(
        { error: 'Failed to fetch LGA stats', detail: lgaRes.error.message },
        { status: 500 }
      );
    }

    const lgas: LgaRow[] = lgaRes.data ?? [];
    const deserts: FundingDesertRow[] = desertsRes.data ?? [];
    const fundingByLga: FundingByLgaRow[] = fundingByLgaRes.data ?? [];

    const { classified, summary } = processLgaData(lgas, deserts, fundingByLga);

    return NextResponse.json({ classified, summary });
  } catch (err: any) {
    console.error('[funding-map API]', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: err?.message },
      { status: 500 }
    );
  }
}

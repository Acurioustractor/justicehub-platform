import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/** Org-centric browser endpoint. Tier classification + funding + ACNC + program rollup. */
export async function GET() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc('get_yj_orgs_for_browser');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const all = (data ?? []) as any[];
    const byTier: Record<string, any[]> = {
      heavy_lifter: [],
      established: [],
      verified: [],
      emerging: [],
    };
    for (const r of all) {
      (byTier[r.tier] ||= []).push(r);
    }
    // Sort each tier by funding desc, then program_count desc
    for (const tier of Object.keys(byTier)) {
      byTier[tier].sort((a, b) => {
        const fd = Number(b.funding_total || 0) - Number(a.funding_total || 0);
        if (fd !== 0) return fd;
        return (b.program_count || 0) - (a.program_count || 0);
      });
    }

    return NextResponse.json({
      total: all.length,
      tiers: {
        heavy_lifter: byTier.heavy_lifter,
        established: byTier.established,
        verified: byTier.verified,
        emerging: byTier.emerging,
      },
      summary: {
        heavy_lifter: byTier.heavy_lifter.length,
        established: byTier.established.length,
        verified: byTier.verified.length,
        emerging: byTier.emerging.length,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

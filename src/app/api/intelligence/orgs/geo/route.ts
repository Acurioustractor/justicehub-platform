import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Org-level geo endpoint — canonical Grantscope registry.
 *
 *   alma_interventions → organizations → gs_entities → postcode_geo
 *
 * No invented coordinates. Org is plotted only if its gs_entity postcode
 * has a real lat/lng in postcode_geo. Unmappable orgs returned with
 * `unmappable_reason` so we can fix the upstream data, not paper over it.
 */
export async function GET() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc('get_yj_orgs_for_map');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const all = (data ?? []) as Array<{
      org_id: string; name: string; abn: string | null;
      state: string | null; postcode: string | null; locality: string | null;
      lga_name: string | null; remoteness: string | null; sector: string | null;
      community_controlled: boolean; cc_tier: string | null;
      program_count: number; lat: number | null; lng: number | null;
      unmappable_reason: string | null;
    }>;

    const points = all.filter((r) => r.lat !== null && r.lng !== null).map((r) => ({
      id: r.org_id,
      name: r.name,
      abn: r.abn,
      state: r.state,
      postcode: r.postcode,
      locality: r.locality,
      lga: r.lga_name,
      remoteness: r.remoteness,
      sector: r.sector,
      community_controlled: r.community_controlled,
      cc_tier: r.cc_tier,
      program_count: r.program_count,
      lat: Number(r.lat),
      lng: Number(r.lng),
      confidence: 'postcode_centroid',
    }));

    const unmappable = all.filter((r) => r.lat === null);
    const unmappable_breakdown: Record<string, number> = {
      no_gs_entity_link: 0,
      no_postcode_in_gs_entity: 0,
      postcode_not_geocoded: 0,
    };
    for (const u of unmappable) {
      const k = u.unmappable_reason || 'unknown';
      unmappable_breakdown[k] = (unmappable_breakdown[k] ?? 0) + 1;
    }

    return NextResponse.json({
      points,
      total: points.length,
      unmappable_total: unmappable.length,
      unmappable_breakdown,
      architecture: 'alma_interventions → organizations → gs_entities → postcode_geo',
      confidence: 'Postcode-centroid lat/lng only. No invented coordinates.',
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

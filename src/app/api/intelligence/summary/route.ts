import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Lightweight summary endpoint for the interventions page stat strip.
 * Calls the same get_contained_intel_summary RPC the tour intelligence uses,
 * but skips all the heavy per-stop joins so it returns in <100ms.
 */
export async function GET() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc('get_contained_intel_summary');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const s = (data && data[0]) || {};

    return NextResponse.json({
      programsCatalogued: s.programs_catalogued ?? 0,
      strongEvidenceCount: s.strong_evidence_count ?? 0,
      orgsIndexed: s.orgs_indexed ?? 0,
      indigenousLedOrgs: s.indigenous_led_orgs ?? 0,
      fundingTrackedBillions: (Number(s.funding_tracked_dollars) || 0) / 1_000_000_000,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

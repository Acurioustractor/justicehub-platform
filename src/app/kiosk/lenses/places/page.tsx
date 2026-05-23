/**
 * /kiosk/lenses/places — PLACES lens.
 *
 * Eight state tiles, SA pulsing brightest (the kiosk venue). Each tile is a
 * named-org count + cost ratio for that state. Tap to drill into the
 * existing /intelligence/civic/state/[code] page.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../../components/LensBar';

export const revalidate = 600;

interface StateRow {
  code: string;
  name: string;
  tier1Count: number;
  costRatio: number | null;
}

const STATES: { code: string; name: string }[] = [
  { code: 'sa', name: 'South Australia' },
  { code: 'nt', name: 'Northern Territory' },
  { code: 'qld', name: 'Queensland' },
  { code: 'wa', name: 'Western Australia' },
  { code: 'nsw', name: 'New South Wales' },
  { code: 'vic', name: 'Victoria' },
  { code: 'tas', name: 'Tasmania' },
  { code: 'act', name: 'Australian Capital Territory' },
];

async function getStateData(): Promise<StateRow[]> {
  const supabase = createServiceClient() as any;
  const [orgsRes, ratioRes] = await Promise.all([
    supabase.from('organizations').select('id, state').eq('is_active', true),
    supabase
      .from('civic_intelligence_claims')
      .select('claim_id, value_numeric')
      .like('claim_id', 'access.ratio.detention_vs_community_cost.%')
      .in('verification_status', ['snapshot', 'verified']),
  ]);
  const orgs = orgsRes.data || [];

  // Tier 1 count per state (confirmed)
  const { data: classRows } = await supabase
    .from('civic_org_classifications')
    .select('organization_id')
    .eq('tier', 1)
    .not('confirmed_at', 'is', null);
  const tier1Set = new Set((classRows || []).map((c: any) => c.organization_id));
  const tier1ByState = new Map<string, number>();
  for (const o of orgs) {
    if (!o.state || !tier1Set.has(o.id)) continue;
    tier1ByState.set(o.state, (tier1ByState.get(o.state) || 0) + 1);
  }

  const ratioByState = new Map<string, number>();
  for (const r of ratioRes.data || []) {
    const m = r.claim_id.match(/\.([a-z]+)$/);
    if (m) ratioByState.set(m[1].toUpperCase(), Number(r.value_numeric));
  }

  return STATES.map((s) => ({
    code: s.code,
    name: s.name,
    tier1Count: tier1ByState.get(s.code.toUpperCase()) || 0,
    costRatio: ratioByState.get(s.code.toUpperCase()) || null,
  }));
}

export default async function PlacesLensPage() {
  const states = await getStateData();
  const sa = states.find((s) => s.code === 'sa')!;
  const rest = states.filter((s) => s.code !== 'sa');
  // Order by extremity of cost ratio so the headline numbers surface first.
  rest.sort((a, b) => (b.costRatio || 0) - (a.costRatio || 0));

  return (
    <>
      <LensBar current="places" />
      <div className="flex-1 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">
            Eight jurisdictions · the work happens in places
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Where it happens.</h1>
          <p className="text-base sm:text-lg text-stone-700 max-w-2xl mb-8">
            Each state has its own cost gap, its own Tier 1 orgs, its own foundation flows. Tap to drill in.
          </p>

          {/* SA hero card */}
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-3">You are here</p>
            <Link
              href={`/intelligence/civic/state/${sa.code}`}
              className="block border-4 border-emerald-500 bg-white hover:border-emerald-700 p-6 sm:p-8 rounded transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-700 mb-2">SA</p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{sa.name}</h2>
                  <p className="mt-2 text-base text-stone-700">{sa.tier1Count} confirmed Tier 1 orgs</p>
                </div>
                {sa.costRatio != null && (
                  <div className="text-right">
                    <p className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {sa.costRatio.toFixed(1)}×
                    </p>
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500">cost gap</p>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Other states */}
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-3">Across Australia · sorted by cost gap</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map((s) => (
              <li key={s.code}>
                <Link
                  href={`/intelligence/civic/state/${s.code}`}
                  className="block border-2 border-stone-300 bg-white hover:border-stone-900 p-5 rounded transition-colors min-h-[120px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500">{s.code.toUpperCase()}</p>
                      <h3 className="mt-1 text-xl font-bold tracking-tight">{s.name}</h3>
                      <p className="mt-1 text-sm text-stone-600">{s.tier1Count} Tier 1 orgs</p>
                    </div>
                    {s.costRatio != null && (
                      <div className="text-right">
                        <p className="text-3xl sm:text-4xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {s.costRatio.toFixed(1)}×
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

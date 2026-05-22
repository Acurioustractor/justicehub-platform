import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SnapshotStatCard } from '@/components/intelligence/civic/SnapshotStatCard';
import { getAllClaims } from '@/lib/civic-intelligence/queries';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Youth detention in Australia · Civic Intelligence | JusticeHub',
  description:
    'The cost, the capacity, the population. Every youth detention centre in Australia, side by side with community supervision spend. Sourced from ROGS 2024-25.',
};

const STATE_CODES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'] as const;
const STATE_FULL: Record<string, string> = {
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  wa: 'Western Australia',
  sa: 'South Australia',
  tas: 'Tasmania',
  act: 'Australian Capital Territory',
  nt: 'Northern Territory',
};

interface DetentionFacility {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string;
  capacity: number;
  security: string | null;
  government_department: string | null;
}

async function fetchFacilities(): Promise<DetentionFacility[]> {
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, city, state, acnc_data')
    .eq('type', 'detention_centre')
    .neq('archived', true)
    .eq('is_active', true)
    .order('state', { ascending: true })
    .order('name', { ascending: true });
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    state: row.state,
    capacity: Number(row.acnc_data?.detention_meta?.capacity_beds || 0),
    security: row.acnc_data?.detention_meta?.security_level || null,
    government_department: row.acnc_data?.detention_meta?.government_department || null,
  }));
}

export default async function DetentionPage() {
  const [claims, facilities] = await Promise.all([getAllClaims(), fetchFacilities()]);

  const ratio = claims['access.ratio.detention_vs_community_cost.national'];
  const detentionAnnualNational = claims['access.cost.detention_per_youth.annual.national'];
  const communityAnnualNational = claims['access.cost.community_per_youth.annual.national'];
  const detentionTotalNational = claims['access.cost.detention_total.national'];
  const communityTotalNational = claims['access.cost.community_total.national'];
  const detentionPopNational = claims['access.count.detention_avg_daily_pop.national'];
  const communityPopNational = claims['access.count.community_avg_daily_pop.national'];
  const detentionBedsNational = claims['access.count.detention_beds.national'];
  const recidNational = claims['oversight.rate.return_to_supervision.national'];

  const facilitiesByState: Record<string, DetentionFacility[]> = {};
  for (const f of facilities) {
    if (!facilitiesByState[f.state]) facilitiesByState[f.state] = [];
    facilitiesByState[f.state].push(f);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">Detention</span>
          <Link href="/intelligence/civic/methodology" className="ml-auto text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            Methodology
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-stone-900 text-stone-50 px-6 py-20 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">Detention · National Picture · ROGS 2024-25</p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            What it costs to lock up one young person for a year.
          </h1>
          <p className="mt-5 max-w-2xl text-lg md:text-xl text-stone-300">
            Every youth detention centre in Australia, every dollar Government spends, every young person held on the
            average day. Side by side with what the same money funds in community.
          </p>
        </div>
      </section>

      {/* Headline ratio */}
      {ratio && (
        <section className="px-6 py-16 border-b border-stone-200">
          <div className="max-w-5xl mx-auto">
            <div className="border-2 border-rose-300 bg-rose-50 rounded-lg p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-rose-700 mb-3">The cost gap</p>
              <SnapshotStatCard claim={ratio} accent="urgent" size="lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {detentionAnnualNational && <SnapshotStatCard claim={detentionAnnualNational} accent="urgent" />}
                {communityAnnualNational && <SnapshotStatCard claim={communityAnnualNational} accent="positive" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {detentionTotalNational && <SnapshotStatCard claim={detentionTotalNational} accent="urgent" size="sm" />}
                {communityTotalNational && <SnapshotStatCard claim={communityTotalNational} accent="positive" size="sm" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {detentionPopNational && <SnapshotStatCard claim={detentionPopNational} accent="urgent" size="sm" />}
                {communityPopNational && <SnapshotStatCard claim={communityPopNational} accent="positive" size="sm" />}
                {detentionBedsNational && <SnapshotStatCard claim={detentionBedsNational} size="sm" />}
              </div>
              {recidNational && (
                <div className="mt-4">
                  <SnapshotStatCard
                    claim={recidNational}
                    displayValue={
                      recidNational.value_numeric != null
                        ? `${(Number(recidNational.value_numeric) * 100).toFixed(1)}%`
                        : 'n/a'
                    }
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Per-state breakdown */}
      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">By state</h2>
          <p className="text-stone-700 mb-8 max-w-2xl">
            Each state runs its own youth detention system at its own cost. The gap between most and least expensive is wider
            than the gap between detention and community supervision.
          </p>
          <div className="space-y-4">
            {STATE_CODES.map((code) => {
              const upper = code.toUpperCase();
              const detentionPerYouth = claims[`access.cost.detention_per_youth.annual.${code}`];
              const communityPerYouth = claims[`access.cost.community_per_youth.annual.${code}`];
              const stateRatio = claims[`access.ratio.detention_vs_community_cost.${code}`];
              const detentionPop = claims[`access.count.detention_avg_daily_pop.${code}`];
              const beds = claims[`access.count.detention_beds.${code}`];
              const recid = claims[`oversight.rate.return_to_supervision.${code}`];
              const stateFacilities = facilitiesByState[upper] || [];
              return (
                <div key={code} className="border border-stone-200 bg-white rounded-lg p-5">
                  <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xl font-bold text-stone-900">{STATE_FULL[code]}</h3>
                    <p className="text-xs font-mono uppercase tracking-widest text-stone-500">
                      {stateFacilities.length} {stateFacilities.length === 1 ? 'centre' : 'centres'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {stateRatio && <SnapshotStatCard claim={stateRatio} accent="urgent" size="sm" />}
                    {detentionPerYouth && <SnapshotStatCard claim={detentionPerYouth} accent="urgent" size="sm" />}
                    {communityPerYouth && <SnapshotStatCard claim={communityPerYouth} accent="positive" size="sm" />}
                    {recid && (
                      <SnapshotStatCard
                        claim={recid}
                        displayValue={
                          recid.value_numeric != null
                            ? `${(Number(recid.value_numeric) * 100).toFixed(1)}%`
                            : 'n/a'
                        }
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {detentionPop && <SnapshotStatCard claim={detentionPop} size="sm" />}
                    {beds && <SnapshotStatCard claim={beds} size="sm" />}
                  </div>
                  {stateFacilities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Facilities</p>
                      <ul className="space-y-1.5">
                        {stateFacilities.map((f) => (
                          <li key={f.id} className="text-sm text-stone-700 flex items-baseline justify-between gap-3 flex-wrap">
                            <span>
                              <span className="font-medium">{f.name}</span>
                              {f.city && <span className="text-stone-500"> · {f.city}</span>}
                              {f.security && <span className="text-stone-500"> · {f.security} security</span>}
                            </span>
                            <span className="text-xs font-mono text-stone-500">{f.capacity || '?'} beds</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="px-6 py-12 bg-stone-100">
        <div className="max-w-5xl mx-auto text-sm text-stone-700">
          <p className="font-mono uppercase tracking-widest text-xs text-stone-500 mb-3">Sources</p>
          <ul className="space-y-1.5">
            <li>
              Productivity Commission, Report on Government Services 2024-25, tables 17A.20 (detention cost), 17A.21
              (community-based supervision cost), and 17A.26 (returns to youth justice supervision).
            </li>
            <li>
              Facility list curated against AIHW Youth justice in Australia data and state corrections records;
              canonical source: <code>src/lib/organizations/fallback-detention-centres.ts</code>.
            </li>
            <li>
              Full methodology and claim-by-claim audit trail at{' '}
              <Link href="/intelligence/civic/methodology" className="underline underline-offset-2">
                /intelligence/civic/methodology
              </Link>
              .
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

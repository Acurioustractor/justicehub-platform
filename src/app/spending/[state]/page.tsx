'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StateHero from '@/components/spending/StateHero';
import SpendingTimeSeries from '@/components/spending/SpendingTimeSeries';
import SpendingBySector from '@/components/spending/SpendingBySector';
import TopRecipients from '@/components/spending/TopRecipients';
import ProgramSpotlight from '@/components/spending/ProgramSpotlight';
import FacilityMap from '@/components/spending/FacilityMap';
import GovernmentPromises from '@/components/spending/GovernmentPromises';

interface SpendingData {
  state: string;
  stateName: string;
  headline: {
    totalSpend: number | null;
    detentionSpend: number | null;
    communitySpend: number | null;
    costPerChild: number | null;
    indigenousRatio: number | null;
    detentionPopulation: number | null;
  };
  timeSeries: { year: string; detention: number | null; community: number | null; total: number | null }[];
  bySector: { sector: string; total: number; count: number }[];
  bySource: { source: string; count: number }[];
  topRecipients: { org: string; total: number; count: number; orgId: string | null; abn: string | null }[];
  programs: { name: string; total: number; count: number }[];
  facilities: { name: string; lat: number | null; lng: number | null; capacity: number | null; location: string | null; operator: string | null }[];
  governmentPrograms: {
    id: string; name: string; programType: string | null; announcedDate: string | null;
    status: string | null; budgetAmount: number | null; description: string | null;
    url: string | null; minister: string | null; department: string | null;
    targetCohort: string[] | null;
  }[];
  promiseVsReality: { totalPromised: number; totalActualFunding: number };
}

const STATES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'];

export default function StatSpendingPage() {
  const params = useParams();
  const stateCode = (params.state as string)?.toLowerCase();
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stateCode || !STATES.includes(stateCode)) {
      setError('Invalid state');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/spending/${stateCode}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [stateCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-gray-500 mt-4">LOADING SPENDING DATA...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-red-600">{error || 'No data available'}</p>
          <Link href="/spending" className="font-mono text-xs underline mt-4 inline-block">
            Back to all states
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Nav breadcrumb */}
      <nav className="bg-[#0A0A0A] px-6 py-3 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center gap-2 font-mono text-xs">
          <Link href="/spending" className="text-gray-400 hover:text-white">
            Spending
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white">{data.state}</span>

          {/* State switcher */}
          <div className="ml-auto flex gap-1">
            {STATES.map((s) => (
              <Link
                key={s}
                href={`/spending/${s}`}
                className={`px-2 py-1 text-xs ${
                  s === stateCode
                    ? 'bg-white text-[#0A0A0A]'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {s.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <StateHero stateName={data.stateName} headline={data.headline} />
      <SpendingTimeSeries data={data.timeSeries} />
      <SpendingBySector data={data.bySector} />
      <TopRecipients recipients={data.topRecipients} />
      <ProgramSpotlight programs={data.programs} />
      <GovernmentPromises
        programs={data.governmentPrograms || []}
        promiseVsReality={data.promiseVsReality || { totalPromised: 0, totalActualFunding: 0 }}
        jurisdiction={data.state}
      />
      <FacilityMap facilities={data.facilities} />

      {/* Data source + links */}
      <section className="border-t border-gray-300 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-mono text-xs text-gray-500">
            {data.stateName} youth justice data from ROGS 2026 + JusticeHub funding database ({data.bySource.length} sources)
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/spending" className="font-mono text-xs text-[#0A0A0A] underline">
              All States
            </Link>
            <Link
              href={`/justice-funding?state=${data.state}`}
              className="font-mono text-xs text-[#0A0A0A] underline"
            >
              Explore {data.state} Funding
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

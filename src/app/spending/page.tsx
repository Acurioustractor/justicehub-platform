import { createServiceClient } from '@/lib/supabase/service-lite';
import AustraliaMap from '@/components/spending/AustraliaMap';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const STATES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'] as const;
type StateCode = (typeof STATES)[number];

const STATE_NAMES: Record<StateCode, string> = {
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  wa: 'Western Australia',
  sa: 'South Australia',
  tas: 'Tasmania',
  act: 'ACT',
  nt: 'Northern Territory',
};

export default async function SpendingLandingPage() {
  const supabase = createServiceClient();

  // Fetch latest ROGS data for all states
  const [spending, detPop, indigenous] = await Promise.all([
    supabase
      .from('rogs_justice_spending')
      .select('description3, nsw, vic, qld, wa, sa, tas, act, nt, aust')
      .eq('rogs_section', 'youth_justice')
      .eq('rogs_table', '17A.10')
      .eq('financial_year', '2024-25')
      .eq('unit', "$'000")
      .in('description3', [
        'Detention-based services',
        'Community-based services',
        'Total expenditure',
      ]),
    supabase
      .from('rogs_justice_spending')
      .select('nsw, vic, qld, wa, sa, tas, act, nt, aust')
      .eq('rogs_section', 'youth_justice')
      .eq('rogs_table', '17A.1')
      .eq('financial_year', '2024-25')
      .eq('unit', 'no.')
      .eq('description2', 'Detention')
      .eq('indigenous_status', 'All people')
      .limit(1),
    supabase
      .from('rogs_justice_spending')
      .select('nsw, vic, qld, wa, sa, tas, act, nt, aust')
      .eq('rogs_section', 'youth_justice')
      .eq('rogs_table', '17A.7')
      .eq('financial_year', '2024-25')
      .eq('unit', 'ratio')
      .like('service_type', '%Detention%')
      .limit(1),
  ]);

  const getVal = (desc3: string, state: string): number | null => {
    const row = (spending.data as any[])?.find((r: any) => r.description3 === desc3);
    return row?.[state] != null ? Number(row[state]) : null;
  };

  const stateInfos = STATES.map((code) => {
    const det = getVal('Detention-based services', code);
    const com = getVal('Community-based services', code);
    const tot = getVal('Total expenditure', code);
    const popRow = (detPop.data as any[])?.[0];
    const pop = popRow?.[code] != null ? Number(popRow[code]) : null;
    const indRow = (indigenous.data as any[])?.[0];
    const ratio = indRow?.[code] != null ? Number(indRow[code]) : null;

    return {
      code: code.toUpperCase(),
      name: STATE_NAMES[code],
      totalMillions: tot != null ? Math.round(tot / 1000) : null,
      detentionMillions: det != null ? Math.round(det / 1000) : null,
      communityMillions: com != null ? Math.round(com / 1000) : null,
      costPerChild:
        det != null && pop != null && pop > 0
          ? Math.round((det * 1000) / pop)
          : null,
      indigenousRatio: ratio != null ? parseFloat(ratio.toFixed(2)) : null,
    };
  });

  // National totals
  const natTotal = getVal('Total expenditure', 'aust');
  const natDet = getVal('Detention-based services', 'aust');
  const natCom = getVal('Community-based services', 'aust');
  const natPopRow = (detPop.data as any[])?.[0];
  const natPop = natPopRow?.aust != null ? Number(natPopRow.aust) : null;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-3">
            JusticeHub Data
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Where The Money Goes
          </h1>
          <p className="text-gray-400 mt-4 max-w-2xl text-lg">
            State-by-state breakdown of youth justice spending across Australia.
            How much goes to detention? How much to community programs? Click a
            state to explore.
          </p>

          {/* National headline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-500 uppercase">
                National Total
              </p>
              <p
                className="text-3xl font-bold mt-1 text-[#F5F0E8]"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {natTotal != null
                  ? `$${(natTotal / 1e6).toFixed(1)}B`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-1">FY 2024-25</p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-500 uppercase">
                Detention
              </p>
              <p
                className="text-3xl font-bold mt-1 text-red-500"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {natDet != null
                  ? `$${Math.round(natDet / 1000)}M`
                  : 'N/A'}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-500 uppercase">
                Community
              </p>
              <p
                className="text-3xl font-bold mt-1 text-emerald-500"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {natCom != null
                  ? `$${Math.round(natCom / 1000)}M`
                  : 'N/A'}
              </p>
            </div>
            <div className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-500 uppercase">
                Young People Detained
              </p>
              <p
                className="text-3xl font-bold mt-1 text-[#F5F0E8]"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {natPop != null ? Math.round(natPop).toLocaleString() : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-1">avg daily</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map + State Cards */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl font-bold tracking-tight mb-8 text-center"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Select a State
          </h2>
          <AustraliaMap states={stateInfos} />
        </div>
      </section>

      {/* Data sources footer */}
      <section className="border-t border-gray-300 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-mono text-xs text-gray-500">
            Data: Productivity Commission ROGS 2026 | QGIP | AusTender |
            Historical QLD Grants | NIAA | Brisbane City Council
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/justice-funding"
              className="font-mono text-xs text-[#0A0A0A] underline"
            >
              Explore Funding Database
            </Link>
            <Link
              href="/justice-spending"
              className="font-mono text-xs text-[#0A0A0A] underline"
            >
              ROGS Raw Data
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

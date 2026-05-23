/**
 * /kiosk/lenses/spending — SPENDING lens entry.
 *
 * The Big Number first ($1.33M vs $36k = 32× cheaper). Tap any drill path
 * to go deeper: where it comes from / by state / foundation flows / govt
 * programs. Each drill reuses the existing web surfaces.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../../components/LensBar';
import { TrustDrillButton } from '../../components/TrustDrillButton';
import { getDetentionCosts } from '@/lib/detention-costs';

export const revalidate = 600;

async function getCostClaims() {
  const supabase = createServiceClient() as any;
  const [det, com, ratio] = await Promise.all([
    supabase
      .from('civic_intelligence_claims')
      .select('claim_id, value_numeric, value_text, source_year')
      .eq('claim_id', 'access.cost.detention_per_youth.annual.national')
      .maybeSingle(),
    supabase
      .from('civic_intelligence_claims')
      .select('claim_id, value_numeric, value_text, source_year')
      .eq('claim_id', 'access.cost.community_per_youth.annual.national')
      .maybeSingle(),
    supabase
      .from('v_claim_evidence_summary')
      .select('claim_id, supporting_sources')
      .eq('claim_id', 'access.ratio.detention_vs_community_cost.national')
      .maybeSingle(),
  ]);
  return {
    detention: det.data,
    community: com.data,
    sources: ratio.data?.supporting_sources || null,
  };
}

export default async function SpendingLensPage() {
  const { detention, community, sources } = await getCostClaims();
  const detentionCostsData = await getDetentionCosts();
  const detentionDollars = detention?.value_numeric ? Number(detention.value_numeric) : detentionCostsData.national.annualCost;
  const communityDollars = community?.value_numeric ? Number(community.value_numeric) : 36869;
  const derivedRatio = communityDollars > 0 ? detentionDollars / communityDollars : null;

  return (
    <>
      <LensBar current="spending" />
      <div className="flex-1 bg-[#0A0A0A] text-white flex flex-col">
        <section className="flex-1 flex items-center justify-center px-8 py-12 sm:py-20">
          <div className="max-w-4xl w-full">
            <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-stone-400 mb-8 sm:mb-12">
              One child for one year, in:
            </p>
            <div className="space-y-8 sm:space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-stone-700 pb-6">
                <span className="text-sm sm:text-base font-mono uppercase tracking-[0.3em] text-[#DC2626]">Detention</span>
                <span className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ${detentionDollars.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-stone-700 pb-6">
                <span className="text-sm sm:text-base font-mono uppercase tracking-[0.3em] text-[#059669]">Community</span>
                <span className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ${communityDollars.toLocaleString()}
                </span>
              </div>
              {derivedRatio != null && (
                <div className="text-center pt-6">
                  <p className="text-2xl sm:text-3xl md:text-4xl text-stone-300">
                    = <span className="text-white font-bold text-4xl sm:text-6xl md:text-7xl">{derivedRatio.toFixed(1)}× cheaper</span>
                  </p>
                  <p className="mt-3 text-base sm:text-lg text-stone-400">to support a young person than to lock them up.</p>
                </div>
              )}
            </div>

            {sources != null && (
              <div className="mt-10 sm:mt-16">
                <TrustDrillButton
                  claimId="access.ratio.detention_vs_community_cost.national"
                  initialSources={sources}
                  variant="dark"
                />
              </div>
            )}
          </div>
        </section>

        {/* Drill paths */}
        <section className="bg-stone-900 border-t-2 border-stone-700">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-400 mb-4">Go deeper</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DrillCard href="/intelligence/civic" title="Where it comes from" body="The source claims, AIHW + RoGS." />
              <DrillCard href="/kiosk/lenses/places" title="By state" body="Every state's detention $ and community $. Worst gap: SA at 32×." />
              <DrillCard href="/intelligence/civic/foundations" title="Foundation flows" body="1.46% of all foundation $ reaches ACCOs. 8.46% of YJ-classified $." />
              <DrillCard href="/intelligence/civic/government-programs" title="Government programs" body="76 programs catalogued. Who delivers them." />
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

function DrillCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block border-2 border-stone-700 bg-stone-900 hover:border-stone-400 p-5 rounded transition-colors min-h-[100px]"
      >
        <p className="text-base sm:text-lg font-semibold text-white">{title} →</p>
        <p className="mt-1 text-sm text-stone-400">{body}</p>
      </Link>
    </li>
  );
}

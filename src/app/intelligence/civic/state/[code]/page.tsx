/**
 * /intelligence/civic/state/[code]
 *
 * Per-state youth-justice landscape. One page joins:
 *   - civic_intelligence_claims filtered by region (with triangulation badges)
 *   - civic_org_classifications confirmed Tier 1 → organizations join
 *   - oversight_recommendations filtered by jurisdiction
 *   - foundation_grantees where grantee state matches
 *
 * Designed for the Adelaide exhibition kiosk and for local advocates who need
 * the same evidence stack as the national page, scoped to their jurisdiction.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import {
  getClaim,
  getAllClaims,
  getEvidenceSummary,
  getConfirmedTier1Orgs,
  getOversightRecommendations,
  getFoundationClassifierCoverage,
} from '@/lib/civic-intelligence/queries';
import { SnapshotStatCard } from '@/components/intelligence/civic/SnapshotStatCard';

export const revalidate = 3600;

const STATE_NAMES: Record<string, string> = {
  sa: 'South Australia',
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  wa: 'Western Australia',
  tas: 'Tasmania',
  act: 'Australian Capital Territory',
  nt: 'Northern Territory',
};

const STATE_CODES = Object.keys(STATE_NAMES);

export function generateStaticParams() {
  return STATE_CODES.map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = params.code.toLowerCase();
  const name = STATE_NAMES[code];
  if (!name) return { title: 'State not found' };
  return {
    title: `${name} youth justice landscape — Centre of Excellence`,
    description: `Detention costs, community alternatives, frontline organisations, oversight findings, and foundation flows for ${name}.`,
  };
}

async function getFoundationFlows(stateCode: string): Promise<{
  totalDollars: number;
  grantCount: number;
  yjDollars: number;
  yjGrantCount: number;
  topFunders: { name: string; total: number }[];
}> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase.rpc('state_foundation_flows', { state_code: stateCode });
  if (error || !data) {
    console.error('state_foundation_flows RPC failed:', error?.message);
    return { totalDollars: 0, grantCount: 0, yjDollars: 0, yjGrantCount: 0, topFunders: [] };
  }
  return {
    totalDollars: Number(data.total_dollars || 0),
    grantCount: Number(data.grant_count || 0),
    yjDollars: Number(data.yj_dollars || 0),
    yjGrantCount: Number(data.yj_grant_count || 0),
    topFunders: (data.top_funders || []).map((f: any) => ({ name: f.name, total: Number(f.total) })),
  };
}

export default async function StatePage({ params }: { params: { code: string } }) {
  const code = params.code.toLowerCase();
  const stateName = STATE_NAMES[code];
  if (!stateName) notFound();
  const STATE = code.toUpperCase();

  const [
    detentionCost,
    communityCost,
    costRatio,
    detentionPop,
    detentionBeds,
    tier1Count,
    returnRate,
    allClaims,
    evidence,
    tier1Orgs,
    oversight,
    foundation,
    classifierCoverage,
  ] = await Promise.all([
    getClaim(`access.cost.detention_per_youth.annual.${code}`),
    getClaim(`access.cost.community_per_youth.annual.${code}`),
    getClaim(`access.ratio.detention_vs_community_cost.${code}`),
    getClaim(`access.count.detention_avg_daily_pop.${code}`),
    getClaim(`access.count.detention_beds.${code}`),
    getClaim(`access.count.tier_1_orgs.${code}`),
    getClaim(`oversight.rate.return_to_supervision.${code}`),
    getAllClaims(),
    getEvidenceSummary(),
    getConfirmedTier1Orgs(STATE),
    getOversightRecommendations(50),
    getFoundationFlows(code),
    getFoundationClassifierCoverage(),
  ]);

  const stateOversightLocal = oversight.filter((o: any) => o.jurisdiction === STATE).slice(0, 6);
  const stateOversightNational = oversight.filter((o: any) => o.jurisdiction === 'National').slice(0, 4);

  // Derive cost ratio from the two cost cards so the three numbers can't disagree
  // on screen, instead of trusting the separately-snapshotted ratio claim.
  const derivedRatio =
    detentionCost?.value_numeric != null && communityCost?.value_numeric && Number(communityCost.value_numeric) > 0
      ? Number(detentionCost.value_numeric) / Number(communityCost.value_numeric)
      : null;

  // Return-to-supervision: stored as a 0-1 fraction. Clamp at 100% so a unit
  // mistake in the snapshot can't render "6300%".
  const returnRatePct =
    returnRate?.value_numeric != null
      ? Math.min(Math.round(Number(returnRate.value_numeric) * 100), 100)
      : null;

  const evid = (claimId?: string | null) =>
    claimId
      ? {
          triangulationTier: evidence[claimId]?.triangulation_tier as any,
          supportingSources: evidence[claimId]?.supporting_sources,
        }
      : {};

  const indigenousLed = tier1Orgs.filter((o) => o.is_indigenous_org).length;
  const liveIndigenousSharePct = tier1Orgs.length > 0 ? Math.round((indigenousLed / tier1Orgs.length) * 100) : null;
  // Reconcile the snapshotted Tier 1 count claim against the live count.
  const tier1ClaimCount = tier1Count?.value_numeric != null ? Number(tier1Count.value_numeric) : null;
  const tier1CountAgrees = tier1ClaimCount != null && tier1ClaimCount === tier1Orgs.length;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      {/* HERO */}
      <header className="border-b-2 border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Link href="/intelligence/civic/centre-of-excellence" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            ← Centre of Excellence
          </Link>
          <h1 className="mt-3 text-5xl md:text-6xl font-bold tracking-tight">
            {stateName}
          </h1>
          <p className="mt-3 text-xs font-mono uppercase tracking-widest text-stone-500">
            Youth justice landscape · {STATE}
          </p>
          <p className="mt-6 max-w-2xl text-lg text-stone-700 leading-relaxed">
            What the data shows about young people, detention, community, and money in {stateName}.
            Every claim is sourced. Triangulation badges mark which claims are backed by three or more independent sources.
          </p>
        </div>
      </header>

      {/* HEADLINE COSTS */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Cost asymmetry</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {detentionCost && (
            <SnapshotStatCard
              claim={detentionCost}
              displayValue={`$${(Number(detentionCost.value_numeric) / 1000).toFixed(0)}k`}
              context="per young person per year in detention"
              accent="urgent"
              size="lg"
              {...evid(detentionCost.claim_id)}
            />
          )}
          {communityCost && (
            <SnapshotStatCard
              claim={communityCost}
              displayValue={`$${(Number(communityCost.value_numeric) / 1000).toFixed(0)}k`}
              context="per young person per year in community supervision"
              accent="positive"
              size="lg"
              {...evid(communityCost.claim_id)}
            />
          )}
          {costRatio && derivedRatio != null && (
            <SnapshotStatCard
              claim={costRatio}
              displayValue={`${derivedRatio.toFixed(1)}×`}
              context={`derived live: $${Math.round(Number(detentionCost!.value_numeric)).toLocaleString()} ÷ $${Math.round(Number(communityCost!.value_numeric)).toLocaleString()}`}
              accent="urgent"
              size="lg"
              {...evid(costRatio.claim_id)}
            />
          )}
        </div>
      </section>

      {/* DETENTION POPULATION */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Detention scale</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {detentionPop && (
            <SnapshotStatCard claim={detentionPop} size="md" {...evid(detentionPop.claim_id)} />
          )}
          {detentionBeds && (
            <SnapshotStatCard claim={detentionBeds} size="md" {...evid(detentionBeds.claim_id)} />
          )}
          {returnRate && returnRatePct != null && (
            <SnapshotStatCard
              claim={returnRate}
              displayValue={`${returnRatePct}%`}
              context="return to supervision within 12 months"
              size="md"
              {...evid(returnRate.claim_id)}
            />
          )}
        </div>
      </section>

      {/* TIER 1 ORGS */}
      <section className="bg-stone-100 border-y-2 border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Frontline organisations</p>
            <p className="text-xs font-mono text-stone-500">
              {tier1Orgs.length} confirmed Tier 1 · {indigenousLed} Indigenous-led
            </p>
          </div>
          {tier1Count && (
            <div className="mb-6 max-w-md">
              <SnapshotStatCard
                claim={tier1Count}
                displayValue={tier1Orgs.length > 0 ? `${tier1Orgs.length}` : (tier1ClaimCount != null ? `${tier1ClaimCount}` : 'n/a')}
                context={tier1ClaimCount != null && !tier1CountAgrees ? `Snapshot says ${tier1ClaimCount}, live register shows ${tier1Orgs.length}. The live number is below.` : undefined}
                size="md"
                {...evid(tier1Count.claim_id)}
              />
            </div>
          )}
          {tier1Orgs.length === 0 ? (
            <p className="text-stone-600 italic">No confirmed Tier 1 organisations in our register yet. <Link href="/add-service" className="underline">Add one</Link>.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tier1Orgs.map((org) => (
                <li key={org.organization_id}>
                  <Link
                    href={org.org_slug ? `/sites/${org.org_slug}` : '#'}
                    className="block border-2 border-stone-200 bg-white p-4 hover:border-stone-900 transition-colors rounded"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-stone-900">{org.org_name || 'Unnamed organisation'}</h3>
                        <p className="text-xs text-stone-500 mt-1">{org.sector_category || 'Frontline YJ'}</p>
                      </div>
                      {org.is_indigenous_org && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-300 px-1.5 py-0.5 rounded shrink-0">
                          Indigenous-led
                        </span>
                      )}
                    </div>
                    {org.abn && <p className="mt-2 text-xs font-mono text-stone-400">ABN {org.abn}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* INDIGENOUS SHARE — derived live from the Tier 1 register above. */}
      {liveIndigenousSharePct != null && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Indigenous-controlled share</p>
          <div className="border-2 border-stone-300 bg-white p-6 rounded max-w-md">
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Live from the Tier 1 register</p>
            <p className="mt-2 text-5xl font-bold tracking-tight">{liveIndigenousSharePct}%</p>
            <p className="mt-2 text-sm text-stone-700">{indigenousLed} of {tier1Orgs.length} confirmed Tier 1 organisations in {stateName} are Indigenous-controlled.</p>
          </div>
        </section>
      )}

      {/* FOUNDATION FLOWS */}
      <section className="bg-stone-100 border-y-2 border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Foundation flows into {stateName}</p>
          {classifierCoverage.pct < 0.99 && (
            <div className="mb-6 border-2 border-rose-300 bg-rose-50 p-4 rounded text-sm md:text-base">
              <p className="font-semibold text-rose-900">YJ-relevance coverage incomplete</p>
              <p className="mt-1 text-rose-800 leading-relaxed">
                Only {classifierCoverage.classified.toLocaleString()} of {classifierCoverage.total.toLocaleString()} foundation grants
                ({Math.round(classifierCoverage.pct * 100)}%) have been classified for youth-justice relevance.
                The YJ-relevant numbers below are a floor, not a ceiling. The remaining grants are being processed.
              </p>
            </div>
          )}
          {foundation.grantCount === 0 ? (
            <p className="text-stone-600 italic">No foundation grants recorded for {stateName} grantees yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border-2 border-stone-300 bg-white p-5 rounded">
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500">All foundation grants</p>
                  <p className="text-3xl font-bold mt-2">${(foundation.totalDollars / 1_000_000).toFixed(1)}M</p>
                  <p className="text-xs text-stone-500 mt-1">across {foundation.grantCount.toLocaleString()} grants</p>
                </div>
                <div className="border-2 border-stone-300 bg-white p-5 rounded">
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500">YJ-relevant share (classified so far)</p>
                  <p className="text-3xl font-bold mt-2">${(foundation.yjDollars / 1_000_000).toFixed(2)}M</p>
                  <p className="text-xs text-stone-500 mt-1">
                    {foundation.yjGrantCount.toLocaleString()} grants · {foundation.totalDollars > 0 ? ((foundation.yjDollars / foundation.totalDollars) * 100).toFixed(1) : '0'}% of total
                    {classifierCoverage.pct < 0.99 ? ' · floor only' : ''}
                  </p>
                </div>
                <div className="border-2 border-stone-300 bg-white p-5 rounded">
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Top funder</p>
                  <p className="text-lg font-semibold mt-2">{foundation.topFunders[0]?.name || '—'}</p>
                  <p className="text-xs text-stone-500 mt-1">${((foundation.topFunders[0]?.total || 0) / 1_000_000).toFixed(2)}M total</p>
                </div>
              </div>
              {foundation.topFunders.length > 1 && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Top 5 funders by dollars into {stateName}</p>
                  <ol className="space-y-2">
                    {foundation.topFunders.map((f, i) => (
                      <li key={f.name} className="flex items-baseline justify-between text-sm border-b border-stone-200 pb-2">
                        <span><span className="text-stone-400 font-mono mr-2">{i + 1}.</span>{f.name}</span>
                        <span className="font-mono text-stone-700">${(f.total / 1_000_000).toFixed(2)}M</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* OVERSIGHT — local first, national separately so the kiosk doesn't conflate the two. */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">{STATE} oversight findings</p>
        {stateOversightLocal.length === 0 ? (
          <p className="text-stone-600 italic mb-8">No {STATE}-specific oversight recommendations indexed yet.</p>
        ) : (
          <ul className="space-y-3 mb-10">
            {stateOversightLocal.map((rec: any) => (
              <li key={rec.id} className="border-l-4 border-stone-300 pl-4 py-2">
                <div className="flex items-baseline gap-2 text-xs font-mono text-stone-500">
                  <span className="uppercase tracking-widest">{rec.jurisdiction || 'unknown'}</span>
                  <span>·</span>
                  <span>{rec.oversight_body || rec.report_title || 'Source'}</span>
                  {rec.report_date && <><span>·</span><span>{String(rec.report_date).slice(0, 10)}</span></>}
                </div>
                <p className="mt-1 text-stone-900">{rec.recommendation_text || 'No text available'}</p>
                {rec.report_url && (
                  <a href={rec.report_url} target="_blank" rel="noreferrer" className="text-xs text-stone-500 underline mt-1 inline-block">
                    Source report
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        {stateOversightNational.length > 0 && (
          <>
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5 mt-6">National oversight findings (federal scope)</p>
            <ul className="space-y-3">
              {stateOversightNational.map((rec: any) => (
                <li key={rec.id} className="border-l-4 border-stone-200 pl-4 py-2">
                  <div className="flex items-baseline gap-2 text-xs font-mono text-stone-500">
                    <span className="uppercase tracking-widest">National</span>
                    <span>·</span>
                    <span>{rec.oversight_body || rec.report_title || 'Source'}</span>
                    {rec.report_date && <><span>·</span><span>{String(rec.report_date).slice(0, 10)}</span></>}
                  </div>
                  <p className="mt-1 text-stone-900">{rec.recommendation_text || 'No text available'}</p>
                  {rec.report_url && (
                    <a href={rec.report_url} target="_blank" rel="noreferrer" className="text-xs text-stone-500 underline mt-1 inline-block">
                      Source report
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* METHODOLOGY FOOTER */}
      <footer className="bg-stone-900 text-stone-300 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">How this page is built</p>
          <p className="text-sm text-stone-300 leading-relaxed max-w-3xl">
            Claims come from <span className="font-mono">civic_intelligence_claims</span> filtered by region.
            Triangulation badges reflect the count of independent sources behind each claim, sourced from{' '}
            <span className="font-mono">v_claim_evidence_summary</span>.
            Frontline organisations are confirmed Tier 1 entries from <span className="font-mono">civic_org_classifications</span>{' '}
            joined to the organisations register.
            Foundation flows aggregate <span className="font-mono">foundation_grantees</span> records with the YJ relevance classifier applied.
            Oversight findings come from <span className="font-mono">oversight_recommendations</span>.
          </p>
          <p className="mt-4 text-xs text-stone-500">
            Last revalidated: hourly. <Link href="/intelligence/civic/centre-of-excellence" className="underline">Centre of Excellence</Link>.
          </p>
        </div>
      </footer>
    </main>
  );
}

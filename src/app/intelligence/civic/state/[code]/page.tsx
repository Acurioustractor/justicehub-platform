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
    indigenousShare,
    returnRate,
    allClaims,
    evidence,
    tier1Orgs,
    oversight,
    foundation,
  ] = await Promise.all([
    getClaim(`access.cost.detention_per_youth.annual.${code}`),
    getClaim(`access.cost.community_per_youth.annual.${code}`),
    getClaim(`access.ratio.detention_vs_community_cost.${code}`),
    getClaim(`access.count.detention_avg_daily_pop.${code}`),
    getClaim(`access.count.detention_beds.${code}`),
    getClaim(`access.count.tier_1_orgs.${code}`),
    getClaim(`access.indigenous_share.${code}`),
    getClaim(`oversight.rate.return_to_supervision.${code}`),
    getAllClaims(),
    getEvidenceSummary(),
    getConfirmedTier1Orgs(STATE),
    getOversightRecommendations(50),
    getFoundationFlows(code),
  ]);

  const stateOversight = oversight.filter((o: any) => o.jurisdiction === STATE || o.jurisdiction === 'National').slice(0, 8);

  const evid = (claimId?: string | null) =>
    claimId
      ? {
          triangulationTier: evidence[claimId]?.triangulation_tier as any,
          supportingSources: evidence[claimId]?.supporting_sources,
        }
      : {};

  const indigenousLed = tier1Orgs.filter((o) => o.is_indigenous_org).length;

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
          {costRatio && (
            <SnapshotStatCard
              claim={costRatio}
              displayValue={`${Math.round(Number(costRatio.value_numeric))}×`}
              context="cost multiple of detention over community"
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
          {returnRate && (
            <SnapshotStatCard
              claim={returnRate}
              displayValue={`${Math.round(Number(returnRate.value_numeric) * 100)}%`}
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
              <SnapshotStatCard claim={tier1Count} size="md" {...evid(tier1Count.claim_id)} />
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

      {/* INDIGENOUS SHARE */}
      {indigenousShare && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Indigenous-controlled share</p>
          <div className="max-w-md">
            <SnapshotStatCard
              claim={indigenousShare}
              displayValue={`${Math.round(Number(indigenousShare.value_numeric) * 100)}%`}
              context="of confirmed Tier 1 orgs in this state"
              size="lg"
              {...evid(indigenousShare.claim_id)}
            />
          </div>
        </section>
      )}

      {/* FOUNDATION FLOWS */}
      <section className="bg-amber-50/40 border-y-2 border-amber-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Foundation flows into {stateName}</p>
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
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500">YJ-relevant share</p>
                  <p className="text-3xl font-bold mt-2">${(foundation.yjDollars / 1_000_000).toFixed(2)}M</p>
                  <p className="text-xs text-stone-500 mt-1">{foundation.yjGrantCount.toLocaleString()} grants · {foundation.totalDollars > 0 ? ((foundation.yjDollars / foundation.totalDollars) * 100).toFixed(1) : '0'}% of total</p>
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

      {/* OVERSIGHT */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-5">Oversight findings ({STATE} + National)</p>
        {stateOversight.length === 0 ? (
          <p className="text-stone-600 italic">No oversight recommendations indexed yet.</p>
        ) : (
          <ul className="space-y-3">
            {stateOversight.map((rec: any) => (
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

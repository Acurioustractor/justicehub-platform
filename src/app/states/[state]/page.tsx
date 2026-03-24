import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const STATE_NAMES: Record<string, string> = {
  NT: 'Northern Territory',
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
};

const VALID_STATES = Object.keys(STATE_NAMES);

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(part: number, total: number): string {
  if (total === 0) return '0';
  return ((part / total) * 100).toFixed(1);
}

export async function generateMetadata({ params }: { params: { state: string } }): Promise<Metadata> {
  const state = params.state.toUpperCase();
  const name = STATE_NAMES[state];
  if (!name) return { title: 'State — JusticeHub' };
  return {
    title: `${name} — Youth Justice Scorecard | JusticeHub`,
    description: `Youth justice funding, community organisations, ALMA models, and ministerial statements in ${name}. Follow the money.`,
  };
}

export default async function StateScorecardPage({ params }: { params: { state: string } }) {
  const state = params.state.toUpperCase();
  if (!VALID_STATES.includes(state)) notFound();

  const stateName = STATE_NAMES[state];
  const supabase = createServiceClient() as any;

  // Parallel data fetches
  const [
    fundingRes,
    basecampsRes,
    minersRes,
    interventionsRes,
    orgsRes,
    indigenousOrgsRes,
    youthOppsRes,
    statementsRes,
  ] = await Promise.all([
    // Funding in this state
    supabase
      .from('justice_funding')
      .select('alma_organization_id, amount_dollars')
      .eq('state', state)
      .gt('amount_dollars', 0)
      .not('alma_organization_id', 'is', null)
      .limit(20000),
    // Basecamps
    supabase
      .from('organizations')
      .select('id, name, slug, is_indigenous_org')
      .or('partner_tier.eq.basecamp,type.eq.basecamp')
      .eq('state', state),
    // Network miners
    supabase
      .from('network_memberships')
      .select('id, contact_name, description, organizations(name, slug, state)')
      .eq('status', 'active'),
    // ALMA interventions via org state
    supabase
      .from('alma_interventions')
      .select('id, name, type, evidence_level, cost_per_young_person, operating_organization_id, organizations!inner(state)')
      .eq('organizations.state', state)
      .neq('verification_status', 'ai_generated')
      .order('evidence_level')
      .limit(50),
    // Total orgs in state
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state),
    // Indigenous orgs
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('state', state)
      .eq('is_indigenous_org', true),
    // Youth opportunities
    supabase
      .from('youth_opportunities')
      .select('id, title, category, organizer, deadline, source_url, application_url, prize_amount')
      .eq('status', 'open')
      .or(`location_state.eq.${state},is_national.eq.true`)
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(10),
    // CivicScope statements
    supabase
      .from('civic_ministerial_statements')
      .select('headline, minister_name, published_at, source_url, mentioned_amounts')
      .or('headline.ilike.%youth%,headline.ilike.%justice%,headline.ilike.%detention%')
      .order('published_at', { ascending: false })
      .limit(5),
  ]);

  // Aggregate funding
  const orgTotals: Record<string, number> = {};
  let totalFunding = 0;
  for (const row of fundingRes.data || []) {
    const amt = Number(row.amount_dollars) || 0;
    totalFunding += amt;
    if (row.alma_organization_id) {
      orgTotals[row.alma_organization_id] = (orgTotals[row.alma_organization_id] || 0) + amt;
    }
  }

  // Get org details for top recipients
  const topOrgIds = Object.entries(orgTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  const { data: orgDetails } = await supabase
    .from('organizations')
    .select('id, name, slug, is_indigenous_org')
    .in('id', topOrgIds.length > 0 ? topOrgIds : ['none']);

  const orgMap: Record<string, any> = {};
  for (const o of orgDetails || []) orgMap[o.id] = o;

  const topRecipients = topOrgIds.map((id) => ({
    id,
    name: orgMap[id]?.name || 'Unknown',
    slug: orgMap[id]?.slug,
    total: orgTotals[id],
    isIndigenous: orgMap[id]?.is_indigenous_org || false,
  }));

  // Indigenous funding split
  let indigenousFunding = 0;
  for (const [orgId, amt] of Object.entries(orgTotals)) {
    if (orgMap[orgId]?.is_indigenous_org) indigenousFunding += amt;
  }
  // Need all org indigenous flags, not just top 10
  const allFundedIds = Object.keys(orgTotals).slice(0, 500);
  if (allFundedIds.length > topOrgIds.length) {
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, is_indigenous_org')
      .in('id', allFundedIds);
    indigenousFunding = 0;
    for (const o of allOrgs || []) {
      if (o.is_indigenous_org && orgTotals[o.id]) {
        indigenousFunding += orgTotals[o.id];
      }
    }
  }

  const basecamps = basecampsRes.data || [];
  const stateMiners = (minersRes.data || []).filter((m: any) => m.organizations?.state === state);
  const interventions = interventionsRes.data || [];
  const youthOpps = youthOppsRes.data || [];
  const statements = statementsRes.data || [];
  const indPct = pct(indigenousFunding, totalFunding);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <Link href="/follow-the-money" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mb-4">
              Follow the Money <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {state} Scorecard
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {stateName}
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8">
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fmt(totalFunding)}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Funding tracked</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${Number(indPct) < 5 ? 'text-[#DC2626]' : Number(indPct) < 20 ? 'text-amber-400' : 'text-[#059669]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {indPct}%
                </p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>To Indigenous orgs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{orgsRes.count?.toLocaleString() || 0}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Organisations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{interventions.length}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ALMA models</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{indigenousOrgsRes.count || 0}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Indigenous orgs</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Basecamps */}
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {basecamps.length > 0 ? 'Basecamps' : 'No Basecamp Yet'}
            </h2>
            {basecamps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {basecamps.map((bc: any) => (
                  <Link key={bc.id} href={`/sites/${bc.slug}`} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#059669]/10">
                      <Shield className="w-5 h-5 text-[#059669]" />
                    </div>
                    <div>
                      <p className="font-bold">{bc.name}</p>
                      <p className="text-xs text-[#0A0A0A]/50">{state} Basecamp · ALMA Network</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-[#0A0A0A]/15 p-6">
                <p className="text-sm text-[#0A0A0A]/50 mb-3">{stateName} needs a Basecamp — a community organisation to coordinate the network in this state.</p>
                <Link href="/join" className="text-sm font-semibold text-[#059669] hover:underline flex items-center gap-1">
                  Could that be you? <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </section>

          {/* Top Recipients */}
          {topRecipients.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Top Funding Recipients</h2>
              </div>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">Who gets the money in {stateName}.</p>
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
                {topRecipients.map((r, i) => {
                  const barW = topRecipients[0]?.total ? (r.total / topRecipients[0].total) * 100 : 0;
                  return (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-3 border-b border-[#0A0A0A]/5 last:border-0 relative">
                      <div className="absolute inset-y-0 left-0 bg-[#DC2626]/5" style={{ width: `${barW}%` }} />
                      <span className="relative text-sm font-medium text-[#0A0A0A]/30 w-6 shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{i + 1}</span>
                      <div className="relative min-w-0 flex-1">
                        {r.slug ? (
                          <Link href={`/organizations/${r.slug}`} className="font-semibold text-sm truncate hover:underline block">{r.name}</Link>
                        ) : (
                          <p className="font-semibold text-sm truncate">{r.name}</p>
                        )}
                      </div>
                      <div className="relative flex items-center gap-2 shrink-0">
                        {r.isIndigenous ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">Indigenous</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/40">non-Indigenous</span>
                        )}
                        <span className="text-sm font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(r.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ALMA Models */}
          {interventions.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ALMA Models in {stateName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interventions.slice(0, 12).map((int: any) => (
                  <div key={int.id} className="bg-white rounded-lg border border-[#0A0A0A]/10 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669]/10">
                      <TrendingUp className="w-4 h-4 text-[#059669]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{int.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/50">{int.type}</span>
                        {int.evidence_level && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#059669]/10 text-[#059669]">
                            {int.evidence_level.split('(')[0].trim()}
                          </span>
                        )}
                        {int.cost_per_young_person && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {fmt(Number(int.cost_per_young_person))}/person
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {interventions.length > 12 && (
                <p className="text-sm text-[#0A0A0A]/40 mt-3">+ {interventions.length - 12} more models</p>
              )}
            </section>
          )}

          {/* Youth Opportunities */}
          {youthOpps.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Open Opportunities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {youthOpps.map((opp: any) => (
                  <a key={opp.id} href={opp.application_url || opp.source_url} target="_blank" rel="noopener noreferrer"
                    className="bg-white rounded-lg border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A]/30 transition-colors flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{opp.title}</p>
                      <p className="text-xs text-[#0A0A0A]/50 mt-0.5">{opp.organizer || opp.category}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        {opp.prize_amount && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#059669]/10 text-[#059669]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {fmt(Number(opp.prize_amount))}
                          </span>
                        )}
                        {opp.deadline && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/50" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            Closes {new Date(opp.deadline).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#0A0A0A]/20 shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* CivicScope */}
          {statements.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                What the Ministers Say
              </h2>
              <div className="space-y-3">
                {statements.map((s: any, i: number) => (
                  <a key={i} href={s.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 bg-white rounded-lg border border-[#0A0A0A]/10 p-4 hover:border-[#0A0A0A]/30 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{s.headline.trim()}</p>
                      <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                        {s.minister_name} · {new Date(s.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {(s.mentioned_amounts || []).length > 0 && (
                        <div className="flex gap-1.5 mt-1.5">
                          {s.mentioned_amounts.slice(0, 3).map((amt: string, j: number) => (
                            <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{amt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#0A0A0A]/20 shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Build the alternative in {stateName}
            </h2>
            <p className="text-sm text-white/60 mb-4">
              Join the ALMA Network. Get matched to grants, connect with peers,
              and make your work visible.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/join" className="px-4 py-2 bg-white text-[#0A0A0A] font-semibold rounded-lg text-sm hover:bg-white/90">
                Join the Network
              </Link>
              <Link href="/follow-the-money" className="px-4 py-2 border border-white/20 text-white font-semibold rounded-lg text-sm hover:bg-white/10">
                Follow the Money
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

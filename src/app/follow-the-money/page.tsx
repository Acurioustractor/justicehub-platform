import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users,
  Shield,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Follow the Money | JusticeHub',
  description:
    'Where does Australia\'s youth justice funding actually go? State-by-state data on who gets the money, who misses out, and what the ministers say versus what the numbers show.',
};

const STATE_NAMES: Record<string, string> = {
  QLD: 'Queensland',
  VIC: 'Victoria',
  NSW: 'New South Wales',
  WA: 'Western Australia',
  NT: 'Northern Territory',
  SA: 'South Australia',
  ACT: 'Australian Capital Territory',
  TAS: 'Tasmania',
};

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

interface StateData {
  state: string;
  totalDollars: number;
  recordCount: number;
  orgCount: number;
  indigenousDollars: number;
  indigenousOrgCount: number;
  topRecipients: Array<{
    name: string;
    total: number;
    isIndigenous: boolean;
  }>;
  hasBasecamp: boolean;
}

interface MinisterialStatement {
  headline: string;
  ministerName: string;
  publishedAt: string;
  sourceUrl: string;
  mentionedAmounts: string[];
}

export default async function FollowTheMoneyPage() {
  const supabase = createServiceClient() as any;

  const states = ['QLD', 'NSW', 'VIC', 'WA', 'NT', 'SA', 'TAS', 'ACT'];

  // Get all funding with org data in one query (limited but fast)
  const { data: fundingAgg } = await supabase
    .from('justice_funding')
    .select('state, alma_organization_id, amount_dollars')
    .gt('amount_dollars', 0)
    .in('state', states)
    .not('alma_organization_id', 'is', null)
    .limit(50000);

  // Aggregate by state and org
  const stateOrgTotals: Record<string, Record<string, number>> = {};
  const stateTotals: Record<string, number> = {};

  for (const row of fundingAgg || []) {
    const s = row.state;
    const amt = Number(row.amount_dollars) || 0;
    if (!stateTotals[s]) stateTotals[s] = 0;
    stateTotals[s] += amt;
    if (row.alma_organization_id) {
      if (!stateOrgTotals[s]) stateOrgTotals[s] = {};
      stateOrgTotals[s][row.alma_organization_id] =
        (stateOrgTotals[s][row.alma_organization_id] || 0) + amt;
    }
  }

  // Get all org details we need
  const allOrgIds = new Set<string>();
  for (const s of states) {
    for (const orgId of Object.keys(stateOrgTotals[s] || {})) {
      allOrgIds.add(orgId);
    }
  }

  const orgIdArr = Array.from(allOrgIds).slice(0, 2000);
  const { data: orgDetails } = await supabase
    .from('organizations')
    .select('id, name, is_indigenous_org')
    .in('id', orgIdArr.length > 0 ? orgIdArr : ['none']);

  const orgMap: Record<string, { name: string; isIndigenous: boolean }> = {};
  for (const o of orgDetails || []) {
    orgMap[o.id] = { name: o.name, isIndigenous: o.is_indigenous_org || false };
  }

  // Get basecamps
  const { data: basecamps } = await supabase
    .from('organizations')
    .select('state')
    .or('partner_tier.eq.basecamp,type.eq.basecamp');
  const basecampStates = new Set((basecamps || []).map((b: any) => b.state));

  // Build state data
  const stateData: StateData[] = states
    .map((s) => {
      const orgTotals = stateOrgTotals[s] || {};
      const sortedOrgs = Object.entries(orgTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      let indigenousDollars = 0;
      let indigenousOrgCount = 0;
      const indigenousSeen = new Set<string>();

      for (const [orgId, amt] of Object.entries(orgTotals)) {
        if (orgMap[orgId]?.isIndigenous) {
          indigenousDollars += amt;
          if (!indigenousSeen.has(orgId)) {
            indigenousOrgCount++;
            indigenousSeen.add(orgId);
          }
        }
      }

      return {
        state: s,
        totalDollars: stateTotals[s] || 0,
        recordCount: 0,
        orgCount: Object.keys(orgTotals).length,
        indigenousDollars,
        indigenousOrgCount,
        topRecipients: sortedOrgs.map(([id, total]) => ({
          name: orgMap[id]?.name || 'Unknown',
          total,
          isIndigenous: orgMap[id]?.isIndigenous || false,
        })),
        hasBasecamp: basecampStates.has(s),
      };
    })
    .sort((a, b) => b.totalDollars - a.totalDollars);

  // National totals
  const nationalTotal = stateData.reduce((s, d) => s + d.totalDollars, 0);
  const nationalIndigenous = stateData.reduce((s, d) => s + d.indigenousDollars, 0);
  const nationalOrgCount = stateData.reduce((s, d) => s + d.orgCount, 0);

  // Top 10 nationally
  const nationalTopOrgs: Record<string, { name: string; total: number; isIndigenous: boolean }> = {};
  for (const s of states) {
    for (const [orgId, amt] of Object.entries(stateOrgTotals[s] || {})) {
      if (!nationalTopOrgs[orgId]) {
        nationalTopOrgs[orgId] = {
          name: orgMap[orgId]?.name || 'Unknown',
          total: 0,
          isIndigenous: orgMap[orgId]?.isIndigenous || false,
        };
      }
      nationalTopOrgs[orgId].total += amt;
    }
  }
  const top10National = Object.values(nationalTopOrgs)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // CivicScope statements
  const { data: civicStatements } = await supabase
    .from('civic_ministerial_statements')
    .select('headline, minister_name, published_at, source_url, mentioned_amounts')
    .or('headline.ilike.%youth%,headline.ilike.%justice%,headline.ilike.%detention%')
    .order('published_at', { ascending: false })
    .limit(6);

  const statements: MinisterialStatement[] = (civicStatements || []).map((s: any) => ({
    headline: s.headline,
    ministerName: s.minister_name,
    publishedAt: s.published_at,
    sourceUrl: s.source_url,
    mentionedAmounts: s.mentioned_amounts || [],
  }));

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <p
                className="text-sm uppercase tracking-[0.3em] text-[#DC2626]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Transparency
              </p>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Follow the Money
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-10">
              {fmt(nationalTotal)} in youth justice funding tracked across Australia.
              Who gets it, who misses out, and what the politicians say versus what
              the numbers show.
            </p>

            {/* National headline stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {fmt(nationalTotal)}
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Total tracked
                </p>
              </div>
              <div>
                <p
                  className="text-3xl font-bold text-[#DC2626]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {pct(nationalIndigenous, nationalTotal)}%
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  To Indigenous orgs
                </p>
              </div>
              <div>
                <p
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {nationalOrgCount.toLocaleString()}
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Organisations funded
                </p>
              </div>
              <div>
                <p
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {fmt(top10National[0]?.total || 0)}
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  #1 recipient alone
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-20">
          {/* Top 10 National */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Top 10 Recipients — National
            </h2>
            <p className="text-sm text-[#0A0A0A]/60 mb-6">
              These organisations receive more funding than thousands of
              community organisations combined.
            </p>

            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
              {top10National.map((org, i) => {
                const barWidth = top10National[0]?.total
                  ? (org.total / top10National[0].total) * 100
                  : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-[#0A0A0A]/5 last:border-0 relative"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-[#DC2626]/5"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span
                      className="relative text-sm font-medium text-[#0A0A0A]/30 w-6 shrink-0"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {i + 1}
                    </span>
                    <div className="relative min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {org.name}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-3 shrink-0">
                      {org.isIndigenous ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] font-medium">
                          Indigenous
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/40">
                          non-Indigenous
                        </span>
                      )}
                      <span
                        className="text-sm font-bold"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {fmt(org.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* State by State */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              State by State
            </h2>
            <p className="text-sm text-[#0A0A0A]/60 mb-8">
              Every state has a story. Click through to see who gets the money
              in your state.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stateData.map((sd) => {
                const indPct = pct(sd.indigenousDollars, sd.totalDollars);
                return (
                  <div
                    key={sd.state}
                    className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden"
                  >
                    {/* State header */}
                    <Link
                      href={`/states/${sd.state.toLowerCase()}`}
                      className="bg-[#0A0A0A] text-white px-5 py-4 flex items-center justify-between hover:bg-[#0A0A0A]/90 transition-colors block"
                    >
                      <div>
                        <p
                          className="text-xs uppercase tracking-wider text-white/50"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {sd.state}
                        </p>
                        <p
                          className="text-lg font-bold text-white"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {STATE_NAMES[sd.state]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-xl font-bold text-white"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {fmt(sd.totalDollars)}
                        </p>
                        <p
                          className="text-xs text-white/50"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {sd.orgCount} orgs funded
                        </p>
                      </div>
                    </Link>

                    {/* Indigenous share bar */}
                    <div className="px-5 py-3 border-b border-[#0A0A0A]/5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#0A0A0A]/50">
                          To Indigenous organisations
                        </span>
                        <span
                          className={`font-bold ${
                            Number(indPct) < 5
                              ? 'text-[#DC2626]'
                              : Number(indPct) < 20
                              ? 'text-amber-600'
                              : 'text-[#059669]'
                          }`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {indPct}% ({fmt(sd.indigenousDollars)})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#0A0A0A]/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            Number(indPct) < 5
                              ? 'bg-[#DC2626]'
                              : Number(indPct) < 20
                              ? 'bg-amber-500'
                              : 'bg-[#059669]'
                          }`}
                          style={{
                            width: `${Math.max(1, Number(indPct))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Top recipients */}
                    <div className="px-5 py-3">
                      <p
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Top recipients
                      </p>
                      <div className="space-y-1.5">
                        {sd.topRecipients.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-[#0A0A0A]/70 truncate max-w-[65%]">
                              {r.name}
                              {r.isIndigenous && (
                                <span className="text-[#059669] ml-1">*</span>
                              )}
                            </span>
                            <span
                              className="font-medium text-[#0A0A0A]/80 shrink-0"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              {fmt(r.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Basecamp link */}
                    <div className="px-5 py-3 border-t border-[#0A0A0A]/5">
                      {sd.hasBasecamp ? (
                        <Link
                          href="/basecamps"
                          className="text-xs font-semibold text-[#059669] flex items-center gap-1 hover:underline"
                        >
                          <Shield className="w-3 h-3" /> ALMA Basecamp active
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href="/join"
                          className="text-xs font-semibold text-[#0A0A0A]/40 flex items-center gap-1 hover:text-[#0A0A0A]/70"
                        >
                          <Users className="w-3 h-3" /> No Basecamp yet — join
                          the network
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CivicScope: What they say */}
          {statements.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-[#0A0A0A]/40" />
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  What the Ministers Say
                </h2>
              </div>
              <p className="text-sm text-[#0A0A0A]/60 mb-6">
                Government announcements about youth justice funding — tracked
                by CivicScope. Compare the announcements above with where the
                money actually lands.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statements.map((s, i) => (
                  <a
                    key={i}
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm leading-snug mb-1.5">
                          {s.headline.trim()}
                        </p>
                        <p className="text-xs text-[#0A0A0A]/50">
                          {s.ministerName} &middot;{' '}
                          {new Date(s.publishedAt).toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#0A0A0A]/20 group-hover:text-[#0A0A0A]/50 shrink-0 mt-1" />
                    </div>
                    {s.mentionedAmounts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {s.mentionedAmounts.slice(0, 3).map((amt, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {amt}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>

              <p
                className="text-xs text-[#0A0A0A]/30 mt-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Source: CivicScope — automated monitoring of QLD ministerial statements.
                More jurisdictions coming.
              </p>
            </section>
          )}

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="max-w-2xl">
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The alternative exists
              </h2>
              <p className="text-white/70 mb-6">
                Community organisations across Australia are proving that local
                models work better, cost less, and keep young people safe.
                The ALMA Network connects them, funds them, and makes their
                work impossible to ignore.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/basecamps"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                >
                  <TrendingUp className="w-4 h-4" /> See the ALMA Network
                </Link>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Join the Network
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 pb-12">
          <p
            className="text-xs text-[#0A0A0A]/30"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Data sources: QGIP, AusTender, NIAA Senate Order, QLD Historical Grants,
            State Budgets. Compiled from public records. Indigenous organisation
            classification based on ORIC registration, ACNC data, and manual verification.
            Some records may be miscategorised — corrections welcome.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

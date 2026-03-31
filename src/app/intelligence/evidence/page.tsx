import { Metadata } from 'next';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import EvidenceScatterChart from '@/components/intelligence/EvidenceScatterChart';
import type { ScatterProgram } from '@/components/intelligence/EvidenceScatterChart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Evidence Scatter: The 550:1 Ratio | JusticeHub Intelligence',
  description:
    'Interactive visualization of every verified youth justice program — cost vs evidence, with detention cost as the reference line.',
  openGraph: {
    title: 'Evidence Scatter: The 550:1 Ratio',
    description:
      'Every verified youth justice program plotted by cost and evidence. The cheapest effective program costs $1,708/year vs $1.33M for detention (ROGS 2024-25).',
  },
};

/* ── Constants ──────────────────────────────────────────────────── */

const DETENTION_COST = 1_330_000; // National avg, ROGS 2024-25 Table 17A.20

const EVIDENCE_ORDER = [
  'Proven (RCT/quasi-experimental, replicated)',
  'Effective (strong evaluation, positive outcomes)',
  'Promising (community-endorsed, emerging evidence)',
  'Indigenous-led (culturally grounded, community authority)',
  'Untested (theory/pilot stage)',
];

const EVIDENCE_SHORT: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Untested (theory/pilot stage)': 'Untested',
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'bg-emerald-600',
  'Effective (strong evaluation, positive outcomes)': 'bg-green-600',
  'Promising (community-endorsed, emerging evidence)': 'bg-amber-500',
  'Indigenous-led (culturally grounded, community authority)': 'bg-purple-600',
  'Untested (theory/pilot stage)': 'bg-gray-400',
};

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* ── Data Fetching ──────────────────────────────────────────────── */

async function getEvidenceData() {
  const supabase = createServiceClient();
  const sb = supabase as any;

  const [interventionsRes, orgsRes, fundingRes] = await Promise.all([
    sb
      .from('alma_interventions')
      .select('id, name, type, evidence_level, cost_per_young_person, operating_organization_id')
      .neq('verification_status', 'ai_generated'),
    sb
      .from('organizations')
      .select('id, name, state, is_indigenous_org')
      .eq('is_active', true),
    sb
      .from('justice_funding')
      .select('alma_organization_id, amount_dollars'),
  ]);

  const interventions: any[] = interventionsRes.data || [];
  const orgs: any[] = orgsRes.data || [];
  const funding: any[] = fundingRes.data || [];

  // Build lookups
  const orgMap = new Map<string, any>();
  for (const o of orgs) orgMap.set(o.id, o);

  const fundingByOrg = new Map<string, number>();
  for (const f of funding) {
    if (f.alma_organization_id && f.amount_dollars) {
      fundingByOrg.set(
        f.alma_organization_id,
        (fundingByOrg.get(f.alma_organization_id) || 0) + f.amount_dollars
      );
    }
  }

  // Build programs
  const programs: ScatterProgram[] = interventions.map((i: any) => {
    const org = i.operating_organization_id ? orgMap.get(i.operating_organization_id) : null;
    return {
      id: i.id,
      name: i.name,
      type: i.type,
      evidence_level: i.evidence_level,
      cost_per_young_person: i.cost_per_young_person,
      org_name: org?.name || null,
      org_id: i.operating_organization_id,
      state: org?.state || null,
      is_indigenous_org: org?.is_indigenous_org || false,
      funding_total: i.operating_organization_id
        ? fundingByOrg.get(i.operating_organization_id) || 0
        : 0,
    };
  });

  // Stats
  const costsOnly = programs
    .filter((p) => p.cost_per_young_person && p.cost_per_young_person > 0)
    .map((p) => p.cost_per_young_person as number);
  const medianCost = Math.round(median(costsOnly));

  // Evidence distribution
  const evidenceDistribution: Record<string, number> = {};
  for (const level of EVIDENCE_ORDER) evidenceDistribution[level] = 0;
  for (const p of programs) {
    if (p.evidence_level && evidenceDistribution[p.evidence_level] !== undefined) {
      evidenceDistribution[p.evidence_level]++;
    }
  }

  // Cheapest effective+
  const effectivePlus = programs
    .filter(
      (p) =>
        p.cost_per_young_person &&
        p.cost_per_young_person > 0 &&
        (p.evidence_level === 'Effective (strong evaluation, positive outcomes)' ||
          p.evidence_level === 'Proven (RCT/quasi-experimental, replicated)')
    )
    .sort((a, b) => (a.cost_per_young_person || 0) - (b.cost_per_young_person || 0));

  const cheapestEffective = effectivePlus.length > 0
    ? { name: effectivePlus[0].name, cost: effectivePlus[0].cost_per_young_person as number }
    : null;

  // Unfunded effective+
  const unfundedEffPlus = effectivePlus.filter((p) => p.funding_total < 100_000).length;

  // Best buys: top 10 cheapest programs rated effective+
  const bestBuys = effectivePlus.slice(0, 10);

  // Funding gap: effective+ but under $100K
  const fundingGap = effectivePlus.filter((p) => p.funding_total < 100_000);

  // Evidence breakdown: per-level stats
  const evidenceBreakdown = EVIDENCE_ORDER.map((level) => {
    const inLevel = programs.filter((p) => p.evidence_level === level);
    const withCost = inLevel.filter((p) => p.cost_per_young_person && p.cost_per_young_person > 0);
    const costs = withCost.map((p) => p.cost_per_young_person as number);
    return {
      level,
      short: EVIDENCE_SHORT[level],
      count: inLevel.length,
      withCost: withCost.length,
      avgCost: costs.length > 0 ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0,
      medianCost: median(costs),
    };
  });

  return {
    programs,
    stats: {
      totalPrograms: programs.length,
      programsWithCost: costsOnly.length,
      medianCost,
      cheapestEffective,
      evidenceDistribution,
      unfundedEffPlus,
    },
    bestBuys,
    fundingGap,
    evidenceBreakdown,
  };
}

/* ── Page ───────────────────────────────────────────────────────── */

export default async function EvidenceScatterPage() {
  const { programs, stats, bestBuys, fundingGap, evidenceBreakdown } = await getEvidenceData();

  const ratio = stats.cheapestEffective
    ? Math.round(DETENTION_COST / stats.cheapestEffective.cost)
    : 0;

  return (
    <>
      <Navigation />
      <main className="min-h-screen" style={{ background: '#F5F0E8' }}>
        {/* Header */}
        <section className="px-6 py-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#666' }}>
            <Link href="/intelligence" className="hover:underline">Intelligence</Link>
            <span>/</span>
            <span>Evidence Scatter</span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
          >
            The {ratio > 0 ? `${ratio}:1` : '550:1'} Ratio
          </h1>
          <p className="text-lg max-w-3xl" style={{ color: '#333', lineHeight: 1.6 }}>
            Every verified youth justice program in Australia, plotted by cost and evidence strength.
            The most expensive option — detention at <span style={{ color: '#DC2626', fontWeight: 700 }}>${(DETENTION_COST / 1000).toFixed(0)}K/year</span> — is
            the red line. Most programs sit far below it.
          </p>

          {/* Links */}
          <div className="flex gap-4 mt-4" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
            <Link
              href="/intelligence/evidence/library"
              className="underline hover:no-underline"
              style={{ color: '#059669' }}
            >
              Evidence Library
            </Link>
            <Link
              href="/intelligence/interventions"
              className="underline hover:no-underline"
              style={{ color: '#059669' }}
            >
              All Interventions
            </Link>
          </div>
        </section>

        {/* Key Stats */}
        <section className="px-6 pb-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Programs with cost data"
              value={stats.programsWithCost.toString()}
              sublabel={`of ${stats.totalPrograms} total`}
            />
            <StatCard
              label="Median cost"
              value={formatDollars(stats.medianCost)}
              sublabel={`vs ${formatDollars(DETENTION_COST)} detention`}
              highlight
            />
            {stats.cheapestEffective && (
              <StatCard
                label="Cheapest Effective"
                value={formatDollars(stats.cheapestEffective.cost)}
                sublabel={`${ratio}:1 ratio vs detention`}
                highlight
              />
            )}
            <StatCard
              label="Unfunded Effective+"
              value={stats.unfundedEffPlus.toString()}
              sublabel="rated Effective+ but <$100K funding"
              alert
            />
            <StatCard
              label="Evidence levels"
              value={Object.entries(stats.evidenceDistribution)
                .map(([k, v]) => `${EVIDENCE_SHORT[k] || k}: ${v}`)
                .join(', ')}
              sublabel=""
              small
            />
          </div>
        </section>

        {/* Scatter Chart */}
        <section className="px-6 pb-12 max-w-7xl mx-auto">
          <div className="border rounded-lg p-6" style={{ background: '#fff', borderColor: '#ddd' }}>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
            >
              Cost vs Evidence
            </h2>
            <EvidenceScatterChart programs={programs} />
          </div>
        </section>

        {/* Evidence Breakdown Table */}
        <section className="px-6 pb-12 max-w-7xl mx-auto">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
          >
            Evidence Breakdown
          </h2>
          <div className="overflow-x-auto border rounded-lg" style={{ borderColor: '#ddd' }}>
            <table className="w-full" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0A0A0A', color: '#F5F0E8' }}>
                  <th className="text-left p-3">Evidence Level</th>
                  <th className="text-right p-3">Programs</th>
                  <th className="text-right p-3">With Cost Data</th>
                  <th className="text-right p-3">Avg Cost/Year</th>
                  <th className="text-right p-3">Median Cost/Year</th>
                  <th className="text-right p-3">Savings vs Detention</th>
                </tr>
              </thead>
              <tbody>
                {evidenceBreakdown.map((row) => (
                  <tr
                    key={row.level}
                    className="border-t"
                    style={{ borderColor: '#eee', background: '#fff' }}
                  >
                    <td className="p-3">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${EVIDENCE_COLORS[row.level]}`} />
                      {row.short}
                    </td>
                    <td className="text-right p-3">{row.count}</td>
                    <td className="text-right p-3">{row.withCost}</td>
                    <td className="text-right p-3">{row.avgCost > 0 ? formatDollars(row.avgCost) : '-'}</td>
                    <td className="text-right p-3">{row.medianCost > 0 ? formatDollars(Math.round(row.medianCost)) : '-'}</td>
                    <td className="text-right p-3" style={{ color: row.medianCost > 0 ? '#059669' : '#999' }}>
                      {row.medianCost > 0 ? formatDollars(DETENTION_COST - Math.round(row.medianCost)) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Best Buys */}
        <section className="px-6 pb-12 max-w-7xl mx-auto">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
          >
            Best Buys: Top 10 Cost-Effective Programs
          </h2>
          <p className="text-sm mb-6" style={{ color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
            Lowest cost per young person among programs rated Effective or Proven
          </p>
          <div className="grid gap-3">
            {bestBuys.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 border rounded-lg p-4"
                style={{ background: '#fff', borderColor: '#ddd' }}
              >
                <span
                  className="text-xl font-bold w-8 text-center"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#059669' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}>
                    {p.name}
                  </p>
                  <p className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#666' }}>
                    {p.org_name || 'Unknown org'} {p.state ? `(${p.state})` : ''}
                    {p.is_indigenous_org ? ' — Indigenous-led' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#059669' }}>
                    {formatDollars(p.cost_per_young_person || 0)}/yr
                  </p>
                  <p className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#666' }}>
                    {p.cost_per_young_person
                      ? `${Math.round(DETENTION_COST / p.cost_per_young_person)}:1 ratio`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", color: p.funding_total > 0 ? '#0A0A0A' : '#DC2626' }}>
                    {p.funding_total > 0 ? formatDollars(p.funding_total) : '$0 funded'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Funding Gap */}
        {fundingGap.length > 0 && (
          <section className="px-6 pb-12 max-w-7xl mx-auto">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#DC2626' }}
            >
              Funding Gap: Effective Programs Getting Less Than $100K
            </h2>
            <p className="text-sm mb-6" style={{ color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
              Programs rated Effective or Proven but receiving less than $100K in tracked government funding
            </p>
            <div className="overflow-x-auto border rounded-lg" style={{ borderColor: '#DC2626' }}>
              <table className="w-full" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0A0A0A', color: '#F5F0E8' }}>
                    <th className="text-left p-3">Program</th>
                    <th className="text-left p-3">Organisation</th>
                    <th className="text-left p-3">State</th>
                    <th className="text-right p-3">Cost/Year</th>
                    <th className="text-right p-3">Evidence</th>
                    <th className="text-right p-3">Govt Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {fundingGap.slice(0, 20).map((p) => (
                    <tr
                      key={p.id}
                      className="border-t"
                      style={{ borderColor: '#eee', background: '#fff' }}
                    >
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">{p.org_name || '-'}</td>
                      <td className="p-3">{p.state || '-'}</td>
                      <td className="text-right p-3" style={{ color: '#059669' }}>
                        {p.cost_per_young_person ? formatDollars(p.cost_per_young_person) : '-'}
                      </td>
                      <td className="text-right p-3">
                        {p.evidence_level ? EVIDENCE_SHORT[p.evidence_level] : '-'}
                      </td>
                      <td
                        className="text-right p-3 font-bold"
                        style={{ color: '#DC2626' }}
                      >
                        {p.funding_total > 0 ? formatDollars(p.funding_total) : '$0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fundingGap.length > 20 && (
              <p className="text-xs mt-2" style={{ color: '#666', fontFamily: "'IBM Plex Mono', monospace" }}>
                Showing 20 of {fundingGap.length} underfunded programs
              </p>
            )}
          </section>
        )}

        {/* Methodology */}
        <section className="px-6 pb-16 max-w-7xl mx-auto">
          <div className="border rounded-lg p-6" style={{ background: '#fff', borderColor: '#ddd' }}>
            <h3
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}
            >
              Methodology
            </h3>
            <div className="space-y-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#666' }}>
              <p>
                Data sourced from the ALMA (Alternative Local Models of Australia) database.
                {stats.totalPrograms.toLocaleString()} verified interventions, {stats.programsWithCost} with
                cost-per-young-person data.
              </p>
              <p>
                Detention cost benchmark of $1.33M/year sourced from Productivity Commission
                Report on Government Services (ROGS) 2024-25, Table 17A.20.
              </p>
              <p>
                Funding data aggregated from {' '}
                <Link href="/intelligence/funding" className="underline hover:no-underline" style={{ color: '#059669' }}>
                  justice funding records
                </Link>
                {' '} across federal and state sources.
                Programs shown as &quot;$0 funded&quot; may receive funding through channels not yet tracked.
              </p>
              <p>
                Evidence levels assigned through systematic review: Proven (RCT with replication),
                Effective (strong evaluation), Promising (community-endorsed), Indigenous-led
                (culturally grounded), Untested (pilot/theory stage).
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sublabel,
  highlight,
  alert,
  small,
}: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
  alert?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className="border rounded-lg p-4"
      style={{
        background: alert ? '#FEF2F2' : '#fff',
        borderColor: alert ? '#DC2626' : highlight ? '#059669' : '#ddd',
      }}
    >
      <p
        className="text-xs mb-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#666' }}
      >
        {label}
      </p>
      <p
        className={small ? 'text-xs font-medium' : 'text-2xl font-bold'}
        style={{
          fontFamily: small ? "'IBM Plex Mono', monospace" : "'Space Grotesk', sans-serif",
          color: alert ? '#DC2626' : highlight ? '#059669' : '#0A0A0A',
        }}
      >
        {value}
      </p>
      {sublabel && (
        <p
          className="text-xs mt-1"
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#999' }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

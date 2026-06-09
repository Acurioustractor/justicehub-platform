import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ChevronLeft, Scale, Megaphone } from 'lucide-react';

export const metadata = {
  title: 'Insights · Justice Matrix',
  description:
    'The shape of the corpus. Outcomes, jurisdictions, and issue patterns across every case and campaign in the Justice Matrix.',
};

const DISPLAY = "'Cormorant Garamond', Georgia, serif";
export const dynamic = 'force-dynamic';

interface CaseSlice {
  outcome: 'favorable' | 'adverse' | 'pending' | null;
  precedent_strength: 'high' | 'medium' | 'low' | null;
  region: string | null;
  year: number | null;
  categories: string[] | null;
  jurisdiction: string;
}
interface CampaignSlice {
  is_ongoing: boolean | null;
  start_year: number | null;
  country_region: string;
  categories: string[] | null;
}
interface CaseRecent {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  outcome: string | null;
  created_at: string;
}
interface CampaignRecent {
  id: string;
  campaign_name: string;
  country_region: string;
  is_ongoing: boolean | null;
  created_at: string;
}

async function loadInsights() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const [casesRes, campaignsRes, recentCasesRes, recentCampaignsRes] = await Promise.all([
    supabase.from('justice_matrix_cases').select('outcome,precedent_strength,region,year,categories,jurisdiction'),
    supabase.from('justice_matrix_campaigns').select('is_ongoing,start_year,country_region,categories'),
    supabase
      .from('justice_matrix_cases')
      .select('id,case_citation,jurisdiction,year,outcome,created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('justice_matrix_campaigns')
      .select('id,campaign_name,country_region,is_ongoing,created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);
  return {
    cases: (casesRes.data ?? []) as CaseSlice[],
    campaigns: (campaignsRes.data ?? []) as CampaignSlice[],
    recentCases: (recentCasesRes.data ?? []) as CaseRecent[],
    recentCampaigns: (recentCampaignsRes.data ?? []) as CampaignRecent[],
  };
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function topCounts<T>(rows: T[], picker: (r: T) => string | null | undefined, n: number) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = picker(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default async function InsightsPage() {
  const { cases, campaigns, recentCases, recentCampaigns } = await loadInsights();
  const totalCases = cases.length;
  const totalCampaigns = campaigns.length;

  // Outcomes
  const outcomeCounts = {
    favorable: cases.filter((c) => c.outcome === 'favorable').length,
    pending: cases.filter((c) => c.outcome === 'pending').length,
    adverse: cases.filter((c) => c.outcome === 'adverse').length,
    untagged: cases.filter((c) => !c.outcome).length,
  };

  // Decades
  const decadeMap = new Map<number, number>();
  for (const c of cases) {
    if (!c.year) continue;
    const d = Math.floor(c.year / 10) * 10;
    decadeMap.set(d, (decadeMap.get(d) ?? 0) + 1);
  }
  const decades = Array.from(decadeMap.entries()).sort((a, b) => a[0] - b[0]);
  const maxDecade = Math.max(...decades.map(([, n]) => n), 1);

  // Top regions (cases)
  const regions = topCounts(cases, (c) => c.region, 8);

  // Top issue areas combining cases + campaigns
  const issueCounts = new Map<string, { cases: number; campaigns: number }>();
  for (const c of cases) for (const cat of c.categories ?? []) {
    const e = issueCounts.get(cat) ?? { cases: 0, campaigns: 0 };
    e.cases++;
    issueCounts.set(cat, e);
  }
  for (const c of campaigns) for (const cat of c.categories ?? []) {
    const e = issueCounts.get(cat) ?? { cases: 0, campaigns: 0 };
    e.campaigns++;
    issueCounts.set(cat, e);
  }
  const topIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1].cases + b[1].campaigns - (a[1].cases + a[1].campaigns))
    .slice(0, 10);

  // Connection density: categories that appear in BOTH cases and campaigns
  const linked = Array.from(issueCounts.entries())
    .filter(([, v]) => v.cases > 0 && v.campaigns > 0)
    .sort((a, b) => Math.min(b[1].cases, b[1].campaigns) - Math.min(a[1].cases, a[1].campaigns))
    .slice(0, 8);
  const linkedTotal = Array.from(issueCounts.values()).filter((v) => v.cases > 0 && v.campaigns > 0).length;

  // Campaigns ongoing share
  const ongoingShare = pct(campaigns.filter((c) => c.is_ongoing).length, totalCampaigns);

  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
      {/* HERO */}
        <section
          style={{ background: 'radial-gradient(circle at 30% 0%, #5a2d74, #38184d 60%, #2c1240)' }}
          className="relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
            <Link
              href="/justice-matrix"
              className="inline-flex items-center gap-2 text-[#eadff2] hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to the matrix
            </Link>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d3b583] mb-4">
              Justice Matrix · Insights
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white max-w-3xl mb-4"
            >
              The shape of the corpus.
            </h1>
            <p className="text-[#eadff2] text-base md:text-lg max-w-2xl">
              {totalCases} cases and {totalCampaigns} campaigns, read across time, outcome, region, and the issues that link cases to campaigns. A working snapshot, not a finished argument.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-14">
          {/* Outcomes */}
          <Block kicker="Outcomes" title="What courts have done">
            <p className="text-base leading-7 mb-6 max-w-3xl" style={{ color: '#584b40' }}>
              Of {totalCases} cases in the matrix, {outcomeCounts.favorable} ({pct(outcomeCounts.favorable, totalCases)}%) resolved favorably, {outcomeCounts.adverse} ({pct(outcomeCounts.adverse, totalCases)}%) adversely, and {outcomeCounts.pending} ({pct(outcomeCounts.pending, totalCases)}%) remain pending. {outcomeCounts.untagged} are not yet tagged with an outcome, a curation gap rather than a substantive one.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat tone="good" label="Favorable" value={outcomeCounts.favorable} share={pct(outcomeCounts.favorable, totalCases)} />
              <Stat tone="warn" label="Pending" value={outcomeCounts.pending} share={pct(outcomeCounts.pending, totalCases)} />
              <Stat tone="bad" label="Adverse" value={outcomeCounts.adverse} share={pct(outcomeCounts.adverse, totalCases)} />
              <Stat tone="muted" label="Untagged" value={outcomeCounts.untagged} share={pct(outcomeCounts.untagged, totalCases)} />
            </div>
          </Block>

          {/* Decades */}
          <Block kicker="Time" title="When cases were decided">
            <p className="text-base leading-7 mb-6 max-w-3xl" style={{ color: '#584b40' }}>
              The matrix skews recent: most cases come from the 2020s. Older landmark decisions are present where they remain operative ({decades[0]?.[0] ?? 1985}–{decades[decades.length-1]?.[0] ?? 2026}).
            </p>
            <div className="space-y-2">
              {decades.map(([d, n]) => (
                <div key={d} className="grid grid-cols-[80px_1fr_60px] items-center gap-3">
                  <div className="text-[12px] font-semibold tabular-nums" style={{ color: '#7d5f3d' }}>
                    {d}s
                  </div>
                  <div className="rounded-full overflow-hidden h-3" style={{ background: '#f3eadb' }}>
                    <div
                      className="h-full"
                      style={{ width: `${(n / maxDecade) * 100}%`, background: 'linear-gradient(to right, #f0c36f, #e98f63, #cfa4ff)' }}
                    />
                  </div>
                  <div className="text-[12px] font-semibold text-right tabular-nums" style={{ color: '#2b2530' }}>
                    {n}
                  </div>
                </div>
              ))}
            </div>
          </Block>

          {/* Coverage */}
          <Block kicker="Coverage" title="Where the matrix has reach">
            <p className="text-base leading-7 mb-6 max-w-3xl" style={{ color: '#584b40' }}>
              Region labels in the corpus mix continents, country sub-jurisdictions, and the &ldquo;National&rdquo; bucket; this snapshot is honest about that mix rather than smoothed.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {regions.map(([r, n]) => (
                <Link
                  key={r}
                  href={`/justice-matrix/cases?cat=${encodeURIComponent('')}`}
                  className="block rounded-[18px] border p-4 hover:bg-white transition-colors"
                  style={{ background: '#fff8ef', borderColor: '#e6d7c1' }}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1" style={{ color: '#8d6a44' }}>
                    {r}
                  </div>
                  <div
                    style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
                    className="text-3xl tabular-nums"
                  >
                    {n}
                  </div>
                </Link>
              ))}
            </div>
          </Block>

          {/* Issue areas + linkage */}
          <Block kicker="Issue areas" title="Where cases and campaigns talk to each other">
            <p className="text-base leading-7 mb-6 max-w-3xl" style={{ color: '#584b40' }}>
              {linkedTotal} categories appear in both the cases and campaigns sides of the matrix. That overlap is the connective tissue: a lawyer reading a profile can click through to the campaigns mobilising on the same issue, and an organiser can do the reverse.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: '#8d6a44' }}>
                  Top issue areas (cases + campaigns)
                </div>
                <ul className="space-y-1.5">
                  {topIssues.map(([cat, v]) => (
                    <li key={cat} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm" style={{ color: '#2b2530' }}>
                      <Link
                        href={`/justice-matrix/cases?cat=${encodeURIComponent(cat)}`}
                        className="hover:underline truncate"
                      >
                        {cat}
                      </Link>
                      <span className="text-[12px] tabular-nums" style={{ color: '#7d5f3d' }}>
                        {v.cases} cases
                      </span>
                      <span className="text-[12px] tabular-nums" style={{ color: '#7d5f3d' }}>
                        {v.campaigns} campaigns
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: '#8d6a44' }}>
                  Linked both sides
                </div>
                <ul className="space-y-1.5">
                  {linked.map(([cat, v]) => (
                    <li key={cat} className="text-sm" style={{ color: '#2b2530' }}>
                      <span className="font-semibold">{cat}</span>{' '}
                      <span className="text-[12px]" style={{ color: '#7d5f3d' }}>
                        ({v.cases} ↔ {v.campaigns})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Block>

          {/* Live state */}
          <Block kicker="Live state" title="What's still moving">
            <p className="text-base leading-7 mb-6 max-w-3xl" style={{ color: '#584b40' }}>
              {ongoingShare}% of campaigns in the matrix are tagged ongoing: advocacy work where an organiser can still pick up a phone, a strategy, or a coalition. Newest additions sit at the top.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <RecentList
                kicker="Recent cases"
                icon={<Scale className="w-4 h-4" />}
                items={recentCases.map((c) => ({
                  id: c.id,
                  href: `/justice-matrix/cases/${c.id}`,
                  title: c.case_citation,
                  meta: [c.jurisdiction, c.year ? String(c.year) : null, c.outcome].filter(Boolean) as string[],
                }))}
              />
              <RecentList
                kicker="Recent campaigns"
                icon={<Megaphone className="w-4 h-4" />}
                items={recentCampaigns.map((c) => ({
                  id: c.id,
                  href: `/justice-matrix/campaigns/${c.id}`,
                  title: c.campaign_name,
                  meta: [c.country_region, c.is_ongoing === false ? 'concluded' : 'active'].filter(Boolean) as string[],
                }))}
              />
            </div>
        </Block>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------

function Block({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3" style={{ color: '#8d6a44' }}>
        {kicker}
      </div>
      <h2
        style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
        className="text-3xl md:text-4xl mb-5 leading-tight"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  share,
  tone,
}: {
  label: string;
  value: number;
  share: number;
  tone: 'good' | 'bad' | 'warn' | 'muted';
}) {
  const palette = {
    good: { bg: '#fff8ef', border: '#9fc3a6', label: '#3d6f4a' },
    bad: { bg: '#fff8ef', border: '#d6a0a0', label: '#8a2a2a' },
    warn: { bg: '#fff8ef', border: '#dbbf90', label: '#a96a1c' },
    muted: { bg: '#fff8ef', border: '#e6d7c1', label: '#7d5f3d' },
  }[tone];
  return (
    <div
      className="rounded-[18px] border p-4"
      style={{ background: palette.bg, borderColor: palette.border, boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1" style={{ color: palette.label }}>
        {label}
      </div>
      <div
        style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530', lineHeight: 1 }}
        className="text-4xl tabular-nums"
      >
        {value}
      </div>
      <div className="text-[11px] tabular-nums mt-1" style={{ color: '#7d5f3d' }}>
        {share}%
      </div>
    </div>
  );
}

function RecentList({
  kicker,
  icon,
  items,
}: {
  kicker: string;
  icon: React.ReactNode;
  items: Array<{ id: string; href: string; title: string; meta: string[] }>;
}) {
  return (
    <div
      className="rounded-[22px] border p-5"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-7 w-7 rounded-full items-center justify-center" style={{ background: '#f3eadb', color: '#4a2560' }}>
          {icon}
        </span>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8d6a44' }}>
          {kicker}
        </div>
      </div>
      <ul className="divide-y" style={{ borderColor: '#e8dcc9' }}>
        {items.map((it) => (
          <li key={it.id} className="py-2.5">
            <Link href={it.href} className="block hover:opacity-80 transition-opacity">
              <div style={{ fontFamily: DISPLAY, color: '#2b2530' }} className="text-lg font-medium leading-tight">
                {it.title}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: '#5e5145' }}>
                {it.meta.join(' · ')}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

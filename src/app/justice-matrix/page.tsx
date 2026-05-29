import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { ArrowRight, Globe, Scale, Megaphone, Database, Search, BookOpen, Map as MapIcon } from 'lucide-react';
import { bucketJurisdiction } from '@/lib/justice-matrix/jurisdiction';

export const dynamic = 'force-dynamic';

// Local "research tool" tokens — matches /justice-matrix/explore so the entry
// point and the tool feel like one experience. Scoped to this route; the global
// JusticeHub editorial design system is not used or modified here.
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  accentSoft: 'rgba(74,37,96,0.08)',
  barBg: '#1c1420',
  gold: '#d3b583',
};

interface Stats {
  cases: number;
  campaigns: number;
  evidence: number;
  sources: number;
  regions: number;
  refugeeCases: number;
}

async function loadStats(): Promise<Stats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const [casesCount, campaignsCount, evidenceCount, sourcesCount, jurisData, refugeeCount] =
    await Promise.all([
      supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
      supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
      // Consent-gated, same as explore: excludes 'Strictly Private'.
      supabase
        .from('alma_evidence')
        .select('*', { count: 'exact', head: true })
        .in('consent_level', ['Public Knowledge Commons', 'Community Controlled']),
      supabase.from('justice_matrix_sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('justice_matrix_cases').select('jurisdiction'),
      supabase
        .from('justice_matrix_cases')
        .select('*', { count: 'exact', head: true })
        .overlaps('categories', ['refugee', 'asylum']),
    ]);
  // Distinct regions via the same normalizer the explore Jurisdiction view uses.
  const regions = new Set<string>();
  for (const row of (jurisData.data ?? []) as { jurisdiction: string }[]) {
    if (row.jurisdiction) regions.add(bucketJurisdiction(row.jurisdiction).region);
  }
  regions.add('Australia'); // evidence is Australia-grounded
  return {
    cases: casesCount.count ?? 0,
    campaigns: campaignsCount.count ?? 0,
    evidence: evidenceCount.count ?? 0,
    sources: sourcesCount.count ?? 0,
    regions: regions.size,
    refugeeCases: refugeeCount.count ?? 0,
  };
}

export default async function JusticeMatrixLandingPage() {
  const stats = await loadStats();
  const total = stats.cases + stats.campaigns + stats.evidence;

  return (
    <main style={{ background: C.page, color: C.ink, fontFamily: SANS }} className="min-h-screen">
      {/* HERO — dark panel matching the explore search bar, with the funnel */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at 22% 0%, #3a1f4d, #1c1420 70%)' }}
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.26em', color: C.gold }} className="uppercase mb-5">
            Justice Matrix
          </div>
          <h1 className="text-white font-semibold tracking-tight text-4xl md:text-6xl max-w-3xl leading-[1.05] mb-5">
            Find the precedent, playbook, or evidence, then move.
          </h1>
          <p className="text-[15px] md:text-base max-w-2xl leading-7 mb-8" style={{ color: '#cbb8d6' }}>
            A searchable clearing house for strategic litigation, advocacy, and Australian youth-justice evidence.
            Mapped and connected across {stats.regions} regions so a win in one place can be reused in another.
          </p>

          {/* Funnel: native GET form → lands in the explore tool */}
          <form action="/justice-matrix/explore" className="max-w-2xl flex items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
              <input
                type="text"
                name="q"
                placeholder="Search cases, campaigns, evidence…"
                aria-label="Search the Justice Matrix"
                className="w-full rounded-md pl-9 pr-3 py-3 text-[15px] focus:outline-none"
                style={{ background: '#fff', color: C.ink, border: '1px solid #d4d4d8' }}
              />
            </div>
            <button
              type="submit"
              className="rounded-md px-5 text-sm font-semibold"
              style={{ background: C.gold, color: '#1c1420' }}
            >
              Search
            </button>
          </form>

          {/* Quick entries — all deep-link into the explore tool */}
          <div className="flex flex-wrap gap-2 mt-4" style={{ fontFamily: MONO, fontSize: 12 }}>
            <QuickLink href="/justice-matrix/explore">Browse all {total.toLocaleString()}</QuickLink>
            <QuickLink href="/justice-matrix/explore?type=case">Cases {stats.cases}</QuickLink>
            <QuickLink href="/justice-matrix/explore?type=campaign">Campaigns {stats.campaigns}</QuickLink>
            <QuickLink href="/justice-matrix/explore?type=evidence">Evidence {stats.evidence}</QuickLink>
            <QuickLink href="/justice-matrix/explore?view=jurisdiction">By jurisdiction</QuickLink>
          </div>
        </div>
      </section>

      {/* ENTRY TILES — the funnel, made tactile */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <EntryTile
            href="/justice-matrix/explore?type=case"
            icon={<Scale className="w-5 h-5" />}
            color="#4a2560"
            label="Cases"
            count={stats.cases}
            body="Strategic litigation across courts worldwide, with outcome, holding and precedent strength."
          />
          <EntryTile
            href="/justice-matrix/explore?type=campaign"
            icon={<Megaphone className="w-5 h-5" />}
            color="#a96a1c"
            label="Campaigns"
            count={stats.campaigns}
            body="Advocacy work and tactics, with the organisations leading them."
          />
          <EntryTile
            href="/justice-matrix/explore?type=evidence"
            icon={<BookOpen className="w-5 h-5" />}
            color="#1f6f78"
            label="Evidence"
            count={stats.evidence}
            body="Australian youth-justice research and evaluations of what works, with consent respected."
          />
          <EntryTile
            href="/justice-matrix/explore?view=jurisdiction"
            icon={<MapIcon className="w-5 h-5" />}
            color="#4a2560"
            label="By jurisdiction"
            count={stats.regions}
            body="Browse by region: Australia by state, plus international courts."
            countLabel="regions"
          />
        </div>
      </section>

      {/* What this is */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14">
          <div>
            <Kicker>What this is</Kicker>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4" style={{ color: C.ink }}>
              Built so wins don&apos;t stay isolated.
            </h2>
            <div className="space-y-4 text-[15px] leading-7" style={{ color: C.body }}>
              <p>
                Civil-rights and social-justice lawyers pursue landmark cases that defend fundamental freedoms,
                but their victories often stay siloed, and strategies and pleadings get replicated inefficiently or lost.
              </p>
              <p>
                The Justice Matrix maps, classifies and connects strategic litigation, advocacy, and the
                Australian evidence base. An AI-assisted scanner pulls candidates from court databases and
                civil-society sources; a human review queue decides what becomes part of the matrix.
              </p>
            </div>
          </div>
          <aside className="space-y-3">
            <SidePanel
              kicker="Refugee & asylum"
              title={`${stats.refugeeCases} cases`}
              body="A working corpus of refugee and asylum jurisprudence from the UK, EU, ECtHR, US, Canada, Australia and Africa, with linked campaigns."
              href="/justice-matrix/explore?cat=refugee,asylum"
              ctaLabel="Open in explore"
            />
            <SidePanel
              kicker="Semantic search"
              title="Search by meaning"
              body="Switch to semantic mode to surface related ideas by meaning across cases, campaigns and evidence, beyond keyword matches."
              href="/justice-matrix/explore?mode=semantic"
              ctaLabel="Try semantic mode"
            />
          </aside>
        </div>
      </section>

      {/* How it stays current */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <Kicker>How it stays current</Kicker>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8 max-w-2xl" style={{ color: C.ink }}>
          Sources to queue to matrix.
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          <StepCard
            icon={<Database className="w-5 h-5" />}
            step="01"
            title="Sources"
            body={`${stats.sources} active feeds: court databases (HUDOC, CourtListener, BAILII, AustLII, CJEU), legal aggregators (UNHCR Refworld, EDAL), and civil-society networks. Scanned by cron + a Playwright/LLM CLI.`}
          />
          <StepCard
            icon={<Globe className="w-5 h-5" />}
            step="02"
            title="Review queue"
            body="Every scanned item lands in a curator queue, not the live matrix. An admin sees the candidate beside its source, edits fields, and approves, rejects, or marks duplicate. Nothing publishes without approval."
          />
          <StepCard
            icon={<Scale className="w-5 h-5" />}
            step="03"
            title="Profiles"
            body="Approved items become case, campaign, or evidence profiles, connected by semantic similarity so any profile surfaces the related cases, campaigns and evidence around it."
          />
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Local UI (research-tool; not shared)
// ---------------------------------------------------------------------------

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: C.muted }} className="uppercase mb-2.5">
      {children}
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
      style={{ background: 'rgba(255,255,255,0.08)', color: '#e6dcea', border: '1px solid rgba(255,255,255,0.16)' }}
    >
      {children}
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

function EntryTile({
  href,
  icon,
  color,
  label,
  count,
  body,
  countLabel,
}: {
  href: string;
  icon: React.ReactNode;
  color: string;
  label: string;
  count: number;
  body: string;
  countLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border p-4 transition-colors hover:border-zinc-300"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center justify-center rounded-md h-9 w-9" style={{ background: `${color}14`, color }}>
          {icon}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 22, color: C.ink }} className="tabular-nums">
          {count.toLocaleString()}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-semibold text-[15px]" style={{ color: C.ink }}>
          {label}
        </span>
        {countLabel && <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>{countLabel}</span>}
      </div>
      <p className="mt-1 text-[13px] leading-5" style={{ color: C.muted }}>
        {body}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium group-hover:underline" style={{ color }}>
        Open <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  );
}

function SidePanel({
  kicker,
  title,
  body,
  href,
  ctaLabel,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border p-5 transition-colors hover:border-zinc-300"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <Kicker>{kicker}</Kicker>
      <div className="font-semibold text-lg mb-1.5" style={{ color: C.ink }}>
        {title}
      </div>
      <p className="text-[13px] leading-6" style={{ color: C.body }}>
        {body}
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: C.accent }}>
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

function StepCard({
  icon,
  step,
  title,
  body,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center justify-center rounded-md h-9 w-9" style={{ background: C.accentSoft, color: C.accent }}>
          {icon}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: C.muted }}>{step}</span>
      </div>
      <div className="font-semibold text-lg mb-2" style={{ color: C.ink }}>
        {title}
      </div>
      <p className="text-[13px] leading-6" style={{ color: C.body }}>
        {body}
      </p>
    </div>
  );
}

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { PreviewGate } from '@/components/PreviewGate';
import { ArrowRight, Globe, Scale, Megaphone, Database } from 'lucide-react';

const DISPLAY = "'Cormorant Garamond', Georgia, serif";

export const dynamic = 'force-dynamic';

interface Stats {
  cases: number;
  campaigns: number;
  sources: number;
  jurisdictions: number;
  regions: number;
  refugeeCases: number;
  ongoingCampaigns: number;
}

async function loadStats(): Promise<Stats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const [casesCount, campaignsCount, sourcesCount, jurisData, refugeeCount, ongoingCount] =
    await Promise.all([
      supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
      supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('justice_matrix_sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('justice_matrix_cases').select('jurisdiction,region'),
      supabase
        .from('justice_matrix_cases')
        .select('*', { count: 'exact', head: true })
        .overlaps('categories', ['refugee', 'asylum']),
      supabase
        .from('justice_matrix_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('is_ongoing', true),
    ]);
  const jurisdictions = new Set<string>();
  const regions = new Set<string>();
  for (const row of (jurisData.data ?? []) as { jurisdiction: string; region: string | null }[]) {
    if (row.jurisdiction) jurisdictions.add(row.jurisdiction);
    if (row.region) regions.add(row.region);
  }
  return {
    cases: casesCount.count ?? 0,
    campaigns: campaignsCount.count ?? 0,
    sources: sourcesCount.count ?? 0,
    jurisdictions: jurisdictions.size,
    regions: regions.size,
    refugeeCases: refugeeCount.count ?? 0,
    ongoingCampaigns: ongoingCount.count ?? 0,
  };
}

export default async function JusticeMatrixLandingPage() {
  const stats = await loadStats();

  return (
    <PreviewGate title="Justice Matrix" subtitle="Strategic litigation clearing house — preview">
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
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-14 md:pb-20">
            <div className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#d3b583] mb-5">
              Justice Matrix
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.02 }}
              className="text-5xl md:text-7xl text-white max-w-4xl mb-7"
            >
              A clearing house for strategic litigation and advocacy.
            </h1>
            <p className="text-[#eadff2] text-lg md:text-xl max-w-3xl leading-8">
              {stats.cases.toLocaleString()} strategic cases, {stats.campaigns.toLocaleString()} advocacy campaigns, {stats.sources.toLocaleString()} active sources. Curated across {stats.regions} regions and {stats.jurisdictions.toLocaleString()} jurisdictions so practitioners can find the precedent or playbook they need, adapt it, and move.
            </p>

            <div className="flex flex-wrap gap-3 mt-9">
              <PrimaryCta href="/justice-matrix/cases">
                <Scale className="w-4 h-4" />
                Browse {stats.cases.toLocaleString()} cases
              </PrimaryCta>
              <PrimaryCta href="/justice-matrix/campaigns">
                <Megaphone className="w-4 h-4" />
                Browse {stats.campaigns.toLocaleString()} campaigns
              </PrimaryCta>
              <SecondaryCta href="/justice-matrix/contribute">
                Contribute a case or campaign
              </SecondaryCta>
              <SecondaryCta href="/justice-matrix/insights">
                See the insights
              </SecondaryCta>
              <SecondaryCta href="/preview/justice-matrix">
                View the partnership overview
              </SecondaryCta>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Strategic cases" value={stats.cases.toLocaleString()} />
            <StatCard label="Advocacy campaigns" value={stats.campaigns.toLocaleString()} />
            <StatCard label="Active sources" value={stats.sources.toLocaleString()} />
            <StatCard label="Jurisdictions" value={stats.jurisdictions.toLocaleString()} />
          </div>
        </section>

        {/* What this is */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 pb-12 md:pb-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3" style={{ color: '#8d6a44' }}>
                What this is
              </div>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530', lineHeight: 1.1 }}
                className="text-4xl md:text-5xl mb-6"
              >
                Built so wins don&apos;t stay isolated.
              </h2>
              <div className="space-y-5 text-lg leading-8" style={{ color: '#584b40' }}>
                <p>
                  Around the world, civil-rights and social-justice lawyers pursue landmark cases that defend fundamental freedoms. Their victories are often isolated. Litigation strategies, pleadings, and advocacy campaigns are replicated inefficiently or lost entirely inside national silos.
                </p>
                <p>
                  The Justice Matrix maps, classifies and connects strategic litigation and advocacy across jurisdictions. It is a working ecosystem with case profiles, campaign profiles, an AI-assisted scanner that pulls candidates from court databases and civil-society sources, and a human review queue that decides what becomes part of the matrix.
                </p>
              </div>
            </div>

            <aside className="space-y-4">
              <SidePanel
                kicker="Refugee &amp; asylum"
                title={`${stats.refugeeCases} cases, growing`}
                body={`A working corpus of refugee and asylum jurisprudence from the UK, EU, ECtHR, US, Canada, Australia, and Africa, with linked campaigns. Filter by chip on the case list to see only this domain.`}
                href="/justice-matrix/cases?cat=refugee,asylum"
                ctaLabel="See refugee cases"
              />
              <SidePanel
                kicker="Live campaigns"
                title={`${stats.ongoingCampaigns} ongoing`}
                body={`Advocacy work that is still in motion. Use the list to filter by region or topic and reach the lead organisations.`}
                href="/justice-matrix/campaigns?status=active"
                ctaLabel="See active campaigns"
              />
            </aside>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 pb-16 md:pb-24">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3" style={{ color: '#8d6a44' }}>
            How it stays current
          </div>
          <h2
            style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530', lineHeight: 1.1 }}
            className="text-4xl md:text-5xl mb-10 max-w-3xl"
          >
            Sources to queue to matrix.
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              icon={<Database className="w-5 h-5" />}
              step="01"
              title="Sources"
              body={`${stats.sources} active feeds: court databases (HUDOC, CourtListener, BAILII, AustLII, CJEU), legal aggregators (UNHCR Refworld, EDAL), and civil-society networks. JSON sources are scanned by a weekly Vercel cron; HTML sources run via a Playwright + LLM CLI.`}
            />
            <StepCard
              icon={<Globe className="w-5 h-5" />}
              step="02"
              title="Review queue"
              body="Every scanned item lands in a curator queue, not the live matrix. An admin sees the candidate next to its source, edits the fields, and approves, rejects, or marks duplicate. Nothing publishes without that approval."
            />
            <StepCard
              icon={<Scale className="w-5 h-5" />}
              step="03"
              title="Profiles"
              body="Approved items become case or campaign profiles, joined by category overlap so a visitor sees similar cases and linked campaigns from any profile. Copy citations, copy permalinks, follow the threads."
            />
          </div>
        </section>
      </main>
    </PreviewGate>
  );
}

// ---------------------------------------------------------------------------
// Bits and pieces (kept local; not used elsewhere yet)
// ---------------------------------------------------------------------------

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-colors"
      style={{ background: '#f8f1e6', color: '#2b2530', borderColor: '#f8f1e6' }}
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition-colors hover:bg-white/10"
      style={{ background: 'transparent', color: '#f1e6f7', borderColor: 'rgba(255,255,255,0.35)' }}
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[22px] border p-6"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: '#8d6a44' }}>
        {label}
      </div>
      <div
        style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1, color: '#2b2530' }}
        className="text-5xl tabular-nums"
      >
        {value}
      </div>
    </div>
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
      className="block rounded-[22px] border p-6 hover:bg-white transition-colors"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2" style={{ color: '#8d6a44' }}>
        <span dangerouslySetInnerHTML={{ __html: kicker }} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }} className="text-2xl mb-2 leading-snug">
        {title}
      </div>
      <p className="text-sm leading-6" style={{ color: '#584b40' }}>
        {body}
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#4a2560' }}>
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </div>
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
    <div
      className="rounded-[22px] border p-6"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-full p-2" style={{ background: '#f3eadb', color: '#4a2560' }}>
          {icon}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#8d6a44' }}>
          {step}
        </div>
      </div>
      <div
        style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
        className="text-2xl mb-3 leading-snug"
      >
        {title}
      </div>
      <p className="text-sm leading-6" style={{ color: '#584b40' }}>
        {body}
      </p>
    </div>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  Compass,
  FileText,
  Globe2,
  Layers3,
  MapPinned,
  Megaphone,
  MessageCircle,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { MatrixFlowNav } from '../_components/MatrixFlowNav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Guide · Justice Matrix',
  description:
    'A cover page for understanding the Justice Matrix: why it exists, how the surfaces work, and how to move through the UX.',
};

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
  teal: '#1f6f78',
  amber: '#a96a1c',
  green: '#256c42',
  gold: '#d3b583',
  dark: '#1c1420',
};

interface GuideStats {
  cases: number;
  campaigns: number;
  evidence: number;
  sources: number;
  issues: number;
  verifiedCases: number;
}

async function loadStats(): Promise<GuideStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const [cases, campaigns, evidence, sources, issues, verifiedCases] = await Promise.all([
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }),
    supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true }),
    supabase
      .from('alma_evidence')
      .select('*', { count: 'exact', head: true })
      .in('consent_level', ['Public Knowledge Commons', 'Community Controlled']),
    supabase.from('justice_matrix_sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('justice_matrix_issues').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true }).eq('verified', true),
  ]);

  return {
    cases: cases.count ?? 0,
    campaigns: campaigns.count ?? 0,
    evidence: evidence.count ?? 0,
    sources: sources.count ?? 0,
    issues: issues.count ?? 0,
    verifiedCases: verifiedCases.count ?? 0,
  };
}

const surfaceCards = [
  {
    label: 'Refugee & Asylum',
    href: '/justice-matrix/explore?surface=refugee',
    color: C.accent,
    icon: <Globe2 className="h-5 w-5" />,
    job: 'Cross-border strategic litigation and advocacy for people seeking asylum.',
    includes: ['cases from courts and tribunals', 'campaigns and coalitions', 'issue playbooks'],
  },
  {
    label: 'Youth Justice',
    href: '/justice-matrix/explore?surface=youth',
    color: C.teal,
    icon: <Users className="h-5 w-5" />,
    job: 'Australian evidence, cases, and campaigns for keeping children out of the justice system.',
    includes: ['ALMA evidence', 'Australian inquiries and cases', 'movement and reform campaigns'],
  },
];

const publicSurfaces = [
  {
    route: '/justice-matrix',
    href: '/justice-matrix',
    label: 'Hub',
    icon: <Compass className="h-4 w-4" />,
    job: 'Orient quickly. See the corpus, featured rails, and entry points.',
  },
  {
    route: '/justice-matrix/explore',
    href: '/justice-matrix/explore',
    label: 'Explore',
    icon: <Search className="h-4 w-4" />,
    job: 'Search by keyword or meaning, then filter by type, scope, category, outcome, or strength.',
  },
  {
    route: '/justice-matrix/map',
    href: '/justice-matrix/map',
    label: 'Map',
    icon: <MapPinned className="h-4 w-4" />,
    job: 'Search the corpus on a world map, with coordinate precision, surface filters, and near-me sorting.',
  },
  {
    route: '/justice-matrix/how-it-works',
    href: '/justice-matrix/how-it-works',
    label: 'How it works',
    icon: <CircleHelp className="h-4 w-4" />,
    job: 'Explain the pipeline, surfaces, trust model, and frequently asked questions.',
  },
  {
    route: '/justice-matrix/ask',
    href: '/justice-matrix/ask',
    label: 'Ask',
    icon: <MessageCircle className="h-4 w-4" />,
    job: 'Ask a plain-language question and receive a cited research packet from Matrix records.',
  },
  {
    route: '/justice-matrix/issues',
    href: '/justice-matrix/issues',
    label: 'Issues',
    icon: <Layers3 className="h-4 w-4" />,
    job: 'Start from a strategic question and see law, movement, people, and playbook in one place.',
  },
  {
    route: '/justice-matrix/cases/[id]',
    href: '/justice-matrix/cases',
    label: 'Case profiles',
    icon: <Scale className="h-4 w-4" />,
    job: 'Read the legal record: court, issue, holding, source, verification, and related work.',
  },
  {
    route: '/justice-matrix/campaigns/[id]',
    href: '/justice-matrix/campaigns',
    label: 'Campaign profiles',
    icon: <Megaphone className="h-4 w-4" />,
    job: 'Understand movement strategy: asks, tactics, coalitions, status, and source link.',
  },
  {
    route: '/justice-matrix/contribute',
    href: '/justice-matrix/contribute',
    label: 'Contribute',
    icon: <FileText className="h-4 w-4" />,
    job: 'Submit a case, campaign, pleading, source, or correction for editorial review.',
  },
];

const adminSurfaces = [
  {
    route: '/admin/justice-matrix/sources',
    label: 'Sources',
    job: 'Manage feeds that power scanning: court databases, legal databases, NGOs, and trusted sources.',
  },
  {
    route: '/admin/justice-matrix/discoveries',
    label: 'Discoveries',
    job: 'Triage scanned candidates, approve real items, reject noise, and avoid duplicates.',
  },
  {
    route: '/admin/justice-matrix/review',
    label: 'Legal review',
    job: 'Open the source of record and confirm legal facts before a case earns the verified badge.',
  },
  {
    route: '/admin/justice-matrix/health',
    label: 'Health',
    job: 'Spot missing links, weak metadata, queue problems, and source quality issues.',
  },
];

const journeys = [
  {
    actor: 'Strategic litigator',
    query: 'Has anyone argued this before, and did it win?',
    path: 'Ask -> Explore -> case profile -> issue playbook',
  },
  {
    actor: 'Campaigner',
    query: 'What tactic moved government or public pressure?',
    path: 'Issues -> campaign profile -> linked cases -> contribute update',
  },
  {
    actor: 'Editor or curator',
    query: 'What did the scanner find, and can we trust it?',
    path: 'Sources -> discoveries -> legal review -> featured rail',
  },
  {
    actor: 'OHCHR or funder',
    query: 'What is the state of protection and where are the gaps?',
    path: 'Hub -> issues -> insights -> future exportable brief',
  },
];

export default async function JusticeMatrixGuidePage() {
  const stats = await loadStats();
  const total = stats.cases + stats.campaigns + stats.evidence;

  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1c1420 0%, #2f1d38 42%, #123f45 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-10 md:pb-14">
          <Link
            href="/justice-matrix"
            className="inline-block uppercase mb-5"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', color: C.gold }}
          >
            Justice Matrix
          </Link>
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-end">
            <div>
              <h1 className="text-white font-semibold tracking-tight text-4xl md:text-6xl max-w-3xl leading-[1.05] mb-5">
                A field guide to the clearing house.
              </h1>
              <p className="text-[15px] md:text-base max-w-2xl leading-7 mb-7" style={{ color: '#d9cbe3' }}>
                Why the Justice Matrix exists, how the two surfaces work, and how to move through the UX from a
                strategic question to cases, campaigns, evidence, and review.
              </p>
              <div className="flex flex-wrap gap-2">
                <HeroLink href="/justice-matrix/ask">Ask the Matrix</HeroLink>
                <HeroLink href="/justice-matrix/how-it-works">How it works</HeroLink>
                <HeroLink href="/justice-matrix/issues">Start from an issue</HeroLink>
                <HeroLink href="/justice-matrix/explore">Open Explore</HeroLink>
                <HeroLink href="/justice-matrix/map">Open Map</HeroLink>
              </div>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Metric value={total} label="records" />
                <Metric value={stats.issues} label="issues" />
                <Metric value={stats.sources} label="active sources" />
                <Metric value={stats.verifiedCases} label="verified cases" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="guide" />

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <Kicker>The reason</Kicker>
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-10">
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight">
            Strategic work gets weaker when memory is scattered.
          </h2>
          <div className="space-y-4 text-[15px] leading-7" style={{ color: C.body }}>
            <p>
              The background paper proposed the Matrix as a Global Strategic Litigation and Advocacy Clearing House.
              The problem is fragmentation: lawyers, clinics, NGOs, academics, and movements fight similar battles
              across borders, but the case law, pleadings, public campaigns, and tactics are hard to find together.
            </p>
            <p>
              JusticeHub already had the raw ingredients: Postgres, source scanning, semantic search, public profiles,
              consent-aware evidence, and admin review. The Justice Matrix turns those ingredients into a working
              strategy layer.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
        <Kicker>Two surfaces, one engine</Kicker>
        <div className="grid md:grid-cols-2 gap-4">
          {surfaceCards.map((surface) => (
            <Link
              key={surface.label}
              href={surface.href}
              className="group rounded-lg border p-5 md:p-6 transition-colors hover:border-zinc-300"
              style={{ background: C.surface, borderColor: C.border }}
            >
              <div className="flex items-center gap-3 mb-4" style={{ color: surface.color }}>
                {surface.icon}
                <h2 className="text-xl font-semibold tracking-tight" style={{ color: C.ink }}>
                  {surface.label}
                </h2>
              </div>
              <p className="text-[14px] leading-6 mb-4" style={{ color: C.body }}>
                {surface.job}
              </p>
              <ul className="space-y-2 mb-5">
                {surface.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: surface.color }} />
                    {item}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline" style={{ color: surface.color }}>
                Open this surface <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
        <Kicker>UX map</Kicker>
        <div className="grid lg:grid-cols-[360px_1fr] gap-6 lg:gap-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Every screen has a job.
            </h2>
            <p className="text-[14px] leading-6" style={{ color: C.body }}>
              The public side is for finding and understanding. The admin side is for trust, source quality, and
              editorial control.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {publicSurfaces.map((item) => (
              <SurfaceRoute key={item.route} href={item.href} label={item.label} route={item.route} icon={item.icon}>
                {item.job}
              </SurfaceRoute>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
        <Kicker>Objects</Kicker>
        <div className="grid md:grid-cols-4 gap-3">
          <ObjectCard icon={<Scale className="h-5 w-5" />} label="Cases" color={C.accent}>
            Precedent, holding, court, jurisdiction, outcome, source, and verification.
          </ObjectCard>
          <ObjectCard icon={<Megaphone className="h-5 w-5" />} label="Campaigns" color={C.amber}>
            Coalition, demand, tactic, outcome, status, and campaign source.
          </ObjectCard>
          <ObjectCard icon={<BookOpenCheck className="h-5 w-5" />} label="Evidence" color={C.teal}>
            Australian youth-justice evidence with consent rules respected.
          </ObjectCard>
          <ObjectCard icon={<Layers3 className="h-5 w-5" />} label="Issues" color={C.green}>
            The weave screen: law, movement, people, and playbook around one question.
          </ObjectCard>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
        <Kicker>Admin and trust</Kicker>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: C.surface }}>
          {adminSurfaces.map((item, index) => (
            <div
              key={item.route}
              className="grid md:grid-cols-[240px_1fr] gap-2 px-4 md:px-5 py-4"
              style={{ borderTop: index === 0 ? 'none' : `1px solid ${C.border}` }}
            >
              <div>
                <div className="font-semibold" style={{ color: C.ink }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{item.route}</div>
              </div>
              <p className="text-[14px] leading-6" style={{ color: C.body }}>
                {item.job}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-10 md:pb-14">
        <Kicker>How people use it</Kicker>
        <div className="grid md:grid-cols-2 gap-3">
          {journeys.map((journey) => (
            <div key={journey.actor} className="rounded-lg border p-5" style={{ borderColor: C.border, background: C.surface }}>
              <div className="font-semibold mb-1">{journey.actor}</div>
              <p className="text-[14px] leading-6 mb-3" style={{ color: C.body }}>
                {journey.query}
              </p>
              <div className="rounded-md px-3 py-2 text-xs" style={{ background: '#f4f4f5', color: C.muted, fontFamily: MONO }}>
                {journey.path}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-10">
          <div>
            <Kicker>Demo path</Kicker>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-5">
              Show the Matrix by moving from question to action.
            </h2>
            <ol className="space-y-3">
              {[
                'Open the hub and name the two surfaces.',
                'Open Ask and ask about offshore detention and third-country transfer.',
                'Open Issues and choose the same strategic question.',
                'Show the Law column, then the Movement column.',
                'Open a case profile and point to the authoritative source and verified badge.',
                'Open a campaign profile and point to tactics and coalition.',
                'Return to Explore and search non-refoulement high seas.',
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-[14px] leading-6" style={{ color: C.body }}>
                  <span className="shrink-0" style={{ fontFamily: MONO, color: C.accent }}>{String(index + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-lg border p-5" style={{ borderColor: C.border, background: C.surface }}>
            <div className="flex items-center gap-2 mb-3" style={{ color: C.green }}>
              <ShieldCheck className="h-5 w-5" />
              <h3 className="font-semibold" style={{ color: C.ink }}>
                The rule underneath
              </h3>
            </div>
            <p className="text-[14px] leading-6 mb-4" style={{ color: C.body }}>
              The Matrix can help users find strategy, precedent, campaigns, and public evidence. It should not
              present itself as legal advice.
            </p>
            <Link href="/justice-matrix/contribute" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: C.accent }}>
              Contribute a source <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold"
      style={{ background: C.gold, color: C.dark }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md px-3 py-3" style={{ background: 'rgba(255,255,255,0.10)' }}>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
      <div className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: '#d9cbe3' }}>
        {label}
      </div>
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="uppercase mb-2.5" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: C.muted }}>
      {children}
    </div>
  );
}

function SurfaceRoute({
  href,
  label,
  route,
  icon,
  children,
}: {
  href: string;
  label: string;
  route: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="group rounded-lg border p-4 transition-colors hover:border-zinc-300" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: C.accent }}>
        {icon}
        <div className="font-semibold" style={{ color: C.ink }}>{label}</div>
      </div>
      <div className="mb-3" style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{route}</div>
      <p className="text-[14px] leading-6" style={{ color: C.body }}>{children}</p>
    </Link>
  );
}

function ObjectCard({
  icon,
  label,
  color,
  children,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex items-center gap-2 mb-3" style={{ color }}>
        {icon}
        <h3 className="font-semibold" style={{ color: C.ink }}>{label}</h3>
      </div>
      <p className="text-[14px] leading-6" style={{ color: C.body }}>{children}</p>
    </div>
  );
}

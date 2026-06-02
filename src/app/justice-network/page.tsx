import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  FileText,
  Globe2,
  HeartHandshake,
  Network,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { JusticePathwaysSection } from '@/components/justice-network/JusticePathwaysSection';
import { YouthRemandVerticalCard } from '@/components/justice-network/YouthRemandVerticalCard';
import { getYouthRemandNetworkData } from '@/lib/justice-network/youth-remand';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Justice Network · JusticeHub',
  description:
    'JusticeHub verticals connect art, evidence, law, campaigns, alternatives, funding, and consented stories into issue-specific action pathways.',
};

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#f5f0e8',
  ink: '#0a0a0a',
  body: '#4c463f',
  muted: '#756d63',
  red: '#dc2626',
  green: '#285d45',
  teal: '#1f6f78',
  cream: '#fbfaf7',
  border: '#ded8cf',
};

const layers = [
  {
    label: 'Art opens the door',
    icon: <HeartHandshake className="h-5 w-5" />,
    href: '/contained',
    body: 'Contained gives people a visceral entry point into youth detention and the alternative future communities are already building.',
  },
  {
    label: 'Search shows the field',
    icon: <Search className="h-5 w-5" />,
    href: '/exhibition',
    body: 'Search services, organisations, civic findings, grants, foundations, and local support pathways after someone has been moved to act.',
  },
  {
    label: 'Matrix links strategy',
    icon: <Scale className="h-5 w-5" />,
    href: '/justice-matrix',
    body: 'Cases, campaigns, issues, evidence, and legal review turn scattered advocacy memory into something reusable.',
  },
  {
    label: 'Network makes a brief',
    icon: <FileText className="h-5 w-5" />,
    href: '/justice-network/youth-remand',
    body: 'Each vertical becomes a partner-ready scenario with a search, map, issue playbook, story boundary, and exportable next step.',
  },
  {
    label: 'Country reports widen the lens',
    icon: <Globe2 className="h-5 w-5" />,
    href: '/justice-network/countries',
    body: 'Africa and Europe route countries become honest scoping reports, model comparisons, and consent-safe learning paths.',
  },
];

const nextVerticals = [
  'Raise the Age',
  'Watch houses',
  'Detention conditions',
  'Justice reinvestment',
  'Refugee detention',
  'Community alternatives',
];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' }}>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 uppercase" style={{ color: '#d8d0c7', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em' }}>
        {label}
      </div>
    </div>
  );
}

function HeroLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-bold"
      style={{ background: primary ? C.red : 'rgba(255,255,255,0.10)', color: '#ffffff', border: primary ? 'none' : '1px solid rgba(255,255,255,0.18)' }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default async function JusticeNetworkPage() {
  const payload = await getYouthRemandNetworkData('children on remand');

  return (
    <div className="min-h-screen" style={{ background: C.page, color: C.ink }}>
      <Navigation />
      <main className="pt-32">
        <section className="relative overflow-hidden border-b border-black/10 bg-[#0a0a0a] text-white">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 uppercase text-red-300" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em' }}>
                <Network className="h-4 w-4" />
                Justice Network
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
                Issue verticals that turn feeling into evidence and evidence into action.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">
                JusticeHub has many data surfaces. Justice Network gives them a public campaign shape: choose an
                issue, see the human story, search the system, understand the law, find the alternatives, follow the
                money, and send a useful brief.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <HeroLink href="/justice-network/youth-remand" primary>Open Youth Remand</HeroLink>
                <HeroLink href="/contained">Start with Contained</HeroLink>
                <HeroLink href="/exhibition">Search the field</HeroLink>
                <HeroLink href="/justice-network/countries">Country reports</HeroLink>
              </div>
            </div>
            <aside className="grid grid-cols-2 gap-3">
              <Metric label="mixed records" value={payload.totals.records.toLocaleString()} />
              <Metric label="open records" value={payload.totals.openRecords.toLocaleString()} />
              <Metric label="countries" value={payload.readiness.length.toLocaleString()} />
              <Metric label="vertical" value="01" />
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-10 md:px-12">
          <YouthRemandVerticalCard />
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-12 md:px-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {layers.map((layer) => (
              <Link
                key={layer.label}
                href={layer.href}
                className="rounded-xl border bg-white p-5 transition-colors hover:border-black/30"
                style={{ borderColor: C.border }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md text-white" style={{ background: C.ink }}>
                  {layer.icon}
                </div>
                <h2 className="mb-2 text-lg font-bold">{layer.label}</h2>
                <p className="text-sm leading-6" style={{ color: C.body }}>{layer.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y px-6 py-12 md:px-12" style={{ borderColor: C.border, background: C.cream }}>
          <div className="mx-auto max-w-6xl">
            <JusticePathwaysSection variant="full" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16 md:px-12">
          <div className="grid gap-6 rounded-xl border bg-white p-5 md:p-6 lg:grid-cols-[1fr_360px]" style={{ borderColor: C.border }}>
            <div>
              <div className="mb-2 uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em' }}>
                What this becomes
              </div>
              <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                A repeatable public method for JusticeHub.
              </h2>
              <p className="text-sm leading-6" style={{ color: C.body }}>
                Youth Remand is the first vertical because it aligns the Contained exhibition, Justice Matrix, ALMA,
                funding intelligence, organisations, world-tour learning, and consented stories. The next verticals
                can reuse the same pattern without rebuilding the whole site.
              </p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: C.border, background: C.cream }}>
              <div className="mb-3 flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" style={{ color: C.green }} />
                Boundary
              </div>
              <p className="text-sm leading-6" style={{ color: C.body }}>
                The public layer stays open. Raw story material, private notes, and sensitive partner work stay in
                Empathy Ledger or gated workspaces until consent and review are clear.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {nextVerticals.map((item) => (
              <span key={item} className="rounded-full border bg-white px-3 py-1.5 text-xs font-bold" style={{ borderColor: C.border, color: C.muted }}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-[#0a0a0a] px-6 py-14 text-white md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
              <div>
                <div className="mb-3 uppercase text-red-300" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em' }}>
                  Promotion line
                </div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  Contained opens the heart. JusticeHub opens the evidence. Justice Network opens the path to action.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <HeroLink href="/contained" primary>Experience Contained</HeroLink>
                <HeroLink href="/justice-network/youth-remand">Send the brief</HeroLink>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

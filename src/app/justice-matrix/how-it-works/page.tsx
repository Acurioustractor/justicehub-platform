import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  CircleHelp,
  Database,
  FileCheck2,
  Globe2,
  Layers3,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MatrixFlowNav } from '../_components/MatrixFlowNav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'How It Works · Justice Matrix',
  description:
    'How the Justice Matrix works, what each surface is for, how trust and verification operate, and frequently asked questions.',
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

const steps = [
  {
    label: 'Sources',
    icon: <Database className="h-5 w-5" />,
    body: 'Court databases, legal databases, NGO pages, advocacy sources, and partner submissions are registered as Matrix sources.',
  },
  {
    label: 'Discovery',
    icon: <Search className="h-5 w-5" />,
    body: 'Scheduled scanners and deterministic adapters turn source material into candidate records without publishing them straight to the public site.',
  },
  {
    label: 'Review',
    icon: <FileCheck2 className="h-5 w-5" />,
    body: 'Editors triage discoveries. Legal review confirms facts from the source of record before a case earns a verified trust signal.',
  },
  {
    label: 'Profiles',
    icon: <Scale className="h-5 w-5" />,
    body: 'Approved records become case, campaign, or evidence profiles with source links, metadata, categories, and related material.',
  },
  {
    label: 'Strategy',
    icon: <Layers3 className="h-5 w-5" />,
    body: 'Issue profiles and Ask the Matrix connect records into strategic questions, playbooks, and cited research packets.',
  },
];

const routeMap = [
  {
    route: '/justice-matrix',
    label: 'Hub',
    body: 'Start here when you need orientation, counts, search, and curated entry points.',
  },
  {
    route: '/justice-matrix/ask',
    label: 'Ask',
    body: 'Use plain language. The system retrieves Matrix records first, then returns cited material.',
  },
  {
    route: '/justice-matrix/explore',
    label: 'Explore',
    body: 'Use search and filters when you know a term, jurisdiction, issue, case, or campaign.',
  },
  {
    route: '/justice-matrix/issues',
    label: 'Issues',
    body: 'Use strategic questions when you want law, movement, people, and playbook in one place.',
  },
  {
    route: '/justice-matrix/cases/[id]',
    label: 'Cases',
    body: 'Use profiles to inspect citation, court, issue, holding, source, and verification state.',
  },
  {
    route: '/justice-matrix/campaigns/[id]',
    label: 'Campaigns',
    body: 'Use profiles to understand coalition, ask, tactics, status, and related legal work.',
  },
];

const trustRules = [
  {
    label: 'Source linked',
    body: 'A useful record should point back to a stable source, judgment, campaign page, report, or public evidence item.',
  },
  {
    label: 'Machine extracted is not confirmed',
    body: 'Scanned records can enter the corpus as machine-extracted material. They remain lower-trust until a person checks them.',
  },
  {
    label: 'Verified means human checked',
    body: 'A verified case has had its facts checked against the public source through the legal review workflow.',
  },
  {
    label: 'Consent controls evidence',
    body: 'Community Controlled evidence can appear as title and provenance only. Restricted material is not exposed as open findings.',
  },
];

const faqs = [
  {
    q: 'Is the Justice Matrix legal advice?',
    a: 'No. It is a research and strategy tool. It helps users find cases, campaigns, evidence, source links, and playbooks. A lawyer or qualified adviser still needs to read the original source and apply the law to a real matter.',
  },
  {
    q: 'What problem does it solve?',
    a: 'Strategic litigation and advocacy memory is scattered across courts, NGOs, campaign pages, reports, and institutional knowledge. The Matrix brings those records together so people can see what has been argued, what moved, and who else is working on the issue.',
  },
  {
    q: 'What is a surface?',
    a: 'A surface is a lens over the same engine. Refugee & Asylum focuses on global protection litigation and advocacy. Youth Justice focuses on Australian evidence, cases, campaigns, and reform strategy.',
  },
  {
    q: 'What is the difference between Ask, Explore, and Issues?',
    a: 'Ask is for plain-language questions. Explore is for search and filtering. Issues are curated strategy pages built around recurring questions such as third-country transfer, non-refoulement, or raising the age.',
  },
  {
    q: 'How does Ask the Matrix work?',
    a: 'Ask sends the question to Matrix retrieval first. It searches cases, campaigns, and evidence, returns cited records, and only synthesizes from those records when a synthesis provider is configured. If retrieval is weak, the answer should say what is missing.',
  },
  {
    q: 'What does verified mean?',
    a: 'Verified means a human reviewer checked the case against its source of record in the admin legal review flow. It is a trust signal for the record, not a claim that the case is good law in every context.',
  },
  {
    q: 'Why do some records look thinner than others?',
    a: 'Freshly ingested records may start with citation, source, jurisdiction, and keywords. Deeper fields such as strategic issue, key holding, outcome, and playbook analysis are enriched over time.',
  },
  {
    q: 'Can users add material?',
    a: 'Yes. The contribute flow accepts cases, campaigns, sources, pleadings, corrections, and other relevant material. Submitted material should include a stable link and a short explanation of why it matters.',
  },
  {
    q: 'Why is the People column still uneven?',
    a: 'Youth justice has consent-aware Australian evidence and lived-experience infrastructure. Refugee lived-experience sources still need a partner and consent model before that column should be treated as complete.',
  },
  {
    q: 'What happens when the Matrix is wrong or incomplete?',
    a: 'The correction path is contribution and review. A user should submit the missing source or correction, then an editor can triage it through the admin workflow.',
  },
  {
    q: 'Can this export briefs or reports?',
    a: 'Not yet as a polished product. The next strong artifact is a State-of-Protection brief with coverage, precedent movement, campaign activity, gaps, and exportable sources.',
  },
];

export default function JusticeMatrixHowItWorksPage() {
  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: C.border, background: 'linear-gradient(135deg, #1c1420 0%, #2f1d38 45%, #123f45 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
          <Link
            href="/justice-matrix"
            className="mb-5 inline-block uppercase"
            style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em' }}
          >
            Justice Matrix
          </Link>
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2" style={{ color: C.gold }}>
                <CircleHelp className="h-5 w-5" />
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em' }}>
                  How it works
                </span>
              </div>
              <h1 className="mb-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                How the Matrix turns scattered records into strategy.
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
                The Matrix is a clearing house with a trust workflow: source scanning, human review, public profiles,
                issue playbooks, and cited question-answering.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <HeroLink href="/justice-matrix/ask">Ask the Matrix</HeroLink>
                <HeroLink href="/justice-matrix/issues">Browse Issues</HeroLink>
              </div>
            </div>
            <div
              className="rounded-lg border p-4 text-sm leading-6"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#e8ddec' }}
            >
              <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="h-4 w-4" />
                The simple rule
              </div>
              <p>
                The Matrix can help a person find the record and understand the pattern. It should not replace source
                reading, legal judgment, or community consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="how" />

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <Kicker>Operating model</Kicker>
        <div className="mb-5 grid gap-5 lg:grid-cols-[360px_1fr] lg:gap-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Five steps, one trust loop.</h2>
          <p className="text-[15px] leading-7" style={{ color: C.body }}>
            The product does not treat scraped material as truth. The scanner finds candidates, editors decide what
            belongs, legal review confirms key facts, and public users see the trust state attached to the record.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.label} className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md" style={{ background: `${C.accent}14`, color: C.accent }}>
                  {step.icon}
                </span>
                <span style={{ color: C.muted, fontFamily: MONO, fontSize: 11 }}>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mb-2 font-semibold">{step.label}</h3>
              <p className="text-[13px] leading-6" style={{ color: C.body }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 md:px-8 md:pb-14">
        <Kicker>Surfaces</Kicker>
        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard
            icon={<Globe2 className="h-5 w-5" />}
            color={C.accent}
            label="Refugee & Asylum"
            href="/justice-matrix/explore?surface=refugee"
          >
            Global protection litigation and advocacy: third-country transfer, offshore detention, non-refoulement,
            asylum access, transit bans, and immigration detention oversight.
          </SurfaceCard>
          <SurfaceCard
            icon={<Users className="h-5 w-5" />}
            color={C.teal}
            label="Youth Justice"
            href="/justice-matrix/explore?surface=youth"
          >
            Australian reform strategy: raising the age, detention inquiries, justice reinvestment, community-led
            alternatives, evidence, and accountability recommendations.
          </SurfaceCard>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 md:px-8 md:pb-14">
        <Kicker>Which screen to use</Kicker>
        <div className="rounded-lg border" style={{ background: C.surface, borderColor: C.border }}>
          {routeMap.map((item, index) => (
            <div
              key={item.route}
              className="grid gap-2 px-4 py-4 md:grid-cols-[220px_1fr_120px] md:px-5"
              style={{ borderTop: index === 0 ? 'none' : `1px solid ${C.border}` }}
            >
              <div>
                <div className="font-semibold">{item.label}</div>
                <div style={{ color: C.muted, fontFamily: MONO, fontSize: 11 }}>{item.route}</div>
              </div>
              <p className="text-[14px] leading-6" style={{ color: C.body }}>
                {item.body}
              </p>
              <Link href={item.route.replace('/[id]', '')} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: C.accent }}>
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10 md:px-8 md:pb-14">
        <Kicker>Trust model</Kicker>
        <div className="grid gap-3 md:grid-cols-4">
          {trustRules.map((rule) => (
            <div key={rule.label} className="rounded-lg border p-5" style={{ background: C.surface, borderColor: C.border }}>
              <div className="mb-3 flex items-center gap-2" style={{ color: C.green }}>
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-semibold" style={{ color: C.ink }}>
                  {rule.label}
                </h3>
              </div>
              <p className="text-[14px] leading-6" style={{ color: C.body }}>
                {rule.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="scroll-mt-6 mx-auto max-w-6xl px-5 pb-16 md:px-8 md:pb-24">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-10">
          <div>
            <Kicker>FAQ</Kicker>
            <h2 className="mb-3 text-2xl font-semibold tracking-tight md:text-3xl">Frequently asked questions.</h2>
            <p className="text-[14px] leading-6" style={{ color: C.body }}>
              These are the questions a partner, funder, lawyer, advocate, or new team member will ask before they
              trust the tool.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
                  <span>{faq.q}</span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" style={{ color: C.accent }} />
                </summary>
                <p className="mt-3 text-[14px] leading-6" style={{ color: C.body }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold" style={{ background: C.gold, color: C.dark }}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em' }}>
      {children}
    </div>
  );
}

function SurfaceCard({
  icon,
  color,
  label,
  href,
  children,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="group rounded-lg border p-5 transition-colors hover:border-zinc-300" style={{ background: C.surface, borderColor: C.border }}>
      <div className="mb-3 flex items-center gap-2" style={{ color }}>
        {icon}
        <h3 className="text-lg font-semibold" style={{ color: C.ink }}>
          {label}
        </h3>
      </div>
      <p className="mb-4 text-[14px] leading-6" style={{ color: C.body }}>
        {children}
      </p>
      <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline" style={{ color }}>
        Open surface <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

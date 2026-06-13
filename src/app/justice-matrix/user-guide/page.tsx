import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BookOpenCheck,
  CircleHelp,
  FileText,
  FilePlus2,
  LifeBuoy,
  Link as LinkIcon,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MatrixFlowNav } from '../_components/MatrixFlowNav';

export const metadata: Metadata = {
  title: 'Sendable User Guide - Justice Matrix',
  description:
    'A short user guide for sending the Justice Matrix to partners, lawyers, advocates, funders, and support people.',
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
  gold: '#d3b583',
  dark: '#1c1420',
};

const sendLinks = [
  {
    label: 'Start here',
    href: '/justice-matrix',
    body: 'Use this when someone needs the big picture and the main entry points.',
  },
  {
    label: 'Sendable user guide',
    href: '/justice-matrix/user-guide',
    body: 'Use this when you are introducing the Matrix to someone new.',
  },
  {
    label: 'UN / OHCHR review pack',
    href: '/justice-matrix/un',
    body: 'Use this for George, NJP, OHCHR, or anyone reviewing the background paper and source matrices.',
  },
  {
    label: 'Ask a plain question',
    href: '/justice-matrix/ask',
    body: 'Use this when someone has a question and needs cited records, not a raw database.',
  },
  {
    label: 'Search the Matrix',
    href: '/justice-matrix/explore',
    body: 'Use this for lawyers, researchers, and advocates who want to search and filter directly.',
  },
  {
    label: 'Youth remand walkthrough',
    href: '/justice-network/youth-remand',
    body: 'Use this when the question is about children, remand, custody, detention, or alternatives.',
  },
  {
    label: 'Contribute or correct',
    href: '/justice-matrix/contribute',
    body: 'Use this for missing cases, campaign updates, source links, corrections, or notes that need curator review.',
  },
];

const audiences = [
  {
    title: 'Lawyers and clinics',
    icon: <ShieldCheck className="h-5 w-5" />,
    body: 'Find precedent, compare jurisdictions, check sources, and decide what needs human legal review.',
  },
  {
    title: 'Advocates and campaigners',
    icon: <Users className="h-5 w-5" />,
    body: 'See the movement layer beside the law: campaigns, tactics, coalitions, issues, and public asks.',
  },
  {
    title: 'NJP / OHCHR reviewers',
    icon: <FileText className="h-5 w-5" />,
    body: 'Open the review pack, read the status brief, inspect the source matrices, and see the live route.',
  },
  {
    title: 'Funders and policy people',
    icon: <BookOpenCheck className="h-5 w-5" />,
    body: 'Start with issues and guided routes before reading records. Look for gaps, coverage, and next build priorities.',
  },
  {
    title: 'Community and support workers',
    icon: <LifeBuoy className="h-5 w-5" />,
    body: 'Use the youth remand route for plain-language explanation, support pathways, and consent-aware evidence.',
  },
  {
    title: 'AI assistants and follow-up agents',
    icon: <MessageCircle className="h-5 w-5" />,
    body: 'Send the right link, explain the boundary, and move the person to Ask, Explore, or Youth Remand based on their need.',
  },
];

const walkthrough = [
  {
    step: '01',
    title: 'Send one link, not ten.',
    body: 'If the person is new, send /justice-matrix/user-guide. If they are reviewing the UN work, send /justice-matrix/un.',
    href: '/justice-matrix/user-guide',
  },
  {
    step: '02',
    title: 'Start from their question.',
    body: 'Use Ask the Matrix for plain-language questions. It retrieves cited Matrix records and keeps the research boundary clear.',
    href: '/justice-matrix/ask',
  },
  {
    step: '03',
    title: 'Search when they know terms.',
    body: 'Use Explore for case names, issues, jurisdictions, campaigns, evidence, categories, or semantic search by meaning.',
    href: '/justice-matrix/explore',
  },
  {
    step: '04',
    title: 'Use the recovery buttons.',
    body: 'If Explore has no direct matches, use Try semantic search, Ask this question, Open Youth Remand guide, or Clear filters.',
    href: '/justice-matrix/explore?q=can+they+keep+a+boy+of+10+in+youth+detention',
  },
  {
    step: '05',
    title: 'Move to the right surface.',
    body: 'Refugee and asylum work goes through the Matrix and UN pack. Youth detention, remand, and alternatives go through Youth Remand.',
    href: '/justice-network/youth-remand',
  },
];

const supportMoves = [
  'Ask what they are trying to decide before sending a link.',
  'Tell them this is research support, not legal advice.',
  'If they type a full question and get no results, send them to Ask the Matrix.',
  'If the question mentions a child, detention, custody, watchhouses, remand, or age, send the Youth Remand guide too.',
  'If they find a missing case, campaign, source, or correction, send /justice-matrix/contribute.',
  'If they need partner help, ask what jurisdiction, issue, audience, and deadline they are working with.',
];

const emailTemplate = `Subject: Justice Matrix links and quick guide

Hi [name],

Here is the Justice Matrix user guide:
[paste /justice-matrix/user-guide link]

The shortest way to use it is:
1. Start with the user guide if you want orientation.
2. Use Ask the Matrix if you have a plain-language question.
3. Use Explore if you already know a case, campaign, issue, country, or keyword.
4. Use the UN / OHCHR pack if you are reviewing the NJP / OHCHR material.
5. Use the Youth Remand guide for questions about children in detention, remand, custody, watchhouses, or alternatives.
6. Use Contribute if you have a missing source, correction, or update that should go into review.

Important boundary: this is research support and a way to find cited records. It is not legal advice.

If you try a search and get no result, use the recovery buttons on the page: Try semantic search, Ask this question, Open Youth Remand guide, or Clear filters.

[sign-off]`;

export default function JusticeMatrixSendableUserGuidePage() {
  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section
        className="border-b"
        style={{
          borderColor: C.border,
          background: 'linear-gradient(135deg, #1c1420 0%, #2f1d38 50%, #123f45 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
          <Link
            href="/justice-matrix"
            className="mb-5 inline-flex items-center gap-2 uppercase"
            style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em' }}
          >
            <LinkIcon className="h-4 w-4" />
            Sendable guide
          </Link>
          <div className="grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                How to send and use the Justice Matrix.
              </h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
                A practical guide for introducing the Matrix to someone else: who it is for, which link to send,
                how to walk through it, and how to help when a user gets stuck.
              </p>
            </div>
            <div
              className="rounded-lg border p-4 text-sm leading-6"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#e8ddec' }}
            >
              <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                <CircleHelp className="h-4 w-4" />
                Best first link
              </div>
              <p>
                Send this guide when the person is new. Send the UN pack for review. Send Ask when the person has a
                question. Send Youth Remand when the question is about children in detention or alternatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="guide" />

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <SectionKicker>Links to send</SectionKicker>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sendLinks.map((item) => (
            <LinkCard key={item.href} href={item.href} title={item.label} body={item.body} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-8 md:pb-10">
        <SectionKicker>Target audience</SectionKicker>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {audiences.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title} body={item.body} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-8 md:pb-10">
        <SectionKicker>Ten-minute walkthrough</SectionKicker>
        <div className="rounded-lg border bg-white" style={{ borderColor: C.border }}>
          {walkthrough.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="grid gap-3 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-zinc-50 md:grid-cols-[72px_1fr_auto] md:items-center"
              style={{ borderColor: C.border }}
            >
              <span className="font-semibold" style={{ color: C.accent, fontFamily: MONO, fontSize: 12 }}>
                {item.step}
              </span>
              <span>
                <span className="block font-semibold" style={{ color: C.ink }}>
                  {item.title}
                </span>
                <span className="mt-1 block text-sm leading-6" style={{ color: C.body }}>
                  {item.body}
                </span>
              </span>
              <ArrowRight className="hidden h-4 w-4 md:block" style={{ color: C.accent }} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-8 md:px-8 md:pb-10 lg:grid-cols-[1fr_420px]">
        <div className="rounded-lg border bg-white p-5" style={{ borderColor: C.border }}>
          <SectionKicker>How to support someone</SectionKicker>
          <ul className="space-y-3 text-sm leading-6" style={{ color: C.body }}>
            {supportMoves.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: C.accent }}>
                  OK
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border p-5" style={{ background: '#f8f1e6', borderColor: '#e0cfaa' }}>
          <SectionKicker>What to say out loud</SectionKicker>
          <p className="text-sm leading-6" style={{ color: C.body }}>
            The Matrix helps you find records, issues, campaigns, and evidence. It can answer plain questions with
            citations, but it does not replace legal advice. If search does not work, that is not failure. Use the
            recovery path: semantic search, Ask, Youth Remand, or clear filters.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 md:px-8 md:pb-20">
        <SectionKicker>AI-sendable message</SectionKicker>
        <pre
          className="overflow-x-auto rounded-lg border bg-white p-5 text-sm leading-6"
          style={{ borderColor: C.border, color: C.body, fontFamily: MONO, whiteSpace: 'pre-wrap' }}
        >
          {emailTemplate}
        </pre>
      </section>
    </main>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 uppercase" style={{ color: C.muted, fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em' }}>
      {children}
    </p>
  );
}

function LinkCard({ href, title, body }: { href: string; title: string; body: string }) {
  const Icon = href === '/justice-matrix/contribute' ? FilePlus2 : LinkIcon;
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-white p-4 transition-colors hover:border-zinc-300"
      style={{ borderColor: C.border }}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: C.accent }}>
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="font-semibold" style={{ color: C.ink }}>
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6" style={{ color: C.body }}>
        {body}
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold group-hover:underline" style={{ color: C.accent }}>
        Open route <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: C.teal }}>
        {icon}
      </div>
      <h2 className="font-semibold" style={{ color: C.ink }}>
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6" style={{ color: C.body }}>
        {body}
      </p>
    </div>
  );
}

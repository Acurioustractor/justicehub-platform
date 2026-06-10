import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  FileText,
  Globe2,
  LockKeyhole,
  MapPinned,
  Megaphone,
  MessageCircle,
  Network,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MatrixFlowNav } from '@/app/justice-matrix/_components/MatrixFlowNav';
import { CopyShortLink } from '@/components/contained/CopyShortLink';
import { JusticePathwaysSection } from '@/components/justice-network/JusticePathwaysSection';
import { getYouthRemandNetworkData } from '@/lib/justice-network/youth-remand';
import YouthRemandSearch from './YouthRemandSearch';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Youth Remand · JusticeHub Network',
  description:
    'A public guide to youth remand: why children are held before sentence, what alternatives exist, and how evidence, campaigns, services, and stories connect.',
};

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fbfaf7',
  surface: '#ffffff',
  cream: '#f2eadf',
  border: '#ded8cf',
  ink: '#171717',
  body: '#48413a',
  muted: '#756d63',
  green: '#285d45',
  teal: '#1f6f78',
  rust: '#a8552c',
  purple: '#4a2560',
  gold: '#c69b52',
  dark: '#171217',
};

const surfaces = [
  {
    label: 'Search',
    icon: <Search className="h-4 w-4" />,
    body: 'Look across cases, campaigns, evidence, organisations, funding, stories, and countries from one place.',
  },
  {
    label: 'Map',
    icon: <MapPinned className="h-4 w-4" />,
    body: 'See where detention pressure, community alternatives, campaigns, and learning sites are located.',
  },
  {
    label: 'Issue',
    icon: <Scale className="h-4 w-4" />,
    body: 'Understand the problem, legal frame, community response, alternatives, and funding gap.',
  },
  {
    label: 'Partner',
    icon: <Users className="h-4 w-4" />,
    body: 'A pathway for legal, community, philanthropic, and policy partners to review and shape.',
  },
  {
    label: 'Brief',
    icon: <FileText className="h-4 w-4" />,
    body: 'A short, shareable summary for funders, legal partners, advocates, and collaborators.',
  },
];

const scenarioLayers = [
  {
    label: 'Law',
    icon: <Scale className="h-5 w-5" />,
    color: C.purple,
    body: 'Ask the same remand question country by country: bail law, child-rights duties, age of responsibility, detention thresholds, and public cases.',
  },
  {
    label: 'System',
    icon: <MapPinned className="h-5 w-5" />,
    color: C.teal,
    body: 'Map courts, watch houses, detention centres, program alternatives, service gaps, and the funding paths that shape what happens before sentence.',
  },
  {
    label: 'Movement',
    icon: <Megaphone className="h-5 w-5" />,
    color: C.rust,
    body: 'Connect local campaigns to the legal pattern so reforms are not isolated: Raise the Age, watch-house campaigns, closure campaigns, and reinvestment.',
  },
  {
    label: 'Human',
    icon: <MessageCircle className="h-5 w-5" />,
    color: C.green,
    body: 'Bring in young people, families, advocates, workers, and system leaders only through consent-approved Empathy Ledger story cards or private partner workspaces.',
  },
];

const unlocks = [
  {
    label: 'Strategic litigation support',
    body: 'Start from a legal question, then find cases, campaigns, public evidence, and jurisdiction context.',
    icon: <Scale className="h-5 w-5" />,
    color: C.purple,
  },
  {
    label: 'Complaint triage context',
    body: 'Connect public issues and pathways back to complaint, advocacy, and legal support processes.',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: C.teal,
  },
  {
    label: 'Community alternatives',
    body: 'Show what exists beyond detention, who runs it, where it sits, and what funding would help it scale.',
    icon: <Building2 className="h-5 w-5" />,
    color: C.green,
  },
  {
    label: 'Pacific scoping trip',
    body: 'Scope Papua New Guinea, the Pacific, or another partner-nominated place into a practical learning path with consent-safe notes, roles, and next steps.',
    icon: <Globe2 className="h-5 w-5" />,
    color: C.rust,
  },
];

const researchSignals = [
  {
    value: '80%',
    label: 'unsentenced on an average detention day',
  },
  {
    value: '97%',
    label: 'of unsentenced detention framed as remand',
  },
  {
    value: '23x',
    label: 'First Nations detention disparity flagged in the note',
  },
];

const campaignSpine = [
  {
    lane: 'Remand and bail pressure',
    color: C.rust,
    campaigns: [
      {
        name: 'Get Kids Out of Watch Houses',
        place: 'Queensland',
        period: '2019',
        focus: 'Directly connects remand, bail failure, and children held in police watch houses.',
      },
      {
        name: "Poccum's Law / Bail Saves Lives",
        place: 'Victoria',
        period: '2023 onward',
        focus: 'Frames bail reform and therapeutic bail support as life-saving infrastructure.',
      },
      {
        name: 'Jailing is Failing',
        place: 'National',
        period: '2020s',
        focus: 'Makes the prevention, diversion, bail support, and community-led alternatives case.',
      },
    ],
  },
  {
    lane: 'Detention conditions and closure',
    color: '#9f1239',
    campaigns: [
      {
        name: 'Close Don Dale / Close Don Dale Now',
        place: 'Northern Territory',
        period: '2016 onward',
        focus: 'Shows why facility conditions, force, lockdowns, and reform delay belong in the same search path.',
      },
      {
        name: 'Close Unit 18 / Banksia Hill',
        place: 'Western Australia',
        period: '2020s',
        focus: 'Connects youth prison cells, isolation, deaths in custody, and community-led alternatives.',
      },
      {
        name: 'Close Ashley Youth Detention Centre',
        place: 'Tasmania',
        period: '2021 onward',
        focus: 'Links closure advocacy with calls to release children on remand into supported alternatives.',
      },
    ],
  },
  {
    lane: 'Age, reinvestment, and First Nations leadership',
    color: C.green,
    campaigns: [
      {
        name: '#RaiseTheAge',
        place: 'National',
        period: 'formal coalition from 2020',
        focus: 'Turns age of criminal responsibility into a national legal, medical, and community campaign.',
      },
      {
        name: 'Change the Record',
        place: 'National',
        period: 'ongoing',
        focus: 'Holds the First Nations justice frame across bail, mandatory sentencing, deaths in custody, and reinvestment.',
      },
      {
        name: 'Just Reinvest NSW / Maranguka',
        place: 'NSW',
        period: '2010s onward',
        focus: 'Shows a concrete model for moving money from incarceration into place-based supports.',
      },
    ],
  },
];

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold"
      style={{ background: C.gold, color: C.dark }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)' }}>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em]" style={{ color: '#d9cbe3' }}>{label}</div>
      <p className="mt-2 text-xs leading-5" style={{ color: '#d9cbe3' }}>{note}</p>
    </div>
  );
}

function SurfaceCard({ label, icon, body }: { label: string; icon: ReactNode; body: string }) {
  return (
    <article className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md" style={{ background: C.cream, color: C.purple }}>
        {icon}
      </div>
      <h3 className="mb-2 font-semibold" style={{ color: C.ink }}>{label}</h3>
      <p className="text-sm leading-6" style={{ color: C.body }}>{body}</p>
    </article>
  );
}

export default async function YouthRemandNetworkPage() {
  const payload = await getYouthRemandNetworkData('children on remand');

  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #171217 0%, #2b2230 42%, #153f43 100%)' }}>
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              href="/justice-matrix"
              className="inline-flex items-center gap-2 uppercase"
              style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em' }}
            >
              <Network className="h-4 w-4" />
              JusticeHub Network
            </Link>
            <span className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(255,255,255,0.22)', color: '#d9cbe3' }}>
              Partners welcome
            </span>
            <span className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(255,255,255,0.22)', color: '#d9cbe3' }}>
              Research, not legal advice
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                Understand youth remand. Find what could change it.
              </h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 md:text-base" style={{ color: '#e6ddea' }}>
                This page brings together the law, campaigns, detention pressure points, community alternatives,
                funding context, approved story summaries, and international learning around one question: why are
                children held before sentence, and what would keep them safely supported instead?
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <HeroLink href="#search">Search the evidence</HeroLink>
                <HeroLink href="/justice-network">Justice Network</HeroLink>
                <HeroLink href="/contained">Contained</HeroLink>
                <HeroLink href="/adelaide">Adelaide path</HeroLink>
                <HeroLink href="/justice-matrix/map?surface=youth">Open the map</HeroLink>
                <HeroLink href="/justice-network/countries">Country reports</HeroLink>
                <HeroLink href="/justice-matrix/issues/raise-the-age">Issue playbook</HeroLink>
                <CopyShortLink label="Copy /remand" url="https://justicehub.com.au/remand" dark />
              </div>
            </div>

            <aside className="grid grid-cols-2 gap-3">
              <Stat label="Search records" value={payload.totals.records.toLocaleString()} note="Cases, campaigns, evidence, places, services, and organisations." />
              <Stat label="Open records" value={payload.totals.openRecords.toLocaleString()} note="Public information remains open wherever it can be shared safely." />
              <Stat label="Countries" value={payload.readiness.length.toLocaleString()} note="Australia plus early Africa and Europe comparison pages." />
              <Stat label="Consent cards" value={payload.totals.consentCards.toLocaleString()} note="Stories appear publicly only when consent allows it." />
            </aside>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="network" />

      <section className="border-b" style={{ borderColor: C.border, background: C.surface }}>
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 md:grid-cols-5 md:px-8">
          {surfaces.map((surface) => (
            <SurfaceCard key={surface.label} {...surface} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-10 md:px-8">
        <section id="scenario" className="rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
          <div className="mb-5 grid gap-4 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                Use in a meeting
              </p>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: C.ink }}>
                Ask the same human question in every place.
              </h2>
            </div>
            <p className="text-sm leading-6" style={{ color: C.body }}>
              Why are young people held on remand before sentence, what does that do to them, what alternatives exist,
              and what can Australia learn without pulling private stories into public view?
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {scenarioLayers.map((layer) => (
              <article key={layer.label} className="rounded-lg border p-4" style={{ borderColor: C.border, background: '#fffdf9' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: layer.color }}>
                  {layer.icon}
                </div>
                <h3 className="mb-2 font-semibold" style={{ color: C.ink }}>{layer.label}</h3>
                <p className="text-sm leading-6" style={{ color: C.body }}>{layer.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="issue" className="grid gap-4 lg:grid-cols-[1fr_370px]">
          <div className="rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
            <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
              The issue
            </p>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: C.ink }}>
              Children on remand show what happens when support arrives too late.
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold" style={{ color: C.purple }}>Legal frame</h3>
                <p className="text-sm leading-6" style={{ color: C.body }}>
                  Search bail, custody, detention, age of criminal responsibility, inquiries, child rights, and the
                  least restrictive alternative.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold" style={{ color: C.teal }}>Movement frame</h3>
                <p className="text-sm leading-6" style={{ color: C.body }}>
                  Connect court and inquiry findings to campaigns, advocacy coalitions, community alternatives, and
                  practical next actions.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold" style={{ color: C.green }}>Story frame</h3>
                <p className="text-sm leading-6" style={{ color: C.body }}>
                  Field notes and interviews stay private until consent is clear. Public cards show only approved
                  summaries, attribution, place, and source links.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold" style={{ color: C.rust }}>Funding frame</h3>
                <p className="text-sm leading-6" style={{ color: C.body }}>
                  Funding records help show what is resourced, what is missing, and where money could move from
                  detention responses to community capability.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border p-5" style={{ borderColor: C.border, background: C.cream }}>
            <div className="mb-3 flex items-center gap-2 font-semibold" style={{ color: C.ink }}>
              <LockKeyhole className="h-4 w-4" />
              What stays public and what stays private
            </div>
            <ul className="space-y-3 text-sm leading-6" style={{ color: C.body }}>
              <li>Public: search, map, issue pages, source links, and shareable briefs.</li>
              <li>Private: raw field notes, private media, partner workspaces, and sensitive story context.</li>
              <li>Consent-controlled: Empathy Ledger story and media packets that can be withdrawn or updated.</li>
            </ul>
          </aside>
        </section>

        <JusticePathwaysSection variant="full" />

        <section id="campaign-spine" className="rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
          <div className="grid gap-5 lg:grid-cols-[1fr_390px]">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: C.rust }}>
                  <Megaphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                    Australian campaign spine
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: C.ink }}>
                    This issue already has people fighting for change.
                  </h2>
                </div>
              </div>
              <p className="max-w-3xl text-sm leading-6" style={{ color: C.body }}>
                Youth remand connects to years of campaigning on bail, watch houses, detention conditions, raising the
                age, justice reinvestment, and First Nations-led reform. This page helps those threads sit together
                so a visitor can see both the harm and the work already underway.
              </p>
            </div>

            <aside className="rounded-lg border p-4" style={{ borderColor: C.border, background: C.cream }}>
              <p className="mb-3 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                Source-check signals
              </p>
              <div className="grid gap-2">
                {researchSignals.map((signal) => (
                  <div key={signal.value} className="rounded-md bg-white p-3">
                    <div className="text-2xl font-semibold" style={{ color: C.purple }}>{signal.value}</div>
                    <p className="text-xs leading-5" style={{ color: C.body }}>{signal.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5" style={{ color: C.muted }}>
                These figures are treated as research prompts until checked against public sources and legal or sector
                review.
              </p>
            </aside>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {campaignSpine.map((lane) => (
              <article key={lane.lane} className="rounded-lg border p-4" style={{ borderColor: C.border, background: '#fffdf9' }}>
                <h3 className="mb-3 font-semibold" style={{ color: lane.color }}>{lane.lane}</h3>
                <div className="space-y-3">
                  {lane.campaigns.map((campaign) => (
                    <div key={campaign.name} className="border-l-2 pl-3" style={{ borderColor: lane.color }}>
                      <div className="text-sm font-semibold" style={{ color: C.ink }}>{campaign.name}</div>
                      <div className="mt-1 text-xs font-medium" style={{ color: C.muted }}>
                        {campaign.place} · {campaign.period}
                      </div>
                      <p className="mt-1 text-xs leading-5" style={{ color: C.body }}>{campaign.focus}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <YouthRemandSearch initialPayload={payload} />

        <section id="partner" className="rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: C.border }}>
          <div className="mb-5 max-w-3xl">
            <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
              For legal and advocacy partners
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: C.ink }}>
              A way to connect legal work with the wider movement.
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: C.body }}>
              JusticeHub is not a replacement for lawyers, advocates, community workers, or lived experience leaders.
              It is a shared place to search and brief that can help people connect cases, campaigns, alternatives,
              funding context, and consent-safe stories.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {unlocks.map((item) => (
              <article key={item.label} className="rounded-lg border p-4" style={{ borderColor: C.border }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: item.color }}>
                  {item.icon}
                </div>
                <h3 className="mb-2 font-semibold" style={{ color: C.ink }}>{item.label}</h3>
                <p className="text-sm leading-6" style={{ color: C.body }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="brief" className="rounded-lg border p-5 md:p-6" style={{ borderColor: C.border, background: C.cream }}>
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                Shareable summary
              </p>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight" style={{ color: C.ink }}>
                The short version to send on.
              </h2>
              <p className="text-sm leading-6" style={{ color: C.body }}>
                JusticeHub helps people search justice knowledge in one place. Youth remand shows why that matters:
                the same young person can be affected by bail law, detention conditions, service gaps, family pressure,
                school exclusion, housing, funding decisions, and public campaigns. This page links those parts
                together while keeping private stories and sensitive material protected. It also gives George and
                Justice Network a concrete next step: choose the first jurisdiction, scope the right people to meet,
                and turn the visit into a small pilot plan.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
              <div className="mb-3 flex items-center gap-2 font-semibold" style={{ color: C.ink }}>
                <BookOpenCheck className="h-4 w-4" />
                Labels used on this page
              </div>
              <div className="flex flex-wrap gap-2">
                {['Human confirmed', 'AI extracted', 'Centroid location', 'Consent-approved story', 'Partner-gated', 'Research, not legal advice'].map((label) => (
                  <span key={label} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: C.cream, color: C.body }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

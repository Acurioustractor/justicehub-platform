import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  DoorOpen,
  ExternalLink,
  FileText,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  MapPinned,
  Network,
  Scale,
  School,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  communityMapServices,
  type CommunityMapCategory,
  type CommunityMapService,
} from '@/content/community-map-services';

type Variant = 'full' | 'home' | 'physical';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  ink: '#171717',
  body: '#514a42',
  muted: '#756d63',
  border: '#ded8cf',
  cream: '#fbfaf7',
  sand: '#f5f0e8',
  red: '#dc2626',
  green: '#285d45',
  teal: '#1f6f78',
  rust: '#a8552c',
  purple: '#4a2560',
};

const pathwaysIn = [
  {
    label: 'Visitor or guest',
    icon: DoorOpen,
    href: '/adelaide',
    action: 'Start here',
    body: 'For someone who just heard about CONTAINED or walked through it and needs a clear next page to send on.',
  },
  {
    label: 'Young person or family',
    icon: HandHeart,
    href: '/services',
    action: 'Find support',
    body: 'Start with practical help: legal support, housing, safety, mentoring, school, family, and local services.',
  },
  {
    label: 'Local organisation',
    icon: Building2,
    href: '/join',
    action: 'Add your work',
    body: 'Share a program, service, place, practice, referral pathway, or local need so people can find what helps.',
  },
  {
    label: 'Law or advocacy team',
    icon: Scale,
    href: '/justice-matrix',
    action: 'Find sources',
    body: 'Find cases, inquiries, campaigns, issue guides, and public evidence that can support a stronger argument.',
  },
  {
    label: 'Funder or policy lead',
    icon: BriefcaseBusiness,
    href: '/follow-the-money',
    action: 'Compare costs',
    body: 'Compare detention spending with local support, then look for the organisations and gaps that need backing.',
  },
];

const supportStack = [
  {
    label: 'First-contact triage',
    icon: ClipboardCheck,
    color: C.purple,
    body: 'A no-wrong-door intake that asks what the young person needs in the next 72 hours: safety, legal help, bail, housing, family, school, culture, health, or transport.',
  },
  {
    label: 'Bail and remand support',
    icon: Landmark,
    color: C.rust,
    body: 'Court support, bail address options, family liaison, reminders, transport, mentor check-ins, and practical plans that make release safer than custody.',
  },
  {
    label: 'Stable place to land',
    icon: Home,
    color: C.teal,
    body: 'Housing, respite, supported accommodation, family mediation, and safe local places so "no address" does not become a detention pathway.',
  },
  {
    label: 'Learning and work',
    icon: School,
    color: C.green,
    body: 'Flexible school, TAFE, training, paid work, social enterprise, and creative practice that give a young person a next week worth turning up for.',
  },
  {
    label: 'Healing and culture',
    icon: HeartPulse,
    color: '#9f1239',
    body: 'Elders, family, on-Country work, AOD support, mental health, peer leadership, and trauma-aware practice held by trusted local people.',
  },
  {
    label: 'Proof and resourcing',
    icon: ShieldCheck,
    color: C.ink,
    body: 'Plain evidence, costs, referral details, outcomes, funding needs, and source links so local work can be found and backed.',
  },
];

const exampleIds = [
  'backtrack-youth-works',
  'deadly-connections',
  'naa-justice-darwin',
  'wungening-aboriginal-corporation',
  'syc-hypa-housing',
  'mdas-youth-justice',
];

const localModels = exampleIds
  .map((id) => communityMapServices.find((service) => service.id === id))
  .filter((service): service is CommunityMapService => Boolean(service));

const serviceCategoryMap: Record<CommunityMapCategory, string> = {
  justice: 'legal',
  healing: 'health',
  skills: 'employment',
  housing: 'housing',
  mental_health: 'health',
  education: 'education',
  family: 'family',
  emergency: 'emergency',
};

function serviceFinderHref(model: CommunityMapService) {
  const params = new URLSearchParams({
    q: model.name,
    state: model.state,
    category: serviceCategoryMap[model.category],
  });

  return `/services?${params.toString()}`;
}

const physicalHubZones = [
  {
    label: 'Welcome desk',
    icon: Users,
    body: 'A calm front door that routes people to support, not a maze of forms.',
  },
  {
    label: 'Local alternatives bench',
    icon: MapPinned,
    body: 'Screens, maps, and cards showing local alternatives, referral paths, evidence, and gaps.',
  },
  {
    label: 'Law and advocacy table',
    icon: Scale,
    body: 'Cases, campaign memory, briefs, complaints, and source packs that help people act carefully.',
  },
  {
    label: 'Story consent studio',
    icon: FileText,
    body: 'Empathy Ledger capture, review, withdrawal, attribution, and cultural safety before anything public.',
  },
  {
    label: 'Funding room',
    icon: BriefcaseBusiness,
    body: 'A place to turn community work into clear asks, partner packs, and practical backing.',
  },
  {
    label: 'Practice lab',
    icon: Network,
    body: 'Practitioners, young people, families, and system people improving the model together.',
  },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '0.18em' }}>
      {children}
    </p>
  );
}

function PathwayCard({ item }: { item: (typeof pathwaysIn)[number] }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group rounded-lg border bg-white p-4 transition-colors hover:border-black/35"
      style={{ borderColor: C.border }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: C.ink }}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold" style={{ color: C.rust }}>{item.action}</span>
      </div>
      <h3 className="mb-2 font-bold" style={{ color: C.ink }}>{item.label}</h3>
      <p className="text-sm leading-6" style={{ color: C.body }}>{item.body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: C.muted }}>
        Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SupportCard({ item }: { item: (typeof supportStack)[number] }) {
  const Icon = item.icon;
  return (
    <article className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md text-white" style={{ background: item.color }}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 font-bold" style={{ color: C.ink }}>{item.label}</h3>
      <p className="text-sm leading-6" style={{ color: C.body }}>{item.body}</p>
    </article>
  );
}

function PhysicalHub() {
  return (
    <section className="rounded-xl bg-[#171717] p-5 text-white md:p-6">
      <div className="mb-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div>
          <Eyebrow>One roof</Eyebrow>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            The long-term goal is a real place where people can sit together and solve practical problems.
          </h2>
        </div>
        <p className="text-sm leading-6 text-white/68">
          A local JusticeHub should bring support navigation, alternatives, legal help, story consent, funders, and
          practice learning into one room, so families and workers are not left to navigate everything alone.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {physicalHubZones.map((zone) => {
          const Icon = zone.icon;
          return (
            <article key={zone.label} className="rounded-lg border border-white/14 bg-white/7 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#171717]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-white">{zone.label}</h3>
              <p className="text-sm leading-6 text-white/64">{zone.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function JusticePathwaysSection({
  variant = 'full',
  className = '',
}: {
  variant?: Variant;
  className?: string;
}) {
  const showPathways = variant !== 'physical' && variant !== 'home';
  const showLocalModels = variant !== 'home';

  return (
    <section className={className} style={{ color: C.ink }}>
      <div className="space-y-8">
        {showPathways && (
          <div>
            <div className="mb-6 grid gap-4 lg:grid-cols-[370px_1fr] lg:items-end">
              <div>
                <Eyebrow>Ways in</Eyebrow>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  Start with the question a visitor actually has.
                </h2>
              </div>
              <p className="text-sm leading-6" style={{ color: C.body }}>
                A young person, family member, advocate, funder, worker, or visitor will not all need the same thing.
                These paths keep the next step small, useful, and honest.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {pathwaysIn.map((item) => (
                <PathwayCard key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.6fr]">
          <div className="rounded-xl border p-5 md:p-6" style={{ borderColor: C.border, background: C.sand }}>
            <Eyebrow>Finding alternatives</Eyebrow>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              If detention is the wrong answer, what support can actually hold a young person?
            </h2>
            <p className="mt-4 text-sm leading-6" style={{ color: C.body }}>
              The Australian Living Map of Alternatives helps people look for local services, court support, housing,
              mentoring, school pathways, cultural support, and community-led programs that can change the path before custody.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/alma"
                className="inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-bold text-white"
                style={{ background: C.green }}
              >
                Search ALMA <Search className="h-4 w-4" />
              </Link>
              <Link
                href="/network/alma"
                className="inline-flex min-h-10 items-center gap-2 rounded-md border bg-white px-4 text-sm font-bold"
                style={{ borderColor: C.border, color: C.ink }}
              >
                See the network <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {supportStack.map((item) => (
              <SupportCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {showLocalModels && (
          <section>
            <div className="mb-5 grid gap-4 lg:grid-cols-[370px_1fr]">
              <div>
                <Eyebrow>Australian examples</Eyebrow>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  The alternative only matters if people can see what it looks like in real places.
                </h2>
              </div>
              <p className="text-sm leading-6" style={{ color: C.body }}>
                These examples point to the kind of local work that can keep young people connected to family, school,
                culture, housing, health, and trusted adults.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {localModels.map((model) => (
                <article key={model.id} className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: C.sand, color: C.body }}>
                      {model.state}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: C.muted }}>
                      {model.focusAreas.slice(0, 2).join(' / ')}
                    </span>
                  </div>
                  <Link
                    href={serviceFinderHref(model)}
                    className="group/title mb-2 inline-flex items-start gap-2 font-bold hover:underline"
                    style={{ color: C.ink }}
                  >
                    <span>{model.name}</span>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 transition-transform group-hover/title:translate-x-0.5" />
                  </Link>
                  <p className="text-sm leading-6" style={{ color: C.body }}>{model.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {model.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: C.border, color: C.muted }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={serviceFinderHref(model)}
                      className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-bold text-white"
                      style={{ background: C.ink }}
                    >
                      Open in service finder <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {model.website && (
                      <a
                        href={model.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border bg-white px-3 text-xs font-bold"
                        style={{ borderColor: C.border, color: C.ink }}
                      >
                        Official site <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <PhysicalHub />
      </div>
    </section>
  );
}

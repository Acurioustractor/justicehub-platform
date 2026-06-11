import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import { Navigation } from '@/components/ui/navigation';

type RouteStatus = 'Primary' | 'Conversion' | 'Support' | 'Review' | 'Legacy';

type ContainedRoute = {
  href: string;
  label: string;
  status: RouteStatus;
  audience: string;
  purpose: string;
  uxQuestion: string;
};

type RouteGroup = {
  title: string;
  description: string;
  routes: ContainedRoute[];
};

const statusClasses: Record<RouteStatus, string> = {
  Primary: 'border-black bg-black text-white',
  Conversion: 'border-red-600 bg-red-50 text-red-700',
  Support: 'border-blue-600 bg-blue-50 text-blue-700',
  Review: 'border-amber-600 bg-amber-50 text-amber-700',
  Legacy: 'border-gray-400 bg-gray-100 text-gray-600',
};

const routeGroups: RouteGroup[] = [
  {
    title: 'Core Story',
    description: 'The main public pages a first-time visitor should understand.',
    routes: [
      {
        href: '/contained',
        label: 'Campaign home',
        status: 'Primary',
        audience: 'Everyone',
        purpose: 'Main doorway into CONTAINED.',
        uxQuestion: 'Is this the clearest first page for all audiences, or does it need stronger routing by role?',
      },
      {
        href: '/contained/about',
        label: 'About',
        status: 'Primary',
        audience: 'Curious visitors, partners, media',
        purpose: 'Explains what CONTAINED is and where it comes from.',
        uxQuestion: 'Should this stay separate or become a section on the home page?',
      },
      {
        href: '/contained/how-it-works',
        label: 'How it works',
        status: 'Primary',
        audience: 'Hosts, funders, government, delivery partners',
        purpose: 'Explains the three-room model and experience mechanics.',
        uxQuestion: 'Does it answer practical questions before asking people to register or host?',
      },
      {
        href: '/contained/brief',
        label: 'Decision-maker brief',
        status: 'Primary',
        audience: 'Government, funders, executives',
        purpose: 'Sendable policy and funding case.',
        uxQuestion: 'Should this be the canonical route for people with limited time?',
      },
      {
        href: '/contained/showcase',
        label: 'Full showcase',
        status: 'Review',
        audience: 'Internal review, deep-dive visitors',
        purpose: 'Everything in one place.',
        uxQuestion: 'Is this useful publicly, or should it become the admin review surface?',
      },
    ],
  },
  {
    title: 'Tour And Places',
    description: 'Routes for stops, cities, and the national movement.',
    routes: [
      {
        href: '/contained/tour',
        label: 'Tour',
        status: 'Primary',
        audience: 'Hosts, backers, visitors',
        purpose: 'National tour route, stops, and host/back pathways.',
        uxQuestion: 'Should this become the main navigation target instead of the campaign home?',
      },
      {
        href: '/contained/tour/contained-adelaide-tandanya',
        label: 'Tour stop example',
        status: 'Primary',
        audience: 'People attending or backing a specific stop',
        purpose: 'Dynamic stop detail page.',
        uxQuestion: 'Do city pages belong here under tour, rather than as separate top-level Contained pages?',
      },
      {
        href: '/contained/adelaide',
        label: 'Adelaide',
        status: 'Review',
        audience: 'Adelaide attendees, conference delegates, local partners',
        purpose: 'Specific Adelaide campaign landing page.',
        uxQuestion: 'Should this redirect to a tour stop page after the activation window?',
      },
      {
        href: '/contained/canberra',
        label: 'Canberra',
        status: 'Review',
        audience: 'Federal decision-makers, media, hosts',
        purpose: 'Canberra-specific invitation page.',
        uxQuestion: 'Is this a route pattern we want for every city, or a one-off campaign page?',
      },
      {
        href: '/contained/tour/intelligence',
        label: 'Tour intelligence',
        status: 'Review',
        audience: 'Internal team, strategic partners',
        purpose: 'Demand and route intelligence map.',
        uxQuestion: 'Should this be public, passworded, or moved under admin?',
      },
      {
        href: '/contained/tour/social',
        label: 'Social kit',
        status: 'Support',
        audience: 'Supporters, partners, media',
        purpose: 'Share copy, images, and social posts.',
        uxQuestion: 'Should this sit under act/share rather than tour?',
      },
    ],
  },
  {
    title: 'Experience And Proof',
    description: 'Pages that help people feel, review, or share the experience.',
    routes: [
      {
        href: '/contained/experience',
        label: 'Virtual experience',
        status: 'Primary',
        audience: 'Remote visitors, post-event visitors, stakeholders',
        purpose: 'Online version of the walkthrough.',
        uxQuestion: 'Is this the best next step after the main page, or should it be gated after registration?',
      },
      {
        href: '/contained/experience/mockups',
        label: 'Experience mockups',
        status: 'Review',
        audience: 'Internal team, designers, funders',
        purpose: 'Visual build references and mockups.',
        uxQuestion: 'Should this be moved to admin or linked as a public design pack?',
      },
      {
        href: '/contained/stories',
        label: 'Stories',
        status: 'Primary',
        audience: 'Everyone',
        purpose: 'Human proof and lived-experience material.',
        uxQuestion: 'Should stories be a top-level navigation item in the Contained journey?',
      },
      {
        href: '/contained/community',
        label: 'Community proof',
        status: 'Review',
        audience: 'Community leaders, funders, partners',
        purpose: 'Community-led alternative proof page.',
        uxQuestion: 'Should this live inside stories, about, or a partner proof route?',
      },
      {
        href: '/contained/momentum',
        label: 'Momentum',
        status: 'Review',
        audience: 'Supporters, internal team',
        purpose: 'Campaign momentum page.',
        uxQuestion: 'Is this meaningfully different from act, nominations, and the campaign dashboard?',
      },
    ],
  },
  {
    title: 'Actions And Capture',
    description: 'Routes that ask people to do something.',
    routes: [
      {
        href: '/contained/act',
        label: 'Take action',
        status: 'Conversion',
        audience: 'Supporters, partners, funders, media',
        purpose: 'Share, nominate, back, connect.',
        uxQuestion: 'Should this be the single action hub for most public CTAs?',
      },
      {
        href: '/contained/register',
        label: 'Register',
        status: 'Conversion',
        audience: 'Event attendees and interested visitors',
        purpose: 'Register for a stop or walkthrough.',
        uxQuestion: 'Is the registration route clear enough without separate interest and join pages?',
      },
      {
        href: '/contained/enroll',
        label: 'Enroll with code',
        status: 'Conversion',
        audience: 'On-site visitors',
        purpose: 'Code-based device session and visitor flow.',
        uxQuestion: 'Should this be hidden from general navigation and only reached by QR/code?',
      },
      {
        href: '/contained/reaction',
        label: 'Reaction',
        status: 'Conversion',
        audience: 'Post-experience visitors',
        purpose: 'Capture what changed after the walkthrough.',
        uxQuestion: 'Is this the right first post-experience CTA, before stories or nominations?',
      },
      {
        href: '/contained/share',
        label: 'Share story',
        status: 'Conversion',
        audience: 'People ready to contribute a story',
        purpose: 'Collect story submissions.',
        uxQuestion: 'Should story sharing be folded into stories, reaction, or the virtual experience?',
      },
      {
        href: '/contained/nominations',
        label: 'Nominations wall',
        status: 'Support',
        audience: 'Supporters, community, campaign team',
        purpose: 'Public proof of nominated leaders.',
        uxQuestion: 'Should the wall be public proof or an admin moderation/review tool?',
      },
      {
        href: '/contained/what-now',
        label: 'What now',
        status: 'Conversion',
        audience: 'People who have just completed the experience',
        purpose: 'Post-experience next steps.',
        uxQuestion: 'Should this become the canonical aftercare route for QR follow-up?',
      },
    ],
  },
  {
    title: 'Partner And Funding',
    description: 'Routes for funding, hosting, joining, and deeper commercial pathways.',
    routes: [
      {
        href: '/contained/help',
        label: 'Help / support',
        status: 'Support',
        audience: 'Hosts, backers, partners',
        purpose: 'Support the tour or a stop.',
        uxQuestion: 'Does this overlap too much with act and invest?',
      },
      {
        href: '/contained/join',
        label: 'Join by role',
        status: 'Support',
        audience: 'Organisations, media, supporters, funders, lived-experience contributors',
        purpose: 'Role-based signup flow.',
        uxQuestion: 'Should this be the role router behind all CTAs?',
      },
      {
        href: '/contained/register-interest',
        label: 'Register interest',
        status: 'Review',
        audience: 'Early-interest contacts',
        purpose: 'Simple interest capture.',
        uxQuestion: 'Can this merge into register or join?',
      },
      {
        href: '/contained/invest',
        label: 'Invest',
        status: 'Support',
        audience: 'Funders, sponsors, strategic partners',
        purpose: 'Funding ladder and sponsorship case.',
        uxQuestion: 'Should this be public, or sent directly from funder conversations?',
      },
      {
        href: '/contained/invest/one-pager',
        label: 'Funder one-pager',
        status: 'Support',
        audience: 'Funders and sponsors',
        purpose: 'Compact funder page.',
        uxQuestion: 'Should this replace the longer invest page for outbound asks?',
      },
    ],
  },
  {
    title: 'Legacy Or Hidden',
    description: 'Routes that already redirect, gate, or need a deliberate decision.',
    routes: [
      {
        href: '/contained/launch',
        label: 'Launch alias',
        status: 'Legacy',
        audience: 'Old links',
        purpose: 'Redirects to /contained.',
        uxQuestion: 'Keep as alias only, or remove from any public mention?',
      },
      {
        href: '/contained/vip-dinner',
        label: 'VIP dinner alias',
        status: 'Legacy',
        audience: 'Old/private links',
        purpose: 'Redirects to /contained.',
        uxQuestion: 'Should this redirect somewhere more specific if reused?',
      },
      {
        href: '/contained/content',
        label: 'Gated content',
        status: 'Review',
        audience: 'Possibly admin or preview users',
        purpose: 'Redirects without access.',
        uxQuestion: 'Should public visitors ever land here?',
      },
    ],
  },
];

const adminRoutes: ContainedRoute[] = [
  {
    href: '/admin/contained/routes',
    label: 'Route review',
    status: 'Primary',
    audience: 'Admins',
    purpose: 'Walk every Contained route and make navigation decisions.',
    uxQuestion: 'Should this become the working page for deciding the final public route map?',
  },
  {
    href: '/admin/contained',
    label: 'Contained admin dashboard',
    status: 'Primary',
    audience: 'Admins',
    purpose: 'Campaign metrics and operational links.',
    uxQuestion: 'Should this become the admin home for all Contained operations?',
  },
  {
    href: '/admin/contained/campaign',
    label: 'Campaign centre',
    status: 'Primary',
    audience: 'Admins',
    purpose: 'Campaign command centre.',
    uxQuestion: 'Is this distinct enough from the main admin dashboard?',
  },
  {
    href: '/admin/contained/content',
    label: 'Content',
    status: 'Support',
    audience: 'Admins',
    purpose: 'Campaign content tools.',
    uxQuestion: 'Should this own public page copy and route decisions?',
  },
  {
    href: '/admin/contained/crm',
    label: 'CRM',
    status: 'Support',
    audience: 'Admins',
    purpose: 'Contained CRM records.',
    uxQuestion: 'Does this need to connect visibly to register, join, and act?',
  },
  {
    href: '/admin/contained/enrollment',
    label: 'Enrollment codes',
    status: 'Support',
    audience: 'Admins',
    purpose: 'Mint and manage on-site visitor codes.',
    uxQuestion: 'Is the on-site visitor journey clear from code to post-experience action?',
  },
  {
    href: '/admin/contained/locations',
    label: 'Locations',
    status: 'Support',
    audience: 'Admins',
    purpose: 'Tour and location management.',
    uxQuestion: 'Should this drive public tour stop pages directly?',
  },
  {
    href: '/admin/contained/stories',
    label: 'Story moderation',
    status: 'Support',
    audience: 'Admins',
    purpose: 'Review submitted stories.',
    uxQuestion: 'Is the moderation path obvious from public story submission?',
  },
  {
    href: '/admin/contained/templates',
    label: 'Social templates',
    status: 'Support',
    audience: 'Admins',
    purpose: 'Generate and review social assets.',
    uxQuestion: 'Should approved templates feed the public social kit?',
  },
];

const totals = routeGroups.reduce(
  (acc, group) => {
    group.routes.forEach((route) => {
      acc[route.status] += 1;
    });
    return acc;
  },
  { Primary: 0, Conversion: 0, Support: 0, Review: 0, Legacy: 0 } as Record<RouteStatus, number>,
);

function RouteCard({ route }: { route: ContainedRoute }) {
  return (
    <article className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-black">{route.label}</h3>
            <span className={`border px-2 py-0.5 text-[11px] font-black uppercase tracking-widest ${statusClasses[route.status]}`}>
              {route.status}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-gray-500">{route.href}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={route.href}
            target="_blank"
            className="border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
          >
            Open
          </Link>
          <Link
            href={route.href}
            className="border-2 border-gray-300 px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-700 transition-colors hover:border-black hover:text-black"
          >
            Same tab
          </Link>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <dt className="text-[11px] font-black uppercase tracking-widest text-gray-400">Audience</dt>
          <dd className="mt-1 text-sm text-gray-700">{route.audience}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-black uppercase tracking-widest text-gray-400">Purpose</dt>
          <dd className="mt-1 text-sm text-gray-700">{route.purpose}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-black uppercase tracking-widest text-gray-400">UX question</dt>
          <dd className="mt-1 text-sm text-gray-700">{route.uxQuestion}</dd>
        </div>
      </dl>
    </article>
  );
}

export default async function ContainedRoutesPage() {
  await requireAdmin('/admin/contained/routes');

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <main className="pt-8 pb-16">
        <div className="container-justice">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link href="/admin/contained" className="mb-2 inline-block text-sm text-gray-600 hover:text-black">
                Back to CONTAINED admin
              </Link>
              <h1 className="text-4xl font-black text-black md:text-5xl">CONTAINED route review</h1>
              <p className="mt-3 max-w-3xl text-lg text-gray-600">
                Walk every public and admin Contained page, then decide which routes should be primary, merged,
                hidden, redirected, or promoted in navigation.
              </p>
            </div>
            <Link
              href="/contained"
              target="_blank"
              className="inline-flex justify-center border-2 border-black bg-black px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
            >
              Start at public home
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {(Object.keys(totals) as RouteStatus[]).map((status) => (
              <div key={status} className="border-2 border-black bg-white p-4">
                <div className="text-3xl font-black text-black">{totals[status]}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-widest text-gray-500">{status}</div>
              </div>
            ))}
          </div>

          <section className="mb-10 border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black text-black">Suggested route shape</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-red-600">Public spine</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Home, Tour, Experience, Stories, Act, Register, Brief.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-600">Merge candidates</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Help, Join, Register Interest, Invest, Momentum, Community, Showcase.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Admin or private</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Mockups, Tour Intelligence, Gated Content, legacy aliases, operational dashboards.
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-10">
            {routeGroups.map((group) => (
              <section key={group.title}>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-black">{group.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{group.description}</p>
                </div>
                <div className="grid gap-5">
                  {group.routes.map((route) => (
                    <RouteCard key={route.href} route={route} />
                  ))}
                </div>
              </section>
            ))}

            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-black text-black">Admin Operations</h2>
                <p className="mt-1 text-sm text-gray-600">Admin-only routes that support the public journey.</p>
              </div>
              <div className="grid gap-5">
                {adminRoutes.map((route) => (
                  <RouteCard key={route.href} route={route} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

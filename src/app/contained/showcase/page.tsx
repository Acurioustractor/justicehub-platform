import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contained — Everything in one place | JusticeHub',
  description: 'Every surface, every stop, every pathway. The case, the build model, the nine stops, the data layer, the participation routes, the funding ask.',
  openGraph: {
    title: 'Contained — Everything in one place',
    description: 'Every surface, every stop, every pathway, in one curated showcase.',
    type: 'website',
    url: '/contained/showcase',
  },
};

interface Surface {
  href: string;
  title: string;
  body: string;
  external?: boolean;
}

const CASE_SURFACES: Surface[] = [
  {
    href: '/contained',
    title: 'The main page',
    body: 'The front door. Three rooms, the evidence, the nine stops, the tour map, the stat strip, the stories. Where most visitors land first.',
  },
  {
    href: '/contained/about',
    title: 'About Contained',
    body: 'The project narrative. Who built it (Ben Knight, Nic Marchesi). Why it exists. Where it sits inside JusticeHub, Empathy Ledger, the Australian Living Map of Alternatives, and Diagrama.',
  },
  {
    href: '/contained/how-it-works',
    title: 'How it works',
    body: 'The structural overview. Three rooms, three builders. Ten minutes per room. Nine audience pathways from family to magistrate. The build is the program. The expertise is the wage.',
  },
  {
    href: '/contained/experience',
    title: 'Virtual walk-through',
    body: 'A scroll-driven version of what happens inside. Room 1 cell, Room 2 Diagrama, Room 3 community. For people who cannot get to a stop, or want to know what they are walking into before they arrive.',
  },
];

const TOUR_SURFACES: Surface[] = [
  {
    href: '/contained/tour/intelligence',
    title: 'Tour intelligence',
    body: 'The civic intelligence dashboard. Nine stops on a CARTO dark-tile map. Click any stop for the right-rail panel: demand signals, key delivery orgs, political holders, philanthropic targets, source-of-truth tooltips on every stat.',
  },
  {
    href: '/contained/tour/contained-adelaide-tandanya',
    title: 'Per-stop pages (×9)',
    body: 'One page per city — Adelaide, Perth, Mparntwe, Brisbane, Northern Rivers, Sydney, Canberra, Melbourne, Hobart. Each includes state spending, detention facilities, basecamp orgs, civic intelligence, experience packages, and share-your-story.',
  },
  {
    href: '/contained/community',
    title: 'Community demand map',
    body: 'Passcode-gated map of who has asked for the container, where, and at what scale. Confirmed stops in green, demand signals in red. Bubble size scales with the number of people connected. Passcode: contained2026.',
  },
];

const PARTICIPATION_SURFACES: Surface[] = [
  {
    href: '/contained/enroll',
    title: 'Enrol with a code',
    body: 'Visitor entry point. CONT-XXXX codes per stop or master CONT-DEMO. Anonymous Supabase auth gives every visitor a session so they can submit reflections, recommend others, opt up to public storyteller.',
  },
  {
    href: '/contained/share',
    title: 'Share your story',
    body: 'Public submission form for anyone who has been through the system. Reviewed before publication. Per-stop and tour-wide.',
  },
  {
    href: '/contained/nominations',
    title: 'Nominations wall',
    body: 'Public list of decision-makers Australians want to walk through the container. Categories: Politicians, Justice Officials, Media, Business, Community.',
  },
  {
    href: '/contained/act',
    title: 'Take action',
    body: 'Email templates, social copy, MP contact scripts. The "I have walked through, what do I do now" page.',
  },
  {
    href: '/contained/what-now',
    title: 'What now?',
    body: 'After-experience next steps. Three doors out: contact your MP, share with your network, host the container.',
  },
];

const FUNDING_SURFACES: Surface[] = [
  {
    href: '/contained/help',
    title: 'Back a stop',
    body: 'The funding ask. $30K to rock up. $50K for a fully built stop. $500K for the twelve-month national arc. Who fund and why per tier.',
  },
  {
    href: '/contained/invest',
    title: 'Investment thesis',
    body: 'Long-form for foundations and major donors. The case for Contained as the demonstration layer alongside policy advocacy and community storytelling.',
  },
  {
    href: '/contained/invest/one-pager',
    title: 'One-pager',
    body: 'The single-page summary version of the investment thesis. Print or hand-deliver.',
  },
  {
    href: '/contained/brief',
    title: 'Campaign brief',
    body: 'The tactical brief for partners, hosts, and inside-the-room collaborators.',
  },
];

const DATA_SURFACES: Surface[] = [
  {
    href: '/intelligence',
    title: 'JusticeHub intelligence layer',
    body: 'The platform Contained sits on. 1,697 programs catalogued. 822 organisations indexed. 130 Indigenous-led. $14.1B youth-justice funding tracked. 7,022 civic intelligence chunks searchable.',
  },
  {
    href: '/intelligence/funding-map',
    title: 'LGA funding desert map',
    body: 'Local Government Areas where youth-justice funding does not reach. The geography of the access gap.',
  },
  {
    href: '/intelligence/interventions',
    title: 'Living Map of Alternatives',
    body: 'The full registry of community-led models indexed nationally. Searchable, filterable, queryable.',
  },
];

const ADMIN_SURFACES: Surface[] = [
  {
    href: '/admin/contained',
    title: 'Admin dashboard',
    body: 'Stats, recent nominations, story moderation, campaign tools. Admin-gated.',
  },
  {
    href: '/admin/contained/enrollment',
    title: 'Enrolment code admin',
    body: 'Mint, list, deactivate, reactivate codes. Per-stop, master, time-limited. Admin-gated.',
  },
];

export default function ContainedShowcasePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="h-16" />

      {/* Hero */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <Link href="/contained" className="text-xs uppercase tracking-[0.3em] text-[#DC2626] hover:text-white transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          ← Back to Contained
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          The full pack
        </p>
        <h1 className="mt-3 text-5xl md:text-7xl font-bold leading-[0.95] uppercase tracking-tight">
          Everything<br />in one place
        </h1>
        <p className="mt-8 text-lg md:text-xl max-w-3xl text-[#F5F0E8]/95 leading-relaxed">
          Every surface that holds part of the Contained story. The case, the build model, the nine stops, the data layer, the participation routes, the funding ask. One curated index so a funder, a host, a journalist, or a young person can land anywhere and find what they need next.
        </p>
      </section>

      <Divider />

      <Group
        kicker="01"
        title="Start here"
        intro="The case for Contained. What it is, why it exists, how it works. Land here first if you have never seen the container."
        surfaces={CASE_SURFACES}
      />

      <Divider />

      <Group
        kicker="02"
        title="The nine stops"
        intro="Twelve months. Nine cities. Adelaide opens at Tandanya in late June 2026. Hobart closes the loop in June 2027. The intelligence dashboard, the per-stop pages, and the community demand map sit here."
        surfaces={TOUR_SURFACES}
        bg
      />

      <Divider />

      <Group
        kicker="03"
        title="How to take part"
        intro="Different doors for different people. A code from a partner, a story to share, a nomination, a public action."
        surfaces={PARTICIPATION_SURFACES}
      />

      <Divider />

      <Group
        kicker="04"
        title="How to back it"
        intro="Funding routes for foundations, major donors, and consortium partners. Tier-by-tier, with the full thesis where it helps and a one-pager where it doesn&apos;t."
        surfaces={FUNDING_SURFACES}
        bg
      />

      <Divider />

      <Group
        kicker="05"
        title="The data Contained sits on"
        intro="JusticeHub is the platform. Contained is the carrying vehicle. The intelligence layer is what makes Contained citeable, indexable, and durable past the year of the tour."
        surfaces={DATA_SURFACES}
      />

      <Divider />

      <Group
        kicker="06"
        title="Admin tools"
        intro="Internal-facing. Mint codes, moderate stories, manage stops. Admin-gated."
        surfaces={ADMIN_SURFACES}
        bg
      />

      <Divider />

      {/* CTA strip */}
      <section className="px-6 lg:px-16 py-24 bg-[#DC2626]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/85 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            One door at a time
          </p>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8 text-white">
            Pick a starting point
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <CTACard
              href="/contained/how-it-works"
              title="Read the structure"
              body="Three rooms, three builders, ten minutes per room, nine audience pathways."
            />
            <CTACard
              href="/contained/tour/intelligence"
              title="Walk the tour map"
              body="Civic intelligence per stop. Demand signals. Key orgs. Political holders."
            />
            <CTACard
              href="/contained/help"
              title="Back a stop"
              body="$30K to rock up. $500K for the national year. The whole shape costed."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Divider() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-16">
      <div className="h-px bg-[#DC2626]/30" />
    </div>
  );
}

function Group({ kicker, title, intro, surfaces, bg }: { kicker: string; title: string; intro: string; surfaces: Surface[]; bg?: boolean }) {
  return (
    <section className={`px-6 lg:px-16 py-24 ${bg ? 'bg-gray-950' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-4 mb-3">
          <span className="text-xs uppercase tracking-[0.3em] text-[#DC2626] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {kicker}
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {title}
          </p>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
          {title}
        </h2>
        <p className="max-w-3xl text-[#F5F0E8]/95 leading-relaxed mb-12">
          {intro}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surfaces.map((s) => (
            <SurfaceCard key={s.href} surface={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SurfaceCard({ surface }: { surface: Surface }) {
  return (
    <Link
      href={surface.href}
      className="border border-white/10 bg-[#0A0A0A] p-6 flex flex-col hover:border-[#DC2626] transition-colors group"
      target={surface.external ? '_blank' : undefined}
      rel={surface.external ? 'noopener noreferrer' : undefined}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-bold uppercase tracking-tight text-[#F5F0E8] group-hover:text-[#DC2626] transition-colors">
          {surface.title}
        </h3>
        {surface.external ? (
          <ExternalLink className="w-4 h-4 text-[#F5F0E8]/85 group-hover:text-[#DC2626] flex-shrink-0 transition-colors" />
        ) : (
          <ArrowRight className="w-4 h-4 text-[#F5F0E8]/85 group-hover:text-[#DC2626] group-hover:translate-x-1 flex-shrink-0 transition-all" />
        )}
      </div>
      <p className="text-xs text-[#F5F0E8]/95 leading-relaxed mb-3 flex-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {surface.body}
      </p>
      <div className="text-[11px] text-[#F5F0E8]/85 uppercase tracking-[0.15em] pt-3 border-t border-white/5 group-hover:text-[#DC2626] transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {surface.href}
      </div>
    </Link>
  );
}

function CTACard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="bg-white text-[#DC2626] p-6 hover:bg-gray-100 transition-colors group block">
      <ArrowRight className="w-5 h-5 mb-3 group-hover:translate-x-1 transition-transform" />
      <h3 className="text-sm font-bold uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-xs text-[#0A0A0A]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{body}</p>
    </Link>
  );
}

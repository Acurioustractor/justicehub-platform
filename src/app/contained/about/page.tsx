import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Contained — A Curious Tractor | JusticeHub',
  description: 'A shipping container. Three rooms. Built as an art piece in Mount Druitt by Ben Knight and Nic Marchesi. Now it travels.',
  openGraph: {
    title: 'About Contained — A Curious Tractor',
    description: 'A shipping container. Three rooms. Built as an art piece in Mount Druitt. Now it travels.',
    type: 'website',
    url: '/contained/about',
  },
};

export default function ContainedAboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="h-16" />

      {/* Hero */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <Link href="/contained" className="text-xs uppercase tracking-[0.3em] text-[#DC2626] hover:text-white transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          ← Back to Contained
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          About
        </p>
        <h1 className="mt-3 text-5xl md:text-7xl font-bold leading-[0.95] uppercase tracking-tight">
          An art piece<br />that travels
        </h1>
        <p className="mt-8 text-lg md:text-xl max-w-3xl text-[#F5F0E8]/95 leading-relaxed">
          A shipping container. Three rooms. Thirty minutes. Built first in Mount Druitt by Ben Knight and Nic Marchesi as an art piece. Now it&apos;s a national tour, paid for by foundations, hosted by Aboriginal community-controlled organisations, and led through by the young people who built it.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/contained/how-it-works" className="bg-[#DC2626] text-white px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#b91c1c] transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            How it works <ArrowRight className="inline w-4 h-4 ml-1" />
          </Link>
          <Link href="/contained/tour/intelligence" className="border border-white/30 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            See the tour
          </Link>
        </div>
      </section>

      <Divider />

      {/* The case */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          The case
        </p>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8">
          $1.33M a year<br />per child detained
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-[#F5F0E8]/95 leading-relaxed mb-4">
              Australia detains around 860 children on any given night. 65% are Aboriginal or Torres Strait Islander. They are 6% of the population.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed mb-4">
              Detention costs roughly $1.33 million per child per year, varying by state (ROGS 2024-25). 84% of children who go through detention return.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Community-led alternatives, where families and Elders carry decision-making, run for a fraction of the cost and produce diversion outcomes above 85% in the strongest cases. Oonchiumpa in Mparntwe runs at 95%.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat value="$1.33M" label="Per child / year" hue="#DC2626" />
            <Stat value="84%" label="Return to detention" hue="#DC2626" />
            <Stat value="65%" label="First Nations" hue="#F5F0E8" />
            <Stat value="95%" label="Oonchiumpa diversion" hue="#059669" />
          </div>
        </div>
      </section>

      <Divider />

      {/* The architects */}
      <section className="px-6 lg:px-16 py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            The architects
          </p>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8">
            A Curious Tractor
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-white/10 bg-[#0A0A0A] p-6">
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Ben Knight</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Co-founder
              </p>
              <p className="text-sm text-[#F5F0E8]/95 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Builds the data, story and place layers. Designed JusticeHub, Empathy Ledger, and the Australian Living Map of Alternatives. Spent 2024 inside Diagrama in Murcia and Madrid documenting the model the world is moving toward.
              </p>
            </div>
            <div className="border border-white/10 bg-[#0A0A0A] p-6">
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Nic Marchesi</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Co-founder
              </p>
              <p className="text-sm text-[#F5F0E8]/95 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Co-founder of Orange Sky. Builds operating systems for the work. Holds the relationships at Palm Island Community Company, BG Fit, MMEIC, and across the network of community organisations the tour is built with.
              </p>
            </div>
          </div>
          <p className="mt-8 text-sm text-[#F5F0E8]/85 italic max-w-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            A Curious Tractor is the working name for the studio Ben and Nic run together. It is small on purpose. The work moves at the speed of community, not the speed of institution.
          </p>
        </div>
      </section>

      <Divider />

      {/* The premise */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          The premise
        </p>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8">
          The container is the publishing layer
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              The container is not a museum and it is not a press release. It is a third place where the conversation about youth justice can happen with everyone in the same room — a 14-year-old from Mparntwe, a magistrate from Adelaide, a Member of Parliament, a foundation officer, a journalist, a parent.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Every walk-through is led by a young person who has been through the system. They are paid for it. The expertise is the wage.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Every stop builds a Room 3 with a local Aboriginal community-controlled organisation. The room shows their model. The room stays in the year-end exhibition. The room becomes part of the public record.
            </p>
            <Link href="/contained/how-it-works" className="inline-flex items-center gap-2 mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#DC2626] hover:text-white transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Read the full structure <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="border border-white/10 bg-gray-950 p-6 space-y-4">
            <Row n="01" hue="#DC2626" title="The cell" body="Built by young people + local youth support org." />
            <Row n="02" hue="#f59e0b" title="What works" body="In partnership with Diagrama Foundation, Spain." />
            <Row n="03" hue="#059669" title="What's already running" body="Built by a local Aboriginal community-controlled org or frontline org." />
          </div>
        </div>
      </section>

      <Divider />

      {/* Where it sits */}
      <section className="px-6 lg:px-16 py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Where it sits
          </p>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8">
            One piece of a longer arc
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Pillar
              title="JusticeHub"
              body="The data and publishing platform. Holds the Australian Living Map of Alternatives — 1,697 programs catalogued, 822 organisations indexed, 7,022 civic intelligence chunks searchable."
            />
            <Pillar
              title="Empathy Ledger"
              body="The consent and storytelling layer. Per-storyteller, withdrawable, OCAP-aligned. Every reflection journal from the container lives here on the storyteller's terms."
            />
            <Pillar
              title="Diagrama Foundation"
              body="Spain's therapeutic-centre model. 13.6% recidivism, &euro;5.64 social return per &euro;1 invested. Room 2 is built in partnership."
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* The vision */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          The vision
        </p>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8">
          Nine cities. Twelve months. $500K.
        </h2>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              The tour opens at Tandanya in Adelaide alongside the Reintegration Puzzle Conference in late June 2026. It closes in Hobart in June 2027 with DarkLab and the Prevention Not Detention coalition.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Adelaide. Perth + surrounds. Mparntwe + Tennant Creek. Brisbane. Northern Rivers. Sydney. Canberra. Melbourne. Hobart. One container. One travelling team of young facilitators. Nine partner organisations on the ground.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Each stop costs $30K-$50K. The tour-wide backbone (travelling team, editorial, coordination, the year-end bound book) is $120K. Whole twelve-month national arc: $500K.
            </p>
          </div>
          <div className="border border-[#DC2626]/40 bg-[#DC2626]/5 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Lever
            </div>
            <p className="text-base text-[#F5F0E8] italic leading-relaxed mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              &ldquo;If we spent $1.33M a year on keeping a kid connected to family, culture, and community instead of locking them in a cell, we would already have the answer.&rdquo;
            </p>
            <Link href="/contained/help" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#DC2626] hover:text-white transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Back the tour <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Divider />

      {/* Get involved */}
      <section className="px-6 lg:px-16 py-24 bg-[#DC2626]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/85 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Get involved
          </p>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8 text-white">
            Pick a door
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <CTACard
              href="/contained/enroll"
              title="Enrol with a code"
              body="You have a CONT-XXXX code from the container, a partner, or a host org."
            />
            <CTACard
              href="/contained/help"
              title="Back a stop"
              body="$30K to rock up. $50K for a fully built stop. $500K for the national arc."
            />
            <CTACard
              href="/contained/tour/intelligence"
              title="See the data"
              body="9 stops. 822 orgs. 130 Indigenous-led. 7,022 civic chunks."
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

function Stat({ value, label, hue }: { value: string; label: string; hue: string }) {
  return (
    <div className="border border-white/10 bg-gray-950 p-4">
      <div className="text-3xl font-bold" style={{ color: hue, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
      <div className="text-[11px] text-[#F5F0E8]/85 uppercase tracking-[0.15em] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
    </div>
  );
}

function Row({ n, hue, title, body }: { n: string; hue: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <span className="text-2xl font-bold flex-shrink-0" style={{ color: hue }}>{n}</span>
      <div>
        <div className="text-base font-bold uppercase tracking-tight">{title}</div>
        <div className="text-xs text-[#F5F0E8]/85 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{body}</div>
      </div>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-[#DC2626] pl-4">
      <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-[#F5F0E8]/95 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{body}</p>
    </div>
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

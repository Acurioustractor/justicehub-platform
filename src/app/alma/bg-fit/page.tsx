import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { getDetentionCosts } from '@/lib/detention-costs';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BG Fit — Boxing, Discipline, and Diversion on Kalkadoon Country | JusticeHub',
  description:
    'In Mount Isa, a proud Pita Pita Wayaka man built a boxing gym that diverts 85% of young people from the justice system. 400+ young people engaged annually. The CAMPFIRE framework.',
  openGraph: {
    title: 'BG Fit — Boxing, Discipline, and Diversion on Kalkadoon Country',
    description: 'In Mount Isa, Brodie Germaine built a boxing gym that changes lives. 85% diversion success. 400+ young people annually.',
    type: 'article',
  },
};

function PullQuote({ children, attribution }: { children: React.ReactNode; attribution?: string }) {
  return (
    <blockquote className="my-12 pl-6 border-l-4 border-[#DC2626]">
      <p className="text-xl md:text-2xl italic text-[#0A0A0A]/80 leading-relaxed">
        {children}
      </p>
      {attribution && (
        <cite
          className="block mt-3 text-sm not-italic text-[#0A0A0A]/50"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {attribution}
        </cite>
      )}
    </blockquote>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border-2 border-[#0A0A0A] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <p
        className="text-3xl font-bold"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-xs text-[#0A0A0A]/50 mt-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl md:text-3xl font-bold tracking-tight mb-6 mt-16"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {children}
    </h2>
  );
}

export default async function BGFitPage() {
  const costsData = await getDetentionCosts();

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 sm:px-12">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
            >
              <ArrowLeft className="w-3 h-3" /> Stories
            </Link>
            <p
              className="text-sm uppercase tracking-[0.3em] text-white/50 mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Kalkadoon Country / Mount Isa, QLD
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              BG Fit
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl">
              A boxing gym in a mining town that diverts young people from the
              justice system. Built from nothing by a man who knows what it
              means to show up.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/40 mt-8">
              <MapPin className="w-4 h-4" />
              <span>Mount Isa, QLD</span>
              <span className="mx-2">|</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                CAMPFIRE framework &middot; Basecamp partner
              </span>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-b border-[#0A0A0A]/10">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value="85%" label="Diversion success" />
              <StatCard value="400+" label="Young people annually" />
              <StatCard value="CAMPFIRE" label="Framework" />
              <StatCard value={fmt(312000)} label="Tracked funding" />
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-6 sm:px-12 py-12">

          <p className="text-lg leading-relaxed mb-6">
            Australia spends{' '}
            <strong>{fmt(costsData.national.annualCost)}</strong> per year to
            lock up one young person. In Queensland, it&apos;s{' '}
            <strong>{fmt(costsData.byState?.QLD?.annualCost || costsData.national.annualCost)}</strong>.
            Reoffending rates sit above 70%. Indigenous young people are
            massively over-represented.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            In Mount Isa &mdash; remote northwest Queensland, a mining town
            with one of the highest rates of youth justice contact in the
            state &mdash; a boxing gym is proving there&apos;s another way.
          </p>

          {/* Who They Are */}
          <SectionHeading>Who He Is</SectionHeading>

          <p className="leading-relaxed mb-6">
            <strong>Brodie Germaine</strong> is a proud Pita Pita Wayaka man.
            He built BG Fit in Mount Isa because he saw what was happening to
            young people in his community and decided to do something about
            it. Not a government program. Not a funded initiative with a
            steering committee. A gym. A place to show up.
          </p>
          <p className="leading-relaxed mb-6">
            Mount Isa sits on Kalkadoon Country &mdash; a remote mining town
            of around 18,000 people, 900 kilometres west of Townsville. The
            Indigenous population is significant. Youth boredom, family
            stress, and limited services create a pipeline straight into the
            justice system. Brodie saw kids heading that way and put his body
            in front of it.
          </p>

          <PullQuote attribution="The BG Fit approach">
            &ldquo;Fitness builds mental resilience. Show up consistently,
            and everything else starts to change.&rdquo;
          </PullQuote>

          <p className="leading-relaxed mb-6">
            Boxing isn&apos;t just exercise. It&apos;s discipline. Respect.
            Structure. Identity. When a young person walks into BG Fit,
            they&apos;re not entering a &ldquo;program&rdquo; &mdash;
            they&apos;re entering a space where someone expects them to show
            up, work hard, and become something. That consistency &mdash;
            that expectation &mdash; is the intervention.
          </p>

          {/* What They Do */}
          <SectionHeading>The CAMPFIRE Framework</SectionHeading>

          <p className="leading-relaxed mb-6">
            BG Fit operates through the CAMPFIRE framework &mdash; Culture,
            Ancestral Wisdom, Mentoring, Personal Growth, Fitness, Identity,
            Resilience, Empowerment. Every letter is a pillar. Every session
            in the gym touches multiple pillars at once.
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'BAIL Program (Be An Indigenous Leader)',
                desc: 'Boxing, gym training, and mentoring to redirect young people away from the justice system. BAIL isn\u2019t bail conditions \u2014 it\u2019s a reframe. Be An Indigenous Leader. The name itself is the intervention: redefining what the word means for young people who\u2019ve only heard it in court.',
              },
              {
                title: 'Fitness & Mental Resilience',
                desc: 'Physical training as a pathway to mental health and confidence. The gym is the classroom. Showing up, pushing through, learning to take a hit and keep going \u2014 these are life skills wrapped in boxing gloves. Young people build physical strength and discover they have mental strength too.',
              },
              {
                title: 'Cultural Mentoring',
                desc: 'Connecting young people to culture, identity, and role models. Brodie doesn\u2019t separate fitness from culture. Being strong in body means being strong in identity. Knowing who you are, where you come from, and what your people stand for \u2014 that\u2019s the foundation everything else is built on.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-[#0A0A0A]/10 rounded-lg p-5"
              >
                <h4
                  className="font-bold text-sm mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {item.title}
                </h4>
                <p className="text-sm text-[#0A0A0A]/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Results */}
          <SectionHeading>What the Results Look Like</SectionHeading>

          <p className="leading-relaxed mb-6">
            <strong>85% diversion success rate.</strong> Young people who come
            through BG Fit&apos;s programs don&apos;t end up in the system.
            That&apos;s not a pilot result from a controlled trial &mdash;
            that&apos;s what happens when someone builds real relationships
            in a real community over real time.
          </p>
          <p className="leading-relaxed mb-6">
            <strong>400+ young people engaged annually.</strong> In a town of
            18,000, that&apos;s not a program &mdash; that&apos;s a
            community institution. BG Fit has become the place young people
            go. Not because they&apos;re referred. Because word gets around:
            Brodie shows up. The gym is open. Someone gives a damn.
          </p>

          {/* Why It Works */}
          <SectionHeading>Why It Works</SectionHeading>

          <div className="space-y-5 mb-8">
            {[
              {
                title: 'Physical discipline as structure',
                body: 'Boxing demands consistency, respect, and self-control. Young people who\u2019ve never had structure find it in the rhythm of training. Show up. Work. Repeat.',
              },
              {
                title: 'A man who looks like them',
                body: 'Brodie is a proud Indigenous man who built something from nothing. Young people see themselves in him. Representation isn\u2019t a policy \u2014 it\u2019s a person standing in front of you proving what\u2019s possible.',
              },
              {
                title: 'Identity over intervention',
                body: 'The CAMPFIRE framework puts culture and identity at the centre. Young people who know who they are make different choices. Boxing is the hook. Identity is the anchor.',
              },
              {
                title: 'Consistency is the intervention',
                body: 'The gym is open. Brodie is there. That reliability \u2014 in a life where almost nothing is reliable \u2014 is what changes trajectories. Not a 12-week program. A place that\u2019s always there.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-1 bg-[#059669] rounded-full shrink-0 mt-1" />
                <div>
                  <h4
                    className="font-bold text-sm mb-1"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {item.title}
                  </h4>
                  <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cost Comparison */}
          <SectionHeading>The Numbers</SectionHeading>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#0A0A0A] text-white p-6 rounded-lg">
              <p
                className="text-xs uppercase tracking-wider text-white/40 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Detention (QLD)
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {fmt(costsData.byState?.QLD?.annualCost || costsData.national.annualCost)}
              </p>
              <p className="text-sm text-white/50 mt-1">per young person per year</p>
              <p className="text-xs text-white/30 mt-3">
                {fmt(costsData.byState?.QLD?.dailyCost || costsData.national.dailyCost)}/day
                &middot; 70%+ reoffending
              </p>
            </div>
            <div className="bg-[#059669] text-white p-6 rounded-lg">
              <p
                className="text-xs uppercase tracking-wider text-white/60 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                BG Fit
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                A boxing gym
              </p>
              <p className="text-sm text-white/70 mt-1">{fmt(312000)} tracked funding</p>
              <p className="text-xs text-white/50 mt-3">
                85% diversion &middot; 400+ young people
              </p>
            </div>
          </div>

          <p className="leading-relaxed mb-6">
            Millions for a detention bed that produces 70%+ reoffending. Or a
            boxing gym that produces 85% diversion. The maths isn&apos;t
            complicated. The question is why governments keep choosing the
            first option.
          </p>

          {/* What Comes Next */}
          <SectionHeading>What Comes Next</SectionHeading>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'CAMPFIRE Expansion',
                desc: 'Taking the framework to other remote communities across Queensland and beyond. The model is transferable \u2014 physical discipline, cultural identity, consistent mentoring \u2014 it works wherever someone is willing to show up.',
              },
              {
                title: 'ALMA Network QLD Basecamp',
                desc: 'Mount Isa as the inland Queensland anchor for the ALMA Network. BG Fit is already a basecamp partner \u2014 the next step is connecting it to the broader network of community-led alternatives across the country.',
              },
              {
                title: 'CONTAINED Tour',
                desc: 'BG Fit is part of THE CONTAINED story \u2014 real programs, real people, real communities doing what the system won\u2019t. Mount Isa is on the map.',
              },
              {
                title: 'Gym Expansion & Staffing',
                desc: 'Seeking philanthropic partners to expand the gym, hire more mentors, and reach more young people. The model works. It just needs fuel.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-[#0A0A0A]/10 rounded-lg p-5"
              >
                <h4
                  className="font-bold text-sm mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {item.title}
                </h4>
                <p className="text-sm text-[#0A0A0A]/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Closing */}
          <div className="border-t-2 border-[#0A0A0A]/10 pt-10 mt-16">
            <p className="text-lg leading-relaxed mb-6">
              In a town where the options for young people are limited and the
              justice system is always waiting, Brodie Germaine built a third
              option. A gym. A framework. A place where showing up matters.
            </p>

            <PullQuote>
              The alternative to detention doesn&apos;t always look like a
              program with a logic model and a steering committee. Sometimes
              it looks like a boxing gym in Mount Isa, run by a man who
              refuses to let his community&apos;s kids fall through the
              cracks.
            </PullQuote>
          </div>

          {/* Consent note */}
          <div className="mt-12 pt-6 border-t border-[#0A0A0A]/10">
            <p
              className="text-xs text-[#0A0A0A]/40 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Program data sourced from ALMA Network records and BG Fit
              reporting. Detention cost data sourced from the Productivity
              Commission Report on Government Services (ROGS), Table 17A.20.
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white font-semibold rounded-lg hover:bg-[#0A0A0A]/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-3 h-3" /> More Stories
            </Link>
            <Link
              href="/contained"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg hover:bg-[#0A0A0A] hover:text-white transition-colors text-sm"
            >
              Experience CONTAINED
            </Link>
            <Link
              href="/basecamps"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg hover:bg-[#0A0A0A] hover:text-white transition-colors text-sm"
            >
              ALMA Basecamps
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

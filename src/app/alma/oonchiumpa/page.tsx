import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react';
import { Metadata } from 'next';
import { getDetentionCosts } from '@/lib/detention-costs';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Oonchiumpa — What Youth Justice Looks Like When Community Leads | JusticeHub',
  description:
    'In Alice Springs, an Aboriginal community-controlled organisation is proving that the alternative to detention already exists. 95% diversion. 72% school re-engagement. 97.6% cheaper.',
  openGraph: {
    title: 'Oonchiumpa — What Youth Justice Looks Like When Community Leads',
    description: 'In Alice Springs, an Aboriginal community-controlled organisation is proving that the alternative to detention already exists.',
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

export default async function OonchiumpaPage() {
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
              Mparntwe / Alice Springs
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Oonchiumpa
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl">
              What youth justice looks like when community leads. An Aboriginal
              community-controlled organisation proving the alternative already
              exists.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/40 mt-8">
              <MapPin className="w-4 h-4" />
              <span>Central Australia, NT</span>
              <span className="mx-2">|</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                7 language groups &middot; 32+ partner organisations
              </span>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-b border-[#0A0A0A]/10">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value="95%" label="Diversion success" />
              <StatCard value="72%" label="School re-engagement" />
              <StatCard value="97.6%" label="Cheaper than detention" />
              <StatCard value="32+" label="Partner organisations" />
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-6 sm:px-12 py-12">

          <p className="text-lg leading-relaxed mb-6">
            Australia spends{' '}
            <strong>{fmt(costsData.national.annualCost)}</strong> per year to
            detain one young person. In the Northern Territory, it&apos;s{' '}
            <strong>{fmt(costsData.byState?.NT?.annualCost || costsData.national.annualCost)}</strong>.
            The reoffending rate sits above 80%. Indigenous young people make up
            over 60% of those detained.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            In Alice Springs, a small organisation is showing what happens when
            the community closest to these young people leads the response.
          </p>

          {/* Who They Are */}
          <SectionHeading>Who They Are</SectionHeading>

          <p className="leading-relaxed mb-6">
            Oonchiumpa is a 100% Aboriginal community-controlled organisation
            working across Central Australia. Founded by{' '}
            <strong>Kristy Bloomfield</strong> &mdash; a Central Arrernte,
            Eastern Arrernte and Alyawarra woman, Traditional Owner of Mparntwe
            &mdash; and <strong>Tanya Turner</strong> &mdash; an Eastern
            Arrernte woman who graduated from UWA law school, worked as an
            Associate at the Supreme Court of Victoria, and came home to bring
            legal expertise alongside community wisdom.
          </p>
          <p className="leading-relaxed mb-6">
            They built Oonchiumpa because they saw what everyone saw &mdash;
            young Aboriginal people filling the justice system &mdash; and
            decided to do something different. Not another program designed by
            outsiders with good intentions. Leadership rooted in cultural
            authority, family connection, and the understanding that these are
            their kids, their Country, their responsibility.
          </p>

          <PullQuote attribution="Kristy Bloomfield, Co-Founder & Director">
            &ldquo;These aren&apos;t &apos;bad kids&apos;, they&apos;re
            children without basics many Australians take for granted. The
            system responds with detention that costs millions and changes
            nothing. We respond with cultural connection, practical support,
            and the authority that comes from being their Elders, their
            Traditional Owners, their family.&rdquo;
          </PullQuote>

          <p className="leading-relaxed mb-6">
            The cultural backbone runs deep. <strong>Aunty Bev and Uncle
            Terry</strong> serve as cultural advisors &mdash; custodians of
            Alice Springs&apos; history. <strong>Max Bloomfield</strong>, a
            Traditional Owner of Atnarpa (Loves Creek Station), connects the
            work to Country east of Alice Springs. His father Henry grew up at
            Atnarpa, and the family has maintained that connection through
            generations of cultural practice and ceremony.
          </p>

          {/* What They Do */}
          <SectionHeading>What They Do</SectionHeading>

          <p className="leading-relaxed mb-6">
            Oonchiumpa runs four interconnected programs, each grounded in
            relationship and cultural authority:
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'Youth Mentorship & Cultural Healing',
                desc: 'Aboriginal youth workers and cultural mentors walking alongside young people for years, not weeks. Case planning, care team meetings, and consistent presence \u2014 rides to school, cinema trips, showing up when no one else does.',
              },
              {
                title: 'True Justice: Deep Listening on Country',
                desc: 'A partnership with Professor Helen Milroy and the Australian National University. Training the next generation of lawyers, magistrates, and law makers in restorative justice approaches grounded in First Nations knowledge.',
              },
              {
                title: 'Atnarpa Homestead On-Country Experiences',
                desc: 'Cultural camps on Max Bloomfield\u2019s family country in the MacDonnell Ranges, east of Alice Springs. Reconnecting young people to land, language, and identity through on-country experiences with Elders and Traditional Owners.',
              },
              {
                title: 'Cultural Brokerage & Service Navigation',
                desc: 'Connecting young people across 7 language groups within a 150km radius of Alice Springs with the 32+ partner organisations that can help. Not replacing services \u2014 navigating a system that young people and families find impossible alone.',
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
            When NT Police ran <strong>Operation Luna</strong> &mdash; a
            targeted list of 21 high-risk young people in Alice Springs &mdash;
            Oonchiumpa worked with them. By December, only one remained on that
            list.
          </p>
          <p className="leading-relaxed mb-6">
            Across their programs: <strong>95% diversion success</strong>.{' '}
            <strong>72% of disengaged youth</strong> have returned to education.
            The entire operation runs at <strong>97.6% less cost</strong> than
            putting one child in detention.
          </p>
          <p className="leading-relaxed mb-6">
            But the numbers only tell part of it. The model is built on
            something the system doesn&apos;t measure: trust earned over years.
          </p>

          {/* Xavier */}
          <SectionHeading>
            &ldquo;He Trusts Us. We Earned That Trust.&rdquo;
          </SectionHeading>

          <p className="leading-relaxed mb-6">
            <strong>Fred Campbell</strong> is a youth case worker at Oonchiumpa.
            He married into the Bloomfield family. He guides younger employees,
            does case planning, runs care team meetings.
          </p>
          <p className="leading-relaxed mb-6">
            Fred told us about a young man named Xavier &mdash; one of
            Oonchiumpa&apos;s first clients, 3-4 years ago. Xavier has a
            disability. Other service providers didn&apos;t share that
            information. When the relationship got hard, those services
            &ldquo;distanced&rdquo; from him.
          </p>
          <p className="leading-relaxed mb-6">
            Oonchiumpa didn&apos;t.
          </p>

          <PullQuote attribution="Fred Campbell, Youth Case Worker">
            &ldquo;He trusts us. We earned that trust.&rdquo;
          </PullQuote>

          <p className="leading-relaxed mb-6">
            Xavier was released from detention at the start of the year. He
            hasn&apos;t been back in trouble. When he got the chance to build a{' '}
            <a
              href="https://www.goodsoncountry.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#DC2626] font-semibold hover:underline"
            >
              Stretch Bed
            </a>{' '}
            &mdash; a bed made from recycled plastic designed for remote
            communities &mdash; Xavier led the work. Despite reports about his
            &ldquo;ability to understand,&rdquo; he knew exactly what he was
            doing.
          </p>

          <PullQuote attribution="Fred Campbell, on Xavier">
            &ldquo;He just was so proud showing them that he can build it.
            After that he felt so happy about himself&hellip; He&apos;s quite
            capable of building that on his own and sharing that onto other
            kids.&rdquo;
          </PullQuote>

          <p className="leading-relaxed mb-6">
            Fred sees immediate community use for the beds: ceremony business,
            bush trips, sleeping off the ground (snakes, scabies from dogs on
            mattresses), preventing rheumatic heart disease. Families move away
            from a place after a death (sorry business) &mdash; portable beds
            are perfect for this cultural practice.
          </p>
          <p className="leading-relaxed mb-6">
            Xavier&apos;s transformation didn&apos;t come from a structured
            intervention. It came from being trusted with real work. That&apos;s
            Oonchiumpa&apos;s model in one story.
          </p>

          {/* Young People */}
          <SectionHeading>What Young People Actually Say</SectionHeading>

          <p className="leading-relaxed mb-6">
            We sat down with young people connected to Oonchiumpa. Not for a
            report. To listen.
          </p>

          <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-6 mb-6">
            <p
              className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Jackquann, 14
            </p>
            <p className="text-sm leading-relaxed mb-3">
              Lives with his grandfather at Upper Camp. Loves basketball. Has
              been to the Alice Springs Detention Centre.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              When asked what detention is like:{' '}
              <em>&ldquo;At six o&apos;clock you get locked down. You wait
              till tomorrow.&rdquo;</em>
            </p>
            <p className="text-sm leading-relaxed mb-3">
              What would stop him getting in trouble:{' '}
              <em>&ldquo;Looking after my family.&rdquo;</em>
            </p>
            <p className="text-sm leading-relaxed">
              What he&apos;d tell politicians:{' '}
              <em>&ldquo;Programs.&rdquo;</em>
            </p>
          </div>

          <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-6 mb-6">
            <p
              className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Nigel, 14
            </p>
            <p className="text-sm leading-relaxed mb-3">
              Lives at a station in Double Camp. Likes school. Wants to be a
              footy player. Knows he needs to &ldquo;go to school every
              day&rdquo; to get there.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              On being away from home:{' '}
              <em>&ldquo;Bad. Like, going away from my family and
              stuff.&rdquo;</em>
            </p>
            <p className="text-sm leading-relaxed">
              Oonchiumpa picks him up, takes him to school, takes him to the
              cinema. He has the goal. What was missing was someone to walk the
              path with him.
            </p>
          </div>

          <div className="bg-white border border-[#0A0A0A]/10 rounded-lg p-6 mb-8">
            <p
              className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Laquisha, 16
            </p>
            <p className="text-sm leading-relaxed mb-3">
              Lives with her auntie. Manages a complex living situation with
              more maturity than most adults. Goes to St Joseph&apos;s. Wants
              her driver&apos;s licence. Wants to travel.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              Sent to Darwin youth detention &mdash; 1,500km from home.
              Twelve-minute phone calls. Two-hour waits between calls.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              <em>&ldquo;I don&apos;t like going to Darwin cause I have no
              family there.&rdquo;</em>
            </p>
            <p className="text-sm leading-relaxed">
              When asked why young people get in trouble, she said one word
              without hesitation: <strong>&ldquo;Oppression.&rdquo;</strong>
            </p>
          </div>

          <p className="leading-relaxed mb-6">
            Every young person names family as the primary thing detention takes
            away. Not freedom &mdash; <strong>family</strong>. Home is complex
            &mdash; camps have drinking, overcrowding &mdash; but nobody says
            &ldquo;I need a new home.&rdquo; They say &ldquo;that&apos;s
            home.&rdquo; The need isn&apos;t removal from community. It&apos;s
            making community safer and more supportive.
          </p>

          {/* Why It Works */}
          <SectionHeading>Why It Works</SectionHeading>

          <div className="space-y-5 mb-8">
            {[
              {
                title: 'Stay when others distance',
                body: 'Other services wrote off Xavier. Oonchiumpa built trust over years. The system fails by distancing when relationships get hard.',
              },
              {
                title: 'Treat young people as capable',
                body: 'Xavier led the bed-building. Jackquann wants to look after his family. Laquisha manages a complex life with extraordinary clarity. These aren\u2019t deficits \u2014 they\u2019re strengths.',
              },
              {
                title: 'Family is the unit, not the individual',
                body: 'Fred: "We say to you guys, you know, your family now." Every interaction reinforces identity, belonging, and connection.',
              },
              {
                title: 'Practical support, not just programs',
                body: 'Rides to school. Cinema trips. Showing up consistently. The consistency is the intervention.',
              },
              {
                title: 'Culture is protection',
                body: 'When young people know who they are, where they come from, and who their family is, they make different choices.',
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

          {/* What Comes Next */}
          <SectionHeading>What Comes Next</SectionHeading>

          <p className="leading-relaxed mb-6">
            Oonchiumpa isn&apos;t standing still. They&apos;re deepening what
            works and sharing it with others.
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'Atnarpa Homestead',
                desc: 'On-Country cultural camps in the MacDonnell Ranges. Young people reconnecting to land, language, and ceremony with Elders and Traditional Owners. Bush tucker, art, deep listening \u2014 the things Jackquann said he wants to learn.',
              },
              {
                title: 'Learning Across Borders',
                desc: 'In June 2026, eight Oonchiumpa staff are travelling to South East Queensland \u2014 visiting community organisations, sharing models, building relationships, learning from what others have built.',
              },
              {
                title: 'True Justice Expansion',
                desc: 'The ANU partnership is growing. Deep listening, restorative justice, and First Nations knowledge shaping how the next generation of legal professionals understand justice \u2014 not as punishment, but as healing.',
              },
              {
                title: 'Community Enterprise',
                desc: 'Young people building Stretch Beds from recycled plastic. Not charity \u2014 enterprise. Community members collecting waste, making products, learning trades. Xavier showed what\u2019s possible when you trust young people with real work.',
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

          {/* Cost Comparison */}
          <SectionHeading>The Numbers</SectionHeading>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#0A0A0A] text-white p-6 rounded-lg">
              <p
                className="text-xs uppercase tracking-wider text-white/40 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Detention (NT)
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {fmt(costsData.byState?.NT?.annualCost || costsData.national.annualCost)}
              </p>
              <p className="text-sm text-white/50 mt-1">per young person per year</p>
              <p className="text-xs text-white/30 mt-3">
                {fmt(costsData.byState?.NT?.dailyCost || costsData.national.dailyCost)}/day
                &middot; 80%+ reoffending
              </p>
            </div>
            <div className="bg-[#059669] text-white p-6 rounded-lg">
              <p
                className="text-xs uppercase tracking-wider text-white/60 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Oonchiumpa
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                97.6% less
              </p>
              <p className="text-sm text-white/70 mt-1">for the entire operation</p>
              <p className="text-xs text-white/50 mt-3">
                95% diversion &middot; 72% school re-engagement
              </p>
            </div>
          </div>

          {/* Closing */}
          <div className="border-t-2 border-[#0A0A0A]/10 pt-10 mt-16">
            <p className="text-lg leading-relaxed mb-6">
              Fred Campbell put it simply: the system fails young people by not
              sharing information, by distancing when relationships get hard, by
              writing off capability.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Oonchiumpa succeeds by doing the opposite. Staying. Earning trust
              over years. Treating young people as capable. Being family.
            </p>

            <PullQuote>
              Xavier built a bed. Jackquann wants to look after his grandfather.
              Nigel wants to play footy. Laquisha named the root cause in one
              word. The alternative to detention isn&apos;t theoretical. It
              lives in community. In Alice Springs, it&apos;s called Oonchiumpa.
            </PullQuote>
          </div>

          {/* Consent note */}
          <div className="mt-12 pt-6 border-t border-[#0A0A0A]/10">
            <p
              className="text-xs text-[#0A0A0A]/40 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Young people&apos;s stories are sourced from Empathy Ledger
              transcripts with consent protocols in place. Names used with
              permission. Detention cost data sourced from the Productivity
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
            <a
              href="https://www.goodsoncountry.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg hover:bg-[#0A0A0A] hover:text-white transition-colors text-sm"
            >
              Goods on Country <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

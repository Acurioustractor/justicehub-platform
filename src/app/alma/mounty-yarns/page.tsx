import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react';
import { Metadata } from 'next';
import { getDetentionCosts } from '@/lib/detention-costs';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mounty Yarns — Youth-Led Storytelling From Australia\'s Most Stigmatised Postcode | JusticeHub',
  description:
    'In Mount Druitt, young Aboriginal people built their own media organisation from nothing. 1 person to 20. A 24-minute documentary seen by 100K+ people. Nothing about us without us.',
  openGraph: {
    title: 'Mounty Yarns — Youth-Led Storytelling From Mount Druitt',
    description: 'Young Aboriginal people in Western Sydney built their own media organisation because no one was telling their stories right. 100K+ documentary viewers. 7 programs. $4.3M tracked.',
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

export default async function MountyYarnsPage() {
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
              Darug Country / Mount Druitt, Western Sydney
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Mounty Yarns
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl">
              Youth-led storytelling from one of Australia&apos;s most stigmatised
              postcodes. Young Aboriginal people who built their own media
              organisation because no one was telling their stories right.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/40 mt-8">
              <MapPin className="w-4 h-4" />
              <span>Mount Druitt, NSW</span>
              <span className="mx-2">|</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                100% Aboriginal-led &middot; 7 programs &middot; 20-person team
              </span>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-b border-[#0A0A0A]/10">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value="100K+" label="Documentary viewers" />
              <StatCard value="1 to 20" label="Team growth" />
              <StatCard value="7" label="Programs running" />
              <StatCard value="$4.3M" label="Funding tracked" />
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-6 sm:px-12 py-12">

          <p className="text-lg leading-relaxed mb-6">
            Australia spends{' '}
            <strong>{fmt(costsData.national.annualCost)}</strong> per year to
            detain one young person. In New South Wales, it&apos;s{' '}
            <strong>{fmt(costsData.byState?.NSW?.annualCost || costsData.national.annualCost)}</strong>.
            The reoffending rate sits above 80%. Indigenous young people are
            locked up at 17 times the rate of non-Indigenous young people.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            In Mount Druitt &mdash; postcode 2770, one of Australia&apos;s most
            written-about, least listened-to communities &mdash; a group of young
            Aboriginal people decided to change the story. Not by asking
            permission. By doing it themselves.
          </p>

          {/* Who They Are */}
          <SectionHeading>Who They Are</SectionHeading>

          <p className="leading-relaxed mb-6">
            Mounty Yarns is a 100% Aboriginal-led youth media and community
            organisation, founded by <strong>Daniel Daylight</strong> and young
            people from Mount Druitt. It started with one person and an idea:
            young Aboriginal people should tell their own stories about their own
            community. No intermediaries. No deficit narratives. No waiting for
            someone else to get it right.
          </p>
          <p className="leading-relaxed mb-6">
            From that single founder, Mounty Yarns has grown to a 20-person team.
            No permission asked. No corporate playbook. Young people who saw what
            the media said about Mount Druitt and decided the response wasn&apos;t
            a complaint &mdash; it was a camera, a microphone, and the authority
            that comes from actually living here.
          </p>

          <PullQuote attribution="Core principle, Mounty Yarns">
            &ldquo;Nothing about us without us.&rdquo;
          </PullQuote>

          <p className="leading-relaxed mb-6">
            The organisation is registered as{' '}
            <strong>Mounty Aboriginal Youth &amp; Community Services Ltd</strong>{' '}
            (ABN 30 674 998 577) and operates as a basecamp in the ALMA Network
            &mdash; a place where community-led alternatives to the justice system
            are designed, tested, and proven by the people closest to the problem.
          </p>

          {/* What They Do */}
          <SectionHeading>What They Do</SectionHeading>

          <p className="leading-relaxed mb-6">
            Mounty Yarns runs seven interconnected programs, every one of them
            built by young people, for young people:
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'Documentary Filmmaking',
                desc: 'A 24-minute documentary that reached 100,000+ viewers and showed Australia what Mount Druitt actually looks like \u2014 not what the media says. Young people as directors, subjects, and storytellers. Challenging deficit narratives with evidence from their own lives.',
              },
              {
                title: 'Backyard Campus',
                desc: 'A community activation space in the heart of Mt Druitt. Drop-in, workshops, a safe space. Not a service centre with intake forms \u2014 a place young people actually want to be, run by people they actually know.',
              },
              {
                title: 'Podcasting & Community Journalism',
                desc: 'Young people telling their own stories about policing, education, custody, and growing up Aboriginal in Western Sydney. First-person accounts that no external journalist could produce because they don\u2019t live it.',
              },
              {
                title: 'Youth Advocacy & Policy',
                desc: '"Nothing about us without us" \u2014 young people in policy rooms, at tables where decisions about their communities are made. Not token consultation. Real voices with real authority, backed by the credibility of lived experience.',
              },
              {
                title: 'Cultural Connection',
                desc: 'Reconnecting to Darug culture, language, and identity through creative expression. Storytelling as a pathway back to who you are \u2014 not the version of you that the system defines, but the one your Elders and ancestors recognise.',
              },
              {
                title: 'Mentoring & Employment Pathways',
                desc: 'Peer mentoring, work experience, first jobs in media and creative industries. Young people who came through the programs now mentoring the next cohort. Not charity \u2014 career.',
              },
              {
                title: 'CONTAINED Tour Anchor',
                desc: 'Mt Druitt is a key stop on THE CONTAINED Australian Tour 2026 \u2014 bringing the national conversation about youth justice to the community that has the most to say about it.',
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

          {/* The Documentary */}
          <SectionHeading>The Documentary That Changed the Story</SectionHeading>

          <p className="leading-relaxed mb-6">
            Mount Druitt has been the subject of media coverage for decades &mdash;
            almost none of it by people who live there. The narratives are
            predictable: crime, poverty, dysfunction. A postcode used as shorthand
            for everything wrong with public housing.
          </p>
          <p className="leading-relaxed mb-6">
            Mounty Yarns made a 24-minute documentary that 100,000+ people watched.
            It didn&apos;t argue with the media. It replaced the media. Young
            Aboriginal people behind the camera, in front of the camera, in the
            edit suite. Telling their own story of a place they love, a community
            that raised them, and a future they&apos;re building with their own
            hands.
          </p>

          <PullQuote>
            The documentary showed Australia what Mount Druitt actually looks like.
            Not what the headlines say. Not what the politicians claim. What it
            looks like when you live there and you&apos;re proud of where
            you&apos;re from.
          </PullQuote>

          <p className="leading-relaxed mb-6">
            That documentary wasn&apos;t funded by a broadcaster. It wasn&apos;t
            produced by an external crew flying in for a week. It was made by young
            people who grew this organisation from nothing &mdash; one person to
            twenty, no permission asked &mdash; and decided the best response to
            bad storytelling is better storytelling.
          </p>

          {/* Why It Works */}
          <SectionHeading>Why It Works</SectionHeading>

          <div className="space-y-5 mb-8">
            {[
              {
                title: 'Young people lead, not "participate"',
                body: 'Mounty Yarns isn\u2019t a program that consults young people. Young people built it, run it, and decide its direction. The difference between participation and leadership is everything.',
              },
              {
                title: 'Stories are power',
                body: 'When you control the narrative about your community, you change what\u2019s possible. 100K viewers didn\u2019t watch a government campaign \u2014 they watched young Aboriginal people telling the truth about home.',
              },
              {
                title: 'Employment, not intervention',
                body: 'Peer mentoring flows into real jobs. Media skills become careers. The pipeline from program participant to team member is the model \u2014 that\u2019s how you grow from 1 person to 20.',
              },
              {
                title: 'Place-based, not parachuted',
                body: 'Every program runs in Mount Druitt, by people from Mount Druitt. The Backyard Campus isn\u2019t a satellite office of a Sydney CBD charity. It\u2019s home turf.',
              },
              {
                title: 'Culture as foundation',
                body: 'Darug Country. Language, identity, creative expression. Young people reconnecting to culture don\u2019t need the justice system to tell them who they are.',
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
            Mounty Yarns is building beyond media. They&apos;re becoming the NSW
            anchor for a national network of community-led alternatives.
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'CONTAINED Tour Stop \u2014 April 25, 2026',
                desc: 'Mt Druitt hosts THE CONTAINED Australian Tour. The national conversation about youth detention comes to the community with the most to say. Young people from Mounty Yarns aren\u2019t just attending \u2014 they\u2019re anchoring it.',
              },
              {
                title: 'Backyard Campus Expansion',
                desc: 'Growing the community activation space \u2014 more workshops, more drop-in capacity, more young people through the door. A physical home base that proves community infrastructure doesn\u2019t need to look like a government office.',
              },
              {
                title: 'NSW Basecamp for ALMA Network',
                desc: 'Positioning as the NSW sector leader in community-led youth justice alternatives. Mount Druitt as the proof point for what happens when you invest in young people instead of locking them up.',
              },
              {
                title: 'Western Sydney University Partnership',
                desc: 'Connecting grassroots media practice with academic research. Young people\u2019s lived expertise meeting institutional knowledge \u2014 on their terms, from their community, with their stories driving the agenda.',
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
                Detention (NSW)
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {fmt(costsData.byState?.NSW?.annualCost || costsData.national.annualCost)}
              </p>
              <p className="text-sm text-white/50 mt-1">per young person per year</p>
              <p className="text-xs text-white/30 mt-3">
                {fmt(costsData.byState?.NSW?.dailyCost || costsData.national.dailyCost)}/day
                &middot; 80%+ reoffending
              </p>
            </div>
            <div className="bg-[#059669] text-white p-6 rounded-lg">
              <p
                className="text-xs uppercase tracking-wider text-white/60 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Mounty Yarns
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                $4.3M invested
              </p>
              <p className="text-sm text-white/70 mt-1">in community, not concrete</p>
              <p className="text-xs text-white/50 mt-3">
                7 programs &middot; 20-person team &middot; 100K+ reached
              </p>
            </div>
          </div>

          <p className="leading-relaxed mb-6">
            NSW spends{' '}
            <strong>
              {fmt(costsData.byState?.NSW?.annualCost || costsData.national.annualCost)}
            </strong>{' '}
            per young person per year on detention &mdash; concrete, razor wire,
            and an 80% chance they come back. Mounty Yarns has tracked $4.3M in
            funding across 7 programs that employ 20 people, reach 100,000+
            through documentary alone, and build careers instead of criminal
            records. The maths isn&apos;t complicated. The question is why we keep
            choosing the expensive option that doesn&apos;t work.
          </p>

          {/* Closing */}
          <div className="border-t-2 border-[#0A0A0A]/10 pt-10 mt-16">
            <p className="text-lg leading-relaxed mb-6">
              Mount Druitt didn&apos;t wait for the system to fix its reputation.
              Young people picked up cameras and microphones and built something
              from nothing. One person became twenty. A documentary reached a
              hundred thousand. A backyard became a campus.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              This is what happens when you stop designing programs for young
              people and start investing in organisations built by them. Mounty
              Yarns isn&apos;t a pilot. It&apos;s proof.
            </p>

            <PullQuote>
              Young people grew this from nothing &mdash; one person to twenty,
              no permission asked. The documentary showed Australia what Mount
              Druitt actually looks like. Not what the media says. In Western
              Sydney, the alternative to the system is already running. It&apos;s
              called Mounty Yarns.
            </PullQuote>
          </div>

          {/* Consent note */}
          <div className="mt-12 pt-6 border-t border-[#0A0A0A]/10">
            <p
              className="text-xs text-[#0A0A0A]/40 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Program descriptions sourced from ALMA Network data and public
              records. Detention cost data sourced from the Productivity
              Commission Report on Government Services (ROGS), Table 17A.20.
              Mounty Yarns content shared with consent of the organisation.
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
              ALMA Basecamps <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

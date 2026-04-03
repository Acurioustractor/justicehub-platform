import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { getDetentionCosts } from '@/lib/detention-costs';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'PICC — 21 Programs, 200 Staff, $0 Philanthropic Funding | JusticeHub',
  description:
    'Palm Island Community Company is the largest Aboriginal community-controlled organisation in North Queensland. 21 programs. 200+ team members. $44M ecosystem. Zero philanthropic funding.',
  openGraph: {
    title: 'PICC — 21 Programs, 200 Staff, $0 Philanthropic Funding',
    description: 'The largest Aboriginal community-controlled organisation in North Queensland runs a $44M ecosystem with zero philanthropic backing.',
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

function StatCard({ value, label, urgent }: { value: string; label: string; urgent?: boolean }) {
  return (
    <div className="bg-white border-2 border-[#0A0A0A] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <p
        className={`text-3xl font-bold ${urgent ? 'text-[#DC2626]' : ''}`}
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

export default async function PICCPage() {
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
              Wulgurukaba &amp; Bindal Country
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Palm Island Community Company
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl">
              The largest Aboriginal community-controlled organisation in North
              Queensland. 21 programs. 200+ staff. A $44 million ecosystem. Zero
              philanthropic funding.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/40 mt-8">
              <MapPin className="w-4 h-4" />
              <span>Palm Island &amp; The Centre, Townsville, QLD</span>
              <span className="mx-2">|</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Led by Henry Doyle
              </span>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-b border-[#0A0A0A]/10">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value="21" label="Programs" />
              <StatCard value="200+" label="Team members" />
              <StatCard value="$44M" label="Ecosystem" />
              <StatCard value="$0" label="Philanthropic funding" urgent />
            </div>
          </div>
        </section>

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-6 sm:px-12 py-12">

          <p className="text-lg leading-relaxed mb-6">
            Australia spends{' '}
            <strong>{fmt(costsData.national.annualCost)}</strong> per year to
            detain one young person. In Queensland, it&apos;s{' '}
            <strong>{fmt(costsData.byState?.QLD?.annualCost || costsData.national.annualCost)}</strong>.
            The system spends millions punishing children and calls it justice.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            On Palm Island &mdash; one of the most famous and most neglected
            Aboriginal communities in Australia &mdash; a different model
            exists. Not a pilot. Not a program. An entire ecosystem, built and
            run by community.
          </p>

          {/* Who They Are */}
          <SectionHeading>Who They Are</SectionHeading>

          <p className="leading-relaxed mb-6">
            Palm Island Community Company (PICC) is the largest Aboriginal
            community-controlled organisation in North Queensland. Led by{' '}
            <strong>Henry Doyle</strong>, PICC operates 21 programs with more
            than 200 team members across Palm Island and The Centre in
            Townsville. The organisation manages a $44 million ecosystem that
            spans youth justice, health, housing, education, employment, and
            cultural healing.
          </p>
          <p className="leading-relaxed mb-6">
            PICC exists because Palm Island refused to wait for government to
            act. The community has a history that most Australians know only
            from headlines &mdash; the 2004 death in custody of Cameron
            &ldquo;Mulrunji&rdquo; Doomadgee, the uprising that followed, the
            prosecution of Palm Island man Lex Wotton for &ldquo;rioting&rdquo;
            while the officer responsible for the death was acquitted. That
            history didn&apos;t break Palm Island. It clarified something: if
            change was going to come, community would have to build it
            themselves.
          </p>

          <PullQuote>
            &ldquo;Palm Island doesn&apos;t need saving. It needs resourcing.
            The community already has the leadership, the programs, and the
            people. What it doesn&apos;t have is the philanthropic investment
            that any organisation of this scale should command.&rdquo;
          </PullQuote>

          <p className="leading-relaxed mb-6">
            The Centre in Townsville serves as PICC&apos;s operational hub,
            connecting Palm Island to mainland services. It&apos;s the bridge
            between an island community and the infrastructure of a regional
            city &mdash; health appointments, court appearances, employment
            pathways, educational institutions. Without this mainland
            presence, Palm Island families navigating the system would face
            the crossing alone.
          </p>

          {/* What They Do */}
          <SectionHeading>What They Do</SectionHeading>

          <p className="leading-relaxed mb-6">
            PICC runs seven interconnected program areas, each grounded in
            community authority and cultural knowledge:
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'Youth Justice Diversion',
                desc: 'Community-led alternatives to detention on Palm Island. Young people diverted from the justice system through cultural mentoring, family support, and structured pathways \u2014 on Country, with Elders, within community.',
              },
              {
                title: 'Cultural Healing Programs',
                desc: 'Elders-led cultural camps, ceremony, and language revitalization. Reconnecting young people and families to identity, kinship, and the knowledge systems that have sustained community for millennia.',
              },
              {
                title: 'Employment & Enterprise',
                desc: 'The largest employer on Palm Island. Creating real jobs and pathways for young people in a community where mainstream employment barely exists. Enterprise development that keeps economic activity within community.',
              },
              {
                title: 'Housing & Infrastructure',
                desc: 'Community housing programs addressing chronic overcrowding. On Palm Island, families of 15-20 share three-bedroom houses. PICC works on the housing crisis that underpins almost every other disadvantage.',
              },
              {
                title: 'Health & Wellbeing',
                desc: 'Community-controlled health services, mental health support, and substance programs. Health delivery designed by community, for community \u2014 not flown-in services that leave when the funding cycle ends.',
              },
              {
                title: 'Education & Training',
                desc: 'School engagement, vocational training, and literacy programs. Keeping young people connected to education through culturally safe approaches and practical support that addresses the real barriers to attendance.',
              },
              {
                title: 'Community Services',
                desc: 'Family support, emergency services, and community transport across Palm Island. The connective tissue that holds community together \u2014 the services that don\u2019t make headlines but make daily life possible.',
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

          {/* Scale and Injustice */}
          <SectionHeading>The Scale Philanthropy Ignores</SectionHeading>

          <p className="leading-relaxed mb-6">
            Consider the numbers. PICC operates 21 programs. It employs more
            than 200 people. It manages a $44 million ecosystem. By any
            measure &mdash; staff count, program breadth, community reach,
            operating budget &mdash; this is a major organisation.
          </p>
          <p className="leading-relaxed mb-6">
            Now consider this: PICC receives <strong>$0 in philanthropic
            funding</strong>. Zero. Not underfunded. Not partially funded.
            Zero.
          </p>
          <p className="leading-relaxed mb-6">
            If PICC were a non-Indigenous organisation with 200 staff and 21
            programs operating across two locations, it would be flooded with
            foundation money. Program officers would be booking site visits.
            Impact reports would circulate boardrooms. The organisation would
            be held up as a model.
          </p>
          <p className="leading-relaxed mb-6">
            Instead, PICC is invisible to Australian philanthropy. The most
            underfunded large Indigenous organisation in the country, doing
            the most comprehensive community-controlled work in North
            Queensland, with zero philanthropic recognition.
          </p>

          <PullQuote>
            &ldquo;$44 million in community infrastructure. 200 staff. 21
            programs spanning youth justice, health, housing, education, and
            culture. And not a single philanthropic dollar. That&apos;s not
            an oversight. That&apos;s a structural failure of Australian
            philanthropy.&rdquo;
          </PullQuote>

          {/* Palm Island History */}
          <SectionHeading>Palm Island</SectionHeading>

          <p className="leading-relaxed mb-6">
            Palm Island sits 65 kilometres off the coast of Townsville. It was
            established as an Aboriginal reserve in 1918 &mdash; a place where
            First Nations people from across Queensland were forcibly
            relocated, separated from Country, family, and language group. For
            decades it operated under the control of government
            superintendents. Community had no say over their own lives.
          </p>
          <p className="leading-relaxed mb-6">
            The 2004 death in custody of Mulrunji Doomadgee &mdash; and the
            system&apos;s response to it &mdash; crystallised what community
            already knew. The justice system did not exist to protect them.
            The coronial process, the acquittal, the prosecution of Lex
            Wotton &mdash; each stage demonstrated that the system considered
            community anger more criminal than a death in custody.
          </p>
          <p className="leading-relaxed mb-6">
            Today, Palm Island faces the compounding effects of that history:
            chronic overcrowding, limited employment, inadequate health
            services, and a youth justice system that removes young people
            from community and sends them to detention centres on the
            mainland. PICC&apos;s existence is the community&apos;s answer.
            Not waiting for reform. Building the alternative.
          </p>

          {/* Why It Works */}
          <SectionHeading>Why Community Control Works</SectionHeading>

          <div className="space-y-5 mb-8">
            {[
              {
                title: 'Scale proves the model',
                body: '21 programs and 200+ staff isn\u2019t a pilot. It\u2019s proof that community-controlled organisations can deliver comprehensive services at a scale that outperforms government provision.',
              },
              {
                title: 'Largest employer on Palm Island',
                body: 'PICC doesn\u2019t just deliver services \u2014 it creates the economic base. When your organisation is the largest employer in the community, every program dollar circulates locally.',
              },
              {
                title: 'Integrated, not siloed',
                body: 'Youth justice connects to housing connects to health connects to employment. PICC runs all of them. A young person diverted from detention can access cultural healing, education support, and family services through one organisation.',
              },
              {
                title: 'Mainland bridge',
                body: 'The Centre in Townsville means Palm Island families don\u2019t face the mainland alone. Court, health, education, employment \u2014 PICC provides the infrastructure that connects an island community to regional services.',
              },
              {
                title: 'Community authority',
                body: 'Programs designed and led by community. Not fly-in consultants. Not external evaluators. People who live there, who have family there, who understand the place because it\u2019s theirs.',
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
                &middot; system that removes children from community
              </p>
            </div>
            <div className="bg-[#059669] text-white p-6 rounded-lg">
              <p
                className="text-xs uppercase tracking-wider text-white/60 mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                PICC Ecosystem
              </p>
              <p
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                $44M
              </p>
              <p className="text-sm text-white/70 mt-1">21 programs across community</p>
              <p className="text-xs text-white/50 mt-3">
                200+ staff &middot; $0 philanthropic &middot; community-controlled
              </p>
            </div>
          </div>

          <p className="leading-relaxed mb-6">
            Queensland spends{' '}
            <strong>{fmt(costsData.byState?.QLD?.annualCost || costsData.national.annualCost)}</strong>{' '}
            per year to detain one young person. PICC runs an entire
            ecosystem &mdash; youth justice, health, housing, education,
            employment, cultural healing, and community services &mdash; for
            $44 million. The question isn&apos;t whether community-controlled
            models work. The question is why they receive zero philanthropic
            investment while doing this much.
          </p>

          {/* What Comes Next */}
          <SectionHeading>What Comes Next</SectionHeading>

          <p className="leading-relaxed mb-6">
            PICC is positioned at the centre of several converging
            opportunities that could transform how philanthropy and the
            justice system engage with North Queensland.
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'Judges on Country',
                desc: 'In mid-April, 55 judges are visiting Oonchiumpa in Alice Springs for the first Judges on Country event. PICC\u2019s connections to the national conversation about justice, community, and Country are deepening. The judiciary is starting to listen.',
              },
              {
                title: 'CONTAINED Tour \u2014 QLD Stops',
                desc: 'THE CONTAINED touring exhibition is coming to Queensland. Palm Island and Townsville represent the most powerful story in the tour \u2014 an island community that built its own infrastructure while Australia looked away.',
              },
              {
                title: 'ALMA Network \u2014 QLD Basecamp',
                desc: 'PICC is designated as a basecamp in the ALMA Network \u2014 one of the anchor organisations that connects community-controlled services across the country. The QLD hub for what works in youth justice.',
              },
              {
                title: 'The Philanthropic Case',
                desc: 'An organisation this size, with this track record, receiving $0 in philanthropic funding is not a gap \u2014 it\u2019s a scandal. The case for investment is overwhelming. What\u2019s missing isn\u2019t evidence. It\u2019s attention.',
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
              Palm Island has been written about for decades. Usually as a
              cautionary tale. A crisis. A headline. What rarely gets written
              is what community built while Australia was looking away.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              PICC is that story. Not a program or a pilot but an entire
              ecosystem &mdash; 21 programs, 200 staff, $44 million &mdash;
              built by community, led by community, for community. It is
              proof that the alternative to the failing system already exists
              at scale.
            </p>

            <PullQuote>
              The question is no longer whether community-controlled
              organisations can deliver at scale. PICC answers that. The
              question is why Australian philanthropy has invested $0 in the
              answer.
            </PullQuote>
          </div>

          {/* Consent note */}
          <div className="mt-12 pt-6 border-t border-[#0A0A0A]/10">
            <p
              className="text-xs text-[#0A0A0A]/40 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Organisational data sourced from PICC public reporting and ALMA
              Network records. Detention cost data sourced from the
              Productivity Commission Report on Government Services (ROGS),
              Table 17A.20. Funding analysis based on JusticeHub funding
              database cross-referenced with philanthropic disclosure records.
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

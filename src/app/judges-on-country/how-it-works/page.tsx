import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, FileText, Handshake, MapPinned, Quote, Users } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

export const metadata: Metadata = {
  title: 'How it works | Judges on Country | JusticeHub',
  description:
    'One sentence, one story, six postcards, one day on Country, one data layer. How the Judges on Country field trip is built so the thesis survives the journey home.',
};

const SPINE = [
  {
    layer: 'The Sentence',
    body: '"Our young people are just collateral in a bigger issue."',
    caption: 'Kristy & Tanya — Oonchiumpa. This is the lens.',
    accent: '#DC2626',
  },
  {
    layer: 'The Story',
    body: 'Eight minutes. Written in their voice. Consent tier = public.',
    caption: 'Read before the trip. Sets the frame every other layer repeats.',
    accent: '#0A0A0A',
    href: '/stories/start-here-kristy-and-tanya',
    hrefLabel: 'Read the story',
  },
  {
    layer: 'The Page',
    body: 'Hero quote, Start-here callout, six-card grid, Come-to-Country CTA.',
    caption: "The digital home. For anyone who can't be on Country — funders, fellow judges, the press.",
    accent: '#059669',
    href: '/judges-on-country',
    hrefLabel: 'Open the page',
  },
  {
    layer: 'The Deck',
    body: 'Six A6 postcards. Card 01 is the thesis. Cards 02-06 are the young people it names.',
    caption: 'Print and pack. QR on the back of each card opens the full story.',
    accent: '#0A0A0A',
    href: '/judges-on-country/postcards',
    hrefLabel: 'Print the deck',
  },
  {
    layer: 'The Day',
    body: 'Thirty minutes on Country. Seven steps. Led by Traditional Owners.',
    caption: 'Thirty minutes where judges decide under the same constraint as the kids they sentence — limited time, incomplete information, real consequences. Mparntwe, Sep 15, 2026.',
    accent: '#DC2626',
    href: '/judges-on-country/alice-springs',
    hrefLabel: 'See the trip brief',
  },
  {
    layer: 'The Net',
    body: 'ALMA search, Oonchiumpa basecamp, JusticeHub programs, CivicScope data.',
    caption: 'What a judge takes into chambers after the cards are on the desk.',
    accent: '#059669',
  },
];

const ACTIVITY_STEPS = [
  {
    time: '0-5',
    name: 'Grounding',
    role: 'TO opens — "Our young people experience your decisions as consequences."',
    storyRole: 'The sentence is the ground. Already read. TO invokes, does not argue.',
  },
  {
    time: '5-10',
    name: 'Meet the person',
    role: 'Photo + minimal story. Feels like a court file. Deliberately incomplete.',
    storyRole: 'Cards 02-06 (Jackquann, Nigel, Laquisha, Fred & Xavier) — the collateral the story named.',
  },
  {
    time: '10-15',
    name: 'Decide fast',
    role: '"You don\'t get more time. This is what court feels like. Decide." Individual, pressured.',
    storyRole: 'Judges feel the constraint the kids feel. The postcard in their hand is the file.',
  },
  {
    time: '15-20',
    name: 'Undo certainty',
    role: 'Reveal what they didn\'t know, one fact at a time.',
    storyRole: 'QR backs open full EL stories. "You decided before you knew."',
  },
  {
    time: '20-25',
    name: 'Uncomfortable truth',
    role: 'TOs speak to system design — 80%+ reoffending is not failure, it is design.',
    storyRole: '95% diversion / 72% re-engagement / 97.6% cheaper — Kristy\'s counter-evidence.',
  },
  {
    time: '25-28',
    name: 'Show the alternative',
    role: 'Real local program on screen. ALMA search for their own court\'s LGA.',
    storyRole: '/judges-on-country/alice-springs + Oonchiumpa basecamp pulled up live.',
  },
  {
    time: '28-30',
    name: 'Leave unsettled',
    role: 'No neat ending. "What you don\'t know matters."',
    storyRole: 'Deck in their hand. Card 01 is Kristy\'s sentence. That is what they walk out with.',
  },
];

const WORKSTREAMS = [
  {
    icon: BookOpen,
    team: 'Story team',
    home: 'Empathy Ledger',
    scope: [
      'Publish the polished story at start-here-kristy-and-tanya (slug matches the page links)',
      'Cut 6 short clips (30-60s each) — one per storyteller, sits on the story back',
      'Lock voice + photo approvals with Kristy before print',
    ],
  },
  {
    icon: Compass,
    team: 'Trip team',
    home: 'Oonchiumpa + ACT',
    scope: [
      'Own the 30-min on-Country activity flow — rehearse once with a non-judge group',
      'Pack 55 postcard sets + Kristy\'s "Start here" card slid in as card zero',
      'Send the pre-trip email 7 days out (story link + frame + what to bring)',
    ],
  },
  {
    icon: Handshake,
    team: 'Platform team',
    home: 'JusticeHub',
    scope: [
      'Wire the EL record so the slug resolves on /stories/empathy-ledger',
      'Keep the Start-here callout as the canonical entry above the card grid',
      'Track clicks on the closing Come-to-Country CTA — the only loud button on the page',
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F5F0E8]">
        {/* Hero */}
        <section className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] px-4 pb-20 pt-44 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#059669]">
              Judges on Country · How it works
            </p>
            <h1
              className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.02 }}
            >
              One sentence, one story, six postcards, one day on Country.
            </h1>
            <p className="mb-8 max-w-3xl text-lg leading-relaxed text-gray-300">
              The trip is built so the thesis survives the journey home. Every layer is the same
              argument, zoomed to a different distance. Here is how the pieces work together, and how
              we operationalise the pattern for every stop that comes after.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/judges-on-country"
                className="inline-flex items-center gap-2 bg-[#DC2626] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Back to the main page
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stories/start-here-kristy-and-tanya"
                className="inline-flex items-center gap-2 border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Read the founders' story
              </Link>
            </div>
          </div>
        </section>

        {/* The spine */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-3xl">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                The narrative spine
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Six layers. One argument.
              </h2>
              <p className="text-lg text-gray-700">
                Each layer repeats the sentence in a different medium. A judge can enter at any layer
                and end up carrying the same frame.
              </p>
            </div>

            <div className="space-y-4">
              {SPINE.map((layer, i) => (
                <div
                  key={layer.layer}
                  className="border-2 border-[#0A0A0A] bg-white p-5 md:p-6"
                  style={{ borderLeftWidth: '8px', borderLeftColor: layer.accent }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span
                          className="font-mono text-[11px] uppercase tracking-[0.22em]"
                          style={{ color: layer.accent }}
                        >
                          Layer {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500"
                        >
                          {layer.layer}
                        </span>
                      </div>
                      <p
                        className="mb-2 text-lg font-bold text-[#0A0A0A] md:text-xl"
                        style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.2 }}
                      >
                        {layer.body}
                      </p>
                      <p className="text-sm text-gray-600 md:text-base">{layer.caption}</p>
                    </div>
                    {layer.href && layer.hrefLabel && (
                      <Link
                        href={layer.href}
                        className="inline-flex flex-shrink-0 items-center gap-2 border-2 border-[#0A0A0A] px-4 py-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A] hover:text-white"
                      >
                        {layer.hrefLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The activity */}
        <section className="border-y-2 border-[#0A0A0A] bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                The 30-minute activity
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                How the story maps onto the day.
              </h2>
              <p className="text-lg text-gray-700">
                Each of the seven steps is a repetition of the frame. The TOs lead. The story is what
                the judges have already read. The activity proves it.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#0A0A0A]">
                    <th className="py-3 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      Time
                    </th>
                    <th className="py-3 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      Step
                    </th>
                    <th className="py-3 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      On the day
                    </th>
                    <th className="py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      What Kristy's story does for it
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITY_STEPS.map((step) => (
                    <tr key={step.time} className="border-b border-[#0A0A0A]/10">
                      <td className="py-4 pr-4 align-top font-mono text-sm text-[#DC2626]">
                        {step.time}
                      </td>
                      <td className="py-4 pr-4 align-top text-sm font-bold text-[#0A0A0A]">
                        {step.name}
                      </td>
                      <td className="py-4 pr-4 align-top text-sm text-gray-700">{step.role}</td>
                      <td className="py-4 align-top text-sm text-gray-700">{step.storyRole}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Workstreams */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                How we operationalise
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Three teams. One frame.
              </h2>
              <p className="text-lg text-gray-700">
                Three teams work at the same time. The frame doesn&rsquo;t move.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {WORKSTREAMS.map((ws) => {
                const Icon = ws.icon;
                return (
                  <div key={ws.team} className="border-2 border-[#0A0A0A] bg-white p-6">
                    <Icon className="mb-4 h-8 w-8 text-[#059669]" />
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {ws.home}
                    </p>
                    <h3
                      className="mb-4 text-xl font-bold text-[#0A0A0A]"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {ws.team}
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-700">
                      {ws.scope.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#DC2626]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Template for other stops */}
        <section className="border-y-2 border-[#0A0A0A] bg-[#F1EADF] px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
              The pattern travels
            </p>
            <h2
              className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Alice Springs is the reference. Every other stop plugs into the same shape.
            </h2>
            <p className="mb-6 text-lg text-gray-700">
              Every CONTAINED tour stop needs the same five pieces: a local thesis quote, a local
              storyteller, a local card 01, a local day on ground, a local data layer. The pattern is
              stop-agnostic — only the names change.
            </p>

            <div className="border-2 border-[#0A0A0A] bg-white p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#059669]">
                    Mount Druitt — Apr 25
                  </p>
                  <p className="mb-3 text-base font-bold text-[#0A0A0A]">
                    Daniel Daylight · Mounty Yarns
                  </p>
                  <p className="mb-0 text-sm text-gray-600 italic">
                    "Young people telling their own stories is the most powerful advocacy there is."
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#059669]">
                    Brisbane — May 15
                  </p>
                  <p className="mb-3 text-base font-bold text-[#0A0A0A]">
                    Katherine Hayes · YAC
                  </p>
                  <p className="mb-0 text-sm text-gray-600 italic">
                    "We would love to host this at YAC."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-[#DC2626] px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-white/80">
              Mparntwe · Alice Springs · Sep 15, 2026
            </p>
            <h2
              className="mb-4 text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The sentence is the door. The day is what walking through it feels like.
            </h2>
            <p className="mb-8 text-lg text-white/90">
              Come to Country with Kristy, Tanya, and the Oonchiumpa team.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/judges-on-country/alice-springs"
                className="bg-white px-8 py-4 text-lg font-bold text-[#DC2626] transition-colors hover:bg-gray-100"
              >
                Come to Country — Sep 15
              </Link>
              <Link
                href="/stories/start-here-kristy-and-tanya"
                className="border-2 border-white px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
              >
                Read the story first
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

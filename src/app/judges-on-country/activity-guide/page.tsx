'use client';

import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight,
  Clock,
  Users,
  MessageCircle,
  Eye,
  Scale,
  Heart,
  MapPin,
  CheckCircle,
  Printer,
} from 'lucide-react';

const ACTIVITY_PHASES = [
  {
    time: '0–5 min',
    title: 'Grounding',
    led: 'Traditional Owners / Elders',
    icon: Heart,
    accent: '#DC2626',
    description: 'Welcome to Country or grounding words. Set the frame.',
    facilitatorNotes: [
      'This is not a formal opening speech — keep it grounded and direct.',
      '"You are visitors here. These are our young people. What you decide affects lives, families, and future generations."',
      'Set the tone: respect, listening, discomfort is welcome.',
    ],
    materials: ['No materials needed — led from authority and place.'],
  },
  {
    time: '5–10 min',
    title: 'Meet the person',
    led: 'Facilitator distributes cards',
    icon: Eye,
    accent: '#059669',
    description: 'Each judge receives one Story Card. A real young person — photo, quote, 2–3 lines.',
    facilitatorNotes: [
      'Hand out cards face-down. Ask judges to turn them over together.',
      'Say: "This is a young person who could appear in your court."',
      'Give 60–90 seconds of silence. Let them read. No analysis yet.',
      'The card should feel like a court file snapshot — deliberately incomplete.',
    ],
    materials: [
      '6 Story Cards (printed from /judges-on-country/postcards)',
      'Distribute so each table/group gets a different young person.',
    ],
  },
  {
    time: '10–15 min',
    title: 'The decision',
    led: 'Facilitator',
    icon: Scale,
    accent: '#DC2626',
    description: 'Judges must decide what happens next — fast, with incomplete information.',
    facilitatorNotes: [
      'Say: "You don\'t get more time. This is what court feels like. Decide."',
      'Give them 3 lenses (not right answers):',
      '  1. Respond to the offence',
      '  2. Respond to risk and prior history',
      '  3. Respond to the person and their context',
      'Ask them to physically choose — place a marker, raise hand, or stand in a zone.',
      'Make it embodied, not abstract. No discussion yet.',
      'They must feel the pressure and limitation of real court.',
    ],
    materials: [
      'Decision Point cards or printed prompt sheets.',
      'Optional: 3 zones marked on the ground for physical movement.',
    ],
  },
  {
    time: '15–20 min',
    title: 'Undo their certainty',
    led: 'Facilitator + Traditional Owners',
    icon: MessageCircle,
    accent: '#059669',
    description: 'Reveal what they didn\'t know. Destabilise their decision.',
    facilitatorNotes: [
      'Reveal facts one at a time. Pause between each:',
      '  "He hasn\'t been home in 3 weeks"',
      '  "There is no transport to the nearest program"',
      '  "He trusts one person — who wasn\'t mentioned in the file"',
      '  "This is his third breach, not third offence"',
      'After each reveal, let silence sit.',
      'Then ask: "Would you make the same decision now?"',
      'No need for answers. The discomfort is the point.',
    ],
    materials: ['Reveal cards or facilitator script with facts.'],
  },
  {
    time: '20–25 min',
    title: 'The uncomfortable truth',
    led: 'Traditional Owners / Program Leaders',
    icon: Users,
    accent: '#DC2626',
    description: 'Community authority speaks to what matters. Not culture explained — justice reframed.',
    facilitatorNotes: [
      'This is NOT "learning about culture." This is hearing how justice looks from this place.',
      'Suggested framing:',
      '  "Our young people are not complicated. But the system around them is."',
      '  "You are asked to decide quickly. Without knowing what matters."',
      '  "And then they live with that decision for years."',
      'If possible, a local youth worker or Elder speaks for 1–2 minutes about a real young person.',
      'Keep it raw. Not polished. That\'s what cuts through.',
    ],
    materials: ['No materials — spoken from authority.'],
  },
  {
    time: '25–28 min',
    title: 'Show the alternative',
    led: 'Oonchiumpa team / Facilitator',
    icon: MapPin,
    accent: '#059669',
    description: 'Show what exists — or what doesn\'t. This is the JusticeHub moment.',
    facilitatorNotes: [
      'Two options (both powerful):',
      'Option A — A program exists locally:',
      '  Show what Oonchiumpa does. Who runs it. What it changes.',
      '  "This is what happens when support is there."',
      'Option B — Nothing exists:',
      '  "This is what you are deciding into — with no alternative."',
      'If possible, show the JusticeHub search live — let judges see what exists near THEIR courts.',
      'Say: "You can search your own jurisdiction right now."',
      'Hand out the QR card linking to /judges-on-country#search',
    ],
    materials: [
      'QR cards to justicehub.com.au/judges-on-country',
      'Optional: laptop/screen showing JusticeHub search live.',
    ],
  },
  {
    time: '28–30 min',
    title: 'Leave unsettled',
    led: 'Traditional Owners',
    icon: Heart,
    accent: '#0A0A0A',
    description: 'No neat ending. A memory they carry back to court.',
    facilitatorNotes: [
      'Final words from community:',
      '  "We are not asking you to fix everything."',
      '  "But next time you see a young person like this…"',
      '  "know that what you don\'t know matters."',
      'Hand them the takeaway card set (postcards + QR).',
      'No applause prompt. No "any questions?" Just let it end.',
    ],
    materials: [
      'Printed postcard set (6 cards) for each judge to take home.',
      'Each card has QR back to the full story on JusticeHub.',
    ],
  },
];

export default function ActivityGuidePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F5F0E8] pt-44">
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-4xl">
            <span className="mb-3 block font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
              Facilitator Guide
            </span>
            <h1
              className="mb-6 text-4xl font-bold text-[#0A0A0A] md:text-5xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Judges on Country — 30-Minute Activity
            </h1>
            <div className="mb-8 max-w-3xl text-lg text-gray-700">
              <p className="mb-4">
                This guide is for the Oonchiumpa team and Traditional Owners facilitating
                the on-Country judicial experience. 55 judges. 30 minutes. The goal is not
                information — it&apos;s a felt shift in how they see a young person in front of them.
              </p>
              <p className="mb-0">
                If they leave feeling clear, it failed. If they leave thinking
                &ldquo;I&apos;ve been doing something… and I&apos;m not sure it&apos;s right anymore&rdquo;
                — that&apos;s the shift.
              </p>
            </div>

            <div className="mb-10 grid gap-4 sm:grid-cols-3">
              <div className="border-2 border-[#0A0A0A] bg-white p-5">
                <Clock className="mb-2 h-6 w-6 text-[#DC2626]" />
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>30 min</div>
                <div className="text-sm text-gray-600">Total activity time</div>
              </div>
              <div className="border-2 border-[#0A0A0A] bg-white p-5">
                <Users className="mb-2 h-6 w-6 text-[#059669]" />
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>55 judges</div>
                <div className="text-sm text-gray-600">From across Australia</div>
              </div>
              <div className="border-2 border-[#0A0A0A] bg-white p-5">
                <MapPin className="mb-2 h-6 w-6 text-[#DC2626]" />
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>On Country</div>
                <div className="text-sm text-gray-600">Alice Springs, Arrernte land</div>
              </div>
            </div>

            <div className="mb-10 border-2 border-[#0A0A0A] bg-[#0A0A0A] p-6 text-white">
              <h2 className="mb-3 text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Core principles
              </h2>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  <span><strong>Cultural authority leads, doesn&apos;t decorate.</strong> Traditional Owners frame what &ldquo;right response&rdquo; looks like.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  <span><strong>Discomfort over clarity.</strong> Don&apos;t resolve it for them. Let them walk away unsettled.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  <span><strong>Mirror their real constraint.</strong> Limited time, incomplete info, pressure to decide.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  <span><strong>Expose system design, not individual failure.</strong> Even when they act properly, harm can still happen.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  <span><strong>Use silence.</strong> Don&apos;t rush reflection moments. Silence is where the shift happens.</span>
                </li>
              </ul>
            </div>

            <h2
              className="mb-6 text-2xl font-bold text-[#0A0A0A]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Activity flow
            </h2>

            <div className="space-y-6">
              {ACTIVITY_PHASES.map((phase, index) => {
                const Icon = phase.icon;
                return (
                  <div
                    key={index}
                    className="border-2 border-[#0A0A0A] bg-white"
                  >
                    <div className="flex items-center gap-4 border-b-2 border-[#0A0A0A] p-5" style={{ backgroundColor: phase.accent + '10' }}>
                      <div
                        className="flex h-12 w-12 items-center justify-center border-2 border-[#0A0A0A]"
                        style={{ backgroundColor: phase.accent }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="block font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: phase.accent }}>
                          {phase.time}
                        </span>
                        <h3
                          className="text-xl font-bold text-[#0A0A0A]"
                          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                          {phase.title}
                        </h3>
                      </div>
                      <span className="hidden text-xs text-gray-500 sm:block">Led by: {phase.led}</span>
                    </div>

                    <div className="p-5">
                      <p className="mb-4 text-gray-700">{phase.description}</p>

                      <div className="mb-4">
                        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[#059669]">
                          Facilitator notes
                        </span>
                        <ul className="space-y-1">
                          {phase.facilitatorNotes.map((note, i) => (
                            <li key={i} className="text-sm text-gray-700">
                              {note.startsWith('  ') ? (
                                <span className="ml-4 block italic text-gray-600">{note.trim()}</span>
                              ) : (
                                <span>{note}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
                          Materials
                        </span>
                        <ul className="space-y-1">
                          {phase.materials.map((mat, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-600">
                              <Printer className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
                              {mat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 border-2 border-[#DC2626] bg-white p-6">
              <h2 className="mb-3 text-xl font-bold text-[#0A0A0A]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                What they take home
              </h2>
              <ul className="mb-4 space-y-2 text-sm text-gray-700">
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  The 6-card postcard set — real photos, real voices, QR to full stories
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  QR link to JusticeHub search — find alternatives near their own court
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                  A memory they can&apos;t unsee — the gap between what they decided and what they didn&apos;t know
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/judges-on-country/postcards"
                  className="inline-flex items-center gap-2 bg-[#DC2626] px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  <Printer className="h-4 w-4" />
                  Print postcard set
                </Link>
                <Link
                  href="/judges-on-country"
                  className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-5 py-3 text-sm font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
                >
                  Open the judges landing page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Clock,
  Camera,
  Mic,
  Compass,
  Wrench,
  Heart,
  BookOpen,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oonchiumpa SEQ Inspiration Trip — June 2026 | ALMA Network | JusticeHub',
  description:
    'An immersive 6-day learning trip bringing Oonchiumpa staff from Mparntwe (Alice Springs) to South East Queensland. Indigenous-led justice reinvestment, manufacturing training, and national network building.',
};

const DAYS = [
  {
    day: 1,
    date: 'Monday 8 June',
    title: 'Minjerribah (North Stradbroke Island)',
    theme: 'Indigenous-led Justice Reinvestment in Practice',
    icon: Compass,
    color: '#059669',
    host: {
      name: 'MMEIC — Minjerribah Moorgumpin Elders-in-Council',
      detail: '31-year Indigenous-led organisation, founded 1993',
      location: 'Minjerribah (North Stradbroke Island), Quandamooka Country',
    },
    highlights: [
      'Welcome to Country — Quandamooka Elders',
      'Justice Reinvestment program (launched 2024, targeting Quandamooka youth)',
      'Economic self-determination model: ~$300K revenue, 12 permanent + 20 casual roles',
      'Cultural heritage tour of Minjerribah led by Elders',
      'Yarn circle: "What can we learn from 31 years of self-determination?"',
      'Reflection session: parallels between Quandamooka and Arrernte approaches',
    ],
    artifacts: [
      'Empathy Ledger reflection recordings',
      'MMEIC Justice Reinvestment notes for ALMA evidence library',
      'Photo documentation',
    ],
  },
  {
    day: 2,
    date: 'Tuesday 9 June',
    title: 'Toowoomba',
    theme: 'Sport-Based Mentorship and Regional Innovation',
    icon: Heart,
    color: '#059669',
    host: {
      name: 'Adapt Mentorship Indigenous Corporation',
      detail:
        'Adam & Susy Wenitong — Aboriginal and Torres Strait Islander Citizens of the Year 2025',
      location: 'Toowoomba, Jarowair & Giabal Country',
    },
    highlights: [
      'Adapt Mentorship program walkthrough — Street Footy, Kickstarter, Songlines',
      'Sport-based diversion vs cultural brokerage: comparing models',
      'QLD Gold Standard Kickstarter funding model — relevant for NT applications',
      'Yarn circle: "What does scale look like?" — multiple orgs complementing, not competing',
      'Street Footy session — Oonchiumpa team joins in',
    ],
    artifacts: [
      'Adapt model documentation for ALMA evidence library',
      'Cross-referral pathways between Adapt and Oonchiumpa',
      'Kickstarter funding model notes',
    ],
  },
  {
    day: 3,
    date: 'Wednesday 10 June',
    title: 'Art, Culture & Connection in Brisbane',
    theme: 'How Culture Drives Change',
    icon: BookOpen,
    color: '#059669',
    host: {
      name: 'YAC Brisbane — Youth Advocacy Centre',
      detail: 'Shannon Cant — wants to HOST the CONTAINED Container in Brisbane',
      location: 'Meanjin (Brisbane), Turrbal & Jagera Country',
    },
    highlights: [
      'QAGOMA — Aboriginal and Torres Strait Islander art collection',
      'Musgrave Park / West End — First Nations community spaces in an urban context',
      'Birrunga Gallery & Dining — First Nations owned',
      'YAC Brisbane visit — youth justice advocacy, CONTAINED hosting discussion',
      'Mounty Yarns connection (video call with Daniel Daylight)',
    ],
    artifacts: [
      'Cultural reflections for Empathy Ledger',
      'YAC × Oonchiumpa partnership notes',
      'Art/gallery responses — potential CONTAINED Room 3 content',
    ],
  },
  {
    day: 4,
    date: 'Thursday 11 June',
    title: 'Witta Farm — Manufacturing Training Day 1',
    theme: 'Hands-On Manufacturing Training',
    icon: Wrench,
    color: '#059669',
    host: {
      name: 'A Curious Tractor — Recycling Production Facility',
      detail: 'Containerised manufacturing: flat-pack beds, washing machines, furniture',
      location: 'Witta, Jinibara Nation Country, Sunshine Coast Hinterland',
    },
    highlights: [
      'Training Block 1: Plastic processing — shredding, sorting, colour grading',
      'Training Block 2: Press operations & sheet production',
      'First production run — team produces their first batch together',
      '400+ beds delivered across 8 communities, each diverts 20-25kg plastic from landfill',
      'Debrief: mapping to Alice Springs facility (Innovation Fund EOI — $1.2M)',
      'Campfire dinner — dreaming about the Alice Springs facility',
    ],
    artifacts: [
      'Training completion records',
      'Production photos and video for Innovation Fund application',
      'Technical notes for Alice Springs replication',
    ],
  },
  {
    day: 5,
    date: 'Friday 12 June',
    title: 'Witta Farm — Production & Design Day 2',
    theme: 'Ownership, Design, and Taking It Home',
    icon: Wrench,
    color: '#059669',
    host: {
      name: 'A Curious Tractor — Design & Business Planning',
      detail: 'Cultural customisation and Oonchiumpa Goods business model',
      location: 'Witta, Jinibara Nation Country',
    },
    highlights: [
      'Advanced assembly — full bed and washing machine assembly from flat-pack',
      'Cultural customisation: Arrernte design language on products',
      'Naming in language — following the Warumungu naming tradition',
      'Oonchiumpa Goods business plan co-creation session',
      'Revenue projections, community pricing, employment pathway design',
      'Reflection circle: "What are we taking home?"',
    ],
    artifacts: [
      'Oonchiumpa Goods business plan draft (co-authored)',
      'Product samples made by the team',
      'Cultural design concepts documented',
    ],
  },
  {
    day: 6,
    date: 'Saturday 13 June',
    title: 'Workshop, Ways of Working & Departure',
    theme: 'Integration and Forward Planning',
    icon: Users,
    color: '#059669',
    host: {
      name: 'ACT + Oonchiumpa — Partnership Workshop',
      detail: 'Ways of Working, year planning, commitments',
      location: 'Brisbane',
    },
    highlights: [
      'Ways of Working Workshop — communication, decision-making, cultural protocols',
      'Year planning: Innovation Fund, CONTAINED tour, True Justice expansion',
      'Return trip planning: when SEQ teams visit Alice Springs / Atnarpa',
      'Each team member shares one thing they\'re taking home and one commitment',
    ],
    artifacts: [
      'Ways of Working agreement (co-signed)',
      '2026 partnership roadmap',
      'Individual commitment statements',
      'Full trip reflection video for Empathy Ledger',
    ],
  },
];

export default function OonchiumpaSeqTripPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <Link
              href="/trips"
              className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mb-4"
            >
              ALMA Network Trips <ArrowRight className="w-3 h-3" />
            </Link>
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Learning Trip
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Oonchiumpa SEQ Inspiration Trip
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mb-8">
              Bringing 8 Oonchiumpa staff from Mparntwe (Alice Springs) to South East Queensland
              for 6 days of immersive learning. Indigenous-led justice reinvestment, sport-based
              mentorship, cultural exchange, and hands-on manufacturing training.
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-white/60">
                <Calendar className="w-4 h-4" />
                <span
                  className="text-sm"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  June 8–13, 2026
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span
                  className="text-sm"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  SEQ — Minjerribah, Toowoomba, Brisbane, Witta
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4" />
                <span
                  className="text-sm"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  10 participants (8 Oonchiumpa + 2 ACT hosts)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Purpose */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
          <div className="max-w-3xl">
            <h2
              className="text-2xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Purpose
            </h2>
            <p className="text-[#0A0A0A]/70 mb-4">
              This is about <strong>being inspired, creating new connections, understanding
              the scope of work beyond the NT, and creating reflections and place for this
              year.</strong>
            </p>
            <p className="text-[#0A0A0A]/70">
              The deeper purpose: build a two-way exchange pipeline. This trip south inspires
              the Oonchiumpa team; a return trip brings SEQ organisations to Alice Springs to
              see the work on Country. Together, this builds a national focus for how we
              better support young people.
            </p>
          </div>
        </section>

        {/* Day-by-Day Itinerary */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
          <h2
            className="text-2xl font-bold tracking-tight mb-8"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            6-Day Itinerary
          </h2>

          <div className="space-y-6">
            {DAYS.map((day) => {
              const Icon = day.icon;
              return (
                <div
                  key={day.day}
                  className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden"
                >
                  {/* Day header */}
                  <div className="bg-[#0A0A0A] text-white px-6 py-4 flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#059669]/20">
                      <Icon className="w-5 h-5 text-[#059669]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="text-xs uppercase tracking-wider text-white/40"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          Day {day.day}
                        </span>
                        <span
                          className="text-xs text-white/50"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {day.date}
                        </span>
                      </div>
                      <h3
                        className="text-lg font-bold text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {day.title}
                      </h3>
                    </div>
                    <span className="hidden md:block text-xs text-white/40 max-w-[200px] text-right">
                      {day.theme}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Host */}
                    <div className="md:col-span-1">
                      <p
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Host
                      </p>
                      <p className="font-semibold text-sm">{day.host.name}</p>
                      <p className="text-xs text-[#0A0A0A]/60 mt-1">{day.host.detail}</p>
                      <p className="text-xs text-[#0A0A0A]/40 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {day.host.location}
                      </p>
                    </div>

                    {/* Highlights */}
                    <div className="md:col-span-1">
                      <p
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Key Activities
                      </p>
                      <ul className="space-y-1.5">
                        {day.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-[#0A0A0A]/70 flex items-start gap-2">
                            <span className="text-[#059669] mt-0.5 shrink-0">•</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Artifacts */}
                    <div className="md:col-span-1">
                      <p
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-2"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Artifacts
                      </p>
                      <ul className="space-y-1.5">
                        {day.artifacts.map((a, i) => (
                          <li key={i} className="text-xs text-[#0A0A0A]/60 flex items-center gap-2">
                            <Camera className="w-3 h-3 text-[#0A0A0A]/30 shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Story Capture */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
          <div className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em] text-[#059669] mb-3"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Story Capture
                </p>
                <h2
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Every Day Goes Live
                </h2>
                <p className="text-white/70 mb-6">
                  During the trip, daily story capture via voice recordings and photo
                  documentation feeds directly into the Empathy Ledger and JusticeHub.
                  Each day&apos;s content publishes to the Oonchiumpa Basecamp page —
                  building a real-time record of learning, connection, and inspiration.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-[#059669]" />
                    <span className="text-sm text-white/60">Voice reflections from each team member</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Camera className="w-4 h-4 text-[#059669]" />
                    <span className="text-sm text-white/60">Photo documentation at every stop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-[#059669]" />
                    <span className="text-sm text-white/60">Daily summary published to Basecamp page</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p
                  className="text-xs uppercase tracking-wider text-white/40 mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Trip Artifacts
                </p>
                <div className="space-y-3">
                  {[
                    'Empathy Ledger reflections from each stop',
                    'MMEIC case study for ALMA evidence library',
                    'Adapt Mentorship model brief',
                    'YAC × Oonchiumpa partnership notes',
                    'Oonchiumpa Goods business plan draft',
                    'Manufacturing training certificates',
                    'Product samples — beds made by the team',
                    'Cultural design concepts for Arrernte products',
                    'Ways of Working agreement',
                    '2026 Partnership Roadmap',
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
          <h2
            className="text-2xl font-bold tracking-tight mb-8"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Why This Matters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
              <h3 className="font-bold mb-3">For Oonchiumpa</h3>
              <ul className="space-y-2">
                {[
                  'Inspiration from MMEIC — 31 years of Indigenous-led self-determination',
                  'Manufacturing readiness for Alice Springs facility from day one',
                  'National connections: MMEIC, YAC, Adapt, A Curious Tractor network',
                  'Strategic clarity — Ways of Working co-created, not imposed',
                  'Cultural exchange — Arrernte mob on Quandamooka and Jinibara Country',
                ].map((item, i) => (
                  <li key={i} className="text-sm text-[#0A0A0A]/70 flex items-start gap-2">
                    <span className="text-[#059669] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
              <h3 className="font-bold mb-3">For the National Movement</h3>
              <ul className="space-y-2">
                {[
                  'Two-way exchange established — return trip to Alice Springs planned',
                  'Real stories, real photos, real reflections for CONTAINED tour',
                  'MMEIC and consortium models documented in ALMA evidence library',
                  'The proof for funders: "We didn\'t just talk about national connection. We did it."',
                  'Template created: "This is what a learning trip looks like. Apply for the next one."',
                ].map((item, i) => (
                  <li key={i} className="text-sm text-[#0A0A0A]/70 flex items-start gap-2">
                    <span className="text-[#059669] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
          <div className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div>
              <h2
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Want to host the next trip?
              </h2>
              <p className="text-white/60 text-sm">
                If your organisation does the work and wants to show it — apply to host an
                ALMA Network learning trip in your community.
              </p>
            </div>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm whitespace-nowrap"
            >
              Join the Network <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

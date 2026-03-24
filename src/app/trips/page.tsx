import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Trips | ALMA Network | JusticeHub',
  description:
    'ALMA Network learning trips — immersive exchanges between community organisations doing the work across Australia.',
};

const TRIPS = [
  {
    slug: 'oonchiumpa-seq-2026',
    title: 'Oonchiumpa SEQ Inspiration Trip',
    dates: 'June 8–13, 2026',
    location: 'South East Queensland',
    stops: ['Minjerribah (MMEIC)', 'Toowoomba (Adapt Mentorship)', 'Brisbane (YAC)', 'Witta (Manufacturing)'],
    participants: '8 Oonchiumpa staff + 2 ACT hosts',
    status: 'upcoming' as const,
    description:
      'Bringing Oonchiumpa staff from Mparntwe to SEQ for Indigenous-led justice reinvestment, sport-based mentorship, cultural exchange, and hands-on manufacturing training.',
  },
];

const STATUS_STYLES = {
  upcoming: { label: 'Upcoming', bg: 'bg-[#059669]/10', text: 'text-[#059669]' },
  active: { label: 'In Progress', bg: 'bg-[#DC2626]/10', text: 'text-[#DC2626]' },
  complete: { label: 'Complete', bg: 'bg-[#0A0A0A]/10', text: 'text-[#0A0A0A]/60' },
};

export default function TripsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA Network
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Learning Trips
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Immersive exchanges between community organisations across Australia.
              Visit each other&apos;s Country, see the work in practice, build real
              connections, and bring the learnings home.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
          {/* Trips list */}
          <div className="space-y-6">
            {TRIPS.map((trip) => {
              const style = STATUS_STYLES[trip.status];
              return (
                <Link
                  key={trip.slug}
                  href={`/trips/${trip.slug}`}
                  className="block bg-white rounded-xl border border-[#0A0A0A]/10 hover:border-[#0A0A0A]/30 transition-colors overflow-hidden group"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                        <h2
                          className="text-xl font-bold group-hover:underline"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {trip.title}
                        </h2>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#0A0A0A]/20 group-hover:text-[#0A0A0A]/60 transition-colors shrink-0 mt-2" />
                    </div>

                    <p className="text-sm text-[#0A0A0A]/60 mb-4">{trip.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-[#0A0A0A]/50" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {trip.dates}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {trip.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {trip.participants}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {trip.stops.map((stop) => (
                        <span
                          key={stop}
                          className="text-xs px-2.5 py-1 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/60"
                        >
                          {stop}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* How it works */}
          <section className="mt-20">
            <h2
              className="text-2xl font-bold tracking-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              How Learning Trips Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Compass,
                  title: 'Visit',
                  desc: 'Community organisations visit each other\'s Country. See the work in practice — not in a report, not on a website. In person, on the ground.',
                },
                {
                  icon: Users,
                  title: 'Connect',
                  desc: 'Build real relationships between people doing the same work in different places. Yarn circles, shared meals, working alongside each other.',
                },
                {
                  icon: Calendar,
                  title: 'Return',
                  desc: 'Every trip creates a return invitation. The exchange goes both ways — building a national network of community organisations that know each other.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                    <Icon className="w-6 h-6 text-[#059669] mb-3" />
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-[#0A0A0A]/60">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="max-w-2xl">
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Host a Learning Trip
              </h2>
              <p className="text-white/70 mb-6">
                If your organisation does the work and wants to build connections with
                community organisations across Australia — apply to host or join a
                learning trip through the ALMA Network.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                >
                  Join the Network
                </Link>
                <Link
                  href="/basecamps"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  See Basecamps
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

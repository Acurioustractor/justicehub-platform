import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  ArrowRight,
  Music,
  Palette,
  Users,
  Star,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gig Guide | ALMA Network | JusticeHub',
  description:
    'Youth-friendly events, workshops, and gigs near ALMA Network basecamps across Australia.',
};

const STATE_NAMES: Record<string, string> = {
  NT: 'Northern Territory',
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
};

const EVENT_TYPE_ICONS: Record<string, any> = {
  music: Music,
  art: Palette,
  workshop: Users,
  community: Star,
};

function getEventTypeIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('music') || lower.includes('concert') || lower.includes('gig')) return Music;
  if (lower.includes('art') || lower.includes('gallery') || lower.includes('exhibition')) return Palette;
  if (lower.includes('workshop') || lower.includes('training')) return Users;
  return Star;
}

export default async function GigGuidePage() {
  const supabase = createServiceClient() as any;

  // Fetch youth opportunities that are event-like
  const { data: opportunities } = await supabase
    .from('youth_opportunities')
    .select('*')
    .eq('status', 'open')
    .order('deadline', { ascending: true })
    .limit(50);

  // Fetch basecamps for location context
  const { data: basecamps } = await supabase
    .from('organizations')
    .select('id, name, slug, state')
    .or('partner_tier.eq.basecamp,type.eq.basecamp')
    .order('state');

  const events = opportunities || [];
  const basecampStates = new Set((basecamps || []).map((b: any) => b.state));

  // Group by state where possible
  const byState: Record<string, typeof events> = {};
  const national: typeof events = [];
  for (const e of events) {
    const state = e.location_state;
    if (state && STATE_NAMES[state]) {
      if (!byState[state]) byState[state] = [];
      byState[state].push(e);
    } else {
      national.push(e);
    }
  }

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
              Gig Guide
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-4">
              Youth-friendly events, workshops, gigs, and opportunities near ALMA Network
              basecamps. Art, music, culture, training — things worth showing up for.
            </p>
            <p
              className="text-sm text-white/40"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {events.length} opportunities currently open
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-12">
          {/* Basecamp locations */}
          {(basecamps || []).length > 0 && (
            <section>
              <p
                className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-3"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Near Basecamps
              </p>
              <div className="flex flex-wrap gap-2">
                {(basecamps || []).map((bc: any) => (
                  <span
                    key={bc.id}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#059669]/10 text-[#059669] font-medium"
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {bc.name} ({bc.state})
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Events by state */}
          {Object.entries(byState)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([state, stateEvents]) => (
              <section key={state}>
                <div className="flex items-center gap-3 mb-4">
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {STATE_NAMES[state]}
                  </h2>
                  {basecampStates.has(state) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">
                      Basecamp
                    </span>
                  )}
                  <span className="text-xs text-[#0A0A0A]/30">
                    {stateEvents.length} {stateEvents.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stateEvents.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}

          {/* National / unlocated */}
          {national.length > 0 && (
            <section>
              <h2
                className="text-xl font-bold mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                National & Online
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {national.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {events.length === 0 && (
            <div className="text-center py-16">
              <Music className="w-12 h-12 text-[#0A0A0A]/20 mx-auto mb-4" />
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                No events right now
              </h2>
              <p className="text-sm text-[#0A0A0A]/50 mb-6">
                New events, workshops, and opportunities are added daily by the network.
                Check back soon.
              </p>
              <Link
                href="/opportunities"
                className="text-sm font-semibold text-[#059669] hover:underline"
              >
                See all opportunities <ArrowRight className="inline w-3 h-3 ml-1" />
              </Link>
            </div>
          )}

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Running an Event?
                </h2>
                <p className="text-white/70 mb-6">
                  If you&apos;re running a youth-friendly event, workshop, or gig — add it
                  to the guide. ALMA Network basecamps will help promote it to young people
                  in your area.
                </p>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                >
                  Add Your Event <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p
                  className="text-xs uppercase tracking-wider text-white/40 mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  What Gets Listed
                </p>
                <div className="space-y-2">
                  {[
                    'Art exhibitions and gallery openings',
                    'Live music and open mic nights',
                    'Workshops — creative, skills, training',
                    'Community gatherings and yarn circles',
                    'Sport events and tournaments',
                    'Cultural days and festivals',
                    'Job fairs and career expos',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const Icon = getEventTypeIcon(event.category || event.type || '');
  const hasUrl = event.application_url || event.source_url;

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#059669]/10 shrink-0">
          <Icon className="w-4 h-4 text-[#059669]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">
            {event.title || event.name}
          </h3>
          {event.organizer && (
            <p className="text-xs text-[#0A0A0A]/40 mt-0.5">{event.organizer}</p>
          )}
          {event.description && (
            <p className="text-xs text-[#0A0A0A]/60 mt-1.5 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {event.deadline && (
              <span className="text-xs text-[#0A0A0A]/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(event.deadline).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
            {(event.location_state || event.location_name) && (
              <span className="text-xs text-[#0A0A0A]/40 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location_name || event.location_state}
              </span>
            )}
          </div>
          {hasUrl && (
            <a
              href={event.application_url || event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] mt-2 hover:underline"
            >
              More info <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

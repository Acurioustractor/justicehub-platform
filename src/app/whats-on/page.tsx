import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { Calendar, MapPin, DollarSign, ExternalLink, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "What's On | JusticeHub",
  description:
    'Upcoming events, CONTAINED tour dates, funding opportunities, and community gatherings across the JusticeHub network.',
};

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  location_name: string | null;
  location_state: string | null;
  registration_url: string | null;
  is_featured: boolean;
  image_url: string | null;
}

interface Opportunity {
  id: string;
  name: string;
  funder_name: string | null;
  category: string | null;
  deadline: string | null;
  min_grant_amount: number | null;
  max_grant_amount: number | null;
  source_url: string | null;
  application_url: string | null;
  jurisdictions: string[] | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number | null): string {
  if (!amount) return '';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (86400 * 1000));
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  launch: 'Launch',
  conference: 'Conference',
  workshop: 'Workshop',
  exhibition: 'Exhibition',
  webinar: 'Webinar',
  meeting: 'Meeting',
};

export default async function WhatsOnPage() {
  const supabase = createServiceClient() as any;
  const now = new Date().toISOString();

  const [eventsRes, oppsRes] = await Promise.all([
    supabase
      .from('events')
      .select(
        'id, title, description, event_type, start_date, end_date, location_name, location_state, registration_url, is_featured, image_url'
      )
      .eq('is_public', true)
      .gte('start_date', now)
      .order('start_date', { ascending: true })
      .limit(20),
    supabase
      .from('alma_funding_opportunities')
      .select(
        'id, name, funder_name, category, deadline, min_grant_amount, max_grant_amount, source_url, application_url, jurisdictions'
      )
      .eq('status', 'open')
      .order('deadline', { ascending: true })
      .limit(20),
  ]);

  const events: Event[] = eventsRes.data || [];
  const opportunities: Opportunity[] = oppsRes.data || [];

  const containedEvents = events.filter((e) => e.title.includes('CONTAINED'));
  const otherEvents = events.filter((e) => !e.title.includes('CONTAINED'));

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-white/50 mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              What&apos;s On
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Events, opportunities,
              <br />
              and the road ahead
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Everything happening across the JusticeHub network — CONTAINED tour stops,
              community gatherings, open grants, and ways to get involved.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-20">
          {/* CONTAINED Tour */}
          {containedEvents.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    CONTAINED Tour 2026
                  </h2>
                  <p className="text-sm text-[#0A0A0A]/60 mt-1">
                    One shipping container. Three rooms. Thirty minutes.
                  </p>
                </div>
                <Link
                  href="/contained/tour"
                  className="text-sm font-semibold uppercase tracking-wider hover:underline"
                >
                  Full tour details
                  <ArrowRight className="inline w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {containedEvents.map((event) => {
                  const days = daysUntil(event.start_date);
                  return (
                    <div
                      key={event.id}
                      className="bg-[#0A0A0A] text-white rounded-xl p-6 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-white">{event.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(event.start_date)}
                            </span>
                            {event.location_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location_name}
                                {event.location_state && `, ${event.location_state}`}
                              </span>
                            )}
                          </div>
                        </div>
                        {days > 0 && (
                          <span
                            className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/70"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {days}d away
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-white/50 line-clamp-2">{event.description}</p>
                      )}
                      {event.registration_url && (
                        <a
                          href={event.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#DC2626] hover:underline"
                        >
                          Register <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Community Events */}
          {otherEvents.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Community Events
                  </h2>
                  <p className="text-sm text-[#0A0A0A]/60 mt-1">
                    Workshops, conferences, and gatherings across the network
                  </p>
                </div>
                <Link
                  href="/events"
                  className="text-sm font-semibold uppercase tracking-wider hover:underline"
                >
                  All events
                  <ArrowRight className="inline w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-3">
                {otherEvents.map((event) => {
                  const days = daysUntil(event.start_date);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-4 bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A]/5">
                        <Calendar className="w-5 h-5 text-[#0A0A0A]/40" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/50">
                            {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#0A0A0A]/50">
                          <span>{formatDate(event.start_date)}</span>
                          {event.location_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location_name}
                              {event.location_state && `, ${event.location_state}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-xs text-[#0A0A0A]/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {days > 0 ? `${days}d` : 'Today'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Funding Opportunities */}
          {opportunities.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Open Funding
                  </h2>
                  <p className="text-sm text-[#0A0A0A]/60 mt-1">
                    Grants and funding opportunities for youth justice programs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opp) => {
                  const days = opp.deadline ? daysUntil(opp.deadline) : null;
                  const range = [formatAmount(opp.min_grant_amount), formatAmount(opp.max_grant_amount)]
                    .filter(Boolean)
                    .join(' – ');
                  return (
                    <div
                      key={opp.id}
                      className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{opp.name}</h3>
                          {opp.funder_name && (
                            <p className="text-sm text-[#0A0A0A]/50 mt-0.5">{opp.funder_name}</p>
                          )}
                        </div>
                        <DollarSign className="w-5 h-5 text-[#059669] shrink-0" />
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {range && (
                          <span
                            className="px-2 py-1 rounded-full bg-[#059669]/10 text-[#059669] font-medium"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {range}
                          </span>
                        )}
                        {opp.deadline && (
                          <span
                            className={`px-2 py-1 rounded-full font-medium ${
                              days !== null && days < 14
                                ? 'bg-[#DC2626]/10 text-[#DC2626]'
                                : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/50'
                            }`}
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            Closes {formatDate(opp.deadline)}
                            {days !== null && days > 0 ? ` (${days}d)` : ''}
                          </span>
                        )}
                        {opp.jurisdictions?.map((j) => (
                          <span
                            key={j}
                            className="px-2 py-1 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/50"
                          >
                            {j}
                          </span>
                        ))}
                      </div>

                      {(opp.application_url || opp.source_url) && (
                        <a
                          href={opp.application_url || opp.source_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                        >
                          Apply <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {events.length === 0 && opportunities.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-[#0A0A0A]/50">
                No upcoming events or opportunities right now. Check back soon.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

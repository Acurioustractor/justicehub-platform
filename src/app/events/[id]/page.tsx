import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Calendar, MapPin, Clock, Users, ExternalLink, ArrowLeft } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location_name?: string;
  location_state?: string;
  latitude?: number;
  longitude?: number;
  registration_url?: string;
  max_attendees?: number;
  is_featured?: boolean;
  node?: {
    id: string;
    name: string;
    state_code: string;
    description: string;
  };
}

async function getEvent(id: string): Promise<Event | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      id, title, description, event_type, start_date, end_date,
      location_name, location_state, latitude, longitude,
      registration_url, max_attendees, is_featured,
      node:justicehub_nodes(id, name, state_code, description)
    `)
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Event;
}

async function getRelatedEvents(event: Event): Promise<Event[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('events')
    .select(`
      id, title, event_type, start_date, location_name, location_state
    `)
    .eq('is_public', true)
    .neq('id', event.id)
    .gte('start_date', new Date().toISOString())
    .order('start_date')
    .limit(3);

  return (data || []) as Event[];
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const relatedEvents = await getRelatedEvents(event);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      launch: 'bg-ochre-100 text-ochre-800 border-ochre-300',
      workshop: 'bg-eucalyptus-100 text-eucalyptus-800 border-eucalyptus-300',
      conference: 'bg-blue-100 text-blue-800 border-blue-300',
      webinar: 'bg-purple-100 text-purple-800 border-purple-300',
      meeting: 'bg-gray-100 text-gray-800 border-gray-300',
      exhibition: 'bg-pink-100 text-pink-800 border-pink-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const isPastEvent = new Date(event.start_date) < new Date();

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Breadcrumb */}
        <section className="py-4 border-b border-gray-200 bg-sand-50">
          <div className="container-justice">
            <Link
              href="/events"
              className="flex items-center gap-2 text-sm text-earth-600 hover:text-ochre-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
          </div>
        </section>

        {/* Event Header */}
        <section className="py-12 border-b-2 border-black bg-gradient-to-br from-sand-50 via-ochre-50 to-white">
          <div className="container-justice max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border ${getEventTypeColor(event.event_type)}`}>
                {event.event_type}
              </span>
              {event.is_featured && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-ochre-500 text-white">
                  Featured
                </span>
              )}
              {isPastEvent && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-gray-500 text-white">
                  Past Event
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-6">{event.title}</h1>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-sm font-bold uppercase tracking-wider text-earth-600 mb-4">
                  Date & Time
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-ochre-600" />
                    <span className="font-medium">{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-ochre-600" />
                    <span>
                      {formatTime(event.start_date)}
                      {event.end_date && ` - ${formatTime(event.end_date)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-sm font-bold uppercase tracking-wider text-earth-600 mb-4">
                  Location
                </h3>
                {event.location_name ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-ochre-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{event.location_name}</p>
                        {event.location_state && (
                          <p className="text-earth-600">{event.location_state}, Australia</p>
                        )}
                      </div>
                    </div>
                    {event.latitude && event.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-ochre-600 hover:text-ochre-800 flex items-center gap-1"
                      >
                        View on Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs">🌐</span>
                    </div>
                    <span className="font-medium">Online Event</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Event Content */}
        <section className="py-12">
          <div className="container-justice max-w-4xl">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <div className="prose prose-earth max-w-none">
                  {event.description ? (
                    <p className="text-earth-700 whitespace-pre-wrap">{event.description}</p>
                  ) : (
                    <p className="text-earth-600 italic">No description available.</p>
                  )}
                </div>

                {event.node && (
                  <div className="mt-8 p-6 border-2 border-black bg-sand-50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-earth-600 mb-3">
                      Hosted by
                    </h3>
                    <Link
                      href={`/network?node=${event.node.id}`}
                      className="font-bold text-lg hover:text-ochre-600"
                    >
                      {event.node.name}
                    </Link>
                    {event.node.description && (
                      <p className="text-earth-600 mt-2 text-sm">{event.node.description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Registration */}
                {!isPastEvent && (
                  <div className="border-2 border-black p-6 bg-ochre-50">
                    <h3 className="text-lg font-bold mb-4">Register</h3>
                    {event.max_attendees && (
                      <div className="flex items-center gap-2 text-sm text-earth-600 mb-4">
                        <Users className="w-4 h-4" />
                        {event.max_attendees} spots available
                      </div>
                    )}
                    {event.registration_url ? (
                      <a
                        href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                      >
                        Register Now
                      </a>
                    ) : (
                      <Link
                        href={`/events/${event.id}/register`}
                        className="block w-full text-center px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                      >
                        Register Now
                      </Link>
                    )}
                  </div>
                )}

                {/* Share */}
                <div className="border-2 border-black p-6">
                  <h3 className="text-lg font-bold mb-4">Share This Event</h3>
                  <div className="flex gap-2">
                    <ShareButton title={event.title} />
                  </div>
                </div>

                {/* Add to Calendar */}
                <div className="border-2 border-black p-6">
                  <h3 className="text-lg font-bold mb-4">Add to Calendar</h3>
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${event.end_date ? new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''}&location=${encodeURIComponent(event.location_name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 border-2 border-black hover:bg-sand-50 transition-colors font-medium"
                  >
                    Google Calendar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <section className="py-12 border-t-2 border-black bg-sand-50">
            <div className="container-justice max-w-4xl">
              <h2 className="text-2xl font-bold mb-6">More Events</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedEvents.map((relatedEvent) => (
                  <Link
                    key={relatedEvent.id}
                    href={`/events/${relatedEvent.id}`}
                    className="border-2 border-black p-4 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border ${getEventTypeColor(relatedEvent.event_type)}`}>
                      {relatedEvent.event_type}
                    </span>
                    <h3 className="font-bold mt-3 mb-2">{relatedEvent.title}</h3>
                    <div className="text-sm text-earth-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(relatedEvent.start_date)}
                      </div>
                      {relatedEvent.location_name && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {relatedEvent.location_name}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

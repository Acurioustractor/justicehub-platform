'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import EventCalendar from '@/components/EventCalendar';
import { Calendar, MapPin, Clock, Users, Filter, ChevronDown, Grid, List } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location_name?: string;
  location_state?: string;
  registration_url?: string;
  max_attendees?: number;
  is_featured?: boolean;
  node?: {
    id: string;
    name: string;
    state_code: string;
  };
}

interface EventsContentProps {
  initialEvents: Event[];
}

const eventTypes = [
  { value: 'launch', label: 'Launch Events' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'conference', label: 'Conferences' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'exhibition', label: 'Exhibitions' },
  { value: 'meetup', label: 'Meetups' },
];

const states = [
  { code: 'QLD', name: 'Queensland' },
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'SA', name: 'South Australia' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'ACT', name: 'Australian Capital Territory' },
];

export function EventsContent({ initialEvents }: EventsContentProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [showPast, setShowPast] = useState(false);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return initialEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      const matchesTime = showPast || eventDate >= now;
      const matchesType = !selectedType || event.event_type === selectedType;
      const matchesState = !selectedState || event.location_state === selectedState;
      return matchesTime && matchesType && matchesState;
    });
  }, [initialEvents, selectedType, selectedState, showPast]);

  const featuredEvents = filteredEvents.filter(e => e.is_featured);
  const upcomingEvents = filteredEvents.filter(e => !e.is_featured);

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
      meetup: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-ochre-100 border-2 border-black">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-5xl font-black">Events</h1>
                <p className="text-earth-600">Workshops, conferences, and gatherings across the network</p>
              </div>
            </div>

            <p className="text-lg text-earth-700 max-w-2xl">
              Connect with the JusticeHub community at events across Australia.
              From local workshops to national conferences, find opportunities to learn,
              collaborate, and drive change.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 border-b-2 border-black bg-white sticky top-32 z-10">
          <div className="container-justice">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-earth-600" />
                  <span className="text-sm font-medium text-earth-600">Filters:</span>
                </div>

                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
                  >
                    <option value="">All Types</option>
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="appearance-none border-2 border-black px-4 py-2 pr-10 bg-white font-medium text-sm cursor-pointer hover:bg-sand-50"
                  >
                    <option value="">All States</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPast}
                    onChange={(e) => setShowPast(e.target.checked)}
                    className="w-4 h-4 border-2 border-black"
                  />
                  <span className="text-sm font-medium">Show past events</span>
                </label>

                {(selectedType || selectedState) && (
                  <button
                    onClick={() => {
                      setSelectedType('');
                      setSelectedState('');
                    }}
                    className="text-sm text-ochre-600 hover:text-ochre-800 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 border-2 border-black">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-sand-50'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 ${viewMode === 'calendar' ? 'bg-black text-white' : 'hover:bg-sand-50'}`}
                  title="Calendar view"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container-justice">
            {viewMode === 'calendar' ? (
              <EventCalendar
                events={filteredEvents}
                onEventClick={(event) => {
                  window.location.href = `/events/${event.id}`;
                }}
              />
            ) : (
              <div className="space-y-8">
                {/* Featured Events */}
                {featuredEvents.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Featured Events</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {featuredEvents.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="border-2 border-black p-6 bg-gradient-to-br from-ochre-50 to-sand-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border ${getEventTypeColor(event.event_type)}`}>
                              {event.event_type}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-ochre-500 text-white">
                              Featured
                            </span>
                          </div>

                          <h3 className="text-xl font-bold mb-2">{event.title}</h3>

                          {event.description && (
                            <p className="text-earth-700 line-clamp-2 mb-4">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-earth-600">
                              <Calendar className="w-4 h-4" />
                              {formatDate(event.start_date)}
                            </div>
                            <div className="flex items-center gap-2 text-earth-600">
                              <Clock className="w-4 h-4" />
                              {formatTime(event.start_date)}
                              {event.end_date && ` - ${formatTime(event.end_date)}`}
                            </div>
                            {event.location_name && (
                              <div className="flex items-center gap-2 text-earth-600">
                                <MapPin className="w-4 h-4" />
                                {event.location_name}
                                {event.location_state && `, ${event.location_state}`}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Events */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    {showPast ? 'All Events' : 'Upcoming Events'}
                    <span className="text-earth-600 font-normal text-lg ml-2">
                      ({upcomingEvents.length})
                    </span>
                  </h2>

                  {upcomingEvents.length === 0 && featuredEvents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-earth-400" />
                      <p className="text-earth-600 mb-4">No events found matching your filters.</p>
                      <button
                        onClick={() => {
                          setSelectedType('');
                          setSelectedState('');
                          setShowPast(true);
                        }}
                        className="text-ochre-600 font-medium hover:text-ochre-800"
                      >
                        Clear filters and show all events
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="flex gap-6 border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                        >
                          {/* Date Box */}
                          <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 border-2 border-black bg-ochre-50 flex-shrink-0">
                            <div className="text-3xl font-black">
                              {new Date(event.start_date).getDate()}
                            </div>
                            <div className="text-xs font-bold uppercase">
                              {new Date(event.start_date).toLocaleDateString('en-AU', { month: 'short' })}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 border ${getEventTypeColor(event.event_type)}`}>
                                {event.event_type}
                              </span>
                              {event.node && (
                                <span className="text-xs font-medium text-earth-600">
                                  {event.node.name}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold mb-2">{event.title}</h3>

                            <div className="flex flex-wrap gap-4 text-sm text-earth-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(event.start_date)}
                              </div>
                              {event.location_name && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {event.location_name}
                                  {event.location_state && `, ${event.location_state}`}
                                </div>
                              )}
                              {event.max_attendees && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {event.max_attendees} spots
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="hidden md:flex items-center">
                            <span className="text-ochre-600 font-bold">View Details &rarr;</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-black text-white border-t-2 border-black">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-4">Host an Event</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Want to host a JusticeHub event in your community? We support local workshops,
              training sessions, and community gatherings across Australia.
            </p>
            <Link
              href="/contact"
              className="inline-block px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

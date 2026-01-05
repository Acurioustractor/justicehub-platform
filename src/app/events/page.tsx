import { createServiceClient } from '@/lib/supabase/service';
import { EventsContent } from './page-content';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Events - JusticeHub',
  description: 'Workshops, conferences, and gatherings across the JusticeHub network. Connect with the community at events across Australia.',
};

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

async function getEventsData() {
  const supabase = createServiceClient();

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, title, description, event_type, start_date, end_date,
        location_name, location_state, registration_url, max_attendees, is_featured,
        node:justicehub_nodes(id, name, state_code)
      `)
      .eq('is_public', true)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return { events: [] };
    }

    return { events: (events || []) as Event[] };
  } catch (error) {
    console.error('Error fetching events data:', error);
    return { events: [] };
  }
}

export default async function EventsPage() {
  const { events } = await getEventsData();

  return <EventsContent initialEvents={events} />;
}

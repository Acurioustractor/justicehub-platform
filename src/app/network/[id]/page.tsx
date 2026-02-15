import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  ExternalLink,
  Mail,
  Building2,
  FileText,
  ChevronLeft
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface JusticeHubNode {
  id: string;
  name: string;
  node_type: 'state' | 'territory' | 'international';
  state_code: string | null;
  country: string;
  description: string | null;
  status: 'active' | 'forming' | 'planned';
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  website_url: string | null;
  logo_url: string | null;
  lead_organization_id: string | null;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location_name: string | null;
  event_type: string | null;
  is_public: boolean;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string | null;
  state: string | null;
}

async function getNode(id: string): Promise<JusticeHubNode | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('justicehub_nodes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching node:', error);
    return null;
  }

  return data;
}

async function getNodeEvents(nodeId: string): Promise<Event[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('id, title, start_date, end_date, location_name, event_type, is_public')
    .eq('node_id', nodeId)
    .eq('is_public', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date')
    .limit(5);

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

async function getInterventionCount(stateCode: string | null): Promise<number> {
  if (!stateCode) return 0;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('alma_interventions')
    .select('metadata')
    .limit(2000);

  if (error) {
    console.error('Error fetching interventions:', error);
    return 0;
  }

  return data?.filter((row: { metadata?: { state?: string } }) =>
    row.metadata?.state === stateCode
  ).length || 0;
}

async function getLeadOrganization(orgId: string | null): Promise<Organization | null> {
  if (!orgId) return null;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, type, city, state')
    .eq('id', orgId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const node = await getNode(params.id);

  if (!node) {
    return {
      title: 'Node Not Found | JusticeHub Network',
    };
  }

  return {
    title: `${node.name} | JusticeHub Network`,
    description: node.description || `Learn about the ${node.name} node in the JusticeHub Network`,
  };
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-eucalyptus-500';
    case 'forming':
      return 'bg-amber-500';
    default:
      return 'bg-gray-400';
  }
}

function getStatusBgColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-eucalyptus-50 text-eucalyptus-800 border-eucalyptus-200';
    case 'forming':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
}

export default async function NodeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const node = await getNode(params.id);

  if (!node) {
    notFound();
  }

  const [events, interventionCount, leadOrganization] = await Promise.all([
    getNodeEvents(node.id),
    getInterventionCount(node.state_code),
    getLeadOrganization(node.lead_organization_id),
  ]);

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Breadcrumb */}
        <div className="bg-sand-50 border-b border-sand-200">
          <div className="container-justice py-4">
            <nav className="flex items-center gap-2 text-sm text-earth-600">
              <Link href="/" className="hover:text-ochre-600">
                Home
              </Link>
              <span>/</span>
              <Link href="/network" className="hover:text-ochre-600">
                Network
              </Link>
              <span>/</span>
              <span className="text-earth-900">{node.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-12 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/network"
              className="inline-flex items-center gap-2 text-earth-600 hover:text-ochre-600 mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Network Map
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4 border ${getStatusBgColor(node.status)}`}>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
                  {node.status}
                </div>

                <h1 className="text-4xl md:text-5xl font-black mb-4">
                  {node.name}
                </h1>

                {/* Location Info */}
                <div className="flex flex-wrap gap-4 mb-6 text-earth-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>
                      {node.node_type === 'international'
                        ? node.country
                        : `${node.state_code || node.name}, Australia`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <span className="capitalize">{node.node_type} Node</span>
                  </div>
                </div>

                {node.description && (
                  <p className="text-lg text-earth-700 mb-6 max-w-2xl">
                    {node.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {node.contact_email && (
                    <a
                      href={`mailto:${node.contact_email}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      Contact Node
                    </a>
                  )}
                  {node.website_url && (
                    <a
                      href={node.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black font-bold hover:bg-ochre-50 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="lg:w-80 space-y-4">
                <div className="border-2 border-black bg-white p-6">
                  <div className="text-4xl font-black text-ochre-600 mb-1">
                    {interventionCount}
                  </div>
                  <div className="text-earth-600 font-medium">Interventions Tracked</div>
                  {node.state_code && (
                    <Link
                      href={`/youth-justice-report/interventions?state=${node.state_code}`}
                      className="inline-flex items-center gap-1 text-sm text-ochre-600 hover:text-ochre-800 mt-2"
                    >
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                <div className="border-2 border-black bg-white p-6">
                  <div className="text-4xl font-black text-eucalyptus-600 mb-1">
                    {events.length}
                  </div>
                  <div className="text-earth-600 font-medium">Upcoming Events</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Organization */}
        {leadOrganization && (
          <section className="py-8 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <div className="flex items-center gap-4">
                <div className="text-earth-600 font-medium">Lead Organization:</div>
                <Link
                  href={`/organizations/${leadOrganization.slug || leadOrganization.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black hover:bg-ochre-50 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-bold">{leadOrganization.name}</span>
                  {leadOrganization.city && leadOrganization.state && (
                    <span className="text-earth-600 text-sm">
                      ({leadOrganization.city}, {leadOrganization.state})
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <Link
                href="/events"
                className="text-ochre-600 font-bold hover:text-ochre-800 flex items-center gap-2"
              >
                View All Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="bg-sand-50 border-2 border-black p-8 text-center">
                <Calendar className="w-12 h-12 text-earth-400 mx-auto mb-4" />
                <p className="text-earth-600 mb-4">No upcoming events for this node.</p>
                <Link
                  href="/events"
                  className="text-ochre-600 font-bold hover:text-ochre-800"
                >
                  Browse all events
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {event.event_type && (
                      <span className="inline-block px-3 py-1 bg-ochre-100 text-ochre-800 text-xs font-bold uppercase tracking-wider mb-3">
                        {event.event_type}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-sm text-ochre-600 font-medium mb-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                    {event.location_name && (
                      <div className="flex items-center gap-2 text-sm text-earth-600">
                        <MapPin className="w-4 h-4" />
                        {event.location_name}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Research & Interventions */}
        {node.state_code && (
          <section className="py-12 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <h2 className="text-3xl font-bold mb-8">Research & Interventions</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Link
                  href={`/youth-justice-report/interventions?state=${node.state_code}`}
                  className="border-2 border-black bg-white p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow group"
                >
                  <FileText className="w-8 h-8 text-ochre-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                    View {node.state_code} Interventions
                  </h3>
                  <p className="text-earth-600 mb-4">
                    Explore {interventionCount} youth justice interventions tracked in {node.name}.
                  </p>
                  <span className="inline-flex items-center gap-2 text-ochre-600 font-bold">
                    Explore Database <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>

                <Link
                  href={`/intelligence/evidence?state=${node.state_code}`}
                  className="border-2 border-black bg-white p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow group"
                >
                  <Users className="w-8 h-8 text-eucalyptus-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2 group-hover:text-eucalyptus-600 transition-colors">
                    Research Evidence
                  </h3>
                  <p className="text-earth-600 mb-4">
                    Access evidence base and research findings relevant to {node.name}.
                  </p>
                  <span className="inline-flex items-center gap-2 text-eucalyptus-600 font-bold">
                    View Research <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Join Network CTA */}
        <section className="py-12 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-4">Get Involved</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Interested in connecting with the {node.name} node or contributing to youth justice reform in this region?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {node.contact_email && (
                <a
                  href={`mailto:${node.contact_email}?subject=Inquiry about ${node.name}`}
                  className="inline-block px-8 py-4 bg-white text-black font-bold hover:bg-gray-100 transition-colors"
                >
                  Contact This Node
                </a>
              )}
              <Link
                href="/contact"
                className="inline-block px-8 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-colors"
              >
                General Inquiry
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

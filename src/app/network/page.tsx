'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { MapPin, Calendar, Users, ArrowRight, ExternalLink, Mail, Filter, X } from 'lucide-react';
import AustraliaNodesMap from '@/components/AustraliaNodesMap';
import type { JusticeHubNode } from '@/components/AustraliaNodesMap';

type NodeStatus = 'all' | 'active' | 'forming' | 'planned';

interface Event {
  id: string;
  title: string;
  start_date: string;
  location_name: string;
  node_id: string;
}

export default function NetworkPage() {
  const supabase = createClient();
  const [nodes, setNodes] = useState<JusticeHubNode[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedNode, setSelectedNode] = useState<JusticeHubNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [interventionCounts, setInterventionCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<NodeStatus>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('justicehub_nodes')
        .select(`
          id, name, node_type, state_code, country, description, status,
          latitude, longitude, contact_email, website_url
        `)
        .order('name');

      if (!nodesError && nodesData) {
        // Get intervention counts per state
        const { data: interventions } = await supabase
          .from('alma_interventions')
          .select('metadata')
          .limit(2000);

        const counts: Record<string, number> = {};
        interventions?.forEach((row: any) => {
          const state = row.metadata?.state;
          if (state) {
            counts[state] = (counts[state] || 0) + 1;
          }
        });
        setInterventionCounts(counts);

        // Get upcoming events count per node
        const { data: upcomingEvents } = await supabase
          .from('events')
          .select('node_id')
          .gte('start_date', new Date().toISOString())
          .eq('is_public', true);

        const eventCounts: Record<string, number> = {};
        upcomingEvents?.forEach((event: any) => {
          if (event.node_id) {
            eventCounts[event.node_id] = (eventCounts[event.node_id] || 0) + 1;
          }
        });

        // Enrich nodes with counts
        const enrichedNodes = nodesData.map((node: any) => ({
          ...node,
          intervention_count: node.state_code ? counts[node.state_code] || 0 : 0,
          upcoming_events: eventCounts[node.id] || 0,
        }));

        setNodes(enrichedNodes);
      }

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, start_date, location_name, node_id')
        .gte('start_date', new Date().toISOString())
        .eq('is_public', true)
        .order('start_date')
        .limit(5);

      if (eventsData) {
        setEvents(eventsData);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const handleNodeSelect = (node: JusticeHubNode) => {
    setSelectedNode(node);
  };

  const activeNodes = nodes.filter(n => n.status === 'active');
  const formingNodes = nodes.filter(n => n.status === 'forming');
  const plannedNodes = nodes.filter(n => n.status === 'planned');

  // Filter nodes based on status filter
  const filteredNodes = useMemo(() => {
    if (statusFilter === 'all') return nodes;
    return nodes.filter(n => n.status === statusFilter);
  }, [nodes, statusFilter]);

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-12 border-b-2 border-black">
          <div className="container-justice">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              JusticeHub Network
            </h1>
            <p className="text-xl text-earth-700 max-w-2xl mb-6">
              A growing network of state-based nodes coordinating youth justice reform across Australia and internationally.
            </p>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-sand-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                All ({nodes.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-eucalyptus-600 text-white border-eucalyptus-600'
                    : 'bg-white hover:bg-eucalyptus-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-eucalyptus-500"></div>
                Active ({activeNodes.length})
              </button>
              <button
                onClick={() => setStatusFilter('forming')}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-medium transition-colors ${
                  statusFilter === 'forming'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white hover:bg-amber-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                Forming ({formingNodes.length})
              </button>
              <button
                onClick={() => setStatusFilter('planned')}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-medium transition-colors ${
                  statusFilter === 'planned'
                    ? 'bg-gray-600 text-white border-gray-600'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                Planned ({plannedNodes.length})
              </button>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="flex items-center gap-1 px-3 py-2 text-earth-600 hover:text-ochre-600 font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear filter
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Map and Sidebar */}
        <section className="border-b-2 border-black">
          <div className="flex flex-col lg:flex-row">
            {/* Map */}
            <div className="flex-1 min-h-[600px]">
              {loading ? (
                <div className="h-[600px] bg-sand-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ochre-600 mx-auto mb-4"></div>
                    <p className="text-earth-600">Loading network...</p>
                  </div>
                </div>
              ) : (
                <AustraliaNodesMap
                  nodes={filteredNodes}
                  height="600px"
                  onNodeSelect={handleNodeSelect}
                  selectedNodeId={selectedNode?.id}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-96 border-t-2 lg:border-t-0 lg:border-l-2 border-black bg-white">
              {selectedNode ? (
                <div className="p-6">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-sm text-earth-600 hover:text-ochre-600 mb-4"
                  >
                    ← Back to list
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: selectedNode.status === 'active' ? '#059669' :
                          selectedNode.status === 'forming' ? '#d97706' : '#6b7280'
                      }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-earth-600">
                      {selectedNode.status}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mb-2">{selectedNode.name}</h2>
                  <p className="text-earth-600 mb-4">{selectedNode.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border-2 border-black p-3 text-center">
                      <div className="text-2xl font-bold text-ochre-600">
                        {selectedNode.intervention_count || 0}
                      </div>
                      <div className="text-xs text-earth-600">Interventions</div>
                    </div>
                    <div className="border-2 border-black p-3 text-center">
                      <div className="text-2xl font-bold text-eucalyptus-600">
                        {selectedNode.upcoming_events || 0}
                      </div>
                      <div className="text-xs text-earth-600">Upcoming Events</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* View Full Details Link */}
                    <Link
                      href={`/network/${selectedNode.id}`}
                      className="flex items-center justify-between p-3 bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-medium">View Full Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {selectedNode.state_code && (
                      <Link
                        href={`/youth-justice-report/interventions?state=${selectedNode.state_code}`}
                        className="flex items-center justify-between p-3 border-2 border-black hover:bg-ochre-50 transition-colors"
                      >
                        <span className="font-medium">View Interventions</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    {selectedNode.contact_email && (
                      <a
                        href={`mailto:${selectedNode.contact_email}`}
                        className="flex items-center gap-2 p-3 border-2 border-black hover:bg-ochre-50 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">Contact Node</span>
                      </a>
                    )}

                    {selectedNode.website_url && (
                      <a
                        href={selectedNode.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border-2 border-black hover:bg-ochre-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="font-medium">Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <h2 className="text-lg font-bold mb-4">
                    {statusFilter === 'all' ? 'All Nodes' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Nodes`}
                    <span className="text-earth-500 font-normal ml-2">({filteredNodes.length})</span>
                  </h2>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredNodes.length === 0 ? (
                      <p className="text-earth-600 text-sm py-4">No nodes match the current filter.</p>
                    ) : (
                      filteredNodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className="w-full text-left p-3 border-2 border-black hover:bg-ochre-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                background: node.status === 'active' ? '#059669' :
                                  node.status === 'forming' ? '#d97706' : '#6b7280'
                              }}
                            />
                            <span className="font-bold">{node.name}</span>
                          </div>
                          <div className="text-sm text-earth-600">
                            {node.intervention_count || 0} interventions
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Upcoming Events</h2>
                <Link
                  href="/events"
                  className="text-ochre-600 font-bold hover:text-ochre-800 flex items-center gap-2"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const eventNode = nodes.find(n => n.id === event.node_id);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    >
                      <div className="flex items-center gap-2 text-sm text-ochre-600 font-medium mb-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_date).toLocaleDateString('en-AU', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-earth-600">
                        <MapPin className="w-4 h-4" />
                        {event.location_name}
                        {eventNode && ` • ${eventNode.state_code || eventNode.country}`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Join the Network CTA */}
        <section className="py-12 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-4">Join the Network</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Interested in establishing a JusticeHub node in your state or territory?
              We&apos;re looking for partners to expand youth justice reform across Australia.
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

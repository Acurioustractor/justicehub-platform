'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Users, Heart } from 'lucide-react';
import SimpleNodesMap from '@/components/SimpleNodesMap';
import type { JusticeHubNode } from '@/components/SimpleNodesMap';

export default function HomepageNetworkMap() {
  const [nodes, setNodes] = useState<JusticeHubNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<JusticeHubNode | null>(null);

  useEffect(() => {
    async function loadNodes() {
      try {
        const response = await fetch('/api/network-nodes');
        if (response.ok) {
          const data = await response.json();
          setNodes(data.nodes || []);
        }
      } catch (error) {
        console.error('Error loading nodes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadNodes();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 border-t-2 border-b-2 border-black">
        <div className="container-justice">
          <div className="text-center text-gray-600">
            <div className="animate-pulse">Loading network...</div>
          </div>
        </div>
      </section>
    );
  }

  const activeNodes = nodes.filter(n => n.status === 'active');
  const seekingNodes = nodes.filter(n => n.status === 'planned' || n.status === 'forming');

  return (
    <section className="section-padding bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 border-t-2 border-b-2 border-black">
      <div className="container-justice">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-ochre-100 border-2 border-ochre-700 mb-4">
            <Users className="h-5 w-5 text-ochre-700" />
            <span className="font-bold text-ochre-800 uppercase tracking-wider text-sm">
              Community Partners
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            State-Based Network
          </h2>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Community organizations leading place-based youth justice reform, connected to the National Centre of Excellence.
          </p>
        </div>

        {/* Map and Info Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Map - takes 2 columns */}
          <div className="lg:col-span-2 overflow-hidden">
            <SimpleNodesMap
              nodes={nodes}
              height="400px"
              onNodeSelect={setSelectedNode}
              selectedNodeId={selectedNode?.id}
            />
          </div>

          {/* Selected Node Info or Community Partners List */}
          <div className="border-2 border-black bg-white p-6 flex flex-col">
            {selectedNode ? (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                    selectedNode.status === 'active' ? 'bg-green-500' :
                    selectedNode.status === 'forming' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h3 className="text-xl font-bold">{selectedNode.name}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedNode.status === 'active' ? 'Active Partner' :
                       selectedNode.status === 'forming' ? 'Partnership Forming' : 'Seeking Partner'}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 flex-1">
                  {selectedNode.description || 'Supporting youth justice reform in this region.'}
                </p>

                {selectedNode.lead_organization && (
                  <div className="bg-green-50 border border-green-200 p-3 mb-4 rounded">
                    <p className="text-sm font-bold text-green-800">
                      <Heart className="w-4 h-4 inline mr-1" />
                      Led by {selectedNode.lead_organization.name}
                    </p>
                  </div>
                )}

                <Link
                  href={`/network/${selectedNode.id}`}
                  className="inline-flex items-center gap-2 text-ochre-700 font-bold hover:text-ochre-900 no-underline"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-2">How It Works</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Community organizations anchor state-based work, providing advisory support, bringing people together, and running programs for young people.
                </p>

                {/* Active Partners */}
                {activeNodes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Active Partners ({activeNodes.length})
                    </h4>
                    <div className="space-y-2">
                      {activeNodes.map(node => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className="w-full text-left p-2 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors rounded text-sm"
                        >
                          <span className="font-bold">{node.state_code || node.country}</span>
                          {node.lead_organization && (
                            <span className="text-green-700"> — {node.lead_organization.name}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seeking Partners */}
                {seekingNodes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      Seeking Partners ({seekingNodes.length})
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {seekingNodes.map(n => n.state_code || n.country).join(', ')}
                    </p>
                  </div>
                )}

                <div className="mt-auto space-y-3">
                  <Link
                    href="/network"
                    className="inline-flex items-center gap-2 w-full justify-center px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all no-underline"
                  >
                    Explore the Network
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact?topic=partnership"
                    className="inline-flex items-center gap-2 w-full justify-center px-6 py-3 border-2 border-black text-black font-bold hover:bg-ochre-50 transition-all no-underline text-sm"
                  >
                    Become a Partner
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

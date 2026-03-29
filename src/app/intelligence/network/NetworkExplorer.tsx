'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search, ArrowLeft, Network, ChevronRight, Building2,
  Zap, MapPin, X, Loader2,
} from 'lucide-react';
import NetworkGraph, { type NetworkNode, type NetworkEdge } from '@/components/intelligence/NetworkGraph';
import NetworkDetailsPanel from '@/components/intelligence/NetworkDetailsPanel';

/* ── Types ──────────────────────────────────────────────────── */

interface FeaturedEntity {
  id: string;
  name: string;
  entity_type: string | null;
  state: string | null;
  power_score: number | null;
  alma_intervention_count: number | null;
}

interface SearchResult extends FeaturedEntity {}

interface NetworkData {
  center_entity_id: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface BreadcrumbEntry {
  id: string;
  label: string;
}

/* ── Component ──────────────────────────────────────────────── */

export default function NetworkExplorer() {
  // State
  const [view, setView] = useState<'landing' | 'graph'>('landing');
  const [featured, setFeatured] = useState<FeaturedEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load featured entities on mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/intelligence/network?featured=true');
        const data = await res.json();
        if (data.entities) setFeatured(data.entities);
      } catch {
        // Silently fail for featured
      }
    }
    loadFeatured();
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/intelligence/network?search=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data.results) setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Navigate to entity
  const navigateToEntity = useCallback(
    async (entityId: string, label?: string) => {
      setIsLoading(true);
      setError(null);
      setSelectedNode(null);

      try {
        const res = await fetch(
          `/api/intelligence/network?entity_id=${entityId}`
        );
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.type === 'network') {
          setNetworkData(data);
          setView('graph');
          setSearchQuery('');
          setSearchResults([]);

          // Update breadcrumbs
          const centerNode = data.nodes.find((n: NetworkNode) => n.is_center);
          const entryLabel = label || centerNode?.label || 'Entity';

          setBreadcrumbs((prev) => {
            // If navigating back via breadcrumb, trim
            const existingIdx = prev.findIndex((b) => b.id === entityId);
            if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
            return [...prev, { id: entityId, label: entryLabel }];
          });
        }
      } catch (err: any) {
        setError('Failed to load network data');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle node click in graph
  const handleNodeClick = useCallback(
    (node: NetworkNode) => {
      setSelectedNode(node);
    },
    []
  );

  // Handle explore from detail panel
  const handleNavigateFromPanel = useCallback(
    (entityId: string) => {
      const node = networkData?.nodes.find((n) => n.id === entityId);
      navigateToEntity(entityId, node?.label);
    },
    [networkData, navigateToEntity]
  );

  // Back to landing
  const handleBackToLanding = useCallback(() => {
    setView('landing');
    setNetworkData(null);
    setSelectedNode(null);
    setHoveredNode(null);
    setBreadcrumbs([]);
  }, []);

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <header className="border-b border-[#0A0A0A]/10 bg-[#F5F0E8]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <Link
            href="/intelligence"
            className="flex items-center gap-2 text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors font-mono text-xs"
          >
            <ArrowLeft size={14} />
            Intelligence
          </Link>
          <div className="h-4 w-px bg-[#0A0A0A]/10" />
          <div className="flex items-center gap-2">
            <Network size={16} className="text-[#0A0A0A]" />
            <h1
              className="text-sm font-bold text-[#0A0A0A]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Entity Network
            </h1>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 ml-4 overflow-x-auto">
              {breadcrumbs.map((bc, i) => (
                <div key={bc.id} className="flex items-center gap-1 shrink-0">
                  {i > 0 && (
                    <ChevronRight size={12} className="text-[#0A0A0A]/30" />
                  )}
                  <button
                    onClick={() => navigateToEntity(bc.id, bc.label)}
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                      i === breadcrumbs.length - 1
                        ? 'text-[#0A0A0A] font-medium'
                        : 'text-[#0A0A0A]/50 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5'
                    }`}
                  >
                    {bc.label.length > 20
                      ? bc.label.slice(0, 19) + '\u2026'
                      : bc.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Graph-mode search */}
          {view === 'graph' && (
            <div className="ml-auto relative">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]/30"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entities..."
                  className="w-48 lg:w-64 pl-8 pr-3 py-1.5 bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 rounded-lg font-mono text-xs text-[#0A0A0A] placeholder:text-[#0A0A0A]/30 focus:outline-none focus:border-[#0A0A0A]/30"
                />
              </div>
              {/* Search dropdown */}
              {(searchResults.length > 0 || isSearching) && searchQuery.trim() && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-[#F5F0E8] border border-[#0A0A0A]/10 rounded-lg shadow-xl z-50 overflow-hidden">
                  {isSearching ? (
                    <div className="p-3 flex items-center gap-2 text-[#0A0A0A]/50 font-mono text-xs">
                      <Loader2 size={14} className="animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => navigateToEntity(r.id, r.name)}
                        className="w-full px-3 py-2 text-left hover:bg-[#0A0A0A]/5 transition-colors flex items-center gap-3 border-b border-[#0A0A0A]/5 last:border-0"
                      >
                        <Building2 size={14} className="text-[#0A0A0A]/30 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-[#0A0A0A] truncate">
                            {r.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {r.state && (
                              <span className="font-mono text-[10px] text-[#0A0A0A]/40">
                                {r.state}
                              </span>
                            )}
                            {r.power_score && (
                              <span className="font-mono text-[10px] text-[#0A0A0A]/40">
                                Score: {r.power_score.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      {view === 'landing' ? (
        <LandingView
          featured={featured}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onSearchChange={setSearchQuery}
          onSelectEntity={navigateToEntity}
        />
      ) : (
        <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
          {/* Graph */}
          <div className="flex-1 relative">
            {isLoading && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{ backgroundColor: '#E8E3DB' }}
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin text-[#0A0A0A]" />
                  <p className="font-mono text-sm text-[#0A0A0A]/60">
                    Loading network...
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backgroundColor: '#E8E3DB' }}>
                <div className="text-center">
                  <p className="font-mono text-sm text-[#DC2626] mb-2">{error}</p>
                  <button
                    onClick={handleBackToLanding}
                    className="font-mono text-xs text-[#0A0A0A]/50 underline hover:text-[#0A0A0A]"
                  >
                    Back to search
                  </button>
                </div>
              </div>
            )}
            {networkData && !isLoading && !error && (
              <NetworkGraph
                nodes={networkData.nodes}
                edges={networkData.edges}
                centerId={networkData.center_entity_id}
                onNodeClick={handleNodeClick}
                onNodeHover={setHoveredNode}
                selectedNodeId={selectedNode?.id ?? null}
              />
            )}

            {/* Hover tooltip */}
            {hoveredNode && !selectedNode && (
              <div className="absolute top-4 right-4 bg-[#F5F0E8]/95 backdrop-blur-sm border border-[#0A0A0A]/10 rounded-lg p-3 shadow-lg pointer-events-none z-20 max-w-xs">
                <p className="font-mono text-xs font-medium text-[#0A0A0A] truncate">
                  {hoveredNode.label}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {hoveredNode.entity_type && (
                    <span className="font-mono text-[10px] text-[#0A0A0A]/50">
                      {hoveredNode.entity_type}
                    </span>
                  )}
                  {hoveredNode.power_score !== null && (
                    <span className="font-mono text-[10px] text-[#0A0A0A]/50">
                      Score: {hoveredNode.power_score.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats bar */}
            {networkData && (
              <div className="absolute top-4 left-4 bg-[#F5F0E8]/95 backdrop-blur-sm border border-[#0A0A0A]/10 rounded-lg px-3 py-2 shadow-md z-20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
                    <span className="font-mono text-[10px] text-[#0A0A0A]/60">
                      {networkData.nodes.length} entities
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#0A0A0A]/40 rounded" />
                    <span className="font-mono text-[10px] text-[#0A0A0A]/60">
                      {networkData.edges.length} connections
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selectedNode && (
            <NetworkDetailsPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onNavigate={handleNavigateFromPanel}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Landing View ───────────────────────────────────────────── */

function LandingView({
  featured,
  searchQuery,
  searchResults,
  isSearching,
  onSearchChange,
  onSelectEntity,
}: {
  featured: FeaturedEntity[];
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearchChange: (q: string) => void;
  onSelectEntity: (id: string, label?: string) => void;
}) {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0A0A0A] text-[#F5F0E8] rounded-full font-mono text-[10px] uppercase tracking-wider mb-6">
          <Network size={12} />
          Intelligence Tool
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0A0A] tracking-tight mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Entity Network Explorer
        </h1>
        <p className="text-base sm:text-lg text-[#0A0A0A]/60 max-w-2xl mx-auto leading-relaxed">
          Follow the connections. See how organisations, board members, funding flows,
          and political donations link together across Australian youth justice.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-16">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A0A0A]/30"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for an organisation, company, or government entity..."
            className="w-full pl-12 pr-4 py-4 bg-[#0A0A0A]/[0.03] border border-[#0A0A0A]/10 rounded-xl font-mono text-sm text-[#0A0A0A] placeholder:text-[#0A0A0A]/30 focus:outline-none focus:border-[#0A0A0A]/30 focus:ring-2 focus:ring-[#0A0A0A]/5 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#0A0A0A]/10"
            >
              <X size={14} className="text-[#0A0A0A]/40" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {(searchResults.length > 0 || isSearching) && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#F5F0E8] border border-[#0A0A0A]/10 rounded-xl shadow-xl z-50 overflow-hidden">
            {isSearching ? (
              <div className="p-4 flex items-center gap-3 text-[#0A0A0A]/50 font-mono text-sm">
                <Loader2 size={16} className="animate-spin" />
                Searching...
              </div>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectEntity(r.id, r.name)}
                  className="w-full px-4 py-3 text-left hover:bg-[#0A0A0A]/5 transition-colors flex items-center gap-4 border-b border-[#0A0A0A]/5 last:border-0"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0A0A0A]/5 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-[#0A0A0A]/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-[#0A0A0A] font-medium truncate">
                      {r.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {r.entity_type && (
                        <span className="font-mono text-[10px] text-[#0A0A0A]/40 uppercase">
                          {r.entity_type}
                        </span>
                      )}
                      {r.state && (
                        <span className="font-mono text-[10px] text-[#0A0A0A]/40 flex items-center gap-1">
                          <MapPin size={9} />
                          {r.state}
                        </span>
                      )}
                      {r.power_score !== null && (
                        <span className="font-mono text-[10px] text-[#0A0A0A]/40 flex items-center gap-1">
                          <Zap size={9} />
                          {r.power_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#0A0A0A]/20 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Featured Entities */}
      {featured.length > 0 && !searchQuery && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-[#0A0A0A]/10" />
            <span className="font-mono text-[10px] text-[#0A0A0A]/40 uppercase tracking-wider">
              Featured Entities — Power + Youth Justice Programs
            </span>
            <div className="h-px flex-1 bg-[#0A0A0A]/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featured.map((entity) => (
              <button
                key={entity.id}
                onClick={() => onSelectEntity(entity.id, entity.name)}
                className="group p-4 bg-[#0A0A0A]/[0.02] border border-[#0A0A0A]/[0.06] rounded-xl text-left hover:border-[#0A0A0A]/20 hover:bg-[#0A0A0A]/[0.04] transition-all"
              >
                <p
                  className="text-sm font-bold text-[#0A0A0A] mb-1 group-hover:text-[#059669] transition-colors line-clamp-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {entity.name}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {entity.state && (
                    <span className="font-mono text-[10px] text-[#0A0A0A]/40 flex items-center gap-1">
                      <MapPin size={9} />
                      {entity.state}
                    </span>
                  )}
                  {entity.power_score !== null && (
                    <span className="font-mono text-[10px] text-[#0A0A0A]/40 flex items-center gap-1">
                      <Zap size={9} />
                      {entity.power_score.toFixed(1)}
                    </span>
                  )}
                  {entity.alma_intervention_count !== null &&
                    entity.alma_intervention_count > 0 && (
                      <span className="font-mono text-[10px] text-[#059669] flex items-center gap-1">
                        {entity.alma_intervention_count} program
                        {entity.alma_intervention_count > 1 ? 's' : ''}
                      </span>
                    )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-16 text-center">
        <p className="font-mono text-[11px] text-[#0A0A0A]/30">
          Data sourced from 587K entities, 1.5M relationships, 181K power-scored records
        </p>
      </div>
    </main>
  );
}

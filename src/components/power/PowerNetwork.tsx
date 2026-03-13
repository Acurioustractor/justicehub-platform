'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useResizeObserver } from '@/hooks/useResizeObserver';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[500px] text-gray-400 font-mono text-sm">Loading Power Network...</div>,
});

interface NetworkNode {
  id: string;
  name: string;
  type: 'organization' | 'political_party';
  funding: number;
  sectors?: string[];
  is_indigenous?: boolean;
}

interface NetworkLink {
  source: string;
  target: string;
  type: 'political_donation';
  value: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function PowerNetwork({ state }: { state: string }) {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<any>());
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  const dims = useResizeObserver(containerRef);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (dims) setDimensions({ width: dims.width, height: 500 });
  }, [dims]);

  useEffect(() => {
    setLoading(true);
    setSelectedNode(null);
    fetch(`/api/power-page?view=network&state=${state}`)
      .then(r => r.json())
      .then(d => {
        if (d?.nodes && d?.links) {
          // Deduplicate nodes by id
          const seen = new Set<string>();
          const uniqueNodes = (d.nodes as NetworkNode[]).filter(n => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          });
          // Filter links to only reference existing nodes
          const nodeIds = new Set(uniqueNodes.map(n => n.id));
          const validLinks = (d.links as NetworkLink[]).filter(
            l => nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
          );
          setData({ nodes: uniqueNodes, links: validLinks });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [state]);

  const handleNodeClick = useCallback((node: any) => {
    if (!data) return;
    setSelectedNode(node);
    const connected = new Set<string>();
    const connLinks = new Set<any>();
    connected.add(node.id);
    data.links.forEach((link: any) => {
      const sid = typeof link.source === 'object' ? link.source.id : link.source;
      const tid = typeof link.target === 'object' ? link.target.id : link.target;
      if (sid === node.id || tid === node.id) {
        connected.add(sid);
        connected.add(tid);
        connLinks.add(link);
      }
    });
    setHighlightNodes(connected);
    setHighlightLinks(connLinks);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(4, 800);
    }
  }, [data]);

  const handleBgClick = useCallback(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setSelectedNode(null);
  }, []);

  const PARTY_COLORS: Record<string, string> = {
    Labor: '#dc2626',
    Liberal: '#2563eb',
    Nationals: '#ca8a04',
    Greens: '#059669',
    Other: '#6b7280',
  };

  const getNodeColor = (node: any) => {
    if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) return '#e5e7eb';
    if (node.type === 'political_party') return PARTY_COLORS[node.name] || '#6b7280';
    if (node.is_indigenous) return '#059669';
    return '#1e293b';
  };

  const getNodeSize = (node: any) => {
    if (node.type === 'political_party') return 10;
    const funding = node.funding || 0;
    if (funding > 100000000) return 12;
    if (funding > 10000000) return 8;
    if (funding > 1000000) return 5;
    return 3;
  };

  if (loading) return <div className="h-[500px] bg-gray-50 animate-pulse border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">LOADING POWER NETWORK...</div>;
  if (!data?.nodes?.length) return <div className="h-[500px] bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">NO NETWORK DATA</div>;

  return (
    <div ref={containerRef} className="w-full h-[500px] border border-gray-200 overflow-hidden bg-white relative">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeLabel={(node: any) => `${node.name} ${node.funding ? `(${formatDollars(node.funding)})` : ''}`}
        nodeColor={getNodeColor}
        nodeRelSize={1}
        nodeVal={getNodeSize}
        linkColor={(link: any) => {
          if (highlightNodes.size > 0 && !highlightLinks.has(link)) return 'rgba(0,0,0,0.03)';
          // Color link by the party it connects to
          const target = typeof link.target === 'object' ? link.target : data?.nodes.find(n => n.id === link.target);
          if (target?.type === 'political_party') {
            const c = PARTY_COLORS[target.name];
            if (c) return c + '66'; // ~40% opacity
          }
          return 'rgba(0,0,0,0.2)';
        }}
        linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 0.5}
        backgroundColor="#ffffff"
        cooldownTicks={100}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBgClick}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 border border-gray-200 p-3 text-xs space-y-1 pointer-events-none">
        <div className="font-bold uppercase mb-2 border-b border-gray-200 pb-1">Legend</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-800" /> Justice-funded org</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Indigenous-led org</div>
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100"><div className="w-2.5 h-2.5 rounded-full bg-red-600" /> Labor</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Liberal</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-600" /> Nationals</div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Other</div>
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-white border-2 border-black p-4 shadow-md max-w-xs z-10">
          <div className="font-black text-sm uppercase">{selectedNode.name}</div>
          <div className="text-xs text-gray-500 mt-1">{selectedNode.type === 'political_party' ? 'Political Party' : 'Organisation'}</div>
          {selectedNode.funding > 0 && <div className="text-lg font-bold mt-2">{formatDollars(selectedNode.funding)}</div>}
          {selectedNode.sectors && selectedNode.sectors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedNode.sectors.map(s => (
                <span key={s} className="bg-gray-100 border border-gray-300 text-[10px] px-1.5 py-0.5 font-mono">{s}</span>
              ))}
            </div>
          )}
          {selectedNode.is_indigenous && (
            <span className="inline-block mt-2 bg-emerald-100 text-emerald-800 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase">Indigenous-led</span>
          )}
        </div>
      )}
    </div>
  );
}

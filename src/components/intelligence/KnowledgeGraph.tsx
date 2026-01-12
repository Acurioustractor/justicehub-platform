"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useResizeObserver } from '@/hooks/useResizeObserver';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96">Loading Knowledge Graph...</div>
});

type Node = {
    id: string;
    name?: string;
    title?: string;
    group: 'intervention' | 'evidence' | 'outcome' | 'context';
    val: number;
    [key: string]: any;
};

type Link = {
    source: string | Node;
    target: string | Node;
    type: string;
};

type GraphData = {
    nodes: Node[];
    links: Link[];
};

export default function KnowledgeGraph({
    onNodeSelect,
    searchTerm = ''
}: {
    onNodeSelect?: (node: Node | null) => void,
    searchTerm?: string
}) {
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);

    // Highlighting State
    const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
    const [highlightLinks, setHighlightLinks] = useState(new Set<any>());

    // Use the hook for dimensions
    const dims = useResizeObserver(containerRef);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (dims) {
            setDimensions(dims);
        }
    }, [dims]);

    useEffect(() => {
        // Fetch data
        const fetchData = async () => {
            try {
                const res = await fetch('/api/intelligence/knowledge-graph');
                if (!res.ok) throw new Error('Failed to fetch graph data');
                const graphData = await res.json();

                // Validate data structure
                if (!graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.links)) {
                    console.error("Invalid graph data structure:", graphData);
                    setData({ nodes: [], links: [] });
                } else {
                    setData(graphData);
                }
            } catch (err) {
                console.error(err);
                setData({ nodes: [], links: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Search Effect
    useEffect(() => {
        if (!data || !searchTerm) {
            // Only clear if we aren't hovering/clicking (which also uses highlightNodes)
            // But for simplicity, search overrides click for now, or we merge them.
            // Let's make search just select matching nodes.
            if (searchTerm === '') {
                setHighlightNodes(new Set());
            }
            return;
        }

        const matches = data.nodes.filter(n =>
            (n.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (n.title?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const matchIds = new Set(matches.map(n => n.id));
        setHighlightNodes(matchIds);

        // Optional: Zoom to first match
        if (matches.length > 0 && fgRef.current) {
            fgRef.current.centerAt(matches[0].x, matches[0].y, 1000);
            fgRef.current.zoom(4, 1000);
        }

    }, [searchTerm, data]);

    const handleNodeClick = useCallback((node: any) => {
        if (!data || !node) return;

        // 1. Notify parent
        if (onNodeSelect) {
            onNodeSelect(node);
        }

        // 2. Calculate connected nodes/links
        const connectedNodes = new Set<string>();
        const connectedLinks = new Set<any>();

        connectedNodes.add(node.id);
        data.links.forEach((link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;

            if (sourceId === node.id || targetId === node.id) {
                connectedNodes.add(sourceId);
                connectedNodes.add(targetId);
                connectedLinks.add(link);
            }
        });

        setHighlightNodes(connectedNodes);
        setHighlightLinks(connectedLinks);

        // 3. Zoom/Center focus
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(6, 1000); // Zoom level 6
        }

    }, [data, onNodeSelect]);

    const handleBackgroundClick = useCallback(() => {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        if (onNodeSelect) onNodeSelect(null);
    }, [onNodeSelect]);

    const getNodeColor = (node: any) => {
        // If we have selected nodes, dim others
        if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) {
            return '#e5e7eb'; // gray-200 (faded out)
        }

        switch (node.group) {
            case 'intervention': return '#000000'; // Black (was Emerald)
            case 'evidence': return '#059669'; // Emerald-600 (was Blue)
            case 'outcome': return '#dc2626'; // Red-600 (was Amber)
            case 'context': return '#4b5563'; // Gray-600 (was Violet)
            default: return '#9ca3af';
        }
    };

    const getLinkColor = (link: any) => {
        if (highlightNodes.size > 0 && !highlightLinks.has(link)) {
            return 'rgba(0,0,0,0.05)'; // Faint black
        }
        return 'rgba(0,0,0,0.2)'; // Solid black line
    };

    if (loading) return <div className="h-96 flex items-center justify-center text-gray-400 font-mono">LOADING TOPOLOGY...</div>;
    if (!data || data.nodes.length === 0) return <div className="h-96 flex items-center justify-center text-gray-400 font-mono">NO SIGNAL DETECTED</div>;

    return (
        <div ref={containerRef} className="w-full h-[600px] border border-black overflow-hidden bg-white relative cursor-crosshair">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeLabel={(node: any) => node.name || node.title || node.id || '?'}
                nodeColor={getNodeColor}
                nodeRelSize={6}
                linkColor={getLinkColor}
                linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
                backgroundColor="#ffffff"
                cooldownTicks={100}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
            />
            <div className="absolute bottom-4 right-4 bg-white/90 border border-black p-3 text-xs text-black space-y-1 shadow-sm pointer-events-none select-none">
                <div className="font-bold uppercase mb-2 border-b border-black pb-1">Legend</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-black"></div> Intervention</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-600"></div> Evidence</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-600"></div> Outcome</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-600"></div> Context</div>
            </div>
        </div>
    );
}

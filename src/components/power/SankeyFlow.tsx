'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';

interface SankeyData {
  nodes: { id?: number; name: string; type: string }[];
  links: { source: number; target: number; value: number }[];
}

type SNode = SankeyNode<{ name: string; type: string }, {}>;
type SLink = SankeyLink<{ name: string; type: string }, {}>;

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const TYPE_COLORS: Record<string, string> = {
  source: '#1e293b',
  sector: '#059669',
  org_type: '#dc2626',
};

export default function SankeyFlow({ state }: { state: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<SLink | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/power-page?view=sankey&state=${state}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state]);

  useEffect(() => {
    if (!svgRef.current || !data?.nodes?.length || !data?.links?.length) return;

    const container = containerRef.current;
    const width = container?.clientWidth || 900;
    const height = 500;
    const margin = { top: 10, right: 160, bottom: 10, left: 10 };

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const sankeyGenerator = d3Sankey<{ id: number; name: string; type: string }, {}>()
      .nodeId((d) => d.id)
      .nodeWidth(20)
      .nodePadding(12)
      .nodeAlign((node: any) => {
        if (node.type === 'source') return 0;
        if (node.type === 'sector') return 1;
        return 2;
      })
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    const graph = sankeyGenerator({
      nodes: data.nodes.map((d, index) => ({ ...d, id: index })),
      links: data.links.map(d => ({ ...d })),
    });

    // Links
    svg.append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => TYPE_COLORS[d.source.type] || '#94a3b8')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d: any) => Math.max(1, d.width || 1))
      .style('cursor', 'pointer')
      .on('mouseenter', function (event: MouseEvent, d: any) {
        d3.select(this).attr('stroke-opacity', 0.7);
        setHoveredLink(d);
        setMousePos({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', function (event: MouseEvent) {
        setMousePos({ x: event.pageX, y: event.pageY });
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-opacity', 0.3);
        setHoveredLink(null);
      });

    // Nodes
    svg.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => Math.max(1, (d.y1 || 0) - (d.y0 || 0)))
      .attr('width', (d: any) => (d.x1 || 0) - (d.x0 || 0))
      .attr('fill', (d: any) => TYPE_COLORS[d.type] || '#64748b')
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5);

    // Labels
    svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d: any) => (d.x0 || 0) < width / 2 ? (d.x1 || 0) + 6 : (d.x0 || 0) - 6)
      .attr('y', (d: any) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => (d.x0 || 0) < width / 2 ? 'start' : 'end')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text((d: any) => {
        const val = (d.value || 0);
        return `${d.name} (${formatDollars(val)})`;
      });

  }, [data]);

  if (loading) return <div className="h-[500px] bg-gray-50 animate-pulse border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">LOADING FUNDING FLOWS...</div>;
  if (!data?.nodes?.length) return <div className="h-[500px] bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">NO FLOW DATA</div>;

  return (
    <div ref={containerRef} className="w-full overflow-x-auto border border-gray-200">
      <svg ref={svgRef} className="w-full" style={{ height: 500, display: 'block' }} />
      {hoveredLink && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: mousePos.x + 12, top: mousePos.y + 12 }}
        >
          <div className="bg-white border-2 border-black p-3 shadow-md text-xs max-w-xs">
            <div className="font-bold">{(hoveredLink as any).source?.name} → {(hoveredLink as any).target?.name}</div>
            <div className="text-gray-600 mt-1">{formatDollars((hoveredLink as any).value || 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

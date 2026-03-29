'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

/* ── Types ───────────────────────────────────────────────────── */

interface FlowNode {
  id: string;
  label: string;
  color: string;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

interface FlowStats {
  totalFunding: number;
  totalRecords: number;
  linkedRecords: number;
  indigenousOrgShare: number;
  philanthropicIndigenousShare: number;
  govtIndigenousShare: number;
  uniqueOrgs: number;
}

interface FundingFlowsData {
  nodes: FlowNode[];
  links: FlowLink[];
  stats: FlowStats;
}

interface SankeyDiagramProps {
  initialData?: FundingFlowsData | null;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

/* ── Component ───────────────────────────────────────────────── */

export default function SankeyDiagram({ initialData }: SankeyDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<FundingFlowsData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [highlightNode, setHighlightNode] = useState<string | null>(null);

  const states = ['', 'QLD', 'NSW', 'VIC', 'SA', 'WA', 'NT', 'TAS', 'ACT'];
  const types = [
    { value: 'all', label: 'All Sources' },
    { value: 'govt', label: 'Government Only' },
    { value: 'philanthropic', label: 'Philanthropic Only' },
  ];

  /* ── Data fetching ────────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.set('state', stateFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const url = `/api/intelligence/funding-flows${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [stateFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── D3 Sankey rendering ──────────────────────────────────── */

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.max(600, Math.min(900, width * 0.6));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Build node index map
    const nodeIndexMap = new Map<string, number>();
    const sankeyNodes = data.nodes.map((n, i) => {
      nodeIndexMap.set(n.id, i);
      return { ...n, index: i };
    });

    // Build links with numeric indices
    const sankeyLinks = data.links
      .filter(l => nodeIndexMap.has(l.source) && nodeIndexMap.has(l.target))
      .map(l => ({
        source: nodeIndexMap.get(l.source)!,
        target: nodeIndexMap.get(l.target)!,
        value: l.value,
        color: l.color,
      }));

    if (sankeyLinks.length === 0) return;

    // Compute Sankey layout
    const sankeyLayout = sankey<any, any>()
      .nodeId((d: any) => d.index)
      .nodeWidth(20)
      .nodePadding(12)
      .nodeAlign((node: any) => {
        // Align by column: src=0, prog=1, org=2
        const id = sankeyNodes[node.index]?.id || '';
        if (id.startsWith('src_')) return 0;
        if (id.startsWith('prog_')) return 1;
        return 2;
      })
      .extent([
        [1, 1],
        [width - 1, height - 6],
      ]);

    const graph = sankeyLayout({
      nodes: sankeyNodes.map(n => ({ ...n })),
      links: sankeyLinks.map(l => ({ ...l })),
    });

    const totalFunding = data.stats.totalFunding;

    // Draw links
    const linkGroup = svg
      .append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => {
        if (highlightNode) {
          const srcId = sankeyNodes[typeof d.source === 'object' ? d.source.index : d.source]?.id;
          const tgtId = sankeyNodes[typeof d.target === 'object' ? d.target.index : d.target]?.id;
          if (srcId !== highlightNode && tgtId !== highlightNode) {
            return 'rgba(200, 200, 200, 0.1)';
          }
        }
        return d.color || 'rgba(10, 10, 10, 0.15)';
      })
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('stroke-opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function (event: MouseEvent, d: any) {
        const srcNode = sankeyNodes[typeof d.source === 'object' ? d.source.index : d.source];
        const tgtNode = sankeyNodes[typeof d.target === 'object' ? d.target.index : d.target];
        d3.select(this).attr('stroke-opacity', 1);
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          content: `${srcNode?.label} -> ${tgtNode?.label}\n${formatDollars(d.value)} (${pct(d.value, totalFunding)})`,
        });
      })
      .on('mousemove', function (event: MouseEvent) {
        setTooltip(prev =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-opacity', 0.7);
        setTooltip(null);
      });

    // Draw nodes
    const nodeGroup = svg
      .append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
      .attr('fill', (d: any) => {
        if (highlightNode && d.id !== highlightNode) {
          return '#d1d5db';
        }
        return d.color || '#0A0A0A';
      })
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('click', function (_event: MouseEvent, d: any) {
        setHighlightNode(prev => (prev === d.id ? null : d.id));
      })
      .on('mouseover', function (event: MouseEvent, d: any) {
        const nodeValue = d.value || 0;
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          content: `${d.label}\n${formatDollars(nodeValue)} (${pct(nodeValue, totalFunding)})`,
        });
      })
      .on('mousemove', function (event: MouseEvent) {
        setTooltip(prev =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : null
        );
      })
      .on('mouseout', function () {
        setTooltip(null);
      });

    // Node labels
    svg
      .append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d: any) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr('y', (d: any) => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => (d.x0 < width / 2 ? 'start' : 'end'))
      .attr('fill', '#0A0A0A')
      .attr('font-size', '11px')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-weight', '500')
      .text((d: any) => {
        const nodeValue = d.value || 0;
        return `${d.label} ${formatDollars(nodeValue)}`;
      })
      .attr('opacity', (d: any) => {
        if (highlightNode && d.id !== highlightNode) return 0.3;
        return 1;
      });

    // Column headers
    const columns = [
      { x: 10, label: 'FUNDING SOURCE' },
      { x: width / 2, label: 'PROGRAM CATEGORY' },
      { x: width - 10, label: 'ORGANISATION TYPE' },
    ];

    svg
      .append('g')
      .selectAll('text.header')
      .data(columns)
      .join('text')
      .attr('class', 'header')
      .attr('x', d => d.x)
      .attr('y', -8)
      .attr('text-anchor', (_d, i) => (i === 0 ? 'start' : i === 1 ? 'middle' : 'end'))
      .attr('fill', '#0A0A0A')
      .attr('font-size', '10px')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.05em')
      .attr('opacity', 0.5)
      .text(d => d.label);
  }, [data, highlightNode]);

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label
            className="block text-xs font-mono text-[#0A0A0A]/50 uppercase mb-1"
            htmlFor="state-filter"
          >
            State
          </label>
          <select
            id="state-filter"
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#0A0A0A]/10 bg-white text-sm font-mono text-[#0A0A0A]"
          >
            <option value="">All States</option>
            {states.filter(Boolean).map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-xs font-mono text-[#0A0A0A]/50 uppercase mb-1"
            htmlFor="type-filter"
          >
            Source Type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#0A0A0A]/10 bg-white text-sm font-mono text-[#0A0A0A]"
          >
            {types.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {highlightNode && (
          <button
            onClick={() => setHighlightNode(null)}
            className="self-end px-3 py-2 rounded-lg bg-[#0A0A0A] text-white text-xs font-mono uppercase"
          >
            Clear Highlight
          </button>
        )}
      </div>

      {/* Diagram */}
      <div ref={containerRef} className="relative w-full">
        {loading && (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-mono text-[#0A0A0A]/50">
                Aggregating {data?.stats.totalRecords?.toLocaleString() || '157K'} funding records...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center text-[#DC2626]">
              <p className="font-bold mb-2">Failed to load data</p>
              <p className="text-sm font-mono">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-[#0A0A0A] text-white rounded-lg text-sm font-mono"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <svg
            ref={svgRef}
            className="w-full overflow-visible"
            style={{ minHeight: 600 }}
          />
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-3 py-2 bg-[#0A0A0A] text-white text-xs font-mono rounded-lg shadow-xl pointer-events-none whitespace-pre-line"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 10,
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Legend */}
      {data && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-2 rounded-sm"
              style={{ backgroundColor: 'rgba(5, 150, 105, 0.6)' }}
            />
            <span className="text-[#0A0A0A]/60">Flows to Indigenous-led orgs</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-2 rounded-sm"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.4)' }}
            />
            <span className="text-[#0A0A0A]/60">Youth Justice / Detention spending</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-2 rounded-sm"
              style={{ backgroundColor: 'rgba(10, 10, 10, 0.2)' }}
            />
            <span className="text-[#0A0A0A]/60">Other flows</span>
          </div>
          <div className="text-[#0A0A0A]/40 ml-auto">
            Click a node to highlight its flows
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as d3 from 'd3';

// ── Types ──
interface OrgData {
  id: string;
  name: string;
  state: string;
  is_indigenous_org: boolean;
  total_funding: number;
  grant_count: number;
  website: string | null;
  abn?: string;
  intervention_count: number;
  proven_count: number;
  effective_count: number;
  promising_count: number;
  indigenous_led_count: number;
  untested_count: number;
}

interface OrgMapResponse {
  orgs: OrgData[];
  totalFunding: number;
  totalOrgs: number;
  withEvidence: number;
  indigenousOrgs: number;
}

// ── Helpers ──
function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function getEvidenceColor(org: OrgData): string {
  if (org.proven_count > 0 || org.effective_count > 0) return '#059669'; // emerald-600
  if (org.indigenous_led_count > 0) return '#9333ea'; // purple-600
  if (org.promising_count > 0) return '#d97706'; // amber-600
  if (org.intervention_count > 0 && org.untested_count > 0) return '#6b7280'; // gray-500
  if (org.total_funding > 50_000_000 && org.intervention_count === 0) return '#dc2626'; // red-600
  return '#374151'; // gray-700
}

function getEvidenceLabel(org: OrgData): string {
  if (org.proven_count > 0) return 'Proven';
  if (org.effective_count > 0) return 'Effective';
  if (org.indigenous_led_count > 0) return 'Indigenous-led';
  if (org.promising_count > 0) return 'Promising';
  if (org.intervention_count > 0) return 'Untested';
  return 'No programs';
}

function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    QLD: '#1e40af', NSW: '#0f766e', VIC: '#7c2d12',
    WA: '#7e22ce', SA: '#b91c1c', NT: '#c2410c',
    TAS: '#0e7490', ACT: '#4338ca', Unknown: '#374151',
  };
  return colors[state] || '#374151';
}

// ── Treemap Component ──
export default function FundingNetwork({ heightOverride }: { heightOverride?: number } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.05 });
  const [data, setData] = useState<OrgMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrgData | null>(null);
  const [hovered, setHovered] = useState<OrgData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const baseHeight = heightOverride || 600;
  const [dimensions, setDimensions] = useState({ width: 900, height: baseHeight });

  // Fetch data
  useEffect(() => {
    fetch('/api/authority/org-map')
      .then(r => r.json())
      .then(d => { if (d.orgs) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: heightOverride || Math.max(400, Math.min(700, width * 0.65)) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Build treemap layout
  const treemapData = useMemo(() => {
    if (!data?.orgs.length) return null;

    // Group by state
    const byState = new Map<string, OrgData[]>();
    for (const org of data.orgs) {
      const list = byState.get(org.state) || [];
      list.push(org);
      byState.set(org.state, list);
    }

    const hierarchy = {
      name: 'root',
      children: Array.from(byState.entries()).map(([state, orgs]) => ({
        name: state,
        children: orgs.map(org => ({
          name: org.name,
          value: Number(org.total_funding),
          org,
        })),
      })),
    };

    const root = d3.hierarchy(hierarchy)
      .sum(d => (d as { value?: number }).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<typeof hierarchy>()
      .size([dimensions.width, dimensions.height])
      .paddingOuter(3)
      .paddingInner(2)
      .paddingTop(20)
      .round(true)(root);

    return root;
  }, [data, dimensions]);

  const handleMouseMove = useCallback((e: React.MouseEvent, org: OrgData) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHovered(org);
  }, []);

  if (loading) {
    return (
      <div ref={containerRef} className="container-justice px-5 md:px-8">
        <div className="h-[400px] bg-[#F5F0E8]/5 animate-pulse flex items-center justify-center">
          <span className="text-[#F5F0E8]/20 font-mono text-sm">Loading organisation map...</span>
        </div>
      </div>
    );
  }

  if (!data || !treemapData) {
    return (
      <div ref={containerRef} className="container-justice px-5 md:px-8">
        <div className="h-[200px] border border-gray-800 flex items-center justify-center">
          <span className="text-[#F5F0E8]/30 font-mono text-sm">No organisation data available</span>
        </div>
      </div>
    );
  }

  const leaves = treemapData.leaves();
  const stateGroups = treemapData.children || [];

  return (
    <div ref={containerRef} className="container-justice px-5 md:px-8">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5">
        {[
          { label: 'Organisations', value: data.totalOrgs.toString() },
          { label: 'Total Tracked', value: formatDollars(data.totalFunding) },
          { label: 'With Evidence', value: data.withEvidence.toString(), color: 'text-emerald-500' },
          { label: 'Indigenous', value: data.indigenousOrgs.toString(), color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className={`text-lg md:text-xl font-bold ${s.color || 'text-[#F5F0E8]'}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {s.value}
            </span>
            <span className="font-mono text-[10px] text-[#F5F0E8]/30 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        {[
          { color: '#059669', label: 'Proven/Effective' },
          { color: '#d97706', label: 'Promising' },
          { color: '#9333ea', label: 'Indigenous-led' },
          { color: '#dc2626', label: 'Large, no programs' },
          { color: '#374151', label: 'Other' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 shrink-0" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-[#F5F0E8]/40">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Treemap SVG */}
      <div className="relative" style={{ height: dimensions.height }}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        >
          {/* State group labels */}
          {stateGroups.map(group => {
            const d = group as d3.HierarchyRectangularNode<typeof group.data>;
            if (!d.x0 && d.x0 !== 0) return null;
            return (
              <text
                key={d.data.name}
                x={d.x0! + 4}
                y={d.y0! + 14}
                className="fill-[#F5F0E8]/25 font-mono"
                style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}
              >
                {d.data.name}
              </text>
            );
          })}

          {/* Org blocks */}
          {leaves.map((leaf, i) => {
            const d = leaf as d3.HierarchyRectangularNode<typeof leaf.data>;
            const org = (d.data as { org?: OrgData }).org;
            if (!org || d.x0 === undefined) return null;

            const w = d.x1! - d.x0!;
            const h = d.y1! - d.y0!;
            const color = getEvidenceColor(org);
            const isSelected = selected?.id === org.id;
            const showLabel = w > 30 && h > 18;
            const showFunding = w > 50 && h > 30;

            return (
              <g
                key={org.id}
                className="cursor-pointer"
                onClick={() => setSelected(isSelected ? null : org)}
                onMouseMove={e => handleMouseMove(e, org)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  opacity: inView ? 1 : 0,
                  transition: `opacity 0.4s ease ${80 + i * 8}ms`,
                }}
              >
                <rect
                  x={d.x0}
                  y={d.y0}
                  width={w}
                  height={h}
                  fill={color}
                  fillOpacity={isSelected ? 1 : 0.75}
                  stroke={isSelected ? '#F5F0E8' : 'transparent'}
                  strokeWidth={isSelected ? 2 : 0}
                  rx={1}
                  style={{ transition: 'fill-opacity 0.15s, stroke 0.15s' }}
                />
                {showLabel && (
                  <text
                    x={d.x0! + 4}
                    y={d.y0! + 14}
                    className="fill-white pointer-events-none"
                    style={{ fontSize: w > 120 ? '11px' : w > 60 ? '9px' : '8px', fontWeight: 600 }}
                  >
                    <tspan>
                      {org.name.length > Math.floor(w / (w > 60 ? 6 : 5))
                        ? org.name.slice(0, Math.floor(w / (w > 60 ? 6 : 5))) + '…'
                        : org.name}
                    </tspan>
                  </text>
                )}
                {showFunding && (
                  <text
                    x={d.x0! + 4}
                    y={d.y0! + 27}
                    className="fill-white/60 pointer-events-none"
                    style={{ fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {formatDollars(org.total_funding)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered && !selected && (
          <div
            className="absolute z-20 pointer-events-none bg-gray-900/95 border border-gray-700 px-3 py-2 max-w-[240px]"
            style={{
              left: Math.min(tooltipPos.x + 12, dimensions.width - 250),
              top: tooltipPos.y - 60,
            }}
          >
            <div className="text-xs font-bold text-[#F5F0E8] truncate">{hovered.name}</div>
            <div className="text-[10px] text-[#F5F0E8]/50 font-mono mt-0.5">
              {formatDollars(hovered.total_funding)} &middot; {hovered.grant_count} grants
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 shrink-0" style={{ backgroundColor: getEvidenceColor(hovered) }} />
              <span className="text-[10px] text-[#F5F0E8]/40">{getEvidenceLabel(hovered)}</span>
              {hovered.is_indigenous_org && <span className="text-[9px] text-purple-400 ml-1">Indigenous</span>}
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div
          className="mt-4 border border-gray-700 bg-gray-950 p-5 md:p-6"
          style={{ transition: 'all 0.2s ease' }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3
                className="text-lg md:text-xl font-bold text-[#F5F0E8]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {selected.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[#F5F0E8]/40 font-mono">{selected.state}</span>
                {selected.is_indigenous_org && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-600 text-white">INDIGENOUS</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-[#F5F0E8]/30 hover:text-[#F5F0E8] text-lg leading-none px-1"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatDollars(selected.total_funding)}
              </div>
              <div className="text-[10px] text-[#F5F0E8]/30 font-mono uppercase">Total Funding</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {selected.grant_count}
              </div>
              <div className="text-[10px] text-[#F5F0E8]/30 font-mono uppercase">Grants</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {selected.intervention_count}
              </div>
              <div className="text-[10px] text-[#F5F0E8]/30 font-mono uppercase">Programs</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3" style={{ backgroundColor: getEvidenceColor(selected) }} />
                <span className="text-sm font-bold text-[#F5F0E8]">{getEvidenceLabel(selected)}</span>
              </div>
              <div className="text-[10px] text-[#F5F0E8]/30 font-mono uppercase mt-1">Evidence Level</div>
            </div>
          </div>

          {/* Evidence breakdown if they have programs */}
          {selected.intervention_count > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.proven_count > 0 && <span className="text-[10px] px-2 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-800">{selected.proven_count} Proven</span>}
              {selected.effective_count > 0 && <span className="text-[10px] px-2 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-800">{selected.effective_count} Effective</span>}
              {selected.promising_count > 0 && <span className="text-[10px] px-2 py-0.5 bg-amber-900/50 text-amber-400 border border-amber-800">{selected.promising_count} Promising</span>}
              {selected.indigenous_led_count > 0 && <span className="text-[10px] px-2 py-0.5 bg-purple-900/50 text-purple-400 border border-purple-800">{selected.indigenous_led_count} Indigenous-led</span>}
              {selected.untested_count > 0 && <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700">{selected.untested_count} Untested</span>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {selected.abn && (
              <Link
                href={`/justice-funding/org/${selected.abn}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                View Full Profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {selected.website && (
              <a
                href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-500 hover:text-red-400 underline underline-offset-2"
              >
                {selected.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        </div>
      )}

      <p className="font-mono text-[10px] text-[#F5F0E8]/15 mt-6">
        Source: JusticeHub database — {data.totalOrgs} organisations, {formatDollars(data.totalFunding)} tracked across QGIP, ROGS, AusTender, state budgets, NIAA
      </p>
    </div>
  );
}

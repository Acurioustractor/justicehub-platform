'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from 'recharts';

/* ── Types ──────────────────────────────────────────────────────── */

export interface ScatterProgram {
  id: string;
  name: string;
  type: string | null;
  evidence_level: string | null;
  cost_per_young_person: number | null;
  org_name: string | null;
  org_id: string | null;
  state: string | null;
  is_indigenous_org: boolean;
  funding_total: number;
}

/* ── Constants ──────────────────────────────────────────────────── */

const DETENTION_COST = 939_000;

const EVIDENCE_ORDER = [
  'Untested (theory/pilot stage)',
  'Promising (community-endorsed, emerging evidence)',
  'Indigenous-led (culturally grounded, community authority)',
  'Effective (strong evaluation, positive outcomes)',
  'Proven (RCT/quasi-experimental, replicated)',
];

const EVIDENCE_SHORT: Record<string, string> = {
  'Untested (theory/pilot stage)': 'Untested',
  'Promising (community-endorsed, emerging evidence)': 'Promising',
  'Indigenous-led (culturally grounded, community authority)': 'Indigenous-led',
  'Effective (strong evaluation, positive outcomes)': 'Effective',
  'Proven (RCT/quasi-experimental, replicated)': 'Proven',
};

const EVIDENCE_X: Record<string, number> = {
  'Untested (theory/pilot stage)': 1,
  'Promising (community-endorsed, emerging evidence)': 2,
  'Indigenous-led (culturally grounded, community authority)': 3,
  'Effective (strong evaluation, positive outcomes)': 4,
  'Proven (RCT/quasi-experimental, replicated)': 5,
};

const BRAND = {
  black: '#0A0A0A',
  offWhite: '#F5F0E8',
  red: '#DC2626',
  emerald: '#059669',
};

function formatCost(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function dotSize(fundingTotal: number): number {
  if (fundingTotal <= 0) return 40;
  if (fundingTotal < 100_000) return 50;
  if (fundingTotal < 1_000_000) return 70;
  if (fundingTotal < 10_000_000) return 100;
  return 140;
}

/* ── Custom Tooltip ─────────────────────────────────────────────── */

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload as ScatterProgram & { x: number; y: number };
  return (
    <div
      className="border p-3 shadow-lg max-w-xs"
      style={{
        background: BRAND.offWhite,
        borderColor: BRAND.black,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '12px',
      }}
    >
      <p className="font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: BRAND.black }}>
        {d.name}
      </p>
      {d.org_name && (
        <p style={{ color: '#666' }}>{d.org_name} {d.state ? `(${d.state})` : ''}</p>
      )}
      <div className="mt-2 space-y-0.5">
        <p>
          <span className="font-medium">Cost:</span>{' '}
          {d.cost_per_young_person ? formatCost(d.cost_per_young_person) : 'Unknown'}
          /year
        </p>
        <p>
          <span className="font-medium">Evidence:</span>{' '}
          {d.evidence_level ? EVIDENCE_SHORT[d.evidence_level] || d.evidence_level : 'Unknown'}
        </p>
        <p>
          <span className="font-medium">Funding:</span>{' '}
          {d.funding_total > 0 ? formatCost(d.funding_total) : '$0 (unfunded)'}
        </p>
        {d.is_indigenous_org && (
          <p style={{ color: BRAND.emerald }} className="font-medium mt-1">
            Indigenous-led organisation
          </p>
        )}
        {d.type && <p><span className="font-medium">Type:</span> {d.type}</p>}
      </div>
    </div>
  );
}

/* ── Custom Dot ─────────────────────────────────────────────────── */

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const p = payload as ScatterProgram & { x: number; y: number };
  const size = dotSize(p.funding_total);
  const r = Math.sqrt(size / Math.PI);

  const fill = p.is_indigenous_org ? BRAND.emerald : BRAND.black;
  const stroke = p.funding_total <= 0 ? BRAND.red : 'none';
  const strokeWidth = p.funding_total <= 0 ? 2 : 0;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      fillOpacity={0.7}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

interface Props {
  programs: ScatterProgram[];
  onSelect?: (program: ScatterProgram | null) => void;
}

export default function EvidenceScatterChart({ programs, onSelect }: Props) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [showOnlyCostData, setShowOnlyCostData] = useState(true);

  // Extract unique types and states for filters
  const types = useMemo(() => {
    const t = new Set<string>();
    for (const p of programs) {
      if (p.type) t.add(p.type);
    }
    return Array.from(t).sort();
  }, [programs]);

  const states = useMemo(() => {
    const s = new Set<string>();
    for (const p of programs) {
      if (p.state) s.add(p.state);
    }
    return Array.from(s).sort();
  }, [programs]);

  // Filter and transform data for the chart
  const chartData = useMemo(() => {
    return programs
      .filter((p) => {
        if (showOnlyCostData && (!p.cost_per_young_person || p.cost_per_young_person <= 0)) return false;
        if (!p.evidence_level || !EVIDENCE_X[p.evidence_level]) return false;
        if (filterType !== 'all' && p.type !== filterType) return false;
        if (filterState !== 'all' && p.state !== filterState) return false;
        return true;
      })
      .map((p) => ({
        ...p,
        x: EVIDENCE_X[p.evidence_level!] + (Math.random() - 0.5) * 0.4, // jitter
        y: p.cost_per_young_person || 100, // fallback for log scale
      }));
  }, [programs, filterType, filterState, showOnlyCostData]);

  const handleClick = useCallback(
    (data: any) => {
      if (data && data.payload && onSelect) {
        onSelect(data.payload);
      }
    },
    [onSelect]
  );

  const xTicks = [1, 2, 3, 4, 5];
  const xTickFormatter = (value: number) => {
    const labels: Record<number, string> = {
      1: 'Untested',
      2: 'Promising',
      3: 'Indigenous-led',
      4: 'Effective',
      5: 'Proven',
    };
    return labels[value] || '';
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showOnlyCostData}
            onChange={(e) => setShowOnlyCostData(e.target.checked)}
            className="accent-[#059669]"
          />
          <span>Only programs with cost data ({programs.filter((p) => p.cost_per_young_person && p.cost_per_young_person > 0).length})</span>
        </label>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border px-2 py-1"
          style={{ borderColor: BRAND.black, background: BRAND.offWhite }}
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="border px-2 py-1"
          style={{ borderColor: BRAND.black, background: BRAND.offWhite }}
        >
          <option value="all">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="text-xs self-center" style={{ color: '#666' }}>
          Showing {chartData.length} programs
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={600}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 60, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0.5, 5.5]}
            ticks={xTicks}
            tickFormatter={xTickFormatter}
            tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fill: BRAND.black }}
          >
            <Label
              value="Evidence Level"
              position="bottom"
              offset={30}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, fill: BRAND.black }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            scale="log"
            domain={[500, 2_000_000]}
            tickFormatter={(v: number) => formatCost(v)}
            tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: BRAND.black }}
          >
            <Label
              value="Cost per Young Person (log scale)"
              angle={-90}
              position="insideLeft"
              offset={-60}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, fill: BRAND.black }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />

          {/* Detention cost reference line */}
          <ReferenceLine
            y={DETENTION_COST}
            stroke={BRAND.red}
            strokeWidth={3}
            strokeDasharray="8 4"
            label={{
              value: `Detention: $939K/year`,
              position: 'right',
              fill: BRAND.red,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: 13,
            }}
          />

          <Scatter
            data={chartData}
            shape={<CustomDot />}
            onClick={handleClick}
            cursor="pointer"
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-6 mt-4 pt-4 border-t"
        style={{ borderColor: '#ddd', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: BRAND.emerald }} />
          <span>Indigenous-led org</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: BRAND.black }} />
          <span>Other orgs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2" style={{ borderColor: BRAND.red, background: 'transparent' }} />
          <span>$0 govt funding</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#999' }} />
          <span className="text-xs">Small dot = less funding</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full" style={{ background: '#999' }} />
          <span className="text-xs">Large dot = more funding</span>
        </div>
      </div>
    </div>
  );
}

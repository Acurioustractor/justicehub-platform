'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Info } from 'lucide-react';

export interface InterventionData {
  id: string;
  name: string;
  type: string;
  cost_per_participant: number; // Annual cost per young person
  effectiveness_score: number; // 0-100 effectiveness measure
  reach: number; // Number of participants
  evidence_level: string;
  state?: string;
  organization?: string;
}

interface CostEffectivenessChartProps {
  data: InterventionData[];
  height?: number;
  onInterventionClick?: (intervention: InterventionData) => void;
  showQuadrants?: boolean;
  filterByType?: string;
}

const TYPE_COLORS: Record<string, string> = {
  Prevention: '#10B981',
  'Early Intervention': '#3B82F6',
  Diversion: '#8B5CF6',
  Therapeutic: '#EC4899',
  'Wraparound Support': '#F59E0B',
  'Family Strengthening': '#06B6D4',
  'Cultural Connection': '#EF4444',
  'Education/Employment': '#6366F1',
  'Justice Reinvestment': '#14B8A6',
  'Community-Led': '#F97316',
};

const EVIDENCE_SHAPES: Record<string, string> = {
  'Proven (RCT/quasi-experimental, replicated)': 'circle',
  'Effective (strong evaluation, positive outcomes)': 'diamond',
  'Indigenous-led (culturally grounded, community authority)': 'star',
  'Promising (community-endorsed, emerging evidence)': 'triangle',
  'Untested (theory/pilot stage)': 'square',
};

export function CostEffectivenessChart({
  data,
  height = 500,
  onInterventionClick,
  showQuadrants = true,
  filterByType,
}: CostEffectivenessChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<InterventionData | null>(null);

  // Filter and transform data
  const chartData = useMemo(() => {
    let filtered = data.filter(
      (d) => d.cost_per_participant > 0 && d.effectiveness_score > 0
    );

    if (filterByType) {
      filtered = filtered.filter((d) => d.type === filterByType);
    }

    return filtered.map((d) => ({
      ...d,
      x: d.cost_per_participant,
      y: d.effectiveness_score,
      z: Math.sqrt(d.reach) * 2, // Size based on reach
    }));
  }, [data, filterByType]);

  // Calculate averages for quadrant lines
  const avgCost = useMemo(() => {
    if (chartData.length === 0) return 50000;
    return chartData.reduce((sum, d) => sum + d.x, 0) / chartData.length;
  }, [chartData]);

  const avgEffectiveness = useMemo(() => {
    if (chartData.length === 0) return 50;
    return chartData.reduce((sum, d) => sum + d.y, 0) / chartData.length;
  }, [chartData]);

  // Get unique types for legend
  const types = useMemo(() => {
    return [...new Set(data.map((d) => d.type))];
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: InterventionData }> }) => {
    if (!active || !payload || payload.length === 0) return null;

    const intervention = payload[0].payload;

    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 max-w-xs">
        <h4 className="font-bold text-sm mb-2">{intervention.name}</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Type:</span>
            <span
              className="font-medium"
              style={{ color: TYPE_COLORS[intervention.type] }}
            >
              {intervention.type}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Cost/participant:</span>
            <span className="font-medium">
              ${intervention.cost_per_participant.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Effectiveness:</span>
            <span className="font-medium">{intervention.effectiveness_score}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Reach:</span>
            <span className="font-medium">
              {intervention.reach.toLocaleString()} participants
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Evidence:</span>
            <span className="font-medium text-right" style={{ maxWidth: '150px' }}>
              {intervention.evidence_level?.split(' ')[0]}
            </span>
          </div>
        </div>
        {intervention.organization && (
          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
            {intervention.organization}
          </div>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div
        className="bg-gray-50 border-2 border-gray-200 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No intervention data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

            <XAxis
              type="number"
              dataKey="x"
              name="Cost per Participant"
              unit="$"
              tickFormatter={(value) =>
                value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
              }
              label={{
                value: 'Cost per Participant ($)',
                position: 'bottom',
                offset: 40,
                style: { fontWeight: 'bold', fontSize: 12 },
              }}
            />

            <YAxis
              type="number"
              dataKey="y"
              name="Effectiveness"
              unit="%"
              domain={[0, 100]}
              label={{
                value: 'Effectiveness Score (%)',
                angle: -90,
                position: 'insideLeft',
                offset: -40,
                style: { fontWeight: 'bold', fontSize: 12 },
              }}
            />

            <ZAxis type="number" dataKey="z" range={[50, 400]} />

            <Tooltip content={<CustomTooltip />} />

            {/* Quadrant reference lines */}
            {showQuadrants && (
              <>
                <ReferenceLine
                  x={avgCost}
                  stroke="#9CA3AF"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Avg Cost',
                    position: 'top',
                    fill: '#6B7280',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={avgEffectiveness}
                  stroke="#9CA3AF"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Avg Effectiveness',
                    position: 'right',
                    fill: '#6B7280',
                    fontSize: 10,
                  }}
                />
              </>
            )}

            <Scatter
              data={chartData}
              onClick={(data) => onInterventionClick?.(data as unknown as InterventionData)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={TYPE_COLORS[entry.type] || '#6B7280'}
                  fillOpacity={hoveredPoint?.id === entry.id ? 1 : 0.7}
                  stroke={hoveredPoint?.id === entry.id ? '#000' : '#fff'}
                  strokeWidth={hoveredPoint?.id === entry.id ? 2 : 1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant Labels */}
      {showQuadrants && (
        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
          <div className="p-3 bg-green-50 border border-green-200">
            <div className="font-bold text-green-800 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              High Value
            </div>
            <p className="text-green-600 mt-1">
              Low cost, high effectiveness - Scale these
            </p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200">
            <div className="font-bold text-blue-800 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Premium
            </div>
            <p className="text-blue-600 mt-1">
              High cost, high effectiveness - Worth investment
            </p>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200">
            <div className="font-bold text-yellow-800 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Needs Review
            </div>
            <p className="text-yellow-600 mt-1">
              Low cost, low effectiveness - Improve or retire
            </p>
          </div>
          <div className="p-3 bg-red-50 border border-red-200">
            <div className="font-bold text-red-800 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Reconsider
            </div>
            <p className="text-red-600 mt-1">
              High cost, low effectiveness - Needs justification
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
        <div className="text-xs font-bold text-gray-700 mb-3">
          Intervention Types
        </div>
        <div className="flex flex-wrap gap-3">
          {types.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] || '#6B7280' }}
              />
              <span className="text-xs text-gray-600">{type}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-3">
          Bubble size represents program reach (participants served)
        </div>
      </div>
    </div>
  );
}

export default CostEffectivenessChart;

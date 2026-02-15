'use client';

import { useMemo, useState } from 'react';
import { Grid, Info, AlertCircle, CheckCircle } from 'lucide-react';

export interface EvidenceCount {
  topic: string;
  jurisdiction: string;
  count: number;
  quality_breakdown?: {
    high: number;
    medium: number;
    low: number;
  };
}

interface EvidenceMatrixHeatMapProps {
  data: EvidenceCount[];
  topics?: string[];
  jurisdictions?: string[];
  onCellClick?: (topic: string, jurisdiction: string) => void;
  showGaps?: boolean;
}

const DEFAULT_TOPICS = [
  'youth_justice',
  'detention',
  'diversion',
  'indigenous',
  'recidivism',
  'mental_health',
  'family',
  'education',
  'employment',
  'child_protection',
];

const DEFAULT_JURISDICTIONS = [
  'National',
  'NSW',
  'VIC',
  'QLD',
  'WA',
  'SA',
  'TAS',
  'NT',
  'ACT',
];

const TOPIC_LABELS: Record<string, string> = {
  youth_justice: 'Youth Justice',
  detention: 'Detention',
  diversion: 'Diversion',
  indigenous: 'Indigenous',
  recidivism: 'Recidivism',
  mental_health: 'Mental Health',
  family: 'Family',
  education: 'Education',
  employment: 'Employment',
  child_protection: 'Child Protection',
  housing: 'Housing',
  policy: 'Policy',
};

export function EvidenceMatrixHeatMap({
  data,
  topics = DEFAULT_TOPICS,
  jurisdictions = DEFAULT_JURISDICTIONS,
  onCellClick,
  showGaps = true,
}: EvidenceMatrixHeatMapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    topic: string;
    jurisdiction: string;
  } | null>(null);

  // Build matrix lookup
  const matrix = useMemo(() => {
    const lookup: Record<string, Record<string, EvidenceCount>> = {};

    for (const item of data) {
      if (!lookup[item.topic]) {
        lookup[item.topic] = {};
      }
      lookup[item.topic][item.jurisdiction] = item;
    }

    return lookup;
  }, [data]);

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  // Get cell color based on count
  const getCellColor = (count: number): string => {
    if (count === 0) return '#FEE2E2'; // Red-100 for gaps
    const intensity = Math.min(count / maxCount, 1);

    if (intensity >= 0.8) return '#059669'; // Emerald-600
    if (intensity >= 0.6) return '#10B981'; // Emerald-500
    if (intensity >= 0.4) return '#34D399'; // Emerald-400
    if (intensity >= 0.2) return '#6EE7B7'; // Emerald-300
    return '#A7F3D0'; // Emerald-200
  };

  // Get text color for contrast
  const getTextColor = (count: number): string => {
    if (count === 0) return '#991B1B'; // Red-800
    const intensity = count / maxCount;
    return intensity >= 0.5 ? '#fff' : '#064E3B'; // White or Emerald-900
  };

  // Identify gaps (0 count cells)
  const gaps = useMemo(() => {
    const gapList: Array<{ topic: string; jurisdiction: string }> = [];

    for (const topic of topics) {
      for (const jurisdiction of jurisdictions) {
        const count = matrix[topic]?.[jurisdiction]?.count || 0;
        if (count === 0) {
          gapList.push({ topic, jurisdiction });
        }
      }
    }

    return gapList;
  }, [matrix, topics, jurisdictions]);

  // Calculate row and column totals
  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const topic of topics) {
      totals[topic] = jurisdictions.reduce(
        (sum, j) => sum + (matrix[topic]?.[j]?.count || 0),
        0
      );
    }
    return totals;
  }, [matrix, topics, jurisdictions]);

  const colTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const jurisdiction of jurisdictions) {
      totals[jurisdiction] = topics.reduce(
        (sum, t) => sum + (matrix[t]?.[jurisdiction]?.count || 0),
        0
      );
    }
    return totals;
  }, [matrix, topics, jurisdictions]);

  const totalEvidence = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Grid className="w-4 h-4" />
            Total Evidence
          </div>
          <div className="text-3xl font-black">{totalEvidence}</div>
        </div>
        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Covered Cells
          </div>
          <div className="text-3xl font-black text-green-600">
            {topics.length * jurisdictions.length - gaps.length}
          </div>
        </div>
        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Evidence Gaps
          </div>
          <div className="text-3xl font-black text-red-600">{gaps.length}</div>
        </div>
      </div>

      {/* Heat Map */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-bold text-gray-500 border-b-2 border-black">
                Topic / Jurisdiction
              </th>
              {jurisdictions.map((j) => (
                <th
                  key={j}
                  className="p-2 text-center text-xs font-bold text-gray-700 border-b-2 border-black min-w-[60px]"
                >
                  {j}
                </th>
              ))}
              <th className="p-2 text-center text-xs font-bold text-gray-500 border-b-2 border-l-2 border-black bg-gray-50">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic}>
                <td className="p-2 text-xs font-medium text-gray-700 border-b border-gray-200 whitespace-nowrap">
                  {TOPIC_LABELS[topic] || topic}
                </td>
                {jurisdictions.map((jurisdiction) => {
                  const cellData = matrix[topic]?.[jurisdiction];
                  const count = cellData?.count || 0;
                  const isHovered =
                    hoveredCell?.topic === topic &&
                    hoveredCell?.jurisdiction === jurisdiction;

                  return (
                    <td
                      key={jurisdiction}
                      className={`p-0 border border-gray-200 relative ${
                        onCellClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => onCellClick?.(topic, jurisdiction)}
                      onMouseEnter={() => setHoveredCell({ topic, jurisdiction })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`w-full h-full min-h-[40px] flex items-center justify-center transition-all ${
                          isHovered ? 'ring-2 ring-black ring-inset' : ''
                        }`}
                        style={{
                          backgroundColor: getCellColor(count),
                          color: getTextColor(count),
                        }}
                      >
                        <span className="text-sm font-bold">{count}</span>
                      </div>

                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border-2 border-black shadow-lg p-2 text-xs whitespace-nowrap">
                          <div className="font-bold">
                            {TOPIC_LABELS[topic] || topic} - {jurisdiction}
                          </div>
                          <div className="text-gray-600">
                            {count} evidence items
                          </div>
                          {cellData?.quality_breakdown && (
                            <div className="mt-1 pt-1 border-t text-gray-500">
                              <div>High: {cellData.quality_breakdown.high}</div>
                              <div>Medium: {cellData.quality_breakdown.medium}</div>
                              <div>Low: {cellData.quality_breakdown.low}</div>
                            </div>
                          )}
                          {count === 0 && (
                            <div className="mt-1 text-red-600 font-medium">
                              ⚠ Evidence Gap
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="p-2 text-center text-xs font-bold text-gray-600 border-b border-gray-200 border-l-2 border-black bg-gray-50">
                  {rowTotals[topic]}
                </td>
              </tr>
            ))}
            {/* Column totals row */}
            <tr className="bg-gray-50 border-t-2 border-black">
              <td className="p-2 text-xs font-bold text-gray-500">Total</td>
              {jurisdictions.map((j) => (
                <td
                  key={j}
                  className="p-2 text-center text-xs font-bold text-gray-600"
                >
                  {colTotals[j]}
                </td>
              ))}
              <td className="p-2 text-center text-sm font-black text-gray-800 border-l-2 border-black">
                {totalEvidence}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-500">Coverage:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 border border-red-200" />
            <span className="text-xs text-gray-600">Gap</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-200 border border-emerald-300" />
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-400 border border-emerald-500" />
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-600 border border-emerald-700" />
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
      </div>

      {/* Gap Alerts */}
      {showGaps && gaps.length > 0 && (
        <div className="bg-red-50 border-2 border-red-600 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-800 mb-2">
                {gaps.length} Evidence Gaps Identified
              </h4>
              <div className="flex flex-wrap gap-2">
                {gaps.slice(0, 10).map(({ topic, jurisdiction }) => (
                  <span
                    key={`${topic}-${jurisdiction}`}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium"
                  >
                    {TOPIC_LABELS[topic] || topic} ({jurisdiction})
                  </span>
                ))}
                {gaps.length > 10 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium">
                    +{gaps.length - 10} more
                  </span>
                )}
              </div>
              <p className="text-xs text-red-600 mt-2">
                These topic-jurisdiction combinations have no indexed evidence.
                Consider targeted research collection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvidenceMatrixHeatMap;

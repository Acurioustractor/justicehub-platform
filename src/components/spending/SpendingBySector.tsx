'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SectorData {
  sector: string;
  total: number;
  count: number;
}

const SECTOR_COLORS: Record<string, string> = {
  youth_justice: '#DC2626',
  community_services: '#059669',
  health: '#3B82F6',
  education: '#8B5CF6',
  housing: '#F59E0B',
  legal: '#06B6D4',
  policing: '#1e293b',
  corrections: '#9333EA',
};

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function SpendingBySector({ data }: { data: SectorData[] }) {
  if (!data.length) return null;

  const sorted = [...data]
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const chartData = sorted.map((d) => ({
    ...d,
    label: d.sector.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  return (
    <section className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Spending by Sector
        </h2>
        <p className="font-mono text-xs text-gray-500 mb-6">
          Justice funding allocation by sector
        </p>

        <div className="h-[400px] bg-white border border-gray-200 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickFormatter={(v) => formatDollars(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  border: '2px solid #0A0A0A',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 12,
                }}
                formatter={((value: number) => formatDollars(value)) as never}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={SECTOR_COLORS[entry.sector] || '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

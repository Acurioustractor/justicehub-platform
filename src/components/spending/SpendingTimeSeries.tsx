'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TimeSeriesPoint {
  year: string;
  detention: number | null;
  community: number | null;
  total: number | null;
}

export default function SpendingTimeSeries({ data }: { data: TimeSeriesPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-[400px] bg-[#F5F0E8] border border-gray-200 flex items-center justify-center text-gray-400 font-mono text-sm">
        NO TIME SERIES DATA
      </div>
    );
  }

  // Shorten year labels: "2024-25" -> "24-25"
  const chartData = data.map((d) => ({
    ...d,
    label: d.year.replace(/^20/, "'"),
  }));

  return (
    <section className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Spending Over Time
        </h2>
        <p className="font-mono text-xs text-gray-500 mb-6">
          Detention vs community program expenditure ($M) — ROGS Table 17A.10
        </p>

        <div className="h-[400px] bg-white border border-gray-200 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                tickFormatter={(v) => `$${v}M`}
              />
              <Tooltip
                contentStyle={{
                  border: '2px solid #0A0A0A',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 12,
                }}
                formatter={((value: number) => `$${value}M`) as never}
                labelFormatter={(label) => `FY ${label}`}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="detention"
                name="Detention"
                stackId="1"
                stroke="#DC2626"
                fill="#DC2626"
                fillOpacity={0.3}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="community"
                name="Community"
                stackId="1"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.3}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

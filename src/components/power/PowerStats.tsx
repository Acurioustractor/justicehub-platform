'use client';

import { useEffect, useState } from 'react';

interface StatsData {
  overview: {
    total_dollars: number;
    total_records: number;
    unique_orgs: number;
    indigenous_dollars: number;
    indigenous_orgs: number;
  };
  power: {
    top10_share: {
      dollars: number;
      pct: number;
    };
    concentration: {
      total_orgs: number;
      orgs_for_50pct: number;
      orgs_for_80pct: number;
    };
  };
}

function formatDollars(n: number): string {
  if (!n && n !== 0) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function PowerStats({ state }: { state: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/power-page?view=stats&state=${state}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state]);

  if (loading) return <div className="h-20 bg-gray-50 animate-pulse border border-gray-200" />;
  if (!data?.overview) return null;

  const { overview, power } = data;
  const indigenousShare = overview.total_dollars > 0
    ? ((overview.indigenous_dollars / overview.total_dollars) * 100).toFixed(1)
    : '0';

  const top10Pct = power?.top10_share?.pct;
  const avgGrant = overview.total_records > 0 ? overview.total_dollars / overview.total_records : 0;

  const stats = [
    { label: 'Total Funding', value: formatDollars(overview.total_dollars) },
    { label: 'Organisations', value: (overview.unique_orgs || 0).toLocaleString() },
    { label: 'Top 10 Control', value: top10Pct ? `${top10Pct.toFixed(0)}%` : 'N/A' },
    { label: 'Indigenous Share', value: `${indigenousShare}%` },
    { label: '50% Held By', value: `${power?.concentration?.orgs_for_50pct || '?'} orgs`, subtitle: `of ${(overview.unique_orgs || 0).toLocaleString()} total` },
    { label: 'Avg Grant', value: formatDollars(avgGrant) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-200 border border-gray-200">
      {stats.map((s) => (
        <div key={s.label} className="bg-white p-4 text-center">
          <div className="text-2xl font-black tracking-tight">{s.value}</div>
          <div className="text-xs font-bold uppercase text-gray-500 mt-1">{s.label}</div>
          {s.subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{s.subtitle}</div>}
        </div>
      ))}
    </div>
  );
}

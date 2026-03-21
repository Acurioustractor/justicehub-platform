'use client';

interface HeadlineData {
  totalSpend: number | null;
  detentionSpend: number | null;
  communitySpend: number | null;
  costPerChild: number | null;
  indigenousRatio: number | null;
  detentionPopulation: number | null;
}

function fmt(val: number | null, prefix = '$', suffix = ''): string {
  if (val == null) return 'N/A';
  if (prefix === '$') {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
    return `$${val}M`;
  }
  return `${prefix}${val.toLocaleString()}${suffix}`;
}

export default function StateHero({
  stateName,
  headline,
}: {
  stateName: string;
  headline: HeadlineData;
}) {
  const stats = [
    {
      label: 'Total Youth Justice Spend',
      value: fmt(headline.totalSpend),
      sub: 'ROGS 2024-25',
    },
    {
      label: 'Detention',
      value: fmt(headline.detentionSpend),
      sub: headline.detentionPopulation
        ? `${headline.detentionPopulation} young people`
        : undefined,
      color: '#DC2626',
    },
    {
      label: 'Community Programs',
      value: fmt(headline.communitySpend),
      sub: 'Supervision + conferencing',
    },
    {
      label: 'Cost Per Child (Detention)',
      value: headline.costPerChild
        ? `$${(headline.costPerChild / 1000).toFixed(0)}K/yr`
        : 'N/A',
      sub: headline.indigenousRatio
        ? `${Math.round(headline.indigenousRatio * 100)}% Indigenous`
        : undefined,
      color: '#DC2626',
    },
  ];

  return (
    <section className="bg-[#0A0A0A] text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-2">
          Youth Justice Spending
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {stateName}
        </h1>
        <p className="text-gray-400 mt-2 font-mono text-sm">
          Source: Productivity Commission Report on Government Services 2026
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {stats.map((s) => (
            <div key={s.label} className="border border-gray-700 p-4">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                {s.label}
              </p>
              <p
                className="text-2xl md:text-3xl font-bold mt-1 tracking-tight"
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  color: s.color || '#F5F0E8',
                }}
              >
                {s.value}
              </p>
              {s.sub && (
                <p className="font-mono text-xs text-gray-500 mt-1">{s.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

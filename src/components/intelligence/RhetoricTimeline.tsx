'use client';

import { useEffect, useState } from 'react';

interface TopicMonth {
  month: string;
  detention: number;
  alternatives: number;
  raising_age: number;
  tough_on_crime: number;
  first_nations: number;
  bail: number;
}

interface TimelineData {
  months: TopicMonth[];
  total_speeches: number;
}

const TOPIC_CONFIG: Record<string, { label: string; color: string }> = {
  detention:      { label: 'Detention',      color: '#DC2626' },
  tough_on_crime: { label: 'Tough on Crime', color: '#B91C1C' },
  alternatives:   { label: 'Alternatives',   color: '#059669' },
  raising_age:    { label: 'Raising the Age', color: '#D97706' },
  first_nations:  { label: 'First Nations',  color: '#7C3AED' },
  bail:           { label: 'Bail',           color: '#6B7280' },
};

const TOPICS = Object.keys(TOPIC_CONFIG) as (keyof Omit<TopicMonth, 'month'>)[];

export default function RhetoricTimeline() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/intelligence/rhetoric-timeline')
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded" style={{ backgroundColor: '#0A0A0A1A' }} />
          <div className="h-4 w-96 rounded" style={{ backgroundColor: '#0A0A0A10' }} />
          <div className="h-64 rounded-xl" style={{ backgroundColor: '#0A0A0A08' }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
          <p className="text-[#0A0A0A]/40 font-mono text-sm">
            Rhetoric timeline data unavailable.
          </p>
          <p className="text-[#0A0A0A]/30 font-mono text-xs mt-2">
            API: /api/intelligence/rhetoric-timeline {error ? `(${error})` : ''}
          </p>
        </div>
      </div>
    );
  }

  const { months, total_speeches } = data;
  const maxTotal = Math.max(
    ...months.map((m) => TOPICS.reduce((sum, t) => sum + ((m[t] as number) || 0), 0)),
    1
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-[#0A0A0A]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">
            Section 5
          </span>
        </div>
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
        >
          Rhetoric Timeline
        </h2>
        <p className="text-[#0A0A0A]/60 max-w-2xl">
          How parliamentary speech topics shift over time. Tracking the language
          politicians use around youth justice -- month by month.
        </p>
      </div>

      {/* Total stat */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#0A0A0A]/10 mb-6"
        style={{ backgroundColor: 'white' }}
      >
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
        >
          {total_speeches.toLocaleString()}
        </span>
        <span className="text-xs font-mono text-[#0A0A0A]/50 uppercase tracking-wider">
          Total Speeches Analysed
        </span>
      </div>

      {/* Chart */}
      <div
        className="rounded-xl border border-[#0A0A0A]/10 p-6 overflow-x-auto"
        style={{ backgroundColor: 'white' }}
      >
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {TOPICS.map((topic) => (
            <div key={topic} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: TOPIC_CONFIG[topic].color }}
              />
              <span className="text-xs font-mono text-[#0A0A0A]/60">
                {TOPIC_CONFIG[topic].label}
              </span>
            </div>
          ))}
        </div>

        {/* Stacked bar chart */}
        <div className="flex items-end gap-1" style={{ minHeight: '200px', height: '240px' }}>
          {months.map((m) => {
            const total = TOPICS.reduce((sum, t) => sum + ((m[t] as number) || 0), 0);
            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col justify-end group relative"
                style={{ minWidth: '20px' }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div
                    className="rounded-lg px-3 py-2 text-xs font-mono shadow-lg whitespace-nowrap"
                    style={{ backgroundColor: '#0A0A0A', color: '#F5F0E8' }}
                  >
                    <div className="font-bold mb-1">{m.month}</div>
                    {TOPICS.filter((t) => (m[t] as number) > 0).map((t) => (
                      <div key={t} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: TOPIC_CONFIG[t].color }}
                        />
                        <span>{TOPIC_CONFIG[t].label}: {m[t] as number}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/20 mt-1 pt-1">Total: {total}</div>
                  </div>
                </div>

                {/* Stacked segments */}
                <div className="flex flex-col justify-end" style={{ height: `${(total / maxTotal) * 100}%` }}>
                  {TOPICS.map((topic) => {
                    const val = (m[topic] as number) || 0;
                    if (val === 0) return null;
                    return (
                      <div
                        key={topic}
                        className="w-full transition-all duration-200"
                        style={{
                          height: `${(val / total) * 100}%`,
                          backgroundColor: TOPIC_CONFIG[topic].color,
                          minHeight: val > 0 ? '2px' : '0',
                        }}
                      />
                    );
                  })}
                </div>

                {/* X-axis label */}
                <div
                  className="text-center mt-2 text-[#0A0A0A]/40 overflow-hidden whitespace-nowrap"
                  style={{ fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {m.month.slice(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis label */}
        <div className="flex justify-between mt-4 text-[#0A0A0A]/30" style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace' }}>
          <span>Speeches per month</span>
          <span>Max: {maxTotal}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';

interface AccountabilityData {
  summary: {
    speech_count: number;
    total_funded: number;
    program_count: number;
    recommendations_rejected: number;
    commitments_broken: number;
  };
  panels: {
    said: {
      count: number;
      excerpts: { speaker: string; text: string; date: string }[];
    };
    funded: {
      total: number;
      top_records: { recipient: string; amount: number; source: string }[];
    };
    happened: {
      count: number;
      evidence_levels: Record<string, number>;
    };
    oversight: {
      count: number;
      rejected: number;
      items: { body: string; text: string; status: string }[];
    };
    promised: {
      count: number;
      broken: number;
      items: { text: string; status: string; minister: string }[];
    };
  };
}

function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function AccountabilityLoop() {
  const [query, setQuery] = useState('youth justice');
  const [searchInput, setSearchInput] = useState('youth justice');
  const [data, setData] = useState<AccountabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((q: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/intelligence/accountability?q=${encodeURIComponent(q)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(query);
  }, [query, fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) setQuery(searchInput.trim());
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-[#0A0A0A]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider">
            Section 6
          </span>
        </div>
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
        >
          Accountability Cross-Reference
        </h2>
        <p className="text-[#0A0A0A]/60 max-w-2xl">
          Tracing the full loop: from what politicians say, to what they fund,
          to what happens on the ground, to what oversight finds, to what they promise next.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search topic..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#0A0A0A]/15 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/20"
            style={{ backgroundColor: 'white', color: '#0A0A0A' }}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#0A0A0A', color: '#F5F0E8' }}
          >
            Search
          </button>
        </div>
        <p className="text-xs font-mono text-[#0A0A0A]/40 mt-2">
          Topic: &ldquo;{query}&rdquo;
        </p>
      </form>

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="h-16 rounded-xl" style={{ backgroundColor: '#0A0A0A08' }} />
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl" style={{ backgroundColor: '#0A0A0A08' }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
          <p className="text-[#0A0A0A]/40 font-mono text-sm">
            Accountability data unavailable.
          </p>
          <p className="text-[#0A0A0A]/30 font-mono text-xs mt-2">
            API: /api/intelligence/accountability ({error})
          </p>
        </div>
      )}

      {/* Data */}
      {!loading && data && (
        <>
          {/* Summary bar */}
          <div
            className="rounded-xl border border-[#0A0A0A]/10 p-4 mb-8 flex flex-wrap gap-6 items-center justify-center"
            style={{ backgroundColor: 'white' }}
          >
            <SummaryStat
              value={data.summary.speech_count.toLocaleString()}
              label="speeches"
            />
            <span className="text-[#0A0A0A]/20 text-lg hidden md:inline">|</span>
            <SummaryStat
              value={formatDollars(data.summary.total_funded)}
              label="funded"
            />
            <span className="text-[#0A0A0A]/20 text-lg hidden md:inline">|</span>
            <SummaryStat
              value={data.summary.program_count.toLocaleString()}
              label="programs"
            />
            <span className="text-[#0A0A0A]/20 text-lg hidden md:inline">|</span>
            <SummaryStat
              value={data.summary.recommendations_rejected.toLocaleString()}
              label="recs rejected"
              accent="#DC2626"
            />
            <span className="text-[#0A0A0A]/20 text-lg hidden md:inline">|</span>
            <SummaryStat
              value={data.summary.commitments_broken.toLocaleString()}
              label="promises broken"
              accent="#DC2626"
            />
          </div>

          {/* 5-panel flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 items-stretch">
            {/* Panel 1: What They Said */}
            <PanelCard title="What They Said" accent="#0A0A0A">
              <div
                className="text-2xl font-bold tracking-tight mb-3"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
              >
                {data.panels.said.count} speeches
              </div>
              <div className="space-y-2">
                {data.panels.said.excerpts.slice(0, 3).map((e, i) => (
                  <div key={i} className="text-xs text-[#0A0A0A]/60">
                    <span className="font-mono text-[#0A0A0A]/40">{e.speaker}</span>
                    <p className="line-clamp-2 mt-0.5">&ldquo;{e.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </PanelCard>

            <Arrow />

            {/* Panel 2: What They Funded */}
            <PanelCard title="What They Funded" accent="#059669">
              <div
                className="text-2xl font-bold tracking-tight mb-3"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#059669' }}
              >
                {formatDollars(data.panels.funded.total)}
              </div>
              <div className="space-y-2">
                {data.panels.funded.top_records.slice(0, 3).map((r, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-mono text-[#059669]">{formatDollars(r.amount)}</span>
                    <span className="text-[#0A0A0A]/50 ml-1">{r.recipient}</span>
                  </div>
                ))}
              </div>
            </PanelCard>

            <Arrow />

            {/* Panel 3: What Happened */}
            <PanelCard title="What Happened" accent="#0A0A0A">
              <div
                className="text-2xl font-bold tracking-tight mb-3"
                style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
              >
                {data.panels.happened.count} programs
              </div>
              <div className="space-y-1">
                {Object.entries(data.panels.happened.evidence_levels).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#0A0A0A]/50 truncate mr-2">{level}</span>
                    <span className="text-[#0A0A0A]/80 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </PanelCard>

            <Arrow />

            {/* Panel 4: What Oversight Recommended */}
            <PanelCard title="What Oversight Recommended" accent="#DC2626">
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
                >
                  {data.panels.oversight.count} recs
                </span>
                {data.panels.oversight.rejected > 0 && (
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: '#DC2626' }}
                  >
                    {data.panels.oversight.rejected} rejected
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {data.panels.oversight.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-mono text-[#0A0A0A]/40">{item.body}</span>
                    <p className="text-[#0A0A0A]/60 line-clamp-2 mt-0.5">{item.text}</p>
                    {item.status?.toLowerCase() === 'rejected' && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium" style={{ backgroundColor: '#DC262620', color: '#DC2626' }}>
                        REJECTED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </PanelCard>

            <Arrow />

            {/* Panel 5: What They Promised */}
            <PanelCard title="What They Promised" accent="#D97706">
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#0A0A0A' }}
                >
                  {data.panels.promised.count}
                </span>
                {data.panels.promised.broken > 0 && (
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: '#DC2626' }}
                  >
                    {data.panels.promised.broken} broken
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {data.panels.promised.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-mono text-[#0A0A0A]/40">{item.minister}</span>
                    <p className="text-[#0A0A0A]/60 line-clamp-2 mt-0.5">{item.text}</p>
                    {['rejected', 'not_started', 'broken'].includes(item.status?.toLowerCase()) && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium" style={{ backgroundColor: '#DC262620', color: '#DC2626' }}>
                        {item.status.toUpperCase().replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function SummaryStat({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <div className="text-center px-2">
      <span
        className="text-lg font-bold tracking-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: accent ?? '#0A0A0A' }}
      >
        {value}
      </span>
      <span className="text-xs font-mono text-[#0A0A0A]/50 ml-1.5 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function PanelCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-[#0A0A0A]/10 p-5 flex flex-col"
      style={{ backgroundColor: 'white' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
        <h4
          className="text-xs font-mono text-[#0A0A0A]/60 uppercase tracking-wider"
        >
          {title}
        </h4>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden md:flex items-center justify-center px-1">
      <svg className="w-5 h-5 text-[#0A0A0A]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

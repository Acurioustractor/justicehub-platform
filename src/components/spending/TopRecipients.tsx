'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Recipient {
  org: string;
  total: number;
  count: number;
  orgId: string | null;
  abn: string | null;
}

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function TopRecipients({ recipients }: { recipients: Recipient[] }) {
  const [sortBy, setSortBy] = useState<'total' | 'count'>('total');

  if (!recipients.length) return null;

  const sorted = [...recipients].sort((a, b) =>
    sortBy === 'total' ? b.total - a.total : b.count - a.count
  );

  const maxTotal = Math.max(...sorted.map((r) => r.total));

  return (
    <section className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Top Recipients
            </h2>
            <p className="font-mono text-xs text-gray-500 mt-1">
              Organisations receiving the most youth justice funding
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('total')}
              className={`px-3 py-1 text-xs font-mono border ${
                sortBy === 'total'
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              By Amount
            </button>
            <button
              onClick={() => setSortBy('count')}
              className={`px-3 py-1 text-xs font-mono border ${
                sortBy === 'count'
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              By Grants
            </button>
          </div>
        </div>

        <div className="border border-gray-200 bg-white divide-y divide-gray-100">
          {sorted.map((r, i) => {
            const pct = maxTotal > 0 ? (r.total / maxTotal) * 100 : 0;
            return (
              <div key={i} className="relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-50"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-gray-400 w-6 text-right shrink-0">
                      {i + 1}
                    </span>
                    {r.orgId ? (
                      <Link
                        href={`/justice-funding?view=org_profile&org=${r.orgId}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {r.org}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium truncate">{r.org}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="font-mono text-sm font-bold">
                      {formatDollars(r.total)}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {r.count} grant{r.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

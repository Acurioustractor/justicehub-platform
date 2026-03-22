'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import ConfidenceBadge from './ConfidenceBadge';

type DrillDownData = {
  title: string;
  source: string;
  confidence: 'verified' | 'cross-referenced' | 'estimate';
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  rows: Record<string, string | number | null>[];
  total: number;
  lastUpdated: string;
};

export default function DrillDown({
  queryId,
  state,
  title,
  children,
}: {
  queryId: string;
  state: string;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<DrillDownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (data) return; // already fetched
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/system/drill-down?id=${encodeURIComponent(queryId)}&state=${encodeURIComponent(state)}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [queryId, state, data]);

  useEffect(() => {
    if (open && !data && !loading) {
      fetchData();
    }
  }, [open, data, loading, fetchData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const fmtCell = (val: string | number | null): string => {
    if (val == null) return '--';
    if (typeof val === 'number') {
      if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
      if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
      if (Number.isInteger(val)) return val.toLocaleString('en-AU');
      return val.toFixed(2);
    }
    return String(val);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer border-b border-dashed border-current/30 hover:border-current/60 transition-colors inline"
        title={`Drill down: ${title}`}
      >
        {children}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/60 transition-opacity" />

          {/* Slide-over panel */}
          <div
            className="relative w-full max-w-2xl bg-[#0A0A0A] border-l border-gray-700 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0A] border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3
                  className="text-lg font-bold text-[#F5F0E8] tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {data?.title || title}
                </h3>
                {data && (
                  <div className="flex items-center gap-3 mt-1">
                    <ConfidenceBadge level={data.confidence} source={data.source} />
                    <span className="font-mono text-[10px] text-gray-500">
                      {data.total.toLocaleString('en-AU')} records
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-[#F5F0E8] transition-colors font-mono text-sm px-2 py-1"
              >
                [ESC]
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {loading && (
                <div className="flex items-center gap-3 py-12 justify-center">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-[#DC2626] rounded-full animate-spin" />
                  <span className="font-mono text-sm text-gray-400">Loading data...</span>
                </div>
              )}

              {error && (
                <div className="py-12 text-center">
                  <p className="font-mono text-sm text-[#DC2626] mb-2">Error loading data</p>
                  <p className="font-mono text-xs text-gray-500">{error}</p>
                  <button
                    type="button"
                    onClick={() => { setData(null); setError(null); }}
                    className="font-mono text-xs text-gray-400 hover:text-[#F5F0E8] mt-4 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* Data table */}
                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {data.columns.map((col) => (
                            <th
                              key={col.key}
                              className={`px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider font-medium ${
                                col.align === 'right' ? 'text-right' : 'text-left'
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {data.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-900/50 transition-colors">
                            {data.columns.map((col) => (
                              <td
                                key={col.key}
                                className={`px-3 py-2 text-[#F5F0E8] ${
                                  col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                                }`}
                              >
                                {fmtCell(row[col.key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-700 mt-4 pt-4 flex items-center justify-between">
                    <p className="font-mono text-[10px] text-gray-500">
                      Source: {data.source}
                    </p>
                    <p className="font-mono text-[10px] text-gray-600">
                      Updated: {data.lastUpdated}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}

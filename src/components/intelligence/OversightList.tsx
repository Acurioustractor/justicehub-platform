'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { CheckCircle2, Clock, XCircle, Scale, Search } from 'lucide-react';
import { StatCard, StatusBadge, SeverityBadge } from './ui-components';

export interface Recommendation {
  oversight_body: string | null;
  report_title: string | null;
  recommendation_text: string | null;
  status: string | null;
  severity: string | null;
  jurisdiction: string | null;
  domain: string | null;
}

export default function OversightList({ initialData }: { initialData: Recommendation[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);

  const stats = useMemo(() => {
    return initialData.reduce((acc, r) => {
      const key = (r.status ?? 'unknown').toLowerCase().replace(/[\s-]+/g, '_');
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {} as Record<string, Recommendation[]>);
  }, [initialData]);

  const acceptedCount = (stats['accepted']?.length ?? 0) + (stats['delivered']?.length ?? 0) + (stats['implemented']?.length ?? 0);
  const partialCount = (stats['partially_implemented']?.length ?? 0) + (stats['in_progress']?.length ?? 0) + (stats['partial']?.length ?? 0);
  const rejectedCount = stats['rejected']?.length ?? 0;

  const filteredData = useMemo(() => {
    let result = initialData;

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.recommendation_text || '').toLowerCase().includes(q) ||
        (r.report_title || '').toLowerCase().includes(q) ||
        (r.oversight_body || '').toLowerCase().includes(q)
      );
    }

    // Filter by status toggles
    if (statusFilter) {
      result = result.filter(r => {
        const normalized = (r.status || '').toLowerCase().replace(/[\s-]+/g, '_');
        if (statusFilter === 'accepted') {
          return ['accepted', 'delivered', 'implemented'].includes(normalized);
        }
        if (statusFilter === 'partial') {
          return ['partially_implemented', 'in_progress', 'partial', 'pending'].includes(normalized);
        }
        if (statusFilter === 'rejected') {
          return normalized === 'rejected';
        }
        return true;
      });
    }

    return result;
  }, [initialData, searchQuery, statusFilter]);

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div>
      {/* Oversight summary & Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={CheckCircle2}
          label="Accepted"
          value={acceptedCount.toString()}
          accent="#059669"
          isActive={statusFilter === 'accepted'}
          onClick={() => setStatusFilter(prev => prev === 'accepted' ? null : 'accepted')}
        />
        <StatCard
          icon={Clock}
          label="Pending / Partial"
          value={partialCount.toString()}
          accent="#F59E0B"
          isActive={statusFilter === 'partial'}
          onClick={() => setStatusFilter(prev => prev === 'partial' ? null : 'partial')}
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={rejectedCount.toString()}
          accent="#DC2626"
          isActive={statusFilter === 'rejected'}
          onClick={() => setStatusFilter(prev => prev === 'rejected' ? null : 'rejected')}
        />
        <StatCard
          icon={Scale}
          label="Total"
          value={initialData.length.toString()}
          isActive={statusFilter === null}
          onClick={() => setStatusFilter(null)}
        />
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#0A0A0A]/40" />
        </div>
        <input
          type="text"
          placeholder="Search recommendations..."
          className="block w-full pl-10 pr-3 py-3 border border-[#0A0A0A]/10 rounded-lg bg-white placeholder-[#0A0A0A]/40 focus:outline-none focus:ring-1 focus:ring-[#DC2626] focus:border-[#DC2626] sm:text-sm"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(15);
          }}
        />
      </div>

      {/* Oversight cards */}
      <div className="space-y-3">
        {visibleData.map((r, i) => {
          const isRejected = r.status?.toLowerCase() === 'rejected';
          return (
            <div
              key={i}
              className="rounded-lg border p-4"
              style={{
                backgroundColor: isRejected ? '#FEF2F2' : 'white',
                borderColor: isRejected ? '#DC262640' : '#0A0A0A1A',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0A0A0A]/80 mb-2">{r.recommendation_text}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0A0A0A]/50">
                    {r.oversight_body && <span className="font-medium text-[#0A0A0A]/70">{r.oversight_body}</span>}
                    {r.report_title && (
                      <>
                        <span className="text-[#0A0A0A]/20">|</span>
                        <span>{r.report_title}</span>
                      </>
                    )}
                    {r.jurisdiction && (
                      <>
                        <span className="text-[#0A0A0A]/20">|</span>
                        <span>{r.jurisdiction}</span>
                      </>
                    )}
                    {r.domain && (
                      <>
                        <span className="text-[#0A0A0A]/20">|</span>
                        <span>{r.domain}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={r.status} />
                  <SeverityBadge severity={r.severity} />
                </div>
              </div>
            </div>
          );
        })}

        {filteredData.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
            <p className="text-[#0A0A0A]/40 font-mono text-sm">No recommendations match your filters.</p>
          </div>
        )}

        {visibleCount < filteredData.length && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setVisibleCount(v => v + 15)}
              className="px-6 py-2 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A]/70 text-sm font-medium rounded-full transition-colors"
            >
              Show More ({filteredData.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

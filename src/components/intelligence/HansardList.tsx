'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export interface HansardEntry {
  id: string;
  subject: string | null;
  speaker_name: string | null;
  party: string | null;
  date: string | null;
  body_text: string | null;
}

export default function HansardList({ initialData }: { initialData: HansardEntry[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);

  const filteredData = useMemo(() => {
    let result = initialData;

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => 
        (h.subject || '').toLowerCase().includes(q) ||
        (h.body_text || '').toLowerCase().includes(q) ||
        (h.speaker_name || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [initialData, searchQuery]);

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#0A0A0A]/40" />
        </div>
        <input
          type="text"
          placeholder="Search speeches..."
          className="block w-full pl-10 pr-3 py-3 border border-[#0A0A0A]/10 rounded-lg bg-white placeholder-[#0A0A0A]/40 focus:outline-none focus:ring-1 focus:ring-[#DC2626] focus:border-[#DC2626] sm:text-sm"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(15);
          }}
        />
      </div>

      {/* Speeches list */}
      <div className="space-y-3">
        {visibleData.map((h) => (
          <div
            key={h.id}
            className="rounded-lg border border-[#0A0A0A]/10 p-4"
            style={{ backgroundColor: 'white' }}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-bold text-[#0A0A0A] mb-1"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {h.subject ?? 'Untitled'}
                </h4>
                <p className="text-xs text-[#0A0A0A]/60 line-clamp-3">
                  {h.body_text
                    ? h.body_text.length > 300
                      ? h.body_text.slice(0, 300) + '...'
                      : h.body_text
                    : 'No content available'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0A0A0A]/50 mt-2">
              {h.speaker_name && <span className="font-medium text-[#0A0A0A]/70">{h.speaker_name}</span>}
              {h.party && (
                <>
                  <span className="text-[#0A0A0A]/20">|</span>
                  <span>{h.party}</span>
                </>
              )}
              {h.date && (
                <>
                  <span className="text-[#0A0A0A]/20">|</span>
                  <span>{new Date(h.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#0A0A0A]/20 p-12 text-center">
            <p className="text-[#0A0A0A]/40 font-mono text-sm">No relevant Hansard speeches found.</p>
            <p className="text-[#0A0A0A]/30 font-mono text-xs mt-2">Data sourced from civic_hansard</p>
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

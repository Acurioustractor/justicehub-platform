'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { withKioskRef } from '../lib/kiosk-ref';

/**
 * Search button + modal for the persistent lens bar.
 *
 * Reuses /api/exhibition/search which wraps the exhibition_search RPC. The
 * RPC searches across organizations, civic_intelligence_claims, government
 * programs, grant opportunities, and foundations with YJ-priority ranking.
 *
 * Touchscreen-friendly: 56px tap targets, large input, full-screen modal so
 * the on-screen keyboard doesn't crowd results.
 */

interface SearchResult {
  result_type: 'organization' | 'claim' | 'gov_program' | 'grant_opportunity' | 'foundation';
  id: string;
  title: string;
  subtitle?: string | null;
  href?: string | null;
  meta?: any;
}

const TYPE_LABEL: Record<string, string> = {
  organization: 'Organisation',
  claim: 'Claim',
  gov_program: 'Government program',
  grant_opportunity: 'Grant',
  foundation: 'Foundation',
};

const TYPE_BADGE: Record<string, string> = {
  organization: 'text-rose-300 bg-rose-950 border-rose-800',
  claim: 'text-emerald-300 bg-emerald-950 border-emerald-800',
  gov_program: 'text-amber-300 bg-amber-950 border-amber-800',
  grant_opportunity: 'text-purple-300 bg-purple-950 border-purple-800',
  foundation: 'text-sky-300 bg-sky-950 border-sky-800',
};

function buildHref(r: SearchResult): string {
  let base = r.href || '';
  if (!base) {
    switch (r.result_type) {
      case 'organization':
        base = `/sites/${r.id}`;
        break;
      case 'claim':
        base = `/intelligence/civic/claim/${encodeURIComponent(r.id)}`;
        break;
      case 'gov_program':
        base = '/intelligence/civic/government-programs';
        break;
      case 'grant_opportunity':
        base = '/find-funding';
        break;
      case 'foundation':
        base = '/intelligence/civic/foundations';
        break;
      default:
        base = '/intelligence/civic';
    }
  }
  return withKioskRef(base);
}

export function KioskSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults([]);
      setCounts({});
      return;
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setCounts({});
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/exhibition/search?q=${encodeURIComponent(q)}&limit=12`);
        const json = await res.json();
        const flat: SearchResult[] = [];
        const allCounts: Record<string, number> = {};
        for (const type of Object.keys(json.results || {})) {
          for (const row of json.results[type]) flat.push({ ...row, result_type: type });
          allCounts[type] = json.counts?.[type] || 0;
        }
        setResults(flat);
        setCounts(allCounts);
      } catch (e) {
        // swallow
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex items-center justify-center min-h-[56px] min-w-[56px] px-4 text-stone-300 hover:text-white hover:bg-stone-900 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8" onClick={() => setOpen(false)}>
          <div
            className="bg-stone-950 text-white border-2 border-stone-700 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-stone-700 p-4 flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a place, org, funder, or topic…"
                className="flex-1 min-h-[48px] bg-transparent text-lg sm:text-xl text-white placeholder:text-stone-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="min-h-[48px] min-w-[48px] text-stone-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {q.trim().length < 2 ? (
                <div className="py-8 text-center text-stone-500">
                  <p className="text-sm font-mono uppercase tracking-widest">Type at least 2 characters</p>
                  <p className="mt-2 text-xs text-stone-600">Try: Adelaide · diversion · Mparntwe · ACCO · bail support</p>
                </div>
              ) : loading && results.length === 0 ? (
                <p className="py-8 text-center text-stone-500 text-sm">Searching…</p>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-stone-500 text-sm">No results for "{q}".</p>
              ) : (
                <>
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">
                    {Object.entries(counts).map(([k, v]) => `${v} ${TYPE_LABEL[k] || k}${v === 1 ? '' : 's'}`).join(' · ')}
                  </p>
                  <ul className="space-y-2">
                    {results.map((r, i) => (
                      <li key={`${r.result_type}-${r.id}-${i}`}>
                        <Link
                          href={buildHref(r)}
                          onClick={() => setOpen(false)}
                          className="block border border-stone-700 bg-stone-900 hover:border-stone-400 p-4 rounded transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{r.title}</p>
                              {r.subtitle && <p className="text-sm text-stone-400 truncate">{r.subtitle}</p>}
                            </div>
                            <span className={`text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded shrink-0 ${TYPE_BADGE[r.result_type] || 'text-stone-300 bg-stone-800 border-stone-700'}`}>
                              {TYPE_LABEL[r.result_type] || r.result_type}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

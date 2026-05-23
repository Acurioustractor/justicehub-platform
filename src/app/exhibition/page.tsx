'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Building2, FileText, Coins, Heart, Loader2, ExternalLink } from 'lucide-react';

interface ResultRow {
  result_type: string;
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  meta: Record<string, any>;
  slug: string | null;
  similarity: number;
}

const TYPE_LABEL: Record<string, string> = {
  organization: 'Organisations',
  claim: 'Civic findings',
  gov_program: 'Government programs',
  grant_opportunity: 'Grants you can apply for',
  foundation: 'Foundations',
};
const TYPE_ICON: Record<string, any> = {
  organization: Building2,
  claim: FileText,
  gov_program: FileText,
  grant_opportunity: Coins,
  foundation: Heart,
};
const TYPE_COLOR: Record<string, string> = {
  organization: 'border-emerald-200 bg-emerald-50',
  claim: 'border-amber-200 bg-amber-50',
  gov_program: 'border-sky-200 bg-sky-50',
  grant_opportunity: 'border-purple-200 bg-purple-50',
  foundation: 'border-rose-200 bg-rose-50',
};

function fmtMoney(n: any) {
  if (n == null || n === '') return null;
  const v = Number(n);
  if (isNaN(v)) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

type TypeFilter = 'all' | 'organization' | 'claim' | 'gov_program' | 'grant_opportunity' | 'foundation';

export default function ExhibitionPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Record<string, ResultRow[]>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults({});
      setCounts({});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/exhibition/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setResults(data.results || {});
      setCounts(data.counts || {});
      setSubmitted(query);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => runSearch(q), 250);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  const hasResults = Object.keys(results).length > 0;
  const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero with search */}
      <section className="bg-stone-900 text-stone-50 px-6 pt-16 pb-12 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">JusticeHub · Exhibition</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Find services, funding, and the story behind the numbers.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-stone-300">
            Search for a place, a service, a foundation, a government program, or a topic.
            Add your own service if it&apos;s not here.
          </p>

          {/* Search bar */}
          <div className="mt-8 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try "Mt Isa", "Justice Reinvestment", "On Country", "Ian Potter", or "diversion"'
              autoFocus
              className="w-full pl-14 pr-5 py-5 text-lg md:text-xl rounded-lg bg-stone-50 text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-4 focus:ring-stone-400/30"
            />
            {loading && (
              <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 animate-spin" />
            )}
          </div>

          {/* Type filter chips (clickable) */}
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-mono uppercase tracking-widest items-baseline">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full transition ${typeFilter === 'all' ? 'bg-stone-50 text-stone-900' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
            >
              All: {Object.values(counts).reduce((s, n) => s + n, 0)}
            </button>
            {Object.entries(TYPE_LABEL).map(([type, label]) => {
              const c = counts[type] || 0;
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(active ? 'all' : (type as TypeFilter))}
                  disabled={c === 0}
                  className={`px-3 py-1.5 rounded-full transition ${active ? 'bg-stone-50 text-stone-900' : c > 0 ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-900/40 text-stone-600 cursor-not-allowed'}`}
                >
                  {label}: {c}
                </button>
              );
            })}
          </div>

          {/* State filter chips */}
          {q.length >= 2 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono uppercase tracking-widest items-baseline">
              <span className="text-stone-500 mr-1">By state:</span>
              {(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const).map((s) => {
                const active = stateFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStateFilter(active ? null : s)}
                    className={`px-3 py-1 rounded-full transition text-[10px] ${active ? 'bg-stone-50 text-stone-900' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
                  >
                    {s}
                  </button>
                );
              })}
              {stateFilter && (
                <button onClick={() => setStateFilter(null)} className="px-3 py-1 rounded-full text-[10px] underline text-stone-400 hover:text-stone-200">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {q.length < 2 ? (
            <SuggestedSearches />
          ) : !hasResults && !loading ? (
            <NoResults q={submitted} />
          ) : (
            <div className="space-y-10">
              {(['organization', 'claim', 'gov_program', 'grant_opportunity', 'foundation'] as const).map(
                (type) => {
                  if (typeFilter !== 'all' && typeFilter !== type) return null;
                  let rows = results[type] || [];
                  // State filter — apply to org-like result types that carry state in meta
                  if (stateFilter) {
                    rows = rows.filter((r) => {
                      const meta = r.meta || {};
                      const s = (meta.state || meta.jurisdiction || '').toString().toUpperCase();
                      return s === stateFilter;
                    });
                  }
                  if (rows.length === 0) return null;
                  return (
                    <div key={type}>
                      <h2 className="text-xl font-bold text-stone-900 mb-3 flex items-baseline gap-2">
                        <span>{TYPE_LABEL[type]}</span>
                        <span className="text-xs font-mono uppercase tracking-widest text-stone-500">
                          {rows.length} result{rows.length === 1 ? '' : 's'}{stateFilter ? ` in ${stateFilter}` : ''}
                        </span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rows.map((r) => (
                          <ResultCard key={`${r.result_type}-${r.id}`} row={r} />
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* Add your service CTA */}
      <section className="px-6 py-10 border-t border-stone-200 bg-stone-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Not finding your service?</h2>
          <p className="text-stone-700 mb-5 max-w-xl mx-auto">
            JusticeHub is built from the community up. If your program serves young people and isn&apos;t here,
            add it so others can find it.
          </p>
          <Link
            href="/add-service"
            className="inline-block px-6 py-3 rounded-md bg-stone-900 text-stone-50 font-medium hover:bg-stone-700 transition"
          >
            Add your service
          </Link>
        </div>
      </section>
    </div>
  );
}

function ResultCard({ row }: { row: ResultRow }) {
  const Icon = TYPE_ICON[row.result_type] || Search;
  const colorCls = TYPE_COLOR[row.result_type] || 'border-stone-200 bg-white';
  const href = row.result_type === 'organization' && row.slug
    ? `/sites/${row.slug}`
    : row.result_type === 'claim'
      ? `/intelligence/civic`
      : row.result_type === 'foundation' && row.slug
        ? `/sites/${row.slug}`
        : row.meta?.url || null;

  const inner = (
    <div className={`border-2 ${colorCls} rounded-lg p-4 h-full hover:shadow-md transition`}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Icon className="w-4 h-4 text-stone-600 self-center" />
          <span className="font-bold text-stone-900">{row.title}</span>
          {row.meta?.tier1 && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              Tier 1
            </span>
          )}
          {row.meta?.acco_certified && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
              ACCO
            </span>
          )}
          {row.meta?.community_led && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              Community-led
            </span>
          )}
        </div>
      </div>
      {row.subtitle && (
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2 flex items-baseline gap-1">
          {row.result_type === 'organization' || row.result_type === 'foundation' ? (
            <MapPin className="w-3 h-3" />
          ) : null}
          {row.subtitle}
        </p>
      )}
      {row.detail && <p className="text-sm text-stone-700 line-clamp-3">{row.detail}</p>}

      {row.result_type === 'gov_program' && row.meta?.budget && (
        <p className="mt-2 text-sm font-mono text-stone-700">Budget: {fmtMoney(row.meta.budget)}</p>
      )}
      {row.result_type === 'grant_opportunity' && (row.meta?.amount_min || row.meta?.amount_max) && (
        <p className="mt-2 text-sm font-mono text-stone-700">
          {row.meta.amount_min ? fmtMoney(row.meta.amount_min) : ''}
          {row.meta.amount_min && row.meta.amount_max ? ' – ' : ''}
          {row.meta.amount_max ? fmtMoney(row.meta.amount_max) : ''}
          {row.meta.deadline ? ` · closes ${row.meta.deadline}` : ''}
        </p>
      )}

      {href && (
        <div className="mt-3 text-xs font-mono uppercase tracking-widest text-stone-600 flex items-baseline gap-1">
          Open <ExternalLink className="w-3 h-3 self-center" />
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} target={href.startsWith('http') ? '_blank' : undefined} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function SuggestedSearches() {
  const sets = [
    { label: 'By place', items: ['Mt Isa', 'Mparntwe', 'Palm Island', 'Yarrabah', 'Cherbourg'] },
    { label: 'By theme', items: ['On Country', 'Justice Reinvestment', 'Diversion', 'Bail support', 'Raise the age'] },
    { label: 'By funder', items: ['Ian Potter', 'Paul Ramsay', 'Snow Foundation', 'FRRR', 'Myer Foundation'] },
  ];
  return (
    <div className="space-y-6">
      <p className="text-stone-700">Try one of these to get started:</p>
      {sets.map((set) => (
        <div key={set.label}>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">{set.label}</p>
          <div className="flex flex-wrap gap-2">
            {set.items.map((item) => (
              <Link
                key={item}
                href={`/exhibition?q=${encodeURIComponent(item)}`}
                onClick={(e) => {
                  e.preventDefault();
                  const input = document.querySelector('input[type=text]') as HTMLInputElement;
                  if (input) {
                    input.value = item;
                    input.focus();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="px-3 py-1.5 rounded-full border border-stone-300 bg-white text-stone-800 text-sm hover:border-stone-500 transition"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="text-center py-10 text-stone-600">
      <p className="text-lg">No results for &ldquo;{q}&rdquo;.</p>
      <p className="text-sm mt-2">Try a different spelling, or a broader term.</p>
    </div>
  );
}

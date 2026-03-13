'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Search, ExternalLink, Calendar, DollarSign, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Grant {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  amount_min: number | null;
  amount_max: number | null;
  closes_at: string | null;
  categories: string[] | null;
  url: string | null;
  grant_type: string | null;
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'community', label: 'Community' },
  { value: 'health', label: 'Health' },
  { value: 'indigenous', label: 'Indigenous' },
  { value: 'education', label: 'Education' },
  { value: 'arts', label: 'Arts' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'regenerative', label: 'Environment' },
];

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return null;
}

function daysUntil(date: string) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (d <= 0) return 'Closed';
  if (d === 1) return 'Tomorrow';
  if (d <= 7) return `${d}d left`;
  return `${Math.ceil(d / 7)}w left`;
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [total, setTotal] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setOffset(0);
      fetchGrants(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category]);

  function fetchGrants(newOffset: number) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(newOffset) });
    if (query) params.set('q', query);
    if (category) params.set('category', category);

    fetch(`/api/grants/discover?${params}`)
      .then(r => r.json())
      .then(d => {
        setGrants(d.grants || []);
        setTotal(d.total || 0);
        setTotalOpen(d.totalOpen || 0);
        setOffset(newOffset);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="header-offset">
        {/* Hero */}
        <section className="section-padding border-b-2 border-black bg-ochre-50">
          <div className="container-justice text-center">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">
              Find Grants
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Search {totalOpen > 0 ? `${totalOpen.toLocaleString()} open` : ''} grant opportunities across Australia.
              Powered by GrantScope.
            </p>

            {/* Search */}
            <div className="max-w-3xl mx-auto flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search grants... (e.g. 'youth justice', 'Indigenous health', 'diversion')"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full border-2 border-black rounded-lg pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ochre-500"
                />
              </div>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="border-2 border-black rounded-lg px-4 py-3 text-sm font-bold bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="section-padding">
          <div className="container-justice">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="font-bold">Searching grants...</span>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-500 mb-6">
                  {total.toLocaleString()} grant{total !== 1 ? 's' : ''} found
                  {query && <span> for &ldquo;{query}&rdquo;</span>}
                </p>

                <div className="grid gap-4">
                  {grants.map(grant => (
                    <div key={grant.id} className="border-2 border-black rounded-lg p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-sm leading-snug line-clamp-2">{grant.name}</h3>
                          <p className="text-xs font-bold text-gray-500 mt-1">{grant.provider}</p>
                        </div>
                        {grant.url && (
                          <a href={grant.url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 p-2 border-2 border-black rounded-lg hover:bg-ochre-50 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {grant.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{grant.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {grant.closes_at && (
                          <span className={`text-xs font-bold flex items-center gap-1 ${
                            new Date(grant.closes_at).getTime() - Date.now() < 7 * 86_400_000 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {daysUntil(grant.closes_at)}
                          </span>
                        )}
                        {formatAmount(grant.amount_min, grant.amount_max) && (
                          <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatAmount(grant.amount_min, grant.amount_max)}
                          </span>
                        )}
                        {grant.categories?.slice(0, 3).map(cat => (
                          <span key={cat} className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {total > limit && (
                  <div className="flex items-center justify-between mt-8">
                    <button
                      onClick={() => fetchGrants(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                      className="flex items-center gap-1 text-sm font-bold disabled:opacity-30 hover:underline"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <span className="text-xs font-bold text-gray-400">
                      {offset + 1}–{Math.min(offset + limit, total)} of {total.toLocaleString()}
                    </span>
                    <button
                      onClick={() => fetchGrants(offset + limit)}
                      disabled={offset + limit >= total}
                      className="flex items-center gap-1 text-sm font-bold disabled:opacity-30 hover:underline"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-12 text-center border-t-2 border-black pt-8">
                  <p className="text-sm text-gray-500 mb-3">
                    Want grant management, matching, and outcome tracking?
                  </p>
                  <Link
                    href="/how-it-works"
                    className="inline-block bg-black text-white font-bold text-sm px-6 py-3 rounded-lg border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    See Plans & Pricing
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

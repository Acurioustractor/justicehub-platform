'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Calendar, DollarSign, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface GrantOpportunity {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  program: string | null;
  amount_min: number | null;
  amount_max: number | null;
  closes_at: string | null;
  status: string | null;
  categories: string[] | null;
  focus_areas: string[] | null;
  url: string | null;
  geography: string | null;
  grant_type: string | null;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'community', label: 'Community' },
  { value: 'health', label: 'Health' },
  { value: 'indigenous', label: 'Indigenous' },
  { value: 'education', label: 'Education' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'regenerative', label: 'Environment' },
  { value: 'technology', label: 'Technology' },
  { value: 'aged_care', label: 'Aged Care' },
];

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return null;
}

function daysUntil(date: string) {
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (d <= 0) return 'Closed';
  if (d === 1) return 'Closes tomorrow';
  if (d <= 7) return `${d} days left`;
  if (d <= 30) return `${Math.ceil(d / 7)} weeks left`;
  return `${Math.ceil(d / 30)} months left`;
}

export function GrantDiscovery() {
  const [grants, setGrants] = useState<GrantOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [total, setTotal] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setOffset(0);
      fetchGrants(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category]);

  function fetchGrants(newOffset: number) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(newOffset),
    });
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
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Search className="h-5 w-5 text-gray-400" />
          <h3 className="font-black text-lg">Discover Grants</h3>
          <span className="text-xs font-bold text-gray-400 ml-auto">{totalOpen.toLocaleString()} open grants</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Search across 29,000+ grant opportunities from GrantScope</p>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search grants... (e.g. 'youth justice', 'Indigenous', 'diversion')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 border-2 border-black rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ochre-500"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border-2 border-black rounded-lg px-3 py-2 text-sm font-bold bg-white"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="font-bold text-sm">Searching grants...</span>
        </div>
      ) : grants.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-bold">No grants found matching your search.</p>
          <p className="text-sm mt-1">Try broadening your search terms or changing the category.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-gray-500">
            {total.toLocaleString()} grant{total !== 1 ? 's' : ''} found
            {query && <span> for &ldquo;{query}&rdquo;</span>}
          </p>

          <div className="space-y-3">
            {grants.map(grant => (
              <div key={grant.id} className="bg-white border-2 border-black rounded-lg p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-sm leading-snug line-clamp-2">{grant.name}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-1">{grant.provider}</p>
                  </div>
                  {grant.url && (
                    <a
                      href={grant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 border-2 border-black rounded-lg hover:bg-ochre-50 transition-colors"
                    >
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
                      new Date(grant.closes_at).getTime() - Date.now() < 7 * 86_400_000
                        ? 'text-red-600'
                        : 'text-gray-500'
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
                  {grant.categories?.map(cat => (
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
            <div className="flex items-center justify-between">
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
        </>
      )}
    </div>
  );
}

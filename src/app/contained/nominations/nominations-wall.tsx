'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowRight, Megaphone } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'politician', label: 'Politicians', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'justice_official', label: 'Justice Officials', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'media', label: 'Media', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'business', label: 'Business', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'community', label: 'Community', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

function getCategoryStyle(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.color || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getCategoryLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label || category;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface Nomination {
  nominee_name: string;
  nominee_title?: string;
  nominee_org?: string;
  category: string;
  reason: string;
  created_at: string;
}

const GOAL = 2500;
const LIMIT = 20;

export function NominationsWall() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const fetchNominations = useCallback(async (p: number, category: string, append: boolean) => {
    const isFirst = p === 1 && !append;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        mode: 'wall',
        page: String(p),
        limit: String(LIMIT),
      });
      if (category) params.set('category', category);

      const res = await fetch(`/api/projects/the-contained/nominations?${params}`);
      const data = await res.json();

      if (append) {
        setNominations((prev) => [...prev, ...(data.nominations || [])]);
      } else {
        setNominations(data.nominations || []);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchNominations(1, activeCategory, false);
  }, [activeCategory, fetchNominations]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNominations(nextPage, activeCategory, true);
  };

  const progress = Math.min((total / GOAL) * 100, 100);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <div className="max-w-3xl">
              <Link
                href="/contained"
                className="text-sm font-bold uppercase tracking-widest text-red-400 hover:text-red-300 mb-4 inline-block"
              >
                ← Back to CONTAINED
              </Link>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                Nominations Wall
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Australians are nominating the decision-makers who need to experience
                youth detention reality. Every name builds public pressure.
              </p>

              {/* Progress */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-black text-3xl">{total.toLocaleString()}</span>
                  <span className="text-gray-400 self-end">of {GOAL.toLocaleString()} goal</span>
                </div>
                <div className="h-3 bg-gray-800 w-full">
                  <div
                    className="h-full bg-red-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                    activeCategory === cat.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-12">
          <div className="container-justice">
            {loading ? (
              <div className="text-center py-16">
                <div className="text-lg font-bold text-gray-400 animate-pulse">
                  Loading nominations...
                </div>
              </div>
            ) : nominations.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-bold text-gray-500 mb-4">
                  No nominations yet{activeCategory ? ' in this category' : ''}.
                </p>
                <Link
                  href="/contained#nominate"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                >
                  <Megaphone className="w-4 h-4" /> Be the first
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nominations.map((nom, i) => (
                    <div
                      key={`${nom.nominee_name}-${nom.created_at}-${i}`}
                      className="border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-black text-lg">{nom.nominee_name}</h3>
                            {(nom.nominee_title || nom.nominee_org) && (
                              <p className="text-sm text-gray-600">
                                {[nom.nominee_title, nom.nominee_org].filter(Boolean).join(' — ')}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-1 border whitespace-nowrap ${getCategoryStyle(nom.category)}`}
                          >
                            {getCategoryLabel(nom.category)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {nom.reason}
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo(nom.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-10">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 text-sm font-bold uppercase tracking-widest border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-red-600 text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Add Your Nomination
            </h2>
            <p className="text-lg text-red-100 mb-6 max-w-xl mx-auto">
              Who needs to experience what youth detention is really like?
              Every nomination builds public pressure for change.
            </p>
            <Link
              href="/contained#nominate"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              Nominate a Leader <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

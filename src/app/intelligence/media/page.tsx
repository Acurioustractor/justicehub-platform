'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Search,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
} from 'lucide-react';

type MediaArticle = {
  id: string;
  headline: string;
  url: string | null;
  published_date: string | null;
  source_name: string | null;
  sentiment: string | null;
  topics: string[] | null;
  summary: string | null;
};

const SENTIMENTS = ['all', 'positive', 'negative', 'neutral', 'mixed'] as const;
const PAGE_SIZE = 24;

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 text-xs font-medium">
          <TrendingUp className="w-3 h-3" /> Positive
        </span>
      );
    case 'negative':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 text-xs font-medium">
          <TrendingDown className="w-3 h-3" /> Negative
        </span>
      );
    case 'neutral':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 text-xs font-medium">
          <Minus className="w-3 h-3" /> Neutral
        </span>
      );
    case 'mixed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-xs font-medium">
          Mixed
        </span>
      );
    default:
      return null;
  }
}

export default function MediaPage() {
  const [articles, setArticles] = useState<MediaArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('alma_media_articles')
      .select('id, headline, url, published_date, source_name, sentiment, topics, summary', { count: 'exact' })
      .order('published_date', { ascending: false, nullsFirst: false });

    if (searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(`headline.ilike.${term},source_name.ilike.${term},summary.ilike.${term}`);
    }

    if (sentimentFilter !== 'all') {
      query = query.eq('sentiment', sentimentFilter);
    }

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    setArticles(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, searchQuery, sentimentFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, sentimentFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="section-padding border-b-2 border-black bg-white">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-8 h-8" />
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Intelligence
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
              Media Monitor
            </h1>
            <p className="text-xl max-w-3xl text-gray-700">
              {total.toLocaleString()} articles tracked across Australian youth justice, Indigenous
              affairs, and community services media coverage.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search headlines, sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-black pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Sentiment pills */}
              <div className="flex gap-2">
                {SENTIMENTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSentimentFilter(s)}
                    className={`px-3 py-1.5 text-sm font-bold uppercase border-2 border-black transition-colors ${
                      sentimentFilter === s
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="container-justice py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">
              {total.toLocaleString()} Articles
            </h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 border-2 border-black disabled:opacity-30 hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 border-2 border-black disabled:opacity-30 hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block border-4 border-black border-t-transparent rounded-full w-12 h-12 animate-spin" />
              <p className="mt-4 text-gray-700 font-bold uppercase text-sm">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="border-2 border-gray-300 bg-white p-12 text-center">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-bold uppercase text-sm">
                No articles match your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/intelligence/media/${article.id}`}
                  className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col"
                >
                  {/* Card header */}
                  <div className="border-b-2 border-black p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase text-gray-600">
                        {article.source_name || 'Unknown Source'}
                      </span>
                      <SentimentBadge sentiment={article.sentiment} />
                    </div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-3">
                      {article.headline}
                    </h3>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex-1 flex flex-col">
                    {article.summary && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {article.summary}
                      </p>
                    )}

                    {article.topics && article.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {article.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-xs text-blue-800"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-200 text-xs text-gray-500">
                      {formatDate(article.published_date)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Bottom pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-black">
              <p className="text-sm text-gray-600">
                Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, total)} of{' '}
                {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border-2 border-black disabled:opacity-30 hover:bg-gray-100 text-sm font-bold"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 border-2 border-black disabled:opacity-30 hover:bg-gray-100 text-sm font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

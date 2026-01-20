'use client';

/**
 * Unified Search Page
 *
 * Full-featured search interface with:
 * - Intent-aware search
 * - Faceted filtering
 * - Results from multiple sources (JusticeHub DB + Empathy Ledger)
 * - Related search suggestions
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  Filter,
  X,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Building2,
  Users,
  FileText,
  Video,
  BookOpen,
  Newspaper,
  Target,
  Briefcase,
} from 'lucide-react';
import {
  useJusticeSearch,
  RESULT_TYPE_LABELS,
  AUSTRALIAN_STATES,
} from '@/hooks/useJusticeSearch';
import type { SearchResultType, SearchResult } from '@/lib/search/types';

// Icon mapping for result types
const TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  intervention: <Target className="h-4 w-4" />,
  service: <Briefcase className="h-4 w-4" />,
  person: <Users className="h-4 w-4" />,
  organization: <Building2 className="h-4 w-4" />,
  media: <Video className="h-4 w-4" />,
  story: <BookOpen className="h-4 w-4" />,
  research: <FileText className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') as SearchResultType | null;
  const initialState = searchParams.get('state') || undefined;

  const [inputValue, setInputValue] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);

  const {
    results,
    facets,
    intent,
    suggestions,
    warnings,
    isLoading,
    error,
    query,
    total,
    hasMore,
    timing,
    search,
    loadMore,
    filters,
    setFilters,
  } = useJusticeSearch();

  // Run initial search from URL params
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery, {
        type: initialType || undefined,
        state: initialState,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim().length >= 2) {
      // Update URL
      const params = new URLSearchParams({ q: inputValue });
      if (filters.type) params.set('type', filters.type);
      if (filters.state) params.set('state', filters.state);
      router.push(`/search?${params.toString()}`);

      search(inputValue, filters);
    }
  };

  const handleTypeFilter = (type: string) => {
    const newType = type === 'all' ? undefined : (type as SearchResultType);
    setFilters({ ...filters, type: newType });
  };

  const handleStateFilter = (state: string) => {
    const newState = state === 'all' ? undefined : state;
    setFilters({ ...filters, state: newState });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    search(suggestion, filters);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search programs, services, organizations, people, media..."
                  className="pl-12 pr-4 h-12 text-lg"
                  autoFocus
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg" disabled={isLoading || inputValue.length < 2}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>

            {/* Intent Badge */}
            {intent && intent !== 'general' && (
              <div className="mt-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Detected intent:{' '}
                  <Badge variant="secondary" className="ml-1">
                    {intent.replace('find_', '').replace('_', ' ')}
                  </Badge>
                </span>
              </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border-2 border-black">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={handleTypeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {Object.entries(RESULT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">State</label>
                    <Select
                      value={filters.state || 'all'}
                      onValueChange={handleStateFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All states</SelectItem>
                        {AUSTRALIAN_STATES.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFilters({})}
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Results */}
          <div className="flex-1">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-black flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  {warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-yellow-800 dark:text-yellow-200">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-black">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Results Header */}
            {query && !isLoading && (
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {total} result{total !== 1 ? 's' : ''} for "{query}"
                  </h2>
                  {timing && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timing.total_ms}ms
                    </p>
                  )}
                </div>

                {/* Type tabs for quick filtering */}
                {facets && facets.total > 0 && (
                  <Tabs value={filters.type || 'all'} onValueChange={handleTypeFilter}>
                    <TabsList>
                      <TabsTrigger value="all">
                        All ({facets.total})
                      </TabsTrigger>
                      {Object.entries(facets.byType)
                        .filter(([, count]) => count > 0)
                        .map(([type, count]) => (
                          <TabsTrigger key={type} value={type}>
                            {RESULT_TYPE_LABELS[type as SearchResultType]} ({count})
                          </TabsTrigger>
                        ))}
                    </TabsList>
                  </Tabs>
                )}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* Results List */}
            {!isLoading && results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="pt-4 text-center">
                    <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                      Load more results
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {!isLoading && query && results.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search terms or filters
                </p>
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Try searching for:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!query && !isLoading && (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold mb-2">Search JusticeHub</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Find programs, services, organizations, people, and stories across
                  the youth justice ecosystem.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'healing programs',
                    'diversion services NSW',
                    'mentoring youth',
                    'Indigenous organizations',
                  ].map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(example)}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Suggestions & Facets */}
          {query && !isLoading && (results.length > 0 || suggestions.length > 0) && (
            <div className="w-64 flex-shrink-0 hidden lg:block">
              {/* Related Searches */}
              {suggestions.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Related searches</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <ChevronRight className="h-3 w-3" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* State Facets */}
              {facets && Object.keys(facets.byState).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">By state</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {Object.entries(facets.byState)
                        .sort(([, a], [, b]) => b - a)
                        .map(([state, count]) => (
                          <button
                            key={state}
                            onClick={() => setFilters({ ...filters, state })}
                            className={`w-full text-left text-sm px-2 py-1 rounded flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 ${
                              filters.state === state ? 'bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {state}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                          </button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Card className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border-2 border-black">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          {result.metadata.imageUrl && (
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-gray-100 border border-black">
              <Image
                src={result.metadata.imageUrl}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={result.url}
                  className="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline line-clamp-1"
                >
                  {result.title}
                </Link>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    {TYPE_ICONS[result.type]}
                    {RESULT_TYPE_LABELS[result.type]}
                  </span>
                  {result.metadata.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {result.metadata.state}
                    </span>
                  )}
                  {result.source.name !== 'justicehub' && (
                    <Badge variant="outline" className="text-xs">
                      {result.source.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Score indicator (subtle) */}
              <div className="flex-shrink-0">
                <div
                  className="w-2 h-8 rounded-full bg-gradient-to-t from-green-500 to-green-200"
                  style={{
                    opacity: 0.3 + result.score * 0.7,
                  }}
                  title={`Relevance: ${Math.round(result.score * 100)}%`}
                />
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {result.description}
              </p>
            )}

            {/* Tags */}
            {result.metadata.tags && result.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.metadata.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* External link indicator */}
            {result.url.startsWith('http') && (
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                External link
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

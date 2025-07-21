'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search as SearchIcon,
  Filter,
  X,
  Clock,
  TrendingUp,
  Calendar,
  Tag,
  User,
  FileText,
  ChevronRight,
  Sparkles,
  Database,
  Cloud
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  highlights: {
    title?: string;
    content?: string[];
    tags?: string[];
  };
  matchScore: number;
  source: 'local' | 'airtable';
  storyType: string;
  visibility: string;
  author?: {
    name?: string;
  };
  tags: string[];
  createdAt: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [facets, setFacets] = useState<any>(null);
  const [filters, setFilters] = useState<any>({});
  const [total, setTotal] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const debouncedQuery = useDebounce(query, 300);

  // Fetch trending searches on mount
  useEffect(() => {
    fetchTrendingSearches();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch();
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [debouncedQuery, filters, activeTab]);

  const fetchTrendingSearches = async () => {
    try {
      const response = await fetch('/api/search?limit=10');
      if (response.ok) {
        const data = await response.json();
        setTrendingSearches(data.trending);
      }
    } catch (error) {
      console.error('Error fetching trending searches:', error);
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const searchFilters = { ...filters };
      
      // Apply tab filter
      if (activeTab !== 'all') {
        searchFilters.source = activeTab;
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: debouncedQuery,
          filters: searchFilters,
          limit: 20,
          offset: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setSuggestions(data.suggestions);
        setFacets(data.facets);
        setTotal(data.total);
        setExecutionTime(data.executionTime);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const toggleFilter = (type: string, value: string) => {
    setFilters((prev: any) => {
      const current = prev[type] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [type]: updated.length > 0 ? updated : undefined
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const highlightText = (text: string, highlight?: string) => {
    if (!highlight) return text;
    return <span dangerouslySetInnerHTML={{ __html: highlight }} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Stories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find inspiration across thousands of youth stories
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search stories, tags, or topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Try searching for:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* No query state - show trending */}
        {!query && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {query && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Filters</CardTitle>
                    {Object.keys(filters).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Story Types */}
                  {facets?.storyTypes?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Story Type</h4>
                      <div className="space-y-1">
                        {facets.storyTypes.map((type: any) => (
                          <label
                            key={type.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters.storyType?.includes(type.value)}
                              onChange={() => toggleFilter('storyType', type.value)}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">
                              {type.value} ({type.count})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {facets?.tags?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="space-y-1">
                        {facets.tags.slice(0, 5).map((tag: any) => (
                          <label
                            key={tag.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters.tags?.includes(tag.value)}
                              onChange={() => toggleFilter('tags', tag.value)}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {tag.value} ({tag.count})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {isSearching ? (
                      'Searching...'
                    ) : (
                      <>
                        Found {total} results for "{query}"
                        {executionTime > 0 && (
                          <span className="ml-2">
                            ({(executionTime / 1000).toFixed(2)}s)
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="local">
                      <Database className="h-3 w-3 mr-1" />
                      Local
                    </TabsTrigger>
                    <TabsTrigger value="airtable">
                      <Cloud className="h-3 w-3 mr-1" />
                      Airtable
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Loading State */}
              {isSearching && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Results List */}
              {!isSearching && results.length > 0 && (
                <div className="space-y-4">
                  {results.map((result) => (
                    <Card key={result.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <Link href={`/stories/${result.id}`}>
                            <h3 className="text-xl font-semibold hover:text-primary">
                              {highlightText(result.title, result.highlights?.title)}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {result.source === 'airtable' ? (
                                <Cloud className="h-3 w-3 mr-1" />
                              ) : (
                                <Database className="h-3 w-3 mr-1" />
                              )}
                              {result.source}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Score: {result.matchScore}
                            </Badge>
                          </div>
                        </div>

                        {/* Excerpt with highlights */}
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {result.excerpt}
                        </p>

                        {/* Content highlights */}
                        {result.highlights?.content && result.highlights.content.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {result.highlights.content.map((highlight, idx) => (
                              <p
                                key={idx}
                                className="text-sm text-gray-600 italic"
                                dangerouslySetInnerHTML={{ __html: `"...${highlight}..."` }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {result.storyType}
                          </span>
                          {result.author?.name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {result.author.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(result.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>

                        {/* Tags */}
                        {result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {result.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant={result.highlights?.tags?.includes(tag) ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Link
                          href={`/stories/${result.id}`}
                          className="inline-flex items-center text-primary hover:underline mt-3"
                        >
                          Read full story
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching && results.length === 0 && query.length >= 2 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <SearchIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or filters
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
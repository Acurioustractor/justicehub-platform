'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  Target,
  Building2,
  Users,
  Image,
  BookOpen,
  BarChart3,
  Newspaper,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { SearchResult as UnifiedSearchResult, SearchResultType, SearchIntent } from '@/lib/search/types';

interface QuickSearchProps {
  placeholder?: string;
  onClose?: () => void;
  isModal?: boolean;
}

// Map result types to icons
const TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  intervention: <Target className="h-4 w-4 text-amber-500" />,
  service: <Briefcase className="h-4 w-4 text-blue-500" />,
  person: <Users className="h-4 w-4 text-green-500" />,
  organization: <Building2 className="h-4 w-4 text-purple-500" />,
  media: <Image className="h-4 w-4 text-pink-500" />,
  story: <BookOpen className="h-4 w-4 text-orange-500" />,
  research: <BarChart3 className="h-4 w-4 text-cyan-500" />,
  news: <Newspaper className="h-4 w-4 text-gray-500" />,
};

// Map result types to labels
const TYPE_LABELS: Record<SearchResultType, string> = {
  intervention: 'Program',
  service: 'Service',
  person: 'Person',
  organization: 'Organization',
  media: 'Media',
  story: 'Story',
  research: 'Research',
  news: 'News',
};

// Map intents to display labels
const INTENT_LABELS: Record<SearchIntent, string> = {
  find_program: 'Programs',
  find_person: 'People',
  find_organization: 'Organizations',
  find_media: 'Media',
  find_research: 'Research',
  general: 'All',
};

export function QuickSearch({
  placeholder = "Search programs, services, organizations...",
  onClose,
  isModal = false,
}: QuickSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input when opening modal
  useEffect(() => {
    if (isModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search
  useEffect(() => {
    if (!mounted) return;
    
    if (debouncedQuery.length >= 2) {
      performQuickSearch();
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedQuery, mounted]);

  const performQuickSearch = async () => {
    setIsSearching(true);
    setIsOpen(true);

    try {
      // Use unified search API with limit=5 for quick results
      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: '5',
      });

      const response = await fetch(`/api/intelligence/search?${params}`);

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setIntent(data.intent || null);
      }
    } catch (error) {
      console.error('Quick search error:', error);
      setResults([]);
      setIntent(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    if (onClose) onClose();
  };

  if (!mounted) {
    return (
      <div className={isModal ? '' : 'relative w-full max-w-lg'}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder={placeholder}
            value=""
            disabled
            className="pl-10 pr-10"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={searchRef} className={isModal ? '' : 'relative w-full max-w-lg'}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Quick Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <Card className={`mt-2 ${isModal ? '' : 'absolute z-50 w-full'} shadow-lg`}>
          <CardContent className="p-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : results.length > 0 ? (
              <>
                {/* Intent indicator */}
                {intent && intent !== 'general' && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-gray-500">
                      Searching {INTENT_LABELS[intent]}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {results.map((result) => {
                    // Build the result URL based on type
                    const resultUrl = getResultUrl(result);

                    return (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={resultUrl}
                        onClick={handleResultClick}
                        className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-2 rounded transition-colors"
                      >
                        {/* Type Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {TYPE_ICONS[result.type]}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {result.title}
                            </h4>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                              {TYPE_LABELS[result.type]}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {result.description}
                          </p>
                          {result.metadata.state && (
                            <span className="text-[10px] text-gray-400 mt-1 inline-block">
                              {result.metadata.state}
                            </span>
                          )}
                        </div>

                        {/* Score indicator (subtle) */}
                        {result.score > 0.8 && (
                          <div className="flex-shrink-0">
                            <span className="text-[10px] text-green-500 font-medium">
                              Best match
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleResultClick}
                  className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-primary hover:underline"
                >
                  <span>View all results for &quot;{query}&quot;</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No results found</p>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleResultClick}
                  className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                >
                  Try advanced search
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Get the URL for a search result based on its type
 */
function getResultUrl(result: UnifiedSearchResult): string {
  switch (result.type) {
    case 'intervention':
      return `/programs/${result.id}`;
    case 'service':
      return `/services/${result.id}`;
    case 'organization':
      return `/organizations/${result.id}`;
    case 'person':
      return `/people/${result.id}`;
    case 'story':
      return `/stories/${result.id}`;
    case 'media':
      return `/media/${result.id}`;
    case 'research':
      return `/research/${result.id}`;
    case 'news':
      return `/news/${result.id}`;
    default:
      return result.url || '#';
  }
}
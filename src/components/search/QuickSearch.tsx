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
  Tag,
  FileText,
  User
} from 'lucide-react';
import Link from 'next/link';

interface QuickSearchProps {
  placeholder?: string;
  onClose?: () => void;
  isModal?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  storyType: string;
  author?: { name?: string };
  tags: string[];
}

export function QuickSearch({ 
  placeholder = "Search stories...", 
  onClose,
  isModal = false 
}: QuickSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: debouncedQuery,
          limit: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results.slice(0, 5));
      }
    } catch (error) {
      console.error('Quick search error:', error);
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
                <div className="space-y-3">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/stories/${result.id}`}
                      onClick={handleResultClick}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-2 rounded"
                    >
                      <h4 className="font-medium text-sm mb-1">{result.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {result.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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
                        {result.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {result.tags.length}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleResultClick}
                  className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-primary hover:underline"
                >
                  <span>View all results for "{query}"</span>
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
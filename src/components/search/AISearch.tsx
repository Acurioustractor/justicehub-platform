'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Sparkles, 
  X, 
  Loader2, 
  TrendingUp,
  Filter,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'ai';
}

interface AISearchProps {
  onSearch?: (query: string, filters?: any) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export function AISearch({
  onSearch,
  placeholder = 'Search stories, opportunities, mentors...',
  className,
  showSuggestions = true,
  showFilters = true,
  autoFocus = false,
}: AISearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch AI-powered suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/ai?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.suggestions) {
        setSuggestions(
          data.suggestions.map((text: string) => ({
            text,
            type: 'ai' as const,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery && showSuggestions) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, fetchSuggestions, showSuggestions]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setShowSuggestionsDropdown(false);
    
    if (onSearch) {
      onSearch(searchQuery, { aiEnabled });
    } else {
      // Navigate to search page with AI parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&ai=${aiEnabled}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Search className="h-3 w-3" />;
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      case 'ai':
        return <Sparkles className="h-3 w-3" />;
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestionsDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              onFocus={() => setShowSuggestionsDropdown(true)}
              placeholder={placeholder}
              className={cn(
                'pl-10 pr-10',
                aiEnabled && 'ring-1 ring-purple-200 dark:ring-purple-800'
              )}
              autoFocus={autoFocus}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* AI Enhancement Indicator */}
          {aiEnabled && (
            <div className="absolute -top-2 right-2 z-10">
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestionsDropdown && suggestions.length > 0 && (
            <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <span className="text-gray-400">
                        {getSuggestionIcon(suggestion.type)}
                      </span>
                      <span className="flex-1">{suggestion.text}</span>
                      {suggestion.type === 'ai' && (
                        <Badge variant="outline" className="text-xs">
                          AI
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Button
          onClick={() => handleSearch()}
          disabled={!query.trim() || isLoading}
          className={cn(
            'min-w-[100px]',
            aiEnabled && 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>

        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setAiEnabled(!aiEnabled)}
            className={cn(
              'min-w-[120px]',
              aiEnabled && 'border-purple-300 dark:border-purple-700'
            )}
          >
            {aiEnabled ? (
              <>
                <Brain className="h-4 w-4 mr-2" />
                AI On
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Basic
              </>
            )}
          </Button>
        )}
      </div>

      {/* AI Features Info */}
      {aiEnabled && showFilters && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-purple-500" />
            <span>
              AI search understands context, finds related content, and suggests better search terms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
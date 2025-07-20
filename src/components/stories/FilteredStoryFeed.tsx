'use client';

import { useState, useEffect } from 'react';
import { useUnifiedStories } from '@/hooks/useUnifiedStories';
import { UnifiedStoryFeed } from './UnifiedStoryFeed';
import { StoryFilters, FilterState } from './StoryFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Filter,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface FilteredStoryFeedProps {
  initialFilters?: Partial<FilterState>;
  showMobileFilters?: boolean;
  className?: string;
}

export function FilteredStoryFeed({
  initialFilters = {},
  showMobileFilters = true,
  className = ''
}: FilteredStoryFeedProps) {
  const [filters, setFilters] = useState<FilterState>({
    source: 'all',
    storyTypes: [],
    visibility: [],
    tags: [],
    dateRange: { enabled: false },
    published: undefined,
    hasMedia: undefined,
    minWords: undefined,
    ...initialFilters
  });

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Convert filter state to API params
  const apiFilters = {
    source: filters.source,
    storyType: filters.storyTypes.length > 0 ? filters.storyTypes : undefined,
    visibility: filters.visibility.length > 0 ? filters.visibility : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    published: filters.published,
    dateRange: filters.dateRange.enabled ? {
      start: filters.dateRange.start!,
      end: filters.dateRange.end!
    } : undefined
  };

  // Fetch available tags
  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    try {
      // This would typically fetch from an API endpoint
      // For now, using mock data
      setAvailableTags([
        'resilience',
        'mental-health',
        'education',
        'career',
        'community',
        'leadership',
        'technology',
        'arts',
        'sports',
        'volunteering'
      ]);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.source !== 'all' ? 1 : 0,
    filters.storyTypes.length,
    filters.visibility.length,
    filters.tags.length,
    filters.dateRange.enabled ? 1 : 0,
    filters.published !== undefined ? 1 : 0,
    filters.hasMedia !== undefined ? 1 : 0,
    filters.minWords ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setFilters({
      source: 'all',
      storyTypes: [],
      visibility: [],
      tags: [],
      dateRange: { enabled: false },
      published: undefined,
      hasMedia: undefined,
      minWords: undefined
    });
  };

  return (
    <div className={`${className}`}>
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="col-span-1">
          <StoryFilters
            filters={filters}
            onChange={setFilters}
            availableTags={availableTags}
            orientation="vertical"
          />
        </div>

        {/* Stories Feed */}
        <div className="col-span-3">
          <UnifiedStoryFeed
            initialFilter={apiFilters}
            showHeader={false}
            showStats={false}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Filter Bar */}
        {showMobileFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                      <SheetHeader>
                        <SheetTitle>Filter Stories</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <StoryFilters
                          filters={filters}
                          onChange={setFilters}
                          availableTags={availableTags}
                          orientation="vertical"
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Quick Filters */}
                  <div className="flex gap-2">
                    {filters.source !== 'all' && (
                      <Badge variant="secondary">
                        {filters.source}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, source: 'all' }))}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.storyTypes.map(type => (
                      <Badge key={type} variant="secondary">
                        {type}
                        <button
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            storyTypes: prev.storyTypes.filter(t => t !== type)
                          }))}
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stories Feed */}
        <UnifiedStoryFeed
          initialFilter={apiFilters}
          showHeader={false}
          showStats={false}
        />
      </div>
    </div>
  );
}
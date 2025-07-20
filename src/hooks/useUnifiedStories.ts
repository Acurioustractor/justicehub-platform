import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UnifiedStory {
  id: string;
  title: string;
  content: string;
  storyType: string;
  visibility: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  source: 'local' | 'airtable';
  tags?: string[];
  media?: any[];
  author?: {
    id?: string;
    name?: string;
    organization?: string;
  };
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    lastSyncedAt?: Date;
  };
}

interface StoryFilter {
  source?: 'local' | 'airtable' | 'all';
  visibility?: string[];
  storyType?: string[];
  tags?: string[];
  search?: string;
  published?: boolean;
  organizationId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'publishedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface UseUnifiedStoriesResult {
  stories: UnifiedStory[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  loadMore: () => void;
  search: (query: string) => void;
  updateFilter: (newFilter: Partial<StoryFilter>) => void;
}

export function useUnifiedStories(initialFilter: StoryFilter = {}): UseUnifiedStoriesResult {
  const [filter, setFilter] = useState<StoryFilter>({
    source: 'all',
    limit: 20,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilter
  });

  const queryClient = useQueryClient();

  // Fetch stories
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['unified-stories', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/stories/unified?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/stories/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error('Failed to search stories');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['unified-stories', filter], {
        stories: data.stories,
        total: data.stories.length,
        hasMore: false
      });
    }
  });

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<StoryFilter>) => {
    setFilter(prev => ({
      ...prev,
      ...newFilter,
      offset: newFilter.offset !== undefined ? newFilter.offset : 0 // Reset offset when filter changes
    }));
  }, []);

  // Load more stories
  const loadMore = useCallback(() => {
    if (data?.hasMore) {
      setFilter(prev => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 20)
      }));
    }
  }, [data?.hasMore]);

  // Search stories
  const search = useCallback((query: string) => {
    if (query.trim()) {
      searchMutation.mutate(query);
    } else {
      // Clear search
      updateFilter({ search: undefined });
    }
  }, [searchMutation, updateFilter]);

  return {
    stories: data?.stories || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading: isLoading || searchMutation.isPending,
    error: error || searchMutation.error,
    refetch,
    loadMore,
    search,
    updateFilter
  };
}

// Hook for story statistics
export function useStoryStats() {
  return useQuery({
    queryKey: ['story-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stories/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch story statistics');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for featured stories
export function useFeaturedStories() {
  return useUnifiedStories({
    published: true,
    visibility: ['public'],
    limit: 6,
    sortBy: 'publishedAt',
    sortOrder: 'desc'
  });
}

// Hook for organization stories
export function useOrganizationStories(organizationId: string) {
  return useUnifiedStories({
    organizationId,
    visibility: ['organization', 'public'],
    published: true,
    limit: 20
  });
}
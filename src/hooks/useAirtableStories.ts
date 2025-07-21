import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0/client';

interface AirtableStoriesParams {
  limit?: number;
  offset?: number;
  published?: boolean;
  storyType?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  organizationId?: string;
}

interface AirtableStory {
  id: string;
  title: string;
  content: string;
  storyType: string;
  tags: string[];
  visibility: string;
  published: boolean;
  createdAt: string;
  author: {
    name: string;
    organization: string;
    anonymous: boolean;
  };
  media: any[];
  metadata: any;
  source: 'airtable';
  originalRecordId: string;
  lastSyncAt: string;
}

export function useAirtableStories(params: AirtableStoriesParams = {}) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['airtable-stories', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      if (params.published !== undefined) searchParams.set('published', params.published.toString());
      if (params.storyType) searchParams.set('storyType', params.storyType);
      if (params.tags?.length) searchParams.set('tags', params.tags.join(','));
      if (params.startDate) searchParams.set('startDate', params.startDate);
      if (params.endDate) searchParams.set('endDate', params.endDate);
      if (params.organizationId) searchParams.set('organizationId', params.organizationId);

      const response = await fetch(`/api/airtable/stories?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Airtable stories');
      }

      return response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAirtableStory(recordId: string, includeMedia: boolean = true) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['airtable-story', recordId, includeMedia],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (!includeMedia) searchParams.set('includeMedia', 'false');

      const response = await fetch(`/api/airtable/stories/${recordId}?${searchParams}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch Airtable story');
      }

      return response.json();
    },
    enabled: !!user && !!recordId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useAirtableSearch(query: string, fields?: string[], limit?: number) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['airtable-search', query, fields, limit],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('q', query);
      if (fields?.length) searchParams.set('fields', fields.join(','));
      if (limit) searchParams.set('limit', limit.toString());

      const response = await fetch(`/api/airtable/stories/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to search Airtable stories');
      }

      return response.json();
    },
    enabled: !!user && query.length >= 2,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAirtableStoriesByTag(tags: string[], matchAll: boolean = false, limit?: number) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['airtable-tags', tags, matchAll, limit],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('tags', tags.join(','));
      if (matchAll) searchParams.set('matchAll', 'true');
      if (limit) searchParams.set('limit', limit.toString());

      const response = await fetch(`/api/airtable/stories/tags?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories by tags');
      }

      return response.json();
    },
    enabled: !!user && tags.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAirtableMetadata(organizationId?: string) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['airtable-metadata', organizationId],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (organizationId) searchParams.set('organizationId', organizationId);

      const response = await fetch(`/api/airtable/metadata?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Airtable metadata');
      }

      return response.json();
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useAirtableSync() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const syncMutation = useMutation({
    mutationFn: async (params: { organizationId?: string; fullSync?: boolean }) => {
      const response = await fetch('/api/airtable/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate sync');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['airtable-stories'] });
      queryClient.invalidateQueries({ queryKey: ['airtable-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });

  const statusQuery = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const response = await fetch('/api/airtable/sync/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      return response.json();
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // Poll while sync is running
      const lastSync = query.state.data?.lastSync;
      if (lastSync?.status === 'running') {
        return 5000; // 5 seconds
      }
      return false;
    },
  });

  return {
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending || statusQuery.data?.lastSync?.status === 'running',
    syncStatus: statusQuery.data,
    error: syncMutation.error || statusQuery.error,
  };
}
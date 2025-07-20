import { AirtableService } from '../services/airtableService.js';
import { CacheService, CacheKeys } from '../services/cacheService.js';
import { z } from 'zod';
import { AirtableStoryFilters } from '../types/airtable.js';

const getStoriesSchema = z.object({
  organizationId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.string().optional(),
  filters: z.object({
    published: z.boolean().optional(),
    storyType: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
});

export async function getStoriesHandler(
  args: unknown,
  airtableService: AirtableService,
  cacheService: CacheService
) {
  try {
    // Validate input
    const params = getStoriesSchema.parse(args || {});
    
    // Generate cache key
    const cacheKey = CacheKeys.stories({
      ...params,
      timestamp: new Date().toISOString().split('T')[0], // Daily cache
    });

    // Try to get from cache
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log('Fetching stories from Airtable...');
        
        // Construct a clean filter object that matches the AirtableStoryFilters type
        const filters: AirtableStoryFilters = {};
        if (params.filters) {
          if (params.filters.published !== undefined) {
            filters.published = params.filters.published;
          }
          if (params.filters.storyType) {
            filters.storyType = params.filters.storyType;
          }
          if (params.filters.tags && params.filters.tags.length > 0) {
            filters.tags = params.filters.tags;
          }
          if (params.filters.dateRange?.start && params.filters.dateRange.end) {
            filters.dateRange = {
              start: params.filters.dateRange.start,
              end: params.filters.dateRange.end,
            };
          }
        }
        
        // Fetch from Airtable
        const { stories, nextOffset } = await airtableService.getStories(
          filters,
          params.limit,
          params.offset
        );

        // Transform stories to standardized format
        const transformedStories = stories.map(story => 
          airtableService.transformStory(story, {
            includePrivateFields: false,
            anonymizeAuthor: false,
          })
        );

        return {
          stories: transformedStories,
          total: transformedStories.length,
          hasMore: !!nextOffset,
          offset: nextOffset,
          limit: params.limit,
        };
      },
      3600 // 1 hour cache
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('Error in getStoriesHandler:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

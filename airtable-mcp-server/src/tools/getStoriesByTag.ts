import { AirtableService } from '../services/airtableService.js';
import { CacheService, CacheKeys } from '../services/cacheService.js';
import { z } from 'zod';

const getStoriesByTagSchema = z.object({
  tags: z.array(z.string()).min(1),
  matchAll: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(50),
});

export async function getStoriesByTagHandler(
  args: unknown,
  airtableService: AirtableService,
  cacheService: CacheService
) {
  try {
    // Validate input
    const params = getStoriesByTagSchema.parse(args);
    
    // Generate cache key
    const cacheKey = CacheKeys.storyTags(params.tags, params.matchAll);

    // Try to get from cache
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`Fetching stories by tags: ${params.tags.join(', ')}`);
        
        // Fetch from Airtable
        const stories = await airtableService.getStoriesByTag(
          params.tags,
          params.matchAll,
          params.limit
        );

        // Transform stories to standardized format
        const transformedStories = stories.map(story => 
          airtableService.transformStory(story, {
            includePrivateFields: false,
            anonymizeAuthor: false,
          })
        );

        // Group stories by tags for analytics
        const tagCounts: Record<string, number> = {};
        transformedStories.forEach(story => {
          story.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        return {
          stories: transformedStories,
          total: transformedStories.length,
          tags: params.tags,
          matchAll: params.matchAll,
          tagCounts,
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
    console.error('Error in getStoriesByTagHandler:', error);
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
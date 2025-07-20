import { AirtableService } from '../services/airtableService.js';
import { CacheService, CacheKeys } from '../services/cacheService.js';
import { z } from 'zod';

const getStoryMetadataSchema = z.object({
  organizationId: z.string().optional(),
});

export async function getStoryMetadataHandler(
  args: unknown,
  airtableService: AirtableService,
  cacheService: CacheService
) {
  try {
    // Validate input
    const params = getStoryMetadataSchema.parse(args || {});
    
    // Generate cache key
    const cacheKey = CacheKeys.metadata(params.organizationId);

    // Try to get from cache
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log('Fetching story metadata from Airtable...');
        
        // Fetch metadata from Airtable
        const metadata = await airtableService.getStoryMetadata(
          params.organizationId
        );

        // Enhance metadata with additional insights
        const totalStories = metadata.totalStories;
        const avgStoriesPerAuthor = totalStories > 0 
          ? totalStories / Object.keys(metadata.storiesByAuthor).length 
          : 0;

        // Calculate top tags
        const topTags = Object.entries(metadata.storiesByTag)
          .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }));

        // Calculate top story types
        const topStoryTypes = Object.entries(metadata.storiesByType)
          .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
          .map(([type, count]) => ({ type, count }));

        return {
          ...metadata,
          insights: {
            avgStoriesPerAuthor,
            topTags,
            topStoryTypes,
            publishRate: totalStories > 0 
              ? (metadata.publishedStories / totalStories * 100).toFixed(2) + '%'
              : '0%',
          },
          cacheInfo: {
            cachedAt: new Date().toISOString(),
            ttl: 3600, // 1 hour
          },
        };
      },
      3600 // 1 hour cache for metadata
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
    console.error('Error in getStoryMetadataHandler:', error);
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
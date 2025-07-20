import { AirtableService } from '../services/airtableService.js';
import { CacheService, CacheKeys } from '../services/cacheService.js';
import { z } from 'zod';

const getStoryByIdSchema = z.object({
  recordId: z.string(),
  includeMedia: z.boolean().optional().default(true),
});

export async function getStoryByIdHandler(
  args: unknown,
  airtableService: AirtableService,
  cacheService: CacheService
) {
  try {
    // Validate input
    const params = getStoryByIdSchema.parse(args);
    
    // Generate cache key
    const cacheKey = CacheKeys.story(params.recordId);

    // Try to get from cache
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`Fetching story ${params.recordId} from Airtable...`);
        
        // Fetch from Airtable
        const story = await airtableService.getStoryById(
          params.recordId,
          params.includeMedia
        );

        if (!story) {
          return null;
        }

        // Transform story to standardized format
        return airtableService.transformStory(story, {
          includePrivateFields: false,
          anonymizeAuthor: false,
        });
      },
      7200 // 2 hour cache for individual stories
    );

    if (!result) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Story not found',
              recordId: params.recordId,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('Error in getStoryByIdHandler:', error);
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
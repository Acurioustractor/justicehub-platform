import { AirtableService } from '../services/airtableService.js';
import { CacheService, CacheKeys } from '../services/cacheService.js';
import { z } from 'zod';

const searchStoriesSchema = z.object({
  query: z.string().min(2),
  searchFields: z.array(z.string()).optional().default(['Title', 'Content', 'Tags']),
  limit: z.number().min(1).max(100).optional().default(50),
});

export async function searchStoriesHandler(
  args: unknown,
  airtableService: AirtableService,
  cacheService: CacheService
) {
  try {
    // Validate input
    const params = searchStoriesSchema.parse(args);
    
    // Generate cache key
    const cacheKey = CacheKeys.storySearch(params.query, params.searchFields);

    // Try to get from cache
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`Searching stories for: "${params.query}"`);
        
        // Search in Airtable
        const stories = await airtableService.searchStories(
          params.query,
          params.searchFields,
          params.limit
        );

        // Transform stories to standardized format
        const transformedStories = stories.map(story => 
          airtableService.transformStory(story, {
            includePrivateFields: false,
            anonymizeAuthor: false,
          })
        );

        // Calculate relevance scores (simple implementation)
        const scoredStories = transformedStories.map(story => {
          let score = 0;
          const queryLower = params.query.toLowerCase();
          
          // Title match (highest weight)
          if (story.title.toLowerCase().includes(queryLower)) {
            score += 10;
          }
          
          // Content match
          if (story.content.toLowerCase().includes(queryLower)) {
            score += 5;
          }
          
          // Tag match
          if (story.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
            score += 3;
          }

          return {
            ...story,
            relevanceScore: score,
          };
        });

        // Sort by relevance score
        scoredStories.sort((a, b) => b.relevanceScore - a.relevanceScore);

        return {
          stories: scoredStories,
          total: scoredStories.length,
          query: params.query,
          searchFields: params.searchFields,
        };
      },
      1800 // 30 minute cache for search results
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
    console.error('Error in searchStoriesHandler:', error);
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
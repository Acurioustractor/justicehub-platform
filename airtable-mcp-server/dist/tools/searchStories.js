"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchStoriesHandler = searchStoriesHandler;
const cacheService_js_1 = require("../services/cacheService.js");
const zod_1 = require("zod");
const searchStoriesSchema = zod_1.z.object({
    query: zod_1.z.string().min(2),
    searchFields: zod_1.z.array(zod_1.z.string()).optional().default(['Title', 'Content', 'Tags']),
    limit: zod_1.z.number().min(1).max(100).optional().default(50),
});
async function searchStoriesHandler(args, airtableService, cacheService) {
    try {
        // Validate input
        const params = searchStoriesSchema.parse(args);
        // Generate cache key
        const cacheKey = cacheService_js_1.CacheKeys.storySearch(params.query, params.searchFields);
        // Try to get from cache
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log(`Searching stories for: "${params.query}"`);
            // Search in Airtable
            const stories = await airtableService.searchStories(params.query, params.searchFields, params.limit);
            // Transform stories to standardized format
            const transformedStories = stories.map(story => airtableService.transformStory(story, {
                includePrivateFields: false,
                anonymizeAuthor: false,
            }));
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
        }, 1800 // 30 minute cache for search results
        );
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
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

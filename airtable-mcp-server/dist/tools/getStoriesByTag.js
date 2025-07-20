"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoriesByTagHandler = getStoriesByTagHandler;
const cacheService_js_1 = require("../services/cacheService.js");
const zod_1 = require("zod");
const getStoriesByTagSchema = zod_1.z.object({
    tags: zod_1.z.array(zod_1.z.string()).min(1),
    matchAll: zod_1.z.boolean().optional().default(false),
    limit: zod_1.z.number().min(1).max(100).optional().default(50),
});
async function getStoriesByTagHandler(args, airtableService, cacheService) {
    try {
        // Validate input
        const params = getStoriesByTagSchema.parse(args);
        // Generate cache key
        const cacheKey = cacheService_js_1.CacheKeys.storyTags(params.tags, params.matchAll);
        // Try to get from cache
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log(`Fetching stories by tags: ${params.tags.join(', ')}`);
            // Fetch from Airtable
            const stories = await airtableService.getStoriesByTag(params.tags, params.matchAll, params.limit);
            // Transform stories to standardized format
            const transformedStories = stories.map(story => airtableService.transformStory(story, {
                includePrivateFields: false,
                anonymizeAuthor: false,
            }));
            // Group stories by tags for analytics
            const tagCounts = {};
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
        }, 3600 // 1 hour cache
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

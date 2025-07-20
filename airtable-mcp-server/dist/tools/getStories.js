"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoriesHandler = getStoriesHandler;
const cacheService_js_1 = require("../services/cacheService.js");
const zod_1 = require("zod");
const getStoriesSchema = zod_1.z.object({
    organizationId: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(100).default(50),
    offset: zod_1.z.number().min(0).default(0),
    filters: zod_1.z.object({
        published: zod_1.z.boolean().optional(),
        storyType: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        dateRange: zod_1.z.object({
            start: zod_1.z.string().datetime().optional(),
            end: zod_1.z.string().datetime().optional(),
        }).optional(),
    }).optional(),
});
async function getStoriesHandler(args, airtableService, cacheService) {
    try {
        // Validate input
        const params = getStoriesSchema.parse(args || {});
        // Generate cache key
        const cacheKey = cacheService_js_1.CacheKeys.stories({
            ...params,
            timestamp: new Date().toISOString().split('T')[0], // Daily cache
        });
        // Try to get from cache
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log('Fetching stories from Airtable...');
            // Convert offset to Airtable offset string if needed
            const airtableOffset = params.offset > 0 ? undefined : undefined; // TODO: Implement offset conversion
            // Construct a clean filter object that matches the AirtableStoryFilters type
            const filters = {};
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
            const stories = await airtableService.getStories(filters, params.limit, airtableOffset);
            // Transform stories to standardized format
            const transformedStories = stories.map(story => airtableService.transformStory(story, {
                includePrivateFields: false,
                anonymizeAuthor: false,
            }));
            return {
                stories: transformedStories,
                total: transformedStories.length,
                hasMore: transformedStories.length === params.limit,
                offset: params.offset,
                limit: params.limit,
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

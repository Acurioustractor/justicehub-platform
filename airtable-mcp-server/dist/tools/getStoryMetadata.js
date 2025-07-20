"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryMetadataHandler = getStoryMetadataHandler;
const cacheService_js_1 = require("../services/cacheService.js");
const zod_1 = require("zod");
const getStoryMetadataSchema = zod_1.z.object({
    organizationId: zod_1.z.string().optional(),
});
async function getStoryMetadataHandler(args, airtableService, cacheService) {
    try {
        // Validate input
        const params = getStoryMetadataSchema.parse(args || {});
        // Generate cache key
        const cacheKey = cacheService_js_1.CacheKeys.metadata(params.organizationId);
        // Try to get from cache
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log('Fetching story metadata from Airtable...');
            // Fetch metadata from Airtable
            const metadata = await airtableService.getStoryMetadata(params.organizationId);
            // Enhance metadata with additional insights
            const totalStories = metadata.totalStories;
            const avgStoriesPerAuthor = totalStories > 0
                ? totalStories / Object.keys(metadata.storiesByAuthor).length
                : 0;
            // Calculate top tags
            const topTags = Object.entries(metadata.storiesByTag)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([tag, count]) => ({ tag, count }));
            // Calculate top story types
            const topStoryTypes = Object.entries(metadata.storiesByType)
                .sort(([, a], [, b]) => b - a)
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
        }, 3600 // 1 hour cache for metadata
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

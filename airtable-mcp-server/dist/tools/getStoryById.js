"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryByIdHandler = getStoryByIdHandler;
const cacheService_js_1 = require("../services/cacheService.js");
const zod_1 = require("zod");
const getStoryByIdSchema = zod_1.z.object({
    recordId: zod_1.z.string(),
    includeMedia: zod_1.z.boolean().optional().default(true),
});
async function getStoryByIdHandler(args, airtableService, cacheService) {
    try {
        // Validate input
        const params = getStoryByIdSchema.parse(args);
        // Generate cache key
        const cacheKey = cacheService_js_1.CacheKeys.story(params.recordId);
        // Try to get from cache
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log(`Fetching story ${params.recordId} from Airtable...`);
            // Fetch from Airtable
            const story = await airtableService.getStoryById(params.recordId, params.includeMedia);
            if (!story) {
                return null;
            }
            // Transform story to standardized format
            return airtableService.transformStory(story, {
                includePrivateFields: false,
                anonymizeAuthor: false,
            });
        }, 7200 // 2 hour cache for individual stories
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
    }
    catch (error) {
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

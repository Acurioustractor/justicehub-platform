"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStoriesResource = handleStoriesResource;
exports.handleMetadataResource = handleMetadataResource;
const cacheService_js_1 = require("../services/cacheService.js");
async function handleStoriesResource(uri, airtableService, cacheService) {
    try {
        const cacheKey = cacheService_js_1.CacheKeys.resource(uri);
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log(`Handling stories resource: ${uri}`);
            let stories;
            let metadata = {};
            switch (uri) {
                case 'airtable://stories/all':
                    stories = await airtableService.getStories({ published: true }, 100);
                    metadata = {
                        description: 'All published stories',
                        count: stories.length,
                    };
                    break;
                case 'airtable://stories/recent':
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    stories = await airtableService.getStories({
                        published: true,
                        dateRange: {
                            start: thirtyDaysAgo.toISOString(),
                            end: new Date().toISOString(),
                        },
                    }, 50);
                    metadata = {
                        description: 'Recently published stories (last 30 days)',
                        count: stories.length,
                        dateRange: {
                            start: thirtyDaysAgo.toISOString(),
                            end: new Date().toISOString(),
                        },
                    };
                    break;
                case 'airtable://stories/featured':
                    // Get stories with specific tags or high engagement
                    stories = await airtableService.getStoriesByTag(['featured', 'spotlight'], false, // matchAll = false (match any)
                    20);
                    metadata = {
                        description: 'Featured stories for homepage',
                        count: stories.length,
                        tags: ['featured', 'spotlight'],
                    };
                    break;
                default:
                    throw new Error(`Unknown stories resource: ${uri}`);
            }
            // Transform stories
            const transformedStories = stories.map(story => airtableService.transformStory(story, {
                includePrivateFields: false,
                anonymizeAuthor: false,
            }));
            return {
                uri,
                ...metadata,
                stories: transformedStories,
                fetchedAt: new Date().toISOString(),
            };
        }, 3600 // 1 hour cache
        );
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        console.error(`Error handling stories resource ${uri}:`, error);
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        uri,
                    }, null, 2),
                },
            ],
        };
    }
}
async function handleMetadataResource(uri, airtableService, cacheService) {
    try {
        const cacheKey = cacheService_js_1.CacheKeys.resource(uri);
        const result = await cacheService.getOrSet(cacheKey, async () => {
            console.log(`Handling metadata resource: ${uri}`);
            let data;
            let description;
            switch (uri) {
                case 'airtable://metadata/tags':
                    const metadata = await airtableService.getStoryMetadata();
                    const tags = Object.entries(metadata.storiesByTag)
                        .map(([tag, count]) => ({ tag, count: count }))
                        .sort((a, b) => b.count - a.count);
                    data = {
                        tags,
                        totalTags: tags.length,
                        topTags: tags.slice(0, 20),
                    };
                    description = 'All available story tags';
                    break;
                case 'airtable://metadata/stats':
                    const stats = await airtableService.getStoryMetadata();
                    data = {
                        totalStories: stats.totalStories,
                        publishedStories: stats.publishedStories,
                        draftStories: stats.draftStories,
                        storiesByType: stats.storiesByType,
                        storiesByOrganization: stats.storiesByOrganization,
                        topAuthors: Object.entries(stats.storiesByAuthor)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10)
                            .map(([author, count]) => ({ author, count })),
                        lastUpdated: stats.lastUpdated,
                    };
                    description = 'Story statistics and analytics';
                    break;
                default:
                    throw new Error(`Unknown metadata resource: ${uri}`);
            }
            return {
                uri,
                description,
                data,
                fetchedAt: new Date().toISOString(),
            };
        }, 3600 // 1 hour cache
        );
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        console.error(`Error handling metadata resource ${uri}:`, error);
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        uri,
                    }, null, 2),
                },
            ],
        };
    }
}

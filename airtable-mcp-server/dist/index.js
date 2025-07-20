"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const dotenv_1 = __importDefault(require("dotenv"));
const cacheService_js_1 = require("./services/cacheService.js");
const airtableService_js_1 = require("./services/airtableService.js");
const getStories_js_1 = require("./tools/getStories.js");
const getStoryById_js_1 = require("./tools/getStoryById.js");
const searchStories_js_1 = require("./tools/searchStories.js");
const getStoriesByTag_js_1 = require("./tools/getStoriesByTag.js");
const getStoryMetadata_js_1 = require("./tools/getStoryMetadata.js");
const index_js_2 = require("./resources/index.js");
// Load environment variables
dotenv_1.default.config();
class AirtableMCPServer {
    constructor() {
        this.server = new index_js_1.Server({
            name: 'airtable-stories-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        this.airtableService = new airtableService_js_1.AirtableService({
            apiKey: process.env.AIRTABLE_API_KEY,
            baseId: process.env.AIRTABLE_BASE_ID,
            storiesTable: process.env.AIRTABLE_STORIES_TABLE || 'Stories',
        });
        this.cacheService = new cacheService_js_1.CacheService({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            },
            ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour default
        });
        this.setupHandlers();
    }
    setupHandlers() {
        // Tool handlers
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            console.log(`Tool request received: ${request.params.name}`);
            switch (request.params.name) {
                case 'get_stories':
                    return (0, getStories_js_1.getStoriesHandler)(request.params.arguments, this.airtableService, this.cacheService);
                case 'get_story_by_id':
                    return (0, getStoryById_js_1.getStoryByIdHandler)(request.params.arguments, this.airtableService, this.cacheService);
                case 'search_stories':
                    return (0, searchStories_js_1.searchStoriesHandler)(request.params.arguments, this.airtableService, this.cacheService);
                case 'get_stories_by_tag':
                    return (0, getStoriesByTag_js_1.getStoriesByTagHandler)(request.params.arguments, this.airtableService, this.cacheService);
                case 'get_story_metadata':
                    return (0, getStoryMetadata_js_1.getStoryMetadataHandler)(request.params.arguments, this.airtableService, this.cacheService);
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        });
        // Resource handlers
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            console.log(`Resource request received: ${request.params.uri}`);
            const uri = request.params.uri;
            if (uri.startsWith('airtable://stories/')) {
                return (0, index_js_2.handleStoriesResource)(uri, this.airtableService, this.cacheService);
            }
            else if (uri.startsWith('airtable://metadata/')) {
                return (0, index_js_2.handleMetadataResource)(uri, this.airtableService, this.cacheService);
            }
            throw new Error(`Unknown resource: ${uri}`);
        });
        // List resources
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            return {
                resources: [
                    {
                        uri: 'airtable://stories/all',
                        description: 'All published stories',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'airtable://stories/recent',
                        description: 'Recently published stories',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'airtable://stories/featured',
                        description: 'Featured stories for homepage',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'airtable://metadata/tags',
                        description: 'All available story tags',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'airtable://metadata/stats',
                        description: 'Story statistics and analytics',
                        mimeType: 'application/json',
                    },
                ],
            };
        });
        // List tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_stories',
                        description: 'Retrieve stories from Airtable with optional filters',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                organizationId: { type: 'string' },
                                limit: { type: 'number' },
                                offset: { type: 'number' },
                                filters: {
                                    type: 'object',
                                    properties: {
                                        published: { type: 'boolean' },
                                        storyType: { type: 'string' },
                                        tags: { type: 'array', items: { type: 'string' } },
                                        dateRange: {
                                            type: 'object',
                                            properties: {
                                                start: { type: 'string', format: 'date-time' },
                                                end: { type: 'string', format: 'date-time' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        name: 'get_story_by_id',
                        description: 'Get a specific story by Airtable record ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                recordId: { type: 'string' },
                                includeMedia: { type: 'boolean' },
                            },
                            required: ['recordId'],
                        },
                    },
                    {
                        name: 'search_stories',
                        description: 'Search stories by content, title, or tags',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string' },
                                searchFields: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    default: ['Title', 'Content', 'Tags'],
                                },
                                limit: { type: 'number' },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'get_stories_by_tag',
                        description: 'Retrieve stories with specific tags',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                tags: { type: 'array', items: { type: 'string' } },
                                matchAll: { type: 'boolean', default: false },
                                limit: { type: 'number' },
                            },
                            required: ['tags'],
                        },
                    },
                    {
                        name: 'get_story_metadata',
                        description: 'Get aggregated metadata about stories',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                organizationId: { type: 'string' },
                            },
                        },
                    },
                ],
            };
        });
    }
    async run() {
        console.log('Starting Airtable MCP Server...');
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.log('Airtable MCP Server connected and ready');
    }
}
const server = new AirtableMCPServer();
server.run().catch(error => {
    console.error('Error running MCP server:', error);
    process.exit(1);
});

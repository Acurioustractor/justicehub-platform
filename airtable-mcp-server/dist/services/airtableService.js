"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableService = void 0;
exports.fetchTableRecords = fetchTableRecords;
const airtable_1 = __importDefault(require("airtable"));
const errorHandling_js_1 = require("../utils/errorHandling.js");
class AirtableService {
    constructor(config) {
        this.base = new airtable_1.default({ apiKey: config.apiKey }).base(config.baseId);
        this.storiesTable = config.storiesTable;
        this.retryConfig = config.retryConfig || {};
    }
    /**
     * Fetch stories from Airtable with optional filters
     */
    async getStories(filters, limit, offset) {
        console.log(`Fetching stories with filters:`, filters);
        try {
            return await (0, errorHandling_js_1.withRetry)(async () => {
                // Create the select query
                const selectOptions = {
                    maxRecords: limit || 100,
                    view: 'Grid view',
                };
                // Add offset if provided (as string)
                if (offset) {
                    // @ts-ignore - Airtable types are incorrect, offset can be string
                    selectOptions.offset = offset;
                }
                let query = this.base(this.storiesTable).select(selectOptions);
                // Apply filters if provided
                if (filters) {
                    const filterFormula = this.buildFilterFormula(filters);
                    if (filterFormula) {
                        // @ts-ignore - Airtable types are incorrect
                        query = query.filterByFormula(filterFormula);
                    }
                }
                const records = await query.all();
                return records.map(record => ({
                    id: record.id,
                    fields: record.fields,
                    // @ts-ignore - Airtable types are incorrect
                    createdTime: record.createdTime
                }));
            }, this.retryConfig);
        }
        catch (error) {
            if (error instanceof errorHandling_js_1.AirtableError) {
                (0, errorHandling_js_1.logError)(error, { operation: 'getStories', filters, limit, offset });
                throw error;
            }
            else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const airtableError = new errorHandling_js_1.AirtableError(`Failed to fetch stories: ${errorMessage}`, errorHandling_js_1.ErrorType.UNKNOWN, { originalError: error, context: { filters, limit, offset } });
                (0, errorHandling_js_1.logError)(airtableError);
                throw airtableError;
            }
        }
    }
    /**
     * Get a specific story by ID
     */
    async getStoryById(recordId, includeMedia = true) {
        try {
            return await (0, errorHandling_js_1.withRetry)(async () => {
                const record = await this.base(this.storiesTable).find(recordId);
                return {
                    id: record.id,
                    fields: record.fields,
                    // @ts-ignore - Airtable types are incorrect
                    createdTime: record.createdTime
                };
            }, this.retryConfig);
        }
        catch (error) {
            // Handle not found errors differently - return null instead of throwing
            if (error instanceof errorHandling_js_1.AirtableError && error.type === errorHandling_js_1.ErrorType.NOT_FOUND) {
                console.warn(`Story with ID ${recordId} not found`);
                return null;
            }
            if (error instanceof errorHandling_js_1.AirtableError) {
                (0, errorHandling_js_1.logError)(error, { operation: 'getStoryById', recordId, includeMedia });
                throw error;
            }
            else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const airtableError = new errorHandling_js_1.AirtableError(`Failed to fetch story by ID: ${errorMessage}`, errorHandling_js_1.ErrorType.UNKNOWN, { originalError: error, context: { recordId, includeMedia } });
                (0, errorHandling_js_1.logError)(airtableError);
                throw airtableError;
            }
        }
    }
    /**
     * Search stories by content, title, or tags
     */
    async searchStories(query, searchFields = ['Title', 'Content', 'Tags'], limit = 50) {
        try {
            const searchTerms = query.split(' ').filter(term => term.length > 2);
            if (searchTerms.length === 0) {
                return [];
            }
            return await (0, errorHandling_js_1.withRetry)(async () => {
                const searchFormulas = searchTerms.map(term => {
                    const fieldSearches = searchFields.map(field => {
                        if (field === 'Tags') {
                            return `FIND(LOWER("${term}"), LOWER(CONCATENATE(Tags)))`;
                        }
                        return `FIND(LOWER("${term}"), LOWER({${field}}))`;
                    });
                    return `OR(${fieldSearches.join(', ')})`;
                });
                const formula = `AND(${searchFormulas.join(', ')})`;
                const records = await this.base(this.storiesTable)
                    .select({
                    maxRecords: limit,
                    filterByFormula: formula
                })
                    .all();
                return records.map(record => ({
                    id: record.id,
                    fields: record.fields,
                    // @ts-ignore - Airtable types are incorrect
                    createdTime: record.createdTime
                }));
            }, this.retryConfig);
        }
        catch (error) {
            if (error instanceof errorHandling_js_1.AirtableError) {
                (0, errorHandling_js_1.logError)(error, { operation: 'searchStories', query, searchFields, limit });
                throw error;
            }
            else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const airtableError = new errorHandling_js_1.AirtableError(`Failed to search stories: ${errorMessage}`, errorHandling_js_1.ErrorType.UNKNOWN, { originalError: error, context: { query, searchFields, limit } });
                (0, errorHandling_js_1.logError)(airtableError);
                throw airtableError;
            }
        }
    }
    /**
     * Get stories by tag(s)
     */
    async getStoriesByTag(tags, matchAll = false, limit = 50) {
        try {
            return await (0, errorHandling_js_1.withRetry)(async () => {
                const tagFormulas = tags.map(tag => `FIND(LOWER("${tag}"), LOWER(CONCATENATE(Tags)))`);
                const formula = matchAll
                    ? `AND(${tagFormulas.join(', ')})`
                    : `OR(${tagFormulas.join(', ')})`;
                const records = await this.base(this.storiesTable)
                    .select({
                    maxRecords: limit,
                    filterByFormula: formula
                })
                    .all();
                return records.map(record => ({
                    id: record.id,
                    fields: record.fields,
                    // @ts-ignore - Airtable types are incorrect
                    createdTime: record.createdTime
                }));
            }, this.retryConfig);
        }
        catch (error) {
            if (error instanceof errorHandling_js_1.AirtableError) {
                (0, errorHandling_js_1.logError)(error, { operation: 'getStoriesByTag', tags, matchAll, limit });
                throw error;
            }
            else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const airtableError = new errorHandling_js_1.AirtableError(`Failed to get stories by tag: ${errorMessage}`, errorHandling_js_1.ErrorType.UNKNOWN, { originalError: error, context: { tags, matchAll, limit } });
                (0, errorHandling_js_1.logError)(airtableError);
                throw airtableError;
            }
        }
    }
    /**
     * Get metadata about stories (tags, counts, etc.)
     */
    async getStoryMetadata(organizationId) {
        try {
            return await (0, errorHandling_js_1.withRetry)(async () => {
                // Get all stories (or filtered by organization)
                const query = this.base(this.storiesTable).select({
                    fields: ['Title', 'Story Type', 'Tags', 'Published', 'Organization', 'Author']
                });
                if (organizationId) {
                    // @ts-ignore - Airtable types are incorrect
                    query.filterByFormula(`{Organization} = "${organizationId}"`);
                }
                const records = await query.all();
                // Extract and count tags
                const allTags = [];
                records.forEach(record => {
                    const tags = record.fields['Tags'] || [];
                    allTags.push(...tags);
                });
                const tagCounts = allTags.reduce((acc, tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {});
                // Count by story type
                const storyTypeCounts = records.reduce((acc, record) => {
                    const storyType = record.fields['Story Type'] || 'Unknown';
                    acc[storyType] = (acc[storyType] || 0) + 1;
                    return acc;
                }, {});
                // Count by author
                const authorCounts = records.reduce((acc, record) => {
                    const author = record.fields['Author'] || 'Unknown';
                    acc[author] = (acc[author] || 0) + 1;
                    return acc;
                }, {});
                // Count by organization
                const organizationCounts = records.reduce((acc, record) => {
                    const organization = record.fields['Organization'] || 'Unknown';
                    acc[organization] = (acc[organization] || 0) + 1;
                    return acc;
                }, {});
                return {
                    totalStories: records.length,
                    publishedStories: records.filter(r => r.fields['Published']).length,
                    draftStories: records.filter(r => !r.fields['Published']).length,
                    storiesByType: storyTypeCounts,
                    storiesByTag: tagCounts,
                    storiesByAuthor: authorCounts,
                    storiesByOrganization: organizationCounts,
                    lastUpdated: new Date().toISOString()
                };
            }, this.retryConfig);
        }
        catch (error) {
            if (error instanceof errorHandling_js_1.AirtableError) {
                (0, errorHandling_js_1.logError)(error, { operation: 'getStoryMetadata', organizationId });
                throw error;
            }
            else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const airtableError = new errorHandling_js_1.AirtableError(`Failed to get story metadata: ${errorMessage}`, errorHandling_js_1.ErrorType.UNKNOWN, { originalError: error, context: { organizationId } });
                (0, errorHandling_js_1.logError)(airtableError);
                throw airtableError;
            }
        }
    }
    /**
     * Transform Airtable story to standardized format
     */
    transformStory(story, options = {}) {
        const { fields } = story;
        return {
            id: story.id,
            title: fields.Title || '',
            content: fields.Content || '',
            storyType: fields['Story Type'] || 'reflection',
            tags: fields.Tags || [],
            visibility: fields.Visibility || 'public',
            published: fields.Published || false,
            createdAt: new Date(fields['Created Date'] || story.createdTime),
            author: {
                name: options.anonymizeAuthor ? 'Anonymous' : (fields.Author || 'Unknown'),
                organization: fields.Organization || 'Unknown',
                anonymous: options.anonymizeAuthor || false
            },
            media: (fields['Media Attachments'] || []).map((attachment) => ({
                id: attachment.id,
                url: attachment.url,
                filename: attachment.filename,
                type: attachment.type,
                size: attachment.size,
                thumbnails: attachment.thumbnails ? {
                    small: attachment.thumbnails.small.url,
                    large: attachment.thumbnails.large.url
                } : undefined
            })),
            metadata: {
                wordCount: fields.Content ? fields.Content.split(/\s+/).length : 0,
                themes: fields.Themes || [],
                journeyStage: fields['Journey Stage'] || '',
                impactLevel: fields['Impact Level'] || '',
                viewCount: fields['View Count'] || 0,
                shareCount: fields['Share Count'] || 0
            },
            source: 'airtable',
            originalRecordId: story.id,
            lastSyncAt: new Date()
        };
    }
    /**
     * Build Airtable filter formula from filters object
     */
    buildFilterFormula(filters) {
        const conditions = [];
        if (filters.published !== undefined) {
            conditions.push(`{Published} = ${filters.published ? 'TRUE()' : 'FALSE()'}`);
        }
        if (filters.storyType) {
            conditions.push(`{Story Type} = "${filters.storyType}"`);
        }
        if (filters.author) {
            conditions.push(`{Author} = "${filters.author}"`);
        }
        if (filters.organization) {
            conditions.push(`{Organization} = "${filters.organization}"`);
        }
        if (filters.visibility) {
            conditions.push(`{Visibility} = "${filters.visibility}"`);
        }
        if (filters.tags && filters.tags.length > 0) {
            const tagConditions = filters.tags.map((tag) => `FIND(LOWER("${tag}"), LOWER(CONCATENATE(Tags)))`);
            conditions.push(`OR(${tagConditions.join(', ')})`);
        }
        if (filters.dateRange) {
            if (filters.dateRange.start) {
                conditions.push(`IS_AFTER({Created Date}, "${filters.dateRange.start}")`);
            }
            if (filters.dateRange.end) {
                conditions.push(`IS_BEFORE({Created Date}, "${filters.dateRange.end}")`);
            }
        }
        if (filters.hasMedia) {
            conditions.push(`LEN(Media Attachments) > 0`);
        }
        return conditions.length > 0
            ? `AND(${conditions.join(', ')})`
            : '';
    }
}
exports.AirtableService = AirtableService;
// For backward compatibility
async function fetchTableRecords(tableName) {
    try {
        const service = new AirtableService({
            apiKey: process.env.AIRTABLE_API_KEY || '',
            baseId: process.env.AIRTABLE_BASE_ID || '',
            storiesTable: tableName
        });
        const stories = await service.getStories();
        return stories.map(story => ({
            id: story.id,
            ...story.fields
        }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        (0, errorHandling_js_1.logError)(error instanceof errorHandling_js_1.AirtableError ? error : new errorHandling_js_1.AirtableError(`Failed to fetch table records: ${errorMessage}`, errorHandling_js_1.ErrorType.UNKNOWN, { originalError: error, context: { tableName } }));
        throw error;
    }
}

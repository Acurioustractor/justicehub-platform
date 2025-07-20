import Airtable from 'airtable';
import {
  AirtableStory,
  AirtableStoryFields,
  AirtableStoryFilters,
  TransformedStory,
  AirtableAttachment
} from '../types/airtable.js';
import {
  AirtableError,
  ErrorType,
  withRetry,
  logError,
  RetryConfig
} from '../utils/errorHandling.js';

// Type definitions to help with Airtable SDK
type FieldSet = Record<string, any>;

interface AirtableServiceConfig {
  apiKey: string;
  baseId: string;
  storiesTable: string;
  retryConfig?: Partial<RetryConfig>;
}

export class AirtableService {
  private base: Airtable.Base;
  private storiesTable: string;
  private retryConfig: Partial<RetryConfig>;
  
  constructor(config: AirtableServiceConfig) {
    this.base = new Airtable({ apiKey: config.apiKey }).base(config.baseId);
    this.storiesTable = config.storiesTable;
    this.retryConfig = config.retryConfig || {};
  }

  /**
   * Fetch stories from Airtable with optional filters
   */
  async getStories(filters?: AirtableStoryFilters, limit?: number, offset?: string): Promise<AirtableStory[]> {
    console.log(`Fetching stories with filters:`, filters);
    
    try {
      return await withRetry(async () => {
        // Create the select query
        const selectOptions: Airtable.SelectOptions<FieldSet> = {
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
          fields: record.fields as unknown as AirtableStoryFields,
          // @ts-ignore - Airtable types are incorrect
          createdTime: record.createdTime
        }));
      }, this.retryConfig);
    } catch (error: unknown) {
      if (error instanceof AirtableError) {
        logError(error, { operation: 'getStories', filters, limit, offset });
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const airtableError = new AirtableError(
          `Failed to fetch stories: ${errorMessage}`,
          ErrorType.UNKNOWN,
          { originalError: error, context: { filters, limit, offset } }
        );
        logError(airtableError);
        throw airtableError;
      }
    }
  }

  /**
   * Get a specific story by ID
   */
  async getStoryById(recordId: string, includeMedia: boolean = true): Promise<AirtableStory | null> {
    try {
      return await withRetry(async () => {
        const record = await this.base(this.storiesTable).find(recordId);
        
        return {
          id: record.id,
          fields: record.fields as unknown as AirtableStoryFields,
          // @ts-ignore - Airtable types are incorrect
          createdTime: record.createdTime
        };
      }, this.retryConfig);
    } catch (error: unknown) {
      // Handle not found errors differently - return null instead of throwing
      if (error instanceof AirtableError && error.type === ErrorType.NOT_FOUND) {
        console.warn(`Story with ID ${recordId} not found`);
        return null;
      }
      
      if (error instanceof AirtableError) {
        logError(error, { operation: 'getStoryById', recordId, includeMedia });
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const airtableError = new AirtableError(
          `Failed to fetch story by ID: ${errorMessage}`,
          ErrorType.UNKNOWN,
          { originalError: error, context: { recordId, includeMedia } }
        );
        logError(airtableError);
        throw airtableError;
      }
    }
  }

  /**
   * Search stories by content, title, or tags
   */
  async searchStories(query: string, searchFields: string[] = ['Title', 'Content', 'Tags'], limit: number = 50): Promise<AirtableStory[]> {
    try {
      const searchTerms = query.split(' ').filter(term => term.length > 2);
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      return await withRetry(async () => {
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
          fields: record.fields as unknown as AirtableStoryFields,
          // @ts-ignore - Airtable types are incorrect
          createdTime: record.createdTime
        }));
      }, this.retryConfig);
    } catch (error: unknown) {
      if (error instanceof AirtableError) {
        logError(error, { operation: 'searchStories', query, searchFields, limit });
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const airtableError = new AirtableError(
          `Failed to search stories: ${errorMessage}`,
          ErrorType.UNKNOWN,
          { originalError: error, context: { query, searchFields, limit } }
        );
        logError(airtableError);
        throw airtableError;
      }
    }
  }

  /**
   * Get stories by tag(s)
   */
  async getStoriesByTag(tags: string[], matchAll: boolean = false, limit: number = 50): Promise<AirtableStory[]> {
    try {
      return await withRetry(async () => {
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
          fields: record.fields as unknown as AirtableStoryFields,
          // @ts-ignore - Airtable types are incorrect
          createdTime: record.createdTime
        }));
      }, this.retryConfig);
    } catch (error: unknown) {
      if (error instanceof AirtableError) {
        logError(error, { operation: 'getStoriesByTag', tags, matchAll, limit });
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const airtableError = new AirtableError(
          `Failed to get stories by tag: ${errorMessage}`,
          ErrorType.UNKNOWN,
          { originalError: error, context: { tags, matchAll, limit } }
        );
        logError(airtableError);
        throw airtableError;
      }
    }
  }

  /**
   * Get metadata about stories (tags, counts, etc.)
   */
  async getStoryMetadata(organizationId?: string): Promise<any> {
    try {
      return await withRetry(async () => {
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
        const allTags: string[] = [];
        records.forEach(record => {
          const tags = record.fields['Tags'] as string[] || [];
          allTags.push(...tags);
        });
        
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Count by story type
        const storyTypeCounts = records.reduce((acc, record) => {
          const storyType = record.fields['Story Type'] as string || 'Unknown';
          acc[storyType] = (acc[storyType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Count by author
        const authorCounts = records.reduce((acc, record) => {
          const author = record.fields['Author'] as string || 'Unknown';
          acc[author] = (acc[author] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Count by organization
        const organizationCounts = records.reduce((acc, record) => {
          const organization = record.fields['Organization'] as string || 'Unknown';
          acc[organization] = (acc[organization] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
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
    } catch (error: unknown) {
      if (error instanceof AirtableError) {
        logError(error, { operation: 'getStoryMetadata', organizationId });
        throw error;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const airtableError = new AirtableError(
          `Failed to get story metadata: ${errorMessage}`,
          ErrorType.UNKNOWN,
          { originalError: error, context: { organizationId } }
        );
        logError(airtableError);
        throw airtableError;
      }
    }
  }

  /**
   * Transform Airtable story to standardized format
   */
  transformStory(story: AirtableStory, options: {
    includePrivateFields?: boolean;
    anonymizeAuthor?: boolean;
  } = {}): TransformedStory {
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
      media: (fields['Media Attachments'] || []).map((attachment: AirtableAttachment) => ({
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
  private buildFilterFormula(filters: AirtableStoryFilters): string {
    const conditions: string[] = [];
    
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
      const tagConditions = filters.tags.map((tag: string) =>
        `FIND(LOWER("${tag}"), LOWER(CONCATENATE(Tags)))`
      );
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

// For backward compatibility
export async function fetchTableRecords(tableName: string) {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(error instanceof AirtableError ? error : new AirtableError(
      `Failed to fetch table records: ${errorMessage}`,
      ErrorType.UNKNOWN,
      { originalError: error, context: { tableName } }
    ));
    throw error;
  }
}
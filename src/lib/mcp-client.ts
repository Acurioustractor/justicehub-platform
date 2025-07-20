import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';

// Response schemas for type safety
const MCPResponseSchema = z.object({
  content: z.array(z.object({
    type: z.string(),
    text: z.string(),
  })),
  isError: z.boolean().optional(),
});

const StoriesResponseSchema = z.object({
  stories: z.array(z.any()),
  total: z.number(),
  hasMore: z.boolean().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
});

const StoryResponseSchema = z.any(); // TransformedStory type

const SearchResponseSchema = z.object({
  stories: z.array(z.any()),
  total: z.number(),
  query: z.string(),
  searchFields: z.array(z.string()),
});

const MetadataResponseSchema = z.object({
  totalStories: z.number(),
  publishedStories: z.number(),
  draftStories: z.number(),
  storiesByType: z.record(z.number()),
  storiesByTag: z.record(z.number()),
  storiesByAuthor: z.record(z.number()),
  storiesByOrganization: z.record(z.number()),
  insights: z.any().optional(),
  lastUpdated: z.string(),
});

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport;
  private connected: boolean = false;

  constructor() {
    this.client = new Client({
      name: 'justicehub-api',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    // Configure transport to connect to MCP server
    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['/app/airtable-mcp-server/dist/index.js'],
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production',
      },
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      await this.client.connect(this.transport);
      this.connected = true;
      console.log('✅ Connected to Airtable MCP server');
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      throw new Error('MCP server connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    
    await this.client.close();
    this.connected = false;
  }

  private async callTool(toolName: string, args: any): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      const response = MCPResponseSchema.parse(result);
      
      if (response.isError) {
        throw new Error(response.content[0]?.text || 'Unknown MCP error');
      }

      // Parse the JSON response
      const data = JSON.parse(response.content[0]?.text || '{}');
      return data;
    } catch (error) {
      console.error(`MCP tool error (${toolName}):`, error);
      throw error;
    }
  }

  async getStories(params: {
    organizationId?: string;
    limit?: number;
    offset?: number;
    filters?: {
      published?: boolean;
      storyType?: string;
      tags?: string[];
      dateRange?: {
        start: string;
        end: string;
      };
    };
  }) {
    const result = await this.callTool('get_stories', params);
    return StoriesResponseSchema.parse(result);
  }

  async getStoryById(recordId: string, includeMedia: boolean = true) {
    const result = await this.callTool('get_story_by_id', {
      recordId,
      includeMedia,
    });
    return StoryResponseSchema.parse(result);
  }

  async searchStories(query: string, searchFields?: string[], limit?: number) {
    const result = await this.callTool('search_stories', {
      query,
      searchFields,
      limit,
    });
    return SearchResponseSchema.parse(result);
  }

  async getStoriesByTag(tags: string[], matchAll: boolean = false, limit?: number) {
    const result = await this.callTool('get_stories_by_tag', {
      tags,
      matchAll,
      limit,
    });
    return result;
  }

  async getStoryMetadata(organizationId?: string) {
    const result = await this.callTool('get_story_metadata', {
      organizationId,
    });
    return MetadataResponseSchema.parse(result);
  }

  async getResource(uri: string) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const result = await this.client.getResource({ uri });
      
      if (!result.contents?.[0]) {
        throw new Error('No content returned from resource');
      }

      const data = JSON.parse(result.contents[0].text || '{}');
      return data;
    } catch (error) {
      console.error(`MCP resource error (${uri}):`, error);
      throw error;
    }
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', async () => {
    if (mcpClient) {
      await mcpClient.disconnect();
    }
  });
}
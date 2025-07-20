# Airtable MCP Server for JusticeHub

This Model Context Protocol (MCP) server provides a bridge between the JusticeHub platform and Airtable, enabling seamless access to existing story collections with caching and performance optimization.

## Features

- **Comprehensive Story Access**: Retrieve stories with flexible filtering options
- **Full-Text Search**: Search across story titles, content, and tags
- **Tag-Based Discovery**: Find stories by specific tags with AND/OR matching
- **Metadata Analytics**: Get aggregated insights about story collections
- **Redis Caching**: High-performance caching layer for optimal response times
- **Error Handling**: Robust error handling with automatic retries
- **Type Safety**: Full TypeScript support with Zod validation

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  JusticeHub API │────▶│   MCP Server    │────▶│    Airtable     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Redis Cache    │
                        └─────────────────┘
```

## Tools

### 1. `get_stories`
Retrieve stories from Airtable with optional filters.

**Parameters:**
- `organizationId` (optional): Filter by organization
- `limit` (optional): Maximum number of stories (default: 50, max: 100)
- `offset` (optional): Pagination offset
- `filters` (optional):
  - `published`: Boolean filter for published status
  - `storyType`: Filter by story type
  - `tags`: Array of tags to filter by
  - `dateRange`: Filter by date range

### 2. `get_story_by_id`
Get a specific story by Airtable record ID.

**Parameters:**
- `recordId` (required): Airtable record ID
- `includeMedia` (optional): Include media attachments (default: true)

### 3. `search_stories`
Search stories by content, title, or tags.

**Parameters:**
- `query` (required): Search query (min 2 characters)
- `searchFields` (optional): Fields to search (default: ['Title', 'Content', 'Tags'])
- `limit` (optional): Maximum results (default: 50)

### 4. `get_stories_by_tag`
Retrieve stories with specific tags.

**Parameters:**
- `tags` (required): Array of tags to match
- `matchAll` (optional): Match all tags (AND) or any tag (OR) (default: false)
- `limit` (optional): Maximum results (default: 50)

### 5. `get_story_metadata`
Get aggregated metadata about stories.

**Parameters:**
- `organizationId` (optional): Filter by organization

## Resources

- `airtable://stories/all`: All published stories
- `airtable://stories/recent`: Recently published stories (last 30 days)
- `airtable://stories/featured`: Featured stories for homepage
- `airtable://metadata/tags`: All available story tags
- `airtable://metadata/stats`: Story statistics and analytics

## Setup

### Environment Variables

Create a `.env` file:

```env
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_STORIES_TABLE=Stories

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password

# Cache Configuration
CACHE_TTL=3600
```

### Installation

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Run in development
npm run dev

# Run in production
npm start
```

### Docker

```bash
# Build image
docker build -t airtable-mcp-server .

# Run container
docker run -d \
  --name airtable-mcp \
  -e AIRTABLE_API_KEY=your_key \
  -e AIRTABLE_BASE_ID=your_base \
  -e REDIS_HOST=redis \
  airtable-mcp-server
```

## Development

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── services/
│   ├── airtableService.ts # Airtable API client
│   └── cacheService.ts    # Redis cache service
├── tools/                # MCP tool implementations
│   ├── getStories.ts
│   ├── getStoryById.ts
│   ├── searchStories.ts
│   ├── getStoriesByTag.ts
│   └── getStoryMetadata.ts
├── resources/            # MCP resource handlers
│   └── index.ts
├── types/               # TypeScript type definitions
│   └── airtable.ts
└── utils/               # Utility functions
    └── errorHandling.ts
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Cache Management

The Redis cache uses the following key patterns:
- Stories: `airtable_mcp:stories:{filters}`
- Individual story: `airtable_mcp:story:{id}`
- Search results: `airtable_mcp:search:{query}:{fields}`
- Tag queries: `airtable_mcp:tags:{tags}:{matchAll}`
- Metadata: `airtable_mcp:metadata:{orgId}`
- Resources: `airtable_mcp:resource:{uri}`

Cache TTL defaults:
- General queries: 1 hour
- Individual stories: 2 hours
- Search results: 30 minutes
- Metadata: 1 hour

## Performance Optimization

1. **Caching Strategy**: All Airtable requests are cached in Redis with appropriate TTLs
2. **Batch Operations**: Support for batch fetching to minimize API calls
3. **Connection Pooling**: Redis connections are pooled for efficiency
4. **Error Retry**: Automatic retry with exponential backoff for transient errors
5. **Rate Limiting**: Respects Airtable API rate limits

## Error Handling

The server implements comprehensive error handling:
- Validation errors return clear messages
- Airtable API errors are properly categorized
- Network errors trigger automatic retries
- Cache failures gracefully fallback to direct API calls

## Security

- API keys are never exposed in logs or responses
- Input validation on all tool parameters
- Sanitization of user-provided search queries
- Optional field anonymization for privacy

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Run linting before commits

## License

MIT License - See LICENSE file for details
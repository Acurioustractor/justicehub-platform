export interface AirtableStory {
  id: string; // Airtable record ID
  fields: AirtableStoryFields;
  createdTime: string;
}

export interface AirtableStoryFields {
  Title: string;
  Content: string;
  'Story Type': string;
  Tags: string[];
  Published: boolean;
  'Created Date': string;
  Author: string;
  'Author Email': string;
  Organization: string;
  Visibility: string;
  'Media Attachments': AirtableAttachment[];
  Themes: string[];
  'Journey Stage': string;
  'Impact Level': string;
  'Share Count': number;
  'View Count': number;
  Notes: string;
}

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small: AirtableThumbnail;
    large: AirtableThumbnail;
    full: AirtableThumbnail;
  };
}

export interface AirtableThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface AirtableConfig {
  baseId: string;
  apiKey: string;
  storiesTable: string;
  syncEnabled: boolean;
  syncFrequency: SyncFrequency;
  lastSyncAt?: Date;
  fieldMapping: AirtableFieldMapping;
  syncFilters: AirtableSyncFilters;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface AirtableFieldMapping {
  title: string;
  content: string;
  tags: string;
  storyType: string;
  visibility: string;
  createdDate: string;
  author: string;
  authorEmail: string;
  organization: string;
  media: string;
  themes: string;
  journeyStage: string;
  impactLevel: string;
  published: string;
  notes: string;
}

export interface AirtableSyncFilters {
  includePublished: boolean;
  includeDrafts: boolean;
  tagFilters: string[];
  organizationFilter?: string;
  authorFilter?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  storyTypeFilters: string[];
  visibilityFilters: string[];
}

export interface AirtableSyncResult {
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: AirtableSyncError[];
  duration: number;
  startedAt: Date;
  completedAt: Date;
}

export interface AirtableSyncError {
  recordId: string;
  error: string;
  field?: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
}

export interface AirtableSyncLog {
  id: string;
  organizationId: string;
  syncType: AirtableSyncType;
  syncParams: AirtableSyncParams;
  result: AirtableSyncResult;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
}

export interface AirtableSyncParams {
  fullSync: boolean;
  forceUpdate: boolean;
  filters: AirtableSyncFilters;
  batchSize: number;
  maxRecords?: number;
}

export interface AirtableWebhookPayload {
  base: {
    id: string;
  };
  webhook: {
    id: string;
  };
  timestamp: string;
  changedTablesById: Record<string, AirtableTableChanges>;
}

export interface AirtableTableChanges {
  changedRecordsById: Record<string, AirtableRecordChange>;
  createdRecordsById: Record<string, AirtableRecordChange>;
  destroyedRecordIds: string[];
}

export interface AirtableRecordChange {
  current?: {
    cellValuesByFieldId: Record<string, any>;
    createdTime: string;
  };
  previous?: {
    cellValuesByFieldId: Record<string, any>;
  };
}

export interface AirtableMetadata {
  totalStories: number;
  publishedStories: number;
  draftStories: number;
  storiesByType: Record<string, number>;
  storiesByTag: Record<string, number>;
  storiesByAuthor: Record<string, number>;
  storiesByOrganization: Record<string, number>;
  averageWordCount: number;
  lastUpdated: Date;
  syncHealth: AirtableSyncHealth;
}

export interface AirtableSyncHealth {
  status: 'healthy' | 'warning' | 'error';
  lastSuccessfulSync: Date;
  consecutiveFailures: number;
  errorRate: number;
  avgSyncDuration: number;
  issues: AirtableSyncIssue[];
}

export interface AirtableSyncIssue {
  type: 'field_mapping' | 'api_limit' | 'permission' | 'data_validation' | 'network';
  description: string;
  count: number;
  lastOccurred: Date;
  resolution?: string;
}

// MCP Server specific types
export interface AirtableMCPTools {
  get_stories: {
    description: "Retrieve stories from Airtable with optional filters";
    inputSchema: {
      organizationId?: string;
      limit?: number;
      offset?: number;
      filters?: AirtableStoryFilters;
    };
  };
  get_story_by_id: {
    description: "Get a specific story by Airtable record ID";
    inputSchema: {
      recordId: string;
      includeMedia?: boolean;
    };
  };
  search_stories: {
    description: "Search stories by content, title, or tags";
    inputSchema: {
      query: string;
      searchFields?: string[];
      limit?: number;
    };
  };
  get_stories_by_tag: {
    description: "Retrieve stories with specific tags";
    inputSchema: {
      tags: string[];
      matchAll?: boolean;
      limit?: number;
    };
  };
  get_story_metadata: {
    description: "Get aggregated metadata about stories";
    inputSchema: {
      organizationId?: string;
    };
  };
}

export interface AirtableStoryFilters {
  published?: boolean;
  storyType?: string;
  tags?: string[];
  author?: string;
  organization?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  visibility?: string;
  hasMedia?: boolean;
}

export interface AirtableMCPResources {
  "airtable://stories/all": {
    description: "All published stories";
    mimeType: "application/json";
  };
  "airtable://stories/recent": {
    description: "Recently published stories";
    mimeType: "application/json";
  };
  "airtable://stories/featured": {
    description: "Featured stories for homepage";
    mimeType: "application/json";
  };
  "airtable://metadata/tags": {
    description: "All available story tags";
    mimeType: "application/json";
  };
  "airtable://metadata/stats": {
    description: "Story statistics and analytics";
    mimeType: "application/json";
  };
}

export interface AirtableCache {
  key: string;
  data: any;
  expiresAt: Date;
  version: string;
  lastUpdated: Date;
}

export interface AirtableCacheConfig {
  ttl: number; // seconds
  maxSize: number; // number of entries
  checkPeriod: number; // seconds for cleanup
  staleWhileRevalidate: boolean;
}

// Transform utilities
export interface StoryTransformOptions {
  includePrivateFields: boolean;
  anonymizeAuthor: boolean;
  includeMetadata: boolean;
  formatForDisplay: boolean;
}

export interface TransformedStory {
  id: string;
  title: string;
  content: string;
  storyType: string;
  tags: string[];
  visibility: string;
  published: boolean;
  createdAt: Date;
  author: {
    name: string;
    organization: string;
    anonymous: boolean;
  };
  media: TransformedMedia[];
  metadata: {
    wordCount: number;
    themes: string[];
    journeyStage: string;
    impactLevel: string;
    viewCount: number;
    shareCount: number;
  };
  source: 'airtable';
  originalRecordId: string;
  lastSyncAt: Date;
}

export interface TransformedMedia {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
  thumbnails?: {
    small: string;
    large: string;
  };
}

// Enums and types
export type SyncFrequency = 'manual' | 'hourly' | 'daily' | 'weekly';
export type AirtableSyncType = 'full' | 'incremental' | 'webhook' | 'manual';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// API response types
export interface AirtableListResponse<T> {
  records: T[];
  offset?: string;
}

export interface AirtableErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

export interface AirtableRateLimitInfo {
  remaining: number;
  resetTime: Date;
  limit: number;
}
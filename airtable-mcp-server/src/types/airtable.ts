// Airtable story types
export interface AirtableStory {
  id: string;
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
  'Author Email'?: string;
  Organization?: string;
  Visibility?: string;
  'Media Attachments'?: AirtableAttachment[];
  Themes?: string[];
  'Journey Stage'?: string;
  'Impact Level'?: string;
  'Share Count'?: number;
  'View Count'?: number;
  Notes?: string;
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

// Filters for Airtable queries
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

// Transformed story format
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

// Cache related types
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
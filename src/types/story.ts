export interface Story {
  id: string;
  userId: string;
  organizationId?: string;
  airtableRecordId?: string;
  title: string;
  content: string;
  metadata: StoryMetadata;
  storyType: StoryType;
  visibility: VisibilityLevel;
  source: StorySource;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
  media?: StoryMedia[];
  insights?: AIInsight[];
}

export interface StoryMedia {
  id: string;
  storyId: string;
  filePath: string;
  airtableAttachmentId?: string;
  fileType: string;
  mimeType: string;
  metadata: MediaMetadata;
  createdAt: Date;
}

export interface StoryMetadata {
  wordCount: number;
  readingTime: number;
  themes: string[];
  sentiment?: number;
  aiInsights?: AIInsight[];
  lastAnalyzed?: Date;
  shareCount?: number;
  viewCount?: number;
}

export interface AIInsight {
  type: InsightType;
  confidence: number;
  description: string;
  suggestions?: string[];
  createdAt: Date;
}

export interface MediaMetadata {
  originalName: string;
  size: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  alt?: string;
  caption?: string;
  transcription?: string;
}

export interface StoryFilter {
  search?: string;
  tags?: string[];
  storyType?: StoryType;
  visibility?: VisibilityLevel;
  source?: StorySource;
  dateRange?: {
    start: Date;
    end: Date;
  };
  youthProfileId?: string;
  organizationId?: string;
}

export interface StoryCreate {
  title: string;
  content: string;
  storyType: StoryType;
  visibility: VisibilityLevel;
  tags: string[];
  media?: File[];
}

export interface StoryUpdate {
  title?: string;
  content?: string;
  storyType?: StoryType;
  visibility?: VisibilityLevel;
  tags?: string[];
  published?: boolean;
}

export interface StoryShare {
  storyId: string;
  shareWith: ShareTarget[];
  message?: string;
  expiresAt?: Date;
}

export interface ShareTarget {
  type: 'mentor' | 'organization' | 'public' | 'specific_user';
  targetId?: string;
  permissions: SharePermission[];
}

export interface StoryAnalytics {
  storyId: string;
  views: number;
  shares: number;
  comments: number;
  reactions: Record<string, number>;
  engagement: number;
  timeSpent: number;
  lastViewedAt: Date;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryReaction {
  id: string;
  storyId: string;
  userId: string;
  type: ReactionType;
  createdAt: Date;
}

export interface StoryExport {
  format: 'pdf' | 'docx' | 'html' | 'json';
  includeMedia: boolean;
  includeInsights: boolean;
  template?: string;
}

// Enums and types
export type StoryType = 'reflection' | 'milestone' | 'challenge' | 'achievement' | 'goal' | 'update';
export type VisibilityLevel = 'private' | 'mentors_only' | 'organization' | 'public' | 'anonymous';
export type StorySource = 'local' | 'airtable';
export type InsightType = 'theme' | 'sentiment' | 'skill' | 'goal' | 'challenge' | 'pattern';
export type SharePermission = 'view' | 'comment' | 'share';
export type ReactionType = 'like' | 'love' | 'support' | 'celebrate' | 'inspire';

// Story template types
export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  storyType: StoryType;
  prompts: StoryPrompt[];
  tags: string[];
  isDefault: boolean;
}

export interface StoryPrompt {
  id: string;
  question: string;
  placeholder?: string;
  required: boolean;
  type: 'text' | 'textarea' | 'date' | 'select' | 'multiselect';
  options?: string[];
  order: number;
}

// Combined story view (local + Airtable)
export interface CombinedStory extends Omit<Story, 'source'> {
  source: StorySource;
  isEditable: boolean;
  originalData?: Record<string, any>;
  syncStatus?: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
}

export interface StoryCollection {
  id: string;
  name: string;
  description?: string;
  storyIds: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Story search and discovery
export interface StorySearchResult {
  stories: Story[];
  total: number;
  facets: {
    tags: { name: string; count: number }[];
    types: { name: string; count: number }[];
    sources: { name: string; count: number }[];
  };
  suggestions?: string[];
}

export interface StoryRecommendation {
  storyId: string;
  score: number;
  reason: string;
  context: 'similar_themes' | 'same_journey_stage' | 'mentor_shared' | 'trending';
}
/**
 * Enhanced Stories Types
 * 
 * Types for multimedia story content including blogs, interviews, videos, and photos
 */

export interface BaseStory {
  id: string;
  title: string;
  description: string;
  content?: string;
  author: StoryAuthor;
  tags: string[];
  category: StoryCategory;
  visibility: 'public' | 'network' | 'anonymous';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
  engagement: StoryEngagement;
  metadata: StoryMetadata;
}

export interface StoryAuthor {
  id: string;
  name: string;
  username?: string;
  age?: number;
  location?: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  anonymous: boolean;
}

export interface StoryEngagement {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  bookmarks: number;
}

export interface StoryMetadata {
  reading_time?: string;
  /** @deprecated Use impact_level instead - ALMA uses signals not scores */
  impact_score?: number;
  /** Impact indicator using categorical signals (High/Growing/Emerging) instead of numeric scores */
  impact_level?: 'high' | 'growing' | 'emerging';
  featured: boolean;
  editor_pick: boolean;
  community_choice: boolean;
  trigger_warnings?: string[];
  age_appropriate: boolean;
  content_rating: 'general' | 'mature' | 'sensitive';
}

// Blog Post Story
export interface BlogStory extends BaseStory {
  type: 'blog';
  content: string;
  excerpt: string;
  featured_image?: MediaAsset;
  gallery?: MediaAsset[];
  seo_metadata?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
}

// Interview Story
export interface InterviewStory extends BaseStory {
  type: 'interview';
  interviewee: InterviewParticipant;
  interviewer: InterviewParticipant;
  format: 'text' | 'audio' | 'video' | 'mixed';
  questions_and_answers: QnASection[];
  audio_file?: MediaAsset;
  video_file?: MediaAsset;
  transcript?: string;
  duration?: string; // for audio/video interviews
  interview_date: string;
  location?: string;
  themes: string[];
}

export interface InterviewParticipant {
  name: string;
  role?: string;
  organization?: string;
  bio?: string;
  avatar?: string;
  social_links?: SocialLink[];
}

export interface QnASection {
  id: string;
  question: string;
  answer: string;
  timestamp?: string; // for audio/video
  highlight: boolean;
  themes?: string[];
}

// Video Story
export interface VideoStory extends BaseStory {
  type: 'video';
  video_file: MediaAsset;
  thumbnail: MediaAsset;
  duration: string;
  captions?: MediaAsset[]; // VTT files
  transcript?: string;
  chapters?: VideoChapter[];
  quality_options?: VideoQuality[];
  streaming_urls?: StreamingURL[];
}

export interface VideoChapter {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  thumbnail?: string;
}

export interface VideoQuality {
  resolution: '480p' | '720p' | '1080p' | '4K';
  file_url: string;
  file_size: number;
  bitrate: number;
}

export interface StreamingURL {
  platform: 'youtube' | 'vimeo' | 'local';
  url: string;
  embed_code?: string;
}

// Photo Story
export interface PhotoStory extends BaseStory {
  type: 'photo';
  photos: PhotoAsset[];
  layout: 'grid' | 'carousel' | 'story' | 'mosaic';
  cover_photo: PhotoAsset;
  captions_enabled: boolean;
  photo_count: number;
}

export interface PhotoAsset extends MediaAsset {
  caption?: string;
  alt_text: string;
  location?: GeoLocation;
  taken_date?: string;
  camera_info?: CameraMetadata;
  photo_metadata: PhotoMetadata;
}

export interface PhotoMetadata {
  orientation: 'landscape' | 'portrait' | 'square';
  dominant_colors: string[];
  faces_detected: number;
  content_tags: string[];
  mood_tags: string[];
}

// Multimedia Story (Mixed Content)
export interface MultimediaStory extends BaseStory {
  type: 'multimedia';
  sections: MultimediaSection[];
  layout_template: 'magazine' | 'blog' | 'timeline' | 'custom';
  table_of_contents?: TOCItem[];
}

export interface MultimediaSection {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'quote' | 'gallery' | 'embed';
  order: number;
  content: any; // Dynamic based on type
  settings?: SectionSettings;
}

export interface SectionSettings {
  alignment?: 'left' | 'center' | 'right' | 'full-width';
  background_color?: string;
  padding?: string;
  margin?: string;
  animation?: string;
}

export interface TOCItem {
  id: string;
  title: string;
  anchor: string;
  level: number;
  estimated_read_time: string;
}

// Common Media Types
export interface MediaAsset {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  accessibility_description?: string;
  upload_date: string;
  storage_provider: 'local' | 'aws' | 'cloudinary' | 'supabase';
  cdn_url?: string;
  optimized_versions?: OptimizedAsset[];
}

export interface OptimizedAsset {
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'xlarge';
  url: string;
  width: number;
  height: number;
  file_size: number;
  format: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CameraMetadata {
  make?: string;
  model?: string;
  focal_length?: string;
  aperture?: string;
  iso?: number;
  shutter_speed?: string;
  flash?: boolean;
}

export interface SocialLink {
  platform: 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'website';
  url: string;
  handle?: string;
}

// Story Collections and Curation
export interface StoryCollection {
  id: string;
  title: string;
  description: string;
  cover_image?: MediaAsset;
  stories: string[]; // Story IDs
  curator: StoryAuthor;
  tags: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
  visibility: 'public' | 'private';
  collaboration_enabled: boolean;
}

export interface StoryComment {
  id: string;
  story_id: string;
  author: StoryAuthor;
  content: string;
  parent_comment_id?: string; // For nested comments
  likes: number;
  created_at: string;
  updated_at: string;
  status: 'published' | 'pending' | 'hidden';
  reported: boolean;
}

export interface StoryReaction {
  id: string;
  story_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'inspire' | 'support' | 'strength';
  created_at: string;
}

// Content Moderation
export interface ContentModerationFlag {
  id: string;
  story_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderator_id?: string;
  moderator_notes?: string;
  created_at: string;
  resolved_at?: string;
}

// Enums
export enum StoryCategory {
  TRANSFORMATION = 'transformation',
  ADVOCACY = 'advocacy',
  HEALING = 'healing',
  EDUCATION = 'education',
  SECOND_CHANCES = 'second_chances',
  FOSTER_CARE = 'foster_care',
  FAMILY_SUPPORT = 'family_support',
  LEGAL_JOURNEY = 'legal_journey',
  COMMUNITY_IMPACT = 'community_impact',
  MENTORSHIP = 'mentorship',
  ARTISTIC_EXPRESSION = 'artistic_expression',
  CAREER_SUCCESS = 'career_success'
}

export enum StoryStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  FEATURED = 'featured',
  ARCHIVED = 'archived',
  REMOVED = 'removed'
}

export enum ContentType {
  BLOG = 'blog',
  INTERVIEW = 'interview',
  VIDEO = 'video',
  PHOTO = 'photo',
  MULTIMEDIA = 'multimedia',
  PODCAST = 'podcast',
  LIVE_STORY = 'live_story'
}

// Union type for all story types
export type Story = BlogStory | InterviewStory | VideoStory | PhotoStory | MultimediaStory;

// Story feed and discovery
export interface StoryFeed {
  stories: Story[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  filters_applied: StoryFilter[];
  sort_by: StorySortOption;
}

export interface StoryFilter {
  type: 'category' | 'tag' | 'content_type' | 'author' | 'date_range' | 'engagement';
  value: any;
  label: string;
}

export enum StorySortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  MOST_LIKED = 'most_liked',
  MOST_VIEWED = 'most_viewed',
  MOST_COMMENTED = 'most_commented',
  TRENDING = 'trending',
  FEATURED = 'featured',
  RANDOM = 'random'
}

// Analytics and insights
export interface StoryAnalytics {
  story_id: string;
  total_views: number;
  unique_viewers: number;
  engagement_rate: number;
  average_time_spent: number;
  completion_rate: number;
  share_rate: number;
  demographic_data: DemographicInsight[];
  traffic_sources: TrafficSource[];
  peak_viewing_times: TimeSlot[];
  geographic_distribution: GeographicData[];
}

export interface DemographicInsight {
  age_group: string;
  percentage: number;
  engagement_rate: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export interface TimeSlot {
  hour: number;
  day_of_week: number;
  views: number;
}

export interface GeographicData {
  location: string;
  views: number;
  engagement_rate: number;
}
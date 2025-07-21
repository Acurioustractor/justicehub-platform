/**
 * Cross-Linking Gallery System Types
 * 
 * Types for a comprehensive gallery system that connects stories, services, organizations, and media
 */

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  content_type: ContentType;
  source_type: SourceType;
  source_id: string;
  media_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  featured: boolean;
  tags: string[];
  category: string;
  
  // Cross-linking data
  related_items: RelatedItem[];
  connections: ContentConnection[];
  
  // Engagement
  engagement: GalleryEngagement;
  
  // Display settings
  display_settings: DisplaySettings;
  
  // Source-specific data
  source_data: any; // Dynamic based on source_type
}

export interface RelatedItem {
  id: string;
  title: string;
  content_type: ContentType;
  source_type: SourceType;
  thumbnail_url?: string;
  relationship_type: RelationshipType;
  relationship_strength: number; // 0.0 to 1.0
}

export interface ContentConnection {
  target_id: string;
  target_type: SourceType;
  connection_type: ConnectionType;
  connection_strength: number;
  connection_reason: string[];
  created_at: string;
  verified: boolean;
}

export interface GalleryEngagement {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  collections_count: number;
  last_viewed?: string;
}

export interface DisplaySettings {
  layout_hint: LayoutHint;
  aspect_ratio?: AspectRatio;
  priority_score: number; // For sorting/featuring
  color_theme?: string[];
  animation_type?: AnimationType;
}

// Gallery Collection System
export interface GalleryCollection {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  curator: CollectionCurator;
  items: GalleryItem[];
  
  // Collection metadata
  collection_type: CollectionType;
  visibility: 'public' | 'private' | 'unlisted';
  collaborative: boolean;
  auto_populated: boolean;
  
  // Rules for auto-population
  inclusion_rules?: InclusionRule[];
  
  // Stats
  item_count: number;
  total_views: number;
  followers: number;
  
  created_at: string;
  updated_at: string;
  featured: boolean;
  tags: string[];
}

export interface CollectionCurator {
  id: string;
  name: string;
  type: 'user' | 'organization' | 'system' | 'ai';
  avatar_url?: string;
  bio?: string;
}

export interface InclusionRule {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  weight: number; // For scoring
}

// Gallery Feed and Discovery
export interface GalleryFeed {
  items: GalleryItem[];
  collections: GalleryCollection[];
  filters_applied: GalleryFilter[];
  sort_order: SortOrder;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    has_more: boolean;
  };
  suggestions: GalleryItem[];
}

export interface GalleryFilter {
  type: FilterType;
  value: any;
  label: string;
  active: boolean;
}

// Search and Discovery
export interface SearchResult {
  items: GalleryItem[];
  collections: GalleryCollection[];
  related_searches: string[];
  facets: SearchFacet[];
  total_results: number;
  search_time_ms: number;
}

export interface SearchFacet {
  field: string;
  label: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

// Cross-linking Intelligence
export interface ContentGraph {
  nodes: ContentNode[];
  edges: ContentEdge[];
  clusters: ContentCluster[];
  recommendations: RecommendationSet[];
}

export interface ContentNode {
  id: string;
  type: SourceType;
  title: string;
  category: string;
  tags: string[];
  importance_score: number;
  centrality_score: number;
}

export interface ContentEdge {
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  weight: number;
  confidence: number;
  created_by: 'user' | 'ai' | 'system';
}

export interface ContentCluster {
  id: string;
  title: string;
  description: string;
  node_ids: string[];
  cluster_score: number;
  representative_items: string[]; // Top 3-5 items that represent the cluster
}

export interface RecommendationSet {
  for_item_id: string;
  recommendations: RecommendationItem[];
  algorithm_used: string;
  confidence_score: number;
  explanation: string;
}

export interface RecommendationItem {
  item_id: string;
  score: number;
  reason_codes: string[];
  explanation: string;
}

// Analytics and Insights
export interface GalleryAnalytics {
  item_id: string;
  period: AnalyticsPeriod;
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrend[];
  cross_links: CrossLinkAnalytics[];
  user_journey: UserJourneyStep[];
}

export interface AnalyticsMetrics {
  views: number;
  unique_views: number;
  engagement_rate: number;
  average_time_spent: number;
  click_through_rate: number;
  share_rate: number;
  conversion_rate: number; // to related content
}

export interface AnalyticsTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change_percentage: number;
  significance: 'low' | 'medium' | 'high';
}

export interface CrossLinkAnalytics {
  target_id: string;
  target_type: SourceType;
  click_count: number;
  conversion_rate: number;
  bounce_rate: number;
}

export interface UserJourneyStep {
  step_order: number;
  content_id: string;
  content_type: SourceType;
  time_spent: number;
  action_taken: string;
  exit_point: boolean;
}

// Enums
export enum ContentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STORY = 'story',
  SERVICE = 'service',
  ORGANIZATION = 'organization',
  PERSON = 'person',
  EVENT = 'event',
  LOCATION = 'location',
  MIXED = 'mixed'
}

export enum SourceType {
  STORY_BLOG = 'story_blog',
  STORY_VIDEO = 'story_video',
  STORY_PHOTO = 'story_photo',
  STORY_INTERVIEW = 'story_interview',
  STORY_MULTIMEDIA = 'story_multimedia',
  SERVICE_LISTING = 'service_listing',
  ORGANIZATION_PROFILE = 'organization_profile',
  MENTOR_PROFILE = 'mentor_profile',
  YOUTH_PROFILE = 'youth_profile',
  OPPORTUNITY_LISTING = 'opportunity_listing',
  EVENT_LISTING = 'event_listing',
  RESOURCE_DOCUMENT = 'resource_document',
  GALLERY_COLLECTION = 'gallery_collection',
  USER_GENERATED = 'user_generated'
}

export enum RelationshipType {
  SIMILAR_CONTENT = 'similar_content',
  SAME_AUTHOR = 'same_author',
  SAME_ORGANIZATION = 'same_organization',
  SAME_TOPIC = 'same_topic',
  CHRONOLOGICAL = 'chronological',
  LOCATION_BASED = 'location_based',
  SERVICE_RELATED = 'service_related',
  INSPIRATIONAL = 'inspirational',
  EDUCATIONAL = 'educational',
  SUPPORTIVE = 'supportive',
  FOLLOW_UP = 'follow_up',
  PREREQUISITE = 'prerequisite',
  ALTERNATIVE = 'alternative'
}

export enum ConnectionType {
  REFERENCED_IN = 'referenced_in',
  INSPIRED_BY = 'inspired_by',
  RELATED_TO = 'related_to',
  PART_OF = 'part_of',
  SEQUEL_TO = 'sequel_to',
  RESPONSE_TO = 'response_to',
  COLLABORATION = 'collaboration',
  FEATURED_IN = 'featured_in',
  SUPPORTS = 'supports',
  COMPLEMENTS = 'complements'
}

export enum LayoutHint {
  CARD = 'card',
  HERO = 'hero',
  THUMBNAIL = 'thumbnail',
  BANNER = 'banner',
  STORY = 'story',
  GRID = 'grid',
  LIST = 'list',
  CAROUSEL = 'carousel',
  MASONRY = 'masonry',
  TIMELINE = 'timeline'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '3:4',
  WIDE = '21:9',
  CLASSIC = '4:3',
  STORY = '9:16'
}

export enum AnimationType {
  NONE = 'none',
  FADE = 'fade',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  PARALLAX = 'parallax',
  REVEAL = 'reveal'
}

export enum CollectionType {
  CURATED = 'curated',
  SMART = 'smart',
  TRENDING = 'trending',
  FEATURED = 'featured',
  PERSONAL = 'personal',
  ORGANIZATION = 'organization',
  TOPIC = 'topic',
  JOURNEY = 'journey',
  INSPIRATION = 'inspiration',
  RESOURCES = 'resources'
}

export enum FilterType {
  CONTENT_TYPE = 'content_type',
  SOURCE_TYPE = 'source_type',
  CATEGORY = 'category',
  TAG = 'tag',
  DATE_RANGE = 'date_range',
  AUTHOR = 'author',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  ENGAGEMENT = 'engagement',
  FEATURED = 'featured'
}

export enum SortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  MOST_VIEWED = 'most_viewed',
  MOST_LIKED = 'most_liked',
  TRENDING = 'trending',
  RELEVANCE = 'relevance',
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
  RANDOM = 'random',
  CURATED = 'curated'
}

export enum AnalyticsPeriod {
  LAST_24_HOURS = 'last_24_hours',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  ALL_TIME = 'all_time'
}

// Gallery View Components Types
export interface GalleryViewProps {
  items: GalleryItem[];
  collections?: GalleryCollection[];
  layout: GalleryLayout;
  filters?: GalleryFilter[];
  sortOrder?: SortOrder;
  onItemClick?: (item: GalleryItem) => void;
  onCollectionClick?: (collection: GalleryCollection) => void;
  onFilterChange?: (filters: GalleryFilter[]) => void;
  onSortChange?: (sort: SortOrder) => void;
  showCrosslinking?: boolean;
  maxCrosslinks?: number;
  loading?: boolean;
  error?: string;
}

export interface GalleryLayout {
  type: LayoutType;
  columns?: number;
  gap?: number;
  responsive?: boolean;
  masonry?: boolean;
  infinite_scroll?: boolean;
}

export enum LayoutType {
  GRID = 'grid',
  MASONRY = 'masonry',
  LIST = 'list',
  CAROUSEL = 'carousel',
  TIMELINE = 'timeline',
  MAP = 'map',
  GRAPH = 'graph',
  STORY = 'story'
}

// Cross-linking Configuration
export interface CrossLinkingConfig {
  enabled: boolean;
  max_links_per_item: number;
  min_relationship_strength: number;
  algorithms: CrossLinkingAlgorithm[];
  display_style: CrossLinkDisplayStyle;
  auto_update: boolean;
}

export interface CrossLinkingAlgorithm {
  name: string;
  weight: number;
  config: Record<string, any>;
  enabled: boolean;
}

export enum CrossLinkDisplayStyle {
  SIDEBAR = 'sidebar',
  INLINE = 'inline',
  MODAL = 'modal',
  BOTTOM = 'bottom',
  FLOATING = 'floating',
  OVERLAY = 'overlay'
}

// Export main union types
export type GalleryContent = GalleryItem | GalleryCollection;
export type ContentSource = Story | ServiceListing | OrganizationProfile | MentorProfile;

// Placeholder interfaces for referenced types
interface Story {
  id: string;
  title: string;
  type: string;
}

interface ServiceListing {
  id: string;
  name: string;
  organization: string;
}

interface OrganizationProfile {
  id: string;
  name: string;
  type: string;
}

interface MentorProfile {
  id: string;
  name: string;
  specialization: string;
}
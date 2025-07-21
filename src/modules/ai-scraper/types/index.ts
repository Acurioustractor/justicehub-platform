/**
 * AI Scraper Module Types
 * 
 * TypeScript definitions for the intelligent organizational data scraping system
 */

// Core data types
export interface OrganizationProfile {
  id: string;
  name: string;
  description: string;
  website_url?: string;
  email?: string;
  phone?: string;
  address?: Address;
  services: ServiceOffering[];
  target_demographics: TargetDemographic[];
  geographical_coverage: GeographicalCoverage;
  funding_sources: FundingSource[];
  capacity_indicators: CapacityIndicator[];
  metadata: ScrapingMetadata;
  quality_score: number;
  last_updated: Date;
  source_urls: string[];
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  subcategory?: string;
  eligibility_criteria: string[];
  cost: CostStructure;
  availability: AvailabilitySchedule;
  contact_info?: ContactInfo;
  outcomes_evidence?: string[];
}

export interface Address {
  street_address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
}

export interface TargetDemographic {
  age_range?: AgeRange;
  cultural_background?: string[];
  gender_identity?: string[];
  special_needs?: string[];
  risk_factors?: string[];
  legal_status?: string[];
}

export interface GeographicalCoverage {
  type: 'local' | 'regional' | 'state' | 'national' | 'online';
  boundaries?: {
    postcodes?: string[];
    suburbs?: string[];
    regions?: string[];
    states?: string[];
  };
  service_radius_km?: number;
}

export interface FundingSource {
  type: 'government' | 'private' | 'charitable' | 'corporate' | 'mixed';
  amount?: number;
  duration?: string;
  conditions?: string[];
  source_name?: string;
}

export interface CapacityIndicator {
  metric: string;
  value: number | string;
  unit?: string;
  timeframe?: string;
  source?: string;
  confidence_score: number;
}

// Scraping infrastructure types
export interface ScrapingMetadata {
  source_type: SourceType;
  discovery_method: DiscoveryMethod;
  extraction_method: ExtractionMethod;
  scraping_timestamp: Date;
  ai_processing_version: string;
  confidence_scores: ConfidenceScores;
  validation_status: ValidationStatus;
  data_lineage: DataLineage[];
}

export interface ConfidenceScores {
  overall: number;
  contact_info: number;
  services: number;
  demographics: number;
  geographical: number;
  funding: number;
}

export interface DataLineage {
  source_url: string;
  extraction_timestamp: Date;
  ai_model_used: string;
  human_validated: boolean;
  validation_notes?: string;
}

// AI processing types
export interface AIExtractionRequest {
  url: string;
  content_type: 'html' | 'pdf' | 'image' | 'text';
  extraction_goals: ExtractionGoal[];
  processing_priority: 'low' | 'medium' | 'high' | 'urgent';
  ai_model_preference?: 'openai' | 'anthropic' | 'auto';
}

export interface AIExtractionResult {
  request_id: string;
  extracted_data: Partial<OrganizationProfile>;
  confidence_scores: ConfidenceScores;
  processing_notes: string[];
  flagged_issues: QualityFlag[];
  processing_time_ms: number;
  ai_model_used: string;
}

export interface QualityFlag {
  type: 'accuracy' | 'completeness' | 'consistency' | 'relevance' | 'freshness';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_action?: string;
  auto_resolvable: boolean;
}

// Source and discovery types
export interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  base_url: string;
  api_endpoint?: string;
  scraping_config: ScrapingConfig;
  discovery_patterns: DiscoveryPattern[];
  update_frequency: UpdateFrequency;
  reliability_score: number;
  last_successful_scrape: Date;
  active: boolean;
}

export interface ScrapingConfig {
  rate_limit_ms: number;
  max_concurrent_requests: number;
  retry_attempts: number;
  timeout_ms: number;
  respect_robots_txt: boolean;
  user_agent: string;
  headers?: Record<string, string>;
  authentication?: AuthConfig;
}

export interface DiscoveryPattern {
  pattern_type: 'css_selector' | 'xpath' | 'regex' | 'ai_guided';
  pattern: string;
  expected_result_type: 'organization_link' | 'service_info' | 'contact_data';
  confidence_threshold: number;
}

export interface AuthConfig {
  type: 'api_key' | 'oauth' | 'basic' | 'bearer';
  credentials: Record<string, string>;
  refresh_mechanism?: string;
}

// Processing pipeline types
export interface ProcessingJob {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  source_urls: string[];
  configuration: ProcessingConfig;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  progress_percentage: number;
  estimated_completion?: Date;
}

export interface ProcessingConfig {
  ai_models: AIModelConfig[];
  quality_thresholds: QualityThresholds;
  validation_rules: ValidationRule[];
  output_format: OutputFormat;
  post_processing_steps: PostProcessingStep[];
}

export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model_name: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  fallback_model?: string;
}

export interface QualityThresholds {
  minimum_confidence_score: number;
  require_contact_info: boolean;
  minimum_service_descriptions: number;
  geographic_precision_required: boolean;
  funding_info_required: boolean;
}

export interface ValidationRule {
  field_path: string;
  validator_type: 'required' | 'format' | 'range' | 'custom';
  parameters: Record<string, any>;
  error_message: string;
  severity: 'warning' | 'error' | 'critical';
}

// Enums
export enum SourceType {
  GOVERNMENT_DATABASE = 'government_database',
  NGO_REGISTRY = 'ngo_registry',
  CHARITY_REGISTER = 'charity_register',
  LEGAL_AID_DIRECTORY = 'legal_aid_directory',
  COMMUNITY_DIRECTORY = 'community_directory',
  UNIVERSITY_PROGRAM = 'university_program',
  RESEARCH_DATABASE = 'research_database',
  SOCIAL_MEDIA = 'social_media',
  NEWS_SOURCE = 'news_source',
  GRANT_DATABASE = 'grant_database'
}

export enum DiscoveryMethod {
  DIRECT_CRAWL = 'direct_crawl',
  API_INTEGRATION = 'api_integration',
  RSS_MONITORING = 'rss_monitoring',
  SOCIAL_LISTENING = 'social_listening',
  REFERRAL_NETWORK = 'referral_network',
  AI_DISCOVERY = 'ai_discovery',
  HUMAN_SUBMISSION = 'human_submission'
}

export enum ExtractionMethod {
  AI_GUIDED = 'ai_guided',
  STRUCTURED_DATA = 'structured_data',
  HTML_PARSING = 'html_parsing',
  PDF_EXTRACTION = 'pdf_extraction',
  IMAGE_OCR = 'image_ocr',
  API_RESPONSE = 'api_response',
  MANUAL_ENTRY = 'manual_entry'
}

export enum ServiceCategory {
  LEGAL_SUPPORT = 'legal_support',
  MENTAL_HEALTH = 'mental_health',
  HOUSING_SUPPORT = 'housing_support',
  EDUCATION_TRAINING = 'education_training',
  EMPLOYMENT_SUPPORT = 'employment_support',
  FAMILY_SUPPORT = 'family_support',
  SUBSTANCE_ABUSE = 'substance_abuse',
  CULTURAL_SUPPORT = 'cultural_support',
  CRISIS_INTERVENTION = 'crisis_intervention',
  ADVOCACY = 'advocacy',
  PREVENTION_PROGRAMS = 'prevention_programs',
  REINTEGRATION = 'reintegration'
}

export enum ValidationStatus {
  PENDING = 'pending',
  AI_VALIDATED = 'ai_validated',
  HUMAN_VALIDATED = 'human_validated',
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
  APPROVED = 'approved'
}

export enum JobType {
  DISCOVERY = 'discovery',
  EXTRACTION = 'extraction',
  VALIDATION = 'validation',
  ENHANCEMENT = 'enhancement',
  MONITORING = 'monitoring',
  CLEANUP = 'cleanup'
}

export enum JobStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum JobPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum UpdateFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ON_DEMAND = 'on_demand'
}

export enum ExtractionGoal {
  ORGANIZATION_PROFILE = 'organization_profile',
  SERVICE_CATALOG = 'service_catalog',
  CONTACT_INFORMATION = 'contact_information',
  FUNDING_DATA = 'funding_data',
  CAPACITY_METRICS = 'capacity_metrics',
  GEOGRAPHICAL_COVERAGE = 'geographical_coverage',
  TARGET_DEMOGRAPHICS = 'target_demographics'
}

export enum OutputFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
  DATABASE_INSERT = 'database_insert',
  API_UPDATE = 'api_update'
}

export enum PostProcessingStep {
  GEOCODING = 'geocoding',
  DUPLICATE_DETECTION = 'duplicate_detection',
  ENTITY_LINKING = 'entity_linking',
  QUALITY_SCORING = 'quality_scoring',
  CATEGORIZATION = 'categorization',
  ENRICHMENT = 'enrichment'
}

export enum AgeRange {
  CHILDREN = 'children',      // 0-12
  YOUTH = 'youth',           // 13-17
  YOUNG_ADULTS = 'young_adults', // 18-25
  ADULTS = 'adults',         // 26-64
  SENIORS = 'seniors',       // 65+
  ALL_AGES = 'all_ages'
}

export enum CostStructure {
  FREE = 'free',
  SLIDING_SCALE = 'sliding_scale',
  FIXED_FEE = 'fixed_fee',
  INSURANCE_COVERED = 'insurance_covered',
  GOVERNMENT_FUNDED = 'government_funded',
  VARIES = 'varies',
  UNKNOWN = 'unknown'
}

export interface AvailabilitySchedule {
  timezone: string;
  business_hours?: WeeklySchedule;
  emergency_hours?: WeeklySchedule;
  appointment_only?: boolean;
  walk_ins_accepted?: boolean;
  seasonal_variations?: SeasonalSchedule[];
  holiday_schedule?: HolidaySchedule[];
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  open_time: string;
  close_time: string;
  breaks?: TimeSlot[];
  notes?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface SeasonalSchedule {
  season: string;
  start_date: string;
  end_date: string;
  schedule: WeeklySchedule;
}

export interface HolidaySchedule {
  holiday_name: string;
  date: string;
  status: 'closed' | 'modified' | 'emergency_only';
  modified_hours?: DaySchedule;
}

export interface ContactInfo {
  primary_contact?: PersonContact;
  department_contacts?: DepartmentContact[];
  emergency_contact?: EmergencyContact;
  intake_process?: IntakeProcess;
}

export interface PersonContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  languages_spoken?: string[];
  availability?: AvailabilitySchedule;
}

export interface DepartmentContact {
  department_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  services_covered: string[];
}

export interface EmergencyContact {
  available_24_7: boolean;
  phone?: string;
  email?: string;
  escalation_procedure?: string;
}

export interface IntakeProcess {
  method: 'phone' | 'email' | 'online_form' | 'walk_in' | 'referral_only';
  requirements?: string[];
  typical_wait_time?: string;
  documentation_needed?: string[];
  assessment_process?: string;
}
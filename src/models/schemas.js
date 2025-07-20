import Joi from 'joi';

// Based on Open Referral Human Services Data Specification (HSDS)
// Extended for Queensland Youth Justice specific requirements

export const ServiceSchema = Joi.object({
  // Core identification
  id: Joi.string().uuid().required(),
  name: Joi.string().min(3).max(255).required(),
  alternate_name: Joi.string().max(255).allow(null),
  description: Joi.string().max(5000).required(),
  
  // Service details
  url: Joi.string().uri().allow(null),
  email: Joi.string().email().allow(null),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
  interpretation_services: Joi.boolean().default(false),
  application_process: Joi.string().max(1000).allow(null),
  wait_time: Joi.string().max(255).allow(null),
  fees: Joi.string().max(1000).allow(null),
  accreditations: Joi.array().items(Joi.string()).default([]),
  
  // Youth-specific fields
  minimum_age: Joi.number().integer().min(0).max(25).allow(null),
  maximum_age: Joi.number().integer().min(0).max(25).allow(null),
  youth_specific: Joi.boolean().default(true),
  indigenous_specific: Joi.boolean().default(false),
  
  // Categorization
  categories: Joi.array().items(Joi.string()).min(1).required(),
  keywords: Joi.array().items(Joi.string()).default([]),
  
  // Metadata
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required(),
  last_verified_at: Joi.date().iso().allow(null),
  verification_status: Joi.string().valid('verified', 'unverified', 'pending', 'rejected').default('unverified'),
  data_source: Joi.string().max(255).required(),
  source_url: Joi.string().uri().allow(null),
  
  // Quality metrics
  completeness_score: Joi.number().min(0).max(1).default(0),
  verification_score: Joi.number().min(0).max(100).default(0),
  community_rating: Joi.number().min(0).max(5).allow(null),
  
  // Relationships
  organization_id: Joi.string().uuid().required(),
  location_ids: Joi.array().items(Joi.string().uuid()).min(1),
  contact_ids: Joi.array().items(Joi.string().uuid()).default([]),
  
  // Eligibility
  eligibility: Joi.object({
    description: Joi.string().max(1000).allow(null),
    requirements: Joi.array().items(Joi.string()).default([]),
    required_documents: Joi.array().items(Joi.string()).default([]),
    gender: Joi.string().valid('male', 'female', 'all', 'other').default('all'),
    citizenship_required: Joi.boolean().default(false),
    income_level: Joi.string().allow(null),
    geographic_restriction: Joi.string().allow(null)
  }).default({})
});

export const OrganizationSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(255).required(),
  alternate_name: Joi.string().max(255).allow(null),
  description: Joi.string().max(2000).allow(null),
  email: Joi.string().email().allow(null),
  url: Joi.string().uri().allow(null),
  tax_status: Joi.string().allow(null),
  tax_id: Joi.string().allow(null),
  year_incorporated: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null),
  legal_status: Joi.string().allow(null),
  logo_url: Joi.string().uri().allow(null),
  
  // Additional fields
  organization_type: Joi.string().valid(
    'government',
    'non_profit',
    'for_profit',
    'community',
    'indigenous',
    'religious',
    'educational',
    'healthcare'
  ).required(),
  
  accreditations: Joi.array().items(Joi.string()).default([]),
  funding_sources: Joi.array().items(Joi.string()).default([]),
  
  // Metadata
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required(),
  last_verified_at: Joi.date().iso().allow(null),
  verification_status: Joi.string().valid('verified', 'unverified', 'pending').default('unverified'),
  data_source: Joi.string().max(255).required()
});

export const LocationSchema = Joi.object({
  id: Joi.string().uuid().required(),
  service_id: Joi.string().uuid().required(),
  name: Joi.string().max(255).allow(null),
  alternate_name: Joi.string().max(255).allow(null),
  description: Joi.string().max(1000).allow(null),
  
  // Address
  address_1: Joi.string().max(255).required(),
  address_2: Joi.string().max(255).allow(null),
  city: Joi.string().max(100).required(),
  state_province: Joi.string().max(50).default('QLD'),
  postal_code: Joi.string().max(10).required(),
  country: Joi.string().max(2).default('AU'),
  
  // Geographic data
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  
  // Queensland-specific regions
  region: Joi.string().valid(
    'brisbane',
    'gold_coast',
    'sunshine_coast',
    'townsville',
    'cairns',
    'toowoomba',
    'mackay',
    'rockhampton',
    'bundaberg',
    'hervey_bay',
    'gladstone',
    'mount_isa',
    'remote_queensland'
  ).required(),
  
  // Service area
  service_area: Joi.object({
    type: Joi.string().valid('radius', 'polygon', 'postal_codes', 'suburbs').required(),
    value: Joi.alternatives().try(
      Joi.number(), // radius in km
      Joi.array().items(Joi.array().items(Joi.number())), // polygon coordinates
      Joi.array().items(Joi.string()) // postal codes or suburbs
    ).required()
  }).allow(null),
  
  // Accessibility
  wheelchair_accessible: Joi.boolean().default(false),
  public_transport_access: Joi.boolean().default(false),
  parking_available: Joi.boolean().default(false),
  
  // Metadata
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
});

export const ContactSchema = Joi.object({
  id: Joi.string().uuid().required(),
  service_id: Joi.string().uuid().allow(null),
  organization_id: Joi.string().uuid().allow(null),
  location_id: Joi.string().uuid().allow(null),
  
  name: Joi.string().max(255).allow(null),
  title: Joi.string().max(255).allow(null),
  department: Joi.string().max(255).allow(null),
  
  // Contact methods
  phone: Joi.array().items(Joi.object({
    number: Joi.string().pattern(/^[0-9\s\-\+\(\)]+$/).required(),
    extension: Joi.string().max(10).allow(null),
    type: Joi.string().valid('voice', 'fax', 'tty', 'hotline', 'sms').default('voice'),
    language: Joi.string().max(10).default('en'),
    description: Joi.string().max(255).allow(null)
  })).default([]),
  
  email: Joi.string().email().allow(null),
  
  // Metadata
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
});

export const ScheduleSchema = Joi.object({
  id: Joi.string().uuid().required(),
  service_id: Joi.string().uuid().allow(null),
  location_id: Joi.string().uuid().allow(null),
  
  // Regular hours
  regular_schedule: Joi.array().items(Joi.object({
    weekday: Joi.number().integer().min(0).max(6).required(), // 0 = Sunday
    opens_at: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    closes_at: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  })).default([]),
  
  // Holidays
  holiday_schedule: Joi.array().items(Joi.object({
    closed: Joi.boolean().required(),
    opens_at: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
    closes_at: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required()
  })).default([]),
  
  description: Joi.string().max(500).allow(null),
  
  // Metadata
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
});

export const TaxonomySchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().max(255).required(),
  parent_id: Joi.string().uuid().allow(null),
  vocabulary: Joi.string().max(255).allow(null),
  description: Joi.string().max(1000).allow(null),
  
  // Youth justice specific taxonomies
  youth_justice_category: Joi.string().valid(
    'prevention',
    'diversion',
    'court_support',
    'supervision',
    'detention',
    'reintegration',
    'family_support',
    'education_training',
    'mental_health',
    'substance_abuse',
    'housing',
    'legal_aid',
    'advocacy',
    'cultural_support'
  ).allow(null),
  
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
});

// Scraping specific schemas
export const ScrapingJobSchema = Joi.object({
  id: Joi.string().uuid().required(),
  source_name: Joi.string().max(255).required(),
  source_url: Joi.string().uri().required(),
  job_type: Joi.string().valid('discovery', 'update', 'deep_scan', 'verify').required(),
  status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').required(),
  priority: Joi.number().integer().min(0).max(10).default(5),
  
  // Configuration
  config: Joi.object({
    rate_limit: Joi.number().min(0).default(2), // requests per second
    max_pages: Joi.number().integer().min(1).default(1000),
    follow_links: Joi.boolean().default(true),
    respect_robots_txt: Joi.boolean().default(true),
    user_agent: Joi.string().max(255).allow(null),
    headers: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    firecrawl_options: Joi.object().default({})
  }).default({}),
  
  // Results
  pages_scraped: Joi.number().integer().min(0).default(0),
  services_found: Joi.number().integer().min(0).default(0),
  errors_count: Joi.number().integer().min(0).default(0),
  
  // Timing
  started_at: Joi.date().iso().allow(null),
  completed_at: Joi.date().iso().allow(null),
  next_run_at: Joi.date().iso().allow(null),
  
  // Metadata
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required(),
  created_by: Joi.string().max(255).allow(null)
});

export const DataQualitySchema = Joi.object({
  service_id: Joi.string().uuid().required(),
  
  // Completeness checks
  has_description: Joi.boolean().required(),
  has_contact: Joi.boolean().required(),
  has_location: Joi.boolean().required(),
  has_hours: Joi.boolean().required(),
  has_eligibility: Joi.boolean().required(),
  has_categories: Joi.boolean().required(),
  
  // Quality scores
  description_length: Joi.number().integer().min(0).required(),
  contact_methods_count: Joi.number().integer().min(0).required(),
  
  // Data freshness
  days_since_update: Joi.number().integer().min(0).required(),
  days_since_verification: Joi.number().integer().min(0).allow(null),
  
  // Overall scores
  completeness_score: Joi.number().min(0).max(1).required(),
  freshness_score: Joi.number().min(0).max(1).required(),
  overall_score: Joi.number().min(0).max(1).required(),
  
  // Recommendations
  quality_issues: Joi.array().items(Joi.object({
    field: Joi.string().required(),
    issue: Joi.string().required(),
    severity: Joi.string().valid('low', 'medium', 'high').required()
  })).default([]),
  
  calculated_at: Joi.date().iso().required()
});

// API request/response schemas
export const SearchRequestSchema = Joi.object({
  query: Joi.string().max(500).allow(''),
  
  // Filters
  categories: Joi.array().items(Joi.string()).default([]),
  age: Joi.number().integer().min(0).max(25).allow(null),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(0).max(500).default(50) // km
  }).allow(null),
  regions: Joi.array().items(Joi.string()).default([]),
  
  // Service attributes
  indigenous_specific: Joi.boolean().allow(null),
  wheelchair_accessible: Joi.boolean().allow(null),
  interpretation_services: Joi.boolean().allow(null),
  
  // Quality filters
  verified_only: Joi.boolean().default(false),
  min_quality_score: Joi.number().min(0).max(1).default(0),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  
  // Sorting
  sort_by: Joi.string().valid('relevance', 'name', 'distance', 'quality', 'updated').default('relevance'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

export const ServiceResponseSchema = Joi.object({
  data: Joi.array().items(ServiceSchema),
  meta: Joi.object({
    total: Joi.number().integer().min(0).required(),
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    pages: Joi.number().integer().min(0).required()
  }),
  facets: Joi.object({
    categories: Joi.object().pattern(Joi.string(), Joi.number()),
    regions: Joi.object().pattern(Joi.string(), Joi.number()),
    organization_types: Joi.object().pattern(Joi.string(), Joi.number())
  }).allow(null)
});
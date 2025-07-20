// Unified schema for Australian youth services data
import { v4 as uuidv4 } from 'uuid';

/**
 * Australian Youth Service Schema
 * Standardized format for all service data across Australia
 */
export const AustralianServiceSchema = {
  // Core identification
  id: String, // UUID
  external_id: String, // Original ID from source system
  
  // Basic information
  name: String,
  description: String,
  url: String,
  status: String, // active, inactive, under_review
  
  // Service classification
  categories: Array, // Standardized categories
  keywords: Array, // Search keywords
  service_types: Array, // Specific service offerings
  target_demographics: Array, // Who the service is for
  
  // Age specifications
  age_range: {
    minimum: Number,
    maximum: Number,
    description: String // e.g., "Young adults", "School age"
  },
  
  // Specific targeting
  youth_specific: Boolean,
  indigenous_specific: Boolean,
  culturally_specific: Array, // Cultural communities served
  disability_specific: Boolean,
  lgbti_specific: Boolean,
  
  // Organization details
  organization: {
    id: String,
    name: String,
    type: String, // government, non_profit, community, commercial, indigenous
    abn: String, // Australian Business Number
    registration_type: String, // charity, incorporated_association, etc.
    parent_organization: String,
    website: String
  },
  
  // Location information
  location: {
    name: String,
    address_line_1: String,
    address_line_2: String,
    suburb: String,
    city: String,
    state: String, // QLD, NSW, VIC, WA, SA, TAS, NT, ACT
    postcode: String,
    region: String, // Standardized region names
    lga: String, // Local Government Area
    coordinates: {
      latitude: Number,
      longitude: Number,
      accuracy: String // address, suburb, city
    },
    accessibility: {
      wheelchair_accessible: Boolean,
      public_transport: Boolean,
      parking_available: Boolean
    }
  },
  
  // Contact information
  contact: {
    phone: {
      primary: String,
      mobile: String,
      toll_free: String,
      crisis_line: String
    },
    email: {
      primary: String,
      intake: String,
      admin: String
    },
    website: String,
    social_media: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String
    },
    postal_address: {
      line_1: String,
      line_2: String,
      suburb: String,
      state: String,
      postcode: String
    }
  },
  
  // Service details
  service_details: {
    availability: {
      hours: String, // e.g., "9am-5pm weekdays"
      after_hours: Boolean,
      weekends: Boolean,
      public_holidays: Boolean,
      twenty_four_seven: Boolean
    },
    cost: {
      free: Boolean,
      fee_for_service: Boolean,
      bulk_billing: Boolean,
      sliding_scale: Boolean,
      cost_description: String
    },
    eligibility: {
      age_requirements: String,
      geographic_restrictions: Array,
      referral_required: Boolean,
      appointment_required: Boolean,
      criteria: String
    },
    languages: Array, // Languages spoken
    capacity: {
      individual: Boolean,
      group: Boolean,
      family: Boolean,
      maximum_clients: Number
    }
  },
  
  // Funding and governance
  funding: {
    government_funded: Boolean,
    funding_sources: Array, // Commonwealth, State, Local, Private
    contract_type: String,
    funding_period: {
      start_date: String,
      end_date: String
    }
  },
  
  // Data provenance
  data_source: {
    source_name: String, // e.g., "data.qld.gov.au", "askizzy"
    source_type: String, // api, scrape, foi, manual
    source_url: String,
    extraction_method: String,
    last_verified: Date,
    data_quality_score: Number, // 0-1 confidence score
    verification_status: String // verified, unverified, needs_review
  },
  
  // Metadata
  metadata: {
    created_at: Date,
    updated_at: Date,
    last_scraped: Date,
    scraping_notes: String,
    duplicate_check: {
      potential_duplicates: Array,
      similarity_score: Number
    },
    data_completeness: {
      contact_info: Number, // 0-1 score
      location_info: Number,
      service_details: Number,
      overall: Number
    }
  }
};

/**
 * Standardized category mapping for Australian services
 */
export const StandardizedCategories = {
  // Legal services
  LEGAL_AID: 'legal_aid',
  COURT_SUPPORT: 'court_support',
  CRIMINAL_LAW: 'criminal_law',
  FAMILY_LAW: 'family_law',
  VICTIM_SUPPORT: 'victim_support',
  
  // Mental health
  MENTAL_HEALTH: 'mental_health',
  COUNSELING: 'counselling',
  CRISIS_SUPPORT: 'crisis_support',
  SUICIDE_PREVENTION: 'suicide_prevention',
  PSYCHOLOGY: 'psychology',
  PSYCHIATRY: 'psychiatry',
  
  // Health services
  HEALTH_SERVICES: 'health_services',
  MEDICAL: 'medical',
  DENTAL: 'dental',
  SEXUAL_HEALTH: 'sexual_health',
  DRUG_ALCOHOL: 'drug_alcohol',
  
  // Housing and accommodation
  HOUSING: 'housing',
  CRISIS_ACCOMMODATION: 'crisis_accommodation',
  TRANSITIONAL_HOUSING: 'transitional_housing',
  HOMELESSNESS: 'homelessness',
  
  // Education and training
  EDUCATION_SUPPORT: 'education_support',
  TRAINING: 'training',
  LITERACY: 'literacy',
  VOCATIONAL_EDUCATION: 'vocational_education',
  CAREER_GUIDANCE: 'career_guidance',
  
  // Employment
  EMPLOYMENT: 'employment',
  JOB_PLACEMENT: 'job_placement',
  WORK_EXPERIENCE: 'work_experience',
  APPRENTICESHIPS: 'apprenticeships',
  
  // Family and relationships
  FAMILY_SUPPORT: 'family_support',
  PARENTING: 'parenting',
  DOMESTIC_VIOLENCE: 'domestic_violence',
  FAMILY_MEDIATION: 'family_mediation',
  
  // Youth development
  YOUTH_DEVELOPMENT: 'youth_development',
  MENTORING: 'mentoring',
  LEADERSHIP: 'leadership',
  SPORTS_RECREATION: 'sports_recreation',
  ARTS_CULTURE: 'arts_culture',
  
  // Cultural services
  CULTURAL_SUPPORT: 'cultural_support',
  INDIGENOUS_SERVICES: 'indigenous_services',
  MULTICULTURAL: 'multicultural',
  REFUGEE_SERVICES: 'refugee_services',
  
  // Financial support
  FINANCIAL_ASSISTANCE: 'financial_assistance',
  EMERGENCY_RELIEF: 'emergency_relief',
  CENTRELINK: 'centrelink',
  FINANCIAL_COUNSELING: 'financial_counselling',
  
  // Community services
  COMMUNITY_SERVICE: 'community_service',
  VOLUNTEER_PROGRAMS: 'volunteer_programs',
  COMMUNITY_DEVELOPMENT: 'community_development',
  
  // Transport
  TRANSPORT: 'transport',
  
  // Technology and digital
  DIGITAL_INCLUSION: 'digital_inclusion',
  TECHNOLOGY_TRAINING: 'technology_training'
};

/**
 * Australian state and territory mapping
 */
export const AustralianStates = {
  QLD: 'Queensland',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory'
};

/**
 * Organization type mapping
 */
export const OrganizationTypes = {
  GOVERNMENT: 'government',
  NON_PROFIT: 'non_profit',
  CHARITY: 'charity',
  COMMUNITY: 'community',
  COMMERCIAL: 'commercial',
  INDIGENOUS: 'indigenous',
  FAITH_BASED: 'faith_based',
  UNIVERSITY: 'university',
  HOSPITAL: 'hospital',
  SCHOOL: 'school'
};

/**
 * Data source types
 */
export const DataSourceTypes = {
  API: 'api',
  WEB_SCRAPE: 'web_scrape',
  FOI_REQUEST: 'foi_request',
  MANUAL_ENTRY: 'manual_entry',
  GOVERNMENT_PORTAL: 'government_portal',
  PARTNER_FEED: 'partner_feed',
  CSV_IMPORT: 'csv_import'
};

/**
 * Service data validator
 */
export class ServiceValidator {
  constructor() {
    this.requiredFields = ['name', 'organization.name', 'location.state', 'data_source.source_name'];
    this.validStates = Object.keys(AustralianStates);
    this.validCategories = Object.values(StandardizedCategories);
  }

  /**
   * Validate service data against schema
   */
  validate(serviceData) {
    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of this.requiredFields) {
      if (!this.getNestedValue(serviceData, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate state
    if (serviceData.location?.state && !this.validStates.includes(serviceData.location.state)) {
      errors.push(`Invalid state: ${serviceData.location.state}`);
    }

    // Validate categories
    if (serviceData.categories) {
      for (const category of serviceData.categories) {
        if (!this.validCategories.includes(category)) {
          warnings.push(`Unknown category: ${category}`);
        }
      }
    }

    // Validate age range
    if (serviceData.age_range) {
      if (serviceData.age_range.minimum > serviceData.age_range.maximum) {
        errors.push('Minimum age cannot be greater than maximum age');
      }
    }

    // Validate coordinates
    if (serviceData.location?.coordinates) {
      const { latitude, longitude } = serviceData.location.coordinates;
      if (latitude < -90 || latitude > 90) {
        errors.push('Invalid latitude');
      }
      if (longitude < -180 || longitude > 180) {
        errors.push('Invalid longitude');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateQualityScore(serviceData)
    };
  }

  /**
   * Calculate data quality score (0-1)
   */
  calculateQualityScore(serviceData) {
    let score = 0;
    let maxScore = 0;

    // Basic information (30 points)
    maxScore += 30;
    if (serviceData.name) score += 10;
    if (serviceData.description && serviceData.description.length > 50) score += 10;
    if (serviceData.url) score += 5;
    if (serviceData.categories && serviceData.categories.length > 0) score += 5;

    // Contact information (25 points)
    maxScore += 25;
    if (serviceData.contact?.phone?.primary) score += 10;
    if (serviceData.contact?.email?.primary) score += 10;
    if (serviceData.contact?.website) score += 5;

    // Location information (25 points)
    maxScore += 25;
    if (serviceData.location?.address_line_1) score += 10;
    if (serviceData.location?.suburb) score += 5;
    if (serviceData.location?.postcode) score += 5;
    if (serviceData.location?.coordinates?.latitude) score += 5;

    // Service details (20 points)
    maxScore += 20;
    if (serviceData.service_details?.availability) score += 5;
    if (serviceData.service_details?.cost) score += 5;
    if (serviceData.service_details?.eligibility) score += 5;
    if (serviceData.age_range) score += 5;

    return Math.round((score / maxScore) * 100) / 100;
  }

  /**
   * Get nested object value by dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Data normalizer for consistent formatting
 */
export class DataNormalizer {
  /**
   * Normalize phone number to Australian format
   */
  static normalizePhoneNumber(phone) {
    if (!phone) return null;

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Handle different formats
    if (digits.length === 10 && digits.startsWith('0')) {
      // Australian landline: 0X XXXX XXXX
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)} ${digits.substring(6)}`;
    } else if (digits.length === 10 && !digits.startsWith('0')) {
      // Mobile without leading 0: 4XX XXX XXX
      return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
    } else if (digits.length === 11 && digits.startsWith('61')) {
      // International format: +61 X XXXX XXXX
      return `+${digits.substring(0, 2)} ${digits.substring(2, 3)} ${digits.substring(3, 7)} ${digits.substring(7)}`;
    }

    return phone; // Return original if format not recognized
  }

  /**
   * Normalize Australian postcode
   */
  static normalizePostcode(postcode) {
    if (!postcode) return null;
    
    const digits = postcode.replace(/\D/g, '');
    if (digits.length === 4) {
      return digits;
    }
    
    return postcode;
  }

  /**
   * Normalize state name to abbreviation
   */
  static normalizeState(state) {
    if (!state) return null;

    const stateUpper = state.toUpperCase();
    
    // If already abbreviated
    if (Object.keys(AustralianStates).includes(stateUpper)) {
      return stateUpper;
    }

    // Convert full name to abbreviation
    for (const [abbrev, fullName] of Object.entries(AustralianStates)) {
      if (fullName.toUpperCase() === stateUpper) {
        return abbrev;
      }
    }

    return state;
  }

  /**
   * Normalize organization type
   */
  static normalizeOrganizationType(type) {
    if (!type) return 'unknown';

    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('government') || lowerType.includes('dept') || lowerType.includes('department')) {
      return OrganizationTypes.GOVERNMENT;
    }
    if (lowerType.includes('charity') || lowerType.includes('charitable')) {
      return OrganizationTypes.CHARITY;
    }
    if (lowerType.includes('non-profit') || lowerType.includes('nonprofit') || lowerType.includes('nfp')) {
      return OrganizationTypes.NON_PROFIT;
    }
    if (lowerType.includes('indigenous') || lowerType.includes('aboriginal') || lowerType.includes('torres strait')) {
      return OrganizationTypes.INDIGENOUS;
    }
    if (lowerType.includes('community')) {
      return OrganizationTypes.COMMUNITY;
    }
    if (lowerType.includes('university') || lowerType.includes('uni')) {
      return OrganizationTypes.UNIVERSITY;
    }

    return type;
  }
}

export default {
  AustralianServiceSchema,
  StandardizedCategories,
  AustralianStates,
  OrganizationTypes,
  DataSourceTypes,
  ServiceValidator,
  DataNormalizer
};
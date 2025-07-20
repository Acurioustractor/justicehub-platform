import Joi from 'joi';
import { ServiceSchema, OrganizationSchema, LocationSchema } from '../models/schemas.js';

/**
 * Validate service data
 */
export function validateService(service) {
  const result = ServiceSchema.validate(service, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  return {
    valid: !result.error,
    value: result.value,
    errors: result.error?.details || []
  };
}

/**
 * Validate organization data
 */
export function validateOrganization(organization) {
  const result = OrganizationSchema.validate(organization, {
    abortEarly: false,
    stripUnknown: true
  });
  
  return {
    valid: !result.error,
    value: result.value,
    errors: result.error?.details || []
  };
}

/**
 * Validate location data
 */
export function validateLocation(location) {
  const result = LocationSchema.validate(location, {
    abortEarly: false,
    stripUnknown: true
  });
  
  return {
    valid: !result.error,
    value: result.value,
    errors: result.error?.details || []
  };
}

/**
 * Validate Australian phone number
 */
export function isValidAustralianPhone(phone) {
  if (!phone) return false;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Australian mobile: 04xx xxx xxx (10 digits)
  // Australian landline: (0x) xxxx xxxx (10 digits)
  // With country code: 61 4xx xxx xxx or 61 x xxxx xxxx (11 digits)
  
  if (digits.startsWith('61')) {
    return digits.length === 11;
  } else if (digits.startsWith('0')) {
    return digits.length === 10;
  }
  
  return false;
}

/**
 * Validate email address
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Australian postcode
 */
export function isValidAustralianPostcode(postcode) {
  if (!postcode) return false;
  
  const code = postcode.toString().trim();
  
  // Australian postcodes are 4 digits
  if (!/^\d{4}$/.test(code)) return false;
  
  const num = parseInt(code);
  
  // Queensland postcodes: 4000-4999, 9000-9999
  const isQueensland = (num >= 4000 && num <= 4999) || (num >= 9000 && num <= 9999);
  
  return isQueensland;
}

/**
 * Validate URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate age range
 */
export function isValidAgeRange(minAge, maxAge) {
  if (minAge === null && maxAge === null) return true;
  if (minAge !== null && (minAge < 0 || minAge > 25)) return false;
  if (maxAge !== null && (maxAge < 0 || maxAge > 25)) return false;
  if (minAge !== null && maxAge !== null && minAge > maxAge) return false;
  
  return true;
}

/**
 * Validate service categories
 */
export function isValidCategory(category) {
  const validCategories = [
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
    'cultural_support',
    'youth_services'
  ];
  
  return validCategories.includes(category);
}

/**
 * Validate geographic coordinates
 */
export function isValidCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  
  // Check if coordinates are in Australia (rough bounds)
  const isInAustralia = lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154;
  
  return isInAustralia;
}

/**
 * Validate Queensland region
 */
export function isValidQueenslandRegion(region) {
  const validRegions = [
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
  ];
  
  return validRegions.includes(region);
}

/**
 * Validate service hours format
 */
export function isValidTimeFormat(time) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate data completeness
 */
export function calculateCompleteness(service) {
  const fields = [
    { field: 'name', weight: 2 },
    { field: 'description', weight: 2 },
    { field: 'categories', weight: 2 },
    { field: 'contact', weight: 2 },
    { field: 'location', weight: 2 },
    { field: 'eligibility', weight: 1 },
    { field: 'hours', weight: 1 },
    { field: 'url', weight: 1 },
    { field: 'email', weight: 1 },
    { field: 'fees', weight: 1 }
  ];
  
  let totalWeight = 0;
  let achievedWeight = 0;
  
  fields.forEach(({ field, weight }) => {
    totalWeight += weight;
    
    const value = service[field];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        achievedWeight += weight;
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        achievedWeight += weight;
      } else if (typeof value === 'string' && value.trim().length > 0) {
        achievedWeight += weight;
      } else if (typeof value === 'number') {
        achievedWeight += weight;
      }
    }
  });
  
  return achievedWeight / totalWeight;
}

/**
 * Validate service quality
 */
export function assessServiceQuality(service) {
  const issues = [];
  
  // Check description quality
  if (!service.description || service.description.length < 50) {
    issues.push({
      field: 'description',
      issue: 'Description too short or missing',
      severity: 'high'
    });
  }
  
  // Check contact information
  if (!service.contact?.phone && !service.contact?.email) {
    issues.push({
      field: 'contact',
      issue: 'No contact information provided',
      severity: 'high'
    });
  }
  
  // Check location
  if (!service.location || !service.location.address_1) {
    issues.push({
      field: 'location',
      issue: 'No physical address provided',
      severity: 'medium'
    });
  }
  
  // Check categories
  if (!service.categories || service.categories.length === 0) {
    issues.push({
      field: 'categories',
      issue: 'No service categories specified',
      severity: 'medium'
    });
  }
  
  // Check age eligibility
  if (service.youth_specific && !service.minimum_age && !service.maximum_age) {
    issues.push({
      field: 'eligibility',
      issue: 'Youth service missing age range',
      severity: 'low'
    });
  }
  
  // Check opening hours
  if (!service.hours && !service.schedules) {
    issues.push({
      field: 'hours',
      issue: 'No operating hours specified',
      severity: 'low'
    });
  }
  
  return issues;
}

/**
 * Validate batch of services
 */
export function validateServiceBatch(services) {
  const results = {
    valid: [],
    invalid: [],
    totalIssues: 0
  };
  
  services.forEach(service => {
    const validation = validateService(service);
    
    if (validation.valid) {
      results.valid.push({
        service: validation.value,
        quality: assessServiceQuality(validation.value)
      });
    } else {
      results.invalid.push({
        service: service,
        errors: validation.errors
      });
      results.totalIssues += validation.errors.length;
    }
  });
  
  return results;
}
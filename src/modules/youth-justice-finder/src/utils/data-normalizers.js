import pino from 'pino';

const logger = pino({ name: 'data-normalizers' });

/**
 * Normalize Australian phone numbers
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  let digits = phone.toString().replace(/\D/g, '');
  
  // Handle Australian country code
  if (digits.startsWith('61')) {
    digits = '0' + digits.substring(2);
  }
  
  // Validate length
  if (digits.length !== 10) {
    logger.debug({ phone, digits }, 'Invalid phone number length');
    return phone; // Return original if can't normalize
  }
  
  // Format as (0X) XXXX XXXX for landlines or 04XX XXX XXX for mobiles
  if (digits.startsWith('04')) {
    // Mobile
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  } else {
    // Landline
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)} ${digits.substring(6)}`;
  }
}

/**
 * Parse Australian address into components
 */
export function parseAddress(addressString) {
  if (!addressString) {
    return {
      street: null,
      suburb: null,
      state: 'QLD',
      postcode: null
    };
  }
  
  // Common patterns
  const postcodeRegex = /\b(\d{4})\b/;
  const stateRegex = /\b(QLD|Queensland|NSW|VIC|SA|WA|TAS|NT|ACT)\b/i;
  
  // Extract postcode
  const postcodeMatch = addressString.match(postcodeRegex);
  const postcode = postcodeMatch ? postcodeMatch[1] : null;
  
  // Extract state
  const stateMatch = addressString.match(stateRegex);
  let state = stateMatch ? stateMatch[1].toUpperCase() : 'QLD';
  if (state === 'QUEENSLAND') state = 'QLD';
  
  // Remove postcode and state from address
  let cleanAddress = addressString
    .replace(postcodeRegex, '')
    .replace(stateRegex, '')
    .replace(/,\s*,/g, ',') // Remove double commas
    .trim();
  
  // Split into parts
  const parts = cleanAddress.split(',').map(p => p.trim()).filter(p => p);
  
  let street = null;
  let suburb = null;
  
  if (parts.length >= 2) {
    // Assume last part is suburb
    suburb = parts[parts.length - 1];
    street = parts.slice(0, -1).join(', ');
  } else if (parts.length === 1) {
    // Could be just street or just suburb
    if (/\d/.test(parts[0])) {
      // Contains numbers, probably a street
      street = parts[0];
    } else {
      // No numbers, probably a suburb
      suburb = parts[0];
    }
  }
  
  return {
    street: street || null,
    suburb: suburb || null,
    state: state,
    postcode: postcode
  };
}

/**
 * Normalize organization name
 */
export function normalizeOrganizationName(name) {
  if (!name) return null;
  
  // Remove common suffixes
  const suffixes = [
    'Inc.', 'Inc', 'Incorporated',
    'Ltd.', 'Ltd', 'Limited',
    'Pty Ltd', 'Pty. Ltd.',
    'Co.', 'Co', 'Company',
    'Corp.', 'Corp', 'Corporation',
    'Assoc.', 'Association',
    'Org.', 'Organisation', 'Organization'
  ];
  
  let normalized = name.trim();
  
  // Remove suffixes
  suffixes.forEach(suffix => {
    const regex = new RegExp(`\\s+${suffix.replace('.', '\\.')}\\s*$`, 'i');
    normalized = normalized.replace(regex, '');
  });
  
  // Standardize common abbreviations
  const replacements = {
    '&': 'and',
    'Dept.': 'Department',
    'Dept': 'Department',
    'Qld': 'Queensland',
    'QLD': 'Queensland',
    'Aust': 'Australia',
    'Nat.': 'National',
    'Comm.': 'Community'
  };
  
  Object.entries(replacements).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    normalized = normalized.replace(regex, full);
  });
  
  // Standardize case (Title Case)
  normalized = normalized
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  return normalized;
}

/**
 * Extract and normalize website URL
 */
export function normalizeUrl(url) {
  if (!url) return null;
  
  let normalized = url.trim();
  
  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = 'https://' + normalized;
  }
  
  try {
    const urlObj = new URL(normalized);
    
    // Remove trailing slash
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/') && pathname !== '/') {
      pathname = pathname.slice(0, -1);
    }
    
    // Rebuild URL
    return `${urlObj.protocol}//${urlObj.host}${pathname}${urlObj.search}${urlObj.hash}`;
  } catch (error) {
    logger.debug({ url, error: error.message }, 'Invalid URL');
    return url; // Return original if can't normalize
  }
}

/**
 * Normalize email address
 */
export function normalizeEmail(email) {
  if (!email) return null;
  
  return email.trim().toLowerCase();
}

/**
 * Clean and normalize text content
 */
export function normalizeText(text, options = {}) {
  if (!text) return null;
  
  const {
    removeHtml = true,
    trimLength = null,
    preserveNewlines = false
  } = options;
  
  let normalized = text;
  
  // Remove HTML tags
  if (removeHtml) {
    normalized = normalized.replace(/<[^>]*>/g, '');
  }
  
  // Decode HTML entities
  normalized = normalized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Normalize whitespace
  if (preserveNewlines) {
    // Preserve line breaks but normalize other whitespace
    normalized = normalized
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  } else {
    // Replace all whitespace with single spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }
  
  // Trim to specified length
  if (trimLength && normalized.length > trimLength) {
    normalized = normalized.substring(0, trimLength - 3) + '...';
  }
  
  return normalized;
}

/**
 * Extract and normalize age range
 */
export function normalizeAgeRange(ageText) {
  if (!ageText) return { min: null, max: null };
  
  const text = ageText.toString().toLowerCase();
  
  // Common patterns
  const patterns = [
    // "10-17 years"
    /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)?/,
    // "ages 10 to 17"
    /ages?\s+(\d+)\s+to\s+(\d+)/,
    // "10 to 17 year olds"
    /(\d+)\s+to\s+(\d+)\s+year\s+olds?/,
    // "under 18"
    /under\s+(\d+)/,
    // "18 and over"
    /(\d+)\s+and\s+(?:over|above)/,
    // "12+"
    /(\d+)\+/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.toString().includes('under')) {
        return { min: null, max: parseInt(match[1]) - 1 };
      } else if (pattern.toString().includes('over|above')) {
        return { min: parseInt(match[1]), max: null };
      } else if (pattern.toString().includes('\\+')) {
        return { min: parseInt(match[1]), max: null };
      } else {
        return { min: parseInt(match[1]), max: parseInt(match[2]) };
      }
    }
  }
  
  // Check for specific ages
  const singleAge = text.match(/\b(\d+)\s*(?:years?|yrs?)?\s*(?:old|only)?\b/);
  if (singleAge) {
    const age = parseInt(singleAge[1]);
    return { min: age, max: age };
  }
  
  return { min: null, max: null };
}

/**
 * Normalize service categories
 */
export function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  
  const categoryMap = {
    // Legal
    'legal': 'legal_aid',
    'legal aid': 'legal_aid',
    'legal assistance': 'legal_aid',
    'legal help': 'legal_aid',
    'lawyer': 'legal_aid',
    'court': 'court_support',
    'court support': 'court_support',
    
    // Mental Health
    'mental health': 'mental_health',
    'counselling': 'mental_health',
    'counseling': 'mental_health',
    'psychology': 'mental_health',
    'therapy': 'mental_health',
    'wellbeing': 'mental_health',
    'well-being': 'mental_health',
    
    // Education
    'education': 'education_training',
    'training': 'education_training',
    'school': 'education_training',
    'learning': 'education_training',
    'vocational': 'education_training',
    
    // Housing
    'housing': 'housing',
    'accommodation': 'housing',
    'homeless': 'housing',
    'shelter': 'housing',
    'crisis accommodation': 'housing',
    
    // Substance
    'drug': 'substance_abuse',
    'alcohol': 'substance_abuse',
    'substance': 'substance_abuse',
    'addiction': 'substance_abuse',
    'aod': 'substance_abuse',
    
    // Family
    'family': 'family_support',
    'parent': 'family_support',
    'parenting': 'family_support',
    'carer': 'family_support',
    
    // Cultural
    'indigenous': 'cultural_support',
    'aboriginal': 'cultural_support',
    'torres strait': 'cultural_support',
    'cultural': 'cultural_support',
    'multicultural': 'cultural_support'
  };
  
  const normalized = new Set();
  
  categories.forEach(category => {
    const lower = category.toLowerCase().trim();
    const mapped = categoryMap[lower] || lower.replace(/\s+/g, '_');
    normalized.add(mapped);
  });
  
  return Array.from(normalized);
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text, options = {}) {
  if (!text) return [];
  
  const {
    minLength = 3,
    maxKeywords = 20,
    customStopWords = []
  } = options;
  
  // Common stop words
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
    'been', 'by', 'for', 'from', 'has', 'he', 'in', 'it', 'its', 'of',
    'that', 'to', 'was', 'will', 'with', 'be', 'have', 'this', 'or',
    'can', 'our', 'we', 'all', 'but', 'if', 'they', 'their', 'what',
    'so', 'up', 'out', 'about', 'who', 'get', 'would', 'make', 'than',
    ...customStopWords
  ]);
  
  // Extract words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= minLength && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // Not just numbers
    );
  
  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Normalize hours of operation
 */
export function normalizeHours(hoursText) {
  if (!hoursText) return null;
  
  const normalized = hoursText
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Check for 24/7
  if (normalized.includes('24/7') || normalized.includes('24 hours')) {
    return '24/7';
  }
  
  // Check for by appointment
  if (normalized.includes('appointment') || normalized.includes('by arrangement')) {
    return 'By appointment only';
  }
  
  // Otherwise return cleaned version
  return normalizeText(hoursText, { preserveNewlines: true });
}

/**
 * Calculate content hash for duplicate detection
 */
export function generateContentHash(content) {
  if (!content) return null;
  
  // Normalize content for comparison
  const normalized = content
    .toLowerCase()
    .replace(/[^\w]+/g, '') // Remove non-word characters
    .split('')
    .sort() // Sort characters for order-independent comparison
    .join('');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(36);
}

/**
 * Merge duplicate services
 */
export function mergeServices(service1, service2) {
  // Prefer the more complete service as base
  const completeness1 = calculateServiceCompleteness(service1);
  const completeness2 = calculateServiceCompleteness(service2);
  
  const [base, update] = completeness1 >= completeness2 
    ? [service1, service2] 
    : [service2, service1];
  
  // Merge fields, preferring non-null values
  const merged = { ...base };
  
  // Fields to merge (prefer longer/more complete)
  ['description', 'application_process', 'fees', 'wait_time'].forEach(field => {
    if (update[field] && (!base[field] || update[field].length > base[field].length)) {
      merged[field] = update[field];
    }
  });
  
  // Merge arrays (combine unique values)
  ['categories', 'keywords', 'accreditations'].forEach(field => {
    if (update[field]) {
      merged[field] = [...new Set([...(base[field] || []), ...(update[field] || [])])];
    }
  });
  
  // Merge age ranges (take widest range)
  if (update.minimum_age !== null && (base.minimum_age === null || update.minimum_age < base.minimum_age)) {
    merged.minimum_age = update.minimum_age;
  }
  if (update.maximum_age !== null && (base.maximum_age === null || update.maximum_age > base.maximum_age)) {
    merged.maximum_age = update.maximum_age;
  }
  
  // Update metadata
  merged.updated_at = new Date();
  merged.data_source = `${base.data_source},${update.data_source}`;
  
  return merged;
}

/**
 * Calculate service completeness
 */
function calculateServiceCompleteness(service) {
  const fields = [
    'name', 'description', 'categories', 'contact',
    'location', 'eligibility', 'hours', 'url', 'email'
  ];
  
  let score = 0;
  fields.forEach(field => {
    const value = service[field];
    if (value) {
      if (Array.isArray(value) && value.length > 0) score++;
      else if (typeof value === 'object' && Object.keys(value).length > 0) score++;
      else if (typeof value === 'string' && value.trim().length > 0) score++;
      else if (typeof value === 'number') score++;
    }
  });
  
  return score / fields.length;
}
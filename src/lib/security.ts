/**
 * Security utilities for input sanitization and validation
 *
 * Provides XSS protection, input sanitization, and security helpers
 * for API routes and data processing.
 */

/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * Use this for text that will be displayed in HTML context
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from input
 * Use this for plain text fields that should never contain HTML
 */
export function stripHtml(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
}

/**
 * Sanitize user input for safe storage
 * - Strips HTML tags
 * - Removes control characters
 * - Trims whitespace
 * - Limits length
 */
export function sanitizeInput(
  input: string,
  options: { maxLength?: number; allowNewlines?: boolean } = {}
): string {
  if (typeof input !== 'string') return '';

  const { maxLength = 10000, allowNewlines = true } = options;

  let sanitized = input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content even if tags are malformed
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Collapse multiple spaces
  sanitized = sanitized.replace(/  +/g, ' ');

  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
}

/**
 * Sanitize email address
 * - Validates format
 * - Lowercases
 * - Removes dangerous characters
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null;

  const sanitized = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Additional security checks
  if (sanitized.includes('<') || sanitized.includes('>')) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize a phone number
 * - Keeps only digits, spaces, and common phone characters
 * - Validates reasonable length
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') return null;

  // Keep only digits, spaces, +, -, (, )
  const sanitized = phone.replace(/[^\d\s+\-()]/g, '').trim();

  // Validate length (international numbers can be long)
  if (sanitized.length < 8 || sanitized.length > 20) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize an object's string fields for safe storage
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    fields?: (keyof T)[];
    maxLength?: number;
  } = {}
): T {
  const { fields, maxLength = 10000 } = options;
  const result = { ...obj };

  const fieldsToSanitize = fields || (Object.keys(obj) as (keyof T)[]);

  for (const key of fieldsToSanitize) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<keyof T, unknown>)[key] = sanitizeInput(value, { maxLength });
    }
  }

  return result;
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXssPatterns(text: string): boolean {
  if (typeof text !== 'string') return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(text));
}

/**
 * Rate limiting token bucket implementation
 * For use with Redis or similar in production
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter (use Redis in production for distributed systems)
 */
const rateLimitStore = new Map<string, { tokens: number; lastRefill: number }>();

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = options;

  let bucket = rateLimitStore.get(key);

  if (!bucket || now - bucket.lastRefill >= windowMs) {
    bucket = { tokens: limit - 1, lastRefill: now };
    rateLimitStore.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens, resetAt: now + windowMs };
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens, resetAt: bucket.lastRefill + windowMs };
  }

  return { allowed: false, remaining: 0, resetAt: bucket.lastRefill + windowMs };
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Block javascript: and data: URLs
    if (parsed.href.toLowerCase().includes('javascript:')) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

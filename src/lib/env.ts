/**
 * Environment Configuration Module
 * 
 * Provides type-safe, validated access to environment variables
 * with proper fallbacks and development defaults.
 */

import { z } from 'zod';

// Base environment schema
const baseEnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3003'),
  API_URL: z.string().url().default('http://localhost:3003/api'),
  PORT: z.string().regex(/^\d+$/).default('3003'),
  
  // Auth0
  AUTH0_SECRET: z.string().min(32).optional(),
  AUTH0_BASE_URL: z.string().url().optional(),
  AUTH0_ISSUER_BASE_URL: z.string().url().optional(),
  AUTH0_CLIENT_ID: z.string().optional(),
  AUTH0_CLIENT_SECRET: z.string().optional(),
  AUTH0_AUDIENCE: z.string().optional(),
  AUTH0_SCOPE: z.string().default('openid profile email'),
  
  // Database - Main Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  
  // Legacy Database (PostgreSQL) - for migration
  DATABASE_URL: z.string().startsWith('postgresql://').optional(),
  DATABASE_POOL_SIZE: z.string().regex(/^\d+$/).default('10'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  CACHE_TTL: z.string().regex(/^\d+$/).default('3600'),
  
  // AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  PERPLEXITY_API_KEY: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  XAI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  MISTRAL_API_KEY: z.string().min(1).optional(),
  
  // Web Scraping
  FIRECRAWL_API_KEY: z.string().startsWith('fc-').optional(),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  PUPPETEER_SKIP_DOWNLOAD: z.string().default('true'),
  PUPPETEER_HEADLESS: z.string().default('true'),
  SCRAPER_USER_AGENT: z.string().default('JusticeHub-Bot/1.0'),
  SCRAPER_DELAY_MS: z.string().regex(/^\d+$/).default('1000'),
  SCRAPER_TIMEOUT_MS: z.string().regex(/^\d+$/).default('30000'),
  
  // AWS
  AWS_REGION: z.string().default('ap-southeast-2'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().default('justicehub-media'),
  AWS_S3_REGION: z.string().default('ap-southeast-2'),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(),
  
  // External APIs
  AIRTABLE_API_KEY: z.string().optional(),
  AIRTABLE_BASE_ID: z.string().optional(),
  AIRTABLE_STORIES_TABLE: z.string().default('Stories'),
  
  // Communication
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@justicehub.org'),
  SENDGRID_FROM_NAME: z.string().default('JusticeHub'),
  
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Payment
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().regex(/^sk_(test_|live_)/).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().startsWith('G-').optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  
  // Security
  SESSION_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3003'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  
  // Feature Flags
  ENABLE_AIRTABLE_SYNC: z.string().default('true'),
  ENABLE_AI_INSIGHTS: z.string().default('true'),
  ENABLE_PAYMENT_PROCESSING: z.string().default('false'),
  ENABLE_SMS_NOTIFICATIONS: z.string().default('false'),
  ENABLE_SERVICE_FINDER: z.string().default('true'),
  ENABLE_BUDGET_TRACKER: z.string().default('true'),
  ENABLE_WEB_SCRAPING: z.string().default('false'),
  
  // Development
  NEXT_TELEMETRY_DISABLED: z.string().default('1'),
});

// Module-specific schemas for youth-justice-finder and qld-justice-tracker
const moduleEnvSchema = z.object({
  // Youth Justice Service Finder
  YJSF_SUPABASE_URL: z.string().url().optional(),
  YJSF_SUPABASE_ANON_KEY: z.string().optional(),
  YJSF_SUPABASE_SERVICE_KEY: z.string().optional(),
  YJSF_DATABASE_URL: z.string().startsWith('postgresql://').optional(),
  YJSF_ELASTICSEARCH_URL: z.string().url().optional(),
  YJSF_REDIS_URL: z.string().optional(),
  YJSF_FIRECRAWL_API_KEY: z.string().optional(),
  YJSF_GEOCODING_API_KEY: z.string().optional(),
  
  // QLD Justice Tracker
  QJT_SUPABASE_URL: z.string().url().optional(),
  QJT_SUPABASE_ANON_KEY: z.string().optional(),
  QJT_SUPABASE_SERVICE_KEY: z.string().optional(),
  QJT_FIRECRAWL_API_KEY: z.string().optional(),
  QJT_PARLIAMENT_API_KEY: z.string().optional(),
});

// Combined schema
const envSchema = baseEnvSchema.merge(moduleEnvSchema);

// Type for the validated environment
export type Env = z.infer<typeof envSchema>;

// Validate and parse environment variables
function parseEnv(): Env {
  try {
    // During build time, process.env might be undefined or incomplete
    const env = process.env || {};
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      console.error('❌ Environment validation failed:');
      if (missingVars.length > 0) {
        console.error('Missing required variables:', missingVars);
      }
      if (invalidVars.length > 0) {
        console.error('Invalid variables:', invalidVars);
      }
      
      // In development, provide helpful guidance
      if (process.env.NODE_ENV === 'development') {
        console.error('\n💡 For development, ensure you have:');
        console.error('- SUPABASE_URL (your Supabase project URL)');
        console.error('- SUPABASE_ANON_KEY (your Supabase anonymous key)');
        console.error('- Copy .env.example to .env.local and fill in values');
      }
      
      throw new Error('Environment validation failed. Check your .env.local file.');
    }
    throw error;
  }
}

// Cached environment - only parse once
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = parseEnv();
  }
  return cachedEnv;
}

// Convenience getters for commonly used values
export const env = {
  get NODE_ENV() { return getEnv().NODE_ENV; },
  get APP_URL() { return getEnv().APP_URL; },
  get API_URL() { return getEnv().API_URL; },
  get PORT() { return parseInt(getEnv().PORT); },
  
  // Database
  get SUPABASE_URL() { return getEnv().SUPABASE_URL; },
  get SUPABASE_ANON_KEY() { return getEnv().SUPABASE_ANON_KEY; },
  get SUPABASE_SERVICE_KEY() { return getEnv().SUPABASE_SERVICE_KEY; },
  
  // AI Services
  get OPENAI_API_KEY() { return getEnv().OPENAI_API_KEY; },
  get ANTHROPIC_API_KEY() { return getEnv().ANTHROPIC_API_KEY; },
  get PERPLEXITY_API_KEY() { return getEnv().PERPLEXITY_API_KEY; },
  
  // Feature flags as booleans
  get ENABLE_AI_INSIGHTS() { return getEnv().ENABLE_AI_INSIGHTS === 'true'; },
  get ENABLE_PAYMENT_PROCESSING() { return getEnv().ENABLE_PAYMENT_PROCESSING === 'true'; },
  get ENABLE_SMS_NOTIFICATIONS() { return getEnv().ENABLE_SMS_NOTIFICATIONS === 'true'; },
  get ENABLE_SERVICE_FINDER() { return getEnv().ENABLE_SERVICE_FINDER === 'true'; },
  get ENABLE_WEB_SCRAPING() { return getEnv().ENABLE_WEB_SCRAPING === 'true'; },
  
  // Helper methods
  isProduction: () => getEnv().NODE_ENV === 'production',
  isDevelopment: () => getEnv().NODE_ENV === 'development',
  isStaging: () => getEnv().NODE_ENV === 'staging',
  isTest: () => getEnv().NODE_ENV === 'test',
  
  // Get module-specific config
  getYJSFConfig: () => ({
    supabaseUrl: getEnv().YJSF_SUPABASE_URL || getEnv().SUPABASE_URL,
    supabaseAnonKey: getEnv().YJSF_SUPABASE_ANON_KEY || getEnv().SUPABASE_ANON_KEY,
    supabaseServiceKey: getEnv().YJSF_SUPABASE_SERVICE_KEY || getEnv().SUPABASE_SERVICE_KEY,
    firecrawlApiKey: getEnv().YJSF_FIRECRAWL_API_KEY || getEnv().FIRECRAWL_API_KEY,
  }),
  
  getQJTConfig: () => ({
    supabaseUrl: getEnv().QJT_SUPABASE_URL || getEnv().SUPABASE_URL,
    supabaseAnonKey: getEnv().QJT_SUPABASE_ANON_KEY || getEnv().SUPABASE_ANON_KEY,
    supabaseServiceKey: getEnv().QJT_SUPABASE_SERVICE_KEY || getEnv().SUPABASE_SERVICE_KEY,
    firecrawlApiKey: getEnv().QJT_FIRECRAWL_API_KEY || getEnv().FIRECRAWL_API_KEY,
  }),
};

// Validate on import in non-test environments (skip during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test' && !process.env.BUILDING) {
  try {
    getEnv();
    console.log('✅ Environment configuration validated successfully');
  } catch (error) {
    console.error('❌ Failed to validate environment:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export default env;
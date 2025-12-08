import { z } from 'zod';

/**
 * Environment Variable Validation using Zod
 *
 * This module provides type-safe access to environment variables with runtime validation.
 * It ensures all required variables are set and properly formatted at application startup.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const url = env.SUPABASE_URL;  // Type-safe and validated
 *
 * @see .env.example for all available variables
 */

// =============================================================================
// SCHEMA DEFINITIONS
// =============================================================================

/**
 * Server-side environment variables (not exposed to client)
 * These are only available in Server Components, API Routes, and Server Actions
 */
const serverSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3003'),

  // Supabase - Main Database
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Supabase - Empathy Ledger (optional multi-tenant)
  EMPATHY_LEDGER_URL: z.string().url().optional(),
  EMPATHY_LEDGER_ANON_KEY: z.string().min(1).optional(),

  // Supabase - Module-specific (optional)
  YJSF_SUPABASE_URL: z.string().url().optional(),
  YJSF_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  YJSF_SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  QJT_SUPABASE_URL: z.string().url().optional(),
  QJT_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  QJT_SUPABASE_SERVICE_KEY: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z.string().startsWith('postgresql://').optional(),

  // AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  PERPLEXITY_API_KEY: z.string().min(1).optional(),

  // External Services
  FIRECRAWL_API_KEY: z.string().startsWith('fc-').optional(),
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),

  // Notion (legacy)
  NOTION_API_TOKEN: z.string().min(1).optional(),
  NOTION_NOMINATION_DB_ID: z.string().min(1).optional(),
  NOTION_BOOKING_DB_ID: z.string().min(1).optional(),

  // Campaign settings
  CAMPAIGN_END_DATE: z.string().default('2025-10-22'),
  INITIAL_NOMINATION_COUNT: z.string().transform(Number).default('1247'),
  INITIAL_SLOT_TOTAL: z.string().transform(Number).default('24'),
});

/**
 * Client-side environment variables (exposed to browser via NEXT_PUBLIC_ prefix)
 * These are available in both Client and Server Components
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3003'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().startsWith('G-').optional(),
});

// =============================================================================
// VALIDATION & EXPORT
// =============================================================================

/**
 * Validates environment variables and returns typed config
 * Throws descriptive errors if validation fails
 */
function validateEnv() {
  // In browser, only validate client variables
  if (typeof window !== 'undefined') {
    const result = clientSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    });

    if (!result.success) {
      console.error('Client environment validation failed:', result.error.flatten());
      throw new Error(`Invalid client environment variables: ${result.error.message}`);
    }

    return {
      ...result.data,
      // Provide aliases for consistency
      SUPABASE_URL: result.data.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
  }

  // On server, validate both schemas
  const serverResult = serverSchema.safeParse(process.env);
  const clientResult = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  });

  const errors: string[] = [];

  if (!serverResult.success) {
    errors.push(`Server env errors:\n${formatZodErrors(serverResult.error)}`);
  }

  if (!clientResult.success) {
    errors.push(`Client env errors:\n${formatZodErrors(clientResult.error)}`);
  }

  if (errors.length > 0) {
    const errorMessage = `
================================================================================
ENVIRONMENT VALIDATION FAILED
================================================================================
${errors.join('\n\n')}

Please check your .env.local file and ensure all required variables are set.
See .env.example for reference.
================================================================================
`;
    console.error(errorMessage);

    // In development, throw to fail fast. In production, log but continue
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Environment validation failed. Check console for details.');
    }
  }

  return {
    ...serverResult.data,
    ...clientResult.data,
    // Provide consistent aliases
    SUPABASE_URL: clientResult.data?.NEXT_PUBLIC_SUPABASE_URL || serverResult.data?.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: clientResult.data?.NEXT_PUBLIC_SUPABASE_ANON_KEY || serverResult.data?.SUPABASE_ANON_KEY || '',
  };
}

/**
 * Format Zod errors into readable messages
 */
function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
}

// =============================================================================
// EXPORTED ENV OBJECT
// =============================================================================

/**
 * Validated environment variables
 *
 * @example
 * import { env } from '@/lib/env';
 *
 * // Access Supabase config
 * const url = env.SUPABASE_URL;
 * const key = env.SUPABASE_ANON_KEY;
 *
 * // Check optional services
 * if (env.OPENAI_API_KEY) {
 *   // AI features are enabled
 * }
 */
export const env = validateEnv();

/**
 * Type for the validated environment
 */
export type Env = typeof env;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if a specific service is configured
 */
export const hasService = {
  empathyLedger: !!(env.EMPATHY_LEDGER_URL && env.EMPATHY_LEDGER_ANON_KEY),
  openai: !!env.OPENAI_API_KEY,
  anthropic: !!env.ANTHROPIC_API_KEY,
  perplexity: !!env.PERPLEXITY_API_KEY,
  firecrawl: !!env.FIRECRAWL_API_KEY,
  sendgrid: !!env.SENDGRID_API_KEY,
  notion: !!(env.NOTION_API_TOKEN && env.NOTION_NOMINATION_DB_ID),
  yjsf: !!(env.YJSF_SUPABASE_URL && env.YJSF_SUPABASE_ANON_KEY),
  qjt: !!(env.QJT_SUPABASE_URL && env.QJT_SUPABASE_ANON_KEY),
};

/**
 * Legacy support - assertServerEnv for Notion features
 * @deprecated Use env validation instead
 */
export function assertServerEnv() {
  if (!env.NOTION_API_TOKEN) {
    throw new Error('Missing NOTION_API_TOKEN. Set it in .env.local (see .env.example).');
  }
  if (!env.NOTION_NOMINATION_DB_ID) {
    throw new Error('Missing NOTION_NOMINATION_DB_ID. Set it in .env.local (see .env.example).');
  }
  if (!env.NOTION_BOOKING_DB_ID) {
    throw new Error('Missing NOTION_BOOKING_DB_ID. Set it in .env.local (see .env.example).');
  }
}

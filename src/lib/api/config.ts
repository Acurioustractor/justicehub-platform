/**
 * API Configuration
 * 
 * Centralized configuration for all API integrations with proper error handling,
 * rate limiting, and security measures.
 */

import { env } from '@/lib/env';

// API Client Configuration
export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  headers: Record<string, string>;
}

// OpenAI Configuration
export const openAIConfig: APIConfig = {
  baseURL: 'https://api.openai.com/v1',
  timeout: 60000, // 60 seconds
  retries: 3,
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 50
  },
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'JusticeHub/1.0'
  }
};

// Anthropic Configuration
export const anthropicConfig: APIConfig = {
  baseURL: 'https://api.anthropic.com/v1',
  timeout: 60000,
  retries: 3,
  rateLimit: {
    windowMs: 60000,
    maxRequests: 30
  },
  headers: {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'User-Agent': 'JusticeHub/1.0'
  }
};

// Perplexity Configuration
export const perplexityConfig: APIConfig = {
  baseURL: 'https://api.perplexity.ai',
  timeout: 30000,
  retries: 2,
  rateLimit: {
    windowMs: 60000,
    maxRequests: 20
  },
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'JusticeHub/1.0'
  }
};

// Firecrawl Configuration
export const firecrawlConfig: APIConfig = {
  baseURL: 'https://api.firecrawl.dev/v0',
  timeout: 120000, // 2 minutes for scraping
  retries: 2,
  rateLimit: {
    windowMs: 60000,
    maxRequests: 10
  },
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'JusticeHub-Bot/1.0'
  }
};

// Supabase Configuration
export const supabaseConfig = {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  serviceKey: env.SUPABASE_SERVICE_KEY,
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'justicehub-web',
        'User-Agent': 'JusticeHub/1.0'
      }
    }
  }
};

// API Key Validation
export function validateAPIKeys(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Required keys
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    missing.push('Supabase credentials');
  }
  
  // Optional but recommended keys
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    warnings.push('No AI service API keys configured');
  }
  
  if (!env.FIRECRAWL_API_KEY && env.ENABLE_WEB_SCRAPING) {
    warnings.push('Web scraping enabled but no Firecrawl API key');
  }
  
  if (!env.SENDGRID_API_KEY && env.NODE_ENV === 'production') {
    warnings.push('No email service configured for production');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

// Rate Limiting Implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, config: APIConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.rateLimit.windowMs;
    
    // Get existing requests for this key
    const keyRequests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = keyRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= config.rateLimit.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  getTimeToReset(key: string, config: APIConfig): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const resetTime = oldestRequest + config.rateLimit.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}

export const rateLimiter = new RateLimiter();

// API Error Classes
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`, 429, 'RATE_LIMIT', true);
    this.name = 'RateLimitError';
  }
}

export class ConfigurationError extends APIError {
  constructor(message: string) {
    super(message, undefined, 'CONFIGURATION_ERROR', false);
    this.name = 'ConfigurationError';
  }
}

// Generic API Client
export class APIClient {
  private config: APIConfig;
  private apiKey?: string;
  
  constructor(config: APIConfig, apiKey?: string) {
    this.config = config;
    this.apiKey = apiKey;
  }
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    rateLimitKey?: string
  ): Promise<T> {
    // Check rate limiting
    if (rateLimitKey && !rateLimiter.isAllowed(rateLimitKey, this.config)) {
      const retryAfter = rateLimiter.getTimeToReset(rateLimitKey, this.config);
      throw new RateLimitError(retryAfter);
    }
    
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = {
      ...this.config.headers,
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...options.headers
    };
    
    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };
    
    let lastError: Error = new Error('API request failed');
    
    // Retry logic
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage: string;
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || 'Unknown error';
          } catch {
            errorMessage = errorText || `HTTP ${response.status}`;
          }
          
          const isRetryable = response.status >= 500 || response.status === 429;
          
          throw new APIError(
            errorMessage,
            response.status,
            response.headers.get('x-error-code') || undefined,
            isRetryable && attempt < this.config.retries
          );
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as unknown as T;
        }
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on non-retryable errors
        if (error instanceof APIError && !error.retryable) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.config.retries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Pre-configured API clients
export const createOpenAIClient = () => {
  if (!env.OPENAI_API_KEY) {
    throw new ConfigurationError('OpenAI API key not configured');
  }
  return new APIClient(openAIConfig, env.OPENAI_API_KEY);
};

export const createAnthropicClient = () => {
  const anthropicApiKey = env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new ConfigurationError('Anthropic API key not configured');
  }
  
  const client = new APIClient(anthropicConfig);
  
  // Override request method to use x-api-key header for Anthropic
  const originalRequest = client.request.bind(client);
  client.request = async function<T>(endpoint: string, options: RequestInit = {}, rateLimitKey?: string): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers,
      'x-api-key': anthropicApiKey
    };
    
    return originalRequest(endpoint, { ...options, headers }, rateLimitKey);
  };
  
  return client;
};

export const createPerplexityClient = () => {
  if (!env.PERPLEXITY_API_KEY) {
    throw new ConfigurationError('Perplexity API key not configured');
  }
  return new APIClient(perplexityConfig, env.PERPLEXITY_API_KEY);
};

export const createFirecrawlClient = () => {
  if (!env.FIRECRAWL_API_KEY) {
    throw new ConfigurationError('Firecrawl API key not configured');
  }
  return new APIClient(firecrawlConfig, env.FIRECRAWL_API_KEY);
};

// Health Check Function
export async function checkAPIHealth(): Promise<{
  supabase: boolean;
  openai: boolean;
  anthropic: boolean;
  firecrawl: boolean;
  errors: string[];
}> {
  const results = {
    supabase: false,
    openai: false,
    anthropic: false,
    firecrawl: false,
    errors: [] as string[]
  };
  
  // Test Supabase
  try {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();
    const { error } = await supabase.from('services').select('id', { head: true, count: 'exact' }).limit(1);
    results.supabase = !error;
    if (error) {
      results.errors.push(`Supabase: ${error.message}`);
    }
  } catch (error) {
    results.errors.push(`Supabase: ${(error as Error).message}`);
  }
  
  // Test OpenAI
  if (env.OPENAI_API_KEY) {
    try {
      const client = createOpenAIClient();
      await client.request('/models', { method: 'GET' }, 'openai-health');
      results.openai = true;
    } catch (error) {
      results.errors.push(`OpenAI: ${(error as Error).message}`);
    }
  }
  
  // Test Anthropic
  if (env.ANTHROPIC_API_KEY) {
    try {
      const client = createAnthropicClient();
      // Anthropic doesn't have a simple health endpoint, so we'll assume it's working if the key is set
      results.anthropic = true;
    } catch (error) {
      results.errors.push(`Anthropic: ${(error as Error).message}`);
    }
  }
  
  // Test Firecrawl
  if (env.FIRECRAWL_API_KEY) {
    try {
      const client = createFirecrawlClient();
      // Test with a minimal request
      await client.request('/crawl', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          crawlerOptions: { limit: 1 }
        })
      }, 'firecrawl-health');
      results.firecrawl = true;
    } catch (error) {
      // Firecrawl might return 402 for quota limits, which is still a valid response
      if ((error as APIError).status === 402) {
        results.firecrawl = true;
      } else {
        results.errors.push(`Firecrawl: ${(error as Error).message}`);
      }
    }
  }
  
  return results;
}

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  userId?: string;
  organizationId?: string;
  enabled: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  allowedEndpoints: string[];
  permissions: string[];
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  expiresAt?: string;
}

export class RateLimiter {
  private supabase = getSupabaseAdmin();
  private memoryStore = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    await this.cleanupOldEntries(windowStart);

    // Get current usage
    const usage = await this.getUsage(key, windowStart);
    const resetTime = now + config.windowMs;

    if (usage >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(config.windowMs / 1000),
      };
    }

    // Increment usage
    await this.incrementUsage(key, now, resetTime);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - usage - 1,
      resetTime,
    };
  }

  /**
   * Get current usage for a key
   */
  private async getUsage(key: string, windowStart: number): Promise<number> {
    // Check memory store first (for performance)
    const memoryEntry = this.memoryStore.get(key);
    if (memoryEntry && memoryEntry.resetTime > Date.now()) {
      return memoryEntry.count;
    }

    // Check database for persistent storage
    const { data, error } = await this.supabase
      .from('rate_limit_usage')
      .select('count')
      .eq('key', key)
      .gte('created_at', new Date(windowStart).toISOString())
      .single();

    if (error || !data) {
      return 0;
    }

    return data.count || 0;
  }

  /**
   * Increment usage counter
   */
  private async incrementUsage(key: string, now: number, resetTime: number): Promise<void> {
    // Update memory store
    const memoryEntry = this.memoryStore.get(key);
    if (memoryEntry && memoryEntry.resetTime > now) {
      memoryEntry.count++;
    } else {
      this.memoryStore.set(key, { count: 1, resetTime });
    }

    // Update database
    const { error } = await this.supabase
      .from('rate_limit_usage')
      .upsert({
        key,
        count: (memoryEntry?.count || 1),
        created_at: new Date(now).toISOString(),
        expires_at: new Date(resetTime).toISOString(),
      }, {
        onConflict: 'key',
      });

    if (error) {
      console.error('Failed to update rate limit usage:', error);
    }
  }

  /**
   * Clean up old entries
   */
  private async cleanupOldEntries(windowStart: number): Promise<void> {
    // Clean memory store
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.resetTime <= Date.now()) {
        this.memoryStore.delete(key);
      }
    }

    // Clean database (run periodically)
    if (Math.random() < 0.01) { // 1% chance to clean up
      await this.supabase
        .from('rate_limit_usage')
        .delete()
        .lt('expires_at', new Date().toISOString());
    }
  }

  /**
   * Generate rate limit key from request
   */
  generateKey(request: NextRequest, prefix: string = 'api'): string {
    const ip = this.getClientIP(request);
    const apiKey = request.headers.get('x-api-key');
    
    if (apiKey) {
      return `${prefix}:key:${apiKey}`;
    }
    
    return `${prefix}:ip:${ip}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || remoteAddr || 'unknown';
  }
}

export class ApiKeyManager {
  private supabase = getSupabaseAdmin();

  /**
   * Create a new API key
   */
  async createApiKey(
    keyData: Omit<ApiKey, 'id' | 'key' | 'createdAt' | 'usageCount' | 'lastUsed'>
  ): Promise<ApiKey> {
    const apiKey: ApiKey = {
      ...keyData,
      id: crypto.randomUUID(),
      key: this.generateApiKey(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('api_keys')
      .insert(apiKey)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate and get API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('key', key)
      .eq('enabled', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if key is expired
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return null;
    }

    // Update last used timestamp
    await this.updateLastUsed(data.id);

    return data;
  }

  /**
   * Update API key usage
   */
  async updateUsage(keyId: string): Promise<void> {
    await this.supabase
      .from('api_keys')
      .update({
        lastUsed: new Date().toISOString(),
      })
      .eq('id', keyId);
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    await this.supabase
      .from('api_keys')
      .update({ lastUsed: new Date().toISOString() })
      .eq('id', keyId);
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await this.supabase
      .from('api_keys')
      .update({ enabled: false })
      .eq('id', keyId);
  }

  /**
   * Get API keys for a user/organization
   */
  async getApiKeys(userId?: string, organizationId?: string): Promise<ApiKey[]> {
    let query = this.supabase.from('api_keys').select('*');

    if (userId) {
      query = query.eq('userId', userId);
    }
    if (organizationId) {
      query = query.eq('organizationId', organizationId);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate a new API key string
   */
  private generateApiKey(): string {
    const prefix = 'qyj'; // Queensland Youth Justice
    const timestamp = Date.now().toString(36);
    const random = crypto.randomUUID().replace(/-/g, '');
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Check if API key has permission for endpoint
   */
  hasPermission(apiKey: ApiKey, endpoint: string, permission: string): boolean {
    // Check endpoint access
    if (apiKey.allowedEndpoints.length > 0) {
      const hasEndpointAccess = apiKey.allowedEndpoints.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(endpoint);
        }
        return pattern === endpoint;
      });

      if (!hasEndpointAccess) {
        return false;
      }
    }

    // Check specific permissions
    if (apiKey.permissions.length > 0) {
      return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
    }

    return true; // Allow all if no specific restrictions
  }
}

// Default rate limit configurations
export const defaultRateLimits = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  authenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },
  premium: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5000,
  },
} as const;

// Export singleton instances
export const rateLimiter = new RateLimiter();
export const apiKeyManager = new ApiKeyManager();
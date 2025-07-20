import { Redis } from 'ioredis';

// Redis client setup
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.warn('Redis not configured, caching disabled');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });

      redis.on('error', (err) => {
        console.error('Redis connection error:', err);
        redis = null;
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      redis = null;
    }
  }

  return redis;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Get cached data by key
 */
export async function getCached<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
    const cached = await client.get(fullKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data with optional TTL
 */
export async function setCached<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
    const serialized = JSON.stringify(data);
    
    if (options.ttl) {
      await client.setex(fullKey, options.ttl, serialized);
    } else {
      await client.set(fullKey, serialized);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached data
 */
export async function deleteCached(
  key: string,
  options: CacheOptions = {}
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
    await client.del(fullKey);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Cache analytics data with intelligent TTL
 */
export async function cacheAnalytics<T>(
  organizationId: string,
  timeframe: string,
  metric: string,
  data: T
): Promise<void> {
  // Shorter TTL for current period data, longer for historical
  const ttl = timeframe === 'week' ? 300 : timeframe === 'month' ? 600 : 1800; // 5-30 minutes
  
  await setCached(
    `${organizationId}:${timeframe}:${metric}`,
    data,
    { 
      ttl,
      prefix: 'analytics'
    }
  );
}

/**
 * Get cached analytics data
 */
export async function getCachedAnalytics<T>(
  organizationId: string,
  timeframe: string,
  metric: string
): Promise<T | null> {
  return getCached<T>(
    `${organizationId}:${timeframe}:${metric}`,
    { prefix: 'analytics' }
  );
}

/**
 * Cache user dashboard stats
 */
export async function cacheDashboardStats<T>(
  userId: string,
  role: string,
  data: T
): Promise<void> {
  await setCached(
    `${userId}:${role}`,
    data,
    {
      ttl: 300, // 5 minutes
      prefix: 'dashboard'
    }
  );
}

/**
 * Get cached dashboard stats
 */
export async function getCachedDashboardStats<T>(
  userId: string,
  role: string
): Promise<T | null> {
  return getCached<T>(
    `${userId}:${role}`,
    { prefix: 'dashboard' }
  );
}

/**
 * Cache search results
 */
export async function cacheSearchResults<T>(
  query: string,
  filters: any,
  data: T
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const cacheKey = `${Buffer.from(query).toString('base64')}:${Buffer.from(filterKey).toString('base64')}`;
  
  await setCached(
    cacheKey,
    data,
    {
      ttl: 600, // 10 minutes
      prefix: 'search'
    }
  );
}

/**
 * Get cached search results
 */
export async function getCachedSearchResults<T>(
  query: string,
  filters: any
): Promise<T | null> {
  const filterKey = JSON.stringify(filters);
  const cacheKey = `${Buffer.from(query).toString('base64')}:${Buffer.from(filterKey).toString('base64')}`;
  
  return getCached<T>(
    cacheKey,
    { prefix: 'search' }
  );
}

/**
 * Invalidate cache patterns
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate analytics cache for organization
 */
export async function invalidateAnalyticsCache(organizationId: string): Promise<void> {
  await invalidatePattern(`analytics:${organizationId}:*`);
}

/**
 * Invalidate dashboard cache for user
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  await invalidatePattern(`dashboard:${userId}:*`);
}
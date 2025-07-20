import Redis from 'ioredis';
import { z } from 'zod';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private redis: Redis;
  private ttl: number;
  private prefix: string;

  constructor(config: CacheConfig) {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.ttl = config.ttl || 3600; // Default 1 hour
    this.prefix = config.prefix || 'airtable_mcp:';

    // Handle Redis connection events
    this.redis.on('connect', () => {
      console.log('📦 Redis cache connected');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis cache error:', error);
    });
  }

  /**
   * Generate cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const value = await this.redis.get(fullKey);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.ttl;

      if (expiry > 0) {
        await this.redis.setex(fullKey, expiry, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear(): Promise<boolean> {
    try {
      const pattern = `${this.prefix}*`;
      let cursor = '0';
      
      do {
        const [newCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        
        cursor = newCursor;
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');

      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async getTtl(key: string): Promise<number> {
    try {
      const fullKey = this.getKey(key);
      const ttl = await this.redis.ttl(fullKey);
      return ttl;
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const fullPattern = `${this.prefix}${pattern}`;
      let cursor = '0';
      let deletedCount = 0;
      
      do {
        const [newCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        
        cursor = newCursor;
        
        if (keys.length > 0) {
          deletedCount += await this.redis.del(...keys);
        }
      } while (cursor !== '0');

      console.log(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
      return true;
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Get or set cache value with callback
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }

    // Cache miss, fetch from callback
    console.log(`Cache miss for key: ${key}`);
    const value = await callback();
    
    // Store in cache
    await this.set(key, value, ttl);
    
    return value;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T>(entries: Array<[string, T]>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const expiry = ttl || this.ttl;

      for (const [key, value] of entries) {
        const fullKey = this.getKey(key);
        const serialized = JSON.stringify(value);
        
        if (expiry > 0) {
          pipeline.setex(fullKey, expiry, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memoryUsage: number;
    keys: number;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();

      // Parse Redis info strings
      const stats = {
        connected: this.redis.status === 'ready',
        memoryUsage: parseInt(memory.match(/used_memory:(\d+)/)?.[1] || '0'),
        keys: keyCount,
        hits: parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0'),
        misses: parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0'),
      };

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        memoryUsage: 0,
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Cache key generators for consistent key naming
export const CacheKeys = {
  story: (id: string) => `story:${id}`,
  stories: (filters: Record<string, any>) => `stories:${JSON.stringify(filters)}`,
  storySearch: (query: string, fields: string[]) => `search:${query}:${fields.join(',')}`,
  storyTags: (tags: string[], matchAll: boolean) => `tags:${tags.join(',')}:${matchAll}`,
  metadata: (orgId?: string) => `metadata:${orgId || 'all'}`,
  resource: (uri: string) => `resource:${uri}`,
};
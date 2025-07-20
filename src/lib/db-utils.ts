import { sql } from 'drizzle-orm';
import { db } from '@/server/db';

/**
 * Database performance optimization utilities
 */

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

/**
 * Create database indexes for better performance
 */
export const performanceIndexes = {
  // Stories performance indexes
  stories: {
    userIdPublished: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_user_published ON stories_extended (user_id, published) WHERE published = true;`,
    orgIdPublished: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_org_published ON stories_extended (organization_id, published_at) WHERE published = true;`,
    publishedAt: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_published_at ON stories_extended (published_at DESC) WHERE published = true;`,
    storyType: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_type ON stories_extended (story_type, organization_id);`,
    visibility: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_visibility ON stories_extended (visibility, organization_id);`,
  },
  
  // User performance indexes
  users: {
    orgRole: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_role ON users (organization_id, role) WHERE organization_id IS NOT NULL;`,
    lastLogin: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users (last_login_at DESC) WHERE last_login_at IS NOT NULL;`,
    auth0Id: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth0_unique ON users (auth0_id);`,
  },
  
  // Organization members indexes
  orgMembers: {
    orgActive: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_active ON organization_members (organization_id, is_active, role) WHERE is_active = true;`,
    joinedAt: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_joined ON organization_members (organization_id, joined_at DESC);`,
    userOrg: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_members_user ON organization_members (user_id, organization_id, is_active);`,
  },
  
  // Opportunities indexes
  opportunities: {
    orgActive: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_org_active ON opportunities (organization_id, is_active, created_at DESC) WHERE is_active = true;`,
    skills: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_skills ON opportunities USING GIN (required_skills) WHERE required_skills IS NOT NULL;`,
    location: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_location ON opportunities (location, organization_id) WHERE location IS NOT NULL;`,
  },
  
  // Apprenticeships indexes
  apprenticeships: {
    orgStatus: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apprenticeships_org_status ON apprenticeships (organization_id, status, start_date DESC);`,
    mentorYouth: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apprenticeships_mentor_youth ON apprenticeships (mentor_id, youth_id);`,
    dates: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apprenticeships_dates ON apprenticeships (start_date, end_date) WHERE end_date IS NOT NULL;`,
  },
  
  // API Keys indexes
  apiKeys: {
    orgActive: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_org_active ON api_keys (organization_id, is_active) WHERE is_active = true;`,
    keyHash: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_hash ON api_keys (key) WHERE is_active = true;`,
    lastUsed: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_last_used ON api_keys (last_used_at DESC) WHERE last_used_at IS NOT NULL;`,
  },
  
  // Content embeddings indexes (for AI search)
  embeddings: {
    contentType: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_content_type ON content_embeddings (content_type, content_id);`,
    vector: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector ON content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`,
  },
  
  // Story tags indexes
  storyTags: {
    storyTag: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_tags_story ON story_tags (story_id, tag);`,
    tagCount: sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_tags_tag ON story_tags (tag, created_at DESC);`,
  }
};

/**
 * Install performance indexes
 */
export async function installPerformanceIndexes(): Promise<void> {
  console.log('Installing performance indexes...');
  
  const allIndexes = Object.values(performanceIndexes).flatMap(tableIndexes => 
    Object.values(tableIndexes)
  );
  
  for (const index of allIndexes) {
    try {
      await db.execute(index);
      console.log('✓ Index installed successfully');
    } catch (error) {
      console.error('✗ Index installation failed:', error);
    }
  }
  
  console.log('Performance indexes installation complete');
}

/**
 * Optimize database statistics
 */
export async function analyzeDatabase(): Promise<void> {
  console.log('Analyzing database statistics...');
  
  const tables = [
    'stories_extended',
    'users',
    'organization_members',
    'opportunities',
    'apprenticeships',
    'api_keys',
    'content_embeddings',
    'story_tags'
  ];
  
  for (const table of tables) {
    try {
      await db.execute(sql`ANALYZE ${sql.identifier(table)};`);
      console.log(`✓ Analyzed table: ${table}`);
    } catch (error) {
      console.error(`✗ Failed to analyze table ${table}:`, error);
    }
  }
  
  console.log('Database analysis complete');
}

/**
 * Get database performance statistics
 */
export async function getDatabaseStats(): Promise<any> {
  try {
    const [tableStats] = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public' 
      AND tablename IN ('stories_extended', 'users', 'organization_members', 'opportunities')
      ORDER BY tablename, attname;
    `);
    
    const [indexStats] = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_tup_read DESC;
    `);
    
    const [slowQueries] = await db.execute(sql`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC 
      LIMIT 10;
    `);
    
    return {
      tableStats,
      indexStats,
      slowQueries
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}

/**
 * Batch operations for better performance
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private readonly batchSize: number;
  private readonly processor: (items: T[]) => Promise<void>;
  
  constructor(batchSize: number = 100, processor: (items: T[]) => Promise<void>) {
    this.batchSize = batchSize;
    this.processor = processor;
  }
  
  async add(item: T): Promise<void> {
    this.batch.push(item);
    
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    const items = [...this.batch];
    this.batch = [];
    
    await this.processor(items);
  }
}

/**
 * Connection pool monitoring
 */
export async function getConnectionPoolStats(): Promise<any> {
  try {
    const [poolStats] = await db.execute(sql`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `);
    
    return poolStats;
  } catch (error) {
    console.error('Failed to get connection pool stats:', error);
    return null;
  }
}

/**
 * Query timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}

/**
 * Prepared statement cache
 */
class PreparedStatementCache {
  private cache = new Map<string, any>();
  private maxSize = 100;
  
  get(key: string): any | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, statement: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, statement);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const preparedStatements = new PreparedStatementCache();
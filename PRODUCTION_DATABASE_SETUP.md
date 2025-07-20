# Production Database Setup Guide

## 🏗️ Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│   Frontend (Next.js)│     │   Backend (API)     │
│                     │     │                     │
│  ┌───────────────┐  │     │  ┌───────────────┐  │
│  │ Client Utils  │  │     │  │ Server Utils  │  │
│  │ (Anon Key)    │  │     │  │ (Service Key) │  │
│  └───────┬───────┘  │     │  └───────┬───────┘  │
│          │          │     │          │          │
└──────────┼──────────┘     └──────────┼──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
                  ┌────▼────┐
                  │Supabase │
                  │Database │
                  └─────────┘
```

## 📋 Implementation Steps

### Step 1: Create Centralized Database Utilities

#### 1.1 Client-Side Utility (`/lib/supabase/client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance
let clientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
    });
  }
  return clientInstance;
}
```

#### 1.2 Server-Side Utility (`/lib/supabase/server.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Server-side doesn't need singleton due to serverless nature
export function getSupabaseAdmin() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });
}
```

#### 1.3 Database Types (`/types/database.ts`)
Generate from Supabase CLI:
```bash
npx supabase gen types typescript --project-id oxgkjgurpopntowhxlxm > types/database.ts
```

### Step 2: Implement Error Handling

#### 2.1 Error Handler Utility (`/lib/supabase/errors.ts`)
```typescript
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: any): DatabaseError {
  if (error.code === 'PGRST301') {
    return new DatabaseError('Database connection failed', error.code, 503);
  }
  if (error.code === '42P01') {
    return new DatabaseError('Table does not exist', error.code, 500);
  }
  // Add more specific error handling
  return new DatabaseError(error.message || 'Unknown database error', error.code);
}
```

### Step 3: Create Data Access Layer

#### 3.1 Repository Pattern (`/lib/repositories/youthStatistics.ts`)
```typescript
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/supabase/errors';
import type { YouthStatistic } from '@/types/database';

export class YouthStatisticsRepository {
  private supabase = getSupabaseAdmin();

  async getLatest(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  async getByDateRange(startDate: string, endDate: string) {
    try {
      const { data, error } = await this.supabase
        .from('youth_statistics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
}
```

### Step 4: Set Up Row Level Security (RLS)

#### 4.1 RLS Policies SQL
```sql
-- Enable RLS on all tables
ALTER TABLE youth_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentary_documents ENABLE ROW LEVEL SECURITY;

-- Public read access for anonymous users
CREATE POLICY "Public read access" ON youth_statistics
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Public read access" ON budget_allocations
  FOR SELECT TO anon
  USING (true);

-- Restrict write access to service role only
CREATE POLICY "Service role write access" ON youth_statistics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
```

### Step 5: Implement Connection Monitoring

#### 5.1 Health Check Endpoint (`/app/api/health/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Test database connection
    const { error } = await supabase
      .from('youth_statistics')
      .select('count')
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
```

### Step 6: Migration Strategy

#### 6.1 Update All API Routes
1. Replace direct `createClient` calls with utility functions
2. Implement consistent error handling
3. Add proper TypeScript types

#### 6.2 Update All Client Components
1. Use `getSupabaseClient()` singleton
2. Implement loading and error states
3. Add retry logic for failed requests

#### 6.3 Update All Scripts
1. Use environment-specific connection utilities
2. Add proper logging
3. Implement graceful shutdown

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different keys for different environments
   - Rotate keys regularly

2. **Access Control**
   - Enable RLS on all tables
   - Use service role key only on server
   - Implement API rate limiting

3. **Data Validation**
   - Validate all inputs
   - Use TypeScript types
   - Implement schema validation

## 📊 Monitoring & Performance

1. **Connection Pooling**
   - Reuse connections where possible
   - Implement connection limits
   - Monitor connection health

2. **Query Optimization**
   - Add indexes on frequently queried columns
   - Use select specific columns
   - Implement pagination

3. **Error Tracking**
   - Log all database errors
   - Set up alerts for failures
   - Monitor query performance

## 🚀 Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] RLS policies applied to all tables
- [ ] Database backups configured
- [ ] Monitoring endpoints tested
- [ ] Error handling implemented
- [ ] Connection utilities deployed
- [ ] API routes migrated
- [ ] Client components updated
- [ ] Scripts refactored
- [ ] Documentation updated
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    environment: process.env.VERCEL_ENV || 'development',
    checks: {
      database: { status: 'pending', latency: 0, error: null as string | null },
      tables: {} as Record<string, boolean>,
      environment: { status: 'pending', missing: [] as string[] },
    },
  };

  // Check environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    checks.checks.environment.status = 'error';
    checks.checks.environment.missing = missingEnvVars;
    checks.status = 'unhealthy';
  } else {
    checks.checks.environment.status = 'ok';
  }

  // Check database connection
  try {
    const dbStartTime = Date.now();
    const supabase = getSupabaseAdmin();
    
    // Test basic connectivity
    const { error: pingError } = await supabase
      .from('youth_statistics')
      .select('count')
      .limit(1)
      .single();

    checks.checks.database.latency = Date.now() - dbStartTime;

    if (pingError) {
      throw pingError;
    }

    checks.checks.database.status = 'ok';

    // Check each table
    const tables = [
      'youth_statistics',
      'budget_allocations',
      'court_statistics',
      'parliamentary_documents',
      'scraped_content',
      'cost_comparisons',
      'hidden_costs',
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        checks.checks.tables[table] = !error;
      } catch {
        checks.checks.tables[table] = false;
      }
    }

    // Determine overall health
    const failedTables = Object.values(checks.checks.tables).filter(v => !v).length;
    if (failedTables > 0) {
      checks.status = 'degraded';
    }

  } catch (error: any) {
    checks.checks.database.status = 'error';
    checks.checks.database.error = error.message || 'Unknown error';
    checks.status = 'unhealthy';
  }

  // Calculate total latency
  const totalLatency = Date.now() - startTime;

  // Return appropriate status code
  const statusCode = 
    checks.status === 'healthy' ? 200 :
    checks.status === 'degraded' ? 200 :
    503;

  return NextResponse.json(
    {
      ...checks,
      latency: totalLatency,
    },
    { status: statusCode }
  );
}
/**
 * Platform Health Check API
 *
 * GET /api/health
 *
 * Returns comprehensive health status of the JusticeHub platform.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  details?: Record<string, unknown>;
}

interface PlatformHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  components: ComponentHealth[];
  timestamp: string;
}

export async function GET() {
  const health: PlatformHealth = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    components: [],
    timestamp: new Date().toISOString(),
  };

  // 1. Check Supabase (JusticeHub database)
  const dbStart = Date.now();
  try {
    const supabase = createServiceClient();

    // Check multiple tables
    const [servicesResult, interventionsResult, profilesResult] = await Promise.all([
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('alma_interventions').select('id', { count: 'exact', head: true }),
      supabase.from('public_profiles').select('id', { count: 'exact', head: true }),
    ]);

    const hasErrors = servicesResult.error || interventionsResult.error || profilesResult.error;

    health.components.push({
      name: 'database',
      status: hasErrors ? 'degraded' : 'healthy',
      latency: Date.now() - dbStart,
      details: {
        services: servicesResult.count,
        interventions: interventionsResult.count,
        profiles: profilesResult.count,
      },
    });

    if (hasErrors) health.status = 'degraded';
  } catch (err) {
    health.components.push({
      name: 'database',
      status: 'unhealthy',
      latency: Date.now() - dbStart,
      details: { error: String(err) },
    });
    health.status = 'unhealthy';
  }

  // 2. Check ALMA system
  const almaStart = Date.now();
  try {
    const supabase = createServiceClient();

    const { count, error } = await supabase
      .from('alma_interventions')
      .select('*', { count: 'exact', head: true })
      .in('review_status', ['Approved', 'Published']);

    health.components.push({
      name: 'alma',
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - almaStart,
      details: {
        activeInterventions: count,
      },
    });
  } catch (err) {
    health.components.push({
      name: 'alma',
      status: 'unhealthy',
      latency: Date.now() - almaStart,
      details: { error: String(err) },
    });
  }

  // 3. Check environment configuration
  const configChecks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    empathyLedgerUrl: !!process.env.EMPATHY_LEDGER_SUPABASE_URL,
    empathyLedgerKey: !!process.env.EMPATHY_LEDGER_SUPABASE_ANON_KEY,
  };

  const missingConfig = Object.entries(configChecks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  health.components.push({
    name: 'configuration',
    status: missingConfig.length === 0 ? 'healthy' : missingConfig.length <= 2 ? 'degraded' : 'unhealthy',
    details: {
      configured: Object.entries(configChecks).filter(([, v]) => v).map(([k]) => k),
      missing: missingConfig,
    },
  });

  // 4. Check events system
  const eventsStart = Date.now();
  try {
    const supabase = createServiceClient();

    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('start_date', new Date().toISOString());

    health.components.push({
      name: 'events',
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - eventsStart,
      details: {
        upcomingEvents: count,
      },
    });
  } catch {
    health.components.push({
      name: 'events',
      status: 'degraded',
      latency: Date.now() - eventsStart,
      details: { note: 'Events table may not exist yet' },
    });
  }

  // 5. Check nodes system
  const nodesStart = Date.now();
  try {
    const supabase = createServiceClient();

    const { count, error } = await supabase
      .from('justicehub_nodes')
      .select('*', { count: 'exact', head: true });

    health.components.push({
      name: 'nodes',
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - nodesStart,
      details: {
        activeNodes: count,
      },
    });
  } catch {
    health.components.push({
      name: 'nodes',
      status: 'degraded',
      latency: Date.now() - nodesStart,
      details: { note: 'Nodes table may not exist yet' },
    });
  }

  // Calculate overall status
  const unhealthyCount = health.components.filter(c => c.status === 'unhealthy').length;
  const degradedCount = health.components.filter(c => c.status === 'degraded').length;

  if (unhealthyCount > 0) {
    health.status = 'unhealthy';
  } else if (degradedCount > 1) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}

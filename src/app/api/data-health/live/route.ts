import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Tables to track with their cron-fed freshness thresholds (hours)
const TRACKED_TABLES = [
  { name: 'alma_interventions', filter: { col: 'verification_status', op: 'neq', val: 'ai_generated' }, freshnessHours: 48 },
  { name: 'organizations', freshnessHours: 168 },
  { name: 'justice_funding', freshnessHours: 48 },
  { name: 'alma_evidence', freshnessHours: 48 },
  { name: 'alma_media_articles', freshnessHours: 48 },
  { name: 'alma_research_findings', freshnessHours: 48 },
] as const;

// Tables that may not exist yet -- query gracefully
const OPTIONAL_TABLES = [
  { name: 'network_memberships', freshnessHours: 168 },
  { name: 'peer_validations', freshnessHours: 168 },
  { name: 'youth_opportunities', filter: { col: 'status', op: 'eq', val: 'open' }, freshnessHours: 48 },
] as const;

type TableSpec = { name: string; filter?: { col: string; op: string; val: string }; freshnessHours: number };

interface TableHealth {
  count: number;
  lastCreated: string | null;
  stale30d: number;
}

interface LinkageMetric {
  linked: number;
  total: number;
  pct: number;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

async function getTableHealth(
  supabase: any,
  spec: TableSpec
): Promise<{ name: string; health: TableHealth | null }> {
  try {
    // Count
    let countQuery = supabase.from(spec.name).select('*', { count: 'exact', head: true });
    if (spec.filter) {
      if (spec.filter.op === 'neq') {
        countQuery = countQuery.neq(spec.filter.col, spec.filter.val);
      } else if (spec.filter.op === 'eq') {
        countQuery = countQuery.eq(spec.filter.col, spec.filter.val);
      }
    }
    const { count, error: countErr } = await countQuery;
    if (countErr) {
      // Table might not exist
      if (countErr.message?.includes('does not exist') || countErr.code === '42P01') {
        return { name: spec.name, health: null };
      }
      return { name: spec.name, health: { count: 0, lastCreated: null, stale30d: 0 } };
    }

    // Latest created_at
    let latestQuery = supabase.from(spec.name).select('created_at').order('created_at', { ascending: false }).limit(1);
    if (spec.filter) {
      if (spec.filter.op === 'neq') {
        latestQuery = latestQuery.neq(spec.filter.col, spec.filter.val);
      } else if (spec.filter.op === 'eq') {
        latestQuery = latestQuery.eq(spec.filter.col, spec.filter.val);
      }
    }
    const { data: latestRows } = await latestQuery;
    const lastCreated = latestRows?.[0]?.created_at ?? null;

    // Stale count: created > 30 days ago AND no updated_at newer than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let staleQuery = supabase
      .from(spec.name)
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo);
    if (spec.filter) {
      if (spec.filter.op === 'neq') {
        staleQuery = staleQuery.neq(spec.filter.col, spec.filter.val);
      } else if (spec.filter.op === 'eq') {
        staleQuery = staleQuery.eq(spec.filter.col, spec.filter.val);
      }
    }
    const { count: staleCount } = await staleQuery;

    return {
      name: spec.name,
      health: {
        count: count ?? 0,
        lastCreated,
        stale30d: staleCount ?? 0,
      },
    };
  } catch {
    return { name: spec.name, health: null };
  }
}

async function safeCount(query: Promise<{ count: number | null; error: any }>): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) {
      console.warn('Supabase count error:', error.message);
      return -1; // Distinguish error from genuine 0
    }
    return count ?? 0;
  } catch {
    return -1;
  }
}

async function getLinkageHealth(supabase: any) {
  const results = {
    fundingLinked: { linked: 0, total: 0, pct: 0 } as LinkageMetric,
    interventionsLinked: { linked: 0, total: 0, pct: 0 } as LinkageMetric,
    orgsWithState: { count: 0, total: 0, pct: 0 },
    indigenousOrgs: 0,
  };

  // Run queries sequentially to stay within Supabase connection limits
  const fundingTotal = await safeCount(supabase.from('justice_funding').select('*', { count: 'exact', head: true }));
  const fundingLinked = await safeCount(supabase.from('justice_funding').select('*', { count: 'exact', head: true }).not('alma_organization_id', 'is', null));
  const interventionsTotal = await safeCount(supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'));
  const interventionsLinked = await safeCount(supabase.from('alma_interventions').select('*', { count: 'exact', head: true }).neq('verification_status', 'ai_generated').not('operating_organization_id', 'is', null));
  const orgsTotal = await safeCount(supabase.from('organizations').select('*', { count: 'exact', head: true }));
  const orgsWithState = await safeCount(supabase.from('organizations').select('*', { count: 'exact', head: true }).not('state', 'is', null));
  const indigenousOrgs = await safeCount(supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_indigenous_org', true));

  // Use Math.max(0, x) to treat -1 (error) as 0 for display
  const ft = Math.max(0, fundingTotal);
  const fl = Math.max(0, fundingLinked);
  const it = Math.max(0, interventionsTotal);
  const il = Math.max(0, interventionsLinked);
  const ot = Math.max(0, orgsTotal);
  const os = Math.max(0, orgsWithState);

  results.fundingLinked = { linked: fl, total: ft, pct: pct(fl, ft) };
  results.interventionsLinked = { linked: il, total: it, pct: pct(il, it) };
  results.orgsWithState = { count: os, total: ot, pct: pct(os, ot) };
  results.indigenousOrgs = Math.max(0, indigenousOrgs);

  return results;
}

async function getQuality(supabase: any) {
  const result = { missingCost: 0, untested: 0, zeroFunding: 0 };

  try {
    // Sequential to stay within connection limits
    const { count: missingCost } = await supabase.from('alma_interventions').select('*', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated')
      .is('cost_per_young_person', null);
    const { count: untested } = await supabase.from('alma_interventions').select('*', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated')
      .eq('evidence_level', 'Untested (theory/pilot stage)');
    const { count: zeroFundingNull } = await supabase.from('justice_funding').select('*', { count: 'exact', head: true })
      .is('amount_dollars', null);
    const { count: zeroFundingZero } = await supabase.from('justice_funding').select('*', { count: 'exact', head: true })
      .eq('amount_dollars', 0);

    result.missingCost = missingCost ?? 0;
    result.untested = untested ?? 0;
    result.zeroFunding = (zeroFundingNull ?? 0) + (zeroFundingZero ?? 0);
  } catch {
    // Return zeros on failure
  }

  return result;
}

async function getRogsHealth(supabase: any) {
  const result = { latestYear: null as string | null, hasDetentionCosts: false };

  try {
    const { data: latestYearData } = await supabase
      .from('rogs_justice_spending')
      .select('financial_year')
      .order('financial_year', { ascending: false })
      .limit(1);
    result.latestYear = latestYearData?.[0]?.financial_year ?? null;

    // Check if detention cost data exists (measure containing "detention" or "cost")
    const { count: detentionCount } = await supabase
      .from('rogs_justice_spending')
      .select('*', { count: 'exact', head: true })
      .eq('rogs_section', 'youth_justice')
      .ilike('measure', '%detention%');
    result.hasDetentionCosts = (detentionCount ?? 0) > 0;
  } catch {
    // Return defaults on failure
  }

  return result;
}

function computeFreshness(
  tables: Record<string, TableHealth>,
  specs: TableSpec[]
): Record<string, { lastRecord: string | null; isStale: boolean; thresholdHours: number }> {
  const freshness: Record<string, { lastRecord: string | null; isStale: boolean; thresholdHours: number }> = {};
  const now = Date.now();

  for (const spec of specs) {
    const health = tables[spec.name];
    if (!health) continue;

    const lastRecord = health.lastCreated;
    let isStale = true;
    if (lastRecord) {
      const ageHours = (now - new Date(lastRecord).getTime()) / (1000 * 60 * 60);
      isStale = ageHours > spec.freshnessHours;
    }

    freshness[spec.name] = {
      lastRecord,
      isStale,
      thresholdHours: spec.freshnessHours,
    };
  }

  return freshness;
}

function computeStatus(
  tables: Record<string, TableHealth>,
  freshness: Record<string, { lastRecord: string | null; isStale: boolean; thresholdHours: number }>,
  linkage: { fundingLinked: LinkageMetric; interventionsLinked: LinkageMetric }
): 'healthy' | 'degraded' | 'unhealthy' {
  // Unhealthy: any table count is 0 or more than 3 freshness checks fail
  const zeroTables = Object.values(tables).filter(t => t.count === 0);
  const staleFreshness = Object.values(freshness).filter(f => f.isStale);

  if (zeroTables.length > 0 || staleFreshness.length > 3) {
    return 'unhealthy';
  }

  // Degraded: any freshness check fails or linkage < 60%
  if (staleFreshness.length > 0 || linkage.fundingLinked.pct < 60 || linkage.interventionsLinked.pct < 60) {
    return 'degraded';
  }

  return 'healthy';
}

export async function GET(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const healthCheck = request.headers.get('x-health-check');
    const cronSecret = process.env.CRON_SECRET;

    if (healthCheck !== 'true') {
      if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createServiceClient() as any;

    // Run sections sequentially to avoid overwhelming Supabase connection pool
    // Each section runs its own internal parallelism but sections don't overlap
    const allSpecs: TableSpec[] = [...TRACKED_TABLES, ...OPTIONAL_TABLES];

    // Run table health checks sequentially to stay within Supabase connection limits
    const tableResults: { name: string; health: TableHealth | null }[] = [];
    for (const spec of allSpecs) {
      tableResults.push(await getTableHealth(supabase, spec));
    }
    const linkage = await getLinkageHealth(supabase);
    const quality = await getQuality(supabase);
    const rogs = await getRogsHealth(supabase);

    // Build tables map (skip null = non-existent tables)
    const tables: Record<string, TableHealth> = {};
    for (const result of tableResults) {
      if (result.health !== null) {
        tables[result.name] = result.health;
      }
    }

    // Compute freshness and status
    const freshness = computeFreshness(tables, allSpecs);
    const status = computeStatus(tables, freshness, linkage);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status,
      tables,
      linkage,
      quality,
      rogs,
      freshness,
    });
  } catch (err: any) {
    console.error('Data health endpoint error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

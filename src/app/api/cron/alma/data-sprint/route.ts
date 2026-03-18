import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * ALMA Data Sprint Agent
 *
 * Autonomous cron agent that systematically closes data gaps.
 * Runs daily and picks the highest-impact gap to work on.
 *
 * Modes (via ?mode= or auto-selected by gap priority):
 * - linkage:     Link unlinked funding records to organizations via ABN
 * - gs_bridge:   Link new orgs to GrantScope entities via ABN
 * - orphan_fix:  Link orphan interventions to organizations by name match
 * - freshness:   Re-scrape stale open data sources (>30 days old)
 * - coverage:    Find and fill research coverage gaps (calls coverage API)
 *
 * Reports progress to alma_research_findings as a "sprint_report" finding.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'auto';
  const batch = Math.min(Math.max(parseInt(url.searchParams.get('batch') || '200'), 1), 1000);

  const supabase = createServiceClient();

  try {
    if (mode === 'auto') {
      // Pick highest-impact gap
      const gaps = await assessGaps(supabase);
      const topGap = gaps.sort((a, b) => b.impact - a.impact)[0];
      if (!topGap) {
        return NextResponse.json({ message: 'No actionable gaps found', gaps });
      }
      const result = await runSprint(supabase, topGap.mode, batch);
      return NextResponse.json({ selected_mode: topGap.mode, reason: topGap.reason, ...result, all_gaps: gaps });
    }

    const result = await runSprint(supabase, mode, batch);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Data Sprint] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type Gap = { mode: string; reason: string; impact: number; count: number };

async function assessGaps(supabase: ReturnType<typeof createServiceClient>): Promise<Gap[]> {
  const gaps: Gap[] = [];

  // 1. Unlinked funding records (have ABN but no alma_organization_id)
  const { count: unlinkedFunding } = await supabase
    .from('justice_funding')
    .select('id', { count: 'exact', head: true })
    .not('recipient_abn', 'is', null)
    .is('alma_organization_id', null);

  if (unlinkedFunding && unlinkedFunding > 0) {
    gaps.push({
      mode: 'linkage',
      reason: `${unlinkedFunding.toLocaleString()} funding records have ABN but no org link`,
      impact: Math.min(unlinkedFunding / 100, 100), // Cap at 100
      count: unlinkedFunding,
    });
  }

  // 2. Orgs without GS entity link (have ABN but no gs_entity_id)
  const { count: unlinkedGS } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .not('abn', 'is', null)
    .is('gs_entity_id', null);

  if (unlinkedGS && unlinkedGS > 0) {
    gaps.push({
      mode: 'gs_bridge',
      reason: `${unlinkedGS.toLocaleString()} orgs have ABN but no GrantScope link`,
      impact: Math.min(unlinkedGS / 50, 80),
      count: unlinkedGS,
    });
  }

  // 3. Orphan interventions (no operating_organization_id)
  const { count: orphanInterventions } = await supabase
    .from('alma_interventions')
    .select('id', { count: 'exact', head: true })
    .neq('verification_status', 'ai_generated')
    .is('operating_organization_id', null)
    .not('operating_organization', 'is', null);

  if (orphanInterventions && orphanInterventions > 0) {
    gaps.push({
      mode: 'orphan_fix',
      reason: `${orphanInterventions} interventions have org name but no org link`,
      impact: orphanInterventions * 2, // High value per intervention
      count: orphanInterventions,
    });
  }

  // 4. Stale open data (findings older than 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { count: staleFindings } = await supabase
    .from('alma_research_findings')
    .select('id', { count: 'exact', head: true })
    .eq('finding_type', 'external_source')
    .lt('created_at', thirtyDaysAgo);

  if (staleFindings && staleFindings > 0) {
    gaps.push({
      mode: 'freshness',
      reason: `${staleFindings} external source findings are >30 days old`,
      impact: staleFindings * 0.5,
      count: staleFindings,
    });
  }

  return gaps;
}

async function runSprint(
  supabase: ReturnType<typeof createServiceClient>,
  mode: string,
  batch: number
): Promise<Record<string, unknown>> {
  const start = Date.now();

  switch (mode) {
    case 'linkage':
      return sprintLinkage(supabase, batch, start);
    case 'gs_bridge':
      return sprintGSBridge(supabase, batch, start);
    case 'orphan_fix':
      return sprintOrphanFix(supabase, batch, start);
    case 'freshness':
      return sprintFreshness(supabase, batch, start);
    default:
      return { error: `Unknown sprint mode: ${mode}` };
  }
}

/**
 * Sprint: Link funding records to organizations by ABN match
 */
async function sprintLinkage(
  supabase: ReturnType<typeof createServiceClient>,
  batch: number,
  start: number
) {
  // Get unlinked funding records with ABN
  const { data: unlinked } = await supabase
    .from('justice_funding')
    .select('id, recipient_abn')
    .not('recipient_abn', 'is', null)
    .is('alma_organization_id', null)
    .limit(batch);

  if (!unlinked?.length) return { mode: 'linkage', linked: 0, message: 'No unlinked records' };

  // Get all org ABNs
  const uniqueAbns = [...new Set(unlinked.map(f => f.recipient_abn))];
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, abn')
    .in('abn', uniqueAbns);

  const abnToOrgId = new Map((orgs || []).map(o => [o.abn, o.id]));

  let linked = 0;
  const updates: { id: string; alma_organization_id: string }[] = [];

  for (const f of unlinked) {
    const orgId = abnToOrgId.get(f.recipient_abn);
    if (orgId) {
      updates.push({ id: f.id, alma_organization_id: orgId });
      linked++;
    }
  }

  // Batch update
  for (let i = 0; i < updates.length; i += 500) {
    const chunk = updates.slice(i, i + 500);
    for (const u of chunk) {
      await supabase.from('justice_funding').update({ alma_organization_id: u.alma_organization_id }).eq('id', u.id);
    }
  }

  return {
    mode: 'linkage',
    processed: unlinked.length,
    linked,
    no_org_found: unlinked.length - linked,
    duration_ms: Date.now() - start,
  };
}

/**
 * Sprint: Bridge organizations to GrantScope entities by ABN
 */
async function sprintGSBridge(
  supabase: ReturnType<typeof createServiceClient>,
  batch: number,
  start: number
) {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, abn')
    .not('abn', 'is', null)
    .is('gs_entity_id', null)
    .limit(batch);

  if (!orgs?.length) return { mode: 'gs_bridge', linked: 0, message: 'All orgs already linked' };

  const uniqueAbns = [...new Set(orgs.map(o => o.abn))];

  // Query GS entities by ABN in batches
  let linked = 0;
  for (let i = 0; i < uniqueAbns.length; i += 50) {
    const abnBatch = uniqueAbns.slice(i, i + 50);
    const { data: gsEntities } = await supabase
      .from('gs_entities')
      .select('id, abn')
      .in('abn', abnBatch);

    if (!gsEntities?.length) continue;

    const abnToGsId = new Map(gsEntities.map(e => [e.abn, e.id]));

    for (const org of orgs) {
      const gsId = abnToGsId.get(org.abn);
      if (gsId) {
        await supabase.from('organizations').update({ gs_entity_id: gsId }).eq('id', org.id);
        linked++;
      }
    }
  }

  return {
    mode: 'gs_bridge',
    processed: orgs.length,
    linked,
    duration_ms: Date.now() - start,
  };
}

/**
 * Sprint: Link orphan interventions to organizations by name match
 */
async function sprintOrphanFix(
  supabase: ReturnType<typeof createServiceClient>,
  batch: number,
  start: number
) {
  const { data: orphans } = await supabase
    .from('alma_interventions')
    .select('id, operating_organization')
    .neq('verification_status', 'ai_generated')
    .is('operating_organization_id', null)
    .not('operating_organization', 'is', null)
    .limit(batch);

  if (!orphans?.length) return { mode: 'orphan_fix', linked: 0, message: 'No orphan interventions' };

  // Get unique org names
  const uniqueNames = [...new Set(orphans.map(o => o.operating_organization))];

  let linked = 0;
  for (const name of uniqueNames) {
    // Try exact match first
    const { data: match } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', name)
      .maybeSingle();

    if (match) {
      const ids = orphans.filter(o => o.operating_organization === name).map(o => o.id);
      for (const id of ids) {
        await supabase.from('alma_interventions').update({ operating_organization_id: match.id }).eq('id', id);
        linked++;
      }
    }
  }

  return {
    mode: 'orphan_fix',
    processed: orphans.length,
    unique_orgs: uniqueNames.length,
    linked,
    duration_ms: Date.now() - start,
  };
}

/**
 * Sprint: Check freshness of external data sources
 */
async function sprintFreshness(
  supabase: ReturnType<typeof createServiceClient>,
  batch: number,
  start: number
) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: stale } = await supabase
    .from('alma_research_findings')
    .select('id, content, sources')
    .eq('finding_type', 'external_source')
    .lt('created_at', thirtyDaysAgo)
    .limit(batch);

  if (!stale?.length) return { mode: 'freshness', checked: 0, message: 'No stale sources' };

  let checked = 0;
  let refreshed = 0;
  let failed = 0;

  for (const finding of stale) {
    const sources = finding.sources as string[] | null;
    if (!sources?.length) continue;

    // Check if source URL is still reachable
    const sourceUrl = sources[0];
    try {
      const res = await fetch(sourceUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      checked++;

      if (res.ok) {
        // Mark as freshly validated
        await supabase.from('alma_research_findings').update({
          validated: true,
        }).eq('id', finding.id);
        refreshed++;
      } else {
        // Mark as potentially stale
        await supabase.from('alma_research_findings').update({
          validated: false,
          confidence: 'low',
        }).eq('id', finding.id);
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return {
    mode: 'freshness',
    total_stale: stale.length,
    checked,
    refreshed,
    failed,
    duration_ms: Date.now() - start,
  };
}

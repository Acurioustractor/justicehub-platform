import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Weekly inventory refresh.
 *
 * Recounts row_count + bumps last_refreshed_at on every active source whose
 * source_key maps to a real table. Sources backed by external APIs get a
 * "we looked" timestamp without a recount.
 *
 * Authorised via CRON_SECRET. Scheduled in vercel.json.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

const COUNT_QUERIES: Record<string, { table: string; filter?: (q: any) => any }> = {
  abr_registry: { table: 'abr_registry' },
  acnc_charities: { table: 'acnc_charities' },
  oric_corporations: { table: 'oric_corporations' },
  ato_tax_transparency: { table: 'ato_tax_transparency' },
  ndis_registered_providers: { table: 'ndis_registered_providers' },
  foundation_grantees: { table: 'foundation_grantees' },
  vic_grants_awarded: { table: 'vic_grants_awarded' },
  grant_opportunities: { table: 'grant_opportunities' },
  justice_funding: { table: 'justice_funding' },
  rogs_justice_spending: { table: 'rogs_justice_spending' },
  aihw_youth_justice_stats: { table: 'aihw_youth_justice_stats' },
  alma_interventions: {
    table: 'alma_interventions',
    filter: (q) => q.eq('serves_youth_justice', true).neq('verification_status', 'ai_generated'),
  },
  civic_org_classifications: {
    table: 'civic_org_classifications',
    filter: (q) => q.eq('tier', 1).not('confirmed_at', 'is', null),
  },
  oversight_recommendations: { table: 'oversight_recommendations' },
  civic_hansard: { table: 'civic_hansard' },
  civic_charter_commitments: { table: 'civic_charter_commitments' },
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const service = createServiceClient() as any;
  const now = new Date().toISOString();
  const refreshed: any[] = [];
  const errors: any[] = [];

  for (const [sourceKey, conf] of Object.entries(COUNT_QUERIES)) {
    try {
      let q = service.from(conf.table).select('id', { count: 'exact', head: true });
      if (conf.filter) q = conf.filter(q);
      const { count, error } = await q;
      if (error) {
        errors.push({ sourceKey, error: error.message });
        continue;
      }
      const { error: updErr } = await service
        .from('data_sources_inventory')
        .update({ row_count: count ?? 0, last_refreshed_at: now, updated_at: now })
        .eq('source_key', sourceKey)
        .eq('status', 'active');
      if (updErr) errors.push({ sourceKey, error: updErr.message });
      else refreshed.push({ sourceKey, count: count ?? 0 });
    } catch (err: any) {
      errors.push({ sourceKey, error: err?.message || String(err) });
    }
  }

  // "We looked" timestamp for external API sources
  await service
    .from('data_sources_inventory')
    .update({ last_refreshed_at: now, updated_at: now })
    .eq('source_key', 'empathy_ledger')
    .eq('status', 'active');

  return NextResponse.json({
    ok: true,
    refreshedCount: refreshed.length,
    errorCount: errors.length,
    refreshed,
    errors,
  });
}

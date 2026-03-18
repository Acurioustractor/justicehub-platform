import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * Refresh sector_map_cache with pre-computed aggregations.
 * Runs daily — computes funding totals, intervention types, top orgs.
 * Heavy queries (gs_entities, qgip) use approximate counts to stay within timeout.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: Record<string, string> = {};

  // 1. Intervention types
  try {
    const { data } = await supabase
      .from('alma_interventions')
      .select('type')
      .neq('verification_status', 'ai_generated');
    const counts: Record<string, number> = {};
    for (const r of data || []) counts[r.type] = (counts[r.type] || 0) + 1;
    const types = Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
    await upsert(supabase, 'intervention_types', types);
    results.intervention_types = 'ok';
  } catch (e: any) {
    results.intervention_types = e.message;
  }

  // 2. Funding total (from existing cache rows to avoid timeout)
  try {
    const { data: cached } = await supabase
      .from('sector_map_cache')
      .select('data')
      .eq('key', 'funding_by_source')
      .single();
    if (cached?.data) {
      const totalB = (cached.data as any[]).reduce((s: number, r: any) => s + (r.total_millions || 0), 0) / 1000;
      await upsert(supabase, 'funding_total', { total_billions: Math.round(totalB * 10) / 10 });
      results.funding_total = 'ok';
    } else {
      results.funding_total = 'skipped (no funding_by_source cache)';
    }
  } catch (e: any) {
    results.funding_total = e.message;
  }

  // 3. Top funded orgs (via RPC — fast)
  try {
    const { data, error } = await supabase.rpc('get_sector_top_orgs');
    if (error) throw error;
    await upsert(supabase, 'top_funded_orgs', data);
    results.top_funded_orgs = `ok (${data?.length || 0} rows)`;
  } catch (e: any) {
    results.top_funded_orgs = e.message;
  }

  return NextResponse.json({ refreshed: results, timestamp: new Date().toISOString() });
}

async function upsert(supabase: any, key: string, data: any) {
  const { error } = await supabase
    .from('sector_map_cache')
    .upsert({ key, data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

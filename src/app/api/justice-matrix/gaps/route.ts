/**
 * GET /api/justice-matrix/gaps — the corpus-gap acquisition queue (admin only).
 *
 * Returns the questions /ask could not confidently answer, most-asked first.
 * This is the demand signal for Phase 3 corpus growth. Admin-gated because it
 * exposes what readers are searching for.
 *
 * Query params:
 *   status — open (default) | acquiring | resolved | dismissed | all
 *   limit  — default 50, max 200
 *
 * Degrades to an empty list before the migration is applied (table absent).
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

const STATUSES = ['open', 'acquiring', 'resolved', 'dismissed'] as const;

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status') ?? 'open';
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number]) ? statusParam : null;
  const limitRaw = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

  try {
    const supabase = createServiceClient();
    let query = supabase
      .from('justice_matrix_gaps')
      .select(
        'id,question,surface,intent,confidence,citation_count,best_distance,relaxed,plan_source,categories,status,hit_count,first_seen_at,last_seen_at',
      )
      .order('hit_count', { ascending: false })
      .order('last_seen_at', { ascending: false })
      .limit(limit);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      // Pre-migration the table is absent; return an honest empty queue.
      return NextResponse.json({ gaps: [], total: 0, status: status ?? 'all', note: 'gap log unavailable' });
    }
    return NextResponse.json({ gaps: data ?? [], total: (data ?? []).length, status: status ?? 'all' });
  } catch {
    return NextResponse.json({ gaps: [], total: 0, status: status ?? 'all', note: 'gap log unavailable' });
  }
}

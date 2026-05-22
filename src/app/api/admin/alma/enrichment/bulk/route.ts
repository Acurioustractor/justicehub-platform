import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { approveCandidate, ALLOWED_FIELDS } from '@/lib/alma/approve-candidate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface BulkApproveBody {
  action: 'approve_many';
  candidate_ids: string[];
  // If omitted, every field the candidate has goes through (still filtered
  // by "already populated" in the approve helper unless overwrite=true).
  fields?: string[];
  overwrite?: boolean;
}

const MAX_PER_CALL = 200;

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as BulkApproveBody;
    if (body.action !== 'approve_many') {
      return NextResponse.json({ error: 'action must be approve_many' }, { status: 400 });
    }

    const ids = (Array.isArray(body.candidate_ids) ? body.candidate_ids : []).filter(
      (id): id is string => typeof id === 'string' && id.length > 0
    );
    if (ids.length === 0) {
      return NextResponse.json({ error: 'candidate_ids[] required' }, { status: 400 });
    }
    if (ids.length > MAX_PER_CALL) {
      return NextResponse.json(
        { error: `bulk approve capped at ${MAX_PER_CALL} candidates per call (got ${ids.length})` },
        { status: 400 }
      );
    }

    // Default to all known fields. The approve helper will skip per-field
    // when the org already has a value (and overwrite is false), so passing
    // 'all' here is safe — nothing destructive happens.
    const fields = Array.isArray(body.fields) && body.fields.length > 0 ? body.fields : ALLOWED_FIELDS;
    const overwrite = body.overwrite === true;

    const supabase = createServiceClient();

    // Run sequentially. Each approve does ~4 DB round-trips; we don't want
    // 200 of them in flight at once. A small concurrency window is plenty
    // and keeps the response shape simple.
    const concurrency = 4;
    const queue = [...ids];
    type Outcome = {
      candidateId: string;
      orgId: string | null;
      ok: boolean;
      status: string;
      applied?: string[];
      message?: string;
    };
    const results: Outcome[] = [];
    async function worker() {
      while (queue.length > 0) {
        const id = queue.shift();
        if (!id) break;
        const r = await approveCandidate(supabase, {
          candidateId: id,
          fields,
          overwrite,
          reviewerId: admin.user.id,
        });
        if (r.ok) {
          results.push({
            candidateId: r.candidateId,
            orgId: r.orgId,
            ok: true,
            status: r.status,
            applied: r.applied,
          });
        } else {
          results.push({
            candidateId: r.candidateId,
            orgId: r.orgId,
            ok: false,
            status: r.status,
            message: r.message,
          });
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const summary = {
      total: results.length,
      approved: results.filter((r) => r.ok).length,
      no_changes: results.filter((r) => r.status === 'no_changes').length,
      already_actioned: results.filter((r) => r.status === 'already_actioned').length,
      errored: results.filter((r) => !r.ok && r.status === 'error').length,
      fields_applied: results
        .filter((r) => r.ok)
        .reduce((sum, r) => sum + (r.applied?.length || 0), 0),
    };

    return NextResponse.json({ ok: true, summary, results });
  } catch (e: any) {
    console.error('[enrichment bulk POST] failed:', e);
    return NextResponse.json({ error: e?.message || 'internal error' }, { status: 500 });
  }
}

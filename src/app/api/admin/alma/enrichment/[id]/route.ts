import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { approveCandidate } from '@/lib/alma/approve-candidate';

export const dynamic = 'force-dynamic';

interface ApproveBody {
  action: 'approve';
  fields: string[];
  overwrite?: boolean;
}

interface RejectBody {
  action: 'reject';
  rejection_reason: string;
}

interface UpdateUrlBody {
  action: 'update_url';
  url: string;
}

type Body = ApproveBody | RejectBody | UpdateUrlBody;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'candidate id required' }, { status: 400 });
    }

    const body = (await request.json()) as Body;

    if (body.action !== 'approve' && body.action !== 'reject' && body.action !== 'update_url') {
      return NextResponse.json(
        { error: 'action must be approve | reject | update_url' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Load the candidate
    const { data: candidate, error: candidateErr } = await supabase
      .from('alma_org_enrichment_candidates')
      .select('id, organization_id, extracted_fields, status, source')
      .eq('id', id)
      .single();

    if (candidateErr || !candidate) {
      return NextResponse.json(
        { error: 'candidate not found' },
        { status: 404 }
      );
    }

    if (candidate.status === 'approved' || candidate.status === 'rejected') {
      return NextResponse.json(
        { error: `candidate already ${candidate.status}` },
        { status: 409 }
      );
    }

    if (body.action === 'update_url') {
      const raw = (body.url || '').trim();
      if (!raw) {
        return NextResponse.json({ error: 'url required' }, { status: 400 });
      }
      let normalised: string;
      try {
        const s = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        normalised = new URL(s).href;
      } catch {
        return NextResponse.json({ error: 'url is not parseable' }, { status: 400 });
      }
      const { error: orgErr } = await supabase
        .from('organizations')
        .update({ website_url: normalised, updated_at: new Date().toISOString() })
        .eq('id', candidate.organization_id);
      if (orgErr) throw orgErr;
      // Mark the repair candidate as resolved. We use 'rejected' with a
      // structured rejection_reason because the candidate's extracted
      // fields belong to a different entity — they're not data we want,
      // just a useful signal that pointed us at the URL fix.
      const { error: markErr } = await supabase
        .from('alma_org_enrichment_candidates')
        .update({
          status: 'rejected',
          rejection_reason: 'url_repaired',
          reviewed_by: admin.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (markErr) throw markErr;
      return NextResponse.json({
        ok: true,
        status: 'url_repaired',
        new_url: normalised,
      });
    }

    if (body.action === 'reject') {
      const reason = (body.rejection_reason || '').trim();
      if (!reason) {
        return NextResponse.json(
          { error: 'rejection_reason required' },
          { status: 400 }
        );
      }
      const { error: updateErr } = await supabase
        .from('alma_org_enrichment_candidates')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: admin.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateErr) throw updateErr;
      return NextResponse.json({ ok: true, status: 'rejected' });
    }

    // Approve path — delegate to the shared helper so single + bulk routes
    // run the same code.
    const result = await approveCandidate(supabase, {
      candidateId: id,
      fields: Array.isArray(body.fields) ? body.fields : [],
      overwrite: body.overwrite === true,
      reviewerId: admin.user.id,
    });
    if (!result.ok) {
      const httpStatus =
        result.status === 'candidate_missing' || result.status === 'org_missing'
          ? 404
          : result.status === 'already_actioned'
          ? 409
          : result.status === 'no_changes'
          ? 200
          : 400;
      return NextResponse.json(
        { ok: false, status: result.status, error: result.message, skipped: result.skipped },
        { status: httpStatus }
      );
    }
    return NextResponse.json({
      ok: true,
      status: 'approved',
      applied: result.applied,
      skipped: result.skipped,
      completeness: result.completeness,
    });
  } catch (e: any) {
    console.error('[enrichment POST] failed:', e);
    return NextResponse.json(
      { error: e?.message || 'internal error' },
      { status: 500 }
    );
  }
}

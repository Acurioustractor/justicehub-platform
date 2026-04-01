import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-auth';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  GRANT_MATCH_REVIEW_SOURCE,
  GRANT_MATCH_REVIEW_TASK_TYPE,
} from '@/lib/funding/grant-matching';

function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

function toReviewItem(task: any, orgNames: Map<string, string>) {
  const payload = (task.reply_to && typeof task.reply_to === 'object')
    ? (task.reply_to as Record<string, any>)
    : {};

  const organizationId = typeof payload.organization_id === 'string'
    ? payload.organization_id
    : null;

  return {
    id: task.id,
    status: task.status,
    needsReview: task.needs_review === true,
    createdAt: task.created_at,
    reviewDecision: task.review_decision,
    reviewFeedback: task.review_feedback,
    reviewedAt: task.reviewed_at,
    organizationId,
    organizationName:
      (typeof payload.organization_name === 'string' && payload.organization_name) ||
      (organizationId ? orgNames.get(organizationId) || null : null),
    opportunityId: typeof payload.opportunity_id === 'string' ? payload.opportunity_id : null,
    opportunityName: typeof payload.opportunity_name === 'string' ? payload.opportunity_name : null,
    funderName: typeof payload.funder_name === 'string' ? payload.funder_name : null,
    score: typeof payload.score === 'number' ? payload.score : null,
    confidence: typeof payload.confidence === 'number' ? payload.confidence : null,
    reasons: Array.isArray(payload.reasons) ? payload.reasons : [],
    daysToDeadline: typeof payload.days_to_deadline === 'number' ? payload.days_to_deadline : null,
    hasEligibilityRisk: payload.has_eligibility_risk === true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 50)));

    const serviceClient = getServiceClient();
    let query = serviceClient
      .from('agent_task_queue')
      .select('id, status, needs_review, created_at, review_decision, review_feedback, reviewed_at, reply_to')
      .eq('source', GRANT_MATCH_REVIEW_SOURCE)
      .eq('task_type', GRANT_MATCH_REVIEW_TASK_TYPE)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status === 'pending') {
      query = query.is('review_decision', null);
    } else if (status === 'reviewed') {
      query = query.not('review_decision', 'is', null);
    }

    const [
      { data: tasks, error: tasksError },
      { count: pendingCount, error: pendingError },
      { count: reviewedCount, error: reviewedError },
    ] = await Promise.all([
      query,
      serviceClient
        .from('agent_task_queue')
        .select('*', { count: 'exact', head: true })
        .eq('source', GRANT_MATCH_REVIEW_SOURCE)
        .eq('task_type', GRANT_MATCH_REVIEW_TASK_TYPE)
        .is('review_decision', null),
      serviceClient
        .from('agent_task_queue')
        .select('*', { count: 'exact', head: true })
        .eq('source', GRANT_MATCH_REVIEW_SOURCE)
        .eq('task_type', GRANT_MATCH_REVIEW_TASK_TYPE)
        .not('review_decision', 'is', null),
    ]);

    if (tasksError) throw new Error(tasksError.message);
    if (pendingError) throw new Error(pendingError.message);
    if (reviewedError) throw new Error(reviewedError.message);

    const orgIds = Array.from(
      new Set(
        (tasks || [])
          .map((task) => {
            if (!task.reply_to || typeof task.reply_to !== 'object') return null;
            const value = (task.reply_to as Record<string, unknown>).organization_id;
            return typeof value === 'string' ? value : null;
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    const orgNames = new Map<string, string>();
    if (orgIds.length > 0) {
      const { data: orgs } = await serviceClient
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      for (const org of orgs || []) {
        orgNames.set(org.id, org.name);
      }
    }

    return NextResponse.json({
      items: (tasks || []).map((task) => toReviewItem(task, orgNames)),
      stats: {
        pending: pendingCount || 0,
        reviewed: reviewedCount || 0,
        total: (pendingCount || 0) + (reviewedCount || 0),
      },
      status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const taskId = typeof body.taskId === 'string' ? body.taskId : null;
    const decision = typeof body.decision === 'string' ? body.decision : null;
    const feedback = typeof body.feedback === 'string' ? body.feedback : null;

    if (!taskId || !decision) {
      return NextResponse.json(
        { error: 'taskId and decision are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'needs_more_info'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be approved, rejected, or needs_more_info' },
        { status: 400 }
      );
    }

    const serviceClient = getServiceClient();
    const { data: task, error: taskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, output')
      .eq('id', taskId)
      .eq('source', GRANT_MATCH_REVIEW_SOURCE)
      .eq('task_type', GRANT_MATCH_REVIEW_TASK_TYPE)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Review task not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const nextStatus = decision === 'approved'
      ? 'completed'
      : decision === 'rejected'
        ? 'dismissed'
        : 'queued';

    const existingOutput = (task.output && typeof task.output === 'object')
      ? (task.output as Record<string, unknown>)
      : {};

    const { data: updated, error: updateError } = await serviceClient
      .from('agent_task_queue')
      .update({
        status: nextStatus,
        needs_review: decision === 'needs_more_info',
        review_decision: decision,
        review_feedback: feedback,
        reviewed_by: user.id,
        reviewed_at: now,
        updated_at: now,
        output: {
          ...existingOutput,
          review: {
            decision,
            feedback,
            reviewed_at: now,
            reviewed_by: user.id,
          },
        },
      })
      .eq('id', taskId)
      .select('id, status, needs_review, review_decision, review_feedback, reviewed_at')
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      success: true,
      task: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

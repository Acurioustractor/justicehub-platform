import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import {
  formatAmountRange,
  runGrantMatchingForOrganization,
  type ScoredGrantMatch,
} from '@/lib/funding/grant-matching';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const serviceClient = getServiceClient();
    const body = await request.json().catch(() => ({}));
    const queueNotionWorkers = body?.queueNotionWorkers === true;

    const result = await runGrantMatchingForOrganization({
      userClient: supabase,
      serviceClient,
      organizationId: orgId,
      queueNotionWorkers,
      queueReviewTasks: true,
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      matches: (result.matches || []).map((m: ScoredGrantMatch) => ({
        id: m.opportunity.id,
        title: m.opportunity.name,
        name: m.opportunity.name,
        funder: m.opportunity.funder_name,
        sourceType: m.opportunity.source_type || null,
        amountMin: m.opportunity.min_grant_amount ?? null,
        amountMax: m.opportunity.max_grant_amount ?? null,
        amountLabel: formatAmountRange(
          m.opportunity.min_grant_amount,
          m.opportunity.max_grant_amount
        ),
        closingDate: m.opportunity.deadline,
        deadline: m.opportunity.deadline,
        daysToDeadline: m.daysToDeadline,
        score: m.score,
        confidence: m.confidence,
        notifyEligible: m.notifyEligible,
        needsHumanReview: m.needsHumanReview,
        reasons: m.reasons,
      })),
      notionWorkerQueue: result.notionWorkerQueue || null,
      reviewQueue: result.reviewQueue || null,
      message: result.message || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

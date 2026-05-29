import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import {
  fundingOsErrorResponse,
  type FundingDiscoveryReviewWorkspaceInput,
  upsertFundingDiscoveryReviewWorkspace,
} from '@/lib/funding/funding-operating-system';

function toWorkspaceInput(body: Record<string, unknown>): FundingDiscoveryReviewWorkspaceInput {
  return {
    organizationId: String(body.organizationId || ''),
    note:
      Object.prototype.hasOwnProperty.call(body, 'note') &&
      (typeof body.note === 'string' || body.note === null)
        ? (body.note as string | null)
        : undefined,
    decisionTag:
      Object.prototype.hasOwnProperty.call(body, 'decisionTag') &&
      (typeof body.decisionTag === 'string' || body.decisionTag === null)
        ? (body.decisionTag as FundingDiscoveryReviewWorkspaceInput['decisionTag'])
        : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const input = toWorkspaceInput(body);

    if (!input.organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!await checkOrgAccess(supabase, user.id, input.organizationId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const workspace = await upsertFundingDiscoveryReviewWorkspace(input, user.id);

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

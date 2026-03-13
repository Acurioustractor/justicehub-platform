import { NextRequest, NextResponse } from 'next/server';
import {
  closeFundingConversationWithOutcome,
  createFundingConversationRequest,
  fundingOsErrorResponse,
  promoteFundingConversationFollowUpToRelationship,
  scheduleFundingConversationNextStep,
  submitFundingConversationRequestResponse,
  updateFundingConversationOutcomeFollowUpStatus,
  updateFundingRelationshipEngagementStage,
  updateFundingRelationshipPathwayTaskStatus,
} from '@/lib/funding/funding-operating-system';
import { createServiceClient } from '@/lib/supabase/service-lite';

function getSmokeSecret() {
  return String(process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

async function getAnyAdminUserId() {
  const serviceClient = createServiceClient() as any;
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load admin user for funding smoke');
  }

  if (!data?.id) {
    throw new Error('Validation: No admin profile available for funding smoke');
  }

  return String(data.id);
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const configuredSecret = getSmokeSecret();
  const providedSecret =
    request.headers.get('x-funding-smoke-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const recommendationId = String(body.recommendationId || '').trim();
    const adminUserId = await getAnyAdminUserId();

    const conversation = await createFundingConversationRequest(recommendationId, adminUserId);
    await submitFundingConversationRequestResponse(conversation.taskId, {
      responderName: 'Funding Smoke Community Partner',
      responderEmail: 'funding-smoke@example.org',
      responseKind: 'interested',
      responseMessage: `Funding smoke relationship pathway reply ${new Date().toISOString()}`,
    });

    const nextStep = await scheduleFundingConversationNextStep(conversation.taskId, adminUserId);
    const outcome = await closeFundingConversationWithOutcome(
      conversation.taskId,
      'mutual_fit',
      adminUserId
    );

    if (!outcome.outcomeFollowUpTaskId) {
      throw new Error('Validation: Outcome follow-up task was not created');
    }

    const completedOutcomeFollowUp = await updateFundingConversationOutcomeFollowUpStatus(
      outcome.outcomeFollowUpTaskId,
      'completed',
      adminUserId
    );
    const relationship = await promoteFundingConversationFollowUpToRelationship(
      outcome.outcomeFollowUpTaskId,
      adminUserId
    );
    const stage = await updateFundingRelationshipEngagementStage(
      relationship.relationshipId,
      'engaged_partner',
      adminUserId
    );

    if (!stage.pathwayTaskId) {
      throw new Error('Validation: Relationship pathway task was not created');
    }

    const pathway = await updateFundingRelationshipPathwayTaskStatus(
      stage.pathwayTaskId,
      'completed',
      adminUserId
    );

    return NextResponse.json({
      success: true,
      adminUserId,
      recommendationId,
      conversation,
      nextStep,
      outcome,
      completedOutcomeFollowUp,
      relationship,
      stage,
      pathway,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

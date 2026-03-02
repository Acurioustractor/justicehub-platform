import { NextRequest, NextResponse } from 'next/server';
import {
  acknowledgeFundingPublicEvidenceSubmission,
  escalateFundingPublicEvidenceSubmission,
  fundingOsErrorResponse,
  promoteFundingPublicEvidenceToOperatingQueue,
} from '@/lib/funding/funding-operating-system';
import { createServiceClient } from '@/lib/supabase/service';

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
    const kind = String(body.kind || '').trim().toLowerCase() as 'update' | 'validation';
    const submissionId = String(body.submissionId || '').trim();
    const adminUserId = await getAnyAdminUserId();

    const acknowledged = await acknowledgeFundingPublicEvidenceSubmission(
      { kind, submissionId },
      adminUserId
    );
    const localFollowUp = await escalateFundingPublicEvidenceSubmission(
      { kind, submissionId },
      adminUserId
    );
    const operatingFollowUp = await promoteFundingPublicEvidenceToOperatingQueue(
      { kind, submissionId },
      adminUserId
    );

    return NextResponse.json({
      success: true,
      adminUserId,
      acknowledged,
      localFollowUp,
      operatingFollowUp,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}

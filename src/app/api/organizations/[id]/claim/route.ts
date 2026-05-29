import { createClient } from '@/lib/supabase/server-lite';
import { NextRequest, NextResponse } from 'next/server';
import {
  OrganizationClaimError,
  submitOrganizationClaim,
} from '@/lib/organizations/claim-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    if (!UUID_REGEX.test(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await submitOrganizationClaim({
      user: { id: user.id, email: user.email },
      input: {
        ...(await request.json()),
        organization_id: organizationId,
      },
    });

    return NextResponse.json(result, { status: result.httpStatus || 200 });
  } catch (error) {
    if (error instanceof OrganizationClaimError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error submitting org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    if (!UUID_REGEX.test(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { claim: null },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { data: claim } = await (supabase as any)
      .from('organization_claims')
      .select('id, status, created_at, contact_email')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json(
      { claim: claim || null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error checking org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

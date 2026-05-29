import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import {
  OrganizationClaimError,
  submitOrganizationClaim,
} from '@/lib/organizations/claim-service';

/**
 * POST /api/hub/claim-org
 *
 * Canonical organization claim endpoint. It can claim an existing JusticeHub
 * organization or create/link one from CivicGraph by gs_entity_id or ABN.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await submitOrganizationClaim({
      user: { id: user.id, email: user.email },
      input: await request.json(),
    });

    return NextResponse.json(result, { status: result.httpStatus || 200 });
  } catch (error) {
    if (error instanceof OrganizationClaimError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error submitting hub org claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

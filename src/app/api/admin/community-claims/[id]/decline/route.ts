/**
 * POST /api/admin/community-claims/[id]/decline
 *
 * Reject a pending claim (status 'rejected', the existing claim system's
 * vocabulary). Voids any invite token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const { data, error } = await admin.supabase
    .from('organization_claims')
    .update({
      status: 'rejected',
      invite_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Claim not found or not pending' },
      { status: 404 }
    );
  }
  return NextResponse.json({ id: data.id, status: 'rejected' });
}

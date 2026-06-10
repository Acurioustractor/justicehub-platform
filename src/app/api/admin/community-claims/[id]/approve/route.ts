/**
 * POST /api/admin/community-claims/[id]/approve
 *
 * Approve a pending claim after the confirming conversation. Stamps the
 * decision, opens a 14-day invite window, and returns the invite link.
 * There is no automated email: the admin sends the link personally, which
 * is the relationship model working as intended (claiming is confirmed by
 * talking to the organisation).
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const INVITE_WINDOW_DAYS = 14;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://justicehub.com.au';
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const expires = new Date(
    Date.now() + INVITE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await admin.supabase
    .from('org_claims')
    .update({
      status: 'approved',
      invite_expires_at: expires,
      decided_by: admin.user.id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, invite_token, claimant_email, invite_expires_at')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Claim not found or not pending' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: data.id,
    claimant_email: data.claimant_email,
    invite_expires_at: data.invite_expires_at,
    invite_url: `${siteUrl()}/dashboard/accept-invite?token=${data.invite_token}`,
  });
}

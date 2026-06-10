/**
 * POST /api/dashboard/invites/accept  { token }
 *
 * The signed-in invitee redeems their single-use invite token and becomes
 * the org's first owner (or an additional member when invited by an owner).
 *
 * This is the ONLY service-role write in the dashboard system (never-rule 3:
 * funders never get a back door, so nothing else may bypass RLS). The service
 * role is required because the first owner row cannot satisfy any org_members
 * client policy — no owner exists yet to authorise it.
 *
 * Guards, in order: valid UUID token → claim is approved + token unconsumed →
 * window not expired → signed-in user's email matches claimant_email.
 * Consumption = invite_token set NULL, so a token can never be redeemed twice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({ token: z.string().uuid() });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Sign in to accept an invite' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: claim } = await service
    .from('org_claims')
    .select('id, organization_id, claimant_email, status, invite_expires_at')
    .eq('invite_token', parsed.data.token)
    .eq('status', 'approved')
    .single();

  if (!claim) {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 });
  }
  if (claim.invite_expires_at && new Date(claim.invite_expires_at) < new Date()) {
    await service.from('org_claims').update({ status: 'expired' }).eq('id', claim.id);
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
  }
  if (claim.claimant_email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was issued to a different email address' },
      { status: 403 }
    );
  }

  const { error: memberError } = await service.from('org_members').upsert(
    {
      profile_id: user.id,
      organization_id: claim.organization_id,
      role: 'owner',
    },
    { onConflict: 'profile_id,organization_id' }
  );
  if (memberError) {
    console.error('invite accept: org_members upsert failed', memberError);
    return NextResponse.json({ error: 'Could not add membership' }, { status: 500 });
  }

  // Consume the token only after the membership write succeeded.
  await service.from('org_claims').update({ invite_token: null }).eq('id', claim.id);

  return NextResponse.json({
    success: true,
    organization_id: claim.organization_id,
    role: 'owner',
  });
}

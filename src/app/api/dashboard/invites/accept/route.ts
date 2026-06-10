/**
 * POST /api/dashboard/invites/accept  { token }
 *
 * The signed-in invitee redeems their single-use invite token and becomes
 * an active owner in `organization_members`.
 *
 * This is the ONLY service-role write in the dashboard system (never-rule 3:
 * funders never get a back door, so nothing else may bypass RLS). The service
 * role is required because the first owner row cannot satisfy any client
 * policy — no owner exists yet to authorise it.
 *
 * Guards, in order: valid UUID token → claim verified + token unconsumed →
 * window not expired → signed-in user's email matches contact_email.
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
    .from('organization_claims')
    .select('id, organization_id, contact_email, status, invite_expires_at')
    .eq('invite_token', parsed.data.token)
    .eq('status', 'verified')
    .single();

  if (!claim) {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 });
  }
  if (claim.invite_expires_at && new Date(claim.invite_expires_at) < new Date()) {
    await service
      .from('organization_claims')
      .update({ status: 'expired', invite_token: null })
      .eq('id', claim.id);
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
  }
  if ((claim.contact_email ?? '').toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was issued to a different email address' },
      { status: 403 }
    );
  }

  const { error: memberError } = await service.from('organization_members').upsert(
    {
      user_id: user.id,
      organization_id: claim.organization_id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' }
  );
  if (memberError) {
    console.error('invite accept: organization_members upsert failed', memberError);
    return NextResponse.json({ error: 'Could not add membership' }, { status: 500 });
  }

  // Consume the token only after the membership write succeeded. Also link
  // the accepting user to the claim for the audit trail.
  await service
    .from('organization_claims')
    .update({ invite_token: null, user_id: user.id })
    .eq('id', claim.id);

  return NextResponse.json({
    success: true,
    organization_id: claim.organization_id,
    role: 'owner',
  });
}

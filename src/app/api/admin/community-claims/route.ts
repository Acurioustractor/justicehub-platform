/**
 * Admin community-claim queue (dashboard backend increment 1).
 *
 * Backed by the pre-existing `organization_claims` table. Claims can arrive
 * two ways: a signed-in user via /api/organizations/[id]/claim (older flow,
 * user_id set), or recorded here by an admin after the GHL confirming
 * conversation that /api/communities/claim triggers (user_id null; the
 * claimant gets an account when they accept the invite).
 *
 * GET  — list claims with org names, newest first, optional ?status= filter.
 * POST — record a claim after the confirming conversation.
 * RLS: organization_claims_admin_all, so both run on the user's own client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  organization_id: z.string().uuid(),
  contact_email: z.string().email().max(200),
  contact_name: z.string().min(2).max(120),
  role_at_org: z.string().max(80).optional(),
});

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status');
  let query = admin.supabase
    .from('organization_claims')
    .select(
      'id, organization_id, contact_name, contact_email, role_at_org, status, invite_token, invite_expires_at, created_at, organizations(id, name, slug)'
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ claims: data });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid claim' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('organization_claims')
    .insert({
      organization_id: parsed.data.organization_id,
      contact_email: parsed.data.contact_email.toLowerCase(),
      contact_name: parsed.data.contact_name,
      role_at_org: parsed.data.role_at_org ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}

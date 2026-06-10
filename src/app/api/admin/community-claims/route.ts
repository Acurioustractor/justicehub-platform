/**
 * Admin claim queue (dashboard backend increment 1).
 *
 * GET  — list claims with org names, newest first, optional ?status= filter.
 * POST — record a claim. Claims arrive as GHL contacts via
 *        /api/communities/claim (unchanged); after the confirming
 *        conversation (engagement-model step 3) the admin records the claim
 *        here so it can be approved into an invite. RLS on org_claims is
 *        admin-only, so both handlers run on the user's own client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  organization_id: z.string().uuid(),
  claimant_email: z.string().email().max(200),
  claimant_name: z.string().min(2).max(120),
  role_in_org: z.string().max(80).optional(),
});

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status');
  let query = admin.supabase
    .from('org_claims')
    .select('*, organizations(id, name, slug)')
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
    .from('org_claims')
    .insert({
      organization_id: parsed.data.organization_id,
      claimant_email: parsed.data.claimant_email.toLowerCase(),
      claimant_name: parsed.data.claimant_name,
      role_in_org: parsed.data.role_in_org ?? null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}

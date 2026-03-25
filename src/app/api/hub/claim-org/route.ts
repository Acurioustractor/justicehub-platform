import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * POST /api/hub/claim-org
 *
 * Claim an organization. Creates a pending membership entry.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organization_id } = await request.json();

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
  }

  // Check org exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', organization_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('organization_id', organization_id)
    .single();

  if (existing) {
    return NextResponse.json({
      error: existing.status === 'pending' ? 'Claim already pending' : 'Already a member',
      status: existing.status,
    }, { status: 409 });
  }

  // Create pending membership
  const { error: insertError } = await supabase
    .from('organization_members')
    .insert({
      user_id: user.id,
      organization_id,
      role: 'member',
      status: 'pending',
      joined_at: new Date().toISOString(),
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Set as primary org on profile
  await supabase
    .from('profiles')
    .update({ primary_organization_id: organization_id })
    .eq('id', user.id);

  return NextResponse.json({
    success: true,
    organization: { id: org.id, name: org.name, slug: org.slug },
    status: 'pending',
  });
}

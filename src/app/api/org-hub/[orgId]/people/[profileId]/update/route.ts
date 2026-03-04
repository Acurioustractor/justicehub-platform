import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string; profileId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!await checkOrgAccess(supabase, user.id, params.orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const serviceClient = createServiceClient();

    // Update role on organizations_profiles
    if (typeof body.role === 'string') {
      const { error } = await serviceClient
        .from('organizations_profiles')
        .update({ role: body.role, updated_at: new Date().toISOString() })
        .eq('organization_id', params.orgId)
        .eq('public_profile_id', params.profileId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update role_tags on public_profiles
    if (Array.isArray(body.role_tags)) {
      const { error } = await serviceClient
        .from('public_profiles')
        .update({ role_tags: body.role_tags, updated_at: new Date().toISOString() })
        .eq('id', params.profileId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

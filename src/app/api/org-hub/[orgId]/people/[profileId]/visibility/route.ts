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

    // Update public_profiles.is_public if provided
    if (typeof body.is_public === 'boolean') {
      const { error } = await serviceClient
        .from('public_profiles')
        .update({ is_public: body.is_public, updated_at: new Date().toISOString() })
        .eq('id', params.profileId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update organizations_profiles.is_featured if provided
    if (typeof body.is_featured === 'boolean') {
      const { error } = await serviceClient
        .from('organizations_profiles')
        .update({ is_featured: body.is_featured, updated_at: new Date().toISOString() })
        .eq('organization_id', params.orgId)
        .eq('public_profile_id', params.profileId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

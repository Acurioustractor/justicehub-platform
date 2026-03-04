import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    // Get public profiles linked to this org via organizations_profiles
    const { data: links } = await supabase
      .from('organizations_profiles')
      .select('public_profile_id')
      .eq('organization_id', orgId);

    if (!links || links.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const profileIds = links.map(l => l.public_profile_id).filter(Boolean);
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, full_name, slug, photo_url')
      .in('id', profileIds)
      .order('full_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

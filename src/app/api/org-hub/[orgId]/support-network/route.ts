import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
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
    if (!await checkOrgAccess(supabase, user.id, orgId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Get profiles linked to OTHER organizations via organizations_profiles
    // Uses public_profiles (not profiles) — that's the FK target
    const { data: orgProfiles, error: opErr } = await (serviceClient as any)
      .from('organizations_profiles')
      .select(`
        role,
        public_profiles!inner(id, full_name, email, location),
        organizations!inner(id, name, location)
      `)
      .neq('organization_id', orgId)
      .eq('is_current', true)
      .limit(100);

    if (opErr) {
      return NextResponse.json({ error: opErr.message }, { status: 500 });
    }

    // Deduplicate by profile ID
    const profileMap = new Map();

    for (const op of (orgProfiles || [])) {
      const profile = op.public_profiles;
      if (!profile || profileMap.has(profile.id)) continue;
      profileMap.set(profile.id, {
        id: profile.id,
        full_name: profile.full_name,
        role: op.role || null,
        expertise: null,
        email: profile.email || null,
        location: profile.location || null,
        organization: op.organizations ? {
          id: op.organizations.id,
          name: op.organizations.name,
          location: op.organizations.location,
        } : null,
      });
    }

    return NextResponse.json({ data: Array.from(profileMap.values()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

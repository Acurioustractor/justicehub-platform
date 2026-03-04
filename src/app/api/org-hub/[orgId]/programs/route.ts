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

    // Fetch programs from the programs_catalog_v view
    const { data, error } = await supabase
      .from('programs_catalog_v')
      .select('id, name, description, approach, impact_summary, success_rate, participants_served, tags')
      .eq('organization_id', orgId)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

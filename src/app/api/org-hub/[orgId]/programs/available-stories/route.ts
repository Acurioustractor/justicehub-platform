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

    // Get stories (articles) linked to this org
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, status')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

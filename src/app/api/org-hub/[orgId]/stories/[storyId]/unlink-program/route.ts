import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string; storyId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!await checkOrgAccess(supabase, user.id, params.orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { programId } = await request.json();
    if (!programId) return NextResponse.json({ error: 'programId required' }, { status: 400 });

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('article_related_programs')
      .delete()
      .eq('article_id', params.storyId)
      .eq('program_id', programId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

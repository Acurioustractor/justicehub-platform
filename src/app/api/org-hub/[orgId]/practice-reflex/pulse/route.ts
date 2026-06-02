import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { refreshPracticeReflexActions } from '@/lib/org-hub/practice-reflex';

export async function POST(
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

    const data = await refreshPracticeReflexActions(orgId);
    return NextResponse.json({
      success: true,
      data,
      generatedActions: data.actions.filter((action) => action.sourceAgent === 'practice_reflex').length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

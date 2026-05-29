import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getBudgetVsActualByGrant } from '@/lib/bgfit/queries';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const grantId = request.nextUrl.searchParams.get('grantId');
  if (!grantId) {
    return NextResponse.json({ error: 'grantId required' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: grant, error: grantError } = await service
    .from('org_grants')
    .select('id, organization_id')
    .eq('id', grantId)
    .maybeSingle();

  if (grantError) {
    return NextResponse.json({ error: grantError.message }, { status: 500 });
  }

  if (!grant?.organization_id) {
    return NextResponse.json({ error: 'Grant not found' }, { status: 404 });
  }

  if (!await checkOrgAccess(supabase, user.id, grant.organization_id)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const items = await getBudgetVsActualByGrant(grantId);
  return NextResponse.json(items);
}

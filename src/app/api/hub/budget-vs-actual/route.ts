import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { getBudgetVsActualByGrant } from '@/lib/bgfit/queries';

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

  const items = await getBudgetVsActualByGrant(grantId);
  return NextResponse.json(items);
}

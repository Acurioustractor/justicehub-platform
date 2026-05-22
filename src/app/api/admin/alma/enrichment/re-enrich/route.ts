import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { inlineReEnrich } from '@/lib/alma/inline-reenrich';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface Body {
  organization_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as Body;
    if (!body.organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const result = await inlineReEnrich(supabase, { orgId: body.organization_id });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[re-enrich POST]', e);
    return NextResponse.json({ error: e?.message || 'internal error' }, { status: 500 });
  }
}

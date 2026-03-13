import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  getSystem0Policy,
  upsertSystem0Policy,
  type System0PolicyInput,
} from '@/lib/funding/system0-policy';
import { logSystem0Event } from '@/lib/funding/system0-audit';

function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

export async function GET() {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const serviceClient = getServiceClient();
    const policy = await getSystem0Policy(serviceClient);
    return NextResponse.json({ success: true, policy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = (body?.policy || body || {}) as System0PolicyInput;
    const serviceClient = getServiceClient();
    const before = await getSystem0Policy(serviceClient);
    const policy = await upsertSystem0Policy(serviceClient, updates, user.id);
    await logSystem0Event(serviceClient, {
      eventType: 'policy_updated',
      source: 'admin_policy',
      actorId: user.id,
      message: 'System 0 policy updated via admin console.',
      payload: {
        before,
        after: policy,
      },
    });
    return NextResponse.json({ success: true, policy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

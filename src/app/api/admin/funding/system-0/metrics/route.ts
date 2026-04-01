import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getSystem0Metrics } from '@/lib/funding/system0-orchestrator';
import { requireAdminApi } from '@/lib/admin-api-auth';

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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Math.min(30, Number(searchParams.get('days') || 7)));

    const serviceClient = getServiceClient();
    const metrics = await getSystem0Metrics(serviceClient, days);

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

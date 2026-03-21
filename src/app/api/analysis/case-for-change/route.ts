import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 min cache

export async function GET() {
  const supabase = createServiceClient();

  const { data } = await supabase.rpc('get_case_for_change').single();

  return NextResponse.json(data || {});
}

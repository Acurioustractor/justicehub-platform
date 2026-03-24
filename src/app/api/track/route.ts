import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, utm_source, utm_medium, utm_campaign } = body;

    if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('page_views').insert({
      path,
      referrer: referrer || request.headers.get('referer') || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      user_agent: request.headers.get('user-agent') || null,
      country: request.headers.get('x-vercel-ip-country') || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'minderoo-pitch-slot-overrides';
const COOKIE = 'pitch_auth';

function hasPitchEditorAccess(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (isDev) return true;

  const expected = process.env.PITCH_SHARED_TOKEN;
  const token = request.cookies.get(COOKIE)?.value;
  return Boolean(expected && token === expected);
}

/**
 * GET: load shared Minderoo pitch media overrides for all visitors.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await (supabase as any)
      .from('site_config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single();

    return NextResponse.json(
      { overrides: data?.value || {} },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { overrides: {} },
      { headers: { 'cache-control': 'no-store' } }
    );
  }
}

/**
 * PUT: save shared Minderoo pitch media overrides.
 * Uses the same pitch_auth cookie as the password-gated envelope.
 */
export async function PUT(request: NextRequest) {
  try {
    if (!hasPitchEditorAccess(request)) {
      return NextResponse.json({ error: 'Not authorized to save live pitch edits' }, { status: 401 });
    }

    const { overrides } = await request.json();
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      return NextResponse.json({ error: 'Invalid overrides' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await (supabase as any)
      .from('site_config')
      .upsert(
        { key: CONFIG_KEY, value: overrides, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'site_config table not found — run migration first' },
          { status: 500 }
        );
      }
      console.error('Minderoo pitch overrides save error:', error);
      return NextResponse.json({ error: 'Failed to save live overrides' }, { status: 500 });
    }

    return NextResponse.json({ success: true, overrides });
  } catch (err) {
    console.error('Minderoo pitch overrides API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

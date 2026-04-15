import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Shared photo overrides for the Judges on Country surfaces.
 * Persists to the `site_config` table so overrides apply to every visitor.
 *
 * Scopes:
 *   ?scope=main      → /judges-on-country 6-card grid (card numbers 01-06)
 *   ?scope=postcards → /judges-on-country/postcards print deck (card IDs)
 *
 * Same GET/PUT contract as /api/admin/contained/photo-overrides.
 */

const SCOPE_TO_KEY: Record<string, string> = {
  main: 'judges-on-country-main-photo-overrides',
  postcards: 'judges-on-country-postcards-photo-overrides',
};

function resolveKey(req: NextRequest): string | null {
  const scope = req.nextUrl.searchParams.get('scope') || 'main';
  return SCOPE_TO_KEY[scope] || null;
}

export async function GET(request: NextRequest) {
  try {
    const key = resolveKey(request);
    if (!key) return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });

    const supabase = createServiceClient();
    const { data } = await (supabase as any)
      .from('site_config')
      .select('value')
      .eq('key', key)
      .single();

    return NextResponse.json({ overrides: data?.value || {} });
  } catch {
    return NextResponse.json({ overrides: {} });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const key = resolveKey(request);
    if (!key) return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });

    const { overrides } = await request.json();
    if (!overrides || typeof overrides !== 'object') {
      return NextResponse.json({ error: 'Invalid overrides' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await (supabase as any)
      .from('site_config')
      .upsert(
        { key, value: overrides, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'site_config table not found — run migration first' },
          { status: 500 }
        );
      }
      console.error('Judges photo overrides save error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Judges photo overrides API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

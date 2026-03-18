import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

const CONFIG_KEY = 'contained-photo-overrides';

/**
 * GET: Load photo overrides (public — needed at render time for all visitors)
 */
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await (supabase as any)
      .from('site_config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single();

    return NextResponse.json({ overrides: data?.value || {} });
  } catch {
    return NextResponse.json({ overrides: {} });
  }
}

/**
 * PUT: Save photo overrides (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { overrides } = await request.json();
    if (!overrides || typeof overrides !== 'object') {
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
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'site_config table not found — run migration first' },
          { status: 500 }
        );
      }
      console.error('Photo overrides save error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Photo overrides API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

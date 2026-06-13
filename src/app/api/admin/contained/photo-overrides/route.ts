import { NextRequest, NextResponse } from 'next/server';
import { getContainedPhotoOverrides, saveContainedPhotoOverrides } from '@/lib/contained/photo-overrides';

export const dynamic = 'force-dynamic';

/**
 * GET: Load photo overrides (public — needed at render time for all visitors)
 */
export async function GET() {
  try {
    const overrides = await getContainedPhotoOverrides();
    return NextResponse.json({ overrides });
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

    const { error } = await saveContainedPhotoOverrides(overrides);

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

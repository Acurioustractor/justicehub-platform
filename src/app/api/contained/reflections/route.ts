import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/contained/reflections
 * Saves a visitor reflection from the experience page.
 * Enrolled visitors get their reflection linked to their device session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reflection, name } = body;

    if (!reflection || typeof reflection !== 'string' || reflection.trim().length === 0) {
      return NextResponse.json({ error: 'Reflection text required' }, { status: 400 });
    }

    if (reflection.length > 500) {
      return NextResponse.json({ error: 'Reflection too long (max 500 chars)' }, { status: 400 });
    }

    const service = createServiceClient();

    // Try to get device session if enrolled
    let deviceSessionId: string | null = null;
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() {},
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: session } = await service
          .from('device_sessions')
          .select('id')
          .eq('auth_user_id', user.id)
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (session) deviceSessionId = session.id;
      }
    } catch {
      // Not enrolled — that's fine, save without session link
    }

    const { data, error } = await service
      .from('community_reflections')
      .insert({
        name: name || 'Visitor',
        reflection: reflection.trim(),
        device_session_id: deviceSessionId,
        is_approved: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save reflection:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/contained/reflections
 * Returns approved reflections for public display.
 */
export async function GET() {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('community_reflections')
      .select('id, name, reflection, location, city_nomination, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to load reflections' }, { status: 500 });
    }

    return NextResponse.json({ reflections: data || [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    // Get the auth user from cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ enrolled: false }, { status: 200 });
    }

    const service = createServiceClient();

    // Fetch device session
    const { data: session, error } = await service
      .from('device_sessions')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !session) {
      return NextResponse.json({ enrolled: false }, { status: 200 });
    }

    // Update last active timestamp
    await service
      .from('device_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', session.id);

    return NextResponse.json({
      enrolled: true,
      session: {
        id: session.id,
        displayName: session.display_name,
        projectSlug: session.project_slug,
        locationText: session.location_text,
        isUpgraded: session.is_upgraded,
        enrolledAt: session.enrolled_at,
        lastActiveAt: session.last_active_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

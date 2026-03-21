import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
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
    if (!user) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 401 });
    }

    const service = createServiceClient();

    // Get device session
    const { data: session } = await service
      .from('device_sessions')
      .select('id')
      .eq('auth_user_id', user.id)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, role, reason } = body;

    if (!name && !email && !phone) {
      return NextResponse.json({ error: 'At least one contact detail required' }, { status: 400 });
    }

    const { data: rec, error } = await service
      .from('visitor_recommendations')
      .insert({
        device_session_id: session.id,
        recommended_name: name || null,
        recommended_email: email || null,
        recommended_phone: phone || null,
        recommended_role: role || null,
        reason: reason || null,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save recommendation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: rec.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

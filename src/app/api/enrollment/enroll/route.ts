import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';
import { createVisitorELProfile } from '@/lib/enrollment/el-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, displayName, phone, location } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Enrollment code required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Validate code
    const { data: codeRow, error: codeError } = await supabase
      .from('enrollment_codes')
      .select('id, project_slug, event_name, max_uses, current_uses, expires_at, is_active')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (codeError || !codeRow) {
      return NextResponse.json({ error: 'Invalid enrollment code' }, { status: 404 });
    }

    if (!codeRow.is_active ||
        (codeRow.max_uses && codeRow.current_uses >= codeRow.max_uses) ||
        (codeRow.expires_at && new Date(codeRow.expires_at) < new Date())) {
      return NextResponse.json({ error: 'Code is no longer valid' }, { status: 410 });
    }

    // 2. Create anonymous Supabase auth user
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: authData, error: authError } = await anonClient.auth.signInAnonymously();

    if (authError || !authData.user) {
      console.error('Anonymous auth failed:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }

    const authUserId = authData.user.id;
    const name = displayName?.trim() || 'Visitor';

    // 3. Reverse geocode location (best-effort via Nominatim)
    let locationText: string | null = null;
    if (location?.lat && location?.lng) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=10`,
          { headers: { 'User-Agent': 'JusticeHub/1.0' } }
        );
        if (geoRes.ok) {
          const geo = await geoRes.json();
          const parts = [
            geo.address?.suburb || geo.address?.city || geo.address?.town,
            geo.address?.state,
          ].filter(Boolean);
          locationText = parts.join(', ') || geo.display_name?.split(',').slice(0, 2).join(',') || null;
        }
      } catch {
        // Non-critical — skip geocoding
      }
    }

    // 4. Increment code usage
    await supabase
      .from('enrollment_codes')
      .update({ current_uses: (codeRow.current_uses || 0) + 1 })
      .eq('id', codeRow.id);

    // 5. Create EL profile (non-blocking)
    const elResult = await createVisitorELProfile(name, locationText);

    // 6. Create device session
    const { data: session, error: sessionError } = await supabase
      .from('device_sessions')
      .insert({
        auth_user_id: authUserId,
        enrollment_code_id: codeRow.id,
        display_name: name,
        phone: phone || null,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
        location_text: locationText,
        project_slug: codeRow.project_slug || 'contained',
        el_profile_id: elResult?.elProfileId || null,
        el_storyteller_id: elResult?.elStorytellerId || null,
        metadata: {
          enrolled_via: 'qr_code',
          event_name: codeRow.event_name,
          user_agent: request.headers.get('user-agent')?.slice(0, 200),
        },
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Device session creation failed:', sessionError);
      return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });
    }

    // Return session token for client to store
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      authToken: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token,
      displayName: name,
      projectSlug: codeRow.project_slug,
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

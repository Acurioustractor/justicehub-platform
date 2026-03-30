import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/profiles/claim
 *
 * Two-step profile claim flow:
 *
 * Step 1 (unauthenticated): Send magic link
 *   Body: { profileId, email }
 *   → Sends magic link with redirect to /people/[slug]?claim=true
 *
 * Step 2 (authenticated): Link auth account to profile
 *   Body: { profileId }
 *   → Links the authenticated user to the unclaimed profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, email, step } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch the profile
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id, user_id, slug, full_name, email')
      .eq('id', profileId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Already claimed
    if (profile.user_id) {
      return NextResponse.json({ error: 'Profile already claimed', claimed: true }, { status: 409 });
    }

    // ── Step 1: Send magic link ────────────────────────────

    if (step === 'send-link' || (!step && email)) {
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
      }

      // Use the profile's email if set, otherwise use provided email
      // For security, we accept the provided email but the magic link
      // will authenticate them — they still need access to the inbox
      const authSupabase = await createClient();
      const { error: otpError } = await authSupabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=/people/${profile.slug}?claim=${profileId}`,
        },
      });

      if (otpError) {
        return NextResponse.json({ error: otpError.message }, { status: 500 });
      }

      return NextResponse.json({ sent: true, slug: profile.slug });
    }

    // ── Step 2: Link authenticated user to profile ─────────

    if (step === 'link') {
      const authSupabase = await createClient();
      const { data: { user } } = await authSupabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Check user doesn't already own a different profile
      const { data: existingProfile } = await supabase
        .from('public_profiles')
        .select('id, slug')
        .eq('user_id', user.id)
        .single();

      if (existingProfile && existingProfile.id !== profileId) {
        return NextResponse.json({
          error: 'You already have a profile',
          existingSlug: existingProfile.slug,
        }, { status: 409 });
      }

      // Link the user to the profile
      const { error: updateErr } = await supabase
        .from('public_profiles')
        .update({
          user_id: user.id,
          email: user.email,
        })
        .eq('id', profileId)
        .is('user_id', null); // Safety: only claim unclaimed profiles

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ claimed: true, slug: profile.slug });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (err: any) {
    console.error('Profile claim error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

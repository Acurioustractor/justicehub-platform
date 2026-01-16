import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/users/profile
 *
 * Returns the authenticated user's profile from Supabase.
 * Used by UserContext to get the current user's data.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Transform to match User type expected by UserContext
    const userData = {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.email?.split('@')[0] || 'User',
      role: profile?.is_super_admin ? 'admin' : (profile?.role || 'youth'),
      auth0Id: user.id,
      profile: {
        firstName: profile?.full_name?.split(' ')[0] || '',
        lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
        name: profile?.full_name,
        picture: profile?.avatar_url || user.user_metadata?.avatar_url,
        bio: profile?.bio,
        location: profile?.location,
      },
      privacySettings: {
        emailNotifications: true,
        smsNotifications: false,
        profileVisibility: 'public',
        dataSharing: false,
        analytics: true,
        marketingEmails: false,
        mentorContact: true,
        organizationContact: true,
      },
      active: true,
      createdAt: user.created_at,
      updatedAt: profile?.updated_at || user.updated_at,
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Error in /api/users/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

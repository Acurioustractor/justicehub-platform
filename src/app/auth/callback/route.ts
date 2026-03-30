import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Auth callback handler for OAuth providers (GitHub) and magic links.
 * Supabase redirects here after successful OAuth or email link verification.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/admin';

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      // Smart routing: if next is generic (/portal, /admin), check role-based redirect
      // If coming from /judges-on-country, redirect back there
      if (next === '/judges-on-country') {
        return response;
      }

      if (next === '/portal' || next === '/admin' || next === '/') {
        // Check for funder profile → route to funder dashboard
        const { data: funderProfile } = await supabase
          .from('funder_profiles')
          .select('id')
          .eq('email', sessionData.user.email!)
          .single();

        if (funderProfile) {
          const funderResponse = NextResponse.redirect(`${origin}/for-funders`);
          response.cookies.getAll().forEach((cookie) => {
            funderResponse.cookies.set(cookie.name, cookie.value);
          });
          return funderResponse;
        }

        // Check for CONTAINED member
        const { data: publicProfile } = await supabase
          .from('public_profiles')
          .select('role_tags')
          .eq('user_id', sessionData.user.id)
          .single();

        const roleTags: string[] = (publicProfile as any)?.role_tags || [];
        if (roleTags.some((t: string) => t.startsWith('contained_'))) {
          const hubResponse = NextResponse.redirect(`${origin}/hub`);
          response.cookies.getAll().forEach((cookie) => {
            hubResponse.cookies.set(cookie.name, cookie.value);
          });
          return hubResponse;
        }
      }

      return response;
    } else if (!error) {
      return response;
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

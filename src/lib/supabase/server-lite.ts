import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Lightweight server client for residual routes that do not need the full
 * generated Database type graph during compilation.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server components may call this in contexts where writes are ignored.
          }
        },
      },
    }
  );
}

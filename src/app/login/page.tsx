'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const supabase = createClient();

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error') === 'auth_failed' ? 'Authentication failed. Please try again.' : '');
  const [mode, setMode] = useState<'login' | 'reset' | 'magic-link'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function getPostLoginRedirect(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '/';

      // Find profile by id (profiles.id matches auth user id)
      const profile = (await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()).data;

      if (!profile) return '/';

      if (profile.role === 'admin') return '/admin';

      // Check org memberships (uses user_id and status, not profile_id/is_active)
      const { data: memberships } = await (supabase as any)
        .from('organization_members')
        .select('organization_id, organizations(slug)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const orgs = (memberships || []).filter((m: any) => m.organizations?.slug);

      if (orgs.length === 1) return `/portal/${orgs[0].organizations.slug}`;
      if (orgs.length > 1) return '/portal';

      return '/';
    } catch {
      return '/';
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const redirect = await getPostLoginRedirect();
      window.location.href = redirect;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGitHubLogin() {
    setGithubLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/portal`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'GitHub login failed';
      setError(message);
      setGithubLoading(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Reset failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send magic link';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const modeTitle = {
    login: 'Log In',
    reset: 'Reset Password',
    'magic-link': 'Magic Link Login',
  }[mode];

  const modeSubtitle = {
    login: 'Sign in to access your JusticeHub account',
    reset: 'Enter your email to receive a password reset link',
    'magic-link': 'Enter your email to receive a sign-in link',
  }[mode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 flex items-center justify-center page-content">
      <div className="max-w-md w-full">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black mb-2">{modeTitle}</h1>
          <p className="text-earth-700 mb-8">{modeSubtitle}</p>

          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
              {error}
            </div>
          )}

          {mode === 'reset' && resetSent ? (
            <div className="space-y-6">
              <div className="bg-green-100 border-2 border-green-600 text-green-800 px-4 py-4 font-bold">
                Check your email for a password reset link. It may take a minute to arrive.
              </div>
              <button
                onClick={() => { setMode('login'); setResetSent(false); }}
                className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors"
              >
                Back to Log In
              </button>
            </div>
          ) : mode === 'reset' ? (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label className="block font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full text-sm text-earth-600 hover:text-earth-900 underline"
              >
                Back to Log In
              </button>
            </form>
          ) : mode === 'magic-link' && magicLinkSent ? (
            <div className="space-y-6">
              <div className="bg-green-100 border-2 border-green-600 text-green-800 px-4 py-4 font-bold">
                Check your email for a sign-in link. It may take a minute to arrive.
              </div>
              <button
                onClick={() => { setMode('login'); setMagicLinkSent(false); }}
                className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors"
              >
                Back to Log In
              </button>
            </div>
          ) : mode === 'magic-link' ? (
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div>
                <label className="block font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full text-sm text-earth-600 hover:text-earth-900 underline"
              >
                Back to Log In with password
              </button>
            </form>
          ) : (
            <>
              {/* GitHub Login */}
              <button
                onClick={handleGitHubLogin}
                disabled={githubLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#24292f] text-white border-2 border-black font-bold text-lg hover:bg-[#32383f] transition-colors disabled:opacity-50 mb-6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                {githubLoading ? 'Redirecting...' : 'Continue with GitHub'}
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-earth-500 font-bold">or</span>
                </div>
              </div>

              {/* Email/Password Login */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); }}
                      className="text-sm text-ochre-600 hover:text-ochre-800 underline font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('magic-link'); setError(''); }}
                  className="w-full text-sm text-earth-600 hover:text-earth-900 underline"
                >
                  Send a magic link instead
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-earth-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-ochre-600 hover:text-ochre-800 underline font-bold">
                Sign up
              </Link>
            </p>
            <Link
              href="/"
              className="block text-sm text-earth-600 hover:text-earth-900 underline"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

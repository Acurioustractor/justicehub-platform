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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState(searchParams.get('error') === 'auth_failed' ? 'Authentication failed. Please try again.' : '');
  const [mode, setMode] = useState<'login' | 'reset' | 'magic-link' | 'phone'>('magic-link');
  const [devBypassing, setDevBypassing] = useState(false);

  // Dev bypass: on localhost, skip login entirely
  useState(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      setDevBypassing(true);
      const redirect = searchParams.get('redirect') || '/';
      window.location.href = redirect;
    }
  });

  if (devBypassing) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Dev bypass — redirecting...</p></div>;
  }
  const [resetSent, setResetSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  async function getPostLoginRedirect(): Promise<string> {
    // If ?redirect= param exists, honour it
    const redirectParam = searchParams.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) return redirectParam;

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

      // Check for funder profile → route to funder dashboard
      const { data: funderProfile } = await ((supabase as any)
        .from('funder_profiles')
        .select('id')
        .eq('email', user.email || '')
        .single());

      if (funderProfile) return '/for-funders';

      // Check if CONTAINED member — role_tags with contained_ prefix → /hub
      const { data: publicProfile } = await supabase
        .from('public_profiles')
        .select('role_tags')
        .eq('user_id', user.id)
        .single();

      const roleTags: string[] = publicProfile?.role_tags || [];
      if (roleTags.some(t => t.startsWith('contained_'))) return '/hub';

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

  type OAuthProvider = 'google' | 'github';
  const PROVIDER_LABELS: Record<OAuthProvider, string> = {
    google: 'Google', github: 'GitHub',
  };

  async function handleOAuthLogin(provider: OAuthProvider) {
    setOauthLoading(provider);
    setError('');

    const redirectNext = searchParams.get('redirect') || '/portal';
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectNext}`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `${PROVIDER_LABELS[provider]} login failed`;
      setError(message);
      setOauthLoading(null);
    }
  }

  async function handlePhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Normalise: ensure +61 prefix for AU numbers
    let normalised = phone.trim();
    if (normalised.startsWith('0')) normalised = '+61' + normalised.slice(1);
    if (!normalised.startsWith('+')) normalised = '+61' + normalised;

    try {
      if (!phoneOtpSent) {
        // Step 1: Send OTP
        const { error } = await supabase.auth.signInWithOtp({ phone: normalised });
        if (error) throw error;
        setPhoneOtpSent(true);
      } else {
        // Step 2: Verify OTP
        const { error } = await supabase.auth.verifyOtp({
          phone: normalised,
          token: phoneOtp,
          type: 'sms',
        });
        if (error) throw error;
        const redirect = await getPostLoginRedirect();
        window.location.href = redirect;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Phone login failed';
      setError(message);
    } finally {
      setLoading(false);
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${searchParams.get('redirect') || '/portal'}`,
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
    'magic-link': 'Sign In',
    phone: 'Phone Sign In',
  }[mode];

  const modeSubtitle = {
    login: 'Sign in with your email and password',
    reset: 'Enter your email to receive a password reset link',
    'magic-link': 'Enter your email — we\'ll send you a one-click sign-in link',
    phone: 'Enter your mobile number — we\'ll text you a code',
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

              <div className="flex gap-3 text-sm text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="flex-1 text-earth-600 hover:text-earth-900 underline"
                >
                  Use password
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('phone'); setError(''); }}
                  className="flex-1 text-earth-600 hover:text-earth-900 underline"
                >
                  Use phone number
                </button>
              </div>
            </form>
          ) : mode === 'phone' ? (
            <form onSubmit={handlePhoneOtp} className="space-y-6">
              {!phoneOtpSent ? (
                <div>
                  <label className="block font-bold mb-2">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="px-3 py-3 border-2 border-black bg-gray-50 font-mono text-sm flex items-center">+61</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0412 345 678"
                      className="flex-1 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                      required
                    />
                  </div>
                  <p className="text-xs text-earth-500 mt-1">Australian mobile numbers only</p>
                </div>
              ) : (
                <div>
                  <div className="bg-green-100 border-2 border-green-600 text-green-800 px-4 py-3 mb-4 font-bold text-sm">
                    Code sent to {phone}
                  </div>
                  <label className="block font-bold mb-2">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600 text-center text-2xl font-mono tracking-widest"
                    required
                    autoFocus
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
              >
                {loading ? (phoneOtpSent ? 'Verifying...' : 'Sending...') : (phoneOtpSent ? 'Verify Code' : 'Send Code')}
              </button>

              <div className="flex gap-3 text-sm text-center">
                {phoneOtpSent && (
                  <button
                    type="button"
                    onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); setError(''); }}
                    className="flex-1 text-earth-600 hover:text-earth-900 underline"
                  >
                    Resend code
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setMode('magic-link'); setError(''); setPhoneOtpSent(false); setPhoneOtp(''); }}
                  className="flex-1 text-earth-600 hover:text-earth-900 underline"
                >
                  Use email instead
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Social Login Providers */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-gray-700 border-2 border-gray-300 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
                </button>

                <button
                  onClick={() => handleOAuthLogin('github')}
                  disabled={!!oauthLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#24292f] text-white border-2 border-black font-bold hover:bg-[#32383f] transition-colors disabled:opacity-50"
                  title="GitHub"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {oauthLoading === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
                </button>

                {/* Phone SMS option */}
                <button
                  onClick={() => { setMode('phone'); setError(''); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-600 border-2 border-gray-200 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  Sign in with phone number
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-earth-500 font-bold">or use email</span>
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
                  Sign in with magic link instead (no password needed)
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-earth-600">
              Don&apos;t have an account?{' '}
              <Link href="/contained/join" className="text-ochre-600 hover:text-ochre-800 underline font-bold">
                Join CONTAINED
              </Link>
              {' '}or{' '}
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

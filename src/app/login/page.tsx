'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('test@justicehub.au');
  const [password, setPassword] = useState('TestPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('Logged in:', data);

      // Use window.location for hard redirect to ensure cookies are set
      window.location.href = '/people/benjamin-knight';
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 flex items-center justify-center page-content">
      <div className="max-w-md w-full">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black mb-2">Test Login</h1>
          <p className="text-earth-700 mb-8">
            Use the test credentials to access profile editing
          </p>

          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                required
              />
            </div>

            <div className="bg-ochre-50 border-2 border-ochre-600 p-4">
              <p className="text-sm font-bold mb-2">Test Credentials:</p>
              <p className="text-sm font-mono mb-1">Email: test@justicehub.au</p>
              <p className="text-sm font-mono">Password: TestPassword123!</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-earth-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-ochre-600 hover:text-ochre-800 underline font-bold">
                Sign up
              </Link>
            </p>
            <Link
              href="/"
              className="block text-sm text-earth-600 hover:text-earth-900 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-white border-2 border-black p-6">
          <h2 className="font-black mb-4">After Logging In:</h2>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-black">1.</span>
              <span>You'll be redirected to Benjamin's profile</span>
            </li>
            <li className="flex gap-2">
              <span className="font-black">2.</span>
              <span>Look for the "Edit Profile" button in the top-right</span>
            </li>
            <li className="flex gap-2">
              <span className="font-black">3.</span>
              <span>Click it to test editing!</span>
            </li>
            <li className="flex gap-2">
              <span className="font-black">4.</span>
              <span>Try uploading a photo, editing bio, etc.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

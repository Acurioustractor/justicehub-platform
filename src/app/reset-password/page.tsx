'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const supabase = createClient();

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 flex items-center justify-center page-content">
      <div className="max-w-md w-full">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black mb-2">New Password</h1>
          <p className="text-earth-700 mb-8">
            Choose a new password for your account
          </p>

          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-100 border-2 border-green-600 text-green-800 px-4 py-4 font-bold">
                Password updated successfully.
              </div>
              <Link
                href="/login"
                className="block w-full px-6 py-4 bg-black text-white font-bold text-lg text-center hover:bg-earth-800 transition-colors"
              >
                Go to Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-bold mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-earth-600 hover:text-earth-900 underline"
            >
              &larr; Back to Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

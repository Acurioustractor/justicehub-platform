'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'profile'>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Account creation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile details
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');

  async function handleAccountCreation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup?step=profile`,
        }
      });

      if (error) throw error;

      console.log('Account created:', data);

      // Move to profile creation step
      setStep('profile');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileCreation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Generate slug from full name with uniqueness check
      let slug = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug exists and add random suffix if needed
      const { data: existingProfile } = await supabase
        .from('public_profiles')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (existingProfile) {
        // Add random 4-digit suffix to make it unique
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        slug = `${slug}-${randomSuffix}`;
      }

      // Create users table record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username: slug,
          name: fullName,
          user_role: 'user',
          password_hash: 'managed_by_supabase_auth',
          is_active: true
        });

      if (userError) {
        console.error('User table error:', userError);
        // Continue even if users table insert fails
      }

      // Create public profile
      const { data: profile, error: profileError } = await supabase
        .from('public_profiles')
        .insert({
          user_id: user.id,
          full_name: fullName,
          preferred_name: preferredName || null,
          pronouns: pronouns || null,
          slug: slug,
          tagline: tagline || null,
          bio: bio || null,
          is_public: false, // Start as private until user approves
          is_featured: false,
          role_tags: []
        })
        .select()
        .single();

      if (profileError) throw profileError;

      console.log('Profile created:', profile);

      // Redirect to profile editing
      window.location.href = `/people/${slug}/edit`;
    } catch (error: any) {
      console.error('Profile creation error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 flex items-center justify-center page-content py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {step === 'account' ? (
            <>
              <h1 className="text-4xl font-black mb-2">Create Account</h1>
              <p className="text-earth-700 mb-8">
                Join JusticeHub to create your profile and connect with the community
              </p>

              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleAccountCreation} className="space-y-6">
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
                    minLength={8}
                    required
                  />
                  <p className="text-sm text-earth-600 mt-1">At least 8 characters</p>
                </div>

                <div>
                  <label className="block font-bold mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    minLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Continue'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-earth-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-ochre-600 hover:text-ochre-800 underline font-bold">
                    Log in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-black mb-2">Create Your Profile</h1>
              <p className="text-earth-700 mb-8">
                Tell us about yourself
              </p>

              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleProfileCreation} className="space-y-6">
                <div>
                  <label className="block font-bold mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Preferred Name</label>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Pronouns</label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="e.g., they/them"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="A short description of what you do"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    rows={4}
                    placeholder="Tell us about yourself and your work"
                  />
                </div>

                <div className="bg-ochre-50 border-2 border-ochre-600 p-4">
                  <p className="text-sm font-bold mb-2">📝 Note:</p>
                  <p className="text-sm">
                    Your profile will start as private. You can add more details and make it public from your profile page.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : 'Create Profile'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, Heart, TrendingUp, Loader2 } from 'lucide-react';

const supabase = createClient();

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const isStewardSignup = roleParam === 'steward';

  const [step, setStep] = useState<'account' | 'profile' | 'steward-info'>('account');
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

  // Steward-specific fields
  const [stewardMotivation, setStewardMotivation] = useState('');
  const [stewardExperience, setStewardExperience] = useState('');
  const [stewardCommitment, setStewardCommitment] = useState<string[]>([]);

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

      // Create public profile with steward role if applicable
      const roleTags = isStewardSignup ? ['steward'] : [];

      const { data: profile, error: profileError } = await supabase
        .from('public_profiles')
        .insert({
          user_id: user.id,
          full_name: fullName,
          preferred_name: preferredName || null,
          pronouns: pronouns || null,
          slug: slug,
          tagline: tagline || (isStewardSignup ? 'JusticeHub Steward' : null),
          bio: bio || null,
          is_public: false, // Start as private until user approves
          is_featured: false,
          role_tags: roleTags
        })
        .select()
        .single();

      if (profileError) throw profileError;

      console.log('Profile created:', profile);

      // If steward signup, go to steward info step
      if (isStewardSignup) {
        setStep('steward-info');
        setLoading(false);
        return;
      }

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
          {/* Steward Banner */}
          {isStewardSignup && step === 'account' && (
            <div className="mb-6 bg-green-50 border-2 border-green-700 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-green-700" />
                <h2 className="font-bold text-green-800">Become a Steward</h2>
              </div>
              <p className="text-sm text-green-700">
                Stewards protect evidence-based youth justice reform. Join the community nurturing what works.
              </p>
            </div>
          )}

          {step === 'account' ? (
            <>
              <h1 className="text-4xl font-black mb-2">
                {isStewardSignup ? 'Join as Steward' : 'Create Account'}
              </h1>
              <p className="text-earth-700 mb-8">
                {isStewardSignup
                  ? 'Create your account to become a JusticeHub Steward'
                  : 'Join JusticeHub to create your profile and connect with the community'}
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
          ) : step === 'profile' ? (
            <>
              <h1 className="text-4xl font-black mb-2">
                {isStewardSignup ? 'Steward Profile' : 'Create Your Profile'}
              </h1>
              <p className="text-earth-700 mb-8">
                {isStewardSignup ? 'Tell us about yourself as a steward' : 'Tell us about yourself'}
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
                  <p className="text-sm font-bold mb-2">Note:</p>
                  <p className="text-sm">
                    Your profile will start as private. You can add more details and make it public from your profile page.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-black text-white font-bold text-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : (isStewardSignup ? 'Continue' : 'Create Profile')}
                </button>
              </form>
            </>
          ) : (
            /* Steward Info Step */
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="p-3 bg-green-100 border-2 border-green-700">
                  <Shield className="w-8 h-8 text-green-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">Welcome, Steward!</h1>
                  <p className="text-earth-600">One more step to complete your profile</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 mb-6 font-bold">
                  {error}
                </div>
              )}

              {/* Steward Benefits */}
              <div className="mb-8 space-y-3">
                <h3 className="font-bold text-lg">As a Steward, you will:</h3>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Support evidence-based youth justice programs</p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Connect with a community of changemakers</p>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Track the impact of programs you support</p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    // Get the user's profile slug from the current session
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('Not authenticated');

                    const { data: profile } = await supabase
                      .from('public_profiles')
                      .select('slug')
                      .eq('user_id', user.id)
                      .single();

                    // Update profile with steward info
                    await supabase
                      .from('public_profiles')
                      .update({
                        bio: bio || stewardMotivation,
                        metadata: {
                          steward_motivation: stewardMotivation,
                          steward_experience: stewardExperience,
                          steward_commitments: stewardCommitment,
                          joined_as_steward: new Date().toISOString()
                        }
                      })
                      .eq('user_id', user.id);

                    // Redirect to stewards page or profile
                    window.location.href = profile?.slug ? `/people/${profile.slug}` : '/stewards';
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block font-bold mb-2">Why do you want to be a Steward? *</label>
                  <textarea
                    value={stewardMotivation}
                    onChange={(e) => setStewardMotivation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-green-600"
                    rows={3}
                    placeholder="Share what draws you to youth justice reform..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Relevant Experience</label>
                  <textarea
                    value={stewardExperience}
                    onChange={(e) => setStewardExperience(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-green-600"
                    rows={3}
                    placeholder="Any relevant work, volunteering, or lived experience (optional)"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-3">I'm interested in: (select all that apply)</label>
                  <div className="space-y-2">
                    {[
                      { value: 'advocate', label: 'Advocating for reform' },
                      { value: 'donate', label: 'Supporting programs financially' },
                      { value: 'volunteer', label: 'Volunteering time' },
                      { value: 'share', label: 'Sharing research & evidence' },
                      { value: 'connect', label: 'Connecting communities' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stewardCommitment.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStewardCommitment([...stewardCommitment, option.value]);
                            } else {
                              setStewardCommitment(stewardCommitment.filter(c => c !== option.value));
                            }
                          }}
                          className="w-5 h-5 border-2 border-black accent-green-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-700 p-4">
                  <p className="text-sm font-bold text-green-800 mb-1">You're almost there!</p>
                  <p className="text-sm text-green-700">
                    Complete your steward profile to join our community of advocates.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !stewardMotivation}
                  className="w-full px-6 py-4 bg-green-700 text-white font-bold text-lg hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Completing...' : 'Complete Steward Profile'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Skip steward info, go to regular profile
                    const slug = fullName
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    window.location.href = `/people/${slug}/edit`;
                  }}
                  className="w-full px-6 py-3 text-earth-600 font-medium hover:text-black transition-colors text-sm"
                >
                  Skip for now
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function SignupLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 flex items-center justify-center page-content py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// Default export wrapped in Suspense for useSearchParams
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  );
}

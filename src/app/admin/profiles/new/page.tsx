'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [roleTags, setRoleTags] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const availableRoleTags = [
    'practitioner', 'researcher', 'advocate', 'elder', 'youth worker',
    'social worker', 'lawyer', 'policy maker', 'community leader',
    'artist', 'educator', 'mentor', 'storyteller', 'funder'
  ];

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/admin/profiles/new');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (!profileData?.is_super_admin) {
        router.push('/');
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const slug = generateSlug(fullName);

    // Check if slug exists
    const { data: existing } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      setError('A profile with this name already exists. Please use a different name.');
      setSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('public_profiles')
      .insert({
        full_name: fullName.trim(),
        preferred_name: preferredName.trim() || null,
        pronouns: pronouns.trim() || null,
        slug,
        bio: bio.trim() || null,
        tagline: tagline.trim() || null,
        role_tags: roleTags,
        photo_url: photoUrl.trim() || null,
        email: email.trim() || null,
        website_url: websiteUrl.trim() || null,
        is_public: isPublic,
        is_featured: isFeatured,
        social_links: {},
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(`/people/${slug}`);
  };

  const toggleRoleTag = (tag: string) => {
    if (roleTags.includes(tag)) {
      setRoleTags(roleTags.filter(t => t !== tag));
    } else {
      setRoleTags([...roleTags, tag]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice max-w-3xl">
          <Link href="/admin/profiles" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Profiles
          </Link>

          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-8 h-8" />
              <h1 className="text-3xl font-black">Add New Profile</h1>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 text-red-800 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Preferred Name</label>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="How they prefer to be called"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Pronouns</label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g., she/her, he/him, they/them"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Brief description or title"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell their story..."
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Role Tags */}
              <div>
                <label className="block text-sm font-bold mb-2">Role Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableRoleTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleRoleTag(tag)}
                      className={`px-3 py-1 text-sm font-bold border-2 border-black transition-colors ${
                        roleTags.includes(tag)
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Website</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-bold mb-2">Photo URL</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                {photoUrl && (
                  <div className="mt-2">
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-24 h-24 rounded-full border-2 border-black object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 border-2 border-black"
                  />
                  <span className="font-bold">Public Profile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-5 h-5 border-2 border-black"
                  />
                  <span className="font-bold">Featured</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? 'Creating...' : 'Create Profile'}
                </button>
                <Link
                  href="/admin/profiles"
                  className="px-6 py-3 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Save, X } from 'lucide-react';

const supabase = createClient();

export default function EditProfilePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    preferred_name: '',
    pronouns: '',
    bio: '',
    tagline: '',
    role_tags: [] as string[],
    photo_url: '',
    website_url: '',
    email: '',
    social_links: {} as Record<string, string>,
    is_public: false
  });

  const availableRoleTags = [
    'advocate',
    'artist',
    'builder',
    'co-founder',
    'researcher',
    'lived-experience',
    'writer',
    'strategist',
    'youth-worker',
    'community-organizer'
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login (you'll need to create this page)
      router.push(`/login?redirect=/people/${params.slug}/edit`);
      return;
    }

    setUser(user);

    // Load profile
    const { data: profileData, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (error || !profileData) {
      console.error('Profile load error:', error);
      console.log('Slug:', params.slug);
      alert(`Profile not found: ${error?.message || 'Unknown error'}`);
      router.push('/');
      return;
    }

    setProfile(profileData);

    // Check if user owns this profile or is admin
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    const isOwner = profileData.user_id === user.id;
    const isAdmin = userData?.user_role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('You do not have permission to edit this profile');
      router.push(`/people/${params.slug}`);
      return;
    }

    // Set form data
    setFormData({
      full_name: profileData.full_name || '',
      preferred_name: profileData.preferred_name || '',
      pronouns: profileData.pronouns || '',
      bio: profileData.bio || '',
      tagline: profileData.tagline || '',
      role_tags: profileData.role_tags || [],
      photo_url: profileData.photo_url || '',
      website_url: profileData.website_url || '',
      email: profileData.email || '',
      social_links: profileData.social_links || {},
      is_public: profileData.is_public || false
    });

    setLoading(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileName = `${params.slug}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(`team/${fileName}`, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(`team/${fileName}`);

      // Add cache buster to URL to force refresh
      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      setFormData({ ...formData, photo_url: photoUrl });

      alert('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Error uploading photo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('public_profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      alert('Profile updated successfully!');
      router.push(`/people/${params.slug}`);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Error saving profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function toggleRoleTag(tag: string) {
    const newTags = formData.role_tags.includes(tag)
      ? formData.role_tags.filter(t => t !== tag)
      : [...formData.role_tags, tag];

    setFormData({ ...formData, role_tags: newTags });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Header */}
      <div className="border-b-2 border-black bg-ochre-50 py-6">
        <div className="container-justice">
          <Link
            href={`/people/${params.slug}`}
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 transition-colors font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="text-4xl font-black">Edit Profile</h1>
          <p className="text-earth-700 mt-2">Update your public profile information</p>
        </div>
      </div>

      {/* Form */}
      <div className="container-justice py-12">
        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="space-y-8">
            {/* Photo Upload */}
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-xl font-black mb-4">Profile Photo</h2>

              <div className="flex items-start gap-6">
                {formData.photo_url && (
                  <img
                    src={formData.photo_url}
                    alt={formData.full_name}
                    className="w-32 h-32 rounded-full border-2 border-black object-cover"
                  />
                )}

                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-bold hover:bg-earth-800 transition-colors">
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-earth-600 mt-2">
                    Recommended: 800x800px square image, under 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-xl font-black mb-4">Profile Visibility</h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-6 h-6 border-2 border-black focus:ring-2 focus:ring-ochre-600"
                  />
                  <span className="font-bold">Make my profile public</span>
                </label>
                <p className="text-sm text-earth-600">
                  {formData.is_public
                    ? '✅ Your profile is visible to everyone'
                    : '🔒 Your profile is private (only you can see it)'}
                </p>
              </div>
            </div>

            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-xl font-black mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Preferred Name</label>
                  <input
                    type="text"
                    value={formData.preferred_name}
                    onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="Leave blank to use full name"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Pronouns</label>
                  <input
                    type="text"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="e.g., they/them, she/her, he/him"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="e.g., Co-founder, A Curious Tractor"
                  />
                  <p className="text-sm text-earth-600 mt-1">One-line description of your role</p>
                </div>

                <div>
                  <label className="block font-bold mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="Tell your story..."
                  />
                </div>
              </div>
            </div>

            {/* Role Tags */}
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-xl font-black mb-4">Role Tags</h2>
              <p className="text-sm text-earth-600 mb-4">Select all that apply</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableRoleTags.map((tag) => (
                  <label
                    key={tag}
                    className={`cursor-pointer px-4 py-2 border-2 border-black font-bold text-sm uppercase tracking-wider transition-colors ${
                      formData.role_tags.includes(tag)
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-earth-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.role_tags.includes(tag)}
                      onChange={() => toggleRoleTag(tag)}
                      className="sr-only"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            {/* Contact & Links */}
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-xl font-black mb-4">Contact & Links</h2>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Public Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="contact@example.com"
                  />
                  <p className="text-sm text-earth-600 mt-1">Only shown if you want people to contact you</p>
                </div>

                <div>
                  <label className="block font-bold mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.social_links.linkedin || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, linkedin: e.target.value }
                    })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Twitter/X</label>
                  <input
                    type="url"
                    value={formData.social_links.twitter || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, twitter: e.target.value }
                    })}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-bold hover:bg-earth-800 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>

              <Link
                href={`/people/${params.slug}`}
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-black font-bold hover:bg-earth-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

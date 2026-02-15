'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Check, X, Edit, Trash2, GripVertical, Search, Shield, Eye, EyeOff } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

interface Storyteller {
  id: string;
  display_name: string;
  role: string | null;        // New standardized field
  role_at_org?: string | null; // Legacy field (backward compatibility)
  bio_excerpt: string | null;
  quote: string | null;
  avatar_url: string | null;
  is_featured: boolean;
  is_public: boolean;
  display_order: number | null;
  consent_level: string | null;
  empathy_ledger_profile_id: string | null;
  linked_at: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface ProfileOption {
  id: string;
  full_name: string;
  photo_url: string | null;
  empathy_ledger_profile_id: string | null;
}

export default function StorytellerManagementPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [storytellers, setStorytellers] = useState<Storyteller[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New storyteller form state
  const [newStoryteller, setNewStoryteller] = useState({
    display_name: '',
    role: '',  // Use standardized field name
    bio_excerpt: '',
    quote: '',
    consent_level: 'basic',
    empathy_ledger_profile_id: null as string | null,
  });

  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profileData?.is_super_admin) {
      router.push('/');
      return;
    }

    // Load organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (!org) {
      router.push('/admin/organizations');
      return;
    }

    setOrganization(org);

    // Load storytellers
    const { data: storytellerData } = await supabase
      .from('partner_storytellers')
      .select('*')
      .eq('organization_id', org.id)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('display_name');

    setStorytellers(storytellerData || []);

    // Load profile options for adding
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, full_name, photo_url, empathy_ledger_profile_id')
      .eq('is_public', true)
      .order('full_name');

    setProfileOptions(profiles || []);

    setLoading(false);
  }

  async function addStoryteller(profileId?: string) {
    if (!organization) return;

    setSaving(true);
    setError(null);

    const supabase = createClient();

    let storytellerData: any = {
      organization_id: organization.id,
      display_name: newStoryteller.display_name,
      role: newStoryteller.role || null,  // Use standardized field name
      bio_excerpt: newStoryteller.bio_excerpt || null,
      quote: newStoryteller.quote || null,
      consent_level: newStoryteller.consent_level,
      is_public: true,
      is_featured: false,
      linked_at: new Date().toISOString(),
    };

    // If linking to existing profile
    if (profileId) {
      const profile = profileOptions.find(p => p.id === profileId);
      if (profile) {
        storytellerData.display_name = profile.full_name;
        storytellerData.avatar_url = profile.photo_url;
        storytellerData.empathy_ledger_profile_id = profile.empathy_ledger_profile_id;
      }
    }

    const { error: insertError } = await supabase
      .from('partner_storytellers')
      .insert(storytellerData);

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowAddModal(false);
      setNewStoryteller({
        display_name: '',
        role: '',  // Use standardized field name
        bio_excerpt: '',
        quote: '',
        consent_level: 'basic',
        empathy_ledger_profile_id: null,
      });
      await loadData();
    }

    setSaving(false);
  }

  async function updateStoryteller(id: string, updates: Partial<Storyteller>) {
    setSaving(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('partner_storytellers')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await loadData();
      setEditingId(null);
    }

    setSaving(false);
  }

  async function deleteStoryteller(id: string) {
    if (!confirm('Are you sure you want to remove this storyteller?')) return;

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from('partner_storytellers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await loadData();
    }
  }

  async function toggleVisibility(id: string, currentValue: boolean) {
    await updateStoryteller(id, { is_public: !currentValue });
  }

  async function toggleFeatured(id: string, currentValue: boolean) {
    await updateStoryteller(id, { is_featured: !currentValue });
  }

  const filteredProfiles = profileOptions.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white page-content">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-content">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href={`/admin/organizations/${slug}`}
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 mb-4 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {organization?.name}
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-2">
            Storytellers
          </h1>
          <p className="text-lg text-earth-700">
            Manage storytellers featured for {organization?.name}
          </p>
        </div>
      </section>

      <div className="container-justice py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 flex items-start gap-3">
            <X className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-red-800">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-earth-600 font-medium">
            {storytellers.length} storyteller{storytellers.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-cyan-600 text-white border-2 border-black font-bold hover:bg-cyan-700 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="h-4 w-4" />
            Add Storyteller
          </button>
        </div>

        {/* Consent Info */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-600 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-bold text-blue-900">Consent Required</div>
            <div className="text-blue-800 text-sm">
              All storytellers must have explicit consent to be featured. Profiles synced from Empathy Ledger
              already have consent tracking. For manually added storytellers, verify consent before making public.
            </div>
          </div>
        </div>

        {/* Storytellers List */}
        {storytellers.length === 0 ? (
          <div className="border-2 border-black p-12 bg-gray-50 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-xl font-bold text-gray-700 mb-2">No Storytellers Yet</div>
            <div className="text-gray-600 mb-4">
              Add storytellers to feature their voices on this organization&apos;s page.
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-cyan-600 text-white border-2 border-black font-bold hover:bg-cyan-700"
            >
              Add First Storyteller
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {storytellers.map((storyteller) => (
              <div
                key={storyteller.id}
                className={`border-2 border-black p-4 ${
                  storyteller.is_public ? 'bg-white' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle (future) */}
                  <div className="text-gray-400 cursor-move">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Avatar */}
                  {storyteller.avatar_url ? (
                    <img
                      src={storyteller.avatar_url}
                      alt={storyteller.display_name}
                      className="w-16 h-16 object-cover border-2 border-black rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-cyan-100 border-2 border-black rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-cyan-600" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{storyteller.display_name}</span>
                      {storyteller.is_featured && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-800">
                          FEATURED
                        </span>
                      )}
                      {!storyteller.is_public && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold border border-gray-700">
                          HIDDEN
                        </span>
                      )}
                      {storyteller.empathy_ledger_profile_id && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-800">
                          EMPATHY LEDGER
                        </span>
                      )}
                    </div>

                    {(storyteller.role || storyteller.role_at_org) && (
                      <div className="text-sm text-cyan-600 font-medium mb-1">
                        {storyteller.role || storyteller.role_at_org}
                      </div>
                    )}

                    {storyteller.bio_excerpt && (
                      <p className="text-sm text-earth-600 mb-2 line-clamp-2">
                        {storyteller.bio_excerpt}
                      </p>
                    )}

                    {storyteller.quote && (
                      <blockquote className="text-sm text-earth-700 italic border-l-2 border-cyan-600 pl-3 mb-2">
                        &ldquo;{storyteller.quote}&rdquo;
                      </blockquote>
                    )}

                    <div className="flex items-center gap-2 text-xs text-earth-500">
                      <span>Consent: {storyteller.consent_level || 'Not set'}</span>
                      {storyteller.linked_at && (
                        <>
                          <span>|</span>
                          <span>Added: {new Date(storyteller.linked_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVisibility(storyteller.id, storyteller.is_public)}
                      className={`p-2 border-2 border-black ${
                        storyteller.is_public
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={storyteller.is_public ? 'Hide' : 'Show'}
                    >
                      {storyteller.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => toggleFeatured(storyteller.id, storyteller.is_featured)}
                      className={`p-2 border-2 border-black ${
                        storyteller.is_featured
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={storyteller.is_featured ? 'Unfeature' : 'Feature'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(storyteller.id)}
                      className="p-2 border-2 border-black bg-white hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteStoryteller(storyteller.id)}
                      className="p-2 border-2 border-red-600 text-red-600 bg-white hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-black flex justify-between items-center">
              <h2 className="text-2xl font-black">Add Storyteller</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Search existing profiles */}
              <div>
                <label className="block font-bold mb-2">Link to Existing Profile</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-black"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2 max-h-48 overflow-y-auto border-2 border-black">
                    {filteredProfiles.length === 0 ? (
                      <div className="p-3 text-gray-600">No profiles found</div>
                    ) : (
                      filteredProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => addStoryteller(profile.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-cyan-50 border-b border-gray-200 last:border-b-0 text-left"
                        >
                          {profile.photo_url ? (
                            <img src={profile.photo_url} alt="" className="w-10 h-10 rounded-full border border-black" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold">{profile.full_name}</div>
                            {profile.empathy_ledger_profile_id && (
                              <div className="text-xs text-indigo-600">From Empathy Ledger</div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="text-center text-gray-600 mb-4">Or add manually</div>
              </div>

              {/* Manual entry */}
              <div>
                <label className="block font-bold mb-2">Display Name *</label>
                <input
                  type="text"
                  value={newStoryteller.display_name}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, display_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Role at Organization</label>
                <input
                  type="text"
                  value={newStoryteller.role}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, role: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black"
                  placeholder="e.g., Elder, Youth Worker, Participant"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Bio Excerpt</label>
                <textarea
                  value={newStoryteller.bio_excerpt}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, bio_excerpt: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black h-24"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Quote</label>
                <textarea
                  value={newStoryteller.quote}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, quote: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black h-20"
                  placeholder="A memorable quote from this person..."
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Consent Level</label>
                <select
                  value={newStoryteller.consent_level}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, consent_level: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black bg-white"
                >
                  <option value="basic">Basic - Name and role only</option>
                  <option value="full">Full - Photo and bio included</option>
                  <option value="verified">Verified - Written consent obtained</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t-2 border-black flex justify-end gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border-2 border-black font-bold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => addStoryteller()}
                disabled={!newStoryteller.display_name || saving}
                className="px-6 py-2 bg-cyan-600 text-white border-2 border-black font-bold hover:bg-cyan-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Storyteller'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

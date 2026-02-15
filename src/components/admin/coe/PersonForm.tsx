'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RoleSelector from '@/components/admin/RoleSelector';

interface Profile {
  id: string;
  slug: string;
  full_name: string;
  photo_url?: string;
}

interface PersonFormData {
  profile_id: string;
  role: string;           // New standardized field
  role_title?: string;    // Legacy field (kept for backward compatibility)
  expertise_area: string;
  bio_override: string;
  display_order: number;
  is_active: boolean;
}

interface PersonFormProps {
  initialData?: PersonFormData & { id?: string };
  isNew?: boolean;
}

export default function PersonForm({ initialData, isNew = false }: PersonFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);

  const [formData, setFormData] = useState<PersonFormData>(initialData || {
    profile_id: '',
    role: '',  // Use standardized field
    expertise_area: '',
    bio_override: '',
    display_order: 0,
    is_active: true,
  });

  // Load available profiles
  useEffect(() => {
    async function loadProfiles() {
      const supabase = createClient();

      const { data } = await supabase
        .from('public_profiles')
        .select('id, slug, full_name, photo_url')
        .order('full_name');

      if (data) {
        setAvailableProfiles(data);
      }
    }

    loadProfiles();
  }, []);

  const handleSave = async () => {
    if (!formData.profile_id || !formData.role) {
      alert('Please select a profile and enter a role.');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      // Send both role and role_title for backward compatibility during migration
      const dataToSave = {
        ...formData,
        role_title: formData.role, // Keep role_title in sync during migration
      };

      if (isNew) {
        const { error } = await supabase
          .from('coe_key_people')
          .insert([dataToSave]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coe_key_people')
          .update(dataToSave)
          .eq('id', initialData!.id!);

        if (error) throw error;
      }

      router.push('/admin/coe/people');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving person:', error);
      if (error.code === '23505') {
        alert('This profile is already added as a CoE key person.');
      } else {
        alert('Error saving person. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this person from CoE?')) return;

    setDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('coe_key_people')
        .delete()
        .eq('id', initialData!.id!);

      if (error) throw error;

      router.push('/admin/coe/people');
      router.refresh();
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Error deleting person. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const selectedProfile = availableProfiles.find(p => p.id === formData.profile_id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/coe/people" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
            ← Back to CoE People
          </Link>
          <h1 className="text-4xl font-black text-black">
            {isNew ? 'Add CoE Person' : 'Edit CoE Person'}
          </h1>
        </div>
        <div className="flex gap-4">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors border-2 border-black flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              {deleting ? 'Removing...' : 'Remove'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Profile Selection */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Select Profile</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Public Profile *</label>
            <select
              value={formData.profile_id}
              onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={!isNew}
            >
              <option value="">Select a profile...</option>
              {availableProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.slug})</option>
              ))}
            </select>
            {!isNew && (
              <p className="text-sm text-gray-500 mt-2">Profile cannot be changed after creation.</p>
            )}
          </div>
          <div>
            {selectedProfile && (
              <div className="p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  {selectedProfile.photo_url && (
                    <img
                      src={selectedProfile.photo_url}
                      alt={selectedProfile.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-black"
                    />
                  )}
                  <div>
                    <div className="font-bold">{selectedProfile.full_name}</div>
                    <div className="text-sm text-gray-500">/{selectedProfile.slug}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Details */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Role Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <RoleSelector
              value={formData.role}
              onChange={(role) => setFormData({ ...formData, role })}
              label="Role"
              required
              allowCustom
              filterCategories={['leadership', 'staff', 'community']}
              helperText="Select a standard role or enter a custom one"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Expertise Area</label>
            <input
              type="text"
              value={formData.expertise_area}
              onChange={(e) => setFormData({ ...formData, expertise_area: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g., Indigenous Justice, Trauma-Informed Care"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Bio Override</label>
            <textarea
              value={formData.bio_override}
              onChange={(e) => setFormData({ ...formData, bio_override: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Optional shorter bio for CoE context (leave blank to use profile bio)"
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Display Settings</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Display Order</label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-sm text-gray-500 mt-1">Lower numbers appear first</p>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-bold">Active</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

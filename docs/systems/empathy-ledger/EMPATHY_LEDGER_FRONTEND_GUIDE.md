# Empathy Ledger Frontend - JusticeHub Integration Guide

## Overview

This guide explains how to add JusticeHub display controls to the Empathy Ledger frontend, allowing users to:
- Enable/disable their profile on JusticeHub
- Choose their role (founder, leader, advocate, etc.)
- Opt into featured display
- See when their profile last synced

## Database Columns Reference

First, make sure these columns exist in Empathy Ledger (from the setup guide):

```sql
-- In Empathy Ledger database
profiles table:
  - justicehub_enabled (boolean) - Controls if profile appears on JusticeHub
  - justicehub_role (text) - Their role (founder, leader, advocate, practitioner, researcher)
  - justicehub_featured (boolean) - Show prominently on JusticeHub
  - justicehub_synced_at (timestamp) - When last synced to JusticeHub
```

## 1. Profile Settings Page

Add a new section to the user's profile settings page in Empathy Ledger.

### UI Design (React/Next.js Example)

```tsx
// In your profile settings component (e.g., app/profile/settings/page.tsx)

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function JusticeHubSettings({ profile }) {
  const [enabled, setEnabled] = useState(profile.justicehub_enabled || false);
  const [role, setRole] = useState(profile.justicehub_role || '');
  const [featured, setFeatured] = useState(profile.justicehub_featured || false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          justicehub_enabled: enabled,
          justicehub_role: enabled ? role : null,
          justicehub_featured: enabled ? featured : false,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage('Settings saved! Your profile will sync to JusticeHub within 6 hours.');
    } catch (error) {
      setMessage('Error saving settings. Please try again.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-2 border-black p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">JusticeHub Display Settings</h2>

      <p className="text-gray-700 mb-6">
        JusticeHub is a public platform showcasing youth justice work across Australia.
        Control how your profile appears on JusticeHub below.
      </p>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 border-2 border-black"
          />
          <div>
            <div className="font-bold">Display my profile on JusticeHub</div>
            <div className="text-sm text-gray-600">
              Allow JusticeHub to showcase your work publicly
            </div>
          </div>
        </label>
      </div>

      {/* Role Selection (only if enabled) */}
      {enabled && (
        <>
          <div className="mb-6">
            <label className="block font-bold mb-2">Your Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border-2 border-black"
              required
            >
              <option value="">Select your primary role...</option>
              <option value="founder">Founder - I started/co-founded an organization</option>
              <option value="leader">Leader - I lead programs or teams</option>
              <option value="advocate">Advocate - I advocate for youth justice reform</option>
              <option value="practitioner">Practitioner - I work directly with young people</option>
              <option value="researcher">Researcher - I research youth justice issues</option>
              <option value="lived-experience">Lived Experience - I have personal experience with youth justice</option>
              <option value="community-member">Community Member - I support youth justice work</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              This helps people understand your connection to youth justice
            </p>
          </div>

          {/* Featured Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 border-2 border-black"
              />
              <div>
                <div className="font-bold">Feature me prominently</div>
                <div className="text-sm text-gray-600">
                  Appear in featured profiles section on JusticeHub homepage
                </div>
              </div>
            </label>
          </div>

          {/* Sync Status */}
          {profile.justicehub_synced_at && (
            <div className="bg-green-50 border-2 border-green-600 p-4 mb-6">
              <div className="font-bold text-green-900">✓ Profile Synced</div>
              <div className="text-sm text-green-800">
                Last updated on JusticeHub:{' '}
                {new Date(profile.justicehub_synced_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <a
                href={`https://justicehub.org.au/people/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 underline mt-2 inline-block"
              >
                View your profile on JusticeHub →
              </a>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-yellow-50 border-2 border-yellow-600 p-4 mb-6">
            <div className="font-bold text-yellow-900">Privacy Notice</div>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
              <li>Your profile will be visible to anyone visiting JusticeHub</li>
              <li>Your name, photo, bio, and role will be displayed</li>
              <li>Stories you've consented to share will be linked</li>
              <li>You can disable this anytime</li>
              <li>Changes take up to 6 hours to sync</li>
            </ul>
          </div>
        </>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || (enabled && !role)}
        className="px-6 py-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Success/Error Message */}
      {message && (
        <div className={`mt-4 p-4 border-2 ${
          message.includes('Error')
            ? 'bg-red-50 border-red-600 text-red-900'
            : 'bg-green-50 border-green-600 text-green-900'
        }`}>
          {message}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-sm text-gray-600 border-t-2 border-gray-300 pt-4">
        <strong>About JusticeHub:</strong> JusticeHub is a platform that showcases youth justice
        work, programs, and stories across Australia. By enabling your profile, you help connect
        people to the important work happening in this space. You maintain full control of your
        data in Empathy Ledger, and JusticeHub only displays what you explicitly consent to share.
      </div>
    </div>
  );
}
```

## 2. Profile Badge (Show Sync Status)

Add a badge to the user's profile view showing if they're on JusticeHub:

```tsx
// In profile display component

export function ProfileHeader({ profile }) {
  return (
    <div className="border-2 border-black p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          <p className="text-gray-600">{profile.bio}</p>
        </div>

        {/* JusticeHub Badge */}
        {profile.justicehub_enabled && (
          <div className="bg-purple-100 border-2 border-purple-600 px-4 py-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
              </svg>
              <div>
                <div className="font-bold text-purple-900 text-sm">On JusticeHub</div>
                {profile.justicehub_role && (
                  <div className="text-xs text-purple-700 capitalize">
                    {profile.justicehub_role.replace('-', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 3. Onboarding Prompt

Show a one-time prompt when users create their profile:

```tsx
// In profile creation/onboarding flow

export function JusticeHubOnboarding({ profileId }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-600 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            ✨ Share Your Work on JusticeHub
          </h3>
          <p className="text-gray-700 mb-4">
            JusticeHub showcases youth justice work across Australia. Would you like to
            display your profile there and help others discover the important work you do?
          </p>
          <div className="flex gap-3">
            <a
              href="/profile/settings#justicehub"
              className="px-6 py-2 bg-purple-600 text-white font-bold border-2 border-black hover:bg-purple-700"
            >
              Set Up JusticeHub Display
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="px-6 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-100"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

## 4. Organization Settings

Similar controls for organizations:

```tsx
// In organization settings component

export function OrganizationJusticeHubSettings({ organization }) {
  const [enabled, setEnabled] = useState(organization.justicehub_enabled || false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          justicehub_enabled: enabled,
        })
        .eq('id', organization.id);

      if (error) throw error;

      alert('Settings saved! Your organization will sync to JusticeHub within 6 hours.');
    } catch (error) {
      alert('Error saving settings. Please try again.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-2 border-black p-6">
      <h2 className="text-2xl font-bold mb-4">JusticeHub Display</h2>

      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 border-2 border-black"
          />
          <div>
            <div className="font-bold">Display organization on JusticeHub</div>
            <div className="text-sm text-gray-600">
              Showcase your organization's youth justice work publicly
            </div>
          </div>
        </label>
      </div>

      {enabled && organization.justicehub_synced_at && (
        <div className="bg-green-50 border-2 border-green-600 p-4 mb-6">
          <div className="font-bold text-green-900">✓ Organization Listed</div>
          <div className="text-sm text-green-800">
            Last synced: {new Date(organization.justicehub_synced_at).toLocaleDateString()}
          </div>
          <a
            href={`https://justicehub.org.au/organizations/${organization.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 underline mt-2 inline-block"
          >
            View on JusticeHub →
          </a>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
```

## 5. Project Settings

Controls for projects (maps to Community Programs on JusticeHub):

```tsx
// In project settings component

export function ProjectJusticeHubSettings({ project }) {
  const [enabled, setEnabled] = useState(project.justicehub_enabled || false);
  const [programType, setProgramType] = useState(project.justicehub_program_type || '');

  const programTypes = [
    'Diversion Program',
    'Mentoring Program',
    'Cultural Program',
    'Education Support',
    'Arts Program',
    'Sports Program',
    'Family Support',
    'Employment Program',
    'Counseling Service',
    'Legal Support',
    'Advocacy Initiative',
    'Research Project',
    'Community Development',
    'Other'
  ];

  const handleSave = async () => {
    // Save logic similar to above
  };

  return (
    <div className="border-2 border-black p-6">
      <h2 className="text-2xl font-bold mb-4">JusticeHub Display</h2>

      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 border-2 border-black"
          />
          <div>
            <div className="font-bold">Display project on JusticeHub</div>
            <div className="text-sm text-gray-600">
              List this project in JusticeHub's community programs directory
            </div>
          </div>
        </label>
      </div>

      {enabled && (
        <div className="mb-6">
          <label className="block font-bold mb-2">Program Type *</label>
          <select
            value={programType}
            onChange={(e) => setProgramType(e.target.value)}
            className="w-full px-4 py-2 border-2 border-black"
            required
          >
            <option value="">Select program type...</option>
            {programTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={enabled && !programType}
        className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800"
      >
        Save Settings
      </button>
    </div>
  );
}
```

## 6. Admin Override (Organization Admins)

Allow organization admins to enable JusticeHub for all members:

```tsx
// In organization admin dashboard

export function OrganizationMemberJusticeHub({ members, organizationId }) {
  const [processing, setProcessing] = useState(false);

  const enableAllMembers = async () => {
    if (!confirm('Enable JusticeHub display for all members?')) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          justicehub_enabled: true,
          justicehub_role: 'practitioner', // Default role
        })
        .in('id', members.map(m => m.profile_id));

      if (error) throw error;

      alert('All members enabled! They can customize settings in their profile.');
    } catch (error) {
      alert('Error updating members. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border-2 border-black p-6">
      <h3 className="text-xl font-bold mb-4">JusticeHub Bulk Actions</h3>

      <button
        onClick={enableAllMembers}
        disabled={processing}
        className="px-6 py-3 bg-purple-600 text-white font-bold border-2 border-black hover:bg-purple-700"
      >
        {processing ? 'Processing...' : 'Enable All Members on JusticeHub'}
      </button>

      <p className="text-sm text-gray-600 mt-2">
        Members can disable or customize their settings individually
      </p>
    </div>
  );
}
```

## 7. Cultural Protocols Integration

If you have cultural protocols in Empathy Ledger, respect them:

```tsx
// Check cultural protocols before enabling JusticeHub

export function JusticeHubSettingsWithProtocols({ profile, story }) {
  const [enabled, setEnabled] = useState(false);
  const [hasElderApproval, setHasElderApproval] = useState(false);

  // Check if story requires elder approval
  const requiresElderApproval = story?.cultural_protocols?.requires_elder_approval;

  const handleSave = async () => {
    if (requiresElderApproval && !hasElderApproval) {
      alert('Elder approval required before displaying on JusticeHub');
      return;
    }

    // Proceed with save...
  };

  return (
    <div className="border-2 border-black p-6">
      {requiresElderApproval && (
        <div className="bg-orange-50 border-2 border-orange-600 p-4 mb-6">
          <div className="font-bold text-orange-900">⚠️ Cultural Protocol</div>
          <p className="text-sm text-orange-800 mt-2">
            This story contains cultural content that requires elder approval before
            public display on JusticeHub.
          </p>

          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={hasElderApproval}
              onChange={(e) => setHasElderApproval(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">I have received elder approval for public display</span>
          </label>
        </div>
      )}

      {/* Rest of settings UI */}
    </div>
  );
}
```

## 8. Database Queries

Helper queries for your frontend:

```typescript
// Get current JusticeHub settings for a profile
async function getJusticeHubSettings(profileId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('justicehub_enabled, justicehub_role, justicehub_featured, justicehub_synced_at')
    .eq('id', profileId)
    .single();

  return data;
}

// Update JusticeHub settings
async function updateJusticeHubSettings(profileId: string, settings: {
  enabled: boolean;
  role?: string;
  featured?: boolean;
}) {
  const { error } = await supabase
    .from('profiles')
    .update({
      justicehub_enabled: settings.enabled,
      justicehub_role: settings.enabled ? settings.role : null,
      justicehub_featured: settings.enabled ? settings.featured : false,
    })
    .eq('id', profileId);

  return { error };
}

// Get all profiles enabled for JusticeHub (admin view)
async function getJusticeHubEnabledProfiles() {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, justicehub_role, justicehub_synced_at')
    .eq('justicehub_enabled', true)
    .order('justicehub_synced_at', { ascending: false });

  return data;
}
```

## Summary Checklist

To implement JusticeHub controls in Empathy Ledger:

- [ ] Add JusticeHub settings section to profile settings page
- [ ] Add role selection dropdown with options
- [ ] Add featured profile checkbox
- [ ] Show sync status with timestamp
- [ ] Add privacy notice explaining what's shared
- [ ] Add JusticeHub badge to profile view
- [ ] Add onboarding prompt for new users
- [ ] Add organization settings (similar to profiles)
- [ ] Add project/program settings
- [ ] Respect cultural protocols if applicable
- [ ] Add bulk actions for organization admins (optional)
- [ ] Link to view profile on JusticeHub (after sync)

## Next Steps

1. Choose which components to implement based on Empathy Ledger's UI framework
2. Add the database queries to your API layer
3. Update forms to save the new fields
4. Test with a few profiles
5. Monitor sync logs in JusticeHub admin

---

**Note**: All components above use plain JavaScript/React patterns. Adapt to your specific framework (Vue, Svelte, etc.) as needed.

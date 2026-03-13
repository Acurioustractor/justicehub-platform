'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Save, Eye, Image, Users, BarChart3, FileText, MapPin, Globe } from 'lucide-react';

interface SiteEditorProps {
  data: {
    org: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      location: string | null;
      state: string | null;
      website: string | null;
    };
    photos: any[];
    contacts: any[];
    goals: any[];
    metrics: any[];
    storytellers: any[];
    siteLocations: any[];
  };
}

type Tab = 'overview' | 'gallery' | 'team' | 'metrics' | 'goals' | 'contacts';

export function SiteEditorClient({ data }: SiteEditorProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Overview form state
  const [description, setDescription] = useState(data.org.description || '');
  const [location, setLocation] = useState(data.org.location || '');
  const [website, setWebsite] = useState(data.org.website || '');

  async function saveOverview() {
    setSaving(true);
    try {
      await (supabase as any)
        .from('organizations')
        .update({ description, location, website })
        .eq('id', data.org.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Globe },
    { key: 'gallery', label: 'Gallery', icon: Image, count: data.photos.length },
    { key: 'team', label: 'Team', icon: Users, count: data.storytellers.length },
    { key: 'metrics', label: 'Metrics', icon: BarChart3, count: data.metrics.length },
    { key: 'goals', label: 'Goals', icon: FileText, count: data.goals.length },
    { key: 'contacts', label: 'Contacts', icon: MapPin, count: data.contacts.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">Site Editor</h1>
          <p className="text-earth-600">
            Edit your mini-site at{' '}
            <Link href={`/sites/${data.org.slug}`} className="text-ochre-600 underline font-bold" target="_blank">
              /sites/{data.org.slug}
            </Link>
          </p>
        </div>
        <Link
          href={`/sites/${data.org.slug}`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 border-2 border-black font-bold text-sm hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" /> Preview
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b-2 border-black">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-[2px] transition-colors ${
                activeTab === tab.key
                  ? 'border-black text-black'
                  : 'border-transparent text-earth-500 hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6">Organization Details</h2>
          <div className="space-y-6">
            <div>
              <label className="block font-bold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                placeholder="Tell visitors about your organisation..."
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  placeholder="e.g. Mount Isa, QLD"
                />
              </div>
              <div>
                <label className="block font-bold mb-2">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-ochre-600"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={saveOverview}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && (
                <span className="text-green-700 font-bold text-sm">Saved!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6">Photo Gallery</h2>
          {data.photos.length === 0 ? (
            <p className="text-earth-500">No photos yet. Contact your JusticeHub admin to upload photos.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.photos.map((photo: any) => (
                <div key={photo.id} className="border-2 border-gray-200 overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {photo.url ? (
                      <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-earth-600 truncate">{photo.caption || 'No caption'}</p>
                    {photo.is_featured && (
                      <span className="text-xs font-bold text-ochre-700">Featured</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6">Team Members</h2>
          {data.storytellers.length === 0 ? (
            <p className="text-earth-500">No team members listed yet.</p>
          ) : (
            <div className="space-y-4">
              {data.storytellers.map((person: any) => (
                <div key={person.id} className="flex items-center gap-4 border-2 border-gray-200 p-4">
                  <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">{person.name}</h3>
                    <p className="text-sm text-earth-600">{person.role || 'Team Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6">Impact Metrics</h2>
          {data.metrics.length === 0 ? (
            <p className="text-earth-500">No metrics recorded yet.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {data.metrics.map((metric: any) => (
                <div key={metric.id} className="border-2 border-black p-4 text-center">
                  <div className="text-3xl font-black">{metric.value}</div>
                  <div className="text-sm text-earth-600 mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6">Program Goals</h2>
          {data.goals.length === 0 ? (
            <p className="text-earth-500">No goals set yet.</p>
          ) : (
            <div className="space-y-3">
              {data.goals.map((goal: any) => (
                <div key={goal.id} className="border-2 border-gray-200 p-4">
                  <h3 className="font-bold mb-1">{goal.title}</h3>
                  {goal.description && <p className="text-sm text-earth-600">{goal.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black mb-6">Contact Information</h2>
          {data.contacts.length === 0 ? (
            <p className="text-earth-500">No contacts listed yet.</p>
          ) : (
            <div className="space-y-3">
              {data.contacts.map((contact: any) => (
                <div key={contact.id} className="flex items-center gap-4 border-2 border-gray-200 p-4">
                  <div>
                    <h3 className="font-bold">{contact.name}</h3>
                    <p className="text-sm text-earth-600">{contact.role}</p>
                    {contact.email && <p className="text-sm text-ochre-600">{contact.email}</p>}
                    {contact.phone && <p className="text-sm text-earth-500">{contact.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

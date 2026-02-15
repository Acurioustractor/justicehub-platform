'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, Plus, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Outcome {
  metric: string;
  value: string;
  context: string;
}

interface Resource {
  title: string;
  type: 'research' | 'policy' | 'report';
  url: string;
  description: string;
}

interface FrameworkFormData {
  slug: string;
  name: string;
  state: string;
  tagline: string;
  overview: string;
  key_features: string[];
  strengths: string[];
  challenges: string[];
  outcomes: Outcome[];
  resources: Resource[];
  color: string;
  display_order: number;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface FrameworkFormProps {
  initialData?: FrameworkFormData & { id?: string };
  isNew?: boolean;
}

const COLORS = ['blue', 'purple', 'yellow', 'red', 'green', 'orange'];
const STATES = ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Northern Territory', 'Australian Capital Territory'];

export default function FrameworkForm({ initialData, isNew = false }: FrameworkFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState<FrameworkFormData>(initialData || {
    slug: '',
    name: '',
    state: '',
    tagline: '',
    overview: '',
    key_features: [],
    strengths: [],
    challenges: [],
    outcomes: [],
    resources: [],
    color: 'blue',
    display_order: 0,
    is_active: true,
    latitude: null,
    longitude: null,
  });

  const [newFeature, setNewFeature] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newOutcome, setNewOutcome] = useState<Outcome>({ metric: '', value: '', context: '' });
  const [newResource, setNewResource] = useState<Resource>({ title: '', type: 'research', url: '', description: '' });

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      if (isNew) {
        const { error } = await supabase
          .from('australian_frameworks')
          .insert([formData]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('australian_frameworks')
          .update(formData)
          .eq('slug', initialData?.slug);

        if (error) throw error;
      }

      router.push('/admin/coe/frameworks');
      router.refresh();
    } catch (error) {
      console.error('Error saving framework:', error);
      alert('Error saving framework. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this framework?')) return;

    setDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('australian_frameworks')
        .delete()
        .eq('slug', initialData?.slug);

      if (error) throw error;

      router.push('/admin/coe/frameworks');
      router.refresh();
    } catch (error) {
      console.error('Error deleting framework:', error);
      alert('Error deleting framework. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const addItem = (field: 'key_features' | 'strengths' | 'challenges', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
    setter('');
  };

  const removeItem = (field: 'key_features' | 'strengths' | 'challenges', index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  };

  const addOutcome = () => {
    if (!newOutcome.metric || !newOutcome.value) return;
    setFormData({ ...formData, outcomes: [...formData.outcomes, newOutcome] });
    setNewOutcome({ metric: '', value: '', context: '' });
  };

  const removeOutcome = (index: number) => {
    setFormData({ ...formData, outcomes: formData.outcomes.filter((_, i) => i !== index) });
  };

  const addResource = () => {
    if (!newResource.title || !newResource.url) return;
    setFormData({ ...formData, resources: [...formData.resources, newResource] });
    setNewResource({ title: '', type: 'research', url: '', description: '' });
  };

  const removeResource = (index: number) => {
    setFormData({ ...formData, resources: formData.resources.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/coe/frameworks" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
            ← Back to Frameworks
          </Link>
          <h1 className="text-4xl font-black text-black">
            {isNew ? 'New Framework' : 'Edit Framework'}
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
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save Framework'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="NSW Youth Koori Court"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="nsw-youth-koori-court"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">State *</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select State</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Color</label>
            <select
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Tagline *</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="40% reduction in custodial sentences"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Overview *</label>
            <textarea
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Detailed description of the framework..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Display Order</label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-center gap-4">
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

      {/* Location */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Map Location</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="-33.8688"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="151.2093"
            />
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Key Features</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('key_features', newFeature, setNewFeature)}
            className="flex-1 px-4 py-2 border-2 border-black"
            placeholder="Add a key feature..."
          />
          <button
            onClick={() => addItem('key_features', newFeature, setNewFeature)}
            className="px-4 py-2 bg-black text-white font-bold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {formData.key_features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200">
              <span className="flex-1">{f}</span>
              <button onClick={() => removeItem('key_features', i)} className="text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4 text-green-700">Strengths</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newStrength}
            onChange={(e) => setNewStrength(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('strengths', newStrength, setNewStrength)}
            className="flex-1 px-4 py-2 border-2 border-black"
            placeholder="Add a strength..."
          />
          <button
            onClick={() => addItem('strengths', newStrength, setNewStrength)}
            className="px-4 py-2 bg-green-600 text-white font-bold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {formData.strengths.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200">
              <span className="flex-1">{s}</span>
              <button onClick={() => removeItem('strengths', i)} className="text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4 text-orange-700">Challenges</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newChallenge}
            onChange={(e) => setNewChallenge(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('challenges', newChallenge, setNewChallenge)}
            className="flex-1 px-4 py-2 border-2 border-black"
            placeholder="Add a challenge..."
          />
          <button
            onClick={() => addItem('challenges', newChallenge, setNewChallenge)}
            className="px-4 py-2 bg-orange-600 text-white font-bold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {formData.challenges.map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200">
              <span className="flex-1">{c}</span>
              <button onClick={() => removeItem('challenges', i)} className="text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Key Outcomes</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <input
            type="text"
            value={newOutcome.metric}
            onChange={(e) => setNewOutcome({ ...newOutcome, metric: e.target.value })}
            className="px-3 py-2 border-2 border-black"
            placeholder="Metric name"
          />
          <input
            type="text"
            value={newOutcome.value}
            onChange={(e) => setNewOutcome({ ...newOutcome, value: e.target.value })}
            className="px-3 py-2 border-2 border-black"
            placeholder="Value (e.g., 40%)"
          />
          <input
            type="text"
            value={newOutcome.context}
            onChange={(e) => setNewOutcome({ ...newOutcome, context: e.target.value })}
            className="px-3 py-2 border-2 border-black"
            placeholder="Context"
          />
          <button onClick={addOutcome} className="px-4 py-2 bg-blue-600 text-white font-bold">
            <Plus className="h-5 w-5 mx-auto" />
          </button>
        </div>
        <div className="space-y-2">
          {formData.outcomes.map((o, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200">
              <div className="flex-1">
                <span className="font-bold text-blue-600">{o.value}</span> - {o.metric}
                <div className="text-sm text-gray-600">{o.context}</div>
              </div>
              <button onClick={() => removeOutcome(i)} className="text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Resources</h2>
        <div className="grid grid-cols-5 gap-2 mb-4">
          <input
            type="text"
            value={newResource.title}
            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
            className="px-3 py-2 border-2 border-black"
            placeholder="Title"
          />
          <select
            value={newResource.type}
            onChange={(e) => setNewResource({ ...newResource, type: e.target.value as 'research' | 'policy' | 'report' })}
            className="px-3 py-2 border-2 border-black"
          >
            <option value="research">Research</option>
            <option value="policy">Policy</option>
            <option value="report">Report</option>
          </select>
          <input
            type="url"
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            className="px-3 py-2 border-2 border-black"
            placeholder="URL"
          />
          <input
            type="text"
            value={newResource.description}
            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
            className="px-3 py-2 border-2 border-black"
            placeholder="Description"
          />
          <button onClick={addResource} className="px-4 py-2 bg-purple-600 text-white font-bold">
            <Plus className="h-5 w-5 mx-auto" />
          </button>
        </div>
        <div className="space-y-2">
          {formData.resources.map((r, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-purple-50 border border-purple-200">
              <div className="flex-1">
                <div className="font-bold">{r.title}</div>
                <div className="text-sm text-gray-600">{r.description}</div>
                <div className="text-xs text-purple-600 uppercase">{r.type}</div>
              </div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">View</a>
              <button onClick={() => removeResource(i)} className="text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, Plus, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ResearchFormData {
  slug: string;
  title: string;
  authors: string[];
  organization: string;
  year: number;
  category: string;
  jurisdiction: string;
  type: string;
  summary: string;
  key_findings: string[];
  external_url: string;
  pdf_url: string;
  video_url: string;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
}

interface ResearchFormProps {
  initialData?: ResearchFormData & { id?: string };
  isNew?: boolean;
}

const CATEGORIES = [
  { id: 'trauma-informed', label: 'Trauma-Informed Practice' },
  { id: 'indigenous-diversion', label: 'Indigenous-Led Diversion' },
  { id: 'family-engagement', label: 'Family Engagement' },
  { id: 'restorative-justice', label: 'Restorative Justice' },
  { id: 'youth-rights', label: 'Youth Rights & Lived Experience' },
  { id: 'recidivism', label: 'Recidivism' },
  { id: 'mental-health', label: 'Mental Health' }
];

const JURISDICTIONS = [
  'Australia',
  'Queensland',
  'New Zealand',
  'Scotland',
  'International',
  'Nordic'
];

const TYPES = [
  { id: 'research-paper', label: 'Research Paper' },
  { id: 'systematic-review', label: 'Systematic Review' },
  { id: 'meta-analysis', label: 'Meta-Analysis' },
  { id: 'policy-brief', label: 'Policy Brief' },
  { id: 'case-study', label: 'Case Study' },
  { id: 'video', label: 'Video' },
  { id: 'report', label: 'Report' }
];

export default function ResearchForm({ initialData, isNew = false }: ResearchFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState<ResearchFormData>(initialData || {
    slug: '',
    title: '',
    authors: [],
    organization: '',
    year: new Date().getFullYear(),
    category: 'trauma-informed',
    jurisdiction: 'Australia',
    type: 'research-paper',
    summary: '',
    key_findings: [],
    external_url: '',
    pdf_url: '',
    video_url: '',
    tags: [],
    is_featured: false,
    is_active: true,
    display_order: 0,
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newFinding, setNewFinding] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      if (isNew) {
        const { error } = await supabase
          .from('research_items')
          .insert([formData]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('research_items')
          .update(formData)
          .eq('slug', initialData?.slug);

        if (error) throw error;
      }

      router.push('/admin/coe/research');
      router.refresh();
    } catch (error) {
      console.error('Error saving research item:', error);
      alert('Error saving research item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this research item?')) return;

    setDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('research_items')
        .delete()
        .eq('slug', initialData?.slug);

      if (error) throw error;

      router.push('/admin/coe/research');
      router.refresh();
    } catch (error) {
      console.error('Error deleting research item:', error);
      alert('Error deleting research item. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const addItem = (field: 'authors' | 'key_findings' | 'tags', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
    setter('');
  };

  const removeItem = (field: 'authors' | 'key_findings' | 'tags', index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/coe/research" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
            ← Back to Research Items
          </Link>
          <h1 className="text-4xl font-black text-black">
            {isNew ? 'New Research Item' : 'Edit Research Item'}
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
            {saving ? 'Saving...' : 'Save Research'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Research paper title..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="trauma-informed-umbrella-2024"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Year *</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Organization *</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Journal of Child & Adolescent Trauma"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold mb-2">Summary *</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Brief summary of the research..."
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Classification</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Jurisdiction *</label>
            <select
              value={formData.jurisdiction}
              onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Authors */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Authors</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('authors', newAuthor, setNewAuthor)}
            className="flex-1 px-4 py-2 border-2 border-black"
            placeholder="Add author name..."
          />
          <button
            onClick={() => addItem('authors', newAuthor, setNewAuthor)}
            className="px-4 py-2 bg-black text-white font-bold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.authors.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-300">
              {a}
              <button onClick={() => removeItem('authors', i)} className="text-red-600"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Key Findings */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Key Findings</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFinding}
            onChange={(e) => setNewFinding(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('key_findings', newFinding, setNewFinding)}
            className="flex-1 px-4 py-2 border-2 border-black"
            placeholder="Add a key finding..."
          />
          <button
            onClick={() => addItem('key_findings', newFinding, setNewFinding)}
            className="px-4 py-2 bg-blue-600 text-white font-bold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {formData.key_findings.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200">
              <span className="flex-1">{f}</span>
              <button onClick={() => removeItem('key_findings', i)} className="text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* URLs */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Links</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">External URL</label>
            <input
              type="url"
              value={formData.external_url}
              onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">PDF URL</label>
            <input
              type="url"
              value={formData.pdf_url}
              onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="https://...pdf"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Video URL</label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Tags</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('tags', newTag, setNewTag)}
            className="flex-1 px-4 py-2 border-2 border-black"
            placeholder="Add tag..."
          />
          <button
            onClick={() => addItem('tags', newTag, setNewTag)}
            className="px-4 py-2 bg-purple-600 text-white font-bold"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 border border-purple-300 text-purple-700">
              #{t}
              <button onClick={() => removeItem('tags', i)} className="text-red-600"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="grid grid-cols-3 gap-6">
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
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-bold">Featured</span>
            </label>
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
    </div>
  );
}

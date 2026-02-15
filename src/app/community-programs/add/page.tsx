'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

const AUSTRALIAN_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const APPROACH_TYPES = ['Indigenous-led', 'Community-based', 'Grassroots', 'Culturally-responsive'];

// Suggested tags library
const SUGGESTED_TAGS = [
  'Vocational Training', 'Animal Therapy', 'Mentorship', 'Cultural Healing',
  'Elder Mentorship', 'Trauma Recovery', 'Traditional Knowledge', 'Youth Leadership',
  'Community Organizing', 'Social Justice', 'Advocacy', 'Creative Arts',
  'Foster Care', 'Independent Living', 'Youth Homelessness', 'Cultural Strength',
  'Connection to Country', 'Ceremony', 'Technology', 'Neurodiversity',
  'Digital Skills', 'Innovation', 'Mental Health', 'Family Support',
  'Substance Abuse Recovery', 'Education Support', 'Employment Pathways',
  'Justice Reinvestment', 'Restorative Justice', 'Peer Support'
];

export default function AddProgramPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    location: '',
    state: 'NSW',
    approach: 'Community-based',
    description: '',
    impact_summary: '',
    success_rate: 75,
    participants_served: 50,
    years_operating: 5,
    founded_year: new Date().getFullYear() - 5,
    community_connection_score: 80,
    indigenous_knowledge: false,
    is_featured: false,
    contact_phone: '',
    contact_email: '',
    website: '',
    tags: [] as string[],
    featured_storyteller_name: '',
    featured_storyteller_story: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data, error: supabaseError } = await supabase
        .from('registered_services')
        .insert([formData])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/community-programs/${data.id}`);
      }, 2000);

    } catch (err) {
      console.error('Error adding program:', err);
      setError(err instanceof Error ? err.message : 'Failed to add program');
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addCustomTag = () => {
    const customTag = prompt('Enter custom tag:');
    if (customTag && customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()]
      }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main>
          <section className="header-offset py-16">
            <div className="container-justice max-w-2xl text-center">
              <div className="bg-green-50 border-2 border-green-600 p-8 rounded">
                <h1 className="text-3xl font-bold text-green-800 mb-4">Program Added Successfully!</h1>
                <p className="text-gray-700 mb-6">
                  Your program has been added to the database. Redirecting to program page...
                </p>
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main>
        {/* Header */}
        <section className="header-offset pb-6 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/community-programs"
              className="inline-flex items-center gap-2 text-blue-800 hover:text-blue-600 font-medium mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Programs
            </Link>

            <h1 className="text-4xl font-bold mb-4">Add Community Program</h1>
            <p className="text-xl text-gray-700 max-w-3xl">
              Share a program that's making real impact. Help others discover grassroots solutions
              and community-driven approaches that transform lives.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="py-12">
          <div className="container-justice max-w-4xl">
            {error && (
              <div className="bg-red-50 border-2 border-red-600 p-4 mb-6 rounded">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="data-card">
                <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block font-bold mb-2">Program Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., BackTrack Youth Works"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Organization *</label>
                    <input
                      type="text"
                      required
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., BackTrack"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold mb-2">Location *</label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full p-3 border-2 border-black"
                        placeholder="e.g., Armidale"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-2">State *</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="w-full p-3 border-2 border-black"
                      >
                        {AUSTRALIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Approach Type *</label>
                    <select
                      value={formData.approach}
                      onChange={(e) => setFormData({...formData, approach: e.target.value as any})}
                      className="w-full p-3 border-2 border-black"
                    >
                      {APPROACH_TYPES.map(approach => (
                        <option key={approach} value={approach}>{approach}</option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Indigenous-led:</strong> Led by Indigenous people and communities<br/>
                      <strong>Community-based:</strong> Driven by local community organizations<br/>
                      <strong>Grassroots:</strong> Bottom-up, youth-led initiatives<br/>
                      <strong>Culturally-responsive:</strong> Adapts to diverse cultural contexts
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.indigenous_knowledge}
                        onChange={(e) => setFormData({...formData, indigenous_knowledge: e.target.checked})}
                        className="h-5 w-5"
                      />
                      <span className="font-bold">Incorporates Indigenous Knowledge</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="data-card">
                <h2 className="text-2xl font-bold mb-6">Program Details</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block font-bold mb-2">Description *</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      rows={4}
                      placeholder="Detailed description of what the program does..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Impact Summary *</label>
                    <input
                      type="text"
                      required
                      value={formData.impact_summary}
                      onChange={(e) => setFormData({...formData, impact_summary: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., Transforms lives through dogs, welding, and mentorship - 87% never reoffend"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      One compelling sentence about the program's impact
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="data-card">
                <h2 className="text-2xl font-bold mb-6">Impact Metrics</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-bold mb-2">Success Rate (%) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={formData.success_rate}
                      onChange={(e) => setFormData({...formData, success_rate: parseInt(e.target.value)})}
                      className="w-full p-3 border-2 border-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Participants Served *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.participants_served}
                      onChange={(e) => setFormData({...formData, participants_served: parseInt(e.target.value)})}
                      className="w-full p-3 border-2 border-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Years Operating *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.years_operating}
                      onChange={(e) => setFormData({...formData, years_operating: parseInt(e.target.value)})}
                      className="w-full p-3 border-2 border-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Founded Year *</label>
                    <input
                      type="number"
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.founded_year}
                      onChange={(e) => setFormData({...formData, founded_year: parseInt(e.target.value)})}
                      className="w-full p-3 border-2 border-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Community Connection Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.community_connection_score}
                      onChange={(e) => setFormData({...formData, community_connection_score: parseInt(e.target.value)})}
                      className="w-full p-3 border-2 border-black"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      How deeply connected is this program to its community?
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="data-card">
                <h2 className="text-2xl font-bold mb-6">Contact Information (Optional)</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block font-bold mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., 02 6772 1234"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., info@program.org.au"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., https://program.org.au"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="data-card">
                <h2 className="text-2xl font-bold mb-6">Tags</h2>
                <p className="text-gray-700 mb-4">
                  Select tags that describe this program's focus areas and approaches:
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {SUGGESTED_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm font-medium border-2 transition-all ${
                        formData.tags.includes(tag)
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-800'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addCustomTag}
                  className="text-blue-800 hover:text-blue-600 font-medium text-sm"
                >
                  + Add custom tag
                </button>

                {formData.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold mb-2">Selected tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-blue-800 text-white text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Storyteller (Optional) */}
              <div className="data-card">
                <h2 className="text-2xl font-bold mb-6">Featured Storyteller (Optional)</h2>
                <p className="text-gray-700 mb-4">
                  If you have a young person's story connected to this program, you can feature it here:
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block font-bold mb-2">Storyteller Name</label>
                    <input
                      type="text"
                      value={formData.featured_storyteller_name}
                      onChange={(e) => setFormData({...formData, featured_storyteller_name: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      placeholder="e.g., Marcus Thompson"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Story Quote/Excerpt</label>
                    <textarea
                      value={formData.featured_storyteller_story}
                      onChange={(e) => setFormData({...formData, featured_storyteller_story: e.target.value})}
                      className="w-full p-3 border-2 border-black"
                      rows={3}
                      placeholder="A brief quote or story excerpt that captures the impact..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-6 border-t-2 border-black">
                <Link
                  href="/community-programs"
                  className="px-6 py-3 border-2 border-black font-bold hover:bg-gray-100"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-blue-800 text-white font-bold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Add Program
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

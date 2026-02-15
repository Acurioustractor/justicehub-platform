'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

interface Program {
  id: string;
  name: string;
  organization: string;
  organization_slug: string | null;
  location: string;
  state: string;
  approach: string;
  description: string;
  impact_summary: string;
  success_rate: number;
  participants_served: number;
  years_operating: number;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  is_featured: boolean;
  indigenous_knowledge: boolean;
  community_connection_score: number;
  tags: string[];
  founded_year: number;
}

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProgram() {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/admin/programs');
        return;
      }

      // Check admin role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (!profileData?.is_super_admin) {
        router.push('/');
        return;
      }

      // Fetch program
      const { data, error } = await supabase
        .from('registered_services')
        .select('*')
        .eq('id', programId)
        .single();

      if (error) {
        setError('Program not found');
      } else {
        setProgram(data);
      }
      setLoading(false);
    }

    if (programId) {
      fetchProgram();
    }
  }, [programId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    const { error } = await supabase
      .from('registered_services')
      .update({
        name: program.name,
        organization: program.organization,
        location: program.location,
        state: program.state,
        approach: program.approach,
        description: program.description,
        impact_summary: program.impact_summary,
        success_rate: program.success_rate,
        participants_served: program.participants_served,
        years_operating: program.years_operating,
        contact_phone: program.contact_phone,
        contact_email: program.contact_email,
        website: program.website,
        is_featured: program.is_featured,
        indigenous_knowledge: program.indigenous_knowledge,
        community_connection_score: program.community_connection_score,
        tags: program.tags,
        founded_year: program.founded_year,
      })
      .eq('id', programId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="min-h-screen bg-gray-50 page-content">
        <Navigation />
        <div className="container-justice pt-8">
          <div className="bg-white border-2 border-black p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/admin/programs" className="text-blue-600 hover:underline">
              Back to Programs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!program) return null;

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice max-w-4xl">
          <Link href="/admin/programs" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Link>

          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <h1 className="text-3xl font-black mb-6">Edit Program</h1>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-600 text-green-800 font-bold">
                Program updated successfully!
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 text-red-800 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Program Name *</label>
                  <input
                    type="text"
                    value={program.name}
                    onChange={(e) => setProgram({ ...program, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Organization</label>
                  <input
                    type="text"
                    value={program.organization}
                    onChange={(e) => setProgram({ ...program, organization: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Location</label>
                  <input
                    type="text"
                    value={program.location}
                    onChange={(e) => setProgram({ ...program, location: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">State</label>
                  <select
                    value={program.state}
                    onChange={(e) => setProgram({ ...program, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="QLD">QLD</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="NT">NT</option>
                    <option value="ACT">ACT</option>
                  </select>
                </div>
              </div>

              {/* Approach */}
              <div>
                <label className="block text-sm font-bold mb-2">Approach</label>
                <select
                  value={program.approach}
                  onChange={(e) => setProgram({ ...program, approach: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="Indigenous-led">Indigenous-led</option>
                  <option value="Community-based">Community-based</option>
                  <option value="Grassroots">Grassroots</option>
                  <option value="Culturally-responsive">Culturally-responsive</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold mb-2">Description</label>
                <textarea
                  value={program.description}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Impact Summary */}
              <div>
                <label className="block text-sm font-bold mb-2">Impact Summary</label>
                <textarea
                  value={program.impact_summary}
                  onChange={(e) => setProgram({ ...program, impact_summary: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Metrics */}
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Success Rate (%)</label>
                  <input
                    type="number"
                    value={program.success_rate}
                    onChange={(e) => setProgram({ ...program, success_rate: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Participants Served</label>
                  <input
                    type="number"
                    value={program.participants_served}
                    onChange={(e) => setProgram({ ...program, participants_served: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Years Operating</label>
                  <input
                    type="number"
                    value={program.years_operating}
                    onChange={(e) => setProgram({ ...program, years_operating: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Founded Year</label>
                  <input
                    type="number"
                    value={program.founded_year}
                    onChange={(e) => setProgram({ ...program, founded_year: parseInt(e.target.value) || 2000 })}
                    min="1900"
                    max="2030"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={program.contact_phone || ''}
                    onChange={(e) => setProgram({ ...program, contact_phone: e.target.value || null })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={program.contact_email || ''}
                    onChange={(e) => setProgram({ ...program, contact_email: e.target.value || null })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Website</label>
                  <input
                    type="url"
                    value={program.website || ''}
                    onChange={(e) => setProgram({ ...program, website: e.target.value || null })}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={program.is_featured}
                    onChange={(e) => setProgram({ ...program, is_featured: e.target.checked })}
                    className="w-5 h-5 border-2 border-black"
                  />
                  <span className="font-bold">Featured Program</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={program.indigenous_knowledge}
                    onChange={(e) => setProgram({ ...program, indigenous_knowledge: e.target.checked })}
                    className="w-5 h-5 border-2 border-black"
                  />
                  <span className="font-bold">Indigenous Knowledge</span>
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
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href={`/admin/programs/${programId}/people`}
                  className="px-6 py-3 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                >
                  Manage People
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

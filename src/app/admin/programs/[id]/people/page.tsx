'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, Users } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  tagline: string | null;
}

interface Connection {
  id: string;
  profile_id: string;
  role: string;
  role_description: string | null;
  profile: Profile;
}

export default function ManageProgramPeoplePage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;

  const [programName, setProgramName] = useState<string>('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New connection form
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('participant');
  const [newRoleDescription, setNewRoleDescription] = useState<string>('');

  const roles = [
    'founder', 'co-founder', 'director', 'coordinator',
    'staff', 'facilitator', 'mentor',
    'participant', 'graduate', 'volunteer',
    'storyteller', 'testimonial'
  ];

  useEffect(() => {
    async function fetchData() {
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

      // Fetch program name
      const { data: program } = await supabase
        .from('registered_services')
        .select('name')
        .eq('id', programId)
        .single();

      if (program) {
        setProgramName(program.name);
      }

      // Fetch existing connections
      const { data: existingConnections } = await supabase
        .from('registered_services_profiles')
        .select(`
          id,
          profile_id,
          role,
          role_description,
          profile:public_profiles!profile_id (
            id,
            full_name,
            slug,
            photo_url,
            tagline
          )
        `)
        .eq('program_id', programId);

      if (existingConnections) {
        setConnections(existingConnections as any);
      }

      // Fetch all available profiles
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, full_name, slug, photo_url, tagline')
        .eq('is_public', true)
        .order('full_name');

      if (profiles) {
        setAvailableProfiles(profiles);
      }

      setLoading(false);
    }

    if (programId) {
      fetchData();
    }
  }, [programId, router]);

  const handleAddConnection = async () => {
    if (!selectedProfile || !newRole) return;

    setSaving(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('registered_services_profiles')
      .insert({
        program_id: programId,
        profile_id: selectedProfile,
        role: newRole,
        role_description: newRoleDescription || null,
      })
      .select(`
        id,
        profile_id,
        role,
        role_description,
        profile:public_profiles!profile_id (
          id,
          full_name,
          slug,
          photo_url,
          tagline
        )
      `)
      .single();

    if (data) {
      setConnections([...connections, data as any]);
      setSelectedProfile('');
      setNewRole('participant');
      setNewRoleDescription('');
    }

    setSaving(false);
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Remove this person from the program?')) return;

    const supabase = createClient();
    await supabase
      .from('registered_services_profiles')
      .delete()
      .eq('id', connectionId);

    setConnections(connections.filter(c => c.id !== connectionId));
  };

  // Filter out already connected profiles
  const connectedProfileIds = new Set(connections.map(c => c.profile_id));
  const unconnectedProfiles = availableProfiles.filter(p => !connectedProfileIds.has(p.id));

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
        <div className="container-justice max-w-4xl">
          <Link href={`/admin/programs/${programId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>

          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8" />
              <h1 className="text-3xl font-black">Manage People</h1>
            </div>
            <p className="text-gray-600 text-lg">{programName}</p>
          </div>

          {/* Add New Connection */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Add Person to Program</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-2">Person</label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black bg-white"
                >
                  <option value="">Select a person...</option>
                  {unconnectedProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black bg-white"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Role Description (optional)</label>
              <input
                type="text"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="e.g., Youth Engagement Coordinator 2023-2025"
                className="w-full px-4 py-3 border-2 border-black"
              />
            </div>

            <button
              onClick={handleAddConnection}
              disabled={!selectedProfile || saving}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {saving ? 'Adding...' : 'Add to Program'}
            </button>
          </div>

          {/* Current Connections */}
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-2 border-black bg-gray-50">
              <h2 className="text-xl font-bold">Connected People ({connections.length})</h2>
            </div>

            {connections.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {connections.map(connection => (
                  <div key={connection.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {connection.profile?.photo_url ? (
                        <img
                          src={connection.profile.photo_url}
                          alt={connection.profile.full_name}
                          className="w-12 h-12 rounded-full border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-500">
                            {connection.profile?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/people/${connection.profile?.slug}`}
                          className="font-bold hover:text-blue-600"
                        >
                          {connection.profile?.full_name}
                        </Link>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-0.5 bg-black text-white text-xs font-bold uppercase">
                            {connection.role}
                          </span>
                          {connection.role_description && (
                            <span className="text-gray-600">{connection.role_description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveConnection(connection.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Remove from program"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No people connected to this program yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const supabase = createClient();

export default function ProfileConnectionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [artProjects, setArtProjects] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Existing connections
  const [linkedArtProjects, setLinkedArtProjects] = useState<any[]>([]);
  const [linkedPrograms, setLinkedPrograms] = useState<any[]>([]);
  const [linkedServices, setLinkedServices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load profile
    const { data: profileData } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    setProfile(profileData);

    // Load all available items
    const { data: artData } = await supabase
      .from('art_innovation')
      .select('id, title, slug, type')
      .order('title');

    const { data: programsData } = await supabase
      .from('community_programs')
      .select('id, name, organization')
      .order('name');

    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, slug')
      .order('name');

    setArtProjects(artData || []);
    setPrograms(programsData || []);
    setServices(servicesData || []);

    // Load existing connections
    const { data: artLinks } = await supabase
      .from('art_innovation_profiles')
      .select(`
        *,
        art_innovation:art_innovation_id (id, title, slug, type)
      `)
      .eq('profile_id', params.id);

    const { data: programLinks } = await supabase
      .from('community_programs_profiles')
      .select(`
        *,
        community_programs:program_id (id, name, organization)
      `)
      .eq('profile_id', params.id);

    const { data: serviceLinks } = await supabase
      .from('services_profiles')
      .select(`
        *,
        services:service_id (id, name, slug)
      `)
      .eq('profile_id', params.id);

    setLinkedArtProjects(artLinks || []);
    setLinkedPrograms(programLinks || []);
    setLinkedServices(serviceLinks || []);
    setLoading(false);
  }

  async function linkToArtProject(artProjectId: string) {
    const role = prompt('Enter role (e.g., "Co-founder", "Artist", "Collaborator"):');
    if (!role) return;

    const { error } = await supabase
      .from('art_innovation_profiles')
      .insert({
        art_innovation_id: artProjectId,
        profile_id: params.id,
        role: role,
        display_order: linkedArtProjects.length
      });

    if (!error) {
      loadData();
    } else {
      alert('Error linking: ' + error.message);
    }
  }

  async function linkToProgram(programId: string) {
    const role = prompt('Enter role (e.g., "Coordinator", "Participant", "Mentor"):');
    if (!role) return;

    const { error } = await supabase
      .from('community_programs_profiles')
      .insert({
        program_id: programId,
        profile_id: params.id,
        role: role,
        display_order: linkedPrograms.length
      });

    if (!error) {
      loadData();
    } else {
      alert('Error linking: ' + error.message);
    }
  }

  async function linkToService(serviceId: string) {
    const role = prompt('Enter role (e.g., "Provider", "Coordinator"):');
    if (!role) return;

    const { error } = await supabase
      .from('services_profiles')
      .insert({
        service_id: serviceId,
        profile_id: params.id,
        role: role,
        display_order: linkedServices.length
      });

    if (!error) {
      loadData();
    } else {
      alert('Error linking: ' + error.message);
    }
  }

  async function removeArtLink(linkId: string) {
    if (!confirm('Remove this connection?')) return;

    const { error } = await supabase
      .from('art_innovation_profiles')
      .delete()
      .eq('id', linkId);

    if (!error) {
      loadData();
    }
  }

  async function removeProgramLink(linkId: string) {
    if (!confirm('Remove this connection?')) return;

    const { error } = await supabase
      .from('community_programs_profiles')
      .delete()
      .eq('id', linkId);

    if (!error) {
      loadData();
    }
  }

  async function removeServiceLink(linkId: string) {
    if (!confirm('Remove this connection?')) return;

    const { error } = await supabase
      .from('services_profiles')
      .delete()
      .eq('id', linkId);

    if (!error) {
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Header */}
      <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-12 border-b-2 border-black">
        <div className="container-justice">
          <Link
            href="/admin/profiles"
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 mb-4 font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profiles
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-2">
            Manage Connections
          </h1>
          <p className="text-lg text-earth-700">
            {profile?.full_name}
          </p>
        </div>
      </section>

      <div className="container-justice py-8 space-y-8">
        {/* Art & Innovation Projects */}
        <section className="border-2 border-black p-6 bg-white">
          <h2 className="text-2xl font-black mb-4">Art & Innovation Projects</h2>

          {linkedArtProjects.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="font-bold text-sm uppercase text-earth-600">Linked Projects</h3>
              {linkedArtProjects.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-sand-50 border border-black">
                  <div>
                    <div className="font-bold">{link.art_innovation.title}</div>
                    <div className="text-sm text-earth-600">{link.role}</div>
                  </div>
                  <button
                    onClick={() => removeArtLink(link.id)}
                    className="p-2 text-red-600 hover:bg-red-50 border border-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm uppercase text-earth-600 mb-2">Add Connection</h3>
            <select
              onChange={(e) => e.target.value && linkToArtProject(e.target.value)}
              className="w-full p-3 border-2 border-black"
              defaultValue=""
            >
              <option value="">Select a project...</option>
              {artProjects
                .filter(proj => !linkedArtProjects.find(link => link.art_innovation_id === proj.id))
                .map((proj: any) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title} ({proj.type})
                  </option>
                ))}
            </select>
          </div>
        </section>

        {/* Community Programs */}
        <section className="border-2 border-black p-6 bg-white">
          <h2 className="text-2xl font-black mb-4">Community Programs</h2>

          {linkedPrograms.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="font-bold text-sm uppercase text-earth-600">Linked Programs</h3>
              {linkedPrograms.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-sand-50 border border-black">
                  <div>
                    <div className="font-bold">{link.community_programs.name}</div>
                    <div className="text-sm text-earth-600">{link.role}</div>
                  </div>
                  <button
                    onClick={() => removeProgramLink(link.id)}
                    className="p-2 text-red-600 hover:bg-red-50 border border-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm uppercase text-earth-600 mb-2">Add Connection</h3>
            <select
              onChange={(e) => e.target.value && linkToProgram(e.target.value)}
              className="w-full p-3 border-2 border-black"
              defaultValue=""
            >
              <option value="">Select a program...</option>
              {programs
                .filter(prog => !linkedPrograms.find(link => link.program_id === prog.id))
                .map((prog: any) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name} - {prog.organization}
                  </option>
                ))}
            </select>
          </div>
        </section>

        {/* Services */}
        <section className="border-2 border-black p-6 bg-white">
          <h2 className="text-2xl font-black mb-4">Services</h2>

          {linkedServices.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="font-bold text-sm uppercase text-earth-600">Linked Services</h3>
              {linkedServices.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-sand-50 border border-black">
                  <div>
                    <div className="font-bold">{link.services.name}</div>
                    <div className="text-sm text-earth-600">{link.role}</div>
                  </div>
                  <button
                    onClick={() => removeServiceLink(link.id)}
                    className="p-2 text-red-600 hover:bg-red-50 border border-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm uppercase text-earth-600 mb-2">Add Connection</h3>
            <select
              onChange={(e) => e.target.value && linkToService(e.target.value)}
              className="w-full p-3 border-2 border-black"
              defaultValue=""
            >
              <option value="">Select a service...</option>
              {services
                .filter(srv => !linkedServices.find(link => link.service_id === srv.id))
                .map((srv: any) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}

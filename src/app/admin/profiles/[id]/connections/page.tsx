'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Sparkles, Video, ExternalLink } from 'lucide-react';

const supabase = createClient();

export default function ProfileConnectionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [artProjects, setArtProjects] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // Existing connections
  const [linkedArtProjects, setLinkedArtProjects] = useState<any[]>([]);
  const [linkedPrograms, setLinkedPrograms] = useState<any[]>([]);
  const [linkedServices, setLinkedServices] = useState<any[]>([]);
  const [linkedOrganizations, setLinkedOrganizations] = useState<any[]>([]);
  const [linkedBlogPosts, setLinkedBlogPosts] = useState<any[]>([]);

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
      .from('registered_services')
      .select('id, name, organization')
      .order('name');

    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, slug')
      .order('name');

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name');

    const { data: postsData } = await supabase
      .from('blog_posts')
      .select('id, title, slug, video_url, audio_url, synced_from_empathy_ledger')
      .order('title');

    setArtProjects(artData || []);
    setPrograms(programsData || []);
    setServices(servicesData || []);
    setOrganizations(orgsData || []);
    setBlogPosts(postsData || []);

    // Load existing connections
    const { data: artLinks } = await supabase
      .from('art_innovation_profiles')
      .select(`
        *,
        art_innovation:art_innovation_id (id, title, slug, type)
      `)
      .eq('profile_id', params.id);

    const { data: programLinks } = await supabase
      .from('registered_services_profiles')
      .select(`
        *,
        registered_services:program_id (id, name, organization)
      `)
      .eq('profile_id', params.id);

    const { data: serviceLinks } = await supabase
      .from('services_profiles')
      .select(`
        *,
        services:service_id (id, name, slug)
      `)
      .eq('profile_id', params.id);

    const { data: orgLinks } = await supabase
      .from('organizations_profiles')
      .select(`
        *,
        organizations:organization_id (id, name, slug)
      `)
      .eq('public_profile_id', params.id);

    const { data: postLinks } = await supabase
      .from('blog_posts_profiles')
      .select(`
        *,
        blog_posts:blog_post_id (id, title, slug, video_url, audio_url, synced_from_empathy_ledger)
      `)
      .eq('public_profile_id', params.id);

    setLinkedArtProjects(artLinks || []);
    setLinkedPrograms(programLinks || []);
    setLinkedServices(serviceLinks || []);
    setLinkedOrganizations(orgLinks || []);
    setLinkedBlogPosts(postLinks || []);
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
      .from('registered_services_profiles')
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
      .from('registered_services_profiles')
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

  async function linkToOrganization(orgId: string) {
    const role = prompt('Enter role (e.g., "Director", "Team Member", "Volunteer"):');
    if (!role) return;

    const { error } = await supabase
      .from('organizations_profiles')
      .insert({
        organization_id: orgId,
        public_profile_id: params.id,
        role: role,
        is_current: true
      });

    if (!error) {
      loadData();
    } else {
      alert('Error linking: ' + error.message);
    }
  }

  async function removeOrganizationLink(linkId: string) {
    if (!confirm('Remove this organization connection?')) return;

    const { error } = await supabase
      .from('organizations_profiles')
      .delete()
      .eq('id', linkId);

    if (!error) {
      loadData();
    }
  }

  async function linkToBlogPost(postId: string) {
    const role = prompt('Enter role (e.g., "Subject", "Author", "Contributor"):');
    if (!role) return;

    const { error } = await supabase
      .from('blog_posts_profiles')
      .insert({
        blog_post_id: postId,
        public_profile_id: params.id,
        role: role,
        is_featured: true
      });

    if (!error) {
      loadData();
    } else {
      alert('Error linking: ' + error.message);
    }
  }

  async function removeBlogPostLink(linkId: string) {
    if (!confirm('Remove this story/transcript connection?')) return;

    const { error } = await supabase
      .from('blog_posts_profiles')
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
                    <div className="font-bold">{link.registered_services.name}</div>
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

        {/* Organizations */}
        <section className="border-2 border-black p-6 bg-white">
          <h2 className="text-2xl font-black mb-4">Organizations</h2>

          {linkedOrganizations.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="font-bold text-sm uppercase text-earth-600">Linked Organizations</h3>
              {linkedOrganizations.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-cyan-50 border border-black">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold">{link.organizations.name}</div>
                      {profile?.synced_from_empathy_ledger && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-600 text-indigo-700 text-xs font-bold">
                          <Sparkles className="h-3 w-3" />
                          AUTO-LINKED
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-earth-600">{link.role}</div>
                    {link.is_current && (
                      <div className="text-xs text-green-600 font-bold mt-1">CURRENT</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/organizations/${link.organizations.slug}`}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 border border-cyan-600"
                      title="View organization"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => removeOrganizationLink(link.id)}
                      className="p-2 text-red-600 hover:bg-red-50 border border-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm uppercase text-earth-600 mb-2">Add Connection</h3>
            <select
              onChange={(e) => e.target.value && linkToOrganization(e.target.value)}
              className="w-full p-3 border-2 border-black"
              defaultValue=""
            >
              <option value="">Select an organization...</option>
              {organizations
                .filter(org => !linkedOrganizations.find(link => link.organization_id === org.id))
                .map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
            </select>
          </div>
        </section>

        {/* Stories/Transcripts */}
        <section className="border-2 border-black p-6 bg-white">
          <h2 className="text-2xl font-black mb-4">Stories & Transcripts</h2>

          {linkedBlogPosts.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="font-bold text-sm uppercase text-earth-600">Linked Content</h3>
              {linkedBlogPosts.map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-violet-50 border border-black">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold">{link.blog_posts.title}</div>
                      {link.blog_posts.synced_from_empathy_ledger && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-600 text-indigo-700 text-xs font-bold">
                          <Sparkles className="h-3 w-3" />
                          AUTO-LINKED
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-earth-600">{link.role}</div>
                    <div className="flex items-center gap-3 mt-2">
                      {link.blog_posts.video_url && (
                        <a
                          href={link.blog_posts.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                        >
                          <Video className="h-3 w-3" />
                          Watch Video
                        </a>
                      )}
                      {link.blog_posts.audio_url && (
                        <a
                          href={link.blog_posts.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                        >
                          🎧 Listen
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.blog_posts.slug && (
                      <Link
                        href={`/stories/${link.blog_posts.slug}`}
                        className="p-2 text-violet-600 hover:bg-violet-50 border border-violet-600"
                        title="View story"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => removeBlogPostLink(link.id)}
                      className="p-2 text-red-600 hover:bg-red-50 border border-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm uppercase text-earth-600 mb-2">Add Connection</h3>
            <select
              onChange={(e) => e.target.value && linkToBlogPost(e.target.value)}
              className="w-full p-3 border-2 border-black"
              defaultValue=""
            >
              <option value="">Select a story/transcript...</option>
              {blogPosts
                .filter(post => !linkedBlogPosts.find(link => link.blog_post_id === post.id))
                .map((post: any) => (
                  <option key={post.id} value={post.id}>
                    {post.title} {post.synced_from_empathy_ledger ? '[EMPATHY LEDGER]' : ''}
                  </option>
                ))}
            </select>
          </div>
        </section>

        {/* Empathy Ledger Sync Status */}
        <section className="border-2 border-black p-6 bg-gradient-to-br from-violet-50 to-indigo-50">
          <h2 className="text-2xl font-black mb-4">Empathy Ledger Sync</h2>

          <div className="space-y-4">
            {profile?.synced_from_empathy_ledger ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-600">
                  <div className="text-2xl">✅</div>
                  <div>
                    <div className="font-bold text-green-800">Synced from Empathy Ledger</div>
                    <div className="text-sm text-green-700">
                      This profile was automatically synced from Empathy Ledger
                    </div>
                  </div>
                </div>

                {profile.empathy_ledger_profile_id && (
                  <div className="p-3 bg-white border border-black">
                    <div className="text-sm text-earth-600 mb-1">Empathy Ledger Profile ID:</div>
                    <div className="font-mono text-sm">{profile.empathy_ledger_profile_id}</div>
                  </div>
                )}

                {profile.last_synced_at && (
                  <div className="p-3 bg-white border border-black">
                    <div className="text-sm text-earth-600 mb-1">Last Synced:</div>
                    <div className="text-sm">{new Date(profile.last_synced_at).toLocaleString()}</div>
                  </div>
                )}

                <div className="p-3 bg-indigo-50 border border-indigo-600">
                  <div className="text-sm text-indigo-900 mb-2">
                    <strong>Auto-linked connections:</strong>
                  </div>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• {linkedOrganizations.length} organization(s)</li>
                    <li>• {linkedBlogPosts.filter((link: any) => link.blog_posts.synced_from_empathy_ledger).length} transcript(s)</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-400">
                <div className="text-2xl">ℹ️</div>
                <div>
                  <div className="font-bold text-gray-800">Not synced from Empathy Ledger</div>
                  <div className="text-sm text-gray-700">
                    This profile was created manually in JusticeHub
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Sparkles, Video, ExternalLink, X, Users, Building2, Briefcase, Palette, FileText } from 'lucide-react';
import RoleSelector, { RoleBadge } from '@/components/admin/RoleSelector';
import { RoleCategory } from '@/types/roles';

const supabase = createClient();

// Connection type configuration
const CONNECTION_TYPES = {
  art: {
    title: 'Art & Innovation Projects',
    icon: Palette,
    color: 'ochre',
    bgColor: 'bg-ochre-50',
    borderColor: 'border-ochre-600',
    roleCategories: ['content', 'leadership', 'community'] as RoleCategory[],
    placeholder: 'Select a project...',
  },
  program: {
    title: 'Community Programs',
    icon: Users,
    color: 'eucalyptus',
    bgColor: 'bg-eucalyptus-50',
    borderColor: 'border-eucalyptus-600',
    roleCategories: ['leadership', 'staff', 'community'] as RoleCategory[],
    placeholder: 'Select a program...',
  },
  service: {
    title: 'Services',
    icon: Briefcase,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-600',
    roleCategories: ['leadership', 'staff'] as RoleCategory[],
    placeholder: 'Select a service...',
  },
  organization: {
    title: 'Organizations',
    icon: Building2,
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-600',
    roleCategories: ['leadership', 'staff', 'supporting'] as RoleCategory[],
    placeholder: 'Select an organization...',
  },
  story: {
    title: 'Stories & Transcripts',
    icon: FileText,
    color: 'violet',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-600',
    roleCategories: ['content', 'testimonial'] as RoleCategory[],
    placeholder: 'Select a story...',
  },
};

type ConnectionType = keyof typeof CONNECTION_TYPES;

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, role: string, roleDescription: string) => void;
  type: ConnectionType;
  items: any[];
  linkedItemIds: string[];
  saving: boolean;
}

function AddConnectionModal({ isOpen, onClose, onSave, type, items, linkedItemIds, saving }: AddConnectionModalProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [role, setRole] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  const config = CONNECTION_TYPES[type];
  const availableItems = items.filter(item => !linkedItemIds.includes(item.id));

  const handleSave = () => {
    if (selectedItemId && role) {
      onSave(selectedItemId, role, roleDescription);
      // Reset form
      setSelectedItemId('');
      setRole('');
      setRoleDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full">
        <div className="p-4 border-b-2 border-black flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            Add to {config.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">
              Select {type === 'story' ? 'Story' : type.charAt(0).toUpperCase() + type.slice(1)} *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full p-3 border-2 border-black"
            >
              <option value="">{config.placeholder}</option>
              {availableItems.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.title || item.name}
                  {item.type && ` (${item.type})`}
                  {item.organization && ` - ${item.organization}`}
                  {item.synced_from_empathy_ledger && ' [EMPATHY LEDGER]'}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <RoleSelector
            value={role}
            onChange={setRole}
            label="Role"
            required
            allowCustom
            filterCategories={config.roleCategories}
            helperText="Select a standard role or enter a custom one"
          />

          {/* Role Description (optional) */}
          <div>
            <label className="block text-sm font-bold mb-2">Role Description (optional)</label>
            <input
              type="text"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              className="w-full p-3 border-2 border-black"
              placeholder="e.g., Lead coordinator 2023-2025"
            />
            <p className="text-sm text-gray-500 mt-1">Add context or timeframe for this role</p>
          </div>
        </div>

        <div className="p-4 border-t-2 border-black flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-black font-bold hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedItemId || !role || saving}
            className="px-6 py-2 bg-black text-white border-2 border-black font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileConnectionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Available items
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

  // Modal state
  const [activeModal, setActiveModal] = useState<ConnectionType | null>(null);

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
      .select(`*, art_innovation:art_innovation_id (id, title, slug, type)`)
      .eq('profile_id', params.id);

    const { data: programLinks } = await supabase
      .from('registered_services_profiles')
      .select(`*, registered_services:program_id (id, name, organization)`)
      .eq('profile_id', params.id);

    const { data: serviceLinks } = await supabase
      .from('services_profiles')
      .select(`*, services:service_id (id, name, slug)`)
      .eq('profile_id', params.id);

    const { data: orgLinks } = await supabase
      .from('organizations_profiles')
      .select(`*, organizations:organization_id (id, name, slug)`)
      .eq('public_profile_id', params.id);

    const { data: postLinks } = await supabase
      .from('blog_posts_profiles')
      .select(`*, blog_posts:blog_post_id (id, title, slug, video_url, audio_url, synced_from_empathy_ledger)`)
      .eq('public_profile_id', params.id);

    setLinkedArtProjects(artLinks || []);
    setLinkedPrograms(programLinks || []);
    setLinkedServices(serviceLinks || []);
    setLinkedOrganizations(orgLinks || []);
    setLinkedBlogPosts(postLinks || []);
    setLoading(false);
  }

  // Add connection handlers
  async function addConnection(type: ConnectionType, itemId: string, role: string, roleDescription: string) {
    setSaving(true);
    let error;

    switch (type) {
      case 'art':
        ({ error } = await supabase.from('art_innovation_profiles').insert({
          art_innovation_id: itemId,
          profile_id: params.id,
          role,
          role_description: roleDescription || null,
          display_order: linkedArtProjects.length
        }));
        break;
      case 'program':
        ({ error } = await supabase.from('registered_services_profiles').insert({
          program_id: itemId,
          profile_id: params.id,
          role,
          role_description: roleDescription || null,
          display_order: linkedPrograms.length
        }));
        break;
      case 'service':
        ({ error } = await supabase.from('services_profiles').insert({
          service_id: itemId,
          profile_id: params.id,
          role,
          role_description: roleDescription || null,
          display_order: linkedServices.length
        }));
        break;
      case 'organization':
        ({ error } = await supabase.from('organizations_profiles').insert({
          organization_id: itemId,
          public_profile_id: params.id,
          role,
          role_description: roleDescription || null,
          is_current: true
        }));
        break;
      case 'story':
        ({ error } = await supabase.from('blog_posts_profiles').insert({
          blog_post_id: itemId,
          public_profile_id: params.id,
          role,
          role_description: roleDescription || null,
          is_featured: true
        }));
        break;
    }

    if (!error) {
      setActiveModal(null);
      loadData();
    } else {
      alert('Error adding connection: ' + error.message);
    }
    setSaving(false);
  }

  // Remove connection handlers
  async function removeConnection(type: ConnectionType, linkId: string) {
    if (!confirm('Remove this connection?')) return;

    let error;
    switch (type) {
      case 'art':
        ({ error } = await supabase.from('art_innovation_profiles').delete().eq('id', linkId));
        break;
      case 'program':
        ({ error } = await supabase.from('registered_services_profiles').delete().eq('id', linkId));
        break;
      case 'service':
        ({ error } = await supabase.from('services_profiles').delete().eq('id', linkId));
        break;
      case 'organization':
        ({ error } = await supabase.from('organizations_profiles').delete().eq('id', linkId));
        break;
      case 'story':
        ({ error } = await supabase.from('blog_posts_profiles').delete().eq('id', linkId));
        break;
    }

    if (!error) loadData();
  }

  // Get linked item IDs helper
  function getLinkedItemIds(type: ConnectionType): string[] {
    switch (type) {
      case 'art': return linkedArtProjects.map(l => l.art_innovation_id);
      case 'program': return linkedPrograms.map(l => l.program_id);
      case 'service': return linkedServices.map(l => l.service_id);
      case 'organization': return linkedOrganizations.map(l => l.organization_id);
      case 'story': return linkedBlogPosts.map(l => l.blog_post_id);
    }
  }

  // Get items helper
  function getItems(type: ConnectionType): any[] {
    switch (type) {
      case 'art': return artProjects;
      case 'program': return programs;
      case 'service': return services;
      case 'organization': return organizations;
      case 'story': return blogPosts;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-black">Loading...</div>
      </div>
    );
  }

  // Connection summary stats
  const totalConnections = linkedArtProjects.length + linkedPrograms.length +
    linkedServices.length + linkedOrganizations.length + linkedBlogPosts.length;

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Manage Connections
              </h1>
              <p className="text-lg text-earth-700">
                {profile?.full_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black">{totalConnections}</div>
              <div className="text-sm text-earth-600 font-bold uppercase">Total Connections</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-justice py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { type: 'art' as ConnectionType, count: linkedArtProjects.length, label: 'Art Projects' },
            { type: 'program' as ConnectionType, count: linkedPrograms.length, label: 'Programs' },
            { type: 'service' as ConnectionType, count: linkedServices.length, label: 'Services' },
            { type: 'organization' as ConnectionType, count: linkedOrganizations.length, label: 'Organizations' },
            { type: 'story' as ConnectionType, count: linkedBlogPosts.length, label: 'Stories' },
          ].map(({ type, count, label }) => {
            const config = CONNECTION_TYPES[type];
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setActiveModal(type)}
                className={`p-4 border-2 border-black ${config.bgColor} hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow text-left`}
              >
                <Icon className="h-6 w-6 mb-2" />
                <div className="text-2xl font-black">{count}</div>
                <div className="text-sm font-bold">{label}</div>
              </button>
            );
          })}
        </div>

        {/* Art & Innovation Projects */}
        <ConnectionSection
          type="art"
          links={linkedArtProjects}
          onAdd={() => setActiveModal('art')}
          onRemove={(id) => removeConnection('art', id)}
          getItemName={(link) => link.art_innovation?.title}
          getItemType={(link) => link.art_innovation?.type}
        />

        {/* Community Programs */}
        <ConnectionSection
          type="program"
          links={linkedPrograms}
          onAdd={() => setActiveModal('program')}
          onRemove={(id) => removeConnection('program', id)}
          getItemName={(link) => link.registered_services?.name}
          getItemSubtext={(link) => link.registered_services?.organization}
        />

        {/* Services */}
        <ConnectionSection
          type="service"
          links={linkedServices}
          onAdd={() => setActiveModal('service')}
          onRemove={(id) => removeConnection('service', id)}
          getItemName={(link) => link.services?.name}
        />

        {/* Organizations */}
        <ConnectionSection
          type="organization"
          links={linkedOrganizations}
          onAdd={() => setActiveModal('organization')}
          onRemove={(id) => removeConnection('organization', id)}
          getItemName={(link) => link.organizations?.name}
          getItemLink={(link) => `/admin/organizations/${link.organizations?.slug}`}
          showCurrent={(link) => link.is_current}
          showAutoLinked={profile?.synced_from_empathy_ledger}
        />

        {/* Stories & Transcripts */}
        <ConnectionSection
          type="story"
          links={linkedBlogPosts}
          onAdd={() => setActiveModal('story')}
          onRemove={(id) => removeConnection('story', id)}
          getItemName={(link) => link.blog_posts?.title}
          getItemLink={(link) => link.blog_posts?.slug ? `/stories/${link.blog_posts.slug}` : undefined}
          showAutoLinked={(link) => link.blog_posts?.synced_from_empathy_ledger}
          extraContent={(link) => (
            <div className="flex items-center gap-3 mt-2">
              {link.blog_posts?.video_url && (
                <a href={link.blog_posts.video_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                  <Video className="h-3 w-3" /> Watch
                </a>
              )}
              {link.blog_posts?.audio_url && (
                <a href={link.blog_posts.audio_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                  🎧 Listen
                </a>
              )}
            </div>
          )}
        />

        {/* Empathy Ledger Sync Status */}
        <section className="border-2 border-black p-6 bg-gradient-to-br from-violet-50 to-indigo-50">
          <h2 className="text-2xl font-black mb-4">Empathy Ledger Sync</h2>
          {profile?.synced_from_empathy_ledger ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-600">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-bold text-green-800">Synced from Empathy Ledger</div>
                  <div className="text-sm text-green-700">This profile was automatically synced</div>
                </div>
              </div>
              {profile.empathy_ledger_profile_id && (
                <div className="p-3 bg-white border border-black">
                  <div className="text-sm text-earth-600 mb-1">Empathy Ledger Profile ID:</div>
                  <div className="font-mono text-sm">{profile.empathy_ledger_profile_id}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-400">
              <div className="text-2xl">ℹ️</div>
              <div>
                <div className="font-bold text-gray-800">Not synced from Empathy Ledger</div>
                <div className="text-sm text-gray-700">This profile was created manually in JusticeHub</div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Add Connection Modal */}
      {activeModal && (
        <AddConnectionModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={(itemId, role, roleDescription) => addConnection(activeModal, itemId, role, roleDescription)}
          type={activeModal}
          items={getItems(activeModal)}
          linkedItemIds={getLinkedItemIds(activeModal)}
          saving={saving}
        />
      )}
    </div>
  );
}

// Reusable Connection Section Component
function ConnectionSection({
  type,
  links,
  onAdd,
  onRemove,
  getItemName,
  getItemType,
  getItemSubtext,
  getItemLink,
  showCurrent,
  showAutoLinked,
  extraContent,
}: {
  type: ConnectionType;
  links: any[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  getItemName: (link: any) => string;
  getItemType?: (link: any) => string;
  getItemSubtext?: (link: any) => string;
  getItemLink?: (link: any) => string | undefined;
  showCurrent?: (link: any) => boolean;
  showAutoLinked?: boolean | ((link: any) => boolean);
  extraContent?: (link: any) => React.ReactNode;
}) {
  const config = CONNECTION_TYPES[type];
  const Icon = config.icon;

  return (
    <section className="border-2 border-black p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <Icon className="h-6 w-6" />
          {config.title}
        </h2>
        <button
          onClick={onAdd}
          className={`px-4 py-2 ${config.bgColor} border-2 border-black font-bold hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow flex items-center gap-2`}
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link: any) => {
            const isAutoLinked = typeof showAutoLinked === 'function' ? showAutoLinked(link) : showAutoLinked;
            const isCurrent = showCurrent?.(link);
            const itemLink = getItemLink?.(link);

            return (
              <div key={link.id} className={`flex items-center justify-between p-3 ${config.bgColor} border border-black`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="font-bold">{getItemName(link)}</div>
                    {getItemType?.(link) && (
                      <span className="text-xs px-2 py-0.5 bg-white border border-black">
                        {getItemType(link)}
                      </span>
                    )}
                    {isAutoLinked && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-600 text-indigo-700 text-xs font-bold">
                        <Sparkles className="h-3 w-3" />
                        AUTO-LINKED
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border border-green-600 font-bold">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={link.role} size="sm" />
                    {link.role_description && (
                      <span className="text-sm text-earth-600">— {link.role_description}</span>
                    )}
                  </div>
                  {getItemSubtext?.(link) && (
                    <div className="text-sm text-earth-600 mt-1">{getItemSubtext(link)}</div>
                  )}
                  {extraContent?.(link)}
                </div>
                <div className="flex items-center gap-2">
                  {itemLink && (
                    <Link href={itemLink} className={`p-2 text-${config.color}-600 hover:bg-white border ${config.borderColor}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => onRemove(link.id)}
                    className="p-2 text-red-600 hover:bg-red-50 border border-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-earth-500">
          No connections yet. Click "Add" to connect this person to {config.title.toLowerCase()}.
        </div>
      )}
    </section>
  );
}

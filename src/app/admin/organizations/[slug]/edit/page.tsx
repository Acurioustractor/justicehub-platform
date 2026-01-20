'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowLeft, Save, Building2, Image as ImageIcon, Video, BarChart3,
  Users, BookOpen, Link as LinkIcon, Loader2, Plus, Trash2, Star, Upload, X
} from 'lucide-react';

type Tab = 'details' | 'photos' | 'videos' | 'metrics' | 'storytellers' | 'links';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  logo_url: string;
  latitude: number;
  longitude: number;
}

interface PartnerPhoto {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  photo_type: 'card_thumbnail' | 'hero_banner' | 'gallery' | 'team' | 'location' | 'program';
  is_featured: boolean;
  display_order: number;
}

// Photo type definitions with descriptions
const PHOTO_TYPES = {
  card_thumbnail: { label: 'Card Thumbnail', description: 'Shows on organization cards in listings', badgeClass: 'bg-ochre-600' },
  hero_banner: { label: 'Hero Banner', description: 'Large banner on organization detail page', badgeClass: 'bg-blue-600' },
  gallery: { label: 'Gallery', description: 'General photo gallery on org page', badgeClass: 'bg-green-600' },
  team: { label: 'Team/People', description: 'Photos of team members or community', badgeClass: 'bg-purple-600' },
  location: { label: 'Location/Site', description: 'Photos of buildings, land, or facilities', badgeClass: 'bg-cyan-600' },
  program: { label: 'Programs', description: 'Photos from programs and activities', badgeClass: 'bg-pink-600' },
} as const;

interface PartnerVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  platform: 'youtube' | 'vimeo' | 'wistia' | 'other';
  video_type: 'documentary' | 'interview' | 'promotional' | 'training' | 'event' | 'music_video';
  thumbnail_url: string;
  is_featured: boolean;
  video_placement?: 'featured' | 'gallery' | 'testimonial' | 'program';
}

// Video placement definitions
const VIDEO_PLACEMENTS = {
  featured: { label: 'Featured Video', description: 'Shows prominently at top of org page', badgeClass: 'bg-ochre-600' },
  gallery: { label: 'Video Gallery', description: 'General video gallery section', badgeClass: 'bg-blue-600' },
  testimonial: { label: 'Testimonial', description: 'Community voices and stories', badgeClass: 'bg-purple-600' },
  program: { label: 'Program Video', description: 'Program/activity documentation', badgeClass: 'bg-green-600' },
} as const;

// Helper to extract video thumbnail
function getVideoThumbnail(url: string, platform: string): string | null {
  if (platform === 'youtube') {
    // Extract YouTube video ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
  }
  if (platform === 'vimeo') {
    // Vimeo requires API call for thumbnail, return placeholder
    return null;
  }
  return null;
}

interface PartnerMetric {
  id: string;
  metric_name: string;
  metric_value: string;
  metric_context: string;
  icon: string;
  display_order: number;
  is_featured: boolean;
}

interface PartnerStoryteller {
  id: string;
  display_name: string;
  role_at_org: string;
  bio_excerpt: string;
  quote: string;
  avatar_url: string;
  is_featured: boolean;
  display_order: number;
}

interface PartnerLink {
  id: string;
  title: string;
  url: string;
  link_type: 'website' | 'social' | 'news' | 'research' | 'documentary' | 'podcast';
  description: string;
  display_order: number;
}

export default function OrganizationEditPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [org, setOrg] = useState<Organization | null>(null);
  const [photos, setPhotos] = useState<PartnerPhoto[]>([]);
  const [videos, setVideos] = useState<PartnerVideo[]>([]);
  const [metrics, setMetrics] = useState<PartnerMetric[]>([]);
  const [storytellers, setStorytellers] = useState<PartnerStoryteller[]>([]);
  const [links, setLinks] = useState<PartnerLink[]>([]);

  // Form states for new items
  const [newPhoto, setNewPhoto] = useState({ title: '', photo_url: '', photo_type: 'gallery' as keyof typeof PHOTO_TYPES, description: '' });
  const [newVideo, setNewVideo] = useState({ title: '', video_url: '', platform: 'youtube', video_type: 'documentary', description: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [newMetric, setNewMetric] = useState({ metric_name: '', metric_value: '', metric_context: '', icon: 'TrendingUp' });
  const [newStoryteller, setNewStoryteller] = useState({ display_name: '', role_at_org: '', bio_excerpt: '', quote: '' });
  const [newLink, setNewLink] = useState({ title: '', url: '', link_type: 'website', description: '' });

  useEffect(() => {
    loadOrganization();
  }, [params.slug]);

  async function loadOrganization() {
    setLoading(true);
    try {
      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (orgError) throw orgError;
      setOrg(orgData);

      // Fetch related data in parallel
      const [photosRes, videosRes, metricsRes, storytellersRes, linksRes] = await Promise.all([
        supabase.from('partner_photos').select('*').eq('organization_id', orgData.id).order('display_order'),
        supabase.from('partner_videos').select('*').eq('organization_id', orgData.id).order('created_at', { ascending: false }),
        supabase.from('partner_impact_metrics').select('*').eq('organization_id', orgData.id).order('display_order'),
        supabase.from('partner_storytellers').select('*').eq('organization_id', orgData.id).order('display_order'),
        supabase.from('partner_external_links').select('*').eq('organization_id', orgData.id).order('display_order'),
      ]);

      setPhotos(photosRes.data || []);
      setVideos(videosRes.data || []);
      setMetrics(metricsRes.data || []);
      setStorytellers(storytellersRes.data || []);
      setLinks(linksRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveOrganization() {
    if (!org) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: org.name,
          description: org.description,
          type: org.type,
          location: org.location,
          website: org.website,
          email: org.email,
          phone: org.phone,
          logo_url: org.logo_url,
          latitude: org.latitude,
          longitude: org.longitude,
        })
        .eq('id', org.id);

      if (error) throw error;
      setSuccess('Organization saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // File upload function
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'organizations');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Set the uploaded URL in the form
      setNewPhoto({ ...newPhoto, photo_url: result.url, title: newPhoto.title || result.altText });
      setUploadProgress('Upload complete!');
      setSuccess('Image uploaded successfully! Click "Add Photo" to save it.');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  }

  // Helper function for API calls
  async function apiCall(method: 'POST' | 'DELETE' | 'PATCH', body?: any, params?: Record<string, string>) {
    const url = new URL('/api/admin/partner-content', window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await fetch(url.toString(), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'API request failed');
    return result;
  }

  // Photo functions
  async function addPhoto() {
    if (!org || !newPhoto.photo_url) return;
    try {
      await apiCall('POST', {
        contentType: 'photos',
        organizationId: org.id,
        data: {
          title: newPhoto.title,
          photo_url: newPhoto.photo_url,
          photo_type: newPhoto.photo_type,
          description: newPhoto.description,
          display_order: photos.length,
        },
      });
      setNewPhoto({ title: '', photo_url: '', photo_type: 'gallery', description: '' });
      loadOrganization();
      setSuccess('Photo added!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return;
    try {
      await apiCall('DELETE', undefined, { contentType: 'photos', id });
      setPhotos(photos.filter(p => p.id !== id));
      setSuccess('Photo deleted!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setFeaturedPhoto(id: string) {
    if (!org) return;
    try {
      await apiCall('PATCH', {
        contentType: 'photos',
        id,
        organizationId: org.id,
        clearFeatured: true,
        data: { is_featured: true },
      });
      loadOrganization();
      setSuccess('Featured photo updated!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updatePhotoType(id: string, newType: string) {
    try {
      await apiCall('PATCH', {
        contentType: 'photos',
        id,
        data: { photo_type: newType },
      });
      loadOrganization();
      setSuccess('Photo assignment updated!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Video functions
  async function addVideo() {
    if (!org || !newVideo.video_url) return;
    try {
      await apiCall('POST', {
        contentType: 'videos',
        organizationId: org.id,
        data: {
          title: newVideo.title,
          video_url: newVideo.video_url,
          platform: newVideo.platform,
          video_type: newVideo.video_type,
          description: newVideo.description,
        },
      });
      setNewVideo({ title: '', video_url: '', platform: 'youtube', video_type: 'documentary', description: '' });
      loadOrganization();
      setSuccess('Video added!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('Delete this video?')) return;
    try {
      await apiCall('DELETE', undefined, { contentType: 'videos', id });
      setVideos(videos.filter(v => v.id !== id));
      setSuccess('Video deleted!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setFeaturedVideo(id: string) {
    if (!org) return;
    try {
      // Unfeatured all videos first
      await apiCall('PATCH', {
        contentType: 'videos',
        id,
        organizationId: org.id,
        clearFeatured: true,
        data: { is_featured: true, video_placement: 'featured' },
      });
      loadOrganization();
      setSuccess('Featured video updated!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function updateVideoPlacement(id: string, newPlacement: string) {
    try {
      await apiCall('PATCH', {
        contentType: 'videos',
        id,
        data: { video_placement: newPlacement },
      });
      loadOrganization();
      setSuccess('Video placement updated!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Metric functions
  async function addMetric() {
    if (!org || !newMetric.metric_name) return;
    try {
      await apiCall('POST', {
        contentType: 'metrics',
        organizationId: org.id,
        data: {
          ...newMetric,
          display_order: metrics.length,
        },
      });
      setNewMetric({ metric_name: '', metric_value: '', metric_context: '', icon: 'TrendingUp' });
      loadOrganization();
      setSuccess('Metric added!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteMetric(id: string) {
    if (!confirm('Delete this metric?')) return;
    try {
      await apiCall('DELETE', undefined, { contentType: 'metrics', id });
      setMetrics(metrics.filter(m => m.id !== id));
      setSuccess('Metric deleted!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Storyteller functions
  async function addStoryteller() {
    if (!org || !newStoryteller.display_name) return;
    try {
      await apiCall('POST', {
        contentType: 'storytellers',
        organizationId: org.id,
        data: {
          ...newStoryteller,
          display_order: storytellers.length,
          is_featured: true,
        },
      });
      setNewStoryteller({ display_name: '', role_at_org: '', bio_excerpt: '', quote: '' });
      loadOrganization();
      setSuccess('Storyteller added!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteStoryteller(id: string) {
    if (!confirm('Delete this storyteller?')) return;
    try {
      await apiCall('DELETE', undefined, { contentType: 'storytellers', id });
      setStorytellers(storytellers.filter(s => s.id !== id));
      setSuccess('Storyteller deleted!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Link functions
  async function addLink() {
    if (!org || !newLink.url) return;
    try {
      await apiCall('POST', {
        contentType: 'links',
        organizationId: org.id,
        data: {
          ...newLink,
          display_order: links.length,
        },
      });
      setNewLink({ title: '', url: '', link_type: 'website', description: '' });
      loadOrganization();
      setSuccess('Link added!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteLink(id: string) {
    if (!confirm('Delete this link?')) return;
    try {
      await apiCall('DELETE', undefined, { contentType: 'links', id });
      setLinks(links.filter(l => l.id !== id));
      setSuccess('Link deleted!');
    } catch (err: any) {
      setError(err.message);
    }
  }

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'details', label: 'Details', icon: Building2 },
    { id: 'photos', label: 'Photos', icon: ImageIcon, count: photos.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'metrics', label: 'Impact', icon: BarChart3, count: metrics.length },
    { id: 'storytellers', label: 'People', icon: Users, count: storytellers.length },
    { id: 'links', label: 'Links', icon: LinkIcon, count: links.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Organization not found</h1>
          <Link href="/admin/organizations" className="text-blue-600 hover:underline">
            Back to organizations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b-2 border-black py-6 header-offset">
        <div className="container-justice">
          <Link
            href={`/admin/organizations/${params.slug}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {org.name}
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">Edit: {org.name}</h1>
              <p className="text-gray-600 mt-1">Manage organization details, photos, videos, and more</p>
            </div>
            <button
              onClick={saveOrganization}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-600 text-red-700 font-bold flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-600 text-green-700 font-bold flex items-center justify-between">
              {success}
              <button onClick={() => setSuccess(null)}><X className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b-2 border-black">
        <div className="container-justice">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
                  activeTab === tab.id
                    ? 'border-ochre-600 text-ochre-600'
                    : 'border-transparent text-gray-600 hover:text-black'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-2 py-0.5 bg-gray-100 text-xs rounded">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-justice py-8">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white border-2 border-black p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Organization Name</label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Type</label>
                <select
                  value={org.type || ''}
                  onChange={(e) => setOrg({ ...org, type: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                >
                  <option value="">Select type</option>
                  <option value="basecamp">Basecamp Partner</option>
                  <option value="community_org">Community Organization</option>
                  <option value="research">Research Institution</option>
                  <option value="government">Government Agency</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Description</label>
              <textarea
                value={org.description || ''}
                onChange={(e) => setOrg({ ...org, description: e.target.value })}
                rows={5}
                className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Location</label>
                <input
                  type="text"
                  value={org.location || ''}
                  onChange={(e) => setOrg({ ...org, location: e.target.value })}
                  placeholder="e.g., Alice Springs, NT"
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Website</label>
                <input
                  type="url"
                  value={org.website || ''}
                  onChange={(e) => setOrg({ ...org, website: e.target.value })}
                  placeholder="https://"
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={org.email || ''}
                  onChange={(e) => setOrg({ ...org, email: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Phone</label>
                <input
                  type="tel"
                  value={org.phone || ''}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Logo URL</label>
              <input
                type="url"
                value={org.logo_url || ''}
                onChange={(e) => setOrg({ ...org, logo_url: e.target.value })}
                placeholder="https://..."
                className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
              />
              {org.logo_url && (
                <img src={org.logo_url} alt="Logo preview" className="mt-2 h-16 object-contain" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={org.latitude || ''}
                  onChange={(e) => setOrg({ ...org, latitude: parseFloat(e.target.value) })}
                  placeholder="-23.698"
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={org.longitude || ''}
                  onChange={(e) => setOrg({ ...org, longitude: parseFloat(e.target.value) })}
                  placeholder="133.880"
                  className="w-full border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-ochre-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* Add Photo Form */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">Add Photo</h3>

              {/* File Upload Section */}
              <div className="mb-6 p-4 border-2 border-dashed border-gray-300 bg-gray-50 rounded">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="font-bold mb-2">Upload from your computer</p>
                  <p className="text-sm text-gray-600 mb-4">JPEG, PNG, GIF, or WebP (max 5MB)</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-ochre-600 text-white font-bold cursor-pointer hover:bg-ochre-700 disabled:opacity-50">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {uploadProgress}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose File
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preview uploaded image */}
              {newPhoto.photo_url && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-600">
                  <p className="font-bold text-green-700 mb-2">Image ready to add:</p>
                  <div className="flex items-start gap-4">
                    <img
                      src={newPhoto.photo_url}
                      alt="Preview"
                      className="w-32 h-24 object-cover border-2 border-black"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 break-all">{newPhoto.photo_url}</p>
                      <button
                        onClick={() => setNewPhoto({ ...newPhoto, photo_url: '' })}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Photo title"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="border-2 border-black p-3"
                />
                <select
                  value={newPhoto.photo_type}
                  onChange={(e) => setNewPhoto({ ...newPhoto, photo_type: e.target.value as keyof typeof PHOTO_TYPES })}
                  className="border-2 border-black p-3"
                >
                  {Object.entries(PHOTO_TYPES).map(([key, { label, description }]) => (
                    <option key={key} value={key}>{label} - {description}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Or paste an external URL:</p>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={newPhoto.photo_url}
                  onChange={(e) => setNewPhoto({ ...newPhoto, photo_url: e.target.value })}
                  className="w-full border-2 border-black p-3"
                />
              </div>

              <textarea
                placeholder="Description (optional)"
                value={newPhoto.description}
                onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
                rows={2}
              />
              <button
                onClick={addPhoto}
                disabled={!newPhoto.photo_url}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-ochre-600 text-white font-bold hover:bg-ochre-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add Photo
              </button>
            </div>

            {/* Photo Placement Preview */}
            {photos.length > 0 && (
              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-bold text-lg mb-4">Photo Placement Preview</h3>
                <p className="text-sm text-gray-600 mb-4">See where your photos will appear on the site:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card Thumbnail Preview */}
                  <div className="border-2 border-ochre-600 p-4 bg-ochre-50">
                    <h4 className="font-bold text-ochre-800 mb-2">Card Thumbnail</h4>
                    <p className="text-xs text-ochre-600 mb-3">Organization listings & search results</p>
                    {photos.find(p => p.photo_type === 'card_thumbnail') ? (
                      <img
                        src={photos.find(p => p.photo_type === 'card_thumbnail')?.photo_url}
                        className="w-full h-32 object-cover border-2 border-black"
                        alt="Card thumbnail"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-sm">
                        No photo assigned
                      </div>
                    )}
                  </div>

                  {/* Hero Banner Preview */}
                  <div className="border-2 border-blue-600 p-4 bg-blue-50">
                    <h4 className="font-bold text-blue-800 mb-2">Hero Banner</h4>
                    <p className="text-xs text-blue-600 mb-3">Large banner on detail page</p>
                    {photos.find(p => p.photo_type === 'hero_banner') ? (
                      <img
                        src={photos.find(p => p.photo_type === 'hero_banner')?.photo_url}
                        className="w-full h-32 object-cover border-2 border-black"
                        alt="Hero banner"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-sm">
                        No photo assigned
                      </div>
                    )}
                  </div>

                  {/* Gallery Preview */}
                  <div className="border-2 border-green-600 p-4 bg-green-50">
                    <h4 className="font-bold text-green-800 mb-2">Gallery</h4>
                    <p className="text-xs text-green-600 mb-3">{photos.filter(p => p.photo_type === 'gallery').length} photos in gallery</p>
                    <div className="grid grid-cols-3 gap-1">
                      {photos.filter(p => p.photo_type === 'gallery').slice(0, 6).map(p => (
                        <img key={p.id} src={p.photo_url} className="w-full h-10 object-cover" alt="" />
                      ))}
                      {photos.filter(p => p.photo_type === 'gallery').length === 0 && (
                        <div className="col-span-3 h-20 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-xs">
                          No gallery photos
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Grid */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">All Photos ({photos.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => {
                  const typeInfo = PHOTO_TYPES[photo.photo_type as keyof typeof PHOTO_TYPES] || PHOTO_TYPES.gallery;
                  return (
                    <div key={photo.id} className="bg-gray-50 border-2 border-black overflow-hidden">
                      <div className="relative h-40">
                        <img
                          src={photo.photo_url}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                        {photo.is_featured && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-ochre-600 text-white text-xs font-bold">
                            FEATURED
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 px-2 py-1 ${typeInfo.badgeClass} text-white text-xs font-bold`}>
                          {typeInfo.label}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-sm mb-2">{photo.title || 'Untitled'}</h4>

                        {/* Assignment Dropdown */}
                        <div className="mb-3">
                          <label className="block text-xs font-bold text-gray-600 mb-1">Assign to:</label>
                          <select
                            value={photo.photo_type}
                            onChange={(e) => updatePhotoType(photo.id, e.target.value)}
                            className="w-full border-2 border-black p-2 text-sm bg-white"
                          >
                            {Object.entries(PHOTO_TYPES).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setFeaturedPhoto(photo.id)}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 border-2 text-xs font-bold ${
                              photo.is_featured
                                ? 'border-ochre-600 bg-ochre-600 text-white'
                                : 'border-ochre-600 text-ochre-600 hover:bg-ochre-600 hover:text-white'
                            }`}
                          >
                            <Star className="h-3 w-3" /> {photo.is_featured ? 'Featured' : 'Set Featured'}
                          </button>
                          <button
                            onClick={() => deletePhoto(photo.id)}
                            className="px-2 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {photos.length === 0 && (
                <div className="text-center py-12 text-gray-500">No photos yet. Add one above.</div>
              )}
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Add Video Form */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">Add Video</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Video title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="border-2 border-black p-3"
                />
                <select
                  value={newVideo.platform}
                  onChange={(e) => setNewVideo({ ...newVideo, platform: e.target.value as any })}
                  className="border-2 border-black p-3"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="wistia">Wistia</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input
                type="url"
                placeholder="Video URL (e.g., https://www.youtube.com/watch?v=...)"
                value={newVideo.video_url}
                onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
              />
              <select
                value={newVideo.video_type}
                onChange={(e) => setNewVideo({ ...newVideo, video_type: e.target.value as any })}
                className="w-full border-2 border-black p-3 mt-4"
              >
                <option value="documentary">Documentary</option>
                <option value="interview">Interview</option>
                <option value="promotional">Promotional</option>
                <option value="training">Training</option>
                <option value="event">Event</option>
                <option value="music_video">Music Video</option>
              </select>
              <textarea
                placeholder="Description (optional)"
                value={newVideo.description}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
                rows={2}
              />
              <button
                onClick={addVideo}
                disabled={!newVideo.video_url}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add Video
              </button>
            </div>

            {/* Video Placement Preview */}
            {videos.length > 0 && (
              <div className="bg-white border-2 border-black p-6">
                <h3 className="font-bold text-lg mb-4">Video Placement Preview</h3>
                <p className="text-sm text-gray-600 mb-4">See where your videos will appear on the site:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Featured Video Preview */}
                  <div className="border-2 border-ochre-600 p-4 bg-ochre-50">
                    <h4 className="font-bold text-ochre-800 mb-2">Featured Video</h4>
                    <p className="text-xs text-ochre-600 mb-3">Prominent display at top of org page</p>
                    {videos.find(v => v.is_featured || v.video_placement === 'featured') ? (
                      <div>
                        {(() => {
                          const featuredVideo = videos.find(v => v.is_featured || v.video_placement === 'featured');
                          const thumb = featuredVideo ? getVideoThumbnail(featuredVideo.video_url, featuredVideo.platform) : null;
                          return (
                            <div className="relative">
                              {thumb ? (
                                <img src={thumb} className="w-full h-32 object-cover border-2 border-black" alt="Featured video" />
                              ) : (
                                <div className="w-full h-32 bg-gray-800 flex items-center justify-center border-2 border-black">
                                  <Video className="h-8 w-8 text-white" />
                                </div>
                              )}
                              <p className="mt-2 text-sm font-bold truncate">{featuredVideo?.title}</p>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-sm">
                        No featured video set
                      </div>
                    )}
                  </div>

                  {/* Gallery Videos Preview */}
                  <div className="border-2 border-blue-600 p-4 bg-blue-50">
                    <h4 className="font-bold text-blue-800 mb-2">Video Gallery</h4>
                    <p className="text-xs text-blue-600 mb-3">{videos.filter(v => !v.is_featured && v.video_placement !== 'featured').length} videos in gallery</p>
                    <div className="grid grid-cols-3 gap-1">
                      {videos.filter(v => !v.is_featured && v.video_placement !== 'featured').slice(0, 6).map(v => {
                        const thumb = getVideoThumbnail(v.video_url, v.platform);
                        return thumb ? (
                          <img key={v.id} src={thumb} className="w-full h-12 object-cover" alt="" />
                        ) : (
                          <div key={v.id} className="w-full h-12 bg-gray-700 flex items-center justify-center">
                            <Video className="h-4 w-4 text-white" />
                          </div>
                        );
                      })}
                      {videos.filter(v => !v.is_featured && v.video_placement !== 'featured').length === 0 && (
                        <div className="col-span-3 h-20 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-xs">
                          No gallery videos
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Grid */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">All Videos ({videos.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => {
                  const thumbnail = getVideoThumbnail(video.video_url, video.platform) || video.thumbnail_url;
                  const placementInfo = VIDEO_PLACEMENTS[(video.video_placement as keyof typeof VIDEO_PLACEMENTS) || 'gallery'] || VIDEO_PLACEMENTS.gallery;
                  return (
                    <div key={video.id} className="bg-gray-50 border-2 border-black overflow-hidden">
                      {/* Thumbnail */}
                      <div className="relative h-36">
                        {thumbnail ? (
                          <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Video className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        {video.is_featured && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-ochre-600 text-white text-xs font-bold">
                            FEATURED
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 px-2 py-1 ${placementInfo.badgeClass} text-white text-xs font-bold`}>
                          {placementInfo.label}
                        </div>
                        {/* Play button overlay */}
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent ml-1" />
                          </div>
                        </a>
                      </div>

                      <div className="p-4">
                        <h4 className="font-bold text-sm mb-1 truncate">{video.title || 'Untitled'}</h4>
                        <p className="text-xs text-gray-500 mb-3">{video.platform} • {video.video_type}</p>

                        {/* Placement Dropdown */}
                        <div className="mb-3">
                          <label className="block text-xs font-bold text-gray-600 mb-1">Assign to:</label>
                          <select
                            value={video.video_placement || 'gallery'}
                            onChange={(e) => updateVideoPlacement(video.id, e.target.value)}
                            className="w-full border-2 border-black p-2 text-sm bg-white"
                          >
                            {Object.entries(VIDEO_PLACEMENTS).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setFeaturedVideo(video.id)}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 border-2 text-xs font-bold ${
                              video.is_featured
                                ? 'border-ochre-600 bg-ochre-600 text-white'
                                : 'border-ochre-600 text-ochre-600 hover:bg-ochre-600 hover:text-white'
                            }`}
                          >
                            <Star className="h-3 w-3" /> {video.is_featured ? 'Featured' : 'Set Featured'}
                          </button>
                          <button
                            onClick={() => deleteVideo(video.id)}
                            className="px-2 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {videos.length === 0 && (
                <div className="text-center py-12 text-gray-500">No videos yet. Add one above.</div>
              )}
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Add Metric Form */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">Add Impact Metric</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Metric name (e.g., Youth Engaged)"
                  value={newMetric.metric_name}
                  onChange={(e) => setNewMetric({ ...newMetric, metric_name: e.target.value })}
                  className="border-2 border-black p-3"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., 400+)"
                  value={newMetric.metric_value}
                  onChange={(e) => setNewMetric({ ...newMetric, metric_value: e.target.value })}
                  className="border-2 border-black p-3"
                />
                <input
                  type="text"
                  placeholder="Context (e.g., per year)"
                  value={newMetric.metric_context}
                  onChange={(e) => setNewMetric({ ...newMetric, metric_context: e.target.value })}
                  className="border-2 border-black p-3"
                />
              </div>
              <button
                onClick={addMetric}
                disabled={!newMetric.metric_name}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add Metric
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-white border-2 border-black p-6">
                  <div className="text-3xl font-black text-green-600">{metric.metric_value}</div>
                  <div className="font-bold">{metric.metric_name}</div>
                  {metric.metric_context && (
                    <div className="text-sm text-gray-600">{metric.metric_context}</div>
                  )}
                  <button
                    onClick={() => deleteMetric(metric.id)}
                    className="mt-4 flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-bold"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              ))}
            </div>
            {metrics.length === 0 && (
              <div className="text-center py-12 text-gray-500">No metrics yet. Add one above.</div>
            )}
          </div>
        )}

        {/* Storytellers Tab */}
        {activeTab === 'storytellers' && (
          <div className="space-y-6">
            {/* Add Storyteller Form */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">Add Key Person / Storyteller</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newStoryteller.display_name}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, display_name: e.target.value })}
                  className="border-2 border-black p-3"
                />
                <input
                  type="text"
                  placeholder="Role (e.g., Founder & Director)"
                  value={newStoryteller.role_at_org}
                  onChange={(e) => setNewStoryteller({ ...newStoryteller, role_at_org: e.target.value })}
                  className="border-2 border-black p-3"
                />
              </div>
              <textarea
                placeholder="Bio excerpt"
                value={newStoryteller.bio_excerpt}
                onChange={(e) => setNewStoryteller({ ...newStoryteller, bio_excerpt: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
                rows={2}
              />
              <textarea
                placeholder="Featured quote (optional)"
                value={newStoryteller.quote}
                onChange={(e) => setNewStoryteller({ ...newStoryteller, quote: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
                rows={2}
              />
              <button
                onClick={addStoryteller}
                disabled={!newStoryteller.display_name}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add Person
              </button>
            </div>

            {/* Storytellers List */}
            <div className="space-y-4">
              {storytellers.map((person) => (
                <div key={person.id} className="bg-white border-2 border-black p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-xl">
                      {person.display_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg">{person.display_name}</h4>
                      <p className="text-purple-600 font-bold">{person.role_at_org}</p>
                      {person.bio_excerpt && (
                        <p className="text-gray-600 mt-2">{person.bio_excerpt}</p>
                      )}
                      {person.quote && (
                        <blockquote className="mt-3 pl-4 border-l-4 border-purple-600 italic text-gray-700">
                          "{person.quote}"
                        </blockquote>
                      )}
                    </div>
                    <button
                      onClick={() => deleteStoryteller(person.id)}
                      className="px-3 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {storytellers.length === 0 && (
              <div className="text-center py-12 text-gray-500">No storytellers yet. Add one above.</div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-6">
            {/* Add Link Form */}
            <div className="bg-white border-2 border-black p-6">
              <h3 className="font-bold text-lg mb-4">Add External Link</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Link title"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="border-2 border-black p-3"
                />
                <select
                  value={newLink.link_type}
                  onChange={(e) => setNewLink({ ...newLink, link_type: e.target.value as any })}
                  className="border-2 border-black p-3"
                >
                  <option value="website">Website</option>
                  <option value="social">Social Media</option>
                  <option value="news">News Article</option>
                  <option value="research">Research</option>
                  <option value="documentary">Documentary</option>
                  <option value="podcast">Podcast</option>
                </select>
              </div>
              <input
                type="url"
                placeholder="URL"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                className="w-full border-2 border-black p-3 mt-4"
              />
              <button
                onClick={addLink}
                disabled={!newLink.url}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold hover:bg-cyan-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add Link
              </button>
            </div>

            {/* Links List */}
            <div className="space-y-4">
              {links.map((link) => (
                <div key={link.id} className="bg-white border-2 border-black p-6 flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-100 rounded flex items-center justify-center">
                    <LinkIcon className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{link.title}</h4>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                      {link.url}
                    </a>
                    {link.description && (
                      <p className="text-sm text-gray-600">{link.description}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-xs font-bold">{link.link_type}</span>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="px-3 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {links.length === 0 && (
              <div className="text-center py-12 text-gray-500">No links yet. Add one above.</div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

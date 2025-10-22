import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Play, MapPin, Calendar, Users } from 'lucide-react';
import Image from 'next/image';

interface LinkedProfile {
  role: string;
  role_description: string | null;
  display_order: number;
  public_profiles: {
    id: string;
    full_name: string;
    slug: string;
    tagline: string | null;
    bio: string | null;
    photo_url: string | null;
    role_tags: string[];
  };
}

interface GalleryImage {
  url: string;
  caption?: string;
  credit?: string;
}

interface ArtInnovationProject {
  id: string;
  title: string;
  slug: string;
  type: string;
  tagline: string | null;
  description: string;
  story: string | null;
  impact: string | null;
  featured_image_url: string | null;
  video_url: string | null;
  gallery_images: GalleryImage[];
  year: number | null;
  location: string | null;
  tags: string[];
  website_url: string | null;
  social_links: Record<string, string>;
  organizations?: {
    name: string;
    slug: string;
  } | null;
  art_innovation_profiles: LinkedProfile[];
}

export default async function ArtInnovationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('art_innovation')
    .select(`
      *,
      organizations:organization_id (
        name,
        slug
      ),
      art_innovation_profiles (
        role,
        role_description,
        display_order,
        public_profiles (
          id,
          full_name,
          slug,
          tagline,
          bio,
          photo_url,
          role_tags
        )
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !project) {
    notFound();
  }

  const typedProject = project as ArtInnovationProject;

  // Sort profiles by display_order
  const sortedProfiles = [...typedProject.art_innovation_profiles].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <div className="min-h-screen bg-white page-content">
      {/* Back Navigation */}
      <div className="border-b border-gray-200 bg-sand-50">
        <div className="container-justice py-4">
          <Link
            href="/art-innovation"
            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Art & Innovation
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative">
        {typedProject.featured_image_url && (
          <div className="w-full h-[60vh] relative bg-gray-900">
            <img
              src={typedProject.featured_image_url}
              alt={typedProject.title}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}

        <div className="container-justice py-16">
          <div className="max-w-4xl">
            {/* Type Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-ochre-100 border-2 border-black mb-6">
              <span className="text-sm font-bold uppercase tracking-wider">
                {typedProject.type}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              {typedProject.title}
            </h1>

            {/* Tagline */}
            {typedProject.tagline && (
              <p className="text-2xl text-earth-700 font-medium mb-8">
                {typedProject.tagline}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-6 text-sm text-earth-600 mb-8">
              {typedProject.year && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{typedProject.year}</span>
                </div>
              )}
              {typedProject.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{typedProject.location}</span>
                </div>
              )}
              {sortedProfiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {sortedProfiles.length} {sortedProfiles.length === 1 ? 'Creator' : 'Creators'}
                  </span>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-4">
              {typedProject.website_url && (
                <a
                  href={typedProject.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 transition-colors border-2 border-black"
                >
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {typedProject.video_url && (
                <a
                  href={typedProject.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors border-2 border-red-600"
                >
                  Watch Video
                  <Play className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container-justice py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div>
              <h2 className="text-3xl font-black mb-6">About This Project</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-earth-800">
                  {typedProject.description}
                </p>
              </div>
            </div>

            {/* Story */}
            {typedProject.story && (
              <div>
                <h2 className="text-3xl font-black mb-6">The Story</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed text-earth-800 whitespace-pre-line">
                    {typedProject.story}
                  </p>
                </div>
              </div>
            )}

            {/* Impact */}
            {typedProject.impact && (
              <div className="bg-gradient-to-br from-ochre-50 to-sand-50 border-2 border-black p-8">
                <h2 className="text-3xl font-black mb-6">Impact</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed text-earth-800 whitespace-pre-line">
                    {typedProject.impact}
                  </p>
                </div>
              </div>
            )}

            {/* Gallery */}
            {typedProject.gallery_images && typedProject.gallery_images.length > 0 && (
              <div>
                <h2 className="text-3xl font-black mb-6">Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {typedProject.gallery_images.map((image, index) => (
                    <div key={index} className="group relative border-2 border-black overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.caption || `Gallery image ${index + 1}`}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {(image.caption || image.credit) && (
                        <div className="p-4 bg-white border-t-2 border-black">
                          {image.caption && (
                            <p className="text-sm font-medium text-earth-800 mb-1">
                              {image.caption}
                            </p>
                          )}
                          {image.credit && (
                            <p className="text-xs text-earth-600">
                              Photo: {image.credit}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Creators - Now from linked profiles */}
            {sortedProfiles.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-black mb-4 uppercase tracking-wider">
                  {sortedProfiles.length === 1 ? 'Creator' : 'Creators'}
                </h3>
                <div className="space-y-6">
                  {sortedProfiles.map((profileLink) => (
                    <Link
                      key={profileLink.public_profiles.id}
                      href={`/people/${profileLink.public_profiles.slug}`}
                      className="flex gap-4 group"
                    >
                      {profileLink.public_profiles.photo_url && (
                        <img
                          src={profileLink.public_profiles.photo_url}
                          alt={profileLink.public_profiles.full_name}
                          className="w-16 h-16 rounded-full border-2 border-black object-cover group-hover:border-ochre-600 transition-colors"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg group-hover:text-ochre-600 transition-colors">
                          {profileLink.public_profiles.full_name}
                        </h4>
                        <p className="text-sm text-earth-600 font-medium mb-2">
                          {profileLink.role_description || profileLink.role}
                        </p>
                        {profileLink.public_profiles.bio && (
                          <p className="text-sm text-earth-700 leading-relaxed line-clamp-3">
                            {profileLink.public_profiles.bio}
                          </p>
                        )}
                        <span className="text-xs text-ochre-600 font-bold mt-2 inline-block group-hover:underline">
                          View Full Profile →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Organization */}
            {typedProject.organizations && (
              <div className="border-2 border-black p-6 bg-sand-50">
                <h3 className="text-sm font-black mb-2 uppercase tracking-wider text-earth-600">
                  Organization
                </h3>
                <Link
                  href={`/organizations/${typedProject.organizations.slug}`}
                  className="text-lg font-bold hover:text-ochre-600 transition-colors"
                >
                  {typedProject.organizations.name}
                </Link>
              </div>
            )}

            {/* Tags */}
            {typedProject.tags && typedProject.tags.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-sm font-black mb-4 uppercase tracking-wider text-earth-600">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {typedProject.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-ochre-100 text-earth-800 text-xs font-bold uppercase tracking-wide border border-earth-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

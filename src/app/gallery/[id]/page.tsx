'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Eye,
  Calendar,
  User,
  Building2,
  Share2,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface MediaItem {
  id: string;
  title: string;
  description: string;
  media_type: 'photo' | 'video' | 'artwork' | 'story';
  thumbnail_url: string;
  media_url?: string;
  creator_name: string;
  organization_name?: string;
  views: number;
  duration?: string;
  created_at: string;
  tags: string[];
  featured: boolean;
}

// Sample media data - matches gallery page data
const sampleMedia: MediaItem[] = [
  {
    id: '1',
    title: 'BackTrack Youth Welding Workshop',
    description: 'Young people learning welding skills through hands-on mentorship program. This video showcases the transformative power of skills-based training and the importance of providing young people with practical pathways to employment.',
    media_type: 'video',
    thumbnail_url: '/api/placeholder/800/600',
    media_url: '/api/placeholder/video',
    creator_name: 'Marcus Thompson',
    organization_name: 'BackTrack Youth Works',
    views: 2847,
    duration: '3:24',
    created_at: '2024-01-15',
    tags: ['skills', 'employment', 'mentorship', 'BackTrack'],
    featured: true,
  },
  {
    id: '2',
    title: 'Traditional Healing Circle',
    description: 'Elder-led healing ceremony connecting young people with culture. This powerful gathering demonstrates the importance of cultural connection in supporting young First Nations people through difficult times.',
    media_type: 'photo',
    thumbnail_url: '/api/placeholder/800/600',
    creator_name: 'Sarah Williams',
    organization_name: 'Oonchiumpa',
    views: 1923,
    created_at: '2024-01-10',
    tags: ['culture', 'healing', 'First Nations', 'community'],
    featured: true,
  },
  {
    id: '3',
    title: 'Youth-Led Mural Project',
    description: 'Community mural created by program participants expressing their journey. This artwork represents the voices and experiences of young people who have been through the justice system.',
    media_type: 'artwork',
    thumbnail_url: '/api/placeholder/800/600',
    creator_name: 'Community Artists',
    organization_name: 'JusticeHub Arts Program',
    views: 1456,
    created_at: '2024-01-05',
    tags: ['art', 'expression', 'community', 'healing'],
    featured: false,
  },
  {
    id: '4',
    title: "Jayden's Journey: From Detention to Leadership",
    description: 'A powerful story of transformation through community support. Jayden shares his experience of going from youth detention to becoming a youth mentor, helping others avoid the same path.',
    media_type: 'story',
    thumbnail_url: '/api/placeholder/800/600',
    creator_name: 'Jayden M.',
    views: 3201,
    created_at: '2024-01-20',
    tags: ['story', 'transformation', 'leadership', 'mentorship'],
    featured: true,
  },
  {
    id: '5',
    title: 'Tech Skills Workshop',
    description: 'Young people learning digital skills for future employment opportunities. This program provides pathways into the technology sector for young people who might otherwise be excluded.',
    media_type: 'video',
    thumbnail_url: '/api/placeholder/800/600',
    media_url: '/api/placeholder/video',
    creator_name: 'Digital Futures Team',
    organization_name: 'Digital Futures Australia',
    views: 892,
    duration: '5:12',
    created_at: '2024-01-25',
    tags: ['technology', 'skills', 'employment', 'digital'],
    featured: false,
  },
  {
    id: '6',
    title: 'Community BBQ Gathering',
    description: 'Monthly community gathering bringing together young people, families, and support workers in a relaxed environment that builds trust and connection.',
    media_type: 'photo',
    thumbnail_url: '/api/placeholder/800/600',
    creator_name: 'Community Events Team',
    organization_name: 'JusticeHub Community',
    views: 1678,
    created_at: '2024-01-28',
    tags: ['community', 'family', 'connection', 'support'],
    featured: false,
  },
];

const mediaTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  video: { label: 'Video', icon: '🎬', color: 'bg-red-100 text-red-800 border-red-800' },
  photo: { label: 'Photo', icon: '📷', color: 'bg-blue-100 text-blue-800 border-blue-800' },
  artwork: { label: 'Artwork', icon: '🎨', color: 'bg-purple-100 text-purple-800 border-purple-800' },
  story: { label: 'Story', icon: '📖', color: 'bg-green-100 text-green-800 border-green-800' },
};

export default function GalleryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Find the media item
  const media = sampleMedia.find(m => m.id === id);

  if (!media) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-white page-content">
          <div className="container-justice py-16 text-center">
            <h1 className="text-4xl font-bold mb-4">Media Not Found</h1>
            <p className="text-earth-600 mb-8">The media item you're looking for doesn't exist.</p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Gallery
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const typeInfo = mediaTypeLabels[media.media_type];

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-white page-content">
        {/* Back Navigation */}
        <div className="border-b-2 border-black bg-sand-50">
          <div className="container-justice py-4">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 font-bold text-earth-700 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Gallery
            </Link>
          </div>
        </div>

        {/* Media Display */}
        <section className="border-b-2 border-black">
          <div className="container-justice py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Media */}
              <div className="lg:col-span-2">
                <div className="relative aspect-video bg-gray-900 border-2 border-black overflow-hidden">
                  {media.media_type === 'video' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                        <Play className="w-10 h-10 text-black ml-1" fill="currentColor" />
                      </div>
                      <img
                        src={media.thumbnail_url}
                        alt={media.title}
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      {media.duration && (
                        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 text-sm font-bold">
                          {media.duration}
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src={media.thumbnail_url}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Info Sidebar */}
              <div className="space-y-6">
                {/* Type Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 border-2 font-bold ${typeInfo.color}`}>
                  <span>{typeInfo.icon}</span>
                  {typeInfo.label}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-earth-900">
                  {media.title}
                </h1>

                {/* Creator Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-earth-600" />
                    <span className="font-medium">{media.creator_name}</span>
                  </div>
                  {media.organization_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-earth-600" />
                      <span className="font-medium">{media.organization_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-earth-600" />
                    <span className="font-medium">{new Date(media.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-earth-600" />
                    <span className="font-medium">{media.views.toLocaleString()} views</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-black font-bold hover:bg-sand-50 transition-colors">
                    <Heart className="w-5 h-5" />
                    Like
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-black font-bold hover:bg-sand-50 transition-colors">
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="py-8 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-4">About This {typeInfo.label}</h2>
            <p className="text-lg text-earth-700 leading-relaxed max-w-4xl">
              {media.description}
            </p>

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {media.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-sand-100 border border-black text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Related Media */}
        <section className="py-12">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-6">More From the Gallery</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {sampleMedia
                .filter(m => m.id !== id)
                .slice(0, 3)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/gallery/${item.id}`}
                    className="group border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold border ${mediaTypeLabels[item.media_type].color}`}>
                        {mediaTypeLabels[item.media_type].icon} {mediaTypeLabels[item.media_type].label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-earth-900 group-hover:text-ochre-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-earth-600 mt-1">{item.creator_name}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

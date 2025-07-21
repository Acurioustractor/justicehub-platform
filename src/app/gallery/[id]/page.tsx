'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Play,
  Eye,
  Calendar,
  MapPin,
  ExternalLink,
  Share2,
  Heart,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface MediaItem {
  id: string;
  title: string;
  description: string;
  full_description: string;
  media_type: 'photo' | 'video' | 'artwork' | 'story';
  thumbnail_url: string;
  media_url?: string;
  creator_name: string;
  creator_bio?: string;
  organization_name?: string;
  organization_id?: string;
  organization_description?: string;
  person_id?: string;
  views: number;
  duration?: string;
  created_at: string;
  location?: string;
  tags: string[];
  featured: boolean;
  related_media: string[];
}

export default function MediaViewPage() {
  const params = useParams();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Mock data - will be replaced with Supabase query
    const mockMedia: { [key: string]: MediaItem } = {
      '1': {
        id: '1',
        title: 'BackTrack Youth Welding Workshop',
        description: 'Young people learning welding skills through hands-on mentorship program',
        full_description: `This powerful video showcases the innovative approach of BackTrack Youth Works in Armidale, NSW. Watch as young people who have been disengaged from traditional education discover their potential through hands-on welding training combined with animal therapy.

The program operates on the principle that every young person has value and potential, regardless of their past. Through working with rescue dogs and learning practical trade skills, participants develop not just technical abilities but emotional resilience, responsibility, and hope for the future.

This particular session features Marcus Thompson, a program graduate who now works as a qualified welder and mentors other youth. His journey from sleeping rough and frequent arrests to stable employment and community leadership demonstrates the transformative power of programs that meet young people where they are.

The video captures the genuine relationships between mentors and participants, the careful balance of challenge and support, and the moment when young people realize they have skills and abilities they never knew they possessed. This is more than training - it's about rebuilding lives and futures.`,
        media_type: 'video',
        thumbnail_url: '/api/placeholder/800/600',
        media_url: '/api/placeholder/video',
        creator_name: 'Marcus Thompson',
        creator_bio: 'Program graduate turned mentor, qualified welder, and community advocate',
        organization_name: 'BackTrack Youth Works',
        organization_id: '1',
        organization_description: 'Innovative program combining vocational training, animal therapy, and intensive mentoring for disengaged youth',
        views: 2847,
        duration: '3:24',
        created_at: '2024-01-15',
        location: 'Armidale, NSW',
        tags: ['Skills Training', 'Mentorship', 'BackTrack', 'Armidale', 'Vocational', 'Youth Employment', 'Animal Therapy'],
        featured: true,
        related_media: ['2', '4', '6']
      },
      '2': {
        id: '2',
        title: 'Traditional Healing Circle Ceremony',
        description: 'Elder Mary leading traditional healing practices with young Aboriginal people',
        full_description: `A profound glimpse into the traditional Aboriginal healing practices that form the foundation of the Healing Circles Program in Alice Springs. This photograph captures Elder Mary Nganyinpa conducting a traditional healing ceremony with young Aboriginal people who are reconnecting with their culture and healing from trauma.

The image speaks to the power of indigenous knowledge systems and the deep wisdom that has sustained Aboriginal peoples for tens of thousands of years. In the circle, young people who have struggled with disconnection, substance abuse, and trauma find their way back to cultural identity and spiritual healing.

Elder Mary, a respected traditional knowledge holder, guides participants through practices that address not just symptoms but root causes of distress. The healing happens through connection - to country, to culture, to community, and to ancient wisdom that offers pathways to wholeness that Western approaches alone cannot provide.

This moment represents more than therapy; it's a return to traditional ways of healing that honor the spiritual and cultural dimensions of recovery. The program achieves remarkable outcomes because it works within Aboriginal cultural frameworks, recognizing that healing must happen on cultural and spiritual levels as well as emotional and physical ones.`,
        media_type: 'photo',
        thumbnail_url: '/api/placeholder/800/600',
        creator_name: 'Elder Mary Nganyinpa',
        creator_bio: 'Traditional knowledge holder and respected elder of the Antakirinja Matu-Yankunytjatjara people',
        organization_name: 'Healing Circles Program',
        organization_id: '2',
        organization_description: 'Traditional Aboriginal healing practices combined with elder mentorship for young Aboriginal people experiencing trauma',
        views: 1923,
        created_at: '2024-01-20',
        location: 'Alice Springs, NT',
        tags: ['Indigenous Knowledge', 'Cultural Healing', 'Alice Springs', 'Traditional', 'Ceremony', 'Elder Guidance'],
        featured: true,
        related_media: ['1', '5']
      }
    };

    const selectedMedia = mockMedia[params.id as string];
    setMedia(selectedMedia || null);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="font-mono">Loading media...</div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container-justice text-center">
            <h1 className="text-3xl font-bold mb-4">Media not found</h1>
            <p className="text-lg text-gray-600 mb-8">The media item you're looking for doesn't exist.</p>
            <Link href="/gallery" className="cta-primary">
              Back to Gallery
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMediaTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-600 text-white';
      case 'photo': return 'bg-blue-600 text-white';
      case 'artwork': return 'bg-purple-600 text-white';
      case 'story': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-32">
        {/* Back Navigation */}
        <section className="border-b border-gray-200 pb-4">
          <div className="container-justice">
            <Link 
              href="/gallery" 
              className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Link>
          </div>
        </section>

        {/* Media Display */}
        <section className="py-8 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Media Player/Viewer */}
                <div className="relative aspect-video bg-black mb-6 border-2 border-black">
                  {media.media_type === 'video' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="h-16 w-16 mx-auto mb-4" />
                        <p className="font-mono text-xl">VIDEO PLAYER</p>
                        <p className="text-sm mt-2">Duration: {media.duration}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center text-white">
                        <Eye className="h-16 w-16 mx-auto mb-4" />
                        <p className="font-mono text-xl">{media.media_type.toUpperCase()} VIEWER</p>
                        <p className="text-sm mt-2">Click to view full resolution</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Media type badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1 text-sm font-bold uppercase tracking-wider ${getMediaTypeColor(media.media_type)}`}>
                    {media.media_type}
                  </div>
                  
                  {media.featured && (
                    <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 text-sm font-bold uppercase">
                      Featured
                    </div>
                  )}
                </div>

                {/* Media Info */}
                <div>
                  <h1 className="text-3xl font-bold mb-4">{media.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViews(media.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(media.created_at)}
                    </span>
                    {media.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {media.location}
                      </span>
                    )}
                  </div>

                  <div className="prose prose-lg max-w-none">
                    {media.full_description.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-6 leading-relaxed text-gray-700">
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Creator Info */}
                <div className="data-card">
                  <h3 className="font-bold text-lg mb-4">CREATED BY</h3>
                  <div className="mb-4">
                    <p className="font-bold text-lg">{media.creator_name}</p>
                    {media.creator_bio && (
                      <p className="text-sm text-gray-600 mt-2">{media.creator_bio}</p>
                    )}
                  </div>
                  
                  {media.organization_name && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">PROGRAM/ORGANIZATION</p>
                      <Link 
                        href={`/community-programs/${media.organization_id}`}
                        className="block hover:text-blue-800 transition-colors"
                        style={{textDecoration: 'none'}}
                      >
                        <p className="font-bold">{media.organization_name}</p>
                        {media.organization_description && (
                          <p className="text-sm text-gray-600 mt-1">{media.organization_description}</p>
                        )}
                        <div className="inline-flex items-center gap-1 text-sm text-blue-800 mt-2">
                          Learn more about this program
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="data-card">
                  <h3 className="font-bold text-lg mb-4">TAGS</h3>
                  <div className="flex flex-wrap gap-2">
                    {media.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/gallery?search=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors border border-gray-300 hover:border-gray-400"
                        style={{textDecoration: 'none'}}
                      >
                        #{tag.toLowerCase().replace(' ', '')}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="data-card">
                  <h3 className="font-bold text-lg mb-4">SHARE & CONNECT</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-black hover:bg-black hover:text-white transition-all font-bold">
                      <Share2 className="h-4 w-4" />
                      Share this story
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-black hover:bg-black hover:text-white transition-all font-bold">
                      <Heart className="h-4 w-4" />
                      Save to favorites
                    </button>
                    {media.organization_id && (
                      <Link 
                        href={`/community-programs/${media.organization_id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-800 text-white hover:bg-blue-700 transition-all font-bold"
                      >
                        <Users className="h-4 w-4" />
                        Connect with program
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Media */}
        {media.related_media && media.related_media.length > 0 && (
          <section className="py-16">
            <div className="container-justice">
              <h2 className="text-2xl font-bold mb-8">RELATED CONTENT</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* This would be populated with actual related media */}
                <div className="border-2 border-black bg-white hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    <span className="font-mono text-gray-500">RELATED MEDIA</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">Related Story Title</h3>
                    <p className="text-sm text-gray-600">Brief description of related content...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Cross-Platform Navigation */}
        <section className="py-16 bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-8 text-center">EXPLORE MORE</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/gallery" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">More Gallery</h3>
                <p className="text-sm">Discover more visual stories and media content</p>
              </Link>
              {media.organization_id && (
                <Link href={`/community-programs/${media.organization_id}`} className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                  <h3 className="font-bold mb-2">Visit Program</h3>
                  <p className="text-sm">Learn more about {media.organization_name}</p>
                </Link>
              )}
              <Link href="/stories" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">Read Stories</h3>
                <p className="text-sm">Explore written narratives and personal journeys</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
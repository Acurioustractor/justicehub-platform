'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Eye,
  Calendar,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import ImageGallery from '@/components/ImageGallery';
import FeaturedVideo from '@/components/FeaturedVideo';

interface MediaItem {
  id: string;
  title: string;
  description: string;
  media_type: 'photo' | 'video' | 'artwork' | 'story';
  thumbnail_url: string;
  media_url?: string;
  creator_name: string;
  organization_name?: string;
  organization_id?: string;
  person_id?: string;
  views: number;
  duration?: string; // for videos
  created_at: string;
  tags: string[];
  featured: boolean;
}

export default function GalleryPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample media data - will be replaced with Supabase query
  const sampleMedia: MediaItem[] = [
    {
      id: '1',
      title: 'BackTrack Youth Welding Workshop',
      description: 'Young people learning welding skills through hands-on mentorship program',
      media_type: 'video',
      thumbnail_url: '/api/placeholder/400/300',
      media_url: '/api/placeholder/video',
      creator_name: 'Marcus Thompson',
      organization_name: 'BackTrack Youth Works',
      organization_id: '1',
      views: 2847,
      duration: '3:24',
      created_at: '2024-01-15',
      tags: ['Skills Training', 'Mentorship', 'BackTrack', 'Armidale', 'Vocational'],
      featured: true
    },
    {
      id: '2',
      title: 'Traditional Healing Circle Ceremony',
      description: 'Elder Mary leading traditional healing practices with young Aboriginal people',
      media_type: 'photo',
      thumbnail_url: '/api/placeholder/400/300',
      creator_name: 'Elder Mary Nganyinpa',
      organization_name: 'Healing Circles Program',
      organization_id: '2',
      views: 1923,
      created_at: '2024-01-20',
      tags: ['Indigenous Knowledge', 'Cultural Healing', 'Alice Springs', 'Traditional'],
      featured: true
    },
    {
      id: '3',
      title: 'Youth-Led Community Mural',
      description: 'Collaborative artwork created by Logan Youth Collective members',
      media_type: 'artwork',
      thumbnail_url: '/api/placeholder/400/300',
      creator_name: 'Logan Youth Collective',
      organization_name: 'Logan Youth Collective', 
      organization_id: '3',
      views: 1456,
      created_at: '2024-01-25',
      tags: ['Creative Arts', 'Community Organizing', 'Logan', 'Youth Leadership'],
      featured: false
    },
    {
      id: '4',
      title: 'From Homelessness to Hope: Jayden\'s Journey',
      description: 'Personal story of overcoming challenges through community support',
      media_type: 'story',
      thumbnail_url: '/api/placeholder/400/300',
      creator_name: 'Jayden Williams',
      views: 3201,
      created_at: '2024-01-30',
      tags: ['Personal Story', 'Housing Support', 'Mental Health', 'Recovery'],
      featured: true
    },
    {
      id: '5',
      title: 'Tech Skills Workshop - Coding for Change',
      description: 'Neurodivergent youth learning programming skills in supportive environment',
      media_type: 'photo',
      thumbnail_url: '/api/placeholder/400/300',
      creator_name: 'TechStart Youth',
      organization_name: 'TechStart Youth',
      organization_id: '6',
      views: 892,
      created_at: '2024-02-05',
      tags: ['Technology', 'Neurodiversity', 'Adelaide', 'Digital Skills'],
      featured: false
    },
    {
      id: '6',
      title: 'Community BBQ Success Stories',
      description: 'Local organizations coming together to celebrate youth achievements',
      media_type: 'video',
      thumbnail_url: '/api/placeholder/400/300',
      media_url: '/api/placeholder/video',
      creator_name: 'Community Events Team',
      views: 1654,
      duration: '5:12',
      created_at: '2024-02-10',
      tags: ['Community Events', 'Celebration', 'Achievements', 'Networking'],
      featured: false
    }
  ];

  const mediaTypes = [
    { id: 'all', label: 'All Media', count: sampleMedia.length },
    { id: 'video', label: 'Videos', count: sampleMedia.filter(m => m.media_type === 'video').length },
    { id: 'photo', label: 'Photos', count: sampleMedia.filter(m => m.media_type === 'photo').length },
    { id: 'artwork', label: 'Artworks', count: sampleMedia.filter(m => m.media_type === 'artwork').length },
    { id: 'story', label: 'Stories', count: sampleMedia.filter(m => m.media_type === 'story').length }
  ];

  const filteredMedia = sampleMedia.filter(item => {
    const matchesFilter = selectedFilter === 'all' || item.media_type === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'photo': return <Eye className="h-4 w-4" />;
      case 'artwork': return <Eye className="h-4 w-4" />;
      case 'story': return <ExternalLink className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
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

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="header-offset pb-16 border-b-2 border-black bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container-justice">
            <div className="text-center">
              <h1 className="headline-truth mb-6">
                GALLERY
              </h1>
              <p className="text-xl max-w-4xl mx-auto mb-8 leading-relaxed">
                Visual stories of transformation. Real programs in action. Youth voices amplified. 
                Community impact documented. Watch, learn, and be inspired by authentic change.
              </p>
              
              {/* Search */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search videos, photos, stories, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Media Type Filters */}
        <section className="py-8 border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex flex-wrap gap-4 justify-center">
              {mediaTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedFilter(type.id)}
                  className={`px-6 py-3 font-bold tracking-wider transition-all flex items-center gap-2 ${
                    selectedFilter === type.id 
                      ? 'bg-black text-white' 
                      : 'border-2 border-black hover:bg-black hover:text-white'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {type.label} ({type.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Media Grid */}
        <section className="py-16">
          <div className="container-justice">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {filteredMedia.length} {selectedFilter === 'all' ? 'Media Items' : mediaTypes.find(t => t.id === selectedFilter)?.label}
              </h2>
              <p className="text-sm text-gray-600">
                Real stories from real programs making real impact
              </p>
            </div>

            {filteredMedia.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No media found matching your criteria</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedia.map((item) => (
                  <Link
                    key={item.id}
                    href={`/gallery/${item.id}`}
                    className="group border-2 border-black bg-white hover:shadow-lg transition-all block"
                    style={{textDecoration: 'none'}}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-200 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                        <span className="font-mono text-gray-500">MEDIA PREVIEW</span>
                      </div>
                      
                      {/* Media type badge */}
                      <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${getMediaTypeColor(item.media_type)}`}>
                        {getMediaTypeIcon(item.media_type)}
                        {item.media_type}
                      </div>
                      
                      {/* Duration for videos */}
                      {item.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 text-xs font-mono">
                          {item.duration}
                        </div>
                      )}
                      
                      {/* Featured badge */}
                      {item.featured && (
                        <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 text-xs font-bold uppercase">
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-800 transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      {/* Creator and organization info */}
                      <div className="mb-3">
                        <p className="text-sm font-medium">{item.creator_name}</p>
                        {item.organization_name && (
                          <p className="text-xs text-blue-800">
                            {item.organization_name}
                          </p>
                        )}
                      </div>
                      
                      {/* Meta info */}
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatViews(item.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-medium transition-colors cursor-pointer"
                          >
                            #{tag.toLowerCase().replace(' ', '')}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Section */}
        <section className="py-16 bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-8 text-center">FEATURED CONTENT</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sampleMedia.filter(item => item.featured).slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/gallery/${item.id}`}
                  className="group data-card hover:shadow-lg transition-all"
                  style={{textDecoration: 'none'}}
                >
                  <div className="aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-gray-500">FEATURED MEDIA</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.creator_name}</span>
                    <span className="text-gray-600">{formatViews(item.views)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Example: ImageGallery Component Showcase */}
        <section className="py-16 bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4 text-center">COMMUNITY IN ACTION</h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              Real moments from community programs making real impact across Australia
            </p>

            <ImageGallery
              images={[
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Young people in welding workshop',
                  caption: 'BackTrack Youth Works - Welding Skills Training',
                  credit: 'Marcus Thompson'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Traditional healing circle ceremony',
                  caption: 'Cultural Healing Ceremony - Alice Springs',
                  credit: 'Elder Mary Nganyinpa'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Youth-led community mural',
                  caption: 'Logan Youth Collective Mural Project',
                  credit: 'Logan Youth Collective'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Tech skills workshop',
                  caption: 'Coding for Change - Adelaide',
                  credit: 'TechStart Youth'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Community BBQ celebration',
                  caption: 'Youth Achievement Celebration',
                  credit: 'Community Events Team'
                },
                {
                  src: '/api/placeholder/800/600',
                  alt: 'Cultural connection program',
                  caption: 'Country Connection Program',
                  credit: 'JusticeHub'
                }
              ]}
              columns={3}
            />
          </div>
        </section>

        {/* Example: FeaturedVideo Component Showcase */}
        <section className="py-16 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-12 text-center">PROGRAMS IN ACTION</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FeaturedVideo
                videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                title="BackTrack Youth Works: Welding Workshop"
                description="Young people learning welding skills through hands-on mentorship. See how community-led programs create real pathways to employment."
              />

              <FeaturedVideo
                videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                title="Traditional Healing Circles"
                description="Elder Mary shares how cultural connection and traditional practices help young people heal and thrive."
              />
            </div>
          </div>
        </section>

        {/* Cross-Platform Links */}
        <section className="py-16 border-t-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-2xl font-bold mb-8 text-center">EXPLORE MORE</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/community-programs" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">Featured Programs</h3>
                <p className="text-sm">See the organizations and programs featured in our gallery</p>
              </Link>
              <Link href="/stories" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">Written Stories</h3>
                <p className="text-sm">Read detailed personal narratives and impact stories</p>
              </Link>
              <Link href="/stories/intelligence" className="group border-2 border-black bg-white p-6 hover:bg-black hover:text-white transition-all block" style={{textDecoration: 'none'}}>
                <h3 className="font-bold mb-2">ALMA Intelligence</h3>
                <p className="text-sm">Explore data-driven insights on media sentiment and community programs</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
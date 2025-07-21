/**
 * Video Stories Page
 * 
 * Dedicated page for showcasing video stories and documentaries
 */

'use client';

import { useState, useEffect } from 'react';
import { MediaStoryGrid } from '@/components/stories/multimedia/MediaStoryGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play,
  Video,
  Upload,
  Users,
  Clock,
  Eye,
  Heart,
  Share2,
  Sparkles,
  Camera,
  Mic,
  Film
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function VideoStoriesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      <main id="main-content">
        {/* Hero Section */}
        <section className="pt-24 pb-16 border-b-2 border-black bg-gradient-to-br from-red-50 to-pink-50">
          <div className="container-justice">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-4 text-sm uppercase tracking-wider text-red-600 font-bold flex items-center justify-center gap-2">
                <Video className="h-5 w-5" />
                VIDEO STORIES
              </div>
              <h1 className="headline-truth mb-6">
                Stories That Move & Inspire
              </h1>
              <p className="text-xl text-black mb-10 leading-relaxed font-medium">
                Experience powerful video documentaries, personal vlogs, and visual narratives 
                from young people transforming their communities.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/stories/videos/create">
                  <button className="cta-primary">
                    <Upload className="h-5 w-5 mr-2" />
                    Share Your Video
                  </button>
                </Link>
                <Link href="/stories/videos/featured">
                  <button className="cta-secondary">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Featured Videos
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container-justice py-8">
          {/* Video Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Play className="h-8 w-8 mx-auto mb-3 text-red-600" />
              <div className="text-3xl font-bold text-black">250+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Video Stories</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Eye className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">125K+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Total Views</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Users className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">180+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Video Creators</div>
            </div>
            <div className="text-center py-6">
              <Clock className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">45 hrs</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Total Content</div>
            </div>
          </div>

          {/* Video Type Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Video Categories</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-all border-2 border-gray-200 hover:border-red-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <Film className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Personal Documentaries</CardTitle>
                  <CardDescription>
                    In-depth personal stories exploring transformation, challenges, and growth.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>45 videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>5-15 min</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Explore Documentaries
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all border-2 border-gray-200 hover:border-red-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Video Blogs (Vlogs)</CardTitle>
                  <CardDescription>
                    Regular video updates sharing daily experiences, insights, and community life.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>128 videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>2-8 min</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Watch Vlogs
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all border-2 border-gray-200 hover:border-red-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Mic className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Video Interviews</CardTitle>
                  <CardDescription>
                    Conversations with advocates, mentors, and community leaders sharing wisdom.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>77 videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>10-30 min</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Interviews
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Featured Video Story */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <h2 className="text-2xl font-bold text-black">Featured This Week</h2>
            </div>
            
            <Card className="border-2 border-yellow-400 bg-yellow-50/30">
              <CardContent className="p-0">
                <div className="md:flex">
                  <div className="md:w-1/2 relative">
                    <div className="aspect-video bg-gray-900 relative overflow-hidden rounded-l-lg">
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: 'url(https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80)'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-all cursor-pointer">
                          <Play className="h-12 w-12 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-600 text-white">
                          <Play className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <Badge className="bg-black/70 text-white">
                          8:42
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8">
                    <Badge className="mb-3 bg-green-100 text-green-800">Documentary</Badge>
                    <h3 className="text-2xl font-bold text-black mb-4">
                      "Breaking the Cycle: My Journey from Streets to University"
                    </h3>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      Maya shares her powerful story of overcoming homelessness and addiction to become 
                      the first in her family to attend university. A raw, honest look at resilience 
                      and the power of community support.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>12.4K views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>892 likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        <span>234 shares</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <Play className="h-4 w-4 mr-2" />
                        Watch Now
                      </Button>
                      <Button variant="outline">
                        <Heart className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Stories Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">All Video Stories</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Most Recent</Button>
                <Button variant="outline" size="sm">Most Viewed</Button>
                <Button variant="outline" size="sm">Trending</Button>
              </div>
            </div>
            
            {mounted && (
              <MediaStoryGrid 
                featuredCount={0}
                showFilters={false}
                showViewToggle={true}
                pageSize={9}
              />
            )}
          </div>

          {/* Video Creation Guide */}
          <div className="mb-12 py-12 border-t-2 border-b-2 border-black bg-gray-50">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3 text-black">Ready to Share Your Video Story?</h2>
              <p className="text-black font-medium">
                We'll guide you through creating compelling video content that inspires and connects
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-blue-300">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2 text-black">Plan & Record</h3>
                <p className="text-sm text-black font-medium">
                  Use our story prompts and filming tips to create authentic, engaging content.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-green-300">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold mb-2 text-black">Upload & Edit</h3>
                <p className="text-sm text-black font-medium">
                  Our platform helps you upload, add captions, and create chapters for accessibility.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 border-2 border-purple-300">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2 text-black">Share & Connect</h3>
                <p className="text-sm text-black font-medium">
                  Your story reaches others who need to hear it, creating ripples of positive change.
                </p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link href="/stories/videos/create">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                  <Video className="h-5 w-5 mr-2" />
                  Start Creating Your Video Story
                </Button>
              </Link>
            </div>
          </div>

          {/* Video Guidelines */}
          <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Video Story Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-blue-800 mb-2">Technical Requirements</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Maximum file size: 2GB</li>
                  <li>• Supported formats: MP4, MOV, AVI</li>
                  <li>• Recommended resolution: 1080p or higher</li>
                  <li>• Maximum duration: 30 minutes</li>
                  <li>• Include captions for accessibility</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 mb-2">Content Guidelines</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Share authentic, personal experiences</li>
                  <li>• Respect privacy of others mentioned</li>
                  <li>• Use content warnings when appropriate</li>
                  <li>• Focus on growth and positive outcomes</li>
                  <li>• Maintain respectful, inclusive language</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}
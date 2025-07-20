'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart,
  MessageCircle,
  Share2,
  Clock,
  MapPin,
  TrendingUp,
  Eye
} from 'lucide-react';
import Link from 'next/link';
// Using real stories from API now

interface Story {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  author: {
    name: string;
    age: number;
    location: string;
    avatar: string;
  };
  visibility: string;
  storyType: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  shares: number;
  metadata: {
    impactScore: number;
    mentorshipProgram: string;
    currentStatus: string;
    readingTime: string;
  };
}

export function StoryGrid() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    async function fetchStories() {
      try {
        const response = await fetch('/api/airtable/real-data?type=stories&limit=6');
        if (!response.ok) {
          // If API fails, use mock data instead
          console.log('Using mock stories data');
          // TODO: Fetch real stories from API
          setStories([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        
        // If no stories returned, use mock data
        if (!data.stories || data.stories.length === 0) {
          // TODO: Fetch real stories from API
          setStories([]);
          setLoading(false);
          return;
        }
        
        // Transform Airtable stories to match expected interface
        const transformedStories = data.stories.map((story: any) => ({
          ...story,
          author: {
            name: story.storytellers?.[0] || 'Community Member',
            age: 25, // Default age since not in Airtable
            location: 'Community',
            avatar: `https://placehold.co/100x100/4F46E5/FFFFFF?text=${(story.storytellers?.[0] || 'A').charAt(0)}`
          },
          updatedAt: story.createdAt,
          metadata: {
            impactScore: parseFloat(story.metadata?.impactScore || '8.5'),
            mentorshipProgram: 'JusticeHub Community',
            currentStatus: 'Inspiring others through their story',
            readingTime: story.metadata?.readingTime || '3 min'
          }
        }));
        setStories(transformedStories);
      } catch (err) {
        // On any error, use mock data
        console.error('Error fetching stories, using mock data:', err);
        // TODO: Fetch real stories from API
        setStories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  <div className="h-3 w-32 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-3/4 bg-gray-300 rounded mt-4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300 rounded"></div>
                <div className="h-3 w-full bg-gray-300 rounded"></div>
                <div className="h-3 w-2/3 bg-gray-300 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <p className="text-red-600 mb-4">Error loading stories: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {stories.map((story) => (
        <Card key={story.id} className="hover:shadow-sm transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            {/* Author Info */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={story.author.avatar} alt={story.author.name} />
                <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{story.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{story.author.name}</p>
                <div className="flex items-center text-xs text-neutral-500 gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{story.author.location}</span>
                  <span>•</span>
                  <span>Age {story.author.age}</span>
                </div>
              </div>
            </div>

            {/* Story Title */}
            <CardTitle className="text-lg line-clamp-2 hover:text-accent-600 transition-colors font-light">
              {story.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Story Excerpt */}
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">{story.excerpt}</p>
            
            {/* Tags - Minimal Style */}
            <div className="flex flex-wrap gap-1">
              {story.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-neutral-200 dark:border-neutral-800 font-normal">
                  {tag}
                </Badge>
              ))}
              {story.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-neutral-200 dark:border-neutral-800">
                  +{story.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Story Type & Program */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <TrendingUp className="h-3 w-3" />
              <span className="capitalize">{story.storyType}</span>
              <span>•</span>
              <span>{story.metadata.mentorshipProgram}</span>
            </div>

            {/* Current Status - Subtle */}
            <div className="bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs p-2 rounded-sm border border-neutral-200 dark:border-neutral-800">
              <span className="font-medium">Now:</span> {story.metadata.currentStatus}
            </div>

            {/* Engagement Stats - Clean */}
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{story.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{story.comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  <span>{story.shares}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{story.metadata.readingTime}</span>
              </div>
            </div>

            {/* Impact Score & Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-600" />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Impact Score: {story.metadata.impactScore}/10</span>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {new Date(story.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Action Buttons - Minimal */}
            <div className="flex gap-2 pt-2">
              <Link href={`/stories/${story.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full border-neutral-200 dark:border-neutral-800">
                  <Eye className="h-4 w-4 mr-1" />
                  Read Story
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="px-3">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="px-3">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Shield, 
  Tag as TagIcon,
  Edit,
  Share2,
  Heart,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

interface Story {
  id: string;
  title: string;
  content: string;
  storyType: string;
  visibility: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tags?: string[];
  media?: any[];
}

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStory();
  }, [params.id]);

  const fetchStory = async () => {
    try {
      const response = await fetch(`/api/stories/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }
      const data = await response.json();
      setStory(data);
    } catch (err) {
      console.error('Error fetching story:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Story Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The story you are looking for does not exist.'}</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = story.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  const getVisibilityIcon = () => {
    switch (story.visibility) {
      case 'public':
        return <Eye className="h-4 w-4" />;
      case 'private':
      case 'organization':
      case 'mentors':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getVisibilityLabel = () => {
    switch (story.visibility) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      case 'organization':
        return 'Organization Only';
      case 'mentors':
        return 'Mentors Only';
      case 'anonymous':
        return 'Anonymous';
      default:
        return story.visibility;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardContent className="p-0">
            <article className="prose prose-lg dark:prose-invert max-w-none p-8">
              {/* Header */}
              <header className="not-prose mb-8">
                <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(story.publishedAt || story.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{readingTime} min read</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {story.storyType}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getVisibilityIcon()}
                    <span>{getVisibilityLabel()}</span>
                  </div>
                </div>

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {story.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </header>

              <Separator className="my-8" />

              {/* Content */}
              <div 
                className="story-content"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
            </article>

            {/* Actions */}
            <div className="border-t p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Story
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
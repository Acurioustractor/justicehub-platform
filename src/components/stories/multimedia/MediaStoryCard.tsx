/**
 * Multimedia Story Card Component
 * 
 * Displays different types of stories (blog, interview, video, photo) in a unified card format
 */

'use client';

import { useState } from 'react';
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
  Play,
  Camera,
  Mic,
  FileText,
  Eye,
  Bookmark,
  Volume2,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Story, BlogStory, InterviewStory, VideoStory, PhotoStory } from '@/types/stories';

interface MediaStoryCardProps {
  story: Story;
  featured?: boolean;
  onLike?: (storyId: string) => void;
  onShare?: (storyId: string) => void;
  onBookmark?: (storyId: string) => void;
}

export function MediaStoryCard({ story, featured = false, onLike, onShare, onBookmark }: MediaStoryCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(story.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(story.id);
  };

  const getStoryTypeIcon = () => {
    switch (story.type) {
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'interview':
        return <Mic className="h-4 w-4" />;
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'photo':
        return <Camera className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStoryTypeLabel = () => {
    switch (story.type) {
      case 'blog':
        return 'Blog Post';
      case 'interview':
        return 'Interview';
      case 'video':
        return 'Video Story';
      case 'photo':
        return 'Photo Story';
      default:
        return 'Story';
    }
  };

  const renderMediaPreview = () => {
    switch (story.type) {
      case 'blog':
        const blogStory = story as BlogStory;
        if (blogStory.featured_image) {
          return (
            <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
              <Image
                src={blogStory.featured_image.url}
                alt={blogStory.featured_image.alt_text || blogStory.title}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-white/90 text-black border-0">
                  {getStoryTypeIcon()}
                  <span className="ml-1 text-xs">{getStoryTypeLabel()}</span>
                </Badge>
              </div>
            </div>
          );
        }
        break;

      case 'video':
        const videoStory = story as VideoStory;
        return (
          <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg bg-gray-900">
            <Image
              src={videoStory.thumbnail.url}
              alt={videoStory.thumbnail.alt_text || videoStory.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all cursor-pointer">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-600 text-white border-0">
                <Play className="h-3 w-3 mr-1" />
                Video
              </Badge>
            </div>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-black/70 text-white border-0 text-xs">
                {videoStory.duration}
              </Badge>
            </div>
          </div>
        );

      case 'photo':
        const photoStory = story as PhotoStory;
        return (
          <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
            <Image
              src={photoStory.cover_photo.url}
              alt={photoStory.cover_photo.alt_text}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
            <div className="absolute top-2 left-2">
              <Badge className="bg-blue-600 text-white border-0">
                <Camera className="h-3 w-3 mr-1" />
                Photos
              </Badge>
            </div>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-black/70 text-white border-0 text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                {photoStory.photo_count}
              </Badge>
            </div>
          </div>
        );

      case 'interview':
        const interviewStory = story as InterviewStory;
        return (
          <div className="relative w-full h-48 mb-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="bg-white rounded-full p-6 mb-4 shadow-lg mx-auto w-fit">
                <Mic className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600">
                {interviewStory.format === 'audio' && (
                  <div className="flex items-center justify-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span>Audio Interview</span>
                  </div>
                )}
                {interviewStory.format === 'video' && (
                  <div className="flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    <span>Video Interview</span>
                  </div>
                )}
                {interviewStory.format === 'text' && (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Written Interview</span>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-2 left-2">
              <Badge className="bg-purple-600 text-white border-0">
                <Mic className="h-3 w-3 mr-1" />
                Interview
              </Badge>
            </div>
            {interviewStory.duration && (
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-black/70 text-white border-0 text-xs">
                  {interviewStory.duration}
                </Badge>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full h-12 mb-4 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              {getStoryTypeIcon()}
              <span className="text-sm">{getStoryTypeLabel()}</span>
            </div>
          </div>
        );
    }
  };

  const getReadingTime = () => {
    if (story.type === 'video') {
      return (story as VideoStory).duration;
    }
    if (story.type === 'interview' && (story as InterviewStory).duration) {
      return (story as InterviewStory).duration;
    }
    return story.metadata.reading_time || '3 min read';
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-2 ${
      featured ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <CardHeader className="pb-4">
        {/* Media Preview */}
        {renderMediaPreview()}

        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={story.author.avatar} alt={story.author.name} />
            <AvatarFallback className="bg-gray-100 text-gray-700">
              {story.author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm text-black">{story.author.name}</p>
            <div className="flex items-center text-xs text-gray-500 gap-2">
              {story.author.location && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{story.author.location}</span>
                </>
              )}
              {story.author.age && (
                <>
                  <span>•</span>
                  <span>Age {story.author.age}</span>
                </>
              )}
            </div>
          </div>
          {story.metadata.featured && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Featured
            </Badge>
          )}
        </div>

        {/* Story Title */}
        <CardTitle className="text-lg line-clamp-2 hover:text-blue-600 transition-colors font-bold text-black group-hover:text-blue-600">
          {story.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Story Description */}
        <CardDescription className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {story.description}
        </CardDescription>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {story.tags.slice(0, 3).map((tag) => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {tag}
            </Badge>
          ))}
          {story.tags.length > 3 && (
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
              +{story.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Story Category */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {getStoryTypeIcon()}
          <span className="capitalize">{story.category.replace('_', ' ')}</span>
          <span>•</span>
          <span>{getStoryTypeLabel()}</span>
        </div>

        {/* Special content for interviews */}
        {story.type === 'interview' && (
          <div className="bg-purple-50 text-purple-700 text-xs p-3 rounded-lg border border-purple-200">
            <div className="font-medium mb-1">Interview Participants:</div>
            <div className="flex items-center gap-2">
              <span>{(story as InterviewStory).interviewee.name}</span>
              <span>×</span>
              <span>{(story as InterviewStory).interviewer.name}</span>
            </div>
          </div>
        )}

        {/* Trigger warnings if any */}
        {story.metadata.trigger_warnings && story.metadata.trigger_warnings.length > 0 && (
          <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg border border-amber-200">
            <div className="font-medium mb-1">Content Note:</div>
            <div>{story.metadata.trigger_warnings.join(', ')}</div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
              <span>{story.engagement.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{story.engagement.comments}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{story.engagement.views}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{getReadingTime()}</span>
          </div>
        </div>

        {/* Impact Score */}
        {story.metadata.impact_score && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Impact Score: {story.metadata.impact_score}/10
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(story.created_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href={`/stories/${story.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-gray-300 hover:bg-gray-50">
              <Eye className="h-4 w-4 mr-2" />
              {story.type === 'video' ? 'Watch' : story.type === 'photo' ? 'View' : 'Read'}
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="ghost" 
            className={`px-3 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="px-3 hover:text-blue-500"
            onClick={() => onShare?.(story.id)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className={`px-3 ${isBookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
            onClick={handleBookmark}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
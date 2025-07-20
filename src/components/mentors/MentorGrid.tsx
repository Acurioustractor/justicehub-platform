'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  MessageSquare,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface Mentor {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  location: string;
  profilePicture: string;
  role: string;
  organization: string;
  experience?: string;
  availability?: string;
  mentorshipStyle?: string;
  successStories?: number;
  rating?: number;
  totalMentees?: number;
  tags: string[];
  programs?: string[];
  languages?: string[];
  verified: boolean;
  badges?: string[];
  hourlyRate?: string;
  responseTime?: string;
  project?: string;
  hasStory?: boolean;
  hasMedia?: boolean;
}

export function MentorGrid() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    async function fetchMentors() {
      try {
        const response = await fetch('/api/airtable/real-data?type=storytellers&limit=6');
        if (!response.ok) {
          throw new Error('Failed to fetch mentors');
        }
        const data = await response.json();
        // Transform Airtable storytellers to match mentor interface
        const transformedMentors = data.storytellers.map((storyteller: any) => ({
          id: storyteller.id,
          name: storyteller.name,
          bio: storyteller.bio,
          expertise: storyteller.expertise || [],
          location: storyteller.location,
          profilePicture: storyteller.profileImage,
          role: storyteller.role,
          organization: storyteller.organization,
          experience: `${storyteller.project} community member`,
          availability: 'Available for mentoring',
          mentorshipStyle: 'Community-based support',
          successStories: Math.floor(Math.random() * 10) + 5, // Mock data
          rating: (Math.random() * 1 + 4).toFixed(1), // 4.0-5.0 rating
          totalMentees: Math.floor(Math.random() * 20) + 10,
          tags: storyteller.tags || [],
          verified: storyteller.verified,
          badges: storyteller.hasStory ? ['Storyteller'] : [],
          hourlyRate: 'Free',
          responseTime: 'within 24hrs',
          project: storyteller.project,
          hasStory: storyteller.hasStory,
          hasMedia: storyteller.hasMedia
        }));
        setMentors(transformedMentors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMentors();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  <div className="h-3 w-32 bg-gray-300 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300 rounded"></div>
                <div className="h-3 w-3/4 bg-gray-300 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
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
          <p className="text-red-600 mb-4">Error loading mentors: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mentors.map((mentor) => (
        <Card key={mentor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={mentor.profilePicture} alt={mentor.name} />
                <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg truncate">{mentor.name}</CardTitle>
                  {mentor.verified && <CheckCircle className="h-4 w-4 text-blue-600" />}
                </div>
                <CardDescription className="text-sm">
                  {mentor.role} at {mentor.organization}
                </CardDescription>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{mentor.rating || '4.8'}</span>
                  <span className="text-sm text-gray-500">
                    ({mentor.totalMentees || 15} mentees)
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Bio */}
            <p className="text-sm text-gray-600 line-clamp-3">{mentor.bio}</p>
            
            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-1">
              {mentor.expertise.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {mentor.expertise.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{mentor.expertise.length - 3} more
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{mentor.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="truncate">{mentor.availability || 'Available'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-400" />
                <span className="truncate">{mentor.experience || 'Community member'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="truncate">{mentor.successStories || 8} success stories</span>
              </div>
            </div>

            {/* Rate & Response Time */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-green-600">{mentor.hourlyRate || 'Free'}</span>
              <span className="text-gray-500">Responds {mentor.responseTime || 'within 24hrs'}</span>
            </div>

            {/* Badges */}
            {mentor.badges && mentor.badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {mentor.badges.slice(0, 2).map((badge) => (
                  <Badge key={badge} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Link href={`/mentors/${mentor.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Button size="sm" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-1" />
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
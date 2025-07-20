'use client';

import { useState, useEffect } from 'react';
import { StoryGrid } from '@/components/stories/StoryGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  PenSquare, 
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Shield,
  Search,
  Filter,
  Heart,
  BookOpen,
  Star,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function StoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-neutral-900 dark:bg-neutral-100 rounded-sm"></div>
                <h1 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">JusticeHub</h1>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Link href="/mentors">
                <Button variant="outline" size="sm">Mentors</Button>
              </Link>
              <Link href="/stories/new">
                <Button size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                  <PenSquare className="h-4 w-4 mr-1" />
                  Share Story
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Magazine Style */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-4 text-sm uppercase tracking-wider text-accent-600 font-medium">
              STORIES & VOICES
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6 text-neutral-900 dark:text-neutral-100">
              Stories That Inspire Change
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10 leading-relaxed">
              Discover stories from youth across communities, share your journey, 
              and connect with others who understand your path.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/stories/new">
                <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                  <PenSquare className="h-5 w-5 mr-2" />
                  Share Your Story
                </Button>
              </Link>
              <Link href="/stories/browse">
                <Button variant="outline" size="lg">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse All Stories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Section - Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center py-6 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-neutral-700 dark:text-neutral-300" />
            <div className="text-3xl font-light text-neutral-900 dark:text-neutral-100">1,200+</div>
            <div className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">Stories Shared</div>
          </div>
          <div className="text-center py-6 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
            <Heart className="h-8 w-8 mx-auto mb-3 text-neutral-700 dark:text-neutral-300" />
            <div className="text-3xl font-light text-neutral-900 dark:text-neutral-100">15K+</div>
            <div className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">Lives Touched</div>
          </div>
          <div className="text-center py-6 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
            <Users className="h-8 w-8 mx-auto mb-3 text-neutral-700 dark:text-neutral-300" />
            <div className="text-3xl font-light text-neutral-900 dark:text-neutral-100">500+</div>
            <div className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">Community Members</div>
          </div>
          <div className="text-center py-6">
            <TrendingUp className="h-8 w-8 mx-auto mb-3 text-neutral-700 dark:text-neutral-300" />
            <div className="text-3xl font-light text-neutral-900 dark:text-neutral-100">85%</div>
            <div className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-1">Success Rate</div>
          </div>
        </div>

        {/* Search and Filters - Minimal Design */}
        <div className="mb-12">
          <div className="flex gap-4 items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="search"
                placeholder="Search stories by title, content, or themes..."
                value={mounted ? searchQuery : ''}
                onChange={(e) => mounted && setSearchQuery(e.target.value)}
                className="pl-10 border-neutral-200 dark:border-neutral-800"
                disabled={!mounted}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Story Type Filters - Clean Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border-neutral-300 dark:border-neutral-700">
              Transformation
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border-neutral-300 dark:border-neutral-700">
              Advocacy
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border-neutral-300 dark:border-neutral-700">
              Healing
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border-neutral-300 dark:border-neutral-700">
              Education
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border-neutral-300 dark:border-neutral-700">
              Second Chances
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border-neutral-300 dark:border-neutral-700">
              Foster Care
            </Badge>
          </div>
        </div>

        {/* Featured Stories - Magazine Layout */}
        <div className="mb-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent-600" />
              <span className="text-sm uppercase tracking-wider text-accent-600 font-medium">FEATURED</span>
            </div>
            <h2 className="text-3xl font-light text-neutral-900 dark:text-neutral-100">Stories from JusticeHub Community</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Real stories from young people who have transformed their challenges into opportunities.
            </p>
          </div>
          <StoryGrid />
        </div>

        {/* Privacy & Safety Notice - Clean Design */}
        <Card className="mb-12 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-neutral-700 dark:text-neutral-300 mt-1" />
              <div>
                <h3 className="font-medium text-lg mb-3 text-neutral-900 dark:text-neutral-100">Your Stories, Your Control</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  At JusticeHub, you decide who sees your story. Choose from public sharing to inspire others, 
                  organization-only for trusted networks, or anonymous options to protect your identity.
                </p>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                    <span className="text-neutral-700 dark:text-neutral-300"><span className="font-medium">Public:</span> Inspire everyone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                    <span className="text-neutral-700 dark:text-neutral-300"><span className="font-medium">Network:</span> Share safely</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                    <span className="text-neutral-700 dark:text-neutral-300"><span className="font-medium">Anonymous:</span> Stay protected</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Stories Create Impact - Editorial Style */}
        <div className="mb-12 py-12 border-t border-b border-neutral-200 dark:border-neutral-800">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-light mb-3 text-neutral-900 dark:text-neutral-100">How Your Story Creates Impact</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Every story shared creates ripples of change in our community
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">Inspire Others</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Your journey shows others what's possible and gives them hope for their own transformation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">Build Community</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Connect with others who understand your experience and create lasting support networks.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">Drive Change</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Influence policy, funding decisions, and program development with real-world impact data.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action - Clean CTA */}
        <Card className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-light mb-4">Ready to Share Your Story?</h3>
            <p className="text-lg mb-8 text-neutral-300 dark:text-neutral-700 max-w-2xl mx-auto">
              Your experience matters. Your voice can change lives. Join our community of storytellers 
              who are turning their journeys into opportunities.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/stories/new">
                <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800">
                  <PenSquare className="h-5 w-5 mr-2" />
                  Start Writing
                </Button>
              </Link>
              <Link href="/mentors">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-neutral-900 dark:border-neutral-900 dark:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white">
                  <Users className="h-5 w-5 mr-2" />
                  Find a Mentor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
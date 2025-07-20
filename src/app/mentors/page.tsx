'use client';

import { useState, useEffect } from 'react';
import { MentorGrid } from '@/components/mentors/MentorGrid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  Users,
  Star,
  Globe,
  Award,
  Sparkles,
  CheckCircle,
  Heart,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">JusticeHub</h1>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Link href="/stories">
                <Button variant="outline" size="sm">Stories</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">
              Connect with Mentors Who Understand Your Journey
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Find experienced mentors who have walked similar paths and are ready to guide 
              you toward your goals. Every mentor on JusticeHub has overcome challenges and 
              wants to help you do the same.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">150+</div>
              <div className="text-sm text-gray-600">Active Mentors</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm text-gray-600">Success Stories</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">25+</div>
              <div className="text-sm text-gray-600">Expertise Areas</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Heart className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold">4.8</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search mentors by name, expertise, or organization..."
                  value={mounted ? searchQuery : ''}
                  onChange={(e) => mounted && setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={!mounted}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Technology
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Mental Health
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Legal Advocacy
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Art Therapy
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Foster Care
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Entrepreneurship
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Featured Mentors Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Featured Mentors from JusticeHub Community</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Meet some of our most impactful mentors who have helped hundreds of young people 
            transform their stories into opportunities.
          </p>
          <MentorGrid />
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">How Mentorship Works</CardTitle>
            <CardDescription className="text-center">
              Simple steps to connect with the right mentor for your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Browse & Search</h3>
                <p className="text-sm text-gray-600">
                  Explore mentor profiles by expertise, location, and experience. Read their stories and approach.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Connect</h3>
                <p className="text-sm text-gray-600">
                  Send a connection request explaining your goals and what you hope to learn.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Grow Together</h3>
                <p className="text-sm text-gray-600">
                  Work with your mentor on goals, skills, and opportunities that align with your vision.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Find Your Mentor?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of young people who have found guidance, support, and opportunities 
              through meaningful mentorship connections.
            </p>
            <Link href="/mentors/find">
              <Button size="lg" variant="secondary">
                Start Your Mentor Search
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
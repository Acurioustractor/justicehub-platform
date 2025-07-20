'use client';

import { useState, useEffect } from 'react';
import { useUserContext } from '@/contexts/UserContext';
// Simplified dashboard without complex stats
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User,
  BookOpen,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  MessageSquare,
  Heart,
  Users,
  Briefcase,
  Star,
  ArrowRight,
  Plus,
  Edit,
  Eye,
  Sparkles,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useMatchNotifications } from '@/components/notifications/MatchNotifications';

interface YouthStats {
  storiesWritten: number;
  storiesPublished: number;
  totalViews: number;
  totalLikes: number;
  connectionsWithMentors: number;
  opportunitiesApplied: number;
  achievementsEarned: number;
  journeyProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'story' | 'connection' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  date: Date;
  icon: any;
}

export default function YouthDashboard() {
  const { user, isLoading } = useUserContext();
  // Mock stats for simplified dashboard
  const stats = null;
  const statsLoading = false;
  const { unreadCount } = useMatchNotifications();

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'story',
      title: 'Published "My Journey to Leadership"',
      description: 'Your story is now live and inspiring others',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2),
      icon: BookOpen
    },
    {
      id: '2',
      type: 'connection',
      title: 'Connected with Sarah Chen',
      description: 'Tech mentor specializing in web development',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      icon: Users
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Applied to Summer Coding Bootcamp',
      description: 'Application submitted successfully',
      date: new Date(Date.now() - 1000 * 60 * 60 * 48),
      icon: Briefcase
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Earned "Storyteller" Badge',
      description: 'For publishing 5 stories',
      date: new Date(Date.now() - 1000 * 60 * 60 * 72),
      icon: Trophy
    }
  ]);

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'youth') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>This dashboard is for youth members only.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.profile?.firstName || user.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your journey progress and latest updates
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/notifications">
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="ml-2">
                    {unreadCount > 0 ? `${unreadCount} new` : 'Notifications'}
                  </span>
                </Link>
              </Button>
              <Button asChild>
                <Link href="/profile/edit">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </div>

          {/* Journey Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Your Journey Progress</h3>
                  <p className="text-sm text-gray-600">Keep going! You're doing great</p>
                </div>
                <span className="text-2xl font-bold">{stats?.journeyProgress || 0}%</span>
              </div>
              <Progress value={stats?.journeyProgress || 0} className="h-3" />
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.storiesWritten || 0}</p>
                  <p className="text-xs text-gray-600">Stories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.connectionsWithMentors || 0}</p>
                  <p className="text-xs text-gray-600">Mentors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.opportunitiesApplied || 0}</p>
                  <p className="text-xs text-gray-600">Applications</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats?.achievementsEarned || 0}</p>
                  <p className="text-xs text-gray-600">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DreamTrack CTA */}
        <Card className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">🚀 Try the New DreamTrack Dashboard!</h3>
                <p className="text-sm opacity-90">
                  Track your momentum, showcase skills, and level up your journey
                </p>
              </div>
              <Link href="/dashboard/dreamtrack">
                <Button variant="secondary" size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Launch DreamTrack
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/stories/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Write a Story</h3>
                <p className="text-sm text-gray-600 mt-1">Share your experiences</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mentors/matches">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold">Find Mentors</h3>
                <p className="text-sm text-gray-600 mt-1">Get personalized matches</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/opportunities/matches">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold">Matched Opportunities</h3>
                <p className="text-sm text-gray-600 mt-1">Personalized for you</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/achievements">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
                <h3 className="font-semibold">Achievements</h3>
                <p className="text-sm text-gray-600 mt-1">Track your wins</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">My Stories</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Story Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Story Impact</CardTitle>
                    <CardDescription>See how your stories are inspiring others</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold">{stats?.storiesPublished || 0}</p>
                        <p className="text-sm text-gray-600">Published</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
                        <p className="text-sm text-gray-600">Total Views</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Heart className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <p className="text-2xl font-bold">{stats?.totalLikes || 0}</p>
                        <p className="text-sm text-gray-600">Likes</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold">18</p>
                        <p className="text-sm text-gray-600">Comments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest actions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div key={activity.id} className="flex items-start gap-4">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(activity.date, 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View All Activity
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Suggested Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/stories/new" className="block">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <span className="text-sm">Write about a recent challenge</span>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                    <Link href="/mentors/matches" className="block">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="text-sm">Find your perfect mentor match</span>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                    <Link href="/opportunities" className="block">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-5 w-5 text-green-600" />
                          <span className="text-sm">Browse new opportunities</span>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Achievements Preview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Achievements</CardTitle>
                      <Link href="/achievements">
                        <Button variant="ghost" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                          <Star className="h-6 w-6 mx-auto text-yellow-600" />
                        </div>
                        <p className="text-xs mt-1">First Story</p>
                      </div>
                      <div className="text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Users className="h-6 w-6 mx-auto text-blue-600" />
                        </div>
                        <p className="text-xs mt-1">Networker</p>
                      </div>
                      <div className="text-center">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <TrendingUp className="h-6 w-6 mx-auto text-green-600" />
                        </div>
                        <p className="text-xs mt-1">Rising Star</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Stories</CardTitle>
                  <Button asChild>
                    <Link href="/stories/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Story
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your stories will appear here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>My Connections</CardTitle>
                <CardDescription>Mentors and peers you're connected with</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your connections will appear here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Applied Opportunities</CardTitle>
                <CardDescription>Track your applications and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your opportunities will appear here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
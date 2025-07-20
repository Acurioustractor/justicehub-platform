'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserContext } from '@/contexts/UserContext';
import { UnifiedStoryFeed } from '@/components/stories/UnifiedStoryFeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PenSquare, 
  Users, 
  Target, 
  Trophy,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const { user: contextUser } = useUserContext();
  const router = useRouter();

  // Development bypass
  const isDev = process.env.NODE_ENV === 'development';
  const devUser = isDev ? {
    sub: 'auth0|dev-user',
    name: 'Dev User',
    email: 'dev@example.com',
    picture: 'https://placehold.co/100x100'
  } : null;

  const currentUser = isDev ? devUser : user;
  const currentIsLoading = isDev ? false : isLoading;

  useEffect(() => {
    if (!currentIsLoading && !currentUser && !isDev) {
      router.push('/api/auth/login');
    }
  }, [currentUser, currentIsLoading, router, isDev]);

  if (currentIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser && !isDev) {
    return null;
  }

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {currentUser?.name || currentUser?.email}
              </span>
              <Link href="/api/auth/logout">
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome to your personal space. Start your journey by sharing your story.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/stories/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <PenSquare className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Create Story</h3>
                <p className="text-sm text-gray-600 mt-1">Share your journey</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mentors">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold">Find Mentors</h3>
                <p className="text-sm text-gray-600 mt-1">Connect for guidance</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/opportunities">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold">Opportunities</h3>
                <p className="text-sm text-gray-600 mt-1">Discover new paths</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
                <h3 className="font-semibold">Profile</h3>
                <p className="text-sm text-gray-600 mt-1">View your profile</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Privacy Demo Card */}
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Controls Active
            </CardTitle>
            <CardDescription>
              Your stories are protected by our privacy system. You control who sees what.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Public Stories</p>
                  <p className="text-gray-600">Visible to everyone, inspire others</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Organization/Mentor Only</p>
                  <p className="text-gray-600">Share within your trusted network</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Anonymous Option</p>
                  <p className="text-gray-600">Share publicly without revealing identity</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Feed Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Stories</TabsTrigger>
            <TabsTrigger value="mine">My Stories</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="public">Public Feed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <DevStoryFeed 
              showHeader={true}
              showStats={false}
              limit={10}
            />
          </TabsContent>

          <TabsContent value="mine">
            <Card className="p-6 text-center">
              <CardContent>
                <p className="text-gray-600 mb-4">You haven't shared any stories yet.</p>
                <Link href="/stories/new">
                  <Button>Share Your First Story</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization">
            <DevStoryFeed 
              showHeader={false}
              showStats={false}
              limit={5}
            />
          </TabsContent>

          <TabsContent value="public">
            <DevStoryFeed 
              showHeader={false}
              showStats={false}
              limit={8}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
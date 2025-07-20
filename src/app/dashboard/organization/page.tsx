'use client';

import { useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
// Simplified dashboard without complex stats
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  User,
  BookOpen,
  Briefcase,
  TrendingUp,
  Calendar,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  UserPlus,
  FileText,
  Settings,
  Download,
  Upload,
  Shield,
  Activity,
  Target,
  Award,
  Sparkles,
  Headphones
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface OrganizationStats {
  totalYouth: number;
  activeYouth: number;
  totalMentors: number;
  activeMentors: number;
  totalStories: number;
  publishedStories: number;
  totalOpportunities: number;
  activeOpportunities: number;
  engagementRate: number;
  successStories: number;
}

interface YouthMember {
  id: string;
  name: string;
  joinedDate: Date;
  storiesWritten: number;
  lastActive: Date;
  status: 'active' | 'inactive';
  progress: number;
}

export default function OrganizationDashboard() {
  const { user, isLoading } = useUserContext();
  // Mock stats for simplified dashboard
  const stats = null;
  const statsLoading = false;

  const [recentYouth] = useState<YouthMember[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      storiesWritten: 2,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'active',
      progress: 25
    },
    {
      id: '2',
      name: 'Maria Garcia',
      joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      storiesWritten: 5,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 12),
      status: 'active',
      progress: 60
    },
    {
      id: '3',
      name: 'James Chen',
      joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      storiesWritten: 8,
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'active',
      progress: 85
    }
  ]);

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'organization_staff') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>This dashboard is for organization staff only.</CardDescription>
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
                Organization Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your youth programs and track impact
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/reports">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Link>
              </Button>
            </div>
          </div>

          {/* TalentScout CTA */}
          <Card className="mb-6 bg-gradient-to-r from-orange-600 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">🎯 New: TalentScout Dashboard</h3>
                  <p className="text-sm opacity-90">
                    Real-time youth tracking, automated impact reports, and talent pipeline management
                  </p>
                </div>
                <Link href="/dashboard/talentscout">
                  <Button variant="secondary" size="lg">
                    <Headphones className="mr-2 h-4 w-4" />
                    Launch TalentScout
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Youth</p>
                    <p className="text-3xl font-bold">{stats?.totalYouth || 0}</p>
                    <p className="text-sm text-green-600">
                      +12% from last month
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Mentors</p>
                    <p className="text-3xl font-bold">{stats?.activeMentors || 0}</p>
                    <p className="text-sm text-gray-600">
                      of {stats?.totalMentors || 0} total
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Published Stories</p>
                    <p className="text-3xl font-bold">{stats?.publishedStories || 0}</p>
                    <p className="text-sm text-green-600">
                      87% publish rate
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                    <p className="text-3xl font-bold">{stats?.engagementRate || 0}%</p>
                    <p className="text-sm text-green-600">
                      +5% this week
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Impact Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Overview</CardTitle>
              <CardDescription>Your organization's collective impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{stats?.successStories || 0}</p>
                  <p className="text-sm text-gray-600">Success Stories</p>
                </div>
                <div className="text-center">
                  <Award className="h-12 w-12 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold">248</p>
                  <p className="text-sm text-gray-600">Achievements Earned</p>
                </div>
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-sm text-gray-600">Opportunities Filled</p>
                </div>
                <div className="text-center">
                  <Heart className="h-12 w-12 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-bold">1.2k</p>
                  <p className="text-sm text-gray-600">Community Interactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="youth">Youth Members</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Youth Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Youth Activity</CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/youth">View All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentYouth.map((youth) => (
                        <div key={youth.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{youth.name}</p>
                                <p className="text-sm text-gray-600">
                                  Joined {format(youth.joinedDate, 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <Badge variant={youth.status === 'active' ? 'success' : 'secondary'}>
                              {youth.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Stories</p>
                              <p className="font-medium">{youth.storiesWritten}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Progress</p>
                              <Progress value={youth.progress} className="h-2 mt-1" />
                            </div>
                            <div>
                              <p className="text-gray-600">Last Active</p>
                              <p className="font-medium">
                                {format(youth.lastActive, 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/admin/youth/invite">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Youth Members
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/admin/opportunities/new">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Post New Opportunity
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/admin/mentors/invite">
                        <Users className="h-4 w-4 mr-2" />
                        Recruit Mentors
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/admin/airtable/sync">
                        <Upload className="h-4 w-4 mr-2" />
                        Sync Airtable
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Program Health */}
                <Card>
                  <CardHeader>
                    <CardTitle>Program Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Youth Retention</span>
                          <span className="text-sm font-medium">91%</span>
                        </div>
                        <Progress value={91} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Mentor Satisfaction</span>
                          <span className="text-sm font-medium">88%</span>
                        </div>
                        <Progress value={88} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Goal Achievement</span>
                          <span className="text-sm font-medium">76%</span>
                        </div>
                        <Progress value={76} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="youth">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Youth Members</CardTitle>
                  <Button asChild>
                    <Link href="/admin/youth/invite">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Youth member management interface...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Network</CardTitle>
                <CardDescription>Manage your organization's mentors</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Mentor management interface...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardHeader>
                <CardTitle>Story Management</CardTitle>
                <CardDescription>Review and moderate youth stories</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Story management interface...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Opportunities</CardTitle>
                  <Button asChild>
                    <Link href="/admin/opportunities/new">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post Opportunity
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Opportunity management interface...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Analytics & Insights</CardTitle>
                    <CardDescription>
                      Access the Empathy Ledger for comprehensive analytics
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button asChild>
                      <Link href="/analytics">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Full Analytics
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">Engagement Analytics</p>
                          <p className="text-sm text-gray-600">User activity and participation</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-semibold">Growth Metrics</p>
                          <p className="text-sm text-gray-600">Member acquisition and retention</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Heart className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="font-semibold">Impact Score</p>
                          <p className="text-sm text-gray-600">Community outcomes and success</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6 text-center">
                  <Button asChild variant="outline" size="lg">
                    <Link href="/analytics">
                      <Heart className="h-5 w-5 mr-2" />
                      Open Empathy Ledger
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
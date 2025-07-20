'use client';

import { useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Video,
  Phone,
  MapPin,
  Star,
  ChevronRight,
  AlertCircle,
  User
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface Connection {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  mentor: {
    id: string;
    name: string;
    title: string;
    expertise: string[];
    availability: {
      timezone: string;
    };
    rating: number;
  };
  requestedAt: Date;
  startDate?: Date;
  lastContactDate?: Date;
  goals: string[];
  meetingFrequency?: string;
  upcomingSession?: {
    id: string;
    title: string;
    scheduledAt: Date;
    meetingType: string;
  };
  unreadMessages: number;
}

export default function ConnectionsPage() {
  const { user, isLoading: userLoading } = useUserContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Fetch connections
  const { data: connections, isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ['connections', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/connections');
      if (!response.ok) throw new Error('Failed to fetch connections');
      return response.json();
    },
    enabled: !!user?.id && user.role === 'youth',
  });

  if (userLoading || connectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading connections...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'youth') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Youth Access Only</CardTitle>
            <CardDescription>This page is only accessible to youth members.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredConnections = connections?.filter(connection => {
    const matchesSearch = 
      connection.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.mentor.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = 
      (activeTab === 'active' && connection.status === 'active') ||
      (activeTab === 'pending' && connection.status === 'pending') ||
      (activeTab === 'completed' && (connection.status === 'completed' || connection.status === 'cancelled'));
    
    return matchesSearch && matchesTab;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Connections</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your mentor relationships and schedule sessions
              </p>
            </div>
            <Button asChild>
              <Link href="/mentors">
                <Search className="h-4 w-4 mr-2" />
                Find Mentors
              </Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Mentors</p>
                    <p className="text-2xl font-bold">
                      {connections?.filter(c => c.status === 'active').length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold">
                      {connections?.filter(c => c.status === 'pending').length || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Sessions</p>
                    <p className="text-2xl font-bold">
                      {connections?.filter(c => c.upcomingSession).length || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unread Messages</p>
                    <p className="text-2xl font-bold">
                      {connections?.reduce((sum, c) => sum + c.unreadMessages, 0) || 0}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search mentors by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {filteredConnections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Active Connections</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any active mentor connections yet.
                  </p>
                  <Button asChild>
                    <Link href="/mentors">Browse Mentors</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Mentor Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-bold">
                          {connection.mentor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>

                      {/* Connection Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {connection.mentor.name}
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{connection.mentor.rating}</span>
                              </div>
                            </h3>
                            <p className="text-sm text-gray-600">{connection.mentor.title}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span>Since {format(connection.startDate || new Date(), 'MMM yyyy')}</span>
                              <span>{connection.meetingFrequency || 'As needed'}</span>
                              <span>{connection.mentor.availability.timezone}</span>
                            </div>
                          </div>
                          {connection.unreadMessages > 0 && (
                            <Badge variant="destructive">
                              {connection.unreadMessages} new
                            </Badge>
                          )}
                        </div>

                        {/* Goals */}
                        {connection.goals.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Goals:</p>
                            <div className="flex flex-wrap gap-2">
                              {connection.goals.map((goal, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {goal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upcoming Session */}
                        {connection.upcomingSession && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium mb-1">Next Session:</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" />
                                <span>{format(connection.upcomingSession.scheduledAt, 'MMM d, h:mm a')}</span>
                                <Badge variant="outline" className="text-xs">
                                  {connection.upcomingSession.meetingType === 'video' && <Video className="h-3 w-3 mr-1" />}
                                  {connection.upcomingSession.meetingType === 'phone' && <Phone className="h-3 w-3 mr-1" />}
                                  {connection.upcomingSession.meetingType === 'in-person' && <MapPin className="h-3 w-3 mr-1" />}
                                  {connection.upcomingSession.meetingType}
                                </Badge>
                              </div>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link href={`/connections/${connection.id}/chat`}>
                            <Button size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                              {connection.unreadMessages > 0 && (
                                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                  {connection.unreadMessages}
                                </span>
                              )}
                            </Button>
                          </Link>
                          <Link href={`/connections/${connection.id}/schedule`}>
                            <Button size="sm" variant="outline">
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </Link>
                          <Link href={`/connections/${connection.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending">
            {filteredConnections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-gray-600">
                    You don't have any pending connection requests.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{connection.mentor.name}</h4>
                          <p className="text-sm text-gray-600">
                            Requested {format(connection.requestedAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <Button size="sm" variant="outline" disabled>
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Past Connections</h3>
                <p className="text-gray-600">
                  Your completed mentorship relationships will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
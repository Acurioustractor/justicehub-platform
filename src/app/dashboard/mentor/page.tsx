'use client';

import { useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { useMentor, useMentorRequests, useRespondToRequest } from '@/hooks/useMentors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Star,
  Edit,
  Settings,
  TrendingUp,
  Award,
  BookOpen,
  Video,
  Globe,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function MentorDashboard() {
  const { user, isLoading: userLoading } = useUserContext();
  const { data: pendingRequests, isLoading: requestsLoading } = useMentorRequests('pending');
  const { data: activeRequests } = useMentorRequests('active');
  const respondToRequest = useRespondToRequest();
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  
  if (userLoading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.mentorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Mentor Profile Required</CardTitle>
            <CardDescription>You need to create a mentor profile to access this dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/mentors/apply">Apply to be a Mentor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResponse = async (request: any, action: 'accept' | 'decline') => {
    try {
      await respondToRequest.mutateAsync({
        relationshipId: request.id,
        action,
        responseMessage,
      });
      setSelectedRequest(null);
      setResponseMessage('');
      alert(`Request ${action}ed successfully!`);
    } catch (error: any) {
      alert(error.message || `Failed to ${action} request`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Mentor Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your mentorship relationships and profile
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/mentors/profile/edit">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/mentors/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Mentees</p>
                    <p className="text-3xl font-bold">{activeRequests?.requests?.length || 0}</p>
                    <p className="text-sm text-gray-600">
                      of {user.mentorProfile.maxMentees} capacity
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
                    <p className="text-sm text-gray-600">Pending Requests</p>
                    <p className="text-3xl font-bold">{pendingRequests?.requests?.length || 0}</p>
                    <p className="text-sm text-orange-600">
                      Action required
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Mentees</p>
                    <p className="text-3xl font-bold">{user.mentorProfile.totalMentees || 0}</p>
                    <p className="text-sm text-green-600">
                      All time
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <p className="text-3xl font-bold">{user.mentorProfile.rating || 0}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {user.mentorProfile.reviewCount || 0} reviews
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">Connection Requests</TabsTrigger>
            <TabsTrigger value="mentees">Active Mentees</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            {pendingRequests?.requests?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-gray-600">
                    You don't have any pending connection requests at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests?.requests?.map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Users className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.youth.name}</h3>
                              <p className="text-sm text-gray-600">
                                Requested {format(new Date(request.requestedAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-1">Message:</p>
                            <p className="text-gray-700 dark:text-gray-300">
                              {request.requestMessage || 'No message provided'}
                            </p>
                          </div>

                          {request.goals?.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium mb-1">Goals:</p>
                              <div className="flex flex-wrap gap-2">
                                {request.goals.map((goal: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">
                                    {goal}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Preferred Frequency:</span>
                              <p className="font-medium">{request.meetingFrequency || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Communication:</span>
                              <p className="font-medium">
                                {request.communicationPreference?.join(', ') || 'Any'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setResponseMessage('Looking forward to working with you!');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setResponseMessage('');
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mentees">
            <Card>
              <CardHeader>
                <CardTitle>Active Mentees</CardTitle>
                <CardDescription>Manage your current mentorship relationships</CardDescription>
              </CardHeader>
              <CardContent>
                {activeRequests?.requests?.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    You don't have any active mentees at the moment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activeRequests?.requests?.map((relationship: any) => (
                      <div key={relationship.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{relationship.youth.name}</h4>
                            <p className="text-sm text-gray-600">
                              Started {format(new Date(relationship.startDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm">
                              <Video className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Your Schedule</CardTitle>
                <CardDescription>Manage your availability and upcoming sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Schedule management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Mentoring Resources</CardTitle>
                <CardDescription>Tools and guides to help you be an effective mentor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Resources coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Response Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle>
                  {responseMessage ? 'Accept' : 'Decline'} Request
                </CardTitle>
                <CardDescription>
                  Respond to {selectedRequest.youth.name}'s connection request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Response Message (Optional)
                  </label>
                  <textarea
                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                    placeholder="Add a message..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(null);
                      setResponseMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleResponse(selectedRequest, responseMessage ? 'accept' : 'decline')}
                    disabled={respondToRequest.isPending}
                  >
                    {respondToRequest.isPending ? 'Processing...' : 'Confirm'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
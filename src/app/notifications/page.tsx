'use client';

import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchNotifications, useMatchNotifications } from '@/components/notifications/MatchNotifications';
import { Bell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, isLoading } = useUserContext();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    unreadCount
  } = useMatchNotifications();

  const handleViewMatch = (mentorId: string) => {
    window.location.href = `/mentors/${mentorId}`;
  };

  const handleViewConnection = (mentorId: string) => {
    window.location.href = `/connections/${mentorId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your notifications.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-gray-600">
                  Stay updated on mentor matches and connections
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <MatchNotifications
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDismiss={dismissNotification}
          onViewMatch={handleViewMatch}
          onViewConnection={handleViewConnection}
        />
      </div>
    </div>
  );
}
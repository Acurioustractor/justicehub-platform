'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  X,
  Eye,
  UserCheck,
  Star,
  Heart,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

export interface MatchNotification {
  id: string;
  type: 'new_match' | 'connection_request' | 'connection_accepted' | 'connection_declined' | 'mentor_message';
  title: string;
  message: string;
  mentorId?: string;
  mentorName?: string;
  matchScore?: number;
  timestamp: Date;
  read: boolean;
  actionRequired?: boolean;
}

interface MatchNotificationsProps {
  notifications: MatchNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
  onViewMatch?: (mentorId: string) => void;
  onViewConnection?: (mentorId: string) => void;
}

export function MatchNotifications({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onViewMatch,
  onViewConnection
}: MatchNotificationsProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const getNotificationIcon = (type: MatchNotification['type']) => {
    switch (type) {
      case 'new_match':
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case 'connection_request':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'connection_accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'connection_declined':
        return <X className="h-5 w-5 text-red-600" />;
      case 'mentor_message':
        return <MessageSquare className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: MatchNotification['type']) => {
    switch (type) {
      case 'new_match':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20';
      case 'connection_request':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'connection_accepted':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'connection_declined':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'mentor_message':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getActionButton = (notification: MatchNotification) => {
    switch (notification.type) {
      case 'new_match':
        return (
          <Button
            size="sm"
            onClick={() => onViewMatch?.(notification.mentorId!)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Match
          </Button>
        );
      case 'connection_request':
        return (
          <Button
            size="sm"
            onClick={() => onViewConnection?.(notification.mentorId!)}
          >
            <UserCheck className="h-3 w-3 mr-1" />
            Respond
          </Button>
        );
      case 'connection_accepted':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewConnection?.(notification.mentorId!)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Start Chatting
          </Button>
        );
      default:
        return null;
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-gray-600">
            You'll see updates about mentor matches and connections here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              {actionRequiredCount > 0 && ` • ${actionRequiredCount} require action`}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Action Required Alert */}
      {actionRequiredCount > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            You have {actionRequiredCount} notification{actionRequiredCount !== 1 ? 's' : ''} that require your attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card 
            key={notification.id}
            className={`transition-all duration-200 ${
              !notification.read 
                ? `${getNotificationColor(notification.type)} border-l-4` 
                : 'opacity-75'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <div className="flex items-center gap-2 ml-2">
                      {notification.matchScore && (
                        <Badge variant="secondary" className="text-xs">
                          {notification.matchScore}% match
                        </Badge>
                      )}
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  
                  {notification.mentorName && (
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{notification.mentorName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {format(notification.timestamp, 'MMM d, h:mm a')}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {getActionButton(notification)}
                      
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDismiss(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Hook for managing notifications
export function useMatchNotifications() {
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: MatchNotification[] = [
      {
        id: '1',
        type: 'new_match',
        title: 'New high-quality mentor match found!',
        message: 'Sarah Chen is a 95% match for your skills in web development and interests in technology.',
        mentorId: 'mentor-1',
        mentorName: 'Sarah Chen',
        matchScore: 95,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        actionRequired: false
      },
      {
        id: '2',
        type: 'connection_request',
        title: 'Connection request from Marcus Williams',
        message: 'Marcus would like to connect with you about community organizing and advocacy work.',
        mentorId: 'mentor-2',
        mentorName: 'Marcus Williams',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        actionRequired: true
      },
      {
        id: '3',
        type: 'connection_accepted',
        title: 'Dr. Elena Rodriguez accepted your connection!',
        message: 'You can now start chatting with Dr. Rodriguez about mental health advocacy.',
        mentorId: 'mentor-3',
        mentorName: 'Dr. Elena Rodriguez',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        actionRequired: false
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const addNotification = (notification: Omit<MatchNotification, 'id' | 'timestamp'>) => {
    const newNotification: MatchNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    addNotification,
    unreadCount: notifications.filter(n => !n.read).length
  };
}
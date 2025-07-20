import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Connection {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  mentor?: {
    id: string;
    name: string;
    title: string;
    expertise: string[];
    availability: any;
    rating: number;
  };
  youth?: {
    id: string;
    name: string;
    bio: string;
    goals: string[];
  };
  requestedAt: Date;
  startDate?: Date;
  lastContactDate?: Date;
  goals: string[];
  meetingFrequency?: string;
  communicationPreference?: string[];
  unreadMessages: number;
  upcomingSession?: any;
}

export function useConnections() {
  return useQuery<Connection[]>({
    queryKey: ['connections'],
    queryFn: async () => {
      const response = await fetch('/api/connections');
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      return response.json();
    },
  });
}

export function useConnection(connectionId: string) {
  return useQuery({
    queryKey: ['connection', connectionId],
    queryFn: async () => {
      const response = await fetch(`/api/connections/${connectionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch connection');
      }
      return response.json();
    },
    enabled: !!connectionId,
  });
}

export function useMessages(relationshipId: string) {
  return useQuery({
    queryKey: ['messages', relationshipId],
    queryFn: async () => {
      const response = await fetch(`/api/messages?relationshipId=${relationshipId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!relationshipId,
    refetchInterval: 5000, // Poll for new messages
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      relationshipId,
      content,
      type = 'text',
      metadata,
    }: {
      relationshipId: string;
      content: string;
      type?: string;
      metadata?: any;
    }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationshipId,
          content,
          type,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate messages to refetch
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.relationshipId],
      });
      // Update connections to reflect new message
      queryClient.invalidateQueries({
        queryKey: ['connections'],
      });
    },
  });
}

export function useSessions(filters?: {
  relationshipId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.relationshipId) params.append('relationshipId', filters.relationshipId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const response = await fetch(`/api/sessions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
  });
}

export function useScheduleSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      relationshipId: string;
      title: string;
      description?: string;
      scheduledAt: string;
      duration?: string;
      meetingType?: string;
      meetingLink?: string;
      meetingLocation?: string;
    }) => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule session');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate sessions
      queryClient.invalidateQueries({
        queryKey: ['sessions'],
      });
      // Update connections to show new upcoming session
      queryClient.invalidateQueries({
        queryKey: ['connections'],
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      action,
      ...data
    }: {
      sessionId: string;
      action: 'confirm' | 'cancel' | 'complete' | 'start' | 'reschedule';
      [key: string]: any;
    }) => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update session');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all sessions data
      queryClient.invalidateQueries({
        queryKey: ['sessions'],
      });
    },
  });
}
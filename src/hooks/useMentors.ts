import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface MentorFilters {
  search?: string;
  expertise?: string;
  focusArea?: string;
  availability?: string;
  minRating?: string;
  languages?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface Mentor {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  expertise: string[];
  skills: string[];
  experience: string;
  availability: {
    hours: number;
    timezone: string;
    preferredTimes: string[];
    schedule: Record<string, string[]>;
  };
  mentees: {
    current: number;
    total: number;
    capacity: number;
  };
  rating: number;
  reviewCount: number;
  verified: boolean;
  profileImage?: string;
  languages: string[];
  focusAreas: string[];
  responseTime?: string;
  acceptanceRate?: number;
}

interface MentorProfile extends Mentor {
  longBio: string;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  certifications: string[];
  mentorshipStyle: string;
  successStories: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  recentReviews?: Array<{
    id: string;
    rating: number;
    title?: string;
    content: string;
    aspects?: Record<string, number>;
    verified: boolean;
    helpful: number;
    createdAt: string;
    reviewerName: string;
  }>;
}

export function useMentors(filters: MentorFilters = {}) {
  const queryKey = ['mentors', filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.expertise) params.append('expertise', filters.expertise);
      if (filters.focusArea) params.append('focusArea', filters.focusArea);
      if (filters.availability) params.append('availability', filters.availability);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.languages?.length) params.append('languages', filters.languages.join(','));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/mentors?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }

      const data = await response.json();
      return {
        mentors: data.mentors as Mentor[],
        pagination: data.pagination,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMentor(mentorId: string) {
  return useQuery({
    queryKey: ['mentor', mentorId],
    queryFn: async () => {
      const response = await fetch(`/api/mentors/${mentorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mentor');
      }
      return response.json() as Promise<MentorProfile>;
    },
    enabled: !!mentorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConnectionStatus(mentorId: string) {
  return useQuery({
    queryKey: ['connection-status', mentorId],
    queryFn: async () => {
      const response = await fetch(`/api/mentors/${mentorId}/connect`);
      if (!response.ok) {
        throw new Error('Failed to check connection status');
      }
      return response.json();
    },
    enabled: !!mentorId,
  });
}

export function useRequestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mentorId,
      message,
      goals,
      meetingFrequency,
      communicationPreference,
    }: {
      mentorId: string;
      message: string;
      goals?: string[];
      meetingFrequency?: string;
      communicationPreference?: string[];
    }) => {
      const response = await fetch(`/api/mentors/${mentorId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          goals,
          meetingFrequency,
          communicationPreference,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send connection request');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate connection status
      queryClient.invalidateQueries({
        queryKey: ['connection-status', variables.mentorId],
      });
      // Invalidate mentor data to update mentee count
      queryClient.invalidateQueries({
        queryKey: ['mentor', variables.mentorId],
      });
    },
  });
}

export function useMentorRequests(status: string = 'pending') {
  return useQuery({
    queryKey: ['mentor-requests', status],
    queryFn: async () => {
      const response = await fetch(`/api/mentors/requests?status=${status}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mentor requests');
      }
      return response.json();
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      relationshipId,
      action,
      responseMessage,
    }: {
      relationshipId: string;
      action: 'accept' | 'decline';
      responseMessage?: string;
    }) => {
      const response = await fetch('/api/mentors/requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationshipId,
          action,
          responseMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to request');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all mentor requests
      queryClient.invalidateQueries({
        queryKey: ['mentor-requests'],
      });
      // Invalidate mentors list to update counts
      queryClient.invalidateQueries({
        queryKey: ['mentors'],
      });
    },
  });
}
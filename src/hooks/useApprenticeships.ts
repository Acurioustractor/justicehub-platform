import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  Apprenticeship, 
  ApprenticeshipWithRelations, 
  CreateApprenticeshipDto, 
  UpdateApprenticeshipDto,
  ApprenticeshipFilters 
} from '@/types/apprenticeship';

const APPRENTICESHIPS_KEY = 'apprenticeships';

// Fetch all apprenticeships with filters
export function useApprenticeships(filters?: ApprenticeshipFilters) {
  return useQuery<ApprenticeshipWithRelations[]>({
    queryKey: [APPRENTICESHIPS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        params.append('status', statusArray.join(','));
      }
      if (filters?.organizationId) params.append('organizationId', filters.organizationId);
      if (filters?.youthProfileId) params.append('youthProfileId', filters.youthProfileId);

      const response = await fetch(`/api/apprenticeships?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apprenticeships');
      }
      return response.json();
    },
  });
}

// Fetch single apprenticeship
export function useApprenticeship(id: string) {
  return useQuery<Apprenticeship>({
    queryKey: [APPRENTICESHIPS_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/apprenticeships/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apprenticeship');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create apprenticeship
export function useCreateApprenticeship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApprenticeshipDto) => {
      const response = await fetch('/api/apprenticeships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create apprenticeship');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPRENTICESHIPS_KEY] });
    },
  });
}

// Update apprenticeship
export function useUpdateApprenticeship(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateApprenticeshipDto) => {
      const response = await fetch(`/api/apprenticeships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update apprenticeship');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPRENTICESHIPS_KEY] });
      queryClient.invalidateQueries({ queryKey: [APPRENTICESHIPS_KEY, id] });
    },
  });
}

// Update apprenticeship status
export function useUpdateApprenticeshipStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, reason, notes }: { 
      status: Apprenticeship['status']; 
      reason?: string; 
      notes?: string;
    }) => {
      const response = await fetch(`/api/apprenticeships/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason, notes }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update apprenticeship status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPRENTICESHIPS_KEY] });
      queryClient.invalidateQueries({ queryKey: [APPRENTICESHIPS_KEY, id] });
    },
  });
}

// Delete apprenticeship (platform admin only)
export function useDeleteApprenticeship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/apprenticeships/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete apprenticeship');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPRENTICESHIPS_KEY] });
    },
  });
}
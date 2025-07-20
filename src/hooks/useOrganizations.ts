import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const ORGANIZATIONS_KEY = 'organizations';
const CURRENT_ORG_KEY = 'current-organization';

interface Organization {
  id: string;
  name: string;
  description?: string;
  type: string;
  logo?: string;
  website?: string;
  role?: string;
  isPrimary?: boolean;
  memberCount?: number;
}

interface CreateOrganizationData {
  name: string;
  description?: string;
  type?: string;
  website?: string;
  logo?: string;
}

interface UpdateOrganizationData {
  name?: string;
  description?: string;
  website?: string;
  logo?: string;
  settings?: any;
}

// Fetch user's organizations
export function useOrganizations() {
  return useQuery<{ organizations: Organization[]; currentOrganizationId: string | null }>({
    queryKey: [ORGANIZATIONS_KEY],
    queryFn: async () => {
      const response = await fetch('/api/organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json();
    },
  });
}

// Fetch single organization
export function useOrganization(id: string) {
  return useQuery<Organization>({
    queryKey: [ORGANIZATIONS_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create organization
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
      // Navigate to the new organization
      router.push(`/organizations/${data.organization.id}`);
    },
  });
}

// Update organization
export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update organization');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY, id] });
    },
  });
}

// Switch organization
export function useSwitchOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch organization');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all queries as organization context has changed
      queryClient.invalidateQueries();
      // Reload to update global context
      window.location.reload();
    },
  });
}

// Delete organization
export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
      router.push('/dashboard');
    },
  });
}

// Get current organization from context
export function useCurrentOrganization() {
  const { data } = useOrganizations();
  
  if (!data) return null;
  
  const currentOrg = data.organizations.find(
    org => org.id === data.currentOrganizationId
  );
  
  return currentOrg || null;
}
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { User, UserRole } from '@/types/user';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  role: UserRole;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: auth0User, error: auth0Error, isLoading: auth0Loading } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Development bypass
  const isDev = process.env.NODE_ENV === 'development';
  const devUser: User = {
    id: 'dev-user-123',
    email: 'dev@example.com',
    name: 'Dev User',
    role: 'admin' as UserRole,
    organizationId: 'org_123_dev',
    auth0Id: 'dev-auth0-123',
    profile: {
      firstName: 'Dev',
      lastName: 'User',
      name: 'Dev User',
      picture: 'https://placehold.co/100x100',
      bio: 'Development user for testing',
      location: 'Development Land',
    },
    privacySettings: {
      emailNotifications: true,
      smsNotifications: false,
      profileVisibility: 'public',
      dataSharing: false,
      analytics: true,
      marketingEmails: false,
      mentorContact: true,
      organizationContact: true,
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fetchUserProfile = async () => {
    if (!auth0User) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const userData = await response.json();
      setUser({
        ...userData,
        name: userData.profile?.name || `${userData.profile?.firstName} ${userData.profile?.lastName}`,
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDev) {
      // In development, just use the dev user
      setUser(devUser);
      setIsLoading(false);
    } else if (!auth0Loading) {
      fetchUserProfile();
    }
  }, [auth0User, auth0Loading, isDev]);
  
  // Check if user needs onboarding
  const needsOnboarding = user && (!user.profile?.name || !user.role || user.role === 'youth');

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUserProfile();
  };

  const role: UserRole = user?.role || 'youth';

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading: isDev ? false : (isLoading || auth0Loading),
        error: isDev ? null : (error || auth0Error || null),
        role,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Helper hook for role-based access
export function useRequireRole(requiredRoles: UserRole[]) {
  const { role, isLoading } = useUserContext();
  
  return {
    hasAccess: requiredRoles.includes(role),
    isLoading,
    role,
  };
}
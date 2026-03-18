'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceSession {
  id: string;
  displayName: string;
  projectSlug: string;
  locationText: string | null;
  isUpgraded: boolean;
  enrolledAt: string;
  lastActiveAt: string;
}

interface UseDeviceSessionReturn {
  session: DeviceSession | null;
  loading: boolean;
  isEnrolled: boolean;
  refresh: () => Promise<void>;
}

export function useDeviceSession(): UseDeviceSessionReturn {
  const [session, setSession] = useState<DeviceSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/enrollment/session');
      if (!res.ok) {
        setSession(null);
        return;
      }
      const data = await res.json();
      if (data.enrolled && data.session) {
        setSession(data.session);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    session,
    loading,
    isEnrolled: !!session,
    refresh,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PreviewAuth {
  isAuthenticated: boolean;
  isLoading: boolean;
  password: string;
  setPassword: (password: string) => void;
  error: string;
  handleSubmit: (e: React.FormEvent) => void;
}

export function usePreviewAuth(): PreviewAuth {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check sessionStorage first (fast path)
    const auth = sessionStorage.getItem('preview-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check if logged-in admin — auto-bypass password gate
    const checkAdmin = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'admin') {
            sessionStorage.setItem('preview-auth', 'true');
            setIsAuthenticated(true);
          }
        }
      } catch {
        // Silently fail — user can still use password
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'justice2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('preview-auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  }, [password]);

  return { isAuthenticated, isLoading, password, setPassword, error, handleSubmit };
}

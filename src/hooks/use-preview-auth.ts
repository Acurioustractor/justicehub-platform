'use client';

import { useState, useEffect, useCallback } from 'react';

const PREVIEW_PASSWORD = 'justice2026';
const STORAGE_KEY = 'preview-auth';

export function usePreviewAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem(STORAGE_KEY);
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const authenticate = useCallback((password: string): boolean => {
    if (password === PREVIEW_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  }, []);

  return { isAuthenticated, isChecking, authenticate };
}

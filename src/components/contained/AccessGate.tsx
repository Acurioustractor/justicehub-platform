'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Lock } from 'lucide-react';

interface AccessGateProps {
  slug: string;
  children: React.ReactNode;
}

const STORAGE_KEY = 'contained-access';

export function AccessGate({ slug, children }: AccessGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check localStorage for existing access
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[slug] || parsed['__global']) {
          setUnlocked(true);
        }
      }
    } catch {
      // ignore
    }
    setChecking(false);
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(false);

    try {
      const res = await fetch(`/api/contained/tour-stops/${slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        // Store access in localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[slug] = true;
        parsed['__global'] = true; // Same code unlocks all stops
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        setUnlocked(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  };

  if (checking) return null;

  if (unlocked) return <>{children}</>;

  return (
    <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-gray-800 mb-6">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Team Access
          </h1>
          <p className="text-sm text-gray-500">
            This page is shared with local planning teams. Enter the access code to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError(false); }}
            placeholder="Access code"
            autoFocus
            className="w-full bg-gray-900 border border-gray-700 px-4 py-3 text-white text-center tracking-widest placeholder:text-gray-600 focus:border-white focus:outline-none"
          />
          {error && (
            <p className="text-red-400 text-sm text-center">Invalid code. Try again.</p>
          )}
          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full px-6 py-3 text-sm font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Enter
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center mt-8">
          CONTAINED national tour — planning document
        </p>
      </div>
    </div>
  );
}

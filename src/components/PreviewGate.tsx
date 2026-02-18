'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/hooks/use-preview-auth';

interface PreviewGateProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function PreviewGate({ title, subtitle, children }: PreviewGateProps) {
  const { isAuthenticated, isChecking, authenticate } = usePreviewAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isChecking) {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticate(password)) {
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <h1 className="text-3xl font-bold mb-2 text-white">{title}</h1>
          <p className="text-gray-400">{subtitle}</p>
          <p className="text-gray-500 text-sm mt-2">This feature is password protected</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="preview-password" className="block text-sm font-medium mb-2 text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="preview-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-orange-500 focus:outline-none text-white rounded-lg"
              placeholder="Enter password"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-orange-600 transition-colors"
          >
            Access Preview
          </button>
        </form>
      </div>
    </div>
  );
}

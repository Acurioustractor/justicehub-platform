'use client';

import { useState } from 'react';

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-black mb-2">Preview Access</h1>
          <p className="text-gray-600 mb-6 text-sm">
            This article is shared for review before publication. Enter the password to continue.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input === 'curecountry') {
                setUnlocked(true);
                setError(false);
              } else {
                setError(true);
              }
            }}
          >
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 border-2 border-black text-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-600 mb-3"
            />
            {error && (
              <p className="text-red-600 text-sm font-bold mb-3">Incorrect password</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-black text-white font-bold hover:bg-red-600 transition-colors border-2 border-black"
            >
              Read Article
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

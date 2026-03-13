'use client';

import { useState } from 'react';
import { DollarSign, Search } from 'lucide-react';

interface GrantsTabsProps {
  yourGrants: React.ReactNode;
  discover: React.ReactNode;
}

export function GrantsTabs({ yourGrants, discover }: GrantsTabsProps) {
  const [tab, setTab] = useState<'yours' | 'discover'>('yours');

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('yours')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg border-2 transition-all ${
            tab === 'yours'
              ? 'border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Your Grants
        </button>
        <button
          onClick={() => setTab('discover')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg border-2 transition-all ${
            tab === 'discover'
              ? 'border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          <Search className="h-4 w-4" />
          Discover Grants
        </button>
      </div>

      {/* Tab content */}
      {tab === 'yours' ? yourGrants : discover}
    </div>
  );
}

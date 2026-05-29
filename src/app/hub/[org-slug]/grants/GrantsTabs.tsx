'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DollarSign, Search } from 'lucide-react';

interface GrantsTabsProps {
  yourGrants: React.ReactNode;
  discover: React.ReactNode;
}

export function GrantsTabs({ yourGrants, discover }: GrantsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'discover' ? 'discover' : 'yours';
  const [tab, setTab] = useState<'yours' | 'discover'>(initialTab);

  useEffect(() => {
    setTab(searchParams.get('tab') === 'discover' ? 'discover' : 'yours');
  }, [searchParams]);

  function selectTab(nextTab: 'yours' | 'discover') {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'discover') {
      params.set('tab', 'discover');
    } else {
      params.delete('tab');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2">
        <button
          onClick={() => selectTab('yours')}
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
          onClick={() => selectTab('discover')}
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

'use client';

import { useState } from 'react';
import { Newspaper, Search } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  full_name?: string;
  organization?: string;
  subscription_type: string;
  source?: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
}

const TYPE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  general: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-600' },
  steward: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600' },
  researcher: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-600' },
  youth: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-600' },
};

const TABS = ['all', 'active', 'unsubscribed'] as const;

export function SubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = subscribers.filter((s) => s.is_active).length;
  const inactiveCount = subscribers.filter((s) => !s.is_active).length;

  // Count by type
  const typeCounts = subscribers.reduce(
    (acc, s) => {
      const t = s.subscription_type || 'general';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const filtered = subscribers.filter((s) => {
    if (activeTab === 'active' && !s.is_active) return false;
    if (activeTab === 'unsubscribed' && s.is_active) return false;
    if (typeFilter !== 'all' && s.subscription_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.email?.toLowerCase().includes(q) ||
        s.full_name?.toLowerCase().includes(q) ||
        s.organization?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 24) {
      const hrs = Math.floor(diffHrs);
      if (hrs === 0) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
      return `${hrs}h ago`;
    }
    if (diffHrs < 48) return 'Yesterday';
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const types = Object.keys(typeCounts).sort();

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => { setActiveTab('active'); setTypeFilter('all'); }}
          className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
            activeTab === 'active' && typeFilter === 'all'
              ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
              : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          } bg-green-50`}
        >
          <div className="text-left">
            <div className="text-2xl font-black text-black">{activeCount}</div>
            <div className="text-xs font-bold text-green-700">Active</div>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('unsubscribed'); setTypeFilter('all'); }}
          className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
            activeTab === 'unsubscribed'
              ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
              : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          } bg-gray-50`}
        >
          <div className="text-left">
            <div className="text-2xl font-black text-black">{inactiveCount}</div>
            <div className="text-xs font-bold text-gray-700">Unsubscribed</div>
          </div>
        </button>
        {types.slice(0, 2).map((type) => {
          const tc = TYPE_COLORS[type] || TYPE_COLORS.general;
          return (
            <button
              key={type}
              onClick={() => { setActiveTab('all'); setTypeFilter(typeFilter === type ? 'all' : type); }}
              className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
                typeFilter === type
                  ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                  : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              } ${tc.bg}`}
            >
              <div className="text-left">
                <div className="text-2xl font-black text-black">{typeCounts[type]}</div>
                <div className={`text-xs font-bold ${tc.color} capitalize`}>{type}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex border-2 border-black">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                activeTab === tab ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {tab === 'all' ? `All (${subscribers.length})` : tab === 'active' ? `Active (${activeCount})` : `Unsub'd (${inactiveCount})`}
            </button>
          ))}
        </div>

        {types.length > 2 && (
          <div className="flex border-2 border-black">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-2 text-xs font-bold transition-colors ${
                typeFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              All Types
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-2 text-xs font-bold capitalize transition-colors ${
                  typeFilter === type ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search email, name, organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No subscribers match your search.' : 'No newsletter subscribers yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b-2 border-black bg-gray-50">
            <div className="text-xs font-black text-gray-500 uppercase">Email</div>
            <div className="text-xs font-black text-gray-500 uppercase">Name</div>
            <div className="text-xs font-black text-gray-500 uppercase">Organization</div>
            <div className="text-xs font-black text-gray-500 uppercase">Type</div>
            <div className="text-xs font-black text-gray-500 uppercase">Status</div>
            <div className="text-xs font-black text-gray-500 uppercase">Date</div>
          </div>

          {/* Rows */}
          {filtered.map((s) => {
            const tc = TYPE_COLORS[s.subscription_type] || TYPE_COLORS.general;
            return (
              <div key={s.id} className="grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 items-center hover:bg-gray-50 transition-colors">
                <div className="text-sm font-medium text-gray-900 truncate">{s.email}</div>
                <div className="text-sm text-gray-700 truncate">{s.full_name || '-'}</div>
                <div className="text-sm text-gray-600 truncate">{s.organization || '-'}</div>
                <div>
                  <span className={`text-xs font-bold px-2 py-1 border ${tc.border} ${tc.bg} ${tc.color} capitalize`}>
                    {s.subscription_type || 'general'}
                  </span>
                </div>
                <div>
                  <span className={`text-xs font-bold px-2 py-1 border ${
                    s.is_active
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-400 bg-gray-50 text-gray-600'
                  }`}>
                    {s.is_active ? 'Active' : 'Unsub'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.subscribed_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

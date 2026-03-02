'use client';

import { useState } from 'react';
import { CalendarCheck, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface Registration {
  id: string;
  full_name: string;
  email: string;
  organization?: string;
  phone?: string;
  registration_status: string;
  plus_one: boolean;
  dietary_requirements?: string;
  accessibility_needs?: string;
  notes?: string;
  created_at: string;
  event?: { title: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  registered: { label: 'Registered', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-600' },
  confirmed: { label: 'Confirmed', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-600' },
  attended: { label: 'Attended', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-600' },
  waitlisted: { label: 'Waitlisted', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-600' },
};

const TABS = ['all', 'registered', 'confirmed', 'cancelled', 'attended'] as const;

export function RegistrationsTable({ registrations }: { registrations: Registration[] }) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = registrations.reduce(
    (acc, r) => {
      const s = r.registration_status as string;
      if (s in acc) acc[s as keyof typeof acc]++;
      return acc;
    },
    { registered: 0, confirmed: 0, cancelled: 0, attended: 0 } as Record<string, number>,
  );

  const filtered = registrations.filter((r) => {
    if (activeTab !== 'all' && r.registration_status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.full_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.organization?.toLowerCase().includes(q) ||
        r.event?.title?.toLowerCase().includes(q)
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

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['registered', 'confirmed', 'cancelled', 'attended'] as const).map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setActiveTab(activeTab === status ? 'all' : status)}
              className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
                activeTab === status
                  ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                  : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              } ${config.bg}`}
            >
              <div className="text-left">
                <div className="text-2xl font-black text-black">{counts[status] || 0}</div>
                <div className={`text-xs font-bold ${config.color}`}>{config.label}</div>
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
              {tab} {tab === 'all' ? `(${registrations.length})` : `(${counts[tab] || 0})`}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, organization, event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No registrations match your search.' : 'No event registrations yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-4 px-6 py-3 border-b-2 border-black bg-gray-50">
            <div className="text-xs font-black text-gray-500 uppercase">Name</div>
            <div className="text-xs font-black text-gray-500 uppercase">Event</div>
            <div className="text-xs font-black text-gray-500 uppercase">Organization</div>
            <div className="text-xs font-black text-gray-500 uppercase">Status</div>
            <div className="text-xs font-black text-gray-500 uppercase">Date</div>
            <div className="w-8" />
          </div>

          {/* Rows */}
          {filtered.map((r) => {
            const config = STATUS_CONFIG[r.registration_status] || STATUS_CONFIG.registered;
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} className="border-b border-gray-200 last:border-b-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{r.email}</div>
                  </div>
                  <div className="text-sm text-gray-900 truncate">{r.event?.title || '-'}</div>
                  <div className="text-sm text-gray-600 truncate">{r.organization || '-'}</div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 border ${config.border} ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</div>
                  <div className="w-8 flex justify-end">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {r.phone && (
                        <div>
                          <span className="text-xs font-black text-gray-500 uppercase block mb-1">Phone</span>
                          <span className="text-gray-800">{r.phone}</span>
                        </div>
                      )}
                      {r.plus_one && (
                        <div>
                          <span className="text-xs font-black text-gray-500 uppercase block mb-1">Plus One</span>
                          <span className="text-gray-800">Yes</span>
                        </div>
                      )}
                      {r.dietary_requirements && (
                        <div>
                          <span className="text-xs font-black text-gray-500 uppercase block mb-1">Dietary</span>
                          <span className="text-gray-800">{r.dietary_requirements}</span>
                        </div>
                      )}
                      {r.accessibility_needs && (
                        <div>
                          <span className="text-xs font-black text-gray-500 uppercase block mb-1">Accessibility</span>
                          <span className="text-gray-800">{r.accessibility_needs}</span>
                        </div>
                      )}
                      {r.notes && (
                        <div className="col-span-full">
                          <span className="text-xs font-black text-gray-500 uppercase block mb-1">Notes</span>
                          <div className="bg-gray-50 border border-gray-200 p-3 text-gray-800 whitespace-pre-wrap">
                            {r.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

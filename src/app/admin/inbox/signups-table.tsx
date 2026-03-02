'use client';

import { useState } from 'react';
import { UserPlus, Search, CheckCircle2, XCircle } from 'lucide-react';

interface Signup {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  role: string;
  account_status?: string;
  email_verified?: boolean;
  primary_organization_id?: string;
  created_at: string;
  organization?: { name: string } | null;
}

const ROLE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  admin: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-600' },
  user: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-600' },
  org_admin: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-600' },
  member: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600' },
};

const TABS = ['all', 'verified', 'unverified'] as const;

export function SignupsTable({ signups }: { signups: Signup[] }) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const verifiedCount = signups.filter((s) => s.email_verified).length;
  const unverifiedCount = signups.filter((s) => !s.email_verified).length;

  const roleCounts = signups.reduce(
    (acc, s) => {
      const r = s.role || 'user';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const filtered = signups.filter((s) => {
    if (activeTab === 'verified' && !s.email_verified) return false;
    if (activeTab === 'unverified' && s.email_verified) return false;
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.email?.toLowerCase().includes(q) ||
        s.full_name?.toLowerCase().includes(q) ||
        s.display_name?.toLowerCase().includes(q)
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

  const roles = Object.keys(roleCounts).sort();

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => { setActiveTab('all'); setRoleFilter('all'); }}
          className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
            activeTab === 'all' && roleFilter === 'all'
              ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
              : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          } bg-white`}
        >
          <div className="text-left">
            <div className="text-2xl font-black text-black">{signups.length}</div>
            <div className="text-xs font-bold text-gray-700">Total</div>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('verified'); setRoleFilter('all'); }}
          className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
            activeTab === 'verified'
              ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
              : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          } bg-green-50`}
        >
          <CheckCircle2 className="w-5 h-5 text-green-700" />
          <div className="text-left">
            <div className="text-2xl font-black text-black">{verifiedCount}</div>
            <div className="text-xs font-bold text-green-700">Verified</div>
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('unverified'); setRoleFilter('all'); }}
          className={`flex items-center gap-3 p-4 border-2 border-black transition-all ${
            activeTab === 'unverified'
              ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
              : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          } bg-amber-50`}
        >
          <XCircle className="w-5 h-5 text-amber-700" />
          <div className="text-left">
            <div className="text-2xl font-black text-black">{unverifiedCount}</div>
            <div className="text-xs font-bold text-amber-700">Unverified</div>
          </div>
        </button>
        {roles.length > 0 && (
          <div className="flex items-center gap-2 p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-50">
            <div className="text-left">
              <div className="text-2xl font-black text-black">{roles.length}</div>
              <div className="text-xs font-bold text-blue-700">Roles</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex border-2 border-black">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                activeTab === tab ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {tab === 'all' ? `All (${signups.length})` : tab === 'verified' ? `Verified (${verifiedCount})` : `Unverified (${unverifiedCount})`}
            </button>
          ))}
        </div>

        {roles.length > 1 && (
          <div className="flex border-2 border-black">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-2 text-xs font-bold transition-colors ${
                roleFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              All Roles
            </button>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 text-xs font-bold capitalize transition-colors ${
                  roleFilter === role ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {role} ({roleCounts[role]})
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No signups match your search.' : 'No user signups yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b-2 border-black bg-gray-50">
            <div className="text-xs font-black text-gray-500 uppercase">Name</div>
            <div className="text-xs font-black text-gray-500 uppercase">Email</div>
            <div className="text-xs font-black text-gray-500 uppercase">Role</div>
            <div className="text-xs font-black text-gray-500 uppercase">Verified</div>
            <div className="text-xs font-black text-gray-500 uppercase">Joined</div>
          </div>

          {/* Rows */}
          {filtered.map((s) => {
            const rc = ROLE_COLORS[s.role] || ROLE_COLORS.user;
            return (
              <div key={s.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-gray-200 last:border-b-0 items-center hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{s.full_name || s.display_name || '-'}</div>
                  {s.organization?.name && (
                    <div className="text-xs text-gray-500 truncate">{s.organization.name}</div>
                  )}
                </div>
                <div className="text-sm text-gray-700 truncate">{s.email}</div>
                <div>
                  <span className={`text-xs font-bold px-2 py-1 border ${rc.border} ${rc.bg} ${rc.color} capitalize`}>
                    {s.role || 'user'}
                  </span>
                </div>
                <div className="flex justify-center">
                  {s.email_verified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

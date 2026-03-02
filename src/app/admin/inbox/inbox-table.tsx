'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, MailOpen, Reply, Archive, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category: string;
  message: string;
  organization?: string;
  organization_id?: string;
  status: string;
  created_at: string;
}

interface Counts {
  new: number;
  read: number;
  replied: number;
  archived: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Mail }> = {
  new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-600', icon: Mail },
  read: { label: 'Read', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-400', icon: MailOpen },
  replied: { label: 'Replied', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600', icon: Reply },
  archived: { label: 'Archived', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-600', icon: Archive },
};

const TABS = ['all', 'new', 'read', 'replied', 'archived'] as const;

export function InboxTable({ initialSubmissions, counts, organizationId }: { initialSubmissions: Submission[]; counts: Counts; organizationId?: string }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = submissions.filter((s) => {
    if (activeTab !== 'all' && s.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.organization?.toLowerCase().includes(q) ||
        s.message?.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('contact_submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(submissions.map((s) => (s.id === id ? { ...s, status } : s)));
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete submission from "${name}"? This cannot be undone.`)) return;

    setUpdatingId(id);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubmissions(submissions.filter((s) => s.id !== id));
      if (expandedId === id) setExpandedId(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission.');
    } finally {
      setUpdatingId(null);
    }
  };

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

  const totalCount = submissions.length;

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['new', 'read', 'replied', 'archived'] as const).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
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
              <Icon className={`w-5 h-5 ${config.color}`} />
              <div className="text-left">
                <div className="text-2xl font-black text-black">{counts[status]}</div>
                <div className={`text-xs font-bold ${config.color}`}>{config.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        {/* Tabs */}
        <div className="flex border-2 border-black">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${
                activeTab === tab ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {tab} {tab === 'all' ? `(${totalCount})` : `(${counts[tab as keyof Counts]})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, organization, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black text-sm font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No submissions match your search.' : 'No submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className={`grid ${organizationId ? 'grid-cols-[auto_1fr_1fr_auto_auto]' : 'grid-cols-[auto_1fr_1fr_1fr_auto_auto]'} gap-4 px-6 py-3 border-b-2 border-black bg-gray-50`}>
            <div className="w-3" />
            <div className="text-xs font-black text-gray-500 uppercase">From</div>
            {!organizationId && <div className="text-xs font-black text-gray-500 uppercase">Organization</div>}
            <div className="text-xs font-black text-gray-500 uppercase">Subject</div>
            <div className="text-xs font-black text-gray-500 uppercase">Date</div>
            <div className="text-xs font-black text-gray-500 uppercase w-28">Actions</div>
          </div>

          {/* Rows */}
          {filtered.map((s) => {
            const config = STATUS_CONFIG[s.status] || STATUS_CONFIG.new;
            const isExpanded = expandedId === s.id;
            const isUpdating = updatingId === s.id;

            return (
              <div key={s.id} className={`border-b border-gray-200 last:border-b-0 ${s.status === 'new' ? 'bg-blue-50/30' : ''}`}>
                {/* Row */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : s.id);
                    if (s.status === 'new' && !isExpanded) {
                      updateStatus(s.id, 'read');
                    }
                  }}
                  className={`w-full grid ${organizationId ? 'grid-cols-[auto_1fr_1fr_auto_auto]' : 'grid-cols-[auto_1fr_1fr_1fr_auto_auto]'} gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors items-center`}
                >
                  {/* Status dot */}
                  <div className={`w-3 h-3 rounded-full border-2 ${config.border} ${s.status === 'new' ? 'bg-blue-500' : 'bg-transparent'}`} />

                  {/* Name + Email */}
                  <div className="min-w-0">
                    <div className={`text-sm truncate ${s.status === 'new' ? 'font-black' : 'font-medium'} text-gray-900`}>
                      {s.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{s.email}</div>
                  </div>

                  {/* Organization */}
                  {!organizationId && <div className="text-sm text-gray-600 truncate">{s.organization || '-'}</div>}

                  {/* Subject */}
                  <div className="min-w-0">
                    <div className="text-sm text-gray-900 truncate">{s.subject || s.category}</div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(s.created_at)}</div>

                  {/* Expand icon */}
                  <div className="w-28 flex justify-end">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Message */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                      {/* Message Content */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-xs font-bold px-2 py-1 border ${config.border} ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{s.category}</span>
                          {s.phone && <span className="text-xs text-gray-500">{s.phone}</span>}
                        </div>

                        <div className="bg-gray-50 border border-gray-200 p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {s.message}
                        </div>

                        <div className="mt-2 text-xs text-gray-400">
                          {new Date(s.created_at).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short' })}
                        </div>
                      </div>

                      {/* Actions Panel */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <span className="text-xs font-black text-gray-500 uppercase mb-1">Set Status</span>

                        {(['new', 'read', 'replied', 'archived'] as const).map((status) => {
                          const sc = STATUS_CONFIG[status];
                          const Icon = sc.icon;
                          const isActive = s.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() => updateStatus(s.id, status)}
                              disabled={isActive || isUpdating}
                              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-2 transition-colors ${
                                isActive
                                  ? `${sc.border} ${sc.bg} ${sc.color} cursor-default`
                                  : 'border-gray-300 hover:border-black hover:bg-gray-50'
                              } ${isUpdating ? 'opacity-50' : ''}`}
                            >
                              <Icon className="w-3 h-3" />
                              {sc.label}
                            </button>
                          );
                        })}

                        <hr className="my-1 border-gray-200" />

                        <a
                          href={`mailto:${s.email}?subject=Re: ${s.subject || 'Your enquiry'}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold border-2 border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          Reply via Email
                        </a>

                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold border-2 border-red-300 text-red-600 hover:border-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
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

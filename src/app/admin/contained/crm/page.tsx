'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  Users,
  Heart,
  MessageSquare,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';

interface Contact {
  email: string;
  name: string;
  organization: string | null;
  activities: string[];
  ghl_synced: boolean;
  first_seen: string;
  last_seen: string;
}

interface Summary {
  total_contacts: number;
  newsletter: number;
  registrations: number;
  nominations: number;
  backers: number;
  reactions: number;
  tour_stories: number;
  ghl_synced: number;
}

const ACTIVITY_CONFIG: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  newsletter: { label: 'Newsletter', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Mail },
  'event-registration': { label: 'Event Reg', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Calendar },
  nominator: { label: 'Nominator', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Users },
  backer: { label: 'Backer', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Heart },
  reaction: { label: 'Reaction', color: 'bg-pink-100 text-pink-800 border-pink-300', icon: MessageSquare },
  'tour-story': { label: 'Tour Story', color: 'bg-red-100 text-red-800 border-red-300', icon: BookOpen },
};

export default function ContainedCRMPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<string | 'all'>('all');
  const [sortField, setSortField] = useState<'last_seen' | 'first_seen' | 'name' | 'activities'>('last_seen');

  useEffect(() => {
    fetch('/api/admin/contained/crm')
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Not authenticated' : res.status === 403 ? 'Not authorized' : 'Failed to load');
        return res.json();
      })
      .then((data) => {
        setSummary(data.summary);
        setContacts(data.contacts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = contacts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.email.includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.organization && c.organization.toLowerCase().includes(q))
      );
    }
    if (activityFilter !== 'all') {
      list = list.filter((c) => c.activities.includes(activityFilter));
    }
    return [...list].sort((a, b) => {
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'activities') return b.activities.length - a.activities.length;
      if (sortField === 'first_seen') return new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime();
      return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
    });
  }, [contacts, search, activityFilter, sortField]);

  const exportCSV = () => {
    const headers = ['Email', 'Name', 'Organization', 'Activities', 'GHL Synced', 'First Seen', 'Last Seen'];
    const rows = filtered.map((c) => [
      c.email,
      c.name,
      c.organization || '',
      c.activities.join('; '),
      c.ghl_synced ? 'Yes' : 'No',
      new Date(c.first_seen).toLocaleDateString('en-AU'),
      new Date(c.last_seen).toLocaleDateString('en-AU'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contained-crm-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">{error}</p>
          <Link href="/admin" className="text-blue-600 underline">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </Link>
            <h1 className="text-3xl font-black tracking-tight">
              CONTAINED CRM
            </h1>
            <p className="text-gray-500 mt-1">
              Unified supporter view across all campaign touchpoints
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            {[
              { label: 'Total', value: summary.total_contacts, icon: Users },
              { label: 'Newsletter', value: summary.newsletter, icon: Mail },
              { label: 'Registrations', value: summary.registrations, icon: Calendar },
              { label: 'Nominations', value: summary.nominations, icon: Users },
              { label: 'Backers', value: summary.backers, icon: Heart },
              { label: 'Reactions', value: summary.reactions, icon: MessageSquare },
              { label: 'Tour Stories', value: summary.tour_stories, icon: BookOpen },
              { label: 'GHL Synced', value: summary.ghl_synced, icon: CheckCircle },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white border border-gray-200 p-4 text-center"
              >
                <card.icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                <div className="text-2xl font-black">{card.value}</div>
                <div className="text-xs text-gray-500 font-medium">
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
          >
            <option value="all">All Activities</option>
            {Object.entries(ACTIVITY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as typeof sortField)}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
          >
            <option value="last_seen">Last Active</option>
            <option value="first_seen">First Seen</option>
            <option value="name">Name</option>
            <option value="activities">Most Active</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 mb-3">
          Showing {filtered.length} of {contacts.length} contacts
        </div>

        {/* Contact Table */}
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-bold text-gray-600">
                  Contact
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-600">
                  Organization
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-600">
                  Activities
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-600">
                  GHL
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-600">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr
                  key={contact.email}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-black">
                      {contact.name || '—'}
                    </div>
                    <div className="text-gray-500 text-xs">{contact.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {contact.organization || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.activities.map((a) => {
                        const cfg = ACTIVITY_CONFIG[a];
                        return (
                          <span
                            key={a}
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${
                              cfg?.color || 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            {cfg?.label || a}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {contact.ghl_synced ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(contact.last_seen).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

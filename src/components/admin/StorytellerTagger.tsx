'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Tag, Filter, CheckSquare, Square } from 'lucide-react';

interface Storyteller {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_elder: boolean;
  channels: string[];
  org_name: string | null;
}

const CHANNEL_OPTIONS = ['justicehub', 'contained'] as const;

const CHANNEL_COLORS: Record<string, string> = {
  justicehub: 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200',
  contained: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
};

const CHANNEL_COLORS_ACTIVE: Record<string, string> = {
  justicehub: 'bg-violet-600 text-white border-violet-700 hover:bg-violet-700',
  contained: 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700',
};

export function StorytellerTagger() {
  const [loading, setLoading] = useState(true);
  const [storytellers, setStorytellers] = useState<Storyteller[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'justicehub' | 'contained' | 'unassigned'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStorytellers();
  }, []);

  async function loadStorytellers() {
    try {
      const res = await fetch('/api/admin/storytellers');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();

      const mapped: Storyteller[] = (data || []).map((s: any) => ({
        id: s.id,
        display_name: s.display_name,
        avatar_url: s.avatar_url,
        bio: s.bio || null,
        is_elder: s.is_elder || false,
        channels: s.channels || [],
        org_name: s.org_name || null,
      }));

      setStorytellers(mapped);
    } catch (err) {
      console.error('Error loading storytellers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleChannel(storytellerId: string, channel: string) {
    const storyteller = storytellers.find((s) => s.id === storytellerId);
    if (!storyteller) return;

    const current = storyteller.channels;
    const newChannels = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];

    setUpdating((prev) => new Set(prev).add(storytellerId));

    try {
      const res = await fetch(`/api/admin/storytellers/${storytellerId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: newChannels }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setStorytellers((prev) =>
        prev.map((s) => (s.id === storytellerId ? { ...s, channels: newChannels } : s))
      );
    } catch (err) {
      console.error('Error toggling channel:', err);
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(storytellerId);
        return next;
      });
    }
  }

  async function bulkAddChannel(channel: string) {
    if (selectedIds.size === 0) return;

    const updates = Array.from(selectedIds).map(async (id) => {
      const storyteller = storytellers.find((s) => s.id === id);
      if (!storyteller) return;
      const current = storyteller.channels;
      if (current.includes(channel)) return;

      const newChannels = [...current, channel];
      const res = await fetch(`/api/admin/storytellers/${id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: newChannels }),
      });

      if (res.ok) {
        setStorytellers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, channels: newChannels } : s))
        );
      }
    });

    setUpdating(new Set(selectedIds));
    await Promise.all(updates);
    setUpdating(new Set());
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  }

  // Filter and search
  const filtered = storytellers.filter((s) => {
    const name = (s.display_name || '').toLowerCase();
    const orgName = (s.org_name || '').toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !orgName.includes(searchQuery.toLowerCase())) {
      return false;
    }
    const ch = s.channels;
    if (channelFilter === 'justicehub' && !ch.includes('justicehub')) return false;
    if (channelFilter === 'contained' && !ch.includes('contained')) return false;
    if (channelFilter === 'unassigned' && ch.length > 0) return false;
    return true;
  });

  // Stats
  const totalJusticehub = storytellers.filter((s) => s.channels.includes('justicehub')).length;
  const totalContained = storytellers.filter((s) => s.channels.includes('contained')).length;
  const totalUnassigned = storytellers.filter((s) => s.channels.length === 0).length;

  if (loading) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-center py-32">
          <div className="text-2xl font-black">Loading storytellers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white py-12 border-b-4 border-black">
        <div className="container-justice">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="h-10 w-10" />
            <h1 className="text-4xl md:text-5xl font-black">Syndication Channels</h1>
          </div>
          <p className="text-xl text-white/80 max-w-2xl">
            Assign Empathy Ledger storytellers to syndication channels to control where they appear.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="container-justice py-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Users className="h-6 w-6 mb-2 text-gray-600" />
            <div className="text-3xl font-black">{storytellers.length}</div>
            <div className="text-sm font-bold text-gray-600">Total (EL)</div>
          </div>
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-violet-600">{totalJusticehub}</div>
            <div className="text-sm font-bold text-gray-600">JusticeHub</div>
          </div>
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black text-amber-600">{totalContained}</div>
            <div className="text-sm font-bold text-gray-600">Contained</div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="container-justice pb-4">
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-black"
                placeholder="Search by name or organisation..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
                className="px-3 py-2 border-2 border-black font-bold"
              >
                <option value="all">All ({storytellers.length})</option>
                <option value="justicehub">JusticeHub ({totalJusticehub})</option>
                <option value="contained">Contained ({totalContained})</option>
                <option value="unassigned">Unassigned ({totalUnassigned})</option>
              </select>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
              <span className="font-bold text-sm">{selectedIds.size} selected</span>
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => bulkAddChannel(ch)}
                  className={`px-3 py-1.5 border-2 border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow ${CHANNEL_COLORS[ch]}`}
                >
                  Add to {ch}
                </button>
              ))}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Select all */}
      <section className="container-justice pb-2">
        <button
          onClick={selectAll}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900"
        >
          {selectedIds.size === filtered.length && filtered.length > 0 ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          Select all ({filtered.length})
        </button>
      </section>

      {/* Card Grid */}
      <section className="container-justice pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => {
            const isSelected = selectedIds.has(s.id);
            const isUpdating = updating.has(s.id);
            const channels = s.channels;
            const name = s.display_name || 'Unknown';

            return (
              <div
                key={s.id}
                className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                  isSelected ? 'ring-2 ring-violet-500 ring-offset-2' : ''
                } ${isUpdating ? 'opacity-60' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(s.id)}
                      className="mt-1 flex-shrink-0 text-gray-400 hover:text-gray-700"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-violet-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    {/* Photo */}
                    {s.avatar_url ? (
                      <img
                        src={s.avatar_url}
                        alt={name}
                        className="w-14 h-14 rounded-full border-2 border-black object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm truncate">{name}</h3>
                      {s.org_name && (
                        <p className="text-xs text-gray-500 truncate">{s.org_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Channel toggles */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {CHANNEL_OPTIONS.map((ch) => {
                      const active = channels.includes(ch);
                      return (
                        <button
                          key={ch}
                          onClick={() => toggleChannel(s.id, ch)}
                          disabled={isUpdating}
                          className={`px-2.5 py-1 text-xs font-bold border rounded-sm transition-colors ${
                            active ? CHANNEL_COLORS_ACTIVE[ch] : CHANNEL_COLORS[ch]
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold">No storytellers found</p>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}

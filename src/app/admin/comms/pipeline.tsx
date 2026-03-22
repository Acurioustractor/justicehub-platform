'use client';

import { useState, useEffect } from 'react';
import { Loader2, ChevronDown, Image as ImageIcon } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  status: string;
  targets: string[];
  sentDate: string | null;
  keyMessage: string;
  imageUrl: string;
  lastEdited: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Draft': { bg: '#374151', text: '#F5F0E8' },
  'Scheduled': { bg: '#1d4ed8', text: '#fff' },
  'Published': { bg: '#059669', text: '#fff' },
  'Idea': { bg: '#6b7280', text: '#fff' },
  'In Progress': { bg: '#d97706', text: '#fff' },
};

const STATUS_OPTIONS = ['Idea', 'Draft', 'In Progress', 'Scheduled', 'Published'];

export default function Pipeline() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [missingImage, setMissingImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const url = filterStatus
        ? `/api/admin/comms/notion?status=${encodeURIComponent(filterStatus)}`
        : '/api/admin/comms/notion';
      const res = await fetch(url);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setCounts(data.counts || {});
        setMissingImage(data.missingImage || 0);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filterStatus]);

  const updateStatus = async (pageId: string, newStatus: string) => {
    setUpdatingId(pageId);
    try {
      const res = await fetch('/api/admin/comms/notion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, status: newStatus }),
      });
      const data = await res.json();
      if (data.post) {
        setPosts(prev => prev.map(p => p.id === pageId ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
      setEditingStatusId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span className="text-sm opacity-60">Loading pipeline...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        {STATUS_OPTIONS.map(s => (
          <div
            key={s}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{
              backgroundColor: STATUS_COLORS[s]?.bg || '#374151',
              color: STATUS_COLORS[s]?.text || '#fff',
            }}
          >
            {s}: {counts[s] || 0}
          </div>
        ))}
        <div className="px-3 py-1.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300">
          <ImageIcon size={12} className="inline mr-1" /> Missing Image: {missingImage}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs opacity-60">Filter:</label>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setLoading(true); }}
          className="text-xs px-2 py-1 rounded border border-white/20 bg-transparent"
          style={{ color: '#F5F0E8' }}
        >
          <option value="" style={{ backgroundColor: '#0A0A0A' }}>All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} style={{ backgroundColor: '#0A0A0A' }}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Title</th>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Status</th>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Targets</th>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60">Sent Date</th>
              <th className="text-left px-4 py-2 text-xs font-medium opacity-60 w-16">Image</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 opacity-40 text-sm">
                  No posts found. {filterStatus && 'Try clearing the filter.'}
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <PostRow
                  key={post.id}
                  post={post}
                  isExpanded={expandedId === post.id}
                  isEditingStatus={editingStatusId === post.id}
                  isUpdating={updatingId === post.id}
                  onToggleExpand={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  onEditStatus={() => setEditingStatusId(editingStatusId === post.id ? null : post.id)}
                  onUpdateStatus={(s) => updateStatus(post.id, s)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostRow({
  post,
  isExpanded,
  isEditingStatus,
  isUpdating,
  onToggleExpand,
  onEditStatus,
  onUpdateStatus,
}: {
  post: Post;
  isExpanded: boolean;
  isEditingStatus: boolean;
  isUpdating: boolean;
  onToggleExpand: () => void;
  onEditStatus: () => void;
  onUpdateStatus: (status: string) => void;
}) {
  const statusStyle = STATUS_COLORS[post.status] || { bg: '#374151', text: '#F5F0E8' };

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        <td className="px-4 py-2.5 font-medium">{post.title || 'Untitled'}</td>
        <td className="px-4 py-2.5 relative">
          <button
            onClick={(e) => { e.stopPropagation(); onEditStatus(); }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {isUpdating ? <Loader2 size={10} className="animate-spin" /> : post.status || 'No Status'}
            <ChevronDown size={10} />
          </button>
          {isEditingStatus && (
            <div
              className="absolute top-full left-4 z-20 mt-1 py-1 rounded shadow-lg border border-white/20"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(s); }}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors"
                  style={{ color: '#F5F0E8' }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: STATUS_COLORS[s]?.bg || '#374151' }}
                  />
                  {s}
                </button>
              ))}
            </div>
          )}
        </td>
        <td className="px-4 py-2.5 text-xs opacity-70">
          {post.targets.length > 0 ? post.targets.join(', ') : 'LinkedIn (Personal)'}
        </td>
        <td className="px-4 py-2.5 text-xs opacity-70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          {post.sentDate || '--'}
        </td>
        <td className="px-4 py-2.5">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded border border-white/10 flex items-center justify-center">
              <ImageIcon size={14} className="opacity-30" />
            </div>
          )}
        </td>
      </tr>
      {isExpanded && post.keyMessage && (
        <tr className="border-b border-white/5">
          <td colSpan={5} className="px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="text-xs opacity-50 mb-1 uppercase tracking-wider">Key Message</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.keyMessage}</p>
          </td>
        </tr>
      )}
    </>
  );
}

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

const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-700 border-gray-300',
  'Scheduled': 'bg-blue-100 text-blue-800 border-blue-300',
  'Published': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Idea': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'In Progress': 'bg-amber-100 text-amber-800 border-amber-300',
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
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setError(null);
    try {
      const url = filterStatus
        ? `/api/admin/comms/notion?status=${encodeURIComponent(filterStatus)}`
        : '/api/admin/comms/notion';
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `API returned ${res.status}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setCounts(data.counts || {});
        setMissingImage(data.missingImage || 0);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Network error — could not reach API');
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
        <Loader2 className="animate-spin mr-2 text-gray-400" size={20} />
        <span className="text-sm text-gray-500">Loading pipeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-6 text-center">
        <p className="text-sm text-red-700 mb-2">{error}</p>
        <p className="text-xs text-red-500">
          {error === 'Unauthorized' ? 'You must be logged in as an admin.' : 'Check the browser console for details.'}
        </p>
        <button
          onClick={() => { setLoading(true); fetchPosts(); }}
          className="mt-3 px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_OPTIONS.map(s => (
          <div
            key={s}
            className={`px-3 py-1.5 rounded text-xs font-bold border ${STATUS_COLORS[s] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
          >
            {s}: {counts[s] || 0}
          </div>
        ))}
        <div className="px-3 py-1.5 rounded text-xs font-bold border bg-orange-50 text-orange-700 border-orange-200">
          <ImageIcon size={12} className="inline mr-1" /> Missing Image: {missingImage}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-gray-500">Filter:</label>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setLoading(true); }}
          className="text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-black"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600">Title</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600">Targets</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600">Sent Date</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 w-16">Image</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
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
  const statusClass = STATUS_COLORS[post.status] || 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        <td className="px-4 py-2.5 font-medium text-gray-900">{post.title || 'Untitled'}</td>
        <td className="px-4 py-2.5 relative">
          <button
            onClick={(e) => { e.stopPropagation(); onEditStatus(); }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${statusClass}`}
          >
            {isUpdating ? <Loader2 size={10} className="animate-spin" /> : post.status || 'No Status'}
            <ChevronDown size={10} />
          </button>
          {isEditingStatus && (
            <div className="absolute top-full left-4 z-20 mt-1 py-1 rounded shadow-lg border border-gray-200 bg-white">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(s); }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_COLORS[s]?.split(' ')[0] || 'bg-gray-300'}`}
                  />
                  {s}
                </button>
              ))}
            </div>
          )}
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-500">
          {post.targets.length > 0 ? post.targets.join(', ') : 'LinkedIn (Personal)'}
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          {post.sentDate || '--'}
        </td>
        <td className="px-4 py-2.5">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded border border-gray-200 flex items-center justify-center">
              <ImageIcon size={14} className="text-gray-300" />
            </div>
          )}
        </td>
      </tr>
      {isExpanded && post.keyMessage && (
        <tr className="border-b border-gray-100">
          <td colSpan={5} className="px-4 py-3 bg-gray-50">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Key Message</div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.keyMessage}</p>
          </td>
        </tr>
      )}
    </>
  );
}

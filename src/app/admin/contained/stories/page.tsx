'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Check, X } from 'lucide-react';

interface TourStory {
  id: string;
  name: string;
  email: string | null;
  tour_stop: string;
  story: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<TourStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contained/stories?status=${filter}`);
      const data = await res.json();
      setStories(data.stories || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/contained/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin/contained" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
                ← Back to Campaign
              </Link>
              <h1 className="text-4xl font-black text-black mb-2">Story Moderation</h1>
              <p className="text-lg text-gray-600">
                Review and approve tour attendee stories
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  filter === s
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 font-bold animate-pulse">
              Loading stories...
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <p className="text-xl font-bold text-gray-600">
                No {filter} stories
              </p>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Tour Stop</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Story</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-black uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{story.name}</div>
                        {story.email && (
                          <div className="text-xs text-gray-500">{story.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">{story.tour_stop}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <p className="line-clamp-3">{story.story}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 border ${STATUS_STYLES[story.status] || ''}`}>
                          {story.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(story.created_at).toLocaleDateString('en-AU')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {story.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => updateStatus(story.id, 'approved')}
                              disabled={updating === story.id}
                              className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateStatus(story.id, 'rejected')}
                              disabled={updating === story.id}
                              className="p-2 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {story.status !== 'pending' && (
                          <button
                            onClick={() => updateStatus(story.id, 'pending')}
                            disabled={updating === story.id}
                            className="text-xs font-bold text-gray-500 hover:text-black"
                          >
                            Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

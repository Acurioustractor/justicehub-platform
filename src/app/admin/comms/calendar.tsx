'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  status: string;
  sentDate: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': '#374151',
  'Scheduled': '#1d4ed8',
  'Published': '#059669',
  'Idea': '#6b7280',
  'In Progress': '#d97706',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function Calendar({ onSelectPost }: { onSelectPost?: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/admin/comms/notion');
        const data = await res.json();
        if (data.posts) setPosts(data.posts);
      } catch (err) {
        console.error('Calendar fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const today = formatDate(new Date());
  const startMonday = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  // Build 14-day grid (2 weeks)
  const days = useMemo(() => {
    const result: { date: string; label: string; dayName: string; isToday: boolean }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startMonday);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      result.push({
        date: dateStr,
        label: d.getDate().toString(),
        dayName: DAYS[i % 7],
        isToday: dateStr === today,
      });
    }
    return result;
  }, [startMonday, today]);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    for (const post of posts) {
      if (post.sentDate) {
        const key = post.sentDate.split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(post);
      }
    }
    return map;
  }, [posts]);

  const weekLabel = (offset: number) => {
    const d = new Date(startMonday);
    d.setDate(d.getDate() + offset * 7);
    return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span className="text-sm opacity-60">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(w => w - 2)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          {weekLabel(0)} - {weekLabel(1)}
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-3 text-xs px-2 py-0.5 rounded border border-white/20 hover:bg-white/10"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(w => w + 2)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium opacity-40 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells - 2 rows of 7 */}
      {[0, 1].map(week => (
        <div key={week} className="grid grid-cols-7 gap-1 mb-1">
          {days.slice(week * 7, (week + 1) * 7).map(day => {
            const dayPosts = postsByDate[day.date] || [];
            return (
              <div
                key={day.date}
                className="min-h-[80px] rounded p-1.5 border transition-colors"
                style={{
                  borderColor: day.isToday ? '#DC2626' : 'rgba(255,255,255,0.08)',
                  backgroundColor: day.isToday ? 'rgba(220,38,38,0.05)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="text-[10px] font-medium opacity-50 mb-1">
                  {day.label}
                </div>
                <div className="space-y-1">
                  {dayPosts.map(post => (
                    <button
                      key={post.id}
                      onClick={() => onSelectPost?.(post.id)}
                      className="w-full text-left p-1 rounded text-[10px] leading-tight truncate hover:brightness-125 transition-all"
                      style={{
                        backgroundColor: STATUS_COLORS[post.status] || '#374151',
                        color: '#fff',
                      }}
                      title={post.title}
                    >
                      {post.title || 'Untitled'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/10">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-[10px] opacity-60">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}

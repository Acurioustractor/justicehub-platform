'use client';

import { useState, useEffect } from 'react';
import { Database, DollarSign, Newspaper, Building2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'intervention' | 'funding' | 'media' | 'organization';
  actor: string;
  action: string;
  timestamp: string;
}

const typeConfig = {
  intervention: { icon: Database, label: 'Program' },
  funding: { icon: DollarSign, label: 'Funding' },
  media: { icon: Newspaper, label: 'Media' },
  organization: { icon: Building2, label: 'Network' },
} as const;

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity-feed')
      .then((res) => res.json())
      .then((data) => setItems(data.feed || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Happening Now
          </h2>
          <p className="text-white/60 mb-10">Live intelligence from the JusticeHub network</p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-12">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Happening Now
        </h2>
        <p className="text-white/60 mb-10">Live intelligence from the JusticeHub network</p>

        <ol className="space-y-3" aria-live="polite">
          {items.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <li
                key={item.id}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-white/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{item.actor}</span>
                    <time
                      className="shrink-0 text-xs text-white/40 uppercase tracking-wider"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      dateTime={item.timestamp}
                    >
                      {timeAgo(item.timestamp)}
                    </time>
                  </div>
                  <p className="text-sm text-white/70 mt-0.5 line-clamp-1">{item.action}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

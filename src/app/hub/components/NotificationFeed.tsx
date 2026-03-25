'use client';

import { useState, useEffect } from 'react';
import {
  Users, Building2, Newspaper, Zap, Bell, MapPin,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'new_member' | 'org_claimed' | 'media_coverage' | 'milestone' | 'action';
  message: string;
  detail?: string;
  state?: string;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  new_member: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  org_claimed: { icon: Building2, color: 'text-[#059669]', bg: 'bg-[#059669]/10' },
  media_coverage: { icon: Newspaper, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  milestone: { icon: Zap, color: 'text-[#DC2626]', bg: 'bg-[#DC2626]/10' },
  action: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function NotificationFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hub/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
        <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-3.5 h-3.5" /> Network Activity
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-[#F5F0E8]/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) return null;

  return (
    <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
      <h2 className="font-mono text-xs text-[#F5F0E8]/40 mb-4 uppercase tracking-wider flex items-center gap-2">
        <Bell className="w-3.5 h-3.5" /> Network Activity
      </h2>
      <div className="space-y-2">
        {notifications.map((n) => {
          const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.action;
          const Icon = config.icon;
          return (
            <div
              key={n.id}
              className={`p-3 border border-[#F5F0E8]/5 flex items-start gap-3 ${
                n.detail === 'In your region' ? 'border-l-2 border-l-[#DC2626]' : ''
              }`}
            >
              <div className={`p-1.5 ${config.bg} shrink-0 mt-0.5`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#F5F0E8]/80 leading-tight line-clamp-2">
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {n.detail && (
                    <span className={`text-[10px] font-mono ${
                      n.detail === 'In your region' ? 'text-[#DC2626]' : 'text-[#F5F0E8]/30'
                    }`}>
                      {n.detail === 'In your region' && <MapPin className="w-2.5 h-2.5 inline mr-0.5" />}
                      {n.detail}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[#F5F0E8]/20">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const handleShare = () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
    }

    // Track the share action (fire-and-forget, no auth required to attempt)
    fetch('/api/hub/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: 'social_share', metadata: { title, url } }),
    }).catch(() => {});
  };

  return (
    <button
      onClick={handleShare}
      className={className || "flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-black hover:bg-sand-50 transition-colors"}
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  );
}

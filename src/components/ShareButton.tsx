'use client';

import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
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

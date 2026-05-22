'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CivicClaim, formatCitation } from '@/lib/civic-intelligence/citation-format';

export function CopyCitationButton({ claim, variant = 'icon' }: { claim: CivicClaim; variant?: 'icon' | 'inline' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = formatCitation(claim);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(textarea);
    }
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono uppercase tracking-widest text-stone-600 hover:text-stone-900 border border-stone-300 rounded hover:border-stone-900 transition-colors"
        aria-label={`Copy citation for ${claim.display_label}`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Cite'}
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center justify-center w-7 h-7 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
      title="Copy citation"
      aria-label={`Copy citation for ${claim.display_label}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

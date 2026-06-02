'use client';

import { useState } from 'react';
import type { V2Media } from '@/lib/empathy-ledger/v2-client';
import { Copy, Check } from 'lucide-react';

type Annotated = V2Media & { displayUrl: string | null };

export function PhotoBrowser({ items }: { items: Annotated[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-gray-500 font-mono">No photos match. Try clearing the filter.</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((m) => {
        const caption = m.galleryCaption || m.title || m.altText || m.filename || '(no caption)';
        const isCopied = copiedId === m.id;
        return (
          <div key={m.id} className="border border-white/10 bg-gray-950 flex flex-col">
            <div className="relative aspect-square bg-black overflow-hidden">
              {m.displayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.displayUrl} alt={caption} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-gray-600 text-xs font-mono">no preview</div>
              )}
            </div>
            <div className="p-2 flex flex-col gap-1.5">
              <div className="text-[11px] font-mono text-[#F5F0E8]/85 truncate" title={m.filename || ''}>
                {m.filename || '(unnamed)'}
              </div>
              <div className="text-[10px] text-gray-500 truncate" title={caption}>{caption}</div>
              <button
                onClick={() => copy(m.id)}
                className={`mt-1 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1.5 border transition-colors ${
                  isCopied
                    ? 'border-[#059669] text-[#059669] bg-[#059669]/10'
                    : 'border-white/20 text-[#F5F0E8]/85 hover:border-[#DC2626] hover:text-[#DC2626]'
                }`}
              >
                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span className="truncate">{isCopied ? 'copied' : m.id.slice(0, 8) + '…'}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

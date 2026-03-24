'use client';

import { useState } from 'react';
import { Download, ExternalLink, Check } from 'lucide-react';

interface CardDef {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

export function ShareCardGrid({ cards }: { cards: CardDef[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleDownload = async (card: CardDef) => {
    setDownloading(card.id);
    try {
      const res = await fetch(card.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `justicehub-${card.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
    setDownloading(null);
  };

  const handleCopyUrl = (card: CardDef) => {
    const fullUrl = `${window.location.origin}${card.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(card.id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Group by category
  const categories: Record<string, CardDef[]> = {};
  for (const card of cards) {
    if (!categories[card.category]) categories[card.category] = [];
    categories[card.category].push(card);
  }

  return (
    <div className="space-y-12">
      {Object.entries(categories).map(([category, catCards]) => (
        <section key={category}>
          <h2
            className="text-lg font-bold mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {catCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden"
              >
                {/* Preview */}
                <div className="aspect-[1200/630] bg-[#0A0A0A] relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.url}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info + Actions */}
                <div className="p-4">
                  <h3 className="font-bold text-sm">{card.title}</h3>
                  <p className="text-xs text-[#0A0A0A]/50 mt-0.5">{card.description}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDownload(card)}
                      disabled={downloading === card.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-medium rounded-lg hover:bg-[#0A0A0A]/80 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3 h-3" />
                      {downloading === card.id ? 'Downloading...' : 'Download PNG'}
                    </button>
                    <button
                      onClick={() => handleCopyUrl(card)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0A0A0A]/20 text-xs font-medium rounded-lg hover:border-[#0A0A0A]/40 transition-colors"
                    >
                      {copied === card.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#059669]" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3" />
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

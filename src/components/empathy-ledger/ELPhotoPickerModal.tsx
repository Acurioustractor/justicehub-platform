'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface ELPhoto {
  id: string;
  src: string;
  thumb: string;
  label: string;
  galleryId?: string;
}

/**
 * Reusable Empathy Ledger photo picker. Calls `onPick(url)` when a photo is chosen.
 *
 * Sources:
 *  - 'all' (default) — full EL media browser with gallery filters + search.
 *    Uses `/api/empathy-ledger/media-browser`. Used on /contained/tour.
 *  - 'oonchiumpa' — Oonchiumpa org photos only, no gallery filter.
 *    Uses `/api/judges-on-country/org-media`. Used on /judges-on-country.
 *
 * To add a new scoped source, create an endpoint that returns either
 * `{ photos: [{ id, url, alt? }] }` or the media-browser shape.
 */
export type ELPhotoPickerSource = 'all' | 'oonchiumpa';

export function ELPhotoPickerModal({
  onPick,
  onClose,
  title = 'Empathy Ledger',
  source = 'all',
}: {
  onPick: (url: string) => void;
  onClose: () => void;
  title?: string;
  source?: ELPhotoPickerSource;
}) {
  const [photos, setPhotos] = useState<ELPhoto[]>([]);
  const [galleries, setGalleries] = useState<{ id: string; title: string }[]>([]);
  const [activeGallery, setActiveGallery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        if (source === 'oonchiumpa') {
          const res = await fetch('/api/judges-on-country/org-media');
          const data = await res.json();
          const items = data.photos || [];
          setPhotos(
            items.map((m: { id: string; url: string; alt?: string }) => ({
              id: m.id,
              src: m.url,
              thumb: m.url,
              label: m.alt || 'Oonchiumpa photo',
            }))
          );
          // No gallery filter on Oonchiumpa scope.
          return;
        }

        const galRes = await fetch('/api/empathy-ledger/media-browser?type=galleries&limit=100');
        const galData = await galRes.json();
        if (galData.data) {
          setGalleries(
            galData.data.map((g: { id: string; title: string }) => ({ id: g.id, title: g.title }))
          );
        }

        const mediaRes = await fetch('/api/empathy-ledger/media-browser?type=media&limit=500');
        const mediaData = await mediaRes.json();
        if (mediaData.data) {
          setPhotos(
            mediaData.data
              .filter((m: { content_type?: string; cdn_url?: string; url?: string }) => {
                const hasUrl = m.cdn_url || m.url;
                const isImage = !m.content_type || m.content_type.startsWith('image/');
                return hasUrl && isImage;
              })
              .map(
                (m: {
                  id: string;
                  title?: string;
                  filename?: string;
                  url?: string;
                  cdn_url?: string;
                  thumbnail_url?: string;
                  medium_url?: string;
                  collection_id?: string;
                }) => {
                  const src = m.cdn_url || m.url || '';
                  return {
                    id: m.id,
                    src,
                    thumb: m.thumbnail_url || m.medium_url || src,
                    label: m.title || m.filename || 'Untitled',
                    galleryId: m.collection_id || undefined,
                  };
                }
              )
          );
        }
      } catch (err) {
        console.error('EL picker load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [source]);

  const filtered = photos.filter((p) => {
    if (activeGallery && p.galleryId !== activeGallery) return false;
    if (search && !p.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] h-[90vh] bg-[#0A0A0A] border border-white/20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-[#059669] text-xs font-bold uppercase tracking-widest"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {title}
            </span>
            <span
              className="text-[#F5F0E8]/30 text-xs"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {photos.length} photos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 w-48 focus:outline-none focus:border-[#059669]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">
              &times;
            </button>
          </div>
        </div>

        {/* Gallery filters (hidden when there are no galleries, e.g. Oonchiumpa scope) */}
        {galleries.length > 0 ? (
        <div className="flex gap-2 px-4 py-2 border-b border-white/10 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveGallery(null)}
            className={`px-4 py-2.5 md:px-3 md:py-1 text-xs md:text-[10px] uppercase tracking-wider font-bold border transition-colors flex-shrink-0 ${!activeGallery ? 'border-[#059669] text-[#059669] bg-[#059669]/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            All
          </button>
          {galleries.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGallery(g.id)}
              className={`px-4 py-2.5 md:px-3 md:py-1 text-xs md:text-[10px] uppercase tracking-wider font-bold border transition-colors flex-shrink-0 ${activeGallery === g.id ? 'border-[#059669] text-[#059669] bg-[#059669]/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {g.title}
            </button>
          ))}
        </div>
        ) : null}

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#059669]" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center text-white/30 mt-20 text-xs uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              No photos found
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filtered.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => onPick(photo.src)}
                  className="relative aspect-square overflow-hidden group border-2 border-transparent hover:border-[#059669] transition-colors bg-[#111]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumb}
                    alt={photo.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <span
                      className="text-[11px] md:text-[9px] text-white px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {photo.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

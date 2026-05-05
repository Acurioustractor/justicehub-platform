'use client';

import { useCallback, useEffect, useState } from 'react';
import { ELPhotoPickerModal } from '@/components/empathy-ledger/ELPhotoPickerModal';

// Same swap-mode contract as /contained/tour: visit any /contained page
// with ?admin=1 once, swap mode persists in localStorage. Photo overrides
// persist server-side via /api/admin/contained/photo-overrides.
function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      localStorage.setItem('contained-admin', '1');
      setIsAdmin(true);
    } else if (params.get('admin') === '0') {
      localStorage.removeItem('contained-admin');
      setIsAdmin(false);
    } else {
      setIsAdmin(localStorage.getItem('contained-admin') === '1');
    }
  }, []);
  return isAdmin;
}

function usePhotoOverrides() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch('/api/admin/contained/photo-overrides')
      .then((r) => r.json())
      .then((data) => {
        if (data.overrides && Object.keys(data.overrides).length > 0) {
          setOverrides(data.overrides);
        }
      })
      .catch(() => {});
  }, []);
  const setOverride = useCallback((key: string, url: string) => {
    setOverrides((prev) => {
      const next = { ...prev, [key]: url };
      fetch('/api/admin/contained/photo-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: next }),
      }).catch(() => {});
      return next;
    });
  }, []);
  return { overrides, setOverride };
}

interface Room {
  n: number;
  title: string;
  builder: string;
  hue: string;
  body: string;
  program: string;
  photoKey: string;
  defaultSrc: string | null;
  defaultAlt: string;
}

const ROOMS: Room[] = [
  {
    n: 1,
    title: 'The cell',
    builder: 'Brisbane young people + local youth support org',
    hue: '#DC2626',
    body: 'The first room is a detention cell, carried first by Brisbane young people who supported the build. At each tour stop, local young people with lived experience and the local youth support organisation decide what it should look like, what it should feel like, and what the public needs to sit with.',
    program: '5 days · co-design + build · paid as expertise',
    photoKey: 'how-it-works/room-1-cell',
    defaultSrc: null,
    defaultAlt: 'Room 1 — the detention cell',
  },
  {
    n: 2,
    title: 'What works',
    builder: 'David from Diagrama + Diagrama Foundation, Spain',
    hue: '#f59e0b',
    body: "The second room holds the alternative. David from Diagrama helps anchor the practice lens from Spain's Diagrama Foundation: therapeutic centres, family contact, education at the centre, and staff relationships that replace control with care. The base room stays consistent. Local context can be layered in.",
    program: 'Locally adaptable · co-developed with Diagrama',
    photoKey: 'how-it-works/room-2-therapeutic',
    defaultSrc: null,
    defaultAlt: 'Room 2 — the therapeutic alternative',
  },
  {
    n: 3,
    title: "What's already running",
    builder: 'Local organisations + young people + their staff',
    hue: '#059669',
    body: 'The third room is built by local organisations already running youth-justice work in that city. Mount Druitt gives the process a small first gathering; at the Adelaide public launch, South Australian organisations use the room to explain their programs, what they cost, and what support would let them keep young people connected.',
    program: '5 days · co-design + build · the org owns the room',
    photoKey: 'how-it-works/room-3-community',
    defaultSrc: null,
    defaultAlt: 'Room 3 — what is already running, built by a community-controlled organisation',
  },
];

export function RoomsGrid() {
  const isAdmin = useAdminMode();
  const { overrides, setOverride } = usePhotoOverrides();
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {ROOMS.map((room) => {
          const src = overrides[room.photoKey] || room.defaultSrc;
          return (
            <div
              key={room.n}
              className="border border-white/10 bg-gray-950 flex flex-col overflow-hidden"
              style={{ borderTopWidth: 4, borderTopColor: room.hue }}
            >
              <div
                className={`relative aspect-[4/3] bg-[#0A0A0A] ${isAdmin ? 'cursor-pointer group/swap' : ''}`}
                onClick={isAdmin ? () => setPickerKey(room.photoKey) : undefined}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={room.defaultAlt} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        Room {room.n}
                      </div>
                      <div className="text-[10px] text-[#F5F0E8]/30 mt-1 font-mono">
                        {isAdmin ? 'click to add photo' : 'photo coming'}
                      </div>
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div className="absolute inset-0 bg-[#DC2626]/0 group-hover/swap:bg-[#DC2626]/30 transition-colors flex items-center justify-center opacity-0 group-hover/swap:opacity-100">
                    <span
                      className="bg-[#DC2626] text-white text-xs px-3 py-2 font-bold uppercase tracking-wider"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {src ? 'Swap photo' : 'Pick photo'}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold" style={{ color: room.hue }}>
                    0{room.n}
                  </span>
                  <span
                    className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/85"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Room {room.n}
                  </span>
                </div>
                <h3 className="text-xl font-bold uppercase mb-2" style={{ letterSpacing: '-0.01em' }}>
                  {room.title}
                </h3>
                <div
                  className="text-xs uppercase tracking-[0.15em] mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: room.hue }}
                >
                  {room.builder}
                </div>
                <p
                  className="text-sm text-[#F5F0E8]/95 leading-relaxed mb-4 flex-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {room.body}
                </p>
                <div className="border-t border-white/10 pt-3">
                  <div
                    className="text-[11px] uppercase tracking-[0.15em] text-[#F5F0E8]/85"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {room.program}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pickerKey && (
        <ELPhotoPickerModal
          title={`Pick photo · ${pickerKey.split('/').pop()}`}
          source={{ project: 'contained' }}
          onPick={(url) => {
            setOverride(pickerKey, url);
            setPickerKey(null);
          }}
          onClose={() => setPickerKey(null)}
        />
      )}

      {isAdmin && (
        <p
          className="mt-6 text-[11px] text-[#F5F0E8]/50 font-mono"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Admin mode on. Click any room slot above to pick a photo from Empathy Ledger.
        </p>
      )}
    </>
  );
}

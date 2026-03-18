'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  tourStops as staticTourStops,
  journeyContainers,
  campaignMedia,
  type TourStop,
} from '@/content/campaign';

import {
  ArrowRight,
  Box,
  Check,
  CheckCircle,
  Copy,
  Heart,
  Loader2,
  Megaphone,
  Menu,
  Share2,
} from 'lucide-react';

const TourMap = dynamic(() => import('@/components/contained/TourMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] border-2 border-gray-800 bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SHARE_TEXT = 'CONTAINED: One shipping container. Three rooms. Thirty minutes. Touring Australia. #CONTAINED #YouthJustice #JusticeHub';
const SHARE_URL = 'https://justicehub.com.au/contained';

const PROOF_ORGS = [
  {
    name: 'Oonchiumpa',
    region: 'Northern Territory',
    description: 'Aboriginal-led diversion program achieving a 95% diversion rate. Culturally grounded and significantly more cost-effective.',
    stat: '95%',
    href: '/organizations/oonchiumpa',
  },
  {
    name: 'Diagrama',
    region: 'International',
    description: "Spain's model achieves just 13.6% recidivism. Therapeutic, education-centred, and focused on reintegration.",
    stat: '13.6%',
    href: '/intelligence/interventions',
  },
];

// Room photos mapped to journeyContainers
const ROOM_PHOTOS: Record<string, { src: string; alt: string }[]> = {
  'current-reality': [
    { src: campaignMedia.roomPhotos[0]?.src, alt: 'Room 1: Current Reality' },
    { src: campaignMedia.roomPhotos[6]?.src, alt: 'The container exterior' },
  ],
  'therapeutic-model': [
    { src: campaignMedia.roomPhotos[2]?.src, alt: 'Inside the container' },
    { src: campaignMedia.roomPhotos[3]?.src, alt: 'Room 2: What works' },
  ],
  'future-vision': [
    { src: campaignMedia.roomPhotos[4]?.src, alt: 'Room 3: What could be' },
    { src: campaignMedia.roomPhotos[5]?.src, alt: 'The installation' },
  ],
};

const ROOM_COLORS: Record<string, string> = {
  critical: '#DC2626',
  transitional: '#3B82F6',
  hopeful: '#059669',
};

// ---------------------------------------------------------------------------
// Bespoke Brand Button
// ---------------------------------------------------------------------------
function BrandButton({
  href,
  children,
  variant = 'primary',
  external = false,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  external?: boolean;
  className?: string;
}) {
  const base = 'relative inline-flex items-center justify-center gap-2 text-xs uppercase font-bold transition-all duration-200 group overflow-hidden';
  const variants = {
    primary: 'bg-[#DC2626] text-[#F5F0E8] px-8 py-4 hover:bg-[#b91c1c]',
    secondary: 'border-2 border-[#F5F0E8]/30 text-[#F5F0E8] px-8 py-4 hover:border-[#F5F0E8] hover:bg-[#F5F0E8]/5',
    ghost: 'text-[#DC2626] px-0 py-2 hover:text-[#F5F0E8]',
  };

  const inner = (
    <>
      <span className="relative z-10" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.2em' }}>{children}</span>
      {variant === 'primary' && (
        <span className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-t-[#F5F0E8]/20 border-l-[12px] border-l-transparent transition-all group-hover:border-t-[#F5F0E8]/40" />
      )}
      {variant === 'secondary' && (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#DC2626] transition-all duration-300 group-hover:w-full" />
      )}
    </>
  );

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${variants[variant]} ${className}`}>{inner}</a>;
  }
  return <Link href={href} className={`${base} ${variants[variant]} ${className}`}>{inner}</Link>;
}

/** Clean red-line section divider */
function RedDivider({ bg = '#0A0A0A' }: { bg?: string }) {
  return (
    <div style={{ backgroundColor: bg }} className="relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="h-px bg-[#DC2626]/30" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Photo Picker
// ---------------------------------------------------------------------------
function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      localStorage.setItem('contained-admin', '1');
      setIsAdmin(true);
    } else {
      setIsAdmin(localStorage.getItem('contained-admin') === '1');
    }
  }, []);
  return isAdmin;
}

function usePhotoOverrides() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    // Load from server (persisted for all visitors)
    fetch('/api/admin/contained/photo-overrides')
      .then(r => r.json())
      .then(data => {
        if (data.overrides && Object.keys(data.overrides).length > 0) {
          setOverrides(data.overrides);
        }
      })
      .catch(() => {});
  }, []);
  const setOverride = useCallback((key: string, url: string) => {
    setOverrides(prev => {
      const next = { ...prev, [key]: url };
      // Save to server so overrides persist across deployments
      fetch('/api/admin/contained/photo-overrides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: next }),
      }).catch(() => {});
      return next;
    });
  }, []);
  const clearOverrides = useCallback(() => {
    fetch('/api/admin/contained/photo-overrides', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: {} }),
    }).catch(() => {});
    setOverrides({});
  }, []);
  return { overrides, setOverride, clearOverrides };
}

interface ELPhoto {
  id: string;
  src: string;
  thumb: string;
  label: string;
  galleryId?: string;
}

function ELPhotoPickerModal({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [photos, setPhotos] = useState<ELPhoto[]>([]);
  const [galleries, setGalleries] = useState<{ id: string; title: string }[]>([]);
  const [activeGallery, setActiveGallery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Fetch galleries via the existing JH API proxy
        const galRes = await fetch('/api/empathy-ledger/media-browser?type=galleries&limit=100');
        const galData = await galRes.json();
        if (galData.data) setGalleries(galData.data.map((g: { id: string; title: string }) => ({ id: g.id, title: g.title })));

        // Fetch all media
        const mediaRes = await fetch('/api/empathy-ledger/media-browser?type=media&limit=500');
        const mediaData = await mediaRes.json();
        if (mediaData.data) {
          setPhotos(mediaData.data
            .filter((m: { content_type?: string; cdn_url?: string; url?: string }) => {
              const hasUrl = m.cdn_url || m.url;
              const isImage = !m.content_type || m.content_type.startsWith('image/');
              return hasUrl && isImage;
            })
            .map((m: { id: string; title?: string; filename?: string; url?: string; cdn_url?: string; thumbnail_url?: string; medium_url?: string; collection_id?: string }) => {
              const src = m.cdn_url || m.url || '';
              return {
                id: m.id,
                src,
                thumb: m.thumbnail_url || m.medium_url || src,
                label: m.title || m.filename || 'Untitled',
                galleryId: m.collection_id || undefined,
              };
            }));
        }
      } catch (err) {
        console.error('EL picker load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = photos.filter(p => {
    if (activeGallery && p.galleryId !== activeGallery) return false;
    if (search && !p.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative w-[95vw] h-[90vh] bg-[#0A0A0A] border border-white/20 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#059669] text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Empathy Ledger</span>
            <span className="text-[#F5F0E8]/30 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{photos.length} photos</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 w-48 focus:outline-none focus:border-[#059669]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            />
            <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>

        {/* Gallery filters */}
        <div className="flex gap-2 px-4 py-2 border-b border-white/10 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveGallery(null)}
            className={`px-4 py-2.5 md:px-3 md:py-1 text-xs md:text-[10px] uppercase tracking-wider font-bold border transition-colors flex-shrink-0 ${!activeGallery ? 'border-[#059669] text-[#059669] bg-[#059669]/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >All</button>
          {galleries.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGallery(g.id)}
              className={`px-4 py-2.5 md:px-3 md:py-1 text-xs md:text-[10px] uppercase tracking-wider font-bold border transition-colors flex-shrink-0 ${activeGallery === g.id ? 'border-[#059669] text-[#059669] bg-[#059669]/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >{g.title}</button>
          ))}
        </div>

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#059669]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/30 mt-20 text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>No photos found</div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filtered.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => onPick(photo.src)}
                  className="relative aspect-square overflow-hidden group border-2 border-transparent hover:border-[#059669] transition-colors bg-[#111]"
                >
                  <img src={photo.thumb} alt={photo.label} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <span className="text-[11px] md:text-[9px] text-white px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
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

function SwappablePhoto({
  src,
  alt,
  photoKey,
  isAdmin,
  overrides,
  onRequestSwap,
  className = '',
  style,
}: {
  src: string;
  alt: string;
  photoKey: string;
  isAdmin: boolean;
  overrides: Record<string, string>;
  onRequestSwap: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const displaySrc = overrides[photoKey] || src;
  return (
    <div className={`relative group/swap w-full h-full ${isAdmin ? 'cursor-pointer' : ''}`} onClick={isAdmin ? () => onRequestSwap(photoKey) : undefined}>
      <img src={displaySrc} alt={alt} className={className} style={style} loading="lazy" />
      {isAdmin && (
        <div className="absolute inset-0 bg-[#DC2626]/0 group-hover/swap:bg-[#DC2626]/30 transition-colors flex items-center justify-center opacity-0 group-hover/swap:opacity-100">
          <span className="bg-[#DC2626] text-white text-xs px-3 py-2 font-bold uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Swap Photo
          </span>
        </div>
      )}
      {isAdmin && overrides[photoKey] && (
        <span className="absolute top-1 left-1 bg-[#059669] text-white text-[11px] md:text-[9px] px-1.5 py-0.5 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Swapped
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------
function ShareButtons({ dark = true }: { dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const borderClass = dark ? 'border-white/30 text-white hover:bg-white hover:text-black' : 'border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F5F0E8]';
  const labelClass = dark ? 'text-gray-400' : 'text-gray-500';

  const shareLinks = [
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}` },
  ];

  return (
    <div className="flex items-center gap-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <Share2 className={`w-4 h-4 ${labelClass}`} />
      {shareLinks.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
          className={`px-3 py-1 text-xs font-bold border uppercase tracking-widest ${borderClass} transition-colors`}>
          {link.label}
        </a>
      ))}
      <button
        onClick={async () => { try { await navigator.clipboard.writeText(SHARE_URL); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}
        className={`px-3 py-1 text-xs font-bold border uppercase tracking-widest ${borderClass} transition-colors flex items-center gap-1`}>
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Link</>}
      </button>
    </div>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/ghl/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name || undefined, subscription_type: 'general', source: 'contained_tour', tags: ['Contained Tour 2026'] }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to subscribe'); }
      setStatus('success');
      setEmail('');
      setName('');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="border border-[#059669]/30 bg-[#059669]/10 p-6 text-center">
        <CheckCircle className="w-8 h-8 mx-auto mb-3 text-[#059669]" />
        <p className="font-bold text-lg text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>You&apos;re in.</p>
        <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>We&apos;ll keep you updated on the tour and how to get involved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm flex-1 min-w-0 focus:outline-none focus:border-[#DC2626]"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm flex-1 min-w-0 focus:outline-none focus:border-[#DC2626]"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }} />
        <button type="submit" disabled={status === 'loading'}
          className="relative px-6 py-3 bg-[#DC2626] text-white font-bold uppercase tracking-[0.2em] text-sm hover:bg-[#b91c1c] transition-colors disabled:opacity-50 flex-shrink-0 group overflow-hidden"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="relative z-10">{status === 'loading' ? 'Subscribing...' : 'Subscribe'}</span>
          <span className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-[#F5F0E8]/20 border-l-[10px] border-l-transparent" />
        </button>
      </div>
      {status === 'error' && <p className="text-[#DC2626] text-sm">{errorMsg}</p>}
      <p className="text-gray-600 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>No spam. Unsubscribe anytime.</p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProjectStory {
  id: string;
  title: string;
  summary: string;
  story_image_url: string;
  themes: string[];
  story_category: string;
  source?: string;
  author_name?: string;
}

interface AlmaStats {
  programs_documented: number;
  programs_verified: number;
  programs_under_review: number;
  total_organizations: number;
  orgs_linked: number;
  total_evidence: number;
  total_evidence_links: number;
  rogs_youth_detention_millions: number;
  rogs_youth_community_millions: number;
  rogs_youth_total_millions: number;
  rogs_prison_billions: number;
  rogs_police_billions: number;
  rogs_indigenous_detention_ratio: number;
  rogs_total_punitive_billions: number;
  rogs_year: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function TourContent() {
  const [projectStories, setProjectStories] = useState<ProjectStory[]>([]);
  const [almaStats, setAlmaStats] = useState<AlmaStats | null>(null);
  const [stateSpending, setStateSpending] = useState<Record<string, { detention_millions: number | null; community_millions: number | null; indigenous_ratio: number | null; cost_per_child: number | null; detention_population: number | null }>>({});
  const [tourStops, setTourStops] = useState<TourStop[]>(staticTourStops);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tourStopRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Admin photo swap
  const isAdmin = useAdminMode();
  const { overrides, setOverride, clearOverrides } = usePhotoOverrides();
  const [pickerOpen, setPickerOpen] = useState(false);
  const swapTargetRef = useRef<string | null>(null);

  const handleRequestSwap = useCallback((key: string) => {
    swapTargetRef.current = key;
    setPickerOpen(true);
  }, []);

  const handlePhotoPicked = useCallback((url: string) => {
    if (swapTargetRef.current) {
      setOverride(swapTargetRef.current, url);
      swapTargetRef.current = null;
    }
    setPickerOpen(false);
  }, [setOverride]);

  useEffect(() => {
    // Stories from the contained API (EL + articles + tour stories)
    fetch('/api/contained/stories?limit=6')
      .then((res) => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectStories(data.map(s => ({
            id: s.id,
            title: s.title,
            summary: s.excerpt || '',
            story_image_url: s.story_image_url || '',
            themes: [],
            story_category: s.category || '',
            source: s.source || '',
            author_name: s.author_name || '',
          })));
        }
      })
      .catch(console.error);

    fetch('/api/homepage-stats')
      .then((res) => res.json())
      .then((data) => { if (data.stats) setAlmaStats(data.stats); })
      .catch(console.error);

    fetch('/api/justice-spending')
      .then((res) => res.json())
      .then((data) => {
        if (data.states) {
          const map: Record<string, { detention_millions: number | null; community_millions: number | null; indigenous_ratio: number | null; cost_per_child: number | null; detention_population: number | null }> = {};
          for (const s of data.states) {
            map[s.state] = {
              detention_millions: s.youth_justice?.detention_millions,
              community_millions: s.youth_justice?.community_millions,
              indigenous_ratio: s.indigenous_detention_ratio,
              cost_per_child: s.youth_justice?.cost_per_child_per_year,
              detention_population: s.youth_justice?.detention_population,
            };
          }
          setStateSpending(map);
        }
      })
      .catch(console.error);

    fetch('/api/contained/tour-stops')
      .then((res) => res.json())
      .then((data: TourStop[]) => { if (Array.isArray(data) && data.length > 0) setTourStops(data); })
      .catch(console.error);
  }, []);

  const handleMapStopClick = (eventSlug: string) => {
    const el = tourStopRefs.current[eventSlug];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-[#DC2626]');
      setTimeout(() => el.classList.remove('ring-4', 'ring-[#DC2626]'), 2000);
    }
  };

  const displayStories = projectStories.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ==================== NAVIGATION ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 flex items-center justify-between h-16">
          <Link href="/contained" className="flex items-center gap-3">
            <div className="contained-logo-mark text-[#F5F0E8]" />
            <span className="text-[#F5F0E8] text-xs font-bold uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Contained</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-[#F5F0E8]/70 hover:text-[#F5F0E8] text-xs uppercase transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Evidence</a>
            <a href="#rooms" className="text-[#F5F0E8]/70 hover:text-[#F5F0E8] text-xs uppercase transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Exhibition</a>
            <a href="#tour" className="text-[#F5F0E8]/70 hover:text-[#F5F0E8] text-xs uppercase transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Tour</a>
            <a href="#stories" className="text-[#F5F0E8]/70 hover:text-[#F5F0E8] text-xs uppercase transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Stories</a>
            <a href="#tour" className="relative bg-[#DC2626] text-[#F5F0E8] text-xs uppercase font-medium px-6 py-3 hover:bg-[#b91c1c] transition-colors inline-block group overflow-hidden" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>
              <span className="relative z-10">Back This</span>
              <span className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-[#F5F0E8]/20 border-l-[10px] border-l-transparent" />
            </a>
          </div>
          <button className="md:hidden text-[#F5F0E8]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-6 py-4 space-y-4">
            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block text-[#F5F0E8]/70 text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Evidence</a>
            <a href="#rooms" onClick={() => setMobileMenuOpen(false)} className="block text-[#F5F0E8]/70 text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Exhibition</a>
            <a href="#tour" onClick={() => setMobileMenuOpen(false)} className="block text-[#F5F0E8]/70 text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Tour</a>
            <a href="#stories" onClick={() => setMobileMenuOpen(false)} className="block text-[#F5F0E8]/70 text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Stories</a>
            <a href="#tour" onClick={() => setMobileMenuOpen(false)} className="block bg-[#DC2626] text-[#F5F0E8] text-xs uppercase font-medium px-6 py-3 text-center" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>Back This</a>
          </div>
        )}
      </nav>

      {/* Admin Photo Picker */}
      {pickerOpen && <ELPhotoPickerModal onPick={handlePhotoPicked} onClose={() => setPickerOpen(false)} />}

      {/* Admin Toolbar */}
      {isAdmin && (
        <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2">
          {Object.keys(overrides).length > 0 && (
            <>
              <button
                onClick={() => {
                  const json = JSON.stringify(overrides, null, 2);
                  navigator.clipboard.writeText(json);
                }}
                className="bg-[#059669] text-white text-xs md:text-[10px] px-3 py-2 font-bold uppercase tracking-wider hover:bg-[#047857] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Copy {Object.keys(overrides).length} Override{Object.keys(overrides).length > 1 ? 's' : ''}
              </button>
              <button
                onClick={clearOverrides}
                className="bg-[#DC2626] text-white text-xs md:text-[10px] px-3 py-2 font-bold uppercase tracking-wider hover:bg-[#b91c1c] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Reset
              </button>
            </>
          )}
          <span className="bg-[#0A0A0A] border border-white/20 text-[#F5F0E8]/50 text-[11px] md:text-[9px] px-2 py-1.5 uppercase tracking-widest" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Admin
          </span>
        </div>
      )}

      <main>
        {/* ==================== SECTION 1: HERO ==================== */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center scanline-overlay overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src={campaignMedia.cellVideoMov} type="video/quicktime" />
              <source src={campaignMedia.heroVideo.url} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[#0A0A0A]/70" />
          </div>

          <div className="relative z-20 text-center max-w-5xl mx-auto px-6 pt-20">
            <div className="hero-animate hero-animate-delay-1">
              <span className="text-[#DC2626] text-xs font-medium uppercase block mb-8" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>Help Make This Happen</span>
            </div>

            <h1 className="font-bold text-[#F5F0E8] uppercase leading-none hero-animate hero-animate-delay-2" style={{ fontSize: 'clamp(48px, 7vw, 96px)', letterSpacing: '-0.02em' }}>
              CONTAINED
            </h1>

            <div className="flex justify-center my-8 hero-animate hero-animate-delay-3">
              <div className="w-px h-16 bg-[#DC2626]" style={{ transform: 'rotate(-35deg)' }} />
            </div>

            <p className="text-[#F5F0E8]/70 text-sm max-w-2xl mx-auto leading-relaxed hero-animate hero-animate-delay-3" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}>
              One shipping container. Three rooms. Thirty minutes. Touring Australia. We are building it as we go because the people who need to see it cannot wait for perfect.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 hero-animate hero-animate-delay-4">
              <BrandButton href="#tour" variant="primary">Back This</BrandButton>
              <BrandButton href="#proof" variant="secondary">
                See the Evidence
              </BrandButton>
            </div>

            <div className="mt-16 hero-animate hero-animate-delay-5">
              <span className="text-[#F5F0E8]/40 text-xs uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.2em' }}>Where We Need Support</span>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[#F5F0E8]/60 text-xs uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>
                {tourStops.slice(0, 3).map((stop, i) => (
                  <span key={stop.eventSlug} className={i === 0 ? 'text-[#F5F0E8]' : ''}>
                    {stop.city} {i === 0 && <span className="text-[#DC2626] ml-1">●</span>}
                    {i > 0 && ` · ${stop.date}`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== SECTION 2: THE PROBLEM ==================== */}
        <section id="problem" className="relative bg-[#F5F0E8] scanline-overlay-dark overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span className="text-[#DC2626] text-xs font-medium uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>The Evidence</span>
            <h2 className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl lg:text-6xl mb-4" style={{ letterSpacing: '-0.02em' }}>The Evidence</h2>
            <p className="text-[#0A0A0A]/60 text-xs max-w-xl mb-12" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em', lineHeight: 1.8 }}>
              Australia spends $4,250 per child per day on detention. Community programs that actually work cost $75 a day. These are the facts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'First Nations', value: '65%', color: 'text-[#DC2626]', desc: 'Aboriginal and Torres Strait Islander children make up 65% of those in detention. They are 6% of the population.' },
                { label: 'Detained Nightly', value: '860', color: 'text-[#F5F0E8]', desc: 'Children are locked up on any given night across Australia. Many are on remand. Not yet convicted of any crime.' },
                { label: 'Cost Per Day', value: '$4,250', color: 'text-[#059669]', desc: 'Taxpayers spend $1.55M per child per year on detention. Community programs cost $75 a day and work better.' },
                { label: 'Recidivism Rate', value: '84%', color: 'text-[#F5F0E8]', desc: 'Of children who go through detention will return. The system does not rehabilitate. It entrenches.' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0A0A0A] p-8 relative scanline-overlay">
                  <span className="text-[#F5F0E8]/40 text-xs uppercase block mb-6 relative z-10" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.2em' }}>{stat.label}</span>
                  <span className={`font-bold text-6xl block mb-3 relative z-10 ${stat.color}`} style={{ letterSpacing: '-0.02em' }}>{stat.value}</span>
                  <p className="text-[#F5F0E8]/60 text-xs relative z-10" style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7, letterSpacing: '0.03em' }}>{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RedDivider bg="#F5F0E8" />

        {/* Full-scene two-room hero */}
        <div className="w-full bg-[#F5F0E8]">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 py-8">
            <SwappablePhoto
              photoKey="three-rooms-hero"
              src={campaignMedia.roomPhotos[0].src}
              alt="The CONTAINED installation — two rooms side by side"
              overrides={overrides}
              isAdmin={isAdmin}
              onRequestSwap={(key) => { swapTargetRef.current = key; setPickerOpen(true); }}
              className="w-full object-cover"
              style={{ maxHeight: '560px' }}
            />
          </div>
        </div>

        {/* ==================== SECTION 3: THREE ROOMS ==================== */}
        <section id="rooms" className="relative bg-[#0A0A0A] scanline-overlay concrete-texture overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span className="text-[#DC2626] text-xs font-medium uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>Inside the Container</span>
            <h2 className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-4" style={{ letterSpacing: '-0.02em' }}>Three Rooms</h2>
            <p className="text-[#F5F0E8]/50 text-xs max-w-xl mb-16" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em', lineHeight: 1.8 }}>
              Thirty minutes. Three rooms. Each one tells a different part of the story.
            </p>

            <div className="space-y-20">
              {journeyContainers.map((container, idx) => {
                const photos = ROOM_PHOTOS[container.id] || [];
                const color = ROOM_COLORS[container.tone] || '#F5F0E8';
                const isEven = idx % 2 === 1;

                const stats = container.id === 'future-vision' && almaStats
                  ? [
                      { label: 'Community Programs', value: '$75/day' },
                      { label: 'Programs on ALMA', value: almaStats.programs_documented.toLocaleString() },
                    ]
                  : container.stats.slice(0, 2);

                return (
                  <div key={container.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${isEven ? 'lg:direction-rtl' : ''}`}>
                    {/* Text side */}
                    <div className={isEven ? 'lg:order-2' : ''}>
                      <div className="pl-6" style={{ borderLeft: `4px solid ${color}` }}>
                        <span className="text-xs font-bold uppercase mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em', color }}>{container.duration}</span>
                        <h3 className="font-bold text-[#F5F0E8] text-2xl md:text-4xl lg:text-5xl uppercase mb-4" style={{ letterSpacing: '-0.02em' }}>
                          Room {container.step}: {container.title}
                        </h3>
                        <p className="text-[#F5F0E8]/70 text-sm leading-relaxed mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.03em' }}>
                          {container.summary}
                        </p>
                        <div className="flex gap-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {stats.map((stat, i) => (
                            <div key={i}>
                              <div className="text-2xl font-bold text-[#F5F0E8]">{stat.value}</div>
                              <div className="text-xs text-[#F5F0E8]/40 uppercase tracking-wider">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Photo side */}
                    <div className={`grid grid-cols-2 gap-3 ${isEven ? 'lg:order-1' : ''}`}>
                      {photos.map((photo, pi) => (
                        <div key={pi} className="relative aspect-[4/5] overflow-hidden group">
                          <SwappablePhoto
                            src={photo.src}
                            alt={photo.alt}
                            photoKey={`room-${container.id}-${pi}`}
                            isAdmin={isAdmin}
                            overrides={overrides}
                            onRequestSwap={handleRequestSwap}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                          />
                          <div className="absolute inset-0 bg-[#0A0A0A]/20 group-hover:bg-transparent transition-colors pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent pointer-events-none">
                            <span className="text-xs md:text-xs md:text-[10px] text-[#F5F0E8]/60 uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{photo.alt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Poster alongside room gallery */}
            <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <Image
                  src={campaignMedia.posterBrand}
                  alt="CONTAINED. 3 Rooms. 30 Minutes. The Truth."
                  width={400}
                  height={533}
                  className="w-full h-auto"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="lg:col-span-2">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {campaignMedia.roomPhotos.slice(0, 8).map((photo, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden group">
                      <SwappablePhoto
                        src={photo.src}
                        alt={photo.caption}
                        photoKey={`gallery-${i}`}
                        isAdmin={isAdmin}
                        overrides={overrides}
                        onRequestSwap={handleRequestSwap}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/80 px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 pointer-events-none">
                        <p className="text-[11px] md:text-[9px] font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{photo.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== SECTION 4: THE PROOF ==================== */}
        <section id="proof" className="relative bg-[#F5F0E8] scanline-overlay-dark overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0 clamp(80px, 12vw, 160px)' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span className="text-[#059669] text-xs font-medium uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>The Proof</span>
            <h2 className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl lg:text-6xl mb-4" style={{ letterSpacing: '-0.02em' }}>Programs That Work</h2>
            <p className="text-[#0A0A0A]/50 text-xs max-w-xl mb-12" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em', lineHeight: 1.8 }}>
              These are not proposals. These are real programs, with real data, delivering real outcomes. The alternatives already exist.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PROOF_ORGS.map((org) => (
                <div key={org.name} className="bg-[#0A0A0A] p-8 relative scanline-overlay">
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <span className="text-[#F5F0E8]/40 text-xs uppercase block mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.2em' }}>{org.region}</span>
                        <h3 className="font-bold text-[#F5F0E8] uppercase text-2xl" style={{ letterSpacing: '-0.02em' }}>{org.name}</h3>
                      </div>
                      <span className="font-bold text-[#059669] text-5xl" style={{ letterSpacing: '-0.02em' }}>{org.stat}</span>
                    </div>
                    <p className="text-[#F5F0E8]/50 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8, letterSpacing: '0.03em' }}>{org.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Typographic callout */}
            <div className="mt-16 text-center max-w-3xl mx-auto">
              <p className="text-3xl md:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#0A0A0A]">
                What if we spent{' '}
                <span className="text-[#DC2626]">$1.55M</span>{' '}
                on keeping a kid connected to family, culture, and community?
              </p>
            </div>
          </div>
        </section>

        <RedDivider bg="#F5F0E8" />

        {/* ==================== SECTION 5: THE TOUR ==================== */}
        <section id="back-this-tour" />
        <section id="tour" className="relative bg-[#0A0A0A] scanline-overlay concrete-texture overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0 clamp(80px, 12vw, 160px)' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span className="text-[#DC2626] text-xs font-medium uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>The Tour</span>
            <h2 className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-4" style={{ letterSpacing: '-0.02em' }}>The Tour</h2>
            <p className="text-[#F5F0E8]/50 text-xs max-w-xl mb-12" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em', lineHeight: 1.8 }}>
              We have not locked the money to make this happen. Each stop needs local partners, venues, and funding. We need help. We cannot do this on our own.
            </p>

            <div className="mb-12">
              <TourMap stops={tourStops} onStopClick={handleMapStopClick} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {tourStops.slice(0, 3).map((stop, i) => {
                const isFirst = i === 0;
                return (
                  <div
                    key={stop.eventSlug}
                    ref={(el) => { tourStopRefs.current[stop.eventSlug] = el; }}
                    className={isFirst ? 'border-2 border-[#DC2626]/30 bg-[#DC2626]/5 p-8 relative' : 'border border-[#F5F0E8]/10 p-8 hover:border-[#F5F0E8]/25 transition-colors'}
                  >
                    <span className={isFirst
                      ? 'bg-[#DC2626] px-3 py-1 text-[#F5F0E8] text-xs uppercase font-medium inline-block'
                      : 'border border-[#F5F0E8]/20 px-3 py-1 text-[#F5F0E8]/50 text-xs uppercase font-medium inline-block'}
                      style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>
                      {stop.status === 'funded' ? 'Funded' : stop.status === 'confirmed' ? 'Confirmed' : 'Seeking Support'}
                    </span>
                    <h3 className="font-bold text-[#F5F0E8] uppercase text-3xl mt-6 mb-2">{stop.city}</h3>
                    <p className="text-[#F5F0E8]/40 text-xs mb-4 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {stop.venue} · {stop.date}
                    </p>
                    {stop.partnerQuote && (
                      <blockquote className="border-l-2 border-[#DC2626] pl-4 mb-6">
                        <p className="text-sm italic text-[#F5F0E8]/50">&ldquo;{stop.partnerQuote}&rdquo;</p>
                      </blockquote>
                    )}
                    {stateSpending[stop.state] && (
                      <div className="bg-white/5 border border-white/10 p-3 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        <div className="text-xs md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">{stop.state} Justice Spending</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {stateSpending[stop.state].detention_millions != null && (
                            <div><span className="text-[#DC2626] font-bold">${stateSpending[stop.state].detention_millions}M</span><span className="text-gray-500 ml-1">detention</span></div>
                          )}
                          {stateSpending[stop.state].community_millions != null && (
                            <div><span className="text-[#059669] font-bold">${stateSpending[stop.state].community_millions}M</span><span className="text-gray-500 ml-1">community</span></div>
                          )}
                        </div>
                      </div>
                    )}
                    <BrandButton href="/contained/help" variant={isFirst ? 'primary' : 'secondary'} className="w-full text-center">
                      {isFirst ? 'Back This Stop' : 'Support This Stop'}
                    </BrandButton>
                  </div>
                );
              })}
            </div>

            {tourStops.length > 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {tourStops.slice(3).map((stop) => (
                  <div
                    key={stop.eventSlug}
                    ref={(el) => { tourStopRefs.current[stop.eventSlug] = el; }}
                    className="border border-[#F5F0E8]/10 p-8 hover:border-[#F5F0E8]/25 transition-colors"
                  >
                    <span className="border border-[#F5F0E8]/20 px-3 py-1 text-[#F5F0E8]/50 text-xs uppercase font-medium inline-block" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}>
                      {stop.status === 'funded' ? 'Funded' : stop.status === 'confirmed' ? 'Confirmed' : 'Seeking Support'}
                    </span>
                    <h3 className="font-bold text-[#F5F0E8] uppercase text-3xl mt-6 mb-2">{stop.city}</h3>
                    <p className="text-[#F5F0E8]/40 text-xs mb-4 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stop.venue} · {stop.date}</p>
                    {stateSpending[stop.state] && (
                      <div className="bg-white/5 border border-white/10 p-3 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        <div className="text-xs md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">{stop.state} Justice Spending</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {stateSpending[stop.state].detention_millions != null && (
                            <div><span className="text-[#DC2626] font-bold">${stateSpending[stop.state].detention_millions}M</span><span className="text-gray-500 ml-1">detention</span></div>
                          )}
                          {stateSpending[stop.state].community_millions != null && (
                            <div><span className="text-[#059669] font-bold">${stateSpending[stop.state].community_millions}M</span><span className="text-gray-500 ml-1">community</span></div>
                          )}
                        </div>
                      </div>
                    )}
                    <BrandButton href="/contained/help" variant="secondary" className="w-full text-center">Support This Stop</BrandButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <RedDivider />

        {/* ==================== SECTION 6: ACTION ==================== */}
        <section id="nominate" />
        <section id="action" className="relative bg-[#F5F0E8] scanline-overlay-dark overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 text-center">
            <span className="text-[#DC2626] text-xs font-medium uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>We Need You</span>
            <h2 className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl lg:text-6xl mb-12" style={{ letterSpacing: '-0.02em' }}>How Do You Want to Help?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  Icon: Heart,
                  title: 'Fund a Stop',
                  desc: 'Each tour stop costs $30K to stage. Your contribution gets the container to a new community.',
                  cta: 'Back This',
                  href: '/contained/help',
                },
                {
                  Icon: Megaphone,
                  title: 'Spread the Word',
                  desc: 'Share the evidence with your network. Contact your MP. Forward this to someone who needs to see it.',
                  cta: 'Take Action',
                  href: '/contained/act',
                },
                {
                  Icon: Box,
                  title: 'Host the Container',
                  desc: 'Have a venue, festival, or community space? Partner with us to bring it to your area.',
                  cta: 'Get in Touch',
                  href: '/contained/help',
                },
              ].map((action) => (
                <Link key={action.title} href={action.href} className="bg-[#0A0A0A] p-8 relative scanline-overlay block group hover:ring-2 hover:ring-[#DC2626]/30 transition-all">
                  <div className="relative z-10">
                    <action.Icon className="w-8 h-8 text-[#DC2626] mb-6" />
                    <h3 className="font-bold text-[#F5F0E8] uppercase text-xl mb-3">{action.title}</h3>
                    <p className="text-[#F5F0E8]/40 text-xs leading-relaxed mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{action.desc}</p>
                    <span className="inline-flex items-center gap-2 text-[#DC2626] text-xs font-bold uppercase tracking-[0.2em] group-hover:text-[#F5F0E8] transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {action.cta} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== STORIES ==================== */}
        {displayStories.length > 0 && (
          <section id="stories" className="relative bg-[#0A0A0A] scanline-overlay concrete-texture overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-[#DC2626] text-xs font-medium uppercase block mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}>From the Ground</span>
                  <h2 className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-2" style={{ letterSpacing: '-0.02em' }}>Stories</h2>
                  <p className="text-[#F5F0E8]/50 max-w-xl text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    Lived experience and reporting from the communities driving change.
                  </p>
                </div>
                <BrandButton href="/contained/stories" variant="ghost" className="hidden sm:inline-flex">
                  All Stories <ArrowRight className="w-4 h-4" />
                </BrandButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayStories.map((story) => {
                  const pullQuote = story.summary ? story.summary.split(/[.!?]/)[0] + '.' : null;
                  const storySlug = story.title
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/['']/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                  const categoryLabel = story.story_category || 'REPORT';
                  const sourceLabel = story.source === 'el' ? 'Empathy Ledger' : story.source === 'article' ? 'JusticeHub' : story.source === 'tour' ? 'Tour Submission' : '';

                  if (story.story_image_url) {
                    return (
                      <Link key={story.id} href={`/blog/${storySlug}`} className="block relative aspect-[3/4] overflow-hidden group cursor-pointer">
                        <img src={story.story_image_url} alt={story.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/30 to-transparent" />
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                          <span className="text-xs md:text-[10px] bg-[#DC2626] text-white px-2 py-1 uppercase tracking-[0.15em] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{categoryLabel}</span>
                          {sourceLabel && <span className="text-xs md:text-[10px] bg-[#0A0A0A]/60 text-white/60 px-2 py-1 uppercase tracking-[0.1em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{sourceLabel}</span>}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="font-bold text-lg tracking-tight mb-2 uppercase leading-tight">{story.title}</h3>
                          {pullQuote && <p className="text-xs text-white/70 mb-3 line-clamp-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{pullQuote}</p>}
                          {story.author_name && <p className="text-xs md:text-[10px] text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{story.author_name}</p>}
                          <span className="inline-flex items-center gap-1 text-[#DC2626] text-xs font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link key={story.id} href={`/blog/${storySlug}`} className="block border border-white/10 group cursor-pointer hover:border-white/30 transition-colors">
                      <div className="p-6 flex flex-col justify-between min-h-[280px]">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs md:text-[10px] text-[#DC2626] uppercase tracking-[0.15em] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{categoryLabel}</span>
                            {sourceLabel && <span className="text-xs md:text-[10px] text-[#F5F0E8]/30 uppercase tracking-[0.1em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>/ {sourceLabel}</span>}
                          </div>
                          <h3 className="font-bold text-lg tracking-tight text-[#F5F0E8] mb-3 uppercase leading-tight">{story.title}</h3>
                          {pullQuote && <p className="text-xs text-white/50 line-clamp-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{pullQuote}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          {story.author_name && <span className="text-xs md:text-[10px] text-[#F5F0E8]/30 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{story.author_name}</span>}
                          <span className="inline-flex items-center gap-1 text-[#DC2626] text-xs font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="text-center mt-8 sm:hidden">
                <BrandButton href="/contained/stories" variant="ghost">
                  All Stories <ArrowRight className="w-4 h-4" />
                </BrandButton>
              </div>
            </div>
          </section>
        )}

        {/* ==================== NEWSLETTER ==================== */}
        <section className="bg-[#0A0A0A] border-t border-white/10" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="contained-logo-mark text-[#F5F0E8] mx-auto mb-6 opacity-30" />
            <h2 className="text-3xl font-bold tracking-tight text-[#F5F0E8] mb-2">
              Stay in the Movement
            </h2>
            <p className="text-gray-400 text-sm mb-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Tour updates, evidence releases, and ways to act.
            </p>
            <NewsletterSignup />
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#0A0A0A] border-t border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div>
              <div className="contained-logo-mark text-[#F5F0E8] mb-6" />
              <p className="text-[#F5F0E8]/30 text-xs max-w-xs leading-relaxed uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em' }}>
                Justice infrastructure, not justice tech. Action, art, and intelligence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-4">
              <Link href="/contained/act" className="text-[#F5F0E8]/50 text-xs uppercase hover:text-[#F5F0E8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Take Action</Link>
              <Link href="/intelligence" className="text-[#F5F0E8]/50 text-xs uppercase hover:text-[#F5F0E8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Data</Link>
              <Link href="/contained/stories" className="text-[#F5F0E8]/50 text-xs uppercase hover:text-[#F5F0E8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Stories</Link>
              <Link href="/contact" className="text-[#F5F0E8]/50 text-xs uppercase hover:text-[#F5F0E8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Contact</Link>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#F5F0E8]/20 text-xs md:text-[10px] uppercase tracking-widest" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>© 2026 CONTAINED. Sovereignty never ceded.</p>
            <div className="flex items-center gap-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <Link href="/" className="text-[#F5F0E8]/50 text-xs uppercase hover:text-[#F5F0E8] tracking-widest">JusticeHub</Link>
              <a href="https://www.linkedin.com/in/benknight" target="_blank" rel="noopener noreferrer" className="text-[#F5F0E8]/50 text-xs uppercase hover:text-[#F5F0E8] tracking-widest">LinkedIn</a>
              <a href="https://www.empathyledger.com" target="_blank" rel="noopener noreferrer" className="text-[#F5F0E8]/40 text-xs md:text-[10px] uppercase hover:text-[#F5F0E8] tracking-widest border border-[#F5F0E8]/20 px-3 py-1.5 hover:border-[#F5F0E8]/40 transition-colors">
                Powered by Empathy Ledger
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

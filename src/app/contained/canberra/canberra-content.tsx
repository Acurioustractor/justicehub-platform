'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { campaignMedia } from '@/content/campaign';
import { ELPhotoPickerModal } from '@/components/empathy-ledger/ELPhotoPickerModal';
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Clock,
  Copy,
  DoorOpen,
  Footprints,
  Gavel,
  Landmark,
  Loader2,
  Megaphone,
  Menu,
  MessageSquare,
  Newspaper,
  Share2,
  Shield,
  Users,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants — Canberra-specific
// ---------------------------------------------------------------------------
const SHARE_TEXT =
  'CONTAINED in Canberra. One shipping container. Three rooms. Thirty minutes that put youth detention on the lawns of Parliament House. #TheContained #YouthJustice';
const SHARE_URL = 'https://justicehub.com.au/contained/canberra';

// Real quotes from the Canberra demand list — engagement tracker data
const CANBERRA_VOICES = [
  {
    name: 'Rebecca Minty',
    role: 'ACT Inspector of Custodial Services',
    quote:
      'It would be amazing to bring to ACT, where govt recently committed to looking at a new model of care for youth detention.',
  },
  {
    name: 'PJ Hewitt',
    role: 'Director, Health Services',
    quote: 'Host in Canberra!',
  },
  {
    name: 'Margo Marchbank',
    role: 'Director, Koru Communication',
    quote: 'What about in Canberra? Lawns of Parliament House?',
  },
  {
    name: 'Anissa Jones',
    role: 'PhD Candidate',
    quote: 'Will you go to Canberra? They also need to see it. Territory level as well as federal.',
  },
  {
    name: 'Robert Tickner',
    role: 'Chair, Justice Reform Initiative',
    quote: 'Do not forget the drive to Canberra to deliver a message to the PM.',
  },
];

// Who CONTAINED in Canberra is built for
const AUDIENCES = [
  {
    icon: Shield,
    name: 'ACT Children & Young People Commissioner',
    detail: 'The role that holds the territory accountable for what happens to children. Walk through. Then sit with the local sector behind Room 3.',
  },
  {
    icon: Shield,
    name: 'National Children\'s Commissioner',
    detail: 'A federal voice for children across every jurisdiction. The container makes the conversation embodied, not abstract.',
  },
  {
    icon: Landmark,
    name: 'ACT government — Minister, AG, cabinet',
    detail: 'The territory has already committed to a new model of care. The container is the room that lets the model be felt before it is named.',
  },
  {
    icon: Landmark,
    name: 'Federal MPs and Senators',
    detail: 'A walk-through in sitting weeks. Press Gallery present. A line that travels into Hansard the next day.',
  },
  {
    icon: Gavel,
    name: 'Magistrates and judges',
    detail: 'Sentencing remarks land differently when the bench has walked the cell. Hosted reflection at chambers afterwards.',
  },
  {
    icon: Newspaper,
    name: 'Press Gallery and editors',
    detail: 'Interviews with the young people who built the rooms. The container becomes the story. Not the press release.',
  },
  {
    icon: Building2,
    name: 'Federal department secretaries',
    detail: 'AGD, Attorney-General\'s Department, PM&C, Social Services. The data lives in JusticeHub. The decision lives in the room.',
  },
  {
    icon: Users,
    name: 'Diplomatic Corps and Embassies',
    detail: 'Diagrama is a European model. The container makes the international comparison legible to the missions who already track Australia\'s record.',
  },
  {
    icon: Megaphone,
    name: 'ACT civic sector and advocates',
    detail: 'JRI, Youth Law Australia, Yfoundations, ACT-based ACCOs. The local Room 3 is yours to shape and yours to keep.',
  },
];

const WALK_THROUGH = [
  { icon: Clock, label: '30 minutes total. 10 in each room.' },
  { icon: DoorOpen, label: 'Doors lock behind you. One person at a time.' },
  { icon: Footprints, label: 'A journal sits on the bed in Room 1. No screens. No signage. Write or do not.' },
  { icon: Users, label: 'Led through by a young person who has been inside. They are paid to lead. The expertise is the wage.' },
];

const VOICE_ACTIONS = [
  {
    id: 'host',
    icon: Landmark,
    title: 'Stand up as a Canberra host',
    description:
      'Bring the container to a venue you hold the keys to. The lawns of Parliament House. Old Parliament House. The National Library forecourt. A Bimberi-aware community space. Sitting weeks if you can.',
    actionLabel: 'Hold a date',
  },
  {
    id: 'walk',
    icon: Footprints,
    title: 'Walk through it yourself',
    description:
      'The Sydney + Canberra leg lands December 2026 to January 2027. Pre-register your walk-through, your team\'s walk-through, your bench\'s walk-through. Bring a colleague who needs to feel it.',
    actionLabel: 'Reserve a slot',
  },
  {
    id: 'open-door',
    icon: DoorOpen,
    title: 'Open a door in your portfolio',
    description:
      'Connect us to the Commissioner, the Minister, the magistrate, the Senator, the secretary. One introduction lands faster than a hundred cold emails. Tell us who and we will carry the ask.',
    actionLabel: 'Make the introduction',
  },
  {
    id: 'cosign',
    icon: Megaphone,
    title: 'Co-sign the public invitation',
    description:
      'Add your name and role to the public letter inviting CONTAINED to Canberra. The list goes to ACT cabinet, the Press Gallery, and the federal Children\'s Commissioner the week before launch.',
    actionLabel: 'Add my name',
  },
];

// ---------------------------------------------------------------------------
// Admin photo swap (mirrors /contained/tour pattern — overrides persist via
// /api/admin/contained/photo-overrides so swaps survive across deploys)
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
    <div
      className={`relative group/swap w-full h-full ${isAdmin ? 'cursor-pointer' : ''}`}
      onClick={isAdmin ? () => onRequestSwap(photoKey) : undefined}
    >
      <img src={displaySrc} alt={alt} className={className} style={style} loading="lazy" />
      {isAdmin && (
        <div className="absolute inset-0 bg-[#DC2626]/0 group-hover/swap:bg-[#DC2626]/30 transition-colors flex items-center justify-center opacity-0 group-hover/swap:opacity-100">
          <span
            className="bg-[#DC2626] text-white text-xs px-3 py-2 font-bold uppercase tracking-wider"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Swap Photo
          </span>
        </div>
      )}
      {isAdmin && overrides[photoKey] && (
        <span
          className="absolute top-1 left-1 bg-[#059669] text-white text-[12px] px-1.5 py-0.5 uppercase tracking-wider"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Swapped
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brand button
// ---------------------------------------------------------------------------
function BrandButton({
  href,
  onClick,
  children,
  variant = 'primary',
  external = false,
  className = '',
  type = 'button',
  disabled = false,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  external?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const base =
    'relative inline-flex items-center justify-center gap-2 text-xs uppercase font-bold transition-all duration-200 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#DC2626] text-[#F5F0E8] px-8 py-4 hover:bg-[#b91c1c]',
    secondary: 'border-2 border-[#F5F0E8]/30 text-[#F5F0E8] px-8 py-4 hover:border-[#F5F0E8] hover:bg-[#F5F0E8]/5',
    ghost: 'text-[#DC2626] px-0 py-2 hover:text-[#F5F0E8]',
  };

  const inner = (
    <>
      <span
        className="relative z-10"
        style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.2em' }}
      >
        {children}
      </span>
      {variant === 'primary' && (
        <span className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-t-[#F5F0E8]/20 border-l-[12px] border-l-transparent transition-all group-hover:border-t-[#F5F0E8]/40" />
      )}
      {variant === 'secondary' && (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#DC2626] transition-all duration-300 group-hover:w-full" />
      )}
    </>
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${variants[variant]} ${className}`}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {inner}
    </button>
  );
}

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
// Share row
// ---------------------------------------------------------------------------
function ShareRow() {
  const [copied, setCopied] = useState(false);
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
    },
  ];

  return (
    <div className="flex items-center gap-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <Share2 className="w-4 h-4 text-[#F5F0E8]/60" />
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-xs font-bold border border-white/30 text-white hover:bg-white hover:text-black uppercase tracking-widest transition-colors"
        >
          {l.label}
        </a>
      ))}
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(SHARE_URL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="px-3 py-1 text-xs font-bold border border-white/30 text-white hover:bg-white hover:text-black uppercase tracking-widest transition-colors flex items-center gap-1"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> Link
          </>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The invitation form
// ---------------------------------------------------------------------------
function InvitationForm({ initialAction }: { initialAction?: string }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [actions, setActions] = useState<string[]>(initialAction ? [initialAction] : []);
  const [doorYouOpen, setDoorYouOpen] = useState('');
  const [venueIdea, setVenueIdea] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function toggleAction(id: string) {
    setActions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (honeypot) return;
    if (!name || !email) {
      setErrorMsg('Please add your name and email.');
      return;
    }
    if (actions.length === 0) {
      setErrorMsg('Pick at least one way you want to use your voice.');
      return;
    }

    setStatus('loading');
    try {
      const actionLabels = actions
        .map((id) => VOICE_ACTIONS.find((a) => a.id === id)?.title)
        .filter(Boolean)
        .join(' · ');

      const compiled = `CONTAINED · Canberra invitation

Voice actions: ${actionLabels}

Role: ${role || 'Not specified'}
Organisation: ${organisation || 'Not specified'}
Phone: ${phone || 'Not specified'}

Door you can open:
${doorYouOpen || 'Not specified'}

Venue idea:
${venueIdea || 'Not specified'}

Message:
${message || 'No additional message'}`;

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || '',
          organization: organisation || '',
          category: 'contained-help',
          subject: `[CONTAINED Canberra] ${actionLabels}`,
          message: compiled,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not send. Please try again.');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="border border-[#059669]/40 bg-[#059669]/10 p-10 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-5 text-[#059669]" />
        <h3
          className="text-2xl font-bold text-[#F5F0E8] uppercase tracking-tight mb-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          We got you, {name.split(' ')[0]}.
        </h3>
        <p
          className="text-sm text-[#F5F0E8]/85 max-w-md mx-auto leading-relaxed"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          We will be in touch within a week with the next steps. Canberra is on the route. Your voice
          helps it land.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Voice actions */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626] mb-4"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          01 · How you want to use your voice
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VOICE_ACTIONS.map((a) => {
            const active = actions.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAction(a.id)}
                className={`text-left p-4 border-2 transition-all ${
                  active
                    ? 'bg-[#DC2626]/10 border-[#DC2626]'
                    : 'border-white/15 hover:border-white/40 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <a.icon
                    className={`w-4 h-4 ${active ? 'text-[#DC2626]' : 'text-[#F5F0E8]/70'}`}
                  />
                  <span
                    className="text-sm font-bold uppercase tracking-tight text-[#F5F0E8]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {a.title}
                  </span>
                </div>
                <p
                  className="text-xs text-[#F5F0E8]/70 leading-relaxed"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {a.actionLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626] mb-4"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          02 · Who you are
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <input
            type="text"
            placeholder="Role or title"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <input
            type="text"
            placeholder="Organisation, department, or portfolio"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="sm:col-span-2 px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
        </div>
      </div>

      {/* Door + Venue */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626] mb-4"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          03 · What you can open (optional)
        </label>
        <div className="space-y-3">
          <textarea
            placeholder="A door you can open. Who would you connect us to? Commissioner, Minister, magistrate, Senator, secretary, editor."
            value={doorYouOpen}
            onChange={(e) => setDoorYouOpen(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
          <textarea
            placeholder="A venue you can hold. Lawns of Parliament House. Old Parliament House. University. Community space. A date if you have one."
            value={venueIdea}
            onChange={(e) => setVenueIdea(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label
          className="block text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626] mb-4"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          04 · Anything else (optional)
        </label>
        <textarea
          placeholder="A note, a context, a constraint, a strong feeling."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        />
      </div>

      {/* Honeypot */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {errorMsg && (
        <p
          className="text-[#DC2626] text-xs"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <BrandButton type="submit" variant="primary" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Sending
            </span>
          ) : (
            'Send the invitation'
          )}
        </BrandButton>
        <p
          className="text-xs text-[#F5F0E8]/60 leading-relaxed"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          We reply within a week. Your details go to Ben Knight directly. Nothing is published without you.
        </p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function CanberraContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<string | undefined>(undefined);

  // Admin photo swap
  const isAdmin = useAdminMode();
  const { overrides, setOverride, clearOverrides } = usePhotoOverrides();
  const [pickerOpen, setPickerOpen] = useState(false);
  const swapTargetRef = useRef<string | null>(null);

  const handleRequestSwap = useCallback((key: string) => {
    swapTargetRef.current = key;
    setPickerOpen(true);
  }, []);

  const handlePhotoPicked = useCallback(
    (url: string) => {
      if (swapTargetRef.current) {
        setOverride(swapTargetRef.current, url);
        swapTargetRef.current = null;
      }
      setPickerOpen(false);
    },
    [setOverride]
  );

  // Allow #host, #walk, #open-door etc. to pre-select in the form
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['host', 'walk', 'open-door', 'cosign'].includes(hash)) {
      setInitialAction(hash);
      setTimeout(() => {
        document.getElementById('invitation')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* ==================== NAVIGATION ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 flex items-center justify-between h-16">
          <Link href="/contained" className="flex items-center gap-3">
            <div className="contained-logo-mark text-[#F5F0E8]" />
            <span
              className="text-[#F5F0E8] text-xs font-bold uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Contained · Canberra
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#what"
              className="text-[#F5F0E8]/90 hover:text-[#F5F0E8] text-xs uppercase transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              What it is
            </a>
            <a
              href="#why-canberra"
              className="text-[#F5F0E8]/90 hover:text-[#F5F0E8] text-xs uppercase transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Why Canberra
            </a>
            <a
              href="#who"
              className="text-[#F5F0E8]/90 hover:text-[#F5F0E8] text-xs uppercase transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Who walks through
            </a>
            <a
              href="#voice"
              className="text-[#F5F0E8]/90 hover:text-[#F5F0E8] text-xs uppercase transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Your voice
            </a>
            <a
              href="#invitation"
              className="relative bg-[#DC2626] text-[#F5F0E8] text-xs uppercase font-medium px-6 py-3 hover:bg-[#b91c1c] transition-colors inline-block group overflow-hidden"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              <span className="relative z-10">Send the invitation</span>
              <span className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-[#F5F0E8]/20 border-l-[10px] border-l-transparent" />
            </a>
          </div>
          <button className="md:hidden text-[#F5F0E8]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-6 py-4 space-y-4">
            <a
              href="#what"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#F5F0E8]/90 text-xs uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              What it is
            </a>
            <a
              href="#why-canberra"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#F5F0E8]/90 text-xs uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Why Canberra
            </a>
            <a
              href="#who"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#F5F0E8]/90 text-xs uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Who walks through
            </a>
            <a
              href="#voice"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#F5F0E8]/90 text-xs uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Your voice
            </a>
            <a
              href="#invitation"
              onClick={() => setMobileMenuOpen(false)}
              className="block bg-[#DC2626] text-[#F5F0E8] text-xs uppercase font-medium px-6 py-3 text-center"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em' }}
            >
              Send the invitation
            </a>
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
                className="bg-[#059669] text-white text-xs px-3 py-2 font-bold uppercase tracking-wider hover:bg-[#047857] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Copy {Object.keys(overrides).length} Override{Object.keys(overrides).length > 1 ? 's' : ''}
              </button>
              <button
                onClick={clearOverrides}
                className="bg-[#DC2626] text-white text-xs px-3 py-2 font-bold uppercase tracking-wider hover:bg-[#b91c1c] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Reset
              </button>
            </>
          )}
          <span
            className="bg-[#0A0A0A] border border-white/20 text-[#F5F0E8]/95 text-[12px] px-2 py-1.5 uppercase tracking-widest"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Admin · Canberra
          </span>
        </div>
      )}

      <main>
        {/* ==================== HERO ==================== */}
        <section className="relative min-h-screen flex items-center justify-center scanline-overlay overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src={campaignMedia.cellVideoMov} type="video/quicktime" />
              <source src={campaignMedia.heroVideo.url} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[#0A0A0A]/75" />
          </div>

          <div className="relative z-20 text-center max-w-5xl mx-auto px-6 pt-20">
            <div className="hero-animate hero-animate-delay-1">
              <span
                className="text-[#DC2626] text-xs font-medium uppercase block mb-8"
                style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
              >
                For the people who set the rules
              </span>
            </div>

            <h1
              className="font-bold text-[#F5F0E8] uppercase leading-none hero-animate hero-animate-delay-2"
              style={{ fontSize: 'clamp(40px, 6.5vw, 88px)', letterSpacing: '-0.02em' }}
            >
              Canberra.
              <br />
              The room that has to walk through it.
            </h1>

            <div className="flex justify-center my-8 hero-animate hero-animate-delay-3">
              <div className="w-px h-16 bg-[#DC2626]" style={{ transform: 'rotate(-35deg)' }} />
            </div>

            <p
              className="text-[#F5F0E8]/95 text-sm max-w-3xl mx-auto leading-relaxed hero-animate hero-animate-delay-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}
            >
              One shipping container. Three rooms. Thirty minutes. Built for the Children &amp; Young
              People Commissioner, the National Children&apos;s Commissioner, the ACT government,
              federal MPs, the Press Gallery, and the bench. The decision about how a child is held
              gets made in Canberra. The room that walks you through it gets made by the young people
              who lived it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 hero-animate hero-animate-delay-4">
              <BrandButton href="#invitation" variant="primary">
                Send the invitation
              </BrandButton>
              <BrandButton href="#what" variant="secondary">
                See what it is
              </BrandButton>
            </div>

            <div className="mt-14 hero-animate hero-animate-delay-5 flex items-center justify-center">
              <ShareRow />
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== WHAT IT IS ==================== */}
        <section id="what" className="relative bg-[#0A0A0A] scanline-overlay concrete-texture overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              What it is
            </span>
            <h2
              className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              One container.
              <br />
              Three rooms.
              <br />
              Thirty minutes.
            </h2>
            <p
              className="text-[#F5F0E8]/95 text-sm max-w-3xl mb-14 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.03em', lineHeight: 1.8 }}
            >
              CONTAINED is a travelling shipping container reconfigured into three sequential rooms.
              You step in alone. The door locks behind you. Ten minutes recreates the sensory reality
              of an Australian youth detention cell. Ten minutes shows what the Diagrama Foundation
              built across Spain instead. Ten minutes hands the room to the local organisations who
              are already doing the work and naming what they need funded. In Canberra, that means
              ACT-led services, Bimberi-aware staff, and the federal advocacy infrastructure already
              in the room.
            </p>

            {/* Three rooms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  num: '01',
                  title: 'Current Reality',
                  color: '#DC2626',
                  duration: '10 minutes locked inside',
                  body:
                    'A cell. Strip lighting. Concrete. A journal on the bed. Designed by young people who lived inside Australian youth detention. The first room story is carried into Canberra by the young people who built it.',
                  photo: campaignMedia.roomPhotos[0]?.src,
                  alt: 'Inside Room 1: a recreated youth detention cell',
                },
                {
                  num: '02',
                  title: 'What Works',
                  color: '#3B82F6',
                  duration: '10 minutes of possibility',
                  body:
                    'Grounded in Diagrama Foundation\'s youth justice centres in Spain. Education. Therapy. 1:1 staffing. Weekly family contact. 13.6% recidivism. €5.64 social return for every €1 invested. David from Diagrama anchors the practice lens at every stop.',
                  photo: campaignMedia.roomPhotos[3]?.src,
                  alt: 'Inside Room 2: the therapeutic model from Diagrama',
                },
                {
                  num: '03',
                  title: 'Organisations Already Doing It',
                  color: '#059669',
                  duration: '10 minutes to see what works',
                  body:
                    'Built fresh at every stop with the host community. In Canberra, this room is for ACT-led services, the Indigenous-led sector, the new model of care work, and the federal advocacy spine. Costs, evidence, support needs, named out loud.',
                  photo: campaignMedia.roomPhotos[4]?.src,
                  alt: 'Inside Room 3: the local organisations already running alternatives',
                },
              ].map((room) => (
                <div key={room.num} className="border border-white/10 bg-white/5 flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {room.photo && (
                      <SwappablePhoto
                        src={room.photo}
                        alt={room.alt}
                        photoKey={`canberra-room-${room.num}`}
                        isAdmin={isAdmin}
                        overrides={overrides}
                        onRequestSwap={handleRequestSwap}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/95 via-[#0A0A0A]/40 to-transparent pointer-events-none" />
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <span
                        className="text-xs font-bold uppercase tracking-[0.2em] px-2 py-1"
                        style={{
                          backgroundColor: room.color,
                          color: '#F5F0E8',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {room.num}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-3">
                    <span
                      className="text-xs uppercase tracking-[0.2em]"
                      style={{
                        color: room.color,
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {room.duration}
                    </span>
                    <h3 className="text-2xl font-bold text-[#F5F0E8] uppercase" style={{ letterSpacing: '-0.02em' }}>
                      Room {room.num.slice(-1)}: {room.title}
                    </h3>
                    <p
                      className="text-xs text-[#F5F0E8]/85 leading-relaxed"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
                    >
                      {room.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Full-bleed two realities break — side-by-side image of the rooms */}
            <div className="mt-16 -mx-6 lg:-mx-16">
              <div className="relative overflow-hidden">
                <SwappablePhoto
                  src={campaignMedia.roomPhotos[7]?.src || campaignMedia.roomPhotos[0]?.src}
                  alt="Two realities, side by side — the cell on the left, the alternative on the right"
                  photoKey="canberra-two-realities-fullbleed"
                  isAdmin={isAdmin}
                  overrides={overrides}
                  onRequestSwap={handleRequestSwap}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '70vh' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent pointer-events-none p-6 lg:p-12">
                  <div className="max-w-7xl mx-auto">
                    <span
                      className="text-[#DC2626] text-xs font-bold uppercase block mb-2"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.25em' }}
                    >
                      Two realities, side by side
                    </span>
                    <p
                      className="text-[#F5F0E8] text-base md:text-xl font-bold leading-snug max-w-2xl"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}
                    >
                      A cell on one side. The alternative on the other. Same footprint. Same thirty
                      minutes. The choice Canberra has already started naming.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* The walk-through */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <span
                  className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
                >
                  Inside the container
                </span>
                <h3
                  className="text-3xl md:text-4xl font-bold uppercase text-[#F5F0E8] mb-6"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Door locks.
                  <br />
                  Journal on the bed.
                  <br />
                  A young person walks you out.
                </h3>
                <p
                  className="text-sm text-[#F5F0E8]/90 leading-relaxed"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
                >
                  No signage. No soundtrack. No prepared speech. The young person leading you through
                  was inside the system. They built the room. They tell you what they did when the
                  door locked on them, and what they would have wanted instead. They are paid to lead.
                  The expertise is the wage.
                </p>
              </div>
              <div className="space-y-3">
                {WALK_THROUGH.map((item) => (
                  <div key={item.label} className="border border-white/10 bg-white/5 p-4 flex items-start gap-4">
                    <item.icon className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                    <p
                      className="text-sm text-[#F5F0E8]/95 leading-relaxed"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== FILM COMING — placeholder strip ==================== */}
        <section className="relative bg-[#0A0A0A] overflow-hidden" style={{ padding: 'clamp(48px, 7vw, 96px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <div className="border border-[#DC2626]/40 bg-[#DC2626]/5 p-8 md:p-12 relative">
              {/* Corner triangle, brand wedge accent */}
              <span className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-[#DC2626] border-l-[24px] border-l-transparent" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7">
                  <span
                    className="text-[#DC2626] text-xs font-bold uppercase block mb-4"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
                  >
                    Film coming · August 2026
                  </span>
                  <h2
                    className="font-bold text-[#F5F0E8] uppercase text-2xl md:text-4xl lg:text-5xl mb-5 leading-tight"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    The film will lead this page.
                    <br />
                    We are making it in Adelaide.
                  </h2>
                  <p
                    className="text-[#F5F0E8]/85 text-sm leading-relaxed max-w-2xl"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
                  >
                    22-26 June in Adelaide on Kaurna Yarta. The public activation. The build week. The
                    young people leading the walk-through. David from Diagrama anchoring Room 2.
                    Adelaide organisations opening Room 3 with their programs and asks named out
                    loud. One filmmaker. Three cuts. The hero film will replace this loop on the
                    Canberra page when it lands in August. The artefact, not the record.
                  </p>
                </div>

                <div className="lg:col-span-5">
                  <div className="grid grid-cols-3 gap-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    <div className="border border-white/15 p-4 text-center">
                      <div
                        className="text-3xl md:text-4xl font-bold text-[#F5F0E8]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
                      >
                        3:00
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                        Hero film
                      </div>
                    </div>
                    <div className="border border-white/15 p-4 text-center">
                      <div
                        className="text-3xl md:text-4xl font-bold text-[#F5F0E8]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
                      >
                        0:60
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                        Social cut
                      </div>
                    </div>
                    <div className="border border-white/15 p-4 text-center">
                      <div
                        className="text-3xl md:text-4xl font-bold text-[#F5F0E8]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
                      >
                        6:00
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                        Long-form
                      </div>
                    </div>
                  </div>

                  <p
                    className="mt-5 text-xs text-[#F5F0E8]/60 leading-relaxed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}
                  >
                    Commissioned through the Minderoo Cinema/Film line. Empathy Ledger consent for
                    every storyteller. No reconstructions. No AI. No stock detention footage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== WHY CANBERRA ==================== */}
        <section id="why-canberra" className="relative bg-[#F5F0E8] scanline-overlay-dark overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              Why Canberra
            </span>
            <h2
              className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl lg:text-6xl mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              Two jurisdictions
              <br />
              in the same room.
            </h2>
            <p
              className="text-[#0A0A0A]/70 text-sm max-w-3xl mb-12 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
            >
              Canberra is the only city in the country where territory and federal sit on the same
              ground. The ACT runs Bimberi. The Commonwealth holds national levers, the Productivity
              Commission, the National Children&apos;s Commissioner, the press that covers all of it.
              A container parked here is a container parked in front of both.
            </p>

            {/* Two-column: ACT facts + Federal facts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Territory column */}
              <div className="bg-[#0A0A0A] p-8 relative scanline-overlay">
                <span
                  className="text-[#F5F0E8]/80 text-xs uppercase block mb-3 relative z-10"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.25em' }}
                >
                  Territory
                </span>
                <h3
                  className="font-bold text-[#F5F0E8] text-2xl md:text-3xl uppercase mb-6 relative z-10"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  The ACT has already said it
                </h3>
                <div className="space-y-4 relative z-10" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <div className="border-l-2 border-[#DC2626] pl-4">
                    <div className="text-3xl font-bold text-[#F5F0E8]">$28M</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                      ACT detention spend per year
                    </div>
                  </div>
                  <div className="border-l-2 border-[#059669] pl-4">
                    <div className="text-3xl font-bold text-[#F5F0E8]">$9M</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                      ACT community programs
                    </div>
                  </div>
                  <div className="border-l-2 border-[#DC2626] pl-4">
                    <div className="text-3xl font-bold text-[#F5F0E8]">16.7×</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                      Indigenous overrepresentation in ACT detention
                    </div>
                  </div>
                  <div className="border-l-2 border-[#F5F0E8] pl-4">
                    <div className="text-3xl font-bold text-[#F5F0E8]">14</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/70 mt-1">
                      Children in Bimberi on an average night
                    </div>
                  </div>
                </div>
                <p
                  className="mt-6 text-xs text-[#F5F0E8]/85 leading-relaxed relative z-10"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}
                >
                  The ACT government has publicly committed to a new model of care for youth
                  detention. The Inspector of Custodial Services has already named the moment as the
                  right one. The container is the room where that commitment becomes felt before it
                  becomes legislation.
                </p>
              </div>

              {/* Federal column */}
              <div className="bg-[#0A0A0A] p-8 relative scanline-overlay">
                <span
                  className="text-[#F5F0E8]/80 text-xs uppercase block mb-3 relative z-10"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.25em' }}
                >
                  Federal
                </span>
                <h3
                  className="font-bold text-[#F5F0E8] text-2xl md:text-3xl uppercase mb-6 relative z-10"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  The national levers sit here
                </h3>
                <div className="space-y-5 relative z-10" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-1">
                      Children&apos;s Commissioner
                    </div>
                    <p className="text-sm text-[#F5F0E8]/90 leading-relaxed">
                      The federal voice for children sits in Canberra. Walks through the same door
                      every other walk-through walks through. Sits with the bench afterwards.
                    </p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-1">
                      Press Gallery
                    </div>
                    <p className="text-sm text-[#F5F0E8]/90 leading-relaxed">
                      A national story breaks here or it does not break. The container becomes a
                      stand-up, an interview, a frame change in a sitting week.
                    </p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-1">
                      Federal departments
                    </div>
                    <p className="text-sm text-[#F5F0E8]/90 leading-relaxed">
                      AGD, PM&amp;C, Social Services, Indigenous Affairs. The departments that hold
                      the funding lines. The container is the conversation upstream of the budget
                      bid.
                    </p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#DC2626] mb-1">
                      The bench
                    </div>
                    <p className="text-sm text-[#F5F0E8]/90 leading-relaxed">
                      ACT Magistrates Court. Federal Circuit and Family Court. Sentencing remarks
                      land differently when the bench has walked the cell.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* National stats */}
            <div className="mt-12 border-2 border-[#0A0A0A] bg-[#F5F0E8] p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { value: '$1.33M', label: 'Per child per year', color: '#DC2626' },
                  { value: '84%', label: 'Detention reoffending', color: '#DC2626' },
                  { value: '13.6%', label: 'Diagrama recidivism', color: '#059669' },
                  { value: '95%', label: 'Oonchiumpa diversion', color: '#059669' },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      className="text-4xl md:text-5xl font-bold"
                      style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="text-xs uppercase tracking-[0.15em] text-[#0A0A0A]/70 mt-2"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <p
                className="text-xs text-[#0A0A0A]/60 mt-6 text-center"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Sources: Productivity Commission ROGS 2024-25 · Diagrama Foundation evaluation ·
                Oonchiumpa Aboriginal Corporation
              </p>
            </div>
          </div>
        </section>

        <RedDivider bg="#F5F0E8" />

        {/* ==================== THE VOICES ALREADY IN THE ROOM ==================== */}
        <section className="relative bg-[#0A0A0A] scanline-overlay concrete-texture overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              The voices already in the room
            </span>
            <h2
              className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              The Canberra ask
              <br />
              is already on the record.
            </h2>
            <p
              className="text-[#F5F0E8]/95 text-sm max-w-3xl mb-14 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
            >
              These are the public quotes from the people who have already asked CONTAINED to come
              to Canberra. Inspector of Custodial Services. JRI Chair. Director of Health Services.
              Communications strategists. Researchers. The demand signal is the loudest in the
              country.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CANBERRA_VOICES.map((v) => (
                <div
                  key={v.name}
                  className="border border-white/10 bg-white/5 p-6 flex flex-col"
                >
                  <blockquote
                    className="text-base text-[#F5F0E8] italic leading-relaxed flex-1 border-l-2 border-[#DC2626] pl-4"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    &ldquo;{v.quote}&rdquo;
                  </blockquote>
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div
                      className="text-sm font-bold text-[#F5F0E8] uppercase tracking-tight"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {v.name}
                    </div>
                    <div
                      className="text-xs text-[#F5F0E8]/70 uppercase tracking-[0.15em] mt-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {v.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== WHO WALKS THROUGH ==================== */}
        <section id="who" className="relative bg-[#F5F0E8] scanline-overlay-dark overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              Who walks through
            </span>
            <h2
              className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl lg:text-6xl mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              Same container.
              <br />
              Nine doors in.
            </h2>
            <p
              className="text-[#0A0A0A]/70 text-sm max-w-3xl mb-12 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
            >
              Every cohort gets a different way in. A different briefing. A different conversation on
              the way out. The container is the same. The stakes change with who walks through.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {AUDIENCES.map((a) => (
                <div key={a.name} className="border-2 border-[#0A0A0A] bg-white p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <a.icon className="w-5 h-5 text-[#DC2626]" />
                    <h3
                      className="text-sm font-bold uppercase tracking-tight text-[#0A0A0A]"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {a.name}
                    </h3>
                  </div>
                  <p
                    className="text-xs text-[#0A0A0A]/75 leading-relaxed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}
                  >
                    {a.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RedDivider bg="#F5F0E8" />

        {/* ==================== HOW YOU USE YOUR VOICE ==================== */}
        <section id="voice" className="relative bg-[#0A0A0A] scanline-overlay concrete-texture overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              How you use your voice
            </span>
            <h2
              className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              Four ways to be
              <br />
              part of bringing it.
            </h2>
            <p
              className="text-[#F5F0E8]/95 text-sm max-w-3xl mb-14 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
            >
              The Sydney + Canberra leg runs December 2026 through January 2027. Parliament-facing
              days. Sitting weeks if we can hold them. The route is flexible. The route follows the
              people willing to use their voice.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VOICE_ACTIONS.map((a) => (
                <a
                  key={a.id}
                  href={`#invitation`}
                  onClick={(e) => {
                    e.preventDefault();
                    setInitialAction(a.id);
                    setTimeout(() => {
                      document.getElementById('invitation')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="bg-white/5 border border-white/10 p-8 relative scanline-overlay block group hover:border-[#DC2626]/40 hover:bg-[#DC2626]/5 transition-all"
                >
                  <div className="relative z-10 flex flex-col h-full">
                    <a.icon className="w-8 h-8 text-[#DC2626] mb-5" />
                    <h3
                      className="font-bold text-[#F5F0E8] uppercase text-xl md:text-2xl mb-3"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {a.title}
                    </h3>
                    <p
                      className="text-xs text-[#F5F0E8]/85 leading-relaxed mb-6 flex-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
                    >
                      {a.description}
                    </p>
                    <span
                      className="inline-flex items-center gap-2 text-[#DC2626] text-xs font-bold uppercase tracking-[0.2em] group-hover:text-[#F5F0E8] transition-colors"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {a.actionLabel} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <RedDivider />

        {/* ==================== INVITATION FORM ==================== */}
        <section id="invitation" className="relative bg-[#F5F0E8] scanline-overlay-dark overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              The invitation
            </span>
            <h2
              className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl lg:text-6xl mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              Add your name
              <br />
              to bringing it home.
            </h2>
            <p
              className="text-[#0A0A0A]/70 text-sm max-w-2xl mb-10 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}
            >
              The form below goes directly to Ben Knight. Tell us how you want to use your voice, who
              you can open a door to, and any venue or date you can hold. We come back to you within
              the week.
            </p>

            <div className="bg-[#0A0A0A] p-8 md:p-12 relative scanline-overlay">
              <div className="relative z-10">
                <InvitationForm initialAction={initialAction} />
              </div>
            </div>
          </div>
        </section>

        <RedDivider bg="#F5F0E8" />

        {/* ==================== ALSO USEFUL ==================== */}
        <section className="relative bg-[#0A0A0A] scanline-overlay overflow-hidden" style={{ padding: 'clamp(60px, 10vw, 120px) 0' }}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <span
              className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.3em' }}
            >
              Before you go
            </span>
            <h2
              className="font-bold text-[#F5F0E8] uppercase text-3xl md:text-5xl lg:text-6xl mb-12"
              style={{ letterSpacing: '-0.02em' }}
            >
              Useful things to take with you
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  href: '/contained',
                  title: 'The main page',
                  body: 'Hero video. National stats. Full tour. The case from the top.',
                },
                {
                  href: '/contained/about',
                  title: 'About',
                  body: 'A Curious Tractor. Ben + Nic. The premise. Where it sits in the longer arc.',
                },
                {
                  href: '/contained/how-it-works',
                  title: 'How it works',
                  body: 'Three rooms. Three builders. Ten minutes per room. Who walks through and what they leave with.',
                },
                {
                  href: '/contained/brief',
                  title: 'Decision-maker brief',
                  body: 'Printable one-pager. State-by-state stats. Built to leave on a desk.',
                },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="border border-white/15 p-6 hover:border-[#DC2626]/40 hover:bg-[#DC2626]/5 transition-all flex flex-col gap-3 group"
                >
                  <h3
                    className="text-base font-bold text-[#F5F0E8] uppercase tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {l.title}
                  </h3>
                  <p
                    className="text-xs text-[#F5F0E8]/80 leading-relaxed flex-1"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}
                  >
                    {l.body}
                  </p>
                  <span
                    className="inline-flex items-center gap-2 text-[#DC2626] text-xs font-bold uppercase tracking-[0.2em] group-hover:text-[#F5F0E8] transition-colors"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#0A0A0A] border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="max-w-md">
              <div className="contained-logo-mark text-[#F5F0E8] mb-5" />
              <p
                className="text-[#F5F0E8]/85 text-xs leading-relaxed uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', lineHeight: 1.8 }}
              >
                CONTAINED in Canberra. A standing invitation to the people who set the rules. Built
                with the young people who lived it. Carried by the organisations already doing the
                work.
              </p>
              <div className="mt-6">
                <ShareRow />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
              <Link
                href="/contained"
                className="text-[#F5F0E8]/85 text-xs uppercase hover:text-[#F5F0E8] tracking-wider"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Main page
              </Link>
              <Link
                href="/contained/about"
                className="text-[#F5F0E8]/85 text-xs uppercase hover:text-[#F5F0E8] tracking-wider"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                About
              </Link>
              <Link
                href="/contained/how-it-works"
                className="text-[#F5F0E8]/85 text-xs uppercase hover:text-[#F5F0E8] tracking-wider"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                How it works
              </Link>
              <Link
                href="/contained/brief"
                className="text-[#F5F0E8]/85 text-xs uppercase hover:text-[#F5F0E8] tracking-wider"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Brief
              </Link>
              <Link
                href="/contained/stories"
                className="text-[#F5F0E8]/85 text-xs uppercase hover:text-[#F5F0E8] tracking-wider"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Stories
              </Link>
              <Link
                href="/contained/help"
                className="text-[#F5F0E8]/85 text-xs uppercase hover:text-[#F5F0E8] tracking-wider"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Help
              </Link>
            </div>
          </div>
          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p
              className="text-[#F5F0E8]/60 text-xs uppercase tracking-widest"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              © 2026 CONTAINED. Sovereignty never ceded. Built on Ngunnawal and Ngambri Country.
            </p>
            <Link
              href="/"
              className="text-[#F5F0E8]/60 text-xs uppercase hover:text-[#F5F0E8] tracking-widest"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              JusticeHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

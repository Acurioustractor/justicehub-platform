'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  tourStops,
  journeyContainers,
  campaignFundraising,
  campaignMedia,
  worldTour,
} from '@/content/campaign';
import FeaturedVideo from '@/components/FeaturedVideo';
import ImageGallery from '@/components/ImageGallery';
import SupportersWall from '@/components/contained/SupportersWall';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  Globe,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  Play,
  Share2,
  Target,
  Users,
} from 'lucide-react';

// Dynamic import for Leaflet (needs browser)
const TourMap = dynamic(() => import('@/components/contained/TourMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] border-2 border-gray-800 bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

interface Basecamp {
  slug: string;
  name: string;
  region: string;
  description: string;
  stats: { label: string; value: string }[];
}

const FALLBACK_BASECAMPS: Basecamp[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Alice Springs, NT',
    description: 'Aboriginal-led cultural healing achieving what detention never could.',
    stats: [{ label: 'Impact', value: '95% reduced anti-social behavior' }],
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    description: 'Fitness and mentoring redirecting young people from the justice system.',
    stats: [{ label: 'Engaged', value: '400+ young people yearly' }],
  },
  {
    slug: 'mounty-yarns',
    name: 'Mounty Yarns',
    region: 'Mount Druitt, NSW',
    description: 'Youth-led storytelling and media empowering young voices.',
    stats: [{ label: 'Trained', value: '50+ young storytellers' }],
  },
  {
    slug: 'picc-townsville',
    name: 'PICC Townsville',
    region: 'Townsville, QLD',
    description: 'Pasifika family support strengthening community connections.',
    stats: [{ label: 'Supported', value: '300+ families annually' }],
  },
];

const containerTones: Record<string, string> = {
  critical: 'border-red-600 bg-red-50',
  transitional: 'border-yellow-600 bg-yellow-50',
  hopeful: 'border-emerald-600 bg-emerald-50',
};

const containerAccents: Record<string, string> = {
  critical: 'text-red-700',
  transitional: 'text-yellow-700',
  hopeful: 'text-emerald-700',
};

const SHARE_TEXT = 'CONTAINED: One shipping container, three rooms revealing the reality of youth detention. Australian Tour 2026.';
const SHARE_URL = 'https://justicehub.org.au/contained';

const TOUR_PARTNERS = [
  { name: 'Adelaide Convention Centre', role: 'Venue Partner' },
  { name: 'UWA School of Social Sciences', role: 'Academic Partner' },
  { name: 'Justice Reform Initiative', role: 'Policy Partner' },
  { name: 'Reintegration Conference', role: 'Conference Partner' },
];

const ENDORSEMENT_QUOTES = [
  {
    quote: 'Every decision-maker in this country should spend thirty minutes inside this container.',
    name: 'Youth Justice Advocate',
  },
  {
    quote: 'This is what accountability looks like — making the system feel what it does to young people.',
    name: 'Community Leader',
  },
  {
    quote: 'The evidence is overwhelming. CONTAINED makes you understand it in your bones.',
    name: 'Policy Researcher',
  },
];

function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <div className="flex items-center gap-3 mt-8">
      <Share2 className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Share</span>
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-sm font-bold border border-white/30 text-white hover:bg-white hover:text-black transition-colors"
        >
          {link.label}
        </a>
      ))}
      <button
        onClick={copyLink}
        className="px-3 py-1 text-sm font-bold border border-white/30 text-white hover:bg-white hover:text-black transition-colors flex items-center gap-1"
      >
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
        body: JSON.stringify({
          email,
          full_name: name || undefined,
          subscription_type: 'general',
          source: 'contained_tour',
          tags: ['Contained Tour 2026'],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

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
      <div className="bg-emerald-900/50 border border-emerald-500/30 p-6 text-center">
        <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
        <p className="font-bold text-lg">You&apos;re in.</p>
        <p className="text-gray-400 text-sm mt-1">
          We&apos;ll keep you updated on the tour, events, and how to get involved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-emerald-400" />
        <h3 className="font-bold text-lg">Stay in the Loop</h3>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Tour dates, behind-the-scenes, and ways to support the movement.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm flex-1 min-w-0 focus:outline-none focus:border-emerald-400"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm flex-1 min-w-0 focus:outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-emerald-500 text-black font-bold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-sm mt-2">{errorMsg}</p>
      )}
      <p className="text-gray-600 text-xs mt-3">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}

interface ProjectStory {
  id: string;
  title: string;
  summary: string;
  story_image_url: string;
  themes: string[];
  story_category: string;
}

interface ProjectPhoto {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  thumbnail_url: string;
}

interface HeroVideo {
  video_url: string;
  title: string;
  description: string;
  thumbnail_url: string;
}

interface FeaturedBacker {
  name: string;
  avatar_url?: string;
  message?: string;
}

function BackerSection({ slug }: { slug: string }) {
  const [backerCount, setBackerCount] = useState(0);
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [featuredBackers, setFeaturedBackers] = useState<FeaturedBacker[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${slug}/backers`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') setBackerCount(data.count);
        if (Array.isArray(data.recentNames)) setRecentNames(data.recentNames);
        if (Array.isArray(data.featured)) setFeaturedBackers(data.featured);
      })
      .catch(console.error);
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/projects/${slug}/backers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: message || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setStatus('success');
      setBackerCount((c) => c + 1);
      setRecentNames((prev) => {
        const parts = name.trim().split(/\s+/);
        const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
        return [display, ...prev].slice(0, 5);
      });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const recentText = recentNames.length > 0
    ? `${recentNames.slice(0, 3).join(', ')}${backerCount > 3 ? ` and ${backerCount - 3} others` : ''} back this tour`
    : null;

  return (
    <section className="py-16 bg-gray-50 border-y-2 border-black">
      <div className="container-justice">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-center">
            Back This Tour
          </h2>
          <p className="text-xl text-gray-700 mb-8 text-center max-w-2xl mx-auto">
            Add your name. Build the pressure. Show decision-makers that the public demands change.
          </p>

          {/* Supporters Wall */}
          <SupportersWall backers={featuredBackers} totalCount={backerCount} />

          {/* Recent text */}
          {recentText && (
            <p className="text-sm text-gray-500 text-center mb-6">{recentText}</p>
          )}

          {/* Signup Form */}
          {status === 'success' ? (
            <div className="bg-emerald-50 border-2 border-emerald-600 p-6 text-center mb-8">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
              <p className="font-bold text-lg">You&apos;re backing the tour.</p>
              <p className="text-gray-600 text-sm mt-1">
                Your name has been added. Share to build more pressure.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Your name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                />
                <input
                  type="email"
                  placeholder="Email address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <textarea
                placeholder="Why do you back this tour? (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black mb-4 resize-none"
              />
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </span>
                  ) : (
                    'Back This Tour'
                  )}
                </button>
                <p className="text-xs text-gray-500">
                  Your first name and last initial will be shown publicly. Email kept private.
                </p>
              </div>
              {status === 'error' && (
                <p className="text-red-600 text-sm mt-2">{errorMsg}</p>
              )}
            </form>
          )}

          {/* Endorsement quotes */}
          <div className="space-y-4 mb-8">
            {ENDORSEMENT_QUOTES.map((eq, i) => (
              <blockquote
                key={i}
                className="bg-white border-2 border-gray-200 p-6 border-l-4 border-l-emerald-600"
              >
                <p className="text-lg md:text-xl italic text-gray-800 mb-3">&ldquo;{eq.quote}&rdquo;</p>
                <footer className="text-sm font-bold text-emerald-700 uppercase tracking-widest">
                  {eq.name}
                </footer>
              </blockquote>
            ))}
          </div>

          {/* Share CTA */}
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
              Add pressure — share with your network
            </p>
            <div className="flex justify-center">
              <div className="flex items-center gap-3">
                <Share2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Share</span>
                {[
                  { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}` },
                  { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}` },
                  { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}` },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm font-bold border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ROLE_LABELS: Record<string, string> = {
  attendee: 'Attendee',
  volunteer: 'Volunteer',
  media: 'Media',
  politician: 'Politician',
  educator: 'Educator',
  other: 'Other',
};

function ReactionsSection({
  reactions,
  reactionCount,
  recommendRate,
  slug,
  onNewReaction,
}: {
  reactions: { name: string; role: string; reaction: string; rating?: number; created_at: string }[];
  reactionCount: number;
  recommendRate: number;
  slug: string;
  onNewReaction: (r: { name: string; role: string; reaction: string; created_at: string }) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('attendee');
  const [reaction, setReaction] = useState('');
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !reaction) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/projects/${slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          role,
          reaction,
          rating: rating || undefined,
          would_recommend: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      setStatus('success');
      onNewReaction({ name, role, reaction, created_at: new Date().toISOString() });
      setName('');
      setEmail('');
      setReaction('');
      setRating(0);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <section className="py-16 bg-amber-50 border-y-2 border-black">
      <div className="container-justice">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
            After the Container
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl">
            What people say after experiencing thirty minutes inside.
          </p>

          {/* Stats row */}
          {reactionCount > 0 && (
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-black">{reactionCount}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Reactions</div>
              </div>
              {recommendRate > 0 && (
                <div className="text-center">
                  <div className="text-4xl font-black text-emerald-700">{recommendRate}%</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Would Recommend</div>
                </div>
              )}
            </div>
          )}

          {/* Recent reactions */}
          {reactions.length > 0 && (
            <div className="space-y-3 mb-8">
              {reactions.slice(0, 6).map((r, i) => (
                <div key={i} className="bg-white border-2 border-gray-200 p-5">
                  <p className="text-gray-800 mb-3 italic">&ldquo;{r.reaction}&rdquo;</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold">{r.name}</span>
                    {r.role && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 uppercase tracking-widest font-bold">
                        {ROLE_LABELS[r.role] || r.role}
                      </span>
                    )}
                    {r.rating && (
                      <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit form */}
          {status === 'success' ? (
            <div className="bg-emerald-50 border-2 border-emerald-600 p-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
              <p className="font-bold text-lg">Thank you for sharing.</p>
              <p className="text-gray-600 text-sm mt-1">
                Your reaction helps build the case for change.
              </p>
              <button
                onClick={() => { setStatus('idle'); setFormOpen(true); }}
                className="mt-4 text-sm font-bold uppercase tracking-widest text-emerald-700 hover:underline"
              >
                Share Another
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-black">
              <button
                onClick={() => setFormOpen(!formOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-lg">Share Your Reaction</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${formOpen ? 'rotate-180' : ''}`} />
              </button>
              {formOpen && (
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your name *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional — kept private)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                      I am a...
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          className={`px-3 py-1.5 text-sm font-bold border transition-colors ${
                            role === value
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="What was your experience? What did you feel? *"
                    value={reaction}
                    onChange={(e) => setReaction(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 text-sm focus:outline-none focus:border-black resize-none"
                  />
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                      Rating (optional)
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star === rating ? 0 : star)}
                          className={`text-2xl ${star <= rating ? 'text-amber-500' : 'text-gray-300'} hover:text-amber-400`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading' || !name || !reaction}
                    className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </span>
                    ) : (
                      'Share Reaction'
                    )}
                  </button>
                  {status === 'error' && (
                    <p className="text-red-600 text-sm">{errorMsg}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface BasecampStory {
  title: string;
  excerpt: string;
  quote: string;
  thumbnail_url: string;
}

function BasecampStoriesSection({ basecamps }: { basecamps: { slug: string; name: string; region: string }[] }) {
  const [storiesByOrg, setStoriesByOrg] = useState<Record<string, BasecampStory[]>>({});

  useEffect(() => {
    basecamps.forEach((bc) => {
      fetch(`/api/organizations/${bc.slug}`)
        .then((res) => res.json())
        .then((data) => {
          const stories = (data.stories || [])
            .filter((s: { is_public: boolean }) => s.is_public)
            .slice(0, 3);
          if (stories.length > 0) {
            setStoriesByOrg((prev) => ({ ...prev, [bc.slug]: stories }));
          }
        })
        .catch(console.error);
    });
  }, [basecamps]);

  const orgsWithStories = basecamps.filter((bc) => storiesByOrg[bc.slug]?.length > 0);

  if (orgsWithStories.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container-justice">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
          Stories From the Basecamps
        </h2>
        <p className="text-xl text-gray-700 mb-12 max-w-3xl">
          Lived experience from the communities anchoring this tour — the organisations already doing what works.
        </p>

        <div className="space-y-12">
          {orgsWithStories.map((bc) => (
            <div key={bc.slug}>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-xl">{bc.name}</h3>
                <span className="text-sm text-gray-500">{bc.region}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {storiesByOrg[bc.slug].map((story, i) => (
                  <div key={i} className="border-2 border-black">
                    {story.thumbnail_url && (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={story.thumbnail_url}
                          alt={story.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-bold mb-2">{story.title}</h4>
                      {story.quote && (
                        <p className="text-sm italic text-gray-600 mb-2">
                          &ldquo;{story.quote}&rdquo;
                        </p>
                      )}
                      {story.excerpt && (
                        <p className="text-sm text-gray-700 line-clamp-3">{story.excerpt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/organizations/${bc.slug}`}
                className="inline-flex items-center gap-2 mt-4 text-sm font-bold uppercase tracking-widest hover:underline"
              >
                See All From {bc.name} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const NOMINATION_CATEGORIES = [
  { value: 'politician', label: 'Politician', emoji: '🏛' },
  { value: 'justice_official', label: 'Justice Official', emoji: '⚖️' },
  { value: 'media', label: 'Media', emoji: '📺' },
  { value: 'business', label: 'Business Leader', emoji: '💼' },
  { value: 'community', label: 'Community Leader', emoji: '🤝' },
  { value: 'other', label: 'Other', emoji: '✦' },
];

function NominateSection({ slug }: { slug: string }) {
  const [count, setCount] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<{ nominee_name: string; category: string; reason: string; created_at: string }[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeTitle, setNomineeTitle] = useState('');
  const [nomineeOrg, setNomineeOrg] = useState('');
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [nominatorName, setNominatorName] = useState('');
  const [nominatorEmail, setNominatorEmail] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${slug}/nominations`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') setCount(data.count);
        if (data.byCategory) setByCategory(data.byCategory);
        if (Array.isArray(data.recent)) setRecent(data.recent);
      })
      .catch(console.error);
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nomineeName || !category || !reason) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/projects/${slug}/nominations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominee_name: nomineeName,
          nominee_title: nomineeTitle || undefined,
          nominee_org: nomineeOrg || undefined,
          category,
          reason,
          nominator_name: nominatorName || undefined,
          nominator_email: nominatorEmail || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      const data = await res.json();
      setStatus('success');
      setCount(data.count || count + 1);
      setByCategory((prev) => ({ ...prev, [category]: (prev[category] || 0) + 1 }));
      setRecent((prev) => [
        { nominee_name: nomineeName, category, reason: reason.slice(0, 100), created_at: new Date().toISOString() },
        ...prev,
      ].slice(0, 10));

      // Reset form
      setNomineeName('');
      setNomineeTitle('');
      setNomineeOrg('');
      setCategory('');
      setReason('');
      setNominatorName('');
      setNominatorEmail('');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const categoryLabel = (cat: string) =>
    NOMINATION_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const categoryEmoji = (cat: string) =>
    NOMINATION_CATEGORIES.find((c) => c.value === cat)?.emoji || '✦';

  return (
    <section id="nominate" className="py-16 bg-red-950 text-white">
      <div className="container-justice">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-6 h-6 text-red-400" />
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Who Should Experience This?
            </h2>
          </div>
          <p className="text-xl text-red-200/80 mb-8 max-w-2xl">
            Nominate decision-makers who need to spend thirty minutes inside
            this container. Build the public pressure that forces participation.
          </p>

          {/* Counter */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-8xl font-black tabular-nums text-white">
              {count.toLocaleString()}
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-red-300 mt-1">
              Nominations
            </div>
          </div>

          {/* Category breakdown chips */}
          {Object.keys(byCategory).length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {NOMINATION_CATEGORIES.filter((c) => byCategory[c.value]).map((cat) => (
                <div
                  key={cat.value}
                  className="bg-white/10 border border-white/20 px-4 py-2 text-center"
                >
                  <div className="text-2xl font-black">{byCategory[cat.value]}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-red-300">
                    {cat.emoji} {cat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nomination Form */}
          {status === 'success' && !formOpen ? (
            <div className="bg-emerald-900/50 border border-emerald-500/30 p-6 text-center mb-8">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
              <p className="font-bold text-lg">Nomination submitted.</p>
              <p className="text-gray-400 text-sm mt-1">
                Share to build more pressure — every nomination counts.
              </p>
              <button
                onClick={() => { setStatus('idle'); setFormOpen(true); }}
                className="mt-4 text-sm font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
              >
                Nominate Another
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 mb-8">
              <button
                onClick={() => setFormOpen(!formOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-lg">Nominate a Decision Maker</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${formOpen ? 'rotate-180' : ''}`} />
              </button>

              {formOpen && (
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                  {/* Who are you nominating? */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Their name *"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      required
                      className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400"
                    />
                    <input
                      type="text"
                      placeholder="Title / role (e.g. Premier)"
                      value={nomineeTitle}
                      onChange={(e) => setNomineeTitle(e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Organisation (e.g. QLD Government)"
                    value={nomineeOrg}
                    onChange={(e) => setNomineeOrg(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400"
                  />

                  {/* Category */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {NOMINATION_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`px-3 py-2 text-sm font-bold border transition-colors ${
                            category === cat.value
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <textarea
                    placeholder="Why should they experience this? *"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400 resize-none"
                  />

                  {/* Optional: your info */}
                  <details className="group">
                    <summary className="text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-300">
                      Your details (optional — kept private)
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={nominatorName}
                        onChange={(e) => setNominatorName(e.target.value)}
                        className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400"
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={nominatorEmail}
                        onChange={(e) => setNominatorEmail(e.target.value)}
                        className="px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </details>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={status === 'loading' || !nomineeName || !category || !reason}
                      className="bg-red-600 text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-red-500 transition-colors disabled:opacity-50 w-full sm:w-auto"
                    >
                      {status === 'loading' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                        </span>
                      ) : (
                        'Submit Nomination'
                      )}
                    </button>
                    <p className="text-xs text-gray-500">
                      Nominee name shown publicly. Your details kept private.
                    </p>
                  </div>
                  {status === 'error' && (
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Recent nominations feed */}
          {recent.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-red-300 mb-4">
                Recent Nominations
              </h3>
              <div className="space-y-2">
                {recent.map((nom, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-white/5 border border-white/10 p-4"
                  >
                    <span className="text-lg flex-shrink-0">{categoryEmoji(nom.category)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{nom.nominee_name}</span>
                        <span className="text-xs bg-white/10 px-2 py-0.5 text-red-300 uppercase tracking-widest">
                          {categoryLabel(nom.category)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{nom.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function TourContent() {
  const [basecamps, setBasecamps] = useState<Basecamp[]>(FALLBACK_BASECAMPS);
  const [basecampsLoading, setBasecampsLoading] = useState(true);
  const [heroVideo, setHeroVideo] = useState<HeroVideo | null>(null);
  const [cctvVideo, setCctvVideo] = useState<HeroVideo | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [projectStories, setProjectStories] = useState<ProjectStory[]>([]);
  const [projectPhotos, setProjectPhotos] = useState<ProjectPhoto[]>([]);
  const [voices, setVoices] = useState<{ name: string; image_url: string; quote: string; video_url?: string }[]>([]);
  const [liveRaised, setLiveRaised] = useState<number | null>(null);
  const [liveDonorCount, setLiveDonorCount] = useState(0);
  const [reactions, setReactions] = useState<{ name: string; role: string; reaction: string; rating?: number; created_at: string }[]>([]);
  const [reactionCount, setReactionCount] = useState(0);
  const [recommendRate, setRecommendRate] = useState(0);
  const tourStopRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch('/api/basecamps')
      .then((res) => res.json())
      .then((data: Basecamp[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBasecamps(data);
        }
      })
      .catch(console.error)
      .finally(() => setBasecampsLoading(false));

    // Fetch hero video from project media (featured = walkthrough)
    fetch('/api/projects/the-contained/media?type=video&featured=true')
      .then((res) => res.json())
      .then((data) => {
        const video = data.videos?.[0];
        if (video?.video_url) {
          setHeroVideo({
            video_url: video.video_url,
            title: video.title || campaignMedia.heroVideo.title,
            description: video.description || campaignMedia.heroVideo.description,
            thumbnail_url: video.thumbnail_url || '',
          });
        }
      })
      .catch(console.error);

    // Fetch CCTV / non-featured video
    fetch('/api/projects/the-contained/media?type=video')
      .then((res) => res.json())
      .then((data) => {
        // Find first non-featured video (CCTV footage)
        const videos = data.videos || [];
        const cctv = videos.find((v: { is_featured?: boolean }) => !v.is_featured) || videos[1];
        if (cctv?.video_url) {
          setCctvVideo({
            video_url: cctv.video_url,
            title: cctv.title || 'Surveillance Footage',
            description: cctv.description || '',
            thumbnail_url: cctv.thumbnail_url || '',
          });
        }
      })
      .catch(console.error);

    // Fetch hero image from partner_photos
    fetch('/api/projects/the-contained/media?type=photo')
      .then((res) => res.json())
      .then((data) => {
        const photos = data.photos || [];
        // Look for a hero photo type, or use the first photo
        const hero = photos.find((p: { photo_type?: string }) => p.photo_type === 'hero') || photos[0];
        if (hero?.photo_url) {
          setHeroImage(hero.photo_url);
        }
        if (photos.length > 0) {
          setProjectPhotos(photos);
        }
      })
      .catch(console.error);

    // Fetch project stories
    fetch('/api/projects/the-contained/stories')
      .then((res) => res.json())
      .then((data) => {
        if (data.stories?.length > 0) {
          setProjectStories(data.stories);
        }
      })
      .catch(console.error);

    // Fetch storyteller voices (people with photos + quotes)
    fetch('/api/contained/voices')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setVoices(data);
      })
      .catch(console.error);

    // Fetch live fundraising stats from Stripe
    fetch('/api/campaign/stats')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total_raised_cents === 'number') {
          setLiveRaised(data.total_raised_cents / 100);
          setLiveDonorCount(data.donor_count || 0);
        }
      })
      .catch(console.error);

    // Fetch tour reactions
    fetch('/api/projects/the-contained/reactions')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') setReactionCount(data.count);
        if (typeof data.recommendRate === 'number') setRecommendRate(data.recommendRate);
        if (Array.isArray(data.recent)) setReactions(data.recent);
      })
      .catch(console.error);
  }, []);

  const currentAmount = liveRaised ?? campaignFundraising.currentAmount;
  const progressPercent = Math.min(
    (currentAmount / campaignFundraising.goal) * 100,
    100
  );

  // Days until first tour stop
  const firstStopDate = new Date(tourStops[0].date + 'T00:00:00');
  const daysUntil = Math.max(
    0,
    Math.ceil((firstStopDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handleMapStopClick = (eventSlug: string) => {
    const el = tourStopRefs.current[eventSlug];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-emerald-500');
      setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-500'), 2000);
    }
  };

  // Story display: max 6, portrait style for those with images
  const displayStories = projectStories.slice(0, 6);

  const walkthroughUrl = heroVideo?.video_url || campaignMedia.heroVideo.url;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main>
        {/* ============================================================
            1. HERO — Full-bleed image bg, white text, stats, countdown
            ============================================================ */}
        <section className="relative h-screen flex items-center justify-center">
          {/* Background video / image fallback */}
          <div className="absolute inset-0">
            {walkthroughUrl ? (
              <video
                src={walkthroughUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : heroImage ? (
              <Image
                src={heroImage}
                alt="CONTAINED"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            ) : null}
            {/* Even vignette so video shows through everywhere */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Centred text block */}
          <div className="relative z-10 text-center text-white px-6" style={{ textShadow: '0 2px 30px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.5)' }}>
            {daysUntil > 0 && (
              <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                {daysUntil} days until Mount Druitt
              </div>
            )}

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-4 leading-[0.85] text-red-500">
              CONTAINED
            </h1>

            <p className="text-base md:text-xl text-white/90 mb-2 max-w-xl mx-auto">
              One shipping container. Three rooms. Thirty minutes.
            </p>
            <p className="text-sm md:text-base text-white/60 mb-8 max-w-lg mx-auto">
              The reality of youth detention — and what works instead.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Link
                href="#nominate"
                className="bg-red-600 text-white px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-red-500 transition-colors"
              >
                Nominate a Leader
              </Link>
              <Link
                href="#back-this-tour"
                className="bg-emerald-500 text-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-emerald-400 transition-colors"
              >
                Back This Tour
              </Link>
              <Link
                href="/events"
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-colors"
              >
                Tour Events
              </Link>
            </div>

            {/* Stat strip */}
            <div className="flex flex-wrap justify-center gap-3 text-xs font-mono uppercase tracking-wider">
              <span className="bg-black/60 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-white">
                <strong className="text-red-400">$1.2M</strong>/child/year
              </span>
              <span className="bg-black/60 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-white">
                <strong className="text-red-400">84%</strong> reoffend
              </span>
              <span className="bg-black/60 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-white">
                <strong className="text-emerald-400">$75</strong>/day alternatives
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            2. STORY SO FAR
            ============================================================ */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              The Story So Far
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  It started with a simple idea: what if decision-makers could{' '}
                  <strong className="text-black">feel</strong> what youth detention
                  is actually like? Not read about it. Not hear statistics. Feel it.
                </p>
                <p>
                  CONTAINED was born in Brisbane and prototyped at Mount
                  Druitt with Mounty Yarns — a youth-led storytelling organisation
                  that understood the power of immersive experience.
                </p>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Hosts signed up. Community leaders backed it. The evidence was
                  already overwhelming — $1.2M per detained child per year, 84%
                  reoffending, while community programs cost a fraction and actually
                  work.
                </p>
                <p>
                  Now we&apos;re taking it national.{' '}
                  <strong className="text-black">
                    Four stops across Australia in 2026
                  </strong>
                  , building the case for therapeutic alternatives that centre
                  community, culture, and evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            2.5. CONTAINER ROOM — Full-bleed split-view photo
            ============================================================ */}
        <section className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden">
          <Image
            src="/media/contained/container-room.jpg"
            alt="CONTAINED — therapeutic room vs detention cell, side by side"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <p className="text-white text-lg md:text-2xl font-black max-w-3xl tracking-tight">
              Left: what healing looks like. Right: what $1.2 million per child buys.
            </p>
            <p className="text-white/50 text-sm mt-2">
              CONTAINED — Brisbane prototype, 2025
            </p>
          </div>
        </section>

        {/* ============================================================
            3. CCTV SURVEILLANCE SECTION
            ============================================================ */}
        {cctvVideo && (
          <section className="relative bg-black py-16 overflow-hidden">
            {/* Scanline overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
              }}
            />
            {/* Sweeping scanline animation */}
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,255,0,0.06) 50%, transparent 100%)',
                backgroundSize: '100% 40px',
                animation: 'scanline 4s linear infinite',
              }}
            />
            <style jsx>{`
              @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
              }
            `}</style>

            <div className="container-justice relative z-20">
              {/* Timestamp badge */}
              <div className="flex justify-end mb-4">
                <div className="font-mono text-xs text-green-500 bg-black/80 border border-green-900 px-3 py-1.5 tracking-wider">
                  REC <span className="animate-pulse text-red-500 inline-block">●</span> BRISBANE — CONTAINER 01
                </div>
              </div>

              <div className="max-w-5xl mx-auto">
                <FeaturedVideo
                  videoUrl={cctvVideo.video_url}
                  title={cctvVideo.title}
                  description={cctvVideo.description || undefined}
                  thumbnailUrl={cctvVideo.thumbnail_url || undefined}
                />
              </div>

              <p className="text-center text-white/90 text-2xl md:text-3xl font-black mt-8 tracking-tight">
                This is what $3,320 per day looks like.
              </p>
              <p className="text-center text-white/40 text-sm mt-2 font-mono">
                Average daily cost per child in youth detention — Australian Institute of Health and Welfare
              </p>
            </div>
          </section>
        )}

        {/* ============================================================
            4. FROM THE GROUND — Photo Gallery (4-col, denser)
            ============================================================ */}
        {projectPhotos.length > 0 && (
          <section className="py-16">
            <div className="container-justice">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
                FROM THE GROUND
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl">
                Behind the scenes and on the ground — the people and places making this tour happen.
              </p>
              <ImageGallery
                images={projectPhotos.map((p) => ({
                  src: p.photo_url,
                  alt: p.title || 'Tour photo',
                  caption: p.title || undefined,
                }))}
                columns={4}
              />
            </div>
          </section>
        )}

        {/* ============================================================
            5. THREE CONTAINERS
            ============================================================ */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              The Three Rooms
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Thirty minutes. One container. Three rooms — each one tells a different part of
              Australia&apos;s youth justice story.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {journeyContainers.map((container) => (
                <div
                  key={container.id}
                  className={`border-2 p-6 ${containerTones[container.tone] || 'border-black'}`}
                >
                  <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Container {container.step}
                  </div>
                  <h3
                    className={`text-2xl font-black mb-1 ${containerAccents[container.tone] || ''}`}
                  >
                    {container.title}
                  </h3>
                  <div className="text-sm font-bold text-gray-600 mb-4">
                    {container.headline}
                  </div>
                  <p className="text-gray-700 mb-4">{container.summary}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {container.stats.map((stat, i) => (
                      <div key={i} className="text-center p-2 bg-white/80 border border-gray-200">
                        <div className="text-lg font-black">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm italic text-gray-500">
                    {container.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            6. TOUR MAP + STOPS — Dark theme
            ============================================================ */}
        <section className="py-16 bg-gray-950 text-white">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Tour Stops
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl">
              Four cities. Four communities. One mission: proving that youth justice
              can be different.
            </p>

            {/* Interactive Map */}
            <div className="mb-12">
              <TourMap stops={tourStops} onStopClick={handleMapStopClick} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tourStops.map((stop) => (
                <div
                  key={stop.eventSlug}
                  ref={(el) => { tourStopRefs.current[stop.eventSlug] = el; }}
                  className="bg-gray-900 border border-gray-800 transition-all duration-300 text-white"
                >
                  <div className="p-6 border-b border-gray-800 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400">
                          {stop.city}, {stop.state}
                        </span>
                      </div>
                      <h3 className="font-black text-xl text-white">{stop.venue}</h3>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                        stop.status === 'confirmed'
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
                          : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                      }`}
                    >
                      {stop.status}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(stop.date + 'T00:00:00').toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{stop.description}</p>
                    {stop.partnerQuote && (
                      <blockquote className="border-l-4 border-emerald-500 pl-4 mb-4">
                        <p className="text-sm italic text-gray-400">&ldquo;{stop.partnerQuote}&rdquo;</p>
                      </blockquote>
                    )}
                    <div className="text-sm text-gray-500 mb-4">
                      <strong className="text-gray-300">Partner:</strong> {stop.partner}
                    </div>
                    <Link
                      href={`/events/${stop.eventSlug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                    >
                      Event Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            7. STORIES FROM THE MOVEMENT — Rich Tiles
            ============================================================ */}
        {displayStories.length > 0 && (
          <section className="py-16">
            <div className="container-justice">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
                Stories From the Movement
              </h2>
              <p className="text-xl text-gray-700 mb-12 max-w-3xl">
                Lived experience stories from the communities driving change.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayStories.map((story) => {
                  const pullQuote = story.summary
                    ? story.summary.split(/[.!?]/)[0] + '.'
                    : null;

                  if (story.story_image_url) {
                    // Portrait-style tile with image
                    return (
                      <div
                        key={story.id}
                        className="relative aspect-[3/4] md:aspect-[4/3] overflow-hidden border-2 border-black group"
                      >
                        <img
                          src={story.story_image_url}
                          alt={story.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Theme pills at top */}
                        {story.themes && story.themes.length > 0 && (
                          <div className="absolute top-4 left-4 flex flex-wrap gap-1 z-10">
                            {story.themes.slice(0, 3).map((theme) => (
                              <span
                                key={theme}
                                className="text-xs bg-black/70 text-white px-2 py-0.5 backdrop-blur-sm"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Dark gradient overlay from bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        {/* Content at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          {pullQuote && (
                            <p className="text-sm italic text-white/80 mb-3 line-clamp-2">
                              &ldquo;{pullQuote}&rdquo;
                            </p>
                          )}
                          <h3 className="font-black text-xl mb-2">{story.title}</h3>
                          {story.story_category && (
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                              {story.story_category}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // No-image fallback: colored gradient header
                  const gradients = [
                    'from-red-800 to-red-600',
                    'from-emerald-800 to-emerald-600',
                    'from-amber-800 to-amber-600',
                    'from-blue-800 to-blue-600',
                  ];
                  const gradient = gradients[displayStories.indexOf(story) % gradients.length];

                  return (
                    <div key={story.id} className="border-2 border-black">
                      <div className={`bg-gradient-to-br ${gradient} p-6 text-white`}>
                        {story.themes && story.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {story.themes.slice(0, 3).map((theme) => (
                              <span
                                key={theme}
                                className="text-xs bg-white/20 text-white px-2 py-0.5"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}
                        {pullQuote && (
                          <p className="text-sm italic text-white/80 mb-3">
                            &ldquo;{pullQuote}&rdquo;
                          </p>
                        )}
                        <h3 className="font-black text-xl">{story.title}</h3>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                          {story.summary}
                        </p>
                        {story.story_category && (
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            {story.story_category}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {projectStories.length > 6 && (
                <div className="mt-8 text-center">
                  <Link
                    href="/stories?project=the-contained"
                    className="inline-flex items-center gap-2 font-bold uppercase tracking-widest hover:underline"
                  >
                    See All Stories <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================
            8. FUND THE TOUR — with urgency countdown
            ============================================================ */}
        <section className="py-16 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Fund the Tour
            </h2>

            {/* Urgency + backer connection */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {daysUntil > 0 && (
                <div className="bg-red-600 text-white px-4 py-2">
                  <span className="font-black">{daysUntil} days</span>
                  <span className="text-red-100 text-sm ml-2">until first tour stop</span>
                </div>
              )}
              <p className="text-xl text-gray-700">
                ${currentAmount.toLocaleString()} raised of ${campaignFundraising.goal.toLocaleString()} goal.
                {liveDonorCount > 0 && <span className="text-gray-500"> ({liveDonorCount} donors)</span>}
                {' '}Help us close the gap.
              </p>
            </div>

            <div className="max-w-3xl">
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span>
                    ${currentAmount.toLocaleString()} raised
                  </span>
                  <span>
                    ${campaignFundraising.goal.toLocaleString()} goal
                  </span>
                </div>
                <div className="h-4 bg-gray-200 border border-black relative">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {campaignFundraising.milestones.map((milestone) => {
                    const pos =
                      (milestone.amount / campaignFundraising.goal) * 100;
                    return (
                      <div
                        key={milestone.amount}
                        className="absolute top-0 h-full w-px bg-gray-400"
                        style={{ left: `${pos}%` }}
                        title={milestone.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {campaignFundraising.milestones.map((milestone) => (
                  <div
                    key={milestone.amount}
                    className={`p-4 border-2 ${
                      currentAmount >= milestone.amount
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {currentAmount >= milestone.amount ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Target className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-black">
                        ${milestone.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="font-bold text-sm">{milestone.label}</div>
                    <div className="text-sm text-gray-600">
                      {milestone.description}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/contact?source=contained-tour&type=funding"
                className="inline-block bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
              >
                Express Support
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            9. BACK THIS TOUR — SupportersWall + form + endorsements
            ============================================================ */}
        <div id="back-this-tour">
          <BackerSection slug="the-contained" />
        </div>

        {/* ============================================================
            10. BASECAMP STORIES
            ============================================================ */}
        <BasecampStoriesSection basecamps={basecamps} />

        {/* ============================================================
            11. NOMINATE A DECISION MAKER
            ============================================================ */}
        <NominateSection slug="the-contained" />

        {/* ============================================================
            12. AFTER THE CONTAINER — Reactions
            ============================================================ */}
        <ReactionsSection
          reactions={reactions}
          reactionCount={reactionCount}
          recommendRate={recommendRate}
          slug="the-contained"
          onNewReaction={(r) => {
            setReactions((prev) => [r, ...prev].slice(0, 10));
            setReactionCount((c) => c + 1);
          }}
        />

        {/* ============================================================
            13. THE PLATFORM
            ============================================================ */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              The Platform Behind It
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              <div>
                <h3 className="font-bold text-xl mb-4 text-emerald-400">
                  JusticeHub
                </h3>
                <p className="text-gray-300 mb-4">
                  The digital infrastructure connecting community-led youth justice
                  programs with evidence, funding, and political will. Every tour
                  stop generates stories, data, and connections that feed back into
                  the platform.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white hover:text-emerald-400 transition-colors"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-4 text-emerald-400">
                  Empathy Ledger
                </h3>
                <p className="text-gray-300 mb-4">
                  Story-led infrastructure that ensures lived experience drives
                  change. CONTAINED is built on Empathy Ledger
                  technology — capturing impact, consent, and community authority
                  at every step.
                </p>
                <Link
                  href="/for-funders"
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white hover:text-emerald-400 transition-colors"
                >
                  Investment Thesis <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            11. BASECAMPS + TOUR PARTNERS
            ============================================================ */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Tour Hosts: The Basecamps
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Our four founding Basecamps anchor the tour — place-based organisations
              that have already proven what works.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {basecampsLoading ? (
                <div className="col-span-4 flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                basecamps.map((basecamp) => (
                  <div
                    key={basecamp.slug}
                    className="bg-white border-2 border-black"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {basecamp.region}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{basecamp.name}</h3>
                      {basecamp.stats?.[0] && (
                        <div className="text-2xl font-black text-emerald-700 mb-3">
                          {basecamp.stats[0].value}
                        </div>
                      )}
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {basecamp.description}
                      </p>
                      <Link
                        href={`/organizations/${basecamp.slug}`}
                        className="inline-flex items-center gap-2 mt-4 text-sm font-bold uppercase tracking-widest hover:underline"
                      >
                        Learn More <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tour Partners sub-section */}
            <div className="mt-12 pt-8 border-t-2 border-emerald-200">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6">
                Tour Partners
              </h3>
              <div className="flex flex-wrap gap-4">
                {TOUR_PARTNERS.map((partner) => (
                  <div
                    key={partner.name}
                    className="bg-white border border-emerald-300 px-4 py-3 flex items-center gap-3"
                  >
                    <span className="font-bold text-sm">{partner.name}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 font-bold uppercase tracking-widest">
                      {partner.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            12. WORLD TOUR
            ============================================================ */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Empathy Ledger World Tour
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              After Australia, we go global. The Empathy Ledger World Tour connects
              youth justice innovation across continents.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {worldTour.map((region) => (
                <div key={region.name} className="border-2 border-black">
                  <div className="p-6 border-b-2 border-black bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5" />
                      <h3 className="font-black text-xl">{region.name}</h3>
                    </div>
                    <p className="text-gray-700 text-sm">{region.description}</p>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-2">
                      {region.countries.map((country) => (
                        <li key={country.name} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">→</span>
                          <div>
                            <div className="font-bold">{country.name}</div>
                            <div className="text-sm text-gray-600">
                              {country.partner}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/international-exchange"
                className="inline-flex items-center gap-2 font-bold uppercase tracking-widest hover:underline"
              >
                International Exchange Details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            12.5. VOICES — Storyteller thumbnails with dramatic quotes
            ============================================================ */}
        {voices.length > 0 && (
          <section className="py-20 bg-black text-white overflow-hidden">
            <div className="container-justice">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-center">
                Voices From the Movement
              </h2>
              <p className="text-gray-500 text-center mb-12 text-lg">
                Real people. Real stories. The faces behind the change.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                {voices.map((voice, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] group cursor-pointer overflow-hidden"
                    onClick={() => {
                      if (voice.video_url) window.open(voice.video_url, '_blank');
                    }}
                  >
                    {/* Photo */}
                    <img
                      src={voice.image_url}
                      alt={voice.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Dark overlay — heavier at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* Quote + name at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      <p className="text-white/90 text-sm md:text-base italic leading-snug line-clamp-3 mb-2">
                        &ldquo;{voice.quote}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                          {voice.name}
                        </span>
                      </div>
                    </div>

                    {/* Play indicator if video */}
                    {voice.video_url && (
                      <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            13. GET INVOLVED + NEWSLETTER
            ============================================================ */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8 text-center">
              Get Involved
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="border-2 border-white/20 p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-4 text-emerald-400" />
                <h3 className="font-bold text-lg mb-2">Attend an Event</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Register for a tour stop and experience CONTAINED
                  for yourself.
                </p>
                <Link
                  href="/events"
                  className="inline-block bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors"
                >
                  View Events
                </Link>
              </div>

              <div className="border-2 border-white/20 p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-4 text-emerald-400" />
                <h3 className="font-bold text-lg mb-2">Host the Experience</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Bring CONTAINED to your community, conference, or
                  campus.
                </p>
                <Link
                  href="/contact?source=contained-tour&type=host"
                  className="inline-block bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors"
                >
                  Enquire
                </Link>
              </div>

              <div className="border-2 border-white/20 p-6 text-center">
                <Heart className="w-8 h-8 mx-auto mb-4 text-emerald-400" />
                <h3 className="font-bold text-lg mb-2">Philanthropic Partner</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Fund the tour, the documentation, and the movement behind it.
                </p>
                <Link
                  href="/contact?source=contained-tour&type=funding"
                  className="inline-block bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors"
                >
                  Partner With Us
                </Link>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="max-w-2xl mx-auto">
              <NewsletterSignup />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

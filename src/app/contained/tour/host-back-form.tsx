'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { Send, CheckCircle, ArrowRight, Heart, Box } from 'lucide-react';

const MONO = "'IBM Plex Mono', monospace";

const STATES = ['NSW', 'QLD', 'VIC', 'SA', 'WA', 'NT', 'TAS', 'ACT'];

type Intent = 'back' | 'host';

/**
 * GAP #18/#21 — "Back the Tour" / "Host the Container" capture, rendered at
 * /contained#back-this-tour (and #host-the-container for the host deep-link).
 *
 * Back  → role:supporter via the canonical /api/projects/the-contained/backers
 *         route (adds the supporter to the public backers wall).
 * Host  → role:partner via /api/contained/host, which also creates a GHL
 *         partner-pipeline opportunity once the Phase D env vars are set.
 */
export function HostBackForm() {
  const [intent, setIntent] = useState<Intent>('back');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [state, setState] = useState('');
  const [venueType, setVenueType] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deep-link: #host-the-container preselects the host intent — on first load
  // and on in-page anchor navigation (the action cards live below this form, so
  // the component is already mounted when "Host the Container" is clicked).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      if (window.location.hash.toLowerCase().includes('host')) setIntent('host');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) return;

    if (!name.trim()) {
      setError('Add your name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That email address does not look right.');
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (intent === 'host') {
        res = await fetch('/api/contained/host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            organization: organization || undefined,
            state: state || undefined,
            venue_type: venueType || undefined,
            message: message || undefined,
          }),
        });
      } else {
        res = await fetch('/api/projects/the-contained/backers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            message: message || undefined,
          }),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <section
      id="back-this-tour"
      className="relative bg-[#F5F0E8] overflow-hidden"
      style={{ padding: 'clamp(60px, 10vw, 120px) 0', scrollMarginTop: '96px' }}
    >
      {/* Host deep-link anchor */}
      <span id="host-the-container" className="block" style={{ scrollMarginTop: '96px' }} aria-hidden />

      <div className="relative z-10 max-w-2xl mx-auto px-6 lg:px-16">
        <div className="text-center mb-10">
          <span
            className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
            style={{ fontFamily: MONO, letterSpacing: '0.3em' }}
          >
            Get Behind the Tour
          </span>
          <h2
            className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            {intent === 'host' ? 'Bring It to Your Region' : 'Back the Tour'}
          </h2>
          <p className="text-[#0A0A0A]/70 max-w-xl mx-auto text-sm" style={{ fontFamily: MONO }}>
            {intent === 'host'
              ? 'Have a venue, festival, or community space? Partner with us to bring the container to your area.'
              : 'Add your name to the people standing behind this tour. The longer the list, the harder it is to ignore.'}
          </p>
        </div>

        {submitted ? (
          <div className="text-center border-2 border-[#0A0A0A] bg-white p-10">
            <CheckCircle className="w-14 h-14 text-[#059669] mx-auto mb-6" />
            <h3 className="font-bold text-[#0A0A0A] uppercase text-2xl mb-3">
              {intent === 'host' ? 'Thank You' : "You're On the Wall"}
            </h3>
            <p className="text-[#0A0A0A]/70 text-sm mb-8 max-w-md mx-auto" style={{ fontFamily: MONO }}>
              {intent === 'host'
                ? `Thanks ${name.trim()}. We will be in touch about what it takes to bring the container to your area.`
                : `Thanks ${name.trim()}. Your name is now part of the public list of people backing this tour.`}
            </p>
            <Link
              href="/contained/tour#tour"
              className="inline-flex items-center justify-center gap-2 bg-[#DC2626] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
            >
              Back to the Tour <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Intent toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIntent('back')}
                aria-pressed={intent === 'back'}
                className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  intent === 'back'
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'border-gray-300 text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`}
              >
                <Heart className="w-4 h-4" /> Back the Tour
              </button>
              <button
                type="button"
                onClick={() => setIntent('host')}
                aria-pressed={intent === 'host'}
                className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                  intent === 'host'
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'border-gray-300 text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`}
              >
                <Box className="w-4 h-4" /> Host It
              </button>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hb_name"
                  className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                >
                  Your name
                </label>
                <input
                  id="hb_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label
                  htmlFor="hb_email"
                  className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                >
                  Your email
                </label>
                <input
                  id="hb_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            {/* Host-only fields */}
            {intent === 'host' && (
              <div className="space-y-6 border-t-2 border-gray-200 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="hb_org"
                      className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                    >
                      Organisation
                    </label>
                    <input
                      id="hb_org"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Venue, festival, or org (optional)"
                      className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hb_state"
                      className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                    >
                      State
                    </label>
                    <select
                      id="hb_state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                    >
                      <option value="">Select state (optional)</option>
                      {STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="hb_venue"
                    className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                  >
                    Venue or space
                  </label>
                  <input
                    id="hb_venue"
                    type="text"
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value)}
                    placeholder="e.g. town square, festival site, community centre (optional)"
                    className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  />
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label
                htmlFor="hb_message"
                className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
              >
                {intent === 'host' ? 'Tell us more' : 'Why are you backing it? (optional)'}
              </label>
              <textarea
                id="hb_message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  intent === 'host'
                    ? 'Anything that would help us understand the space and the timing...'
                    : 'A line about why this matters to you...'
                }
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            {/* Honeypot */}
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              name="website"
              className="absolute -left-[9999px]"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {error && <p className="text-[#DC2626] text-sm font-bold">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#DC2626] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {intent === 'host' ? 'Offer to Host' : 'Add My Name'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

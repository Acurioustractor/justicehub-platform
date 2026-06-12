'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Send, CheckCircle, ArrowRight, Download, Share2 } from 'lucide-react';
import { TurnstileWidget } from '@/components/ui/turnstile-widget';

// User-facing labels map to the API's VALID_CATEGORIES values
// (/api/projects/[slug]/nominations).
const CATEGORIES = [
  { value: 'politician', label: 'Politician / MP' },
  { value: 'justice_official', label: 'Justice Official' },
  { value: 'media', label: 'Media' },
  { value: 'business', label: 'Business Leader' },
  { value: 'community', label: 'Community Leader' },
  { value: 'other', label: 'Other' },
];

const MONO = "'IBM Plex Mono', monospace";

/**
 * GAP #16 — Nominate-a-Leader form rendered at /contained#nominate.
 * POSTs to the canonical nominations route, which tags the nominator
 * role:supporter and records nominated_person (R4 canonical contract).
 */
export function NominateForm() {
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeTitle, setNomineeTitle] = useState('');
  const [nomineeOrg, setNomineeOrg] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [nominatorName, setNominatorName] = useState('');
  const [nominatorEmail, setNominatorEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tileUrl = `/api/contained/nomination-tile?${new URLSearchParams({
    name: nomineeName.trim(),
    ...(nomineeTitle.trim() ? { title: nomineeTitle.trim() } : {}),
    reason: reason.trim(),
  }).toString()}`;

  const shareText = `I just nominated ${nomineeName.trim()} to walk through CONTAINED — three rooms, ten minutes in each, inside the system they fund. Decision-makers should feel what they sign off on. Add your nomination: justicehub.com.au/contained#nominate`;

  async function handleShare() {
    const absoluteTile = `${window.location.origin}${tileUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: absoluteTile });
        return;
      } catch {
        // fall through to clipboard if the user cancels share
      }
    }
    await navigator.clipboard.writeText(`${shareText}\n${absoluteTile}`).catch(() => {});
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) return;

    if (!nomineeName.trim()) {
      setError('Add the name of the person you are nominating.');
      return;
    }
    if (!category) {
      setError('Choose a category.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Tell us why in at least a sentence (10 characters or more).');
      return;
    }
    if (nominatorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nominatorEmail)) {
      setError('That email address does not look right.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects/the-contained/nominations', {
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
          honeypot,
          turnstile_token: turnstileToken,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit nomination');
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <section
      id="nominate"
      className="relative bg-[#F5F0E8] overflow-hidden"
      style={{ padding: 'clamp(60px, 10vw, 120px) 0', scrollMarginTop: '96px' }}
    >
      <div className="relative z-10 max-w-2xl mx-auto px-6 lg:px-16">
        <div className="text-center mb-12">
          <span
            className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
            style={{ fontFamily: MONO, letterSpacing: '0.3em' }}
          >
            Nominate a Leader
          </span>
          <h2
            className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Who Needs to Walk Through Next?
          </h2>
          <p className="text-[#0A0A0A]/70 max-w-xl mx-auto text-sm" style={{ fontFamily: MONO }}>
            Name the decision-maker who needs to stand inside the container. Every
            nomination builds public pressure for change.
          </p>
        </div>

        {submitted ? (
          <div className="text-center border-2 border-[#0A0A0A] bg-white p-10">
            <CheckCircle className="w-14 h-14 text-[#059669] mx-auto mb-6" />
            <h3 className="font-bold text-[#0A0A0A] uppercase text-2xl mb-3">
              Nomination Received
            </h3>
            <p className="text-[#0A0A0A]/70 text-sm mb-8 max-w-md mx-auto" style={{ fontFamily: MONO }}>
              Thank you. {nomineeName.trim()} has been added to the wall. The more
              names that stack up, the harder this is to ignore.
            </p>

            {/* Share tile: generated from this nomination so it can go straight to social */}
            <div className="border-2 border-[#0A0A0A] bg-[#F5F0E8] p-6 mb-8 text-left">
              <span
                className="text-[#DC2626] text-xs font-medium uppercase block mb-3"
                style={{ fontFamily: MONO, letterSpacing: '0.3em' }}
              >
                Make it public
              </span>
              <p className="text-[#0A0A0A]/70 text-sm mb-4" style={{ fontFamily: MONO }}>
                Download your nomination tile and post it. Tag them. Pressure works
                in public.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tileUrl}
                alt={`${nomineeName.trim()} has been nominated to walk through CONTAINED`}
                className="w-full max-w-sm mx-auto border-2 border-[#0A0A0A] mb-4"
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={tileUrl}
                  download="contained-nominated.png"
                  className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#DC2626] transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Tile
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#0A0A0A] text-[#0A0A0A] px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#0A0A0A] hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" /> {shareCopied ? 'Caption Copied' : 'Share'}
                </button>
              </div>
            </div>

            <Link
              href="/contained/nominations"
              className="inline-flex items-center justify-center gap-2 bg-[#DC2626] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
            >
              See the Nominations Wall <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Who are you nominating */}
            <div>
              <label
                htmlFor="nominee_name"
                className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
              >
                Who are you nominating?
              </label>
              <input
                id="nominee_name"
                type="text"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                placeholder="Full name"
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <input
                  type="text"
                  value={nomineeTitle}
                  onChange={(e) => setNomineeTitle(e.target.value)}
                  placeholder="Title or role (optional)"
                  className="border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
                <input
                  type="text"
                  value={nomineeOrg}
                  onChange={(e) => setNomineeOrg(e.target.value)}
                  placeholder="Organisation (optional)"
                  className="border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                What kind of leader?
              </label>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-5 py-3 text-sm font-bold border-2 transition-colors ${
                      category === cat.value
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : 'text-[#0A0A0A] border-gray-300 hover:border-[#0A0A0A]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
              >
                Why this person?
              </label>
              <textarea
                id="reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="They make decisions about youth justice and need to see this firsthand because..."
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            {/* Optional nominator identity */}
            <div className="border-t-2 border-gray-200 pt-8">
              <p className="text-sm text-gray-500 mb-4">
                Optional: leave your details and we will let you know when this person
                responds or when the container reaches your area.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={nominatorName}
                  onChange={(e) => setNominatorName(e.target.value)}
                  placeholder="Your name"
                  className="border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
                <input
                  type="email"
                  value={nominatorEmail}
                  onChange={(e) => setNominatorEmail(e.target.value)}
                  placeholder="Your email"
                  className="border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              {/* Honeypot */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px]"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </div>

            <TurnstileWidget onSuccess={setTurnstileToken} />

            {error && <p className="text-[#DC2626] text-sm font-bold">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !turnstileToken}
              className="w-full flex items-center justify-center gap-2 bg-[#DC2626] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Nomination
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

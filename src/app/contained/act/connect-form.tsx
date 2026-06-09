'use client';

import { useState, FormEvent } from 'react';
import { Send, CheckCircle, Banknote, Handshake, Newspaper } from 'lucide-react';

const MONO = "'IBM Plex Mono', monospace";

type Role = 'funder' | 'partner' | 'media';

const ROLES: { value: Role; label: string; Icon: typeof Banknote; blurb: string }[] = [
  { value: 'funder', label: 'Funder', Icon: Banknote, blurb: 'Philanthropic or impact investor' },
  { value: 'partner', label: 'Partner', Icon: Handshake, blurb: 'Organisation, venue, or service' },
  { value: 'media', label: 'Media', Icon: Newspaper, blurb: 'Journalist or outlet' },
];

/**
 * GAP #20 — funder / partner / media routed capture, rendered on /contained/act.
 *
 * POSTs to /api/contained/connect, which tags the contact role:funder|partner|
 * media under the canonical contract, opens a pipeline opportunity for funders
 * and partners (gated on Phase D env vars), and routes the enquiry to the team
 * (benjamin@act.place).
 */
export function ConnectForm() {
  const [role, setRole] = useState<Role>('funder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch('/api/contained/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name,
          email,
          organization: organization || undefined,
          message: message || undefined,
        }),
      });
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
      id="connect"
      className="relative bg-[#F5F0E8] border-b-2 border-[#0A0A0A]"
      style={{ padding: 'clamp(48px, 8vw, 96px) 0', scrollMarginTop: '96px' }}
    >
      <div className="container-justice max-w-2xl">
        <div className="mb-10">
          <span
            className="text-[#DC2626] text-xs font-medium uppercase block mb-4"
            style={{ fontFamily: MONO, letterSpacing: '0.3em' }}
          >
            Reach Out Directly
          </span>
          <h2
            className="font-bold text-[#0A0A0A] uppercase text-3xl md:text-5xl mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Are You a Funder, Partner, or Journalist?
          </h2>
          <p className="text-[#0A0A0A]/70 text-sm max-w-xl" style={{ fontFamily: MONO }}>
            Skip the templates above. Tell us who you are and we will come to you directly.
          </p>
        </div>

        {submitted ? (
          <div className="text-center border-2 border-[#0A0A0A] bg-white p-10">
            <CheckCircle className="w-14 h-14 text-[#059669] mx-auto mb-6" />
            <h3 className="font-bold text-[#0A0A0A] uppercase text-2xl mb-3">Message Received</h3>
            <p className="text-[#0A0A0A]/70 text-sm max-w-md mx-auto" style={{ fontFamily: MONO }}>
              Thanks {name.trim()}. We have your details and will be in touch shortly. If you need
              us sooner, reply to the confirmation in your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role toggle */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                I am a…
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      aria-pressed={active}
                      className={`flex flex-col items-start gap-2 px-4 py-4 text-left border-2 transition-colors ${
                        active
                          ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                          : 'border-gray-300 text-[#0A0A0A] hover:border-[#0A0A0A]'
                      }`}
                    >
                      <r.Icon className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-widest">{r.label}</span>
                      <span
                        className={`text-[11px] leading-tight ${active ? 'text-white/70' : 'text-gray-500'}`}
                        style={{ fontFamily: MONO }}
                      >
                        {r.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cn_name"
                  className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                >
                  Your name
                </label>
                <input
                  id="cn_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label
                  htmlFor="cn_email"
                  className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
                >
                  Your email
                </label>
                <input
                  id="cn_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            {/* Organisation */}
            <div>
              <label
                htmlFor="cn_org"
                className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
              >
                Organisation
              </label>
              <input
                id="cn_org"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Foundation, organisation, or outlet (optional)"
                className="w-full border-2 border-[#0A0A0A] bg-white px-4 py-3 text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="cn_message"
                className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3"
              >
                What would you like to talk about?
              </label>
              <textarea
                id="cn_message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  role === 'funder'
                    ? 'What you fund, and what a conversation might look like...'
                    : role === 'media'
                      ? 'Your outlet, angle, and deadline...'
                      : 'How you would like to work together...'
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
                  <Send className="w-4 h-4" /> Send to the Team
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

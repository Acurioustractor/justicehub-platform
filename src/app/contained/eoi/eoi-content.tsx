'use client';

import { useState, FormEvent } from 'react';
import { NominateForm } from '../tour/nominate-form';
import { TurnstileWidget } from '@/components/ui/turnstile-widget';

const EVENT_NAME = 'CONTAINED Adelaide 2026';
// No site naming until council confirms (language lock, Mission Control 11 June)
const EVENT_SLUG = 'contained-adelaide-2026';

type Door = 'nominate' | 'eoi' | 'support';

const DOORS: { key: Door; label: string; detail: string }[] = [
  {
    key: 'nominate',
    label: 'Nominate someone',
    detail:
      'Name the person who needs the thirty minutes. A magistrate, an MP, a CEO, a journalist. Any state. We make the personal invitation. Nobody gets doorstepped.',
  },
  {
    key: 'eoi',
    label: 'I need to be inside',
    detail:
      'Slots are deliberately few. Tell us why you need to walk through it and we will be in touch if a place opens.',
  },
  {
    key: 'support',
    label: 'Stand with it',
    detail:
      'Funding, partnership, hosting the next city, spreading the word. This door is open to everyone.',
  },
];

// Values must match the register API's ALLOWED_ROLES enum — free text gets
// discarded server-side and everyone collapses to 'supporter'.
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'policymaker', label: 'Policy / government / courts' },
  { value: 'funder', label: 'Funder / philanthropy' },
  { value: 'media', label: 'Media / journalist' },
  { value: 'practitioner', label: 'Youth justice practitioner' },
  { value: 'service_org', label: 'Service organisation' },
  { value: 'researcher', label: 'Researcher / academic' },
  { value: 'student', label: 'Student' },
  { value: 'lived_experience', label: 'Lived experience' },
  { value: 'advocate', label: 'Advocate' },
  { value: 'artist', label: 'Artist / creative' },
  { value: 'community', label: 'Community member' },
  { value: 'supporter', label: 'Supporter / other' },
];

const SUPPORT_KINDS = [
  'Funding or philanthropy',
  'Bring it to my city',
  'Partnership or programs',
  'Media or storytelling',
  'Spreading the word',
];

export function EoiContent() {
  const [door, setDoor] = useState<Door | null>(null);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/70">
          Tarndanya | Adelaide, Kaurna Country &middot; 23&ndash;26 June 2026
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-6xl">
          Most people will never get inside.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#F5F0E8]/85">
          One container. Three rooms. Thirty minutes, one person at a time, four days
          in public space on Kaurna Country. There are no tickets. Detention is easy
          to get into. The alternative should not be.
        </p>

        <div className="mt-12 space-y-4">
          {DOORS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDoor(d.key)}
              aria-pressed={door === d.key}
              className={`w-full border p-6 text-left transition-colors ${
                door === d.key
                  ? 'border-[#DC2626] bg-[#F5F0E8]/5'
                  : 'border-[#F5F0E8]/25 hover:border-[#F5F0E8]/60'
              }`}
            >
              <span className="font-display text-xl font-bold">{d.label}</span>
              <span className="mt-2 block text-sm leading-relaxed text-[#F5F0E8]/70">
                {d.detail}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-12">
          {door === 'nominate' && (
            <section aria-label="Nomination form">
              <NominateForm />
            </section>
          )}
          {door === 'eoi' && <RegisterDoorForm kind="eoi" />}
          {door === 'support' && <RegisterDoorForm kind="support" />}
        </div>
      </div>
    </main>
  );
}

function RegisterDoorForm({ kind }: { kind: 'eoi' | 'support' }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [why, setWhy] = useState('');
  const [supportKind, setSupportKind] = useState(SUPPORT_KINDS[0]);
  const [newsletter, setNewsletter] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEoi = kind === 'eoi';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (isEoi && why.trim().length < 10) {
      setError('Tell us why in at least a sentence.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/ghl/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          organization,
          role,
          how_heard: isEoi
            ? `EOI: ${why}`
            : `Stand with it: ${supportKind}${why ? ` — ${why}` : ''}${city ? ` (${city})` : ''}`,
          newsletter,
          event_name: EVENT_NAME,
          event_slug: EVENT_SLUG,
          state: 'SA',
          tags: isEoi ? ['experience:eoi'] : ['engagement:supporter'],
          turnstile_token: turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-[#059669] p-8">
        <h2 className="font-display text-2xl font-bold">Received.</h2>
        <p className="mt-3 text-[#F5F0E8]/85">
          {isEoi
            ? 'Your expression of interest is in. The slots are few and the triage is human; if a place opens for you, the invitation comes personally.'
            : 'You are standing with it. We will be in touch about how this lands in your world, and your city could be next.'}
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full border border-[#F5F0E8]/30 bg-transparent px-4 py-3 text-[#F5F0E8] placeholder:text-[#F5F0E8]/40 focus:border-[#F5F0E8] focus:outline-none';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label={isEoi ? 'Expression of interest form' : 'Support form'}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClass} placeholder="Full name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input className={inputClass} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} placeholder="Organisation" value={organization} onChange={(e) => setOrganization(e.target.value)} />
        <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Your role">
          <option value="" className="bg-[#0A0A0A]">
            Your role
          </option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value} className="bg-[#0A0A0A]">
              {r.label}
            </option>
          ))}
        </select>
      </div>
      {!isEoi && (
        <>
          <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <select className={inputClass} value={supportKind} onChange={(e) => setSupportKind(e.target.value)} aria-label="How do you want to stand with it?">
            {SUPPORT_KINDS.map((s) => (
              <option key={s} value={s} className="bg-[#0A0A0A]">
                {s}
              </option>
            ))}
          </select>
        </>
      )}
      <textarea
        className={`${inputClass} min-h-28`}
        placeholder={isEoi ? 'Why do you need to be inside? *' : 'Anything we should know?'}
        value={why}
        onChange={(e) => setWhy(e.target.value)}
      />
      <label className="flex items-center gap-3 text-sm text-[#F5F0E8]/70">
        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
        Keep me posted on CONTAINED (tour updates, no spam)
      </label>
      <TurnstileWidget onSuccess={setTurnstileToken} theme="dark" />
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !turnstileToken}
        className="bg-[#DC2626] px-8 py-4 font-display font-bold text-[#F5F0E8] disabled:opacity-50"
      >
        {submitting ? 'Sending…' : isEoi ? 'Send my EOI' : 'Stand with it'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export function ClaimProfile({
  orgSlug,
  orgName,
}: {
  orgSlug: string;
  orgName: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || state === 'done') return;
    setState('busy');
    try {
      const res = await fetch('/api/communities/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role_in_org: role,
          org_slug: orgSlug,
          org_name: orgName,
          hp,
        }),
      });
      const json = await res.json();
      setState(json.success ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div
        className="rounded-[22px] border p-7"
        style={{ background: 'rgba(5,150,105,0.06)', borderColor: '#cfe6d8' }}
      >
        <p
          className="mb-1 uppercase"
          style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: '#047857' }}
        >
          Claim received
        </p>
        <p className="text-[15px] leading-6" style={{ color: '#1f5c43' }}>
          Thank you. We have your details and someone from JusticeHub will be in
          touch to confirm with you directly. Nothing on the {orgName} profile
          changes until you approve it.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[22px] border border-[#eadfce] bg-[#fffaf3] p-7 shadow-[0_16px_40px_rgba(49,31,15,0.06)]"
    >
      <p
        className="mb-1 uppercase"
        style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: '#8d6a44' }}
      >
        Claim {orgName}
      </p>
      <p className="mb-5 text-[14px] leading-6 text-[#584b40]">
        Tell us who you are. We confirm by talking with you, not by an automated
        check.
      </p>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[#584b40]">
          Your name
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          aria-label="Your name"
          className="w-full rounded-md px-3 py-2.5 text-[15px] focus:outline-none"
          style={{ border: '1px solid #d8c6a8', color: '#2b2530', background: '#fff' }}
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[#584b40]">
          Your role in the organisation
        </span>
        <input
          type="text"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="For example: CEO, coordinator, board member"
          aria-label="Your role in the organisation"
          className="w-full rounded-md px-3 py-2.5 text-[15px] focus:outline-none"
          style={{ border: '1px solid #d8c6a8', color: '#2b2530', background: '#fff' }}
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[#584b40]">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@organisation.org"
          aria-label="Email address"
          className="w-full rounded-md px-3 py-2.5 text-[15px] focus:outline-none"
          style={{ border: '1px solid #d8c6a8', color: '#2b2530', background: '#fff' }}
        />
      </label>

      {/* Honeypot: visually hidden, bots fill it, handler discards. */}
      <input
        type="text"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      <button
        type="submit"
        disabled={state === 'busy'}
        className="w-full rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
        style={{ background: '#4a2560', color: '#f5ecdf' }}
      >
        {state === 'busy' ? 'Sending…' : 'Claim this profile'}
      </button>

      {state === 'error' && (
        <p className="mt-3 text-[13px]" style={{ color: '#b91c1c' }}>
          That did not save. Try again in a moment.
        </p>
      )}
    </form>
  );
}

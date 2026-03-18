'use client';

import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

const HELP_OPTIONS = [
  { id: 'host', label: 'Host the container in my region' },
  { id: 'fund', label: 'Fund a tour stop' },
  { id: 'young-people', label: 'I know young people who should help design Room 1' },
  { id: 'community-org', label: 'I know a community org for Room 3' },
  { id: 'spread', label: 'Spread the word' },
  { id: 'partner', label: 'Partnership' },
  { id: 'other', label: 'Something else' },
];

export default function ContainedHelpPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleOption(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !email) {
      setError('Please enter your name and email.');
      return;
    }
    if (selected.length === 0) {
      setError('Please select at least one way you want to help.');
      return;
    }

    setSubmitting(true);
    try {
      const helpLabels = selected.map(id => HELP_OPTIONS.find(o => o.id === id)?.label).join(', ');
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: '',
          organization: '',
          category: 'contained-help',
          subject: `[CONTAINED] ${helpLabels}`,
          message: `How I want to help: ${helpLabels}\n\nLocation: ${location || 'Not specified'}\n\n${message}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send. Try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          <CheckCircle style={{ width: 64, height: 64, color: '#059669', margin: '0 auto 24px' }} />
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: '#F5F0E8', marginBottom: 16 }}>We got you.</h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: '#F5F0E8', opacity: 0.7, lineHeight: 1.7, marginBottom: 32 }}>
            Thanks {name}. We will be in touch soon. This means a lot.
          </p>
          <a href="/contained/tour" style={{ display: 'inline-block', background: '#DC2626', color: '#FFF', padding: '14px 36px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', textDecoration: 'none', fontFamily: "'IBM Plex Mono', monospace" }}>
            Back to the Tour
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>
      {/* Header */}
      <div style={{ background: '#0A0A0A', borderBottom: '4px solid #DC2626', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F5F0E8', opacity: 0.5, letterSpacing: '0.3em', textTransform: 'uppercase' as const, marginBottom: 16 }}>
          JusticeHub · CONTAINED
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: '#F5F0E8', lineHeight: 1.15, marginBottom: 12 }}>
          I want to help.
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: '#F5F0E8', opacity: 0.6, maxWidth: 500, margin: '0 auto' }}>
          Tell us how. Pick as many as you like.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        {/* Help options */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '0.2em', display: 'block', marginBottom: 16 }}>
            How do you want to help?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HELP_OPTIONS.map(opt => {
              const active = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  style={{
                    background: active ? '#DC2626' : '#141414',
                    border: `2px solid ${active ? '#DC2626' : '#2a2a2a'}`,
                    color: active ? '#FFF' : '#F5F0E8',
                    padding: '14px 20px',
                    fontSize: 14,
                    fontFamily: "'IBM Plex Mono', monospace",
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {active ? '✓ ' : ''}{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F5F0E8', opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Your name"
              style={{ width: '100%', background: '#141414', border: '2px solid #2a2a2a', color: '#F5F0E8', padding: '12px 16px', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F5F0E8', opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{ width: '100%', background: '#141414', border: '2px solid #2a2a2a', color: '#F5F0E8', padding: '12px 16px', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F5F0E8', opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="City, State"
            style={{ width: '100%', background: '#141414', border: '2px solid #2a2a2a', color: '#F5F0E8', padding: '12px 16px', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box' }}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F5F0E8', opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>
            Tell us more
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Anything else we should know..."
            style={{ width: '100%', background: '#141414', border: '2px solid #2a2a2a', color: '#F5F0E8', padding: '12px 16px', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#DC2626', color: '#FFF', padding: '12px 16px', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            background: '#DC2626',
            border: 'none',
            color: '#FFF',
            padding: '16px 36px',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.15em',
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {submitting ? 'Sending...' : <><Send style={{ width: 16, height: 16 }} /> Send It</>}
        </button>
      </form>
    </div>
  );
}

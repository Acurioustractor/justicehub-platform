'use client';

import { useState } from 'react';

const PASSCODE = 'contained2026';

export default function MomentumPage() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!authed) {
    return (
      <div style={{ background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>CONTAINED</h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#666', marginBottom: 32 }}>Momentum Report — March 2026</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input === PASSCODE) { setAuthed(true); setError(false); } else { setError(true); } }}>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="Enter passcode"
              autoFocus
              style={{ background: '#1a1a1a', border: error ? '1px solid #DC2626' : '1px solid #333', color: '#F5F0E8', padding: '12px 16px', fontSize: '1rem', width: '100%', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
            />
            {error && <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Incorrect passcode</p>}
            <button type="submit" style={{ marginTop: 16, background: '#F5F0E8', color: '#0A0A0A', padding: '12px 32px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', width: '100%' }}>
              View Report
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0A0A0A', color: '#F5F0E8', fontFamily: "'Space Grotesk', sans-serif" }}>
      <iframe
        src="/contained-momentum.html"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="CONTAINED Momentum Report"
      />
    </div>
  );
}

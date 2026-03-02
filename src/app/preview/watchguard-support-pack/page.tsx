'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/lib/hooks/use-preview-auth';

export default function WatchGuardSupportPackPreviewPage() {
  const { isAuthenticated, isLoading, password, setPassword, error, handleSubmit } = usePreviewAuth();
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">WatchGuard Support Pack</h1>
            <p className="text-gray-400">Emergency rights and legal services pack</p>
            <p className="text-gray-500 text-sm mt-2">This mockup is password protected</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-red-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-red-600 transition-colors">
              View Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  const rights = [
    { text: 'You must provide your name and address', detail: 'if police suspect you of a crime. You do not have to answer other questions.' },
    { text: 'You can film the interaction.', detail: 'It is legal to record police in a public place in NSW.' },
    { text: 'Ask if you are under arrest.', detail: 'If not, you are free to leave. Ask: "Am I free to go?"' },
    { text: 'You can request a lawyer', detail: 'before answering any questions at a police station. Call ALS: 1800 765 767' },
  ];

  const services = [
    { name: 'Aboriginal Legal Service \u2014 Redfern', dist: '0.8 km', hours: 'Open until 5:00 PM', phone: '1800 765 767', phoneHref: 'tel:1800765767' },
    { name: 'Legal Aid NSW \u2014 Surry Hills', dist: '1.4 km', hours: 'Open until 5:30 PM', phone: '1300 888 529', phoneHref: 'tel:1300888529' },
    { name: 'Redfern Legal Centre', dist: '1.1 km', hours: 'After hours: voicemail', phone: '02 9698 9777', phoneHref: 'tel:0296989777' },
  ];

  const checklist = [
    { bold: 'Write down officer details', rest: ' \u2014 badge numbers, names, vehicle registration, time and location' },
    { bold: 'Save any video or photos', rest: ' \u2014 back up to cloud storage immediately' },
    { bold: 'Write your account', rest: ' while it is fresh \u2014 what happened, what was said, who was present' },
    { bold: 'Request the incident report', rest: ' from the police station within 48 hours' },
    { bold: 'Contact a lawyer', rest: ' before making any formal statement' },
  ];

  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box', background: '#1a1a2e', color: '#e0e0e0', fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh' }}>
      {/* Back link */}
      <div style={{ position: 'fixed', top: 12, right: 20, zIndex: 1000 }}>
        <Link href="/preview" style={{ color: '#8a8aa0', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to Previews
        </Link>
      </div>

      {/* Header */}
      <header style={{ background: '#16213e', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #e74c3c' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Justice<span style={{ color: '#e2725b' }}>Hub</span></div>
        <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase' }}>CopWatch Alert</span>
      </header>

      {/* Container */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
        {/* Alert Box */}
        <div style={{ background: 'linear-gradient(135deg, #3d1a1a, #1a1a2e)', border: '2px solid #e74c3c', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>Support Pack for Keisha&apos;s Alert</h2>
          <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>Triggered 12 minutes ago - 6:47 PM</div>

          {/* Mini Map */}
          <div style={{ width: '100%', height: 140, background: '#0f0f23', borderRadius: 8, position: 'relative', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, #1a2a3e 28px, #1a2a3e 29px), repeating-linear-gradient(90deg, transparent, transparent 40px, #1a2a3e 40px, #1a2a3e 41px)',
            }} />
            <div style={{
              position: 'absolute', left: '50%', top: '45%', width: 16, height: 16,
              background: '#e74c3c', borderRadius: '50%', border: '3px solid #fff',
              transform: 'translate(-50%, -50%)', boxShadow: '0 0 20px rgba(231,76,60,.5)',
            }} />
          </div>
          <div style={{ fontSize: 13, color: '#8a8aa0' }}>Near Redfern Station, NSW 2016</div>
        </div>

        {/* Know Your Rights */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>&#9878;</span> Know Your Rights: NSW Police Stop
          </h3>
          {rights.map((r, i) => (
            <div key={i} style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 16, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ background: '#e2725b', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                <strong style={{ color: '#fff' }}>{r.text}</strong> {r.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Nearest Legal Services */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>&#128222;</span> Nearest Legal Services
          </h3>
          {services.map((s) => (
            <div key={s.name} style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                <span style={{ color: '#e2725b' }}>{s.dist}</span>
                <span style={{ color: '#52b788' }}>{s.hours}</span>
              </div>
              <a href={s.phoneHref} style={{ display: 'inline-block', background: '#e2725b', color: '#fff', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600, marginTop: 10 }}>
                Call {s.phone}
              </a>
            </div>
          ))}
        </div>

        {/* What To Do Next */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>&#9745;</span> What To Do Next
          </h3>
          {checklist.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < checklist.length - 1 ? '1px solid #2a2a4a' : 'none' }}>
              <div
                onClick={() => toggleCheck(i)}
                style={{
                  width: 22, height: 22, border: checkedItems[i] ? 'none' : '2px solid #3a3a5a',
                  borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: checkedItems[i] ? '#52b788' : 'transparent',
                  color: '#fff', fontSize: 14, transition: 'all .2s',
                }}
              >
                {checkedItems[i] ? '\u2713' : ''}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                <strong style={{ color: '#fff' }}>{c.bold}</strong>{c.rest}
              </div>
            </div>
          ))}
          <a href="#" style={{ display: 'block', textAlign: 'center', background: 'transparent', border: '1px solid #9b59b6', color: '#9b59b6', padding: 14, borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14, marginTop: 16 }}>
            File a Complaint via Hear Me Out
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#3a3a5a' }}>
          This Support Pack expires in 30 days. <a href="#" style={{ color: '#9b59b6' }}>Save to Empathy Ledger</a>
        </div>
      </div>
    </div>
  );
}

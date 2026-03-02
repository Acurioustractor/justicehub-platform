'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/lib/hooks/use-preview-auth';

export default function PledgeMapPreviewPage() {
  const { isAuthenticated, isLoading, password, setPassword, error, handleSubmit } = usePreviewAuth();

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
            <Lock className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">Pledge Map</h1>
            <p className="text-gray-400">AFR pledge density by federal electorate</p>
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
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-emerald-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-emerald-600 transition-colors">
              View Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  const electorateColors: Record<string, string> = {
    e1: '#1a3a2e',
    e2: '#2d6a4f',
    e3: '#40916c',
    e4: '#52b788',
    e5: '#74c69d',
  };

  const gridRows = [
    [
      { name: '', cls: 'e1' }, { name: 'Grayndler', cls: 'e2' }, { name: 'Sydney', cls: 'e4', highlight: true }, { name: 'Wentworth', cls: 'e3' }, { name: '', cls: 'e1' }, { name: 'Barton', cls: 'e2' },
    ],
    [
      { name: 'Reid', cls: 'e2' }, { name: 'Watson', cls: 'e3' }, { name: 'Blaxland', cls: 'e5' }, { name: 'Banks', cls: 'e3' }, { name: 'Cook', cls: 'e2' }, { name: '', cls: 'e1' },
    ],
    [
      { name: '', cls: 'e1' }, { name: 'Fowler', cls: 'e4' }, { name: 'McMahon', cls: 'e3' }, { name: 'Werriwa', cls: 'e2' }, { name: 'Hughes', cls: 'e1' }, { name: '', cls: 'e1' },
    ],
    [
      { name: 'Parramatta', cls: 'e2' }, { name: 'Mitchell', cls: 'e3' }, { name: 'Bradfield', cls: 'e1' }, { name: 'Bennelong', cls: 'e2' }, { name: '', cls: 'e1' }, { name: '', cls: 'e1' },
    ],
    [
      { name: '', cls: 'e1' }, { name: 'Mackellar', cls: 'e1' }, { name: 'Warringah', cls: 'e2' }, { name: 'N. Sydney', cls: 'e1' }, { name: 'Kingsford', cls: 'e3' }, { name: '', cls: 'e1' },
    ],
  ];

  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box', background: '#1a1a2e', color: '#e0e0e0', fontFamily: "'Segoe UI', system-ui, sans-serif", height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Back link */}
      <div style={{ position: 'fixed', top: 12, right: 20, zIndex: 1000 }}>
        <Link href="/preview" style={{ color: '#8a8aa0', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to Previews
        </Link>
      </div>

      {/* Header */}
      <header style={{ background: '#16213e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e2725b' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Justice<span style={{ color: '#e2725b' }}>Hub</span></div>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', background: '#0f0f23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Title Bar */}
          <div style={{ position: 'absolute', left: 20, top: 20, background: '#16213e', padding: '16px 20px', borderRadius: 8, border: '1px solid #2a2a4a' }}>
            <h2 style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>Alternative First Responders Pledge Map</h2>
            <p style={{ fontSize: 12, color: '#8a8aa0' }}>151 federal electorates - 4,872 pledges nationally</p>
          </div>

          {/* Map Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, width: '60%', maxWidth: 480 }}>
            {gridRows.flat().map((e, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 4,
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: 'rgba(255,255,255,.6)',
                  cursor: 'pointer',
                  background: electorateColors[e.cls],
                  border: e.highlight ? '2px solid #fff' : 'none',
                  transition: 'transform .2s',
                }}
              >
                {e.name}
              </div>
            ))}
          </div>

          {/* Panel */}
          <div style={{ position: 'absolute', right: 20, top: 20, width: 360, background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 2 }}>Sydney</h2>
            <div style={{ color: '#52b788', fontSize: 14, marginBottom: 20 }}>Tanya Plibersek (ALP) - MP since 1998</div>
            <div style={{ textAlign: 'center', padding: 20, background: 'rgba(82,183,136,.1)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#52b788' }}>342</div>
              <div style={{ fontSize: 13, color: '#8a8aa0', marginTop: 4 }}>pledges for alternative first responders</div>
            </div>
            <h3 style={{ fontSize: 14, marginBottom: 12, color: '#fff' }}>Take the Pledge</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8a8aa0', marginBottom: 4 }}>Name</label>
              <input placeholder="Your name" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #2a2a4a', background: '#1a1a2e', color: '#fff', fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8a8aa0', marginBottom: 4 }}>Email</label>
              <input placeholder="your@email.com" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #2a2a4a', background: '#1a1a2e', color: '#fff', fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8a8aa0', marginBottom: 4 }}>Postcode</label>
              <input placeholder="2000" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #2a2a4a', background: '#1a1a2e', color: '#fff', fontSize: 14 }} />
            </div>
            <button style={{ display: 'block', width: '100%', textAlign: 'center', background: '#52b788', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 16 }}>
              Sign the Pledge
            </button>
            <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #1a3a2e, #0f0f23)', border: '1px solid #2d6a4f', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#52b788' }}>342</div>
              <div style={{ fontSize: 13, color: '#c8c8e0', margin: '8px 0' }}>people in Sydney want alternative first responders</div>
              <a href="#" style={{ display: 'inline-block', background: 'transparent', border: '1px solid #52b788', color: '#52b788', padding: '8px 20px', borderRadius: 6, fontSize: 12, textDecoration: 'none', marginTop: 8 }}>Share Your Electorate</a>
            </div>
          </div>

          {/* Legend */}
          <div style={{ position: 'absolute', left: 20, bottom: 20, background: '#16213e', padding: 16, borderRadius: 8, border: '1px solid #2a2a4a' }}>
            <h4 style={{ fontSize: 11, color: '#8a8aa0', marginBottom: 8 }}>Pledge Density</h4>
            {[
              { color: '#74c69d', label: '200+ pledges' },
              { color: '#52b788', label: '51-200' },
              { color: '#40916c', label: '11-50' },
              { color: '#2d6a4f', label: '1-10' },
              { color: '#1a3a2e', label: '0' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12 }}>
                <div style={{ width: 16, height: 12, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

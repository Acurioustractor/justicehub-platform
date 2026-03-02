'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/lib/hooks/use-preview-auth';

export default function ComplaintPathfinderPreviewPage() {
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
            <Lock className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">Complaint Pathfinder</h1>
            <p className="text-gray-400">Smart complaint routing in Service Finder</p>
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
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-blue-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-600 transition-colors">
              View Preview
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box', background: '#1a1a2e', color: '#e0e0e0', fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh' }}>
      {/* Back link */}
      <div style={{ position: 'fixed', top: 12, right: 20, zIndex: 1000 }}>
        <Link href="/preview" style={{ color: '#8a8aa0', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to Previews
        </Link>
      </div>

      {/* Header */}
      <header style={{ background: '#16213e', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e2725b' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Justice<span style={{ color: '#e2725b' }}>Hub</span></div>
        <nav>
          <a href="#" style={{ color: '#8a8aa0', textDecoration: 'none', marginLeft: 24, fontSize: 14 }}>Service Finder</a>
          <a href="#" style={{ color: '#8a8aa0', textDecoration: 'none', marginLeft: 24, fontSize: 14 }}>Community Map</a>
          <a href="#" style={{ color: '#8a8aa0', textDecoration: 'none', marginLeft: 24, fontSize: 14 }}>Stories</a>
        </nav>
      </header>

      {/* Container */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input defaultValue="police misconduct" readOnly style={{ flex: 1, padding: '14px 20px', borderRadius: 8, border: '1px solid #2a2a4a', background: '#16213e', color: '#fff', fontSize: 16 }} />
          <button style={{ padding: '14px 28px', background: '#e2725b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Search</button>
        </div>

        <div style={{ fontSize: 13, color: '#8a8aa0', marginBottom: 16 }}>
          Showing results for &quot;police misconduct&quot; in NSW &mdash; 8 services found
        </div>

        {/* Complaint Card */}
        <div style={{ background: 'linear-gradient(135deg, #2d1b4e, #1a1a2e)', border: '2px solid #9b59b6', borderRadius: 12, padding: 24, marginBottom: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#9b59b6', borderRadius: '4px 0 0 4px' }} />
          <span style={{ display: 'inline-block', background: '#9b59b6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>You May Have a Complaint</span>
          <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 6 }}>Law Enforcement Conduct Commission (LECC)</h2>
          <div style={{ color: '#c0a0d8', fontSize: 14, marginBottom: 16 }}>Independent oversight body for NSW Police misconduct complaints</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Jurisdiction', value: 'New South Wales' },
              { label: 'Estimated Timeline', value: '6 - 8 weeks' },
              { label: 'Cost', value: 'Free' },
              { label: 'Investigation Rate', value: '34% investigated further' },
            ].map((m) => (
              <div key={m.label} style={{ background: 'rgba(155,89,182,.1)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                <div style={{ fontSize: 15, color: '#fff', marginTop: 4 }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(155,89,182,.08)', padding: 14, borderRadius: 8, marginBottom: 18, fontSize: 14, lineHeight: 1.6, color: '#c8c8e0' }}>
            <strong>Process:</strong> Submit a written complaint online or by post. LECC will assess and may investigate, refer to NSW Police for local management, or monitor the police investigation. You can remain anonymous. An Aboriginal liaison officer is available on request.
          </div>

          <a href="#" style={{ display: 'inline-block', background: '#9b59b6', color: '#fff', padding: '14px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
            Start Your Complaint on Hear Me Out
          </a>
          <a href="#" style={{ background: 'transparent', border: '1px solid #9b59b6', color: '#9b59b6', padding: '14px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14, marginLeft: 12 }}>
            Learn More
          </a>
        </div>

        {/* Service Cards */}
        {[
          { name: 'Aboriginal Legal Service \u2014 Redfern', type: 'Legal Aid \u00B7 Free', desc: 'Criminal law, police complaints, custody notifications', dist: '1.2 km', phone: '1800 765 767' },
          { name: 'Legal Aid NSW \u2014 Central Sydney', type: 'Legal Aid \u00B7 Means-tested', desc: 'Police complaints, civil rights, criminal defence', dist: '2.8 km', phone: '1300 888 529' },
          { name: 'Community Legal Centres NSW', type: 'Advocacy \u00B7 Free', desc: 'Strategic litigation, complaint support, rights training', dist: 'Online', phone: '02 9212 7333' },
        ].map((s) => (
          <div key={s.name} style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10, padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>{s.name}</h3>
              <div style={{ fontSize: 12, color: '#e2725b', marginBottom: 6 }}>{s.type}</div>
              <div style={{ fontSize: 13, color: '#8a8aa0' }}>{s.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#5a5a7a' }}>{s.dist}</div>
              <div style={{ fontSize: 13, color: '#e2725b' }}>{s.phone}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

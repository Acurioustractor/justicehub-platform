'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { usePreviewAuth } from '@/lib/hooks/use-preview-auth';

export default function SignalEnginePreviewPage() {
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
            <Lock className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h1 className="text-3xl font-bold mb-2 text-white">Signal Engine</h1>
            <p className="text-gray-400">Data-driven content and community widget</p>
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
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-amber-500 focus:outline-none text-white rounded-lg"
                placeholder="Enter password"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-amber-600 transition-colors">
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
        <span style={{ background: '#f39c12', color: '#1a1a2e', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4 }}>Signal Engine Admin</span>
      </header>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 'calc(100vh - 60px)' }}>
        {/* Left - Queue */}
        <div style={{ padding: 32, borderRight: '1px solid #2a2a4a' }}>
          <h2 style={{ fontSize: 18, color: '#fff', marginBottom: 4 }}>Content Approval Queue</h2>
          <div style={{ fontSize: 13, color: '#8a8aa0', marginBottom: 24 }}>3 items pending review - Auto-generated from data thresholds</div>

          {/* Queue Item 1 - Featured */}
          <div style={{ background: '#16213e', border: '1px solid #f39c12', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600, background: 'rgba(243,156,18,.15)', color: '#f39c12' }}>Pending Review</span>
              <span style={{ fontSize: 11, color: '#8a8aa0' }}>2 hours ago</span>
            </div>
            <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 6 }}>Racism in Canterbury-Bankstown Schools Up 45%</h3>
            <div style={{ fontSize: 12, color: '#8a8aa0', marginBottom: 12 }}>Trigger: Call It Out quarterly threshold - Region: Canterbury-Bankstown SA3</div>
            <div style={{ fontSize: 13, color: '#c8c8e0', lineHeight: 1.5, marginBottom: 16, background: 'rgba(255,255,255,.03)', padding: 12, borderRadius: 8 }}>
              Call It Out data shows a <span style={{ color: '#e74c3c', fontWeight: 700 }}>45% increase</span> in racism reports from Canterbury-Bankstown schools this quarter, with 28 new reports &mdash; 19 in education settings. Three in four reports cite teachers or administrators as the source. The suburb has only 2 active advocacy services for a population of 370,000.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['Data Story', 'Instagram Carousel', 'WhatsApp Card', 'Email Segment'].map((f) => (
                <span key={f} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, background: '#2a2a4a', color: '#8a8aa0' }}>{f}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: '#52b788', color: '#fff' }}>Approve All</button>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #8a8aa0', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#8a8aa0' }}>Edit</button>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #e74c3c', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#e74c3c' }}>Reject</button>
            </div>
          </div>

          {/* Queue Item 2 - Approved */}
          <div style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600, background: 'rgba(82,183,136,.15)', color: '#52b788' }}>Approved</span>
              <span style={{ fontSize: 11, color: '#8a8aa0' }}>Yesterday</span>
            </div>
            <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 6 }}>Sydney Electorate Crosses 300 Pledges</h3>
            <div style={{ fontSize: 12, color: '#8a8aa0', marginBottom: 12 }}>Trigger: AFR pledge milestone - Electorate: Sydney</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Social Card', 'Email'].map((f) => (
                <span key={f} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, background: '#2a2a4a', color: '#8a8aa0' }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Queue Item 3 - Pending */}
          <div style={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600, background: 'rgba(243,156,18,.15)', color: '#f39c12' }}>Pending Review</span>
              <span style={{ fontSize: 11, color: '#8a8aa0' }}>6 hours ago</span>
            </div>
            <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 6 }}>CopWatch Alerts Spike in Redfern: 14 in 7 Days</h3>
            <div style={{ fontSize: 12, color: '#8a8aa0', marginBottom: 12 }}>Trigger: CopWatch weekly threshold - Region: Redfern-Waterloo SA3</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['Data Story', 'Video Script'].map((f) => (
                <span key={f} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, background: '#2a2a4a', color: '#8a8aa0' }}>{f}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: '#52b788', color: '#fff' }}>Approve All</button>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #8a8aa0', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#8a8aa0' }}>Edit</button>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #e74c3c', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#e74c3c' }}>Reject</button>
            </div>
          </div>
        </div>

        {/* Right - Widget Preview */}
        <div style={{ padding: 32, background: '#0f0f23' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 11, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: 1 }}>Embeddable Widget Preview</span>
          </div>
          <div style={{ background: '#16213e', borderRadius: 16, padding: 32, maxWidth: 380, margin: '0 auto' }}>
            <div style={{ fontSize: 20, color: '#fff', textAlign: 'center', marginBottom: 4, fontWeight: 700 }}>Check Your Area</div>
            <div style={{ fontSize: 13, color: '#8a8aa0', textAlign: 'center', marginBottom: 24 }}>See what&apos;s happening in your community</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input defaultValue="2200" readOnly style={{ flex: 1, padding: 14, borderRadius: 8, border: '1px solid #2a2a4a', background: '#1a1a2e', color: '#fff', fontSize: 16, textAlign: 'center', letterSpacing: 4 }} />
              <button style={{ padding: '14px 20px', background: '#e2725b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Go</button>
            </div>

            <div style={{ borderTop: '1px solid #2a2a4a', paddingTop: 20 }}>
              <div style={{ fontSize: 16, color: '#fff', fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>Bankstown, NSW</div>

              {[
                { label: 'Racism reports (this quarter)', value: '28', trend: '+45%' },
                { label: 'Top system type', value: 'Education (68%)', trend: null },
                { label: 'AFR pledges (electorate)', value: '89', trend: null },
                { label: 'CopWatch alerts (30 days)', value: '6', trend: null },
              ].map((s, i, arr) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #2a2a4a' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#8a8aa0' }}>{s.label}</span>
                  <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
                    {s.value} {s.trend && <span style={{ color: '#e74c3c', fontSize: 12 }}>{s.trend}</span>}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 12, color: '#8a8aa0', textTransform: 'uppercase', marginBottom: 10 }}>Nearest Support</h4>
                {[
                  { name: 'Legal Aid NSW \u2014 Bankstown', info: '2.1 km \u00B7 1300 888 529' },
                  { name: 'Bankstown Community Legal Centre', info: '3.4 km \u00B7 02 9796 1066' },
                  { name: 'Anti-Discrimination NSW', info: 'Online \u00B7 1800 670 812' },
                ].map((ws) => (
                  <div key={ws.name} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <div style={{ fontSize: 13, color: '#fff' }}>{ws.name}</div>
                    <div style={{ fontSize: 11, color: '#e2725b' }}>{ws.info}</div>
                  </div>
                ))}
              </div>

              <button style={{ display: 'block', width: '100%', textAlign: 'center', background: '#e2725b', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
                Share This With Your Community
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#3a3a5a' }}>
            Embed on any website: &lt;script src=&quot;justicehub.org.au/widget.js&quot;&gt;&lt;/script&gt;
          </div>
        </div>
      </div>
    </div>
  );
}
